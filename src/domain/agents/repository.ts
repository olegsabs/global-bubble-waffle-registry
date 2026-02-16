import { createHash } from "node:crypto";

import type {
  AgentRunStatus,
  AgentType,
  ShopStatus
} from "@/types/database";
import type {
  AgentDiscoverRequestInput,
  AgentVerifyRequestInput,
  DiscoveryRecordInput,
  VerifyRecordInput
} from "@/domain/agents/schemas";
import { createSupabaseServiceClient } from "@/lib/supabase/clients";

export type AgentRunSnapshot = {
  id: string;
  status: AgentRunStatus;
  resultPayload: Record<string, unknown>;
  finishedAt: string | null;
};

type StartAgentRunParams = {
  agentType: AgentType;
  runKey: string | null;
  inputPayload: Record<string, unknown>;
  createdBy: string;
};

type StartAgentRunResult = {
  created: boolean;
  run: AgentRunSnapshot;
};

type CompleteAgentRunParams = {
  runId: string;
  status: AgentRunStatus;
  resultPayload: Record<string, unknown>;
  processedCount: number;
  insertedCount: number;
  updatedCount: number;
  errorMessage?: string;
};

export async function getAgentRunByKey(runKey: string): Promise<AgentRunSnapshot | null> {
  const client = createSupabaseServiceClient();

  const { data, error } = await client
    .from("agent_runs")
    .select("id,status,result_payload,finished_at")
    .eq("run_key", runKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch agent run by key: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id as string,
    status: data.status as AgentRunStatus,
    resultPayload: (data.result_payload as Record<string, unknown>) ?? {},
    finishedAt: (data.finished_at as string | null) ?? null
  };
}

export async function startAgentRun(params: StartAgentRunParams): Promise<StartAgentRunResult> {
  if (params.runKey) {
    const existing = await getAgentRunByKey(params.runKey);

    if (existing) {
      return {
        created: false,
        run: existing
      };
    }
  }

  const client = createSupabaseServiceClient();
  const { data, error } = await client
    .from("agent_runs")
    .insert({
      agent_type: params.agentType,
      run_key: params.runKey,
      status: "running",
      input_payload: params.inputPayload,
      created_by: params.createdBy
    })
    .select("id,status,result_payload,finished_at")
    .single();

  if (error?.code === "23505" && params.runKey) {
    const existing = await getAgentRunByKey(params.runKey);

    if (existing) {
      return {
        created: false,
        run: existing
      };
    }
  }

  if (error || !data) {
    throw new Error(`Failed to create agent run: ${error?.message ?? "unknown database error"}`);
  }

  return {
    created: true,
    run: {
      id: data.id as string,
      status: data.status as AgentRunStatus,
      resultPayload: (data.result_payload as Record<string, unknown>) ?? {},
      finishedAt: (data.finished_at as string | null) ?? null
    }
  };
}

export async function completeAgentRun(params: CompleteAgentRunParams): Promise<void> {
  const client = createSupabaseServiceClient();

  const { error } = await client
    .from("agent_runs")
    .update({
      status: params.status,
      finished_at: new Date().toISOString(),
      result_payload: params.resultPayload,
      processed_count: params.processedCount,
      inserted_count: params.insertedCount,
      updated_count: params.updatedCount,
      error_message: params.errorMessage ?? null
    })
    .eq("id", params.runId);

  if (error) {
    throw new Error(`Failed to complete agent run: ${error.message}`);
  }
}

export async function isAgentRateAllowed(
  agentType: AgentType,
  maxRequestsPerWindow: number,
  windowSeconds: number
): Promise<boolean> {
  const client = createSupabaseServiceClient();
  const threshold = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const { count, error } = await client
    .from("agent_runs")
    .select("id", { head: true, count: "exact" })
    .eq("agent_type", agentType)
    .gte("started_at", threshold);

  if (error) {
    throw new Error(`Failed to evaluate agent rate limit: ${error.message}`);
  }

  return (count ?? 0) < maxRequestsPerWindow;
}

