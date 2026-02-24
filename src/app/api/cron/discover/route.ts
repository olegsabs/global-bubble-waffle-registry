import { NextRequest, NextResponse } from "next/server";

import {
  ingestAgentDiscoveries,
  isAgentRateAllowed,
  completeAgentRun,
  startAgentRun
} from "@/domain/agents/repository";
import { requireAdmin } from "@/lib/api/admin-auth";
import { getServerEnv } from "@/lib/env";
import { discoverShopsInCity, TARGET_CITIES } from "@/lib/geo/google-places";
import type { CityTarget } from "@/lib/geo/google-places";
import { jsonError } from "@/lib/http";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 300;

const CITIES_PER_BATCH = 5;
const DELAY_BETWEEN_CITIES_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type AgentAccess =
  | { ok: true; actor: string }
  | { ok: false; status: number; error: string };

async function requireAgentAccess(request: NextRequest): Promise<AgentAccess> {
  const env = getServerEnv();
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.replace("Bearer ", "").trim()
    : null;

  if (env.CRON_SECRET && bearerToken && bearerToken === env.CRON_SECRET) {
    return { ok: true, actor: "cron_secret" };
  }

  const admin = await requireAdmin(request);

  if (!admin.ok) {
    return { ok: false, status: admin.status, error: admin.error };
  }

  return {
    ok: true,
    actor:
      admin.actor === "supabase_user"
        ? `supabase_user:${admin.userId ?? "unknown"}`
        : "admin_api_key"
  };
}

function selectCitiesBatch(searchParams: URLSearchParams): CityTarget[] {
  const citiesParam = searchParams.get("cities");
  if (citiesParam) {
    const names = citiesParam.split(",").map((s) => s.trim().toLowerCase());
    return TARGET_CITIES.filter((c) =>
      names.includes(c.city.toLowerCase())
    );
  }

  const offsetParam = searchParams.get("offset");
  const limitParam = searchParams.get("limit");
  const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10) || 0) : null;
  const limit = limitParam
    ? Math.min(30, Math.max(1, parseInt(limitParam, 10) || CITIES_PER_BATCH))
    : CITIES_PER_BATCH;

  if (offset !== null) {
    return TARGET_CITIES.slice(offset, offset + limit);
  }

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const batchIndex = dayOfYear % Math.ceil(TARGET_CITIES.length / limit);
  const start = batchIndex * limit;
  return TARGET_CITIES.slice(start, start + limit);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const access = await requireAgentAccess(request);

  if (!access.ok) {
    return jsonError(access.error, access.status);
  }

  const env = getServerEnv();

  if (!env.GOOGLE_PLACES_API_KEY) {
    return jsonError("GOOGLE_PLACES_API_KEY is not configured.", 500);
  }

  const allowed = await isAgentRateAllowed(
    "discovery",
    env.AGENT_RATE_LIMIT_PER_MINUTE ?? 60,
    60
  );

  if (!allowed) {
    return jsonError("Discovery agent rate limit exceeded.", 429);
  }

  const cities = selectCitiesBatch(request.nextUrl.searchParams);

  if (cities.length === 0) {
    return NextResponse.json({ ok: true, message: "No cities to process." });
  }

  const now = new Date();
  const timeSlot = `${now.toISOString().slice(0, 13)}`;
  const runKey = `discovery-cron:${timeSlot}:${cities.map((c) => c.city.toLowerCase().replace(/\s+/g, "-")).join("+")}`;

  const started = await startAgentRun({
    agentType: "discovery",
    runKey,
    inputPayload: {
      source: "google-places",
      cities: cities.map((c) => c.city),
      batch_size: cities.length
    },
    createdBy: access.actor
  });

  if (!started.created) {
    return NextResponse.json({
      ok: true,
      idempotent: true,
      run_id: started.run.id,
      status: started.run.status,
      result: started.run.resultPayload
    });
  }

  const runId = started.run.id;
  const cityResults: Array<{
    city: string;
    country: string;
    found: number;
    inserted: number;
    duplicates: number;
    error?: string;
  }> = [];

  let totalInserted = 0;
  let totalProcessed = 0;
  let totalDuplicates = 0;

  try {
    for (let i = 0; i < cities.length; i++) {
      const target = cities[i];

      try {
        const records = await discoverShopsInCity(
          env.GOOGLE_PLACES_API_KEY,
          target
        );

        if (records.length === 0) {
          cityResults.push({
            city: target.city,
            country: target.country,
            found: 0,
            inserted: 0,
            duplicates: 0
          });
          continue;
        }

        const summary = await ingestAgentDiscoveries({
          runId,
          source: "google-places",
          records
        });

        totalProcessed += summary.processed;
        totalInserted += summary.inserted;
        totalDuplicates += summary.duplicates;

        cityResults.push({
          city: target.city,
          country: target.country,
          found: records.length,
          inserted: summary.inserted,
          duplicates: summary.duplicates
        });

        logger.info("Discovery completed for city", {
          runId,
          city: target.city,
          country: target.country,
          found: records.length,
          inserted: summary.inserted,
          duplicates: summary.duplicates
        });
      } catch (cityError) {
        const message =
          cityError instanceof Error ? cityError.message : String(cityError);

        cityResults.push({
          city: target.city,
          country: target.country,
          found: 0,
          inserted: 0,
          duplicates: 0,
          error: message
        });

        logger.error("Discovery failed for city", {
          runId,
          city: target.city,
          error: message
        });
      }

      if (i < cities.length - 1) {
        await sleep(DELAY_BETWEEN_CITIES_MS);
      }
    }

    const hasErrors = cityResults.some((r) => r.error);
    const status = hasErrors ? "partial" : "succeeded";

    const resultPayload = {
      cities_processed: cities.length,
      total_found: cityResults.reduce((sum, r) => sum + r.found, 0),
      total_inserted: totalInserted,
      total_duplicates: totalDuplicates,
      cities: cityResults
    };

    await completeAgentRun({
      runId,
      status,
      resultPayload,
      processedCount: totalProcessed,
      insertedCount: totalInserted,
      updatedCount: 0
    });

    logger.info("Discovery cron run completed", {
      runId,
      status,
      citiesProcessed: cities.length,
      totalInserted,
      totalDuplicates
    });

    return NextResponse.json({
      ok: true,
      run_id: runId,
      status,
      ...resultPayload
    });
  } catch (error) {
    try {
      await completeAgentRun({
        runId,
        status: "failed",
        resultPayload: { cities: cityResults },
        processedCount: totalProcessed,
        insertedCount: totalInserted,
        updatedCount: 0,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
    } catch (completionError) {
      logger.error("Failed to mark discovery cron run as failed", {
        runId,
        error:
          completionError instanceof Error
            ? completionError.message
            : String(completionError)
      });
    }

    logger.error("GET /api/cron/discover failed", {
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonError("Discovery cron failed.", 500);
  }
}
