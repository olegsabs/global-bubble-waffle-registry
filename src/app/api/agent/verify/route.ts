import { NextRequest, NextResponse } from "next/server";

import {
  applyVerificationChecks,
  isAgentRateAllowed,
  completeAgentRun,
  startAgentRun,
  getAgentRunByKey
} from "@/domain/agents/repository";
import { agentVerifyRequestSchema } from "@/domain/agents/schemas";
import { requireAdmin } from "@/lib/api/admin-auth";
import { getServerEnv } from "@/lib/env";
import { jsonError, parseJsonBody } from "@/lib/http";
import { logger } from "@/lib/logger";

const IDEMPOTENCY_KEY_PATTERN = /^[a-zA-Z0-9:_\-.]+$/;

export const runtime = "nodejs";

function resolveRunKey(headerKey: string | null, bodyKey: string | null): string | null {
  const candidate = (headerKey ?? bodyKey ?? "").trim();

  if (candidate.length === 0) {
    return null;
  }

  if (candidate.length < 8 || candidate.length > 200 || !IDEMPOTENCY_KEY_PATTERN.test(candidate)) {
    throw new Error("Invalid idempotency key format.");
  }

  return candidate;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const admin = await requireAdmin(request);

  if (!admin.ok) {
    return jsonError(admin.error, admin.status);
  }

  let runId: string | null = null;

  try {
    const payload = await parseJsonBody(request);
    const parsed = agentVerifyRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonError("Validation failed.", 422, parsed.error.flatten());
    }

    const env = getServerEnv();
    const runKey = resolveRunKey(request.headers.get("x-idempotency-key"), parsed.data.run_key);

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

    const allowed = await isAgentRateAllowed("verification", env.AGENT_RATE_LIMIT_PER_MINUTE ?? 60, 60);

    if (!allowed) {
      return jsonError("Verification agent rate limit exceeded. Retry in about a minute.", 429);
    }

    const started = await startAgentRun({
      agentType: "verification",
      runKey,
      inputPayload: {
        source: parsed.data.source,
        notes: parsed.data.notes,
        checks_count: parsed.data.checks.length
      },
      createdBy: admin.actor === "supabase_user" ? `supabase_user:${admin.userId ?? "unknown"}` : "admin_api_key"
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

    const summary = await applyVerificationChecks({
      runId,
      source: parsed.data.source,
      checks: parsed.data.checks
    });

    const hasIssues = summary.failed > 0 || summary.missing > 0 || summary.logFailures > 0;
    const status = hasIssues ? "partial" : "succeeded";

    const resultPayload = {
      source: parsed.data.source,
      processed: summary.processed,
      updated: summary.updated,
      missing: summary.missing,
      failed: summary.failed,
      logs_inserted: summary.logsInserted,
      log_failures: summary.logFailures
    };

    await completeAgentRun({
      runId,
      status,
      resultPayload,
      processedCount: summary.processed,
      insertedCount: summary.logsInserted,
      updatedCount: summary.updated
    });

    logger.info("Agent verification run completed", {
      runId,
      source: parsed.data.source,
      processed: summary.processed,
      updated: summary.updated,
      missing: summary.missing,
      failed: summary.failed,
      logsInserted: summary.logsInserted,
      logFailures: summary.logFailures
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
        logger.error("Failed to mark verification run as failed", {
          runId,
          error: completionError instanceof Error ? completionError.message : String(completionError)
        });
      }
    }

    if (error instanceof Error && error.message.includes("valid JSON")) {
      return jsonError(error.message, 400);
    }

    if (error instanceof Error && error.message.includes("idempotency key")) {
      return jsonError(error.message, 400);
    }

    logger.error("POST /api/agent/verify failed", {
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonError("Unable to process verification batch.", 500);
  }
}