function normalizeString(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildDiscoveryHash(record: DiscoveryRecordInput, source: string): string {
  const lat = Number(record.latitude).toFixed(5);
  const lng = Number(record.longitude).toFixed(5);

  const parts = [
    normalizeString(source),
    normalizeString(record.name),
    normalizeString(record.country),
    normalizeString(record.city),
    normalizeString(record.address),
    lat,
    lng,
    record.external_ref ? normalizeString(record.external_ref) : ""
  ];

  return createHash("sha256").update(parts.join("|")).digest("hex");
}

export async function ingestAgentDiscoveries(input: {
  runId: string;
  source: AgentDiscoverRequestInput["source"];
  records: AgentDiscoverRequestInput["records"];
}): Promise<{ processed: number; inserted: number; duplicates: number }> {
  const client = createSupabaseServiceClient();

  const rows = input.records.map((record) => ({
    agent_run_id: input.runId,
    source: input.source,
    external_ref: record.external_ref,
    source_url: record.source_url,
    discovery_hash: buildDiscoveryHash(record, input.source),
    name: record.name,
    country: record.country,
    city: record.city,
    address: record.address,
    latitude: record.latitude,
    longitude: record.longitude,
    instagram_url: record.instagram_url,
    website_url: record.website_url,
    format: record.format,
    status: record.status,
    discovery_confidence: record.confidence,
    discovered_at: record.discovered_at,
    raw_payload: record.raw_payload ?? {}
  }));

  const { data, error } = await client
    .from("agent_discoveries")
    .upsert(rows, { onConflict: "discovery_hash", ignoreDuplicates: true })
    .select("id");

  if (error) {
    throw new Error(`Failed to ingest agent discoveries: ${error.message}`);
  }

  const inserted = data?.length ?? 0;

  return {
    processed: input.records.length,
    inserted,
    duplicates: input.records.length - inserted
  };
}

type ShopRowForVerification = {
  id: string;
  status: ShopStatus;
};

export async function applyVerificationChecks(input: {
  runId: string;
  source: AgentVerifyRequestInput["source"];
  checks: AgentVerifyRequestInput["checks"];
}): Promise<{
  processed: number;
  updated: number;
  missing: number;
  failed: number;
  logsInserted: number;
  logFailures: number;
}> {
  const client = createSupabaseServiceClient();
  const uniqueShopIds = Array.from(new Set(input.checks.map((check) => check.shop_id)));

  const { data: shopRows, error: shopRowsError } = await client
    .from("shops")
    .select("id,status")
    .in("id", uniqueShopIds);

  if (shopRowsError) {
    throw new Error(`Failed to load shops for verification: ${shopRowsError.message}`);
  }

  const shopsById = new Map<string, ShopRowForVerification>();

  for (const row of (shopRows ?? []) as ShopRowForVerification[]) {
    shopsById.set(row.id, row);
  }

  let updated = 0;
  let missing = 0;
  let failed = 0;
  let logsInserted = 0;
  let logFailures = 0;

  for (const check of input.checks as VerifyRecordInput[]) {
    const currentShop = shopsById.get(check.shop_id);

    if (!currentShop) {
      missing += 1;
      continue;
    }

    const verifiedAt = check.last_verified_at ?? new Date().toISOString();

    const { error: updateError } = await client
      .from("shops")
      .update({
        status: check.status,
        verification_confidence: check.verification_confidence,
        last_verified_at: verifiedAt,
        created_source: "agent"
      })
      .eq("id", check.shop_id);

    if (updateError) {
      failed += 1;
      continue;
    }

    updated += 1;

    const { error: logError } = await client.from("shop_verification_logs").insert({
      shop_id: check.shop_id,
      agent_run_id: input.runId,
      source: input.source,
      previous_status: currentShop.status,
      result_status: check.status,
      verification_confidence: check.verification_confidence,
      reason: check.reason,
      evidence: check.evidence ?? {},
      verified_at: verifiedAt
    });

    if (logError) {
      logFailures += 1;
    } else {
      logsInserted += 1;
    }

    shopsById.set(check.shop_id, {
      id: currentShop.id,
      status: check.status
    });
  }

  return {
    processed: input.checks.length,
    updated,
    missing,
    failed,
    logsInserted,
    logFailures
  };
}
