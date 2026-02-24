import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  completeAgentRun,
  getAgentRunByKey,
  isAgentRateAllowed,
  promotePendingDiscoveries,
  startAgentRun
} from "@/domain/agents/repository";
import { parseAgentPromoteQuery } from "@/domain/agents/schemas";
import { requireAdmin } from "@/lib/api/admin-auth";
import { getServerEnv } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { logger } from "@/lib/logger";

const IDEMPOTENCY_KEY_PATTERN = /^[a-zA-Z0-9:_\-.]+$/;

export const runtime = "nodejs";

type AgentAccess =
  | { ok: true; actor: string }
  | { ok: false; status: number; error: string };

function resolveRunKey(headerKey: string | null, queryKey: string | null): string | null {
  const candidate = (headerKey ?? queryKey ?? "").trim();

  if (candidate.length === 0) {
    return null;
  }

  if (candidate.length < 8 || candidate.length > 200 || !IDEMPOTENCY_KEY_PATTERN.test(candidate)) {
    throw new Error("Invalid idempotency key format.");
  }

  return candidate;
}

async function requireAgentAccess(request: NextRequest): Promise<AgentAccess> {
  const env = getServerEnv();
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.replace("Bearer ", "").trim() : null;

  if (env.CRON_SECRET && bearerToken && bearerToken === env.CRON_SECRET) {
    return {
      ok: true,
      actor: "cron_secret"
    };
  }

  const admin = await requireAdmin(request);

  if (!admin.ok) {
    return {
      ok: false,
      status: admin.status,
      error: admin.error
    };
  }

  return {
    ok: true,
    actor: admin.actor === "supabase_user" ? `supabase_user:${admin.userId ?? "unknown"}` : "admin_api_key"
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const access = await requireAgentAccess(request);

  if (!access.ok) {
    return jsonError(access.error, access.status);
  }

  let runId: string | null = null;

  try {
    const env = getServerEnv();
    const parsedQuery = parseAgentPromoteQuery(request.nextUrl.searchParams, {
      limit: env.AGENT_PROMOTION_BATCH_SIZE,
      minConfidence: env.AGENT_PROMOTION_MIN_CONFIDENCE
    });
    const runKey = resolveRunKey(request.headers.get("x-idempotency-key"), parsedQuery.run_key);

    if (runKey) {
      const existingRun = await getAgentRunByKey(runKey);

      if (existingRun) {
        return NextResponse.json({
          ok: true,
          idempotent: true,
          run_id: existingRun.id,
          status: existingRun.status,
          result: existingRun.resultPayload
        });
      }
    }

    const allowed = await isAgentRateAllowed("promotion", env.AGENT_RATE_LIMIT_PER_MINUTE ?? 60, 60);

    if (!allowed) {
      return jsonError("Promotion agent rate limit exceeded. Retry in about a minute.", 429);
    }

    const started = await startAgentRun({
      agentType: "promotion",
      runKey,
      inputPayload: {
        source: parsedQuery.source,
        notes: parsedQuery.notes,
        limit: parsedQuery.limit,
        min_confidence: parsedQuery.min_confidence,
        dry_run: parsedQuery.dry_run
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

    runId = started.run.id;

    const summary = await promotePendingDiscoveries({
      runId,
      limit: parsedQuery.limit,
      minConfidence: parsedQuery.min_confidence,
      dryRun: parsedQuery.dry_run
    });

    const status = summary.failed > 0 ? "partial" : "succeeded";
    const resultPayload = {
      source: parsedQuery.source,
      dry_run: parsedQuery.dry_run,
      min_confidence: parsedQuery.min_confidence,
      processed: summary.processed,
      promoted: summary.promoted,
      duplicates: summary.duplicates,
      skipped: summary.skipped,
      failed: summary.failed
    };

    await completeAgentRun({
      runId,
      status,
      resultPayload,
      processedCount: summary.processed,
      insertedCount: summary.promoted,
      updatedCount: summary.duplicates
    });

    logger.info("Agent promotion run completed", {
      runId,
      source: parsedQuery.source,
      dryRun: parsedQuery.dry_run,
      processed: summary.processed,
      promoted: summary.promoted,
      duplicates: summary.duplicates,
      skipped: summary.skipped,
      failed: summary.failed
    });

    return NextResponse.json({
      ok: true,
      run_id: runId,
      status,
      ...resultPayload
    });
  } catch (error) {
    if (runId) {
      try {
        await completeAgentRun({
          runId,
          status: "failed",
          resultPayload: {},
          processedCount: 0,
          insertedCount: 0,
          updatedCount: 0,
          errorMessage: error instanceof Error ? error.message : String(error)
        });
      } catch (completionError) {
        logger.error("Failed to mark promotion run as failed", {
          runId,
          error: completionError instanceof Error ? completionError.message : String(completionError)
        });
      }
    }

    if (error instanceof z.ZodError) {
      return jsonError("Invalid query parameters.", 400, error.flatten());
    }

    if (error instanceof Error && error.message.includes("idempotency key")) {
      return jsonError(error.message, 400);
    }

    logger.error("GET /api/agent/promote failed", {
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonError("Unable to run promotion agent.", 500);
  }
}
