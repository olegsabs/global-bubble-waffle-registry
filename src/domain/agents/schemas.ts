import { z } from "zod";

import { SHOP_FORMATS, SHOP_STATUSES } from "@/types/database";

const optionalUrlSchema = z
  .preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return null;
      }
      return value;
    },
    z.string().url().nullable().optional()
  )
  .transform((value) => value ?? null);

const optionalStringSchema = z
  .preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return null;
      }
      return value;
    },
    z.string().trim().max(500).nullable().optional()
  )
  .transform((value) => value ?? null);

const optionalRunKeySchema = z
  .preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return null;
      }
      return value;
    },
    z.string().trim().min(8).max(200).regex(/^[a-zA-Z0-9:_\-.]+$/).nullable().optional()
  )
  .transform((value) => value ?? null);

export const discoveryRecordSchema = z.object({
  external_ref: z.string().trim().min(1).max(255).optional(),
  source_url: optionalUrlSchema,
  name: z.string().trim().min(2).max(200),
  country: z.string().trim().min(2).max(120),
  city: z.string().trim().min(1).max(120),
  address: z.string().trim().min(2).max(250),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  instagram_url: optionalUrlSchema,
  website_url: optionalUrlSchema,
  format: z.enum(SHOP_FORMATS).default("unknown"),
  status: z.enum(SHOP_STATUSES).default("unknown"),
  confidence: z.coerce.number().min(0).max(1).default(0.5),
  discovered_at: z.string().datetime({ offset: true }).optional().nullable(),
  raw_payload: z.record(z.string(), z.unknown()).optional().default({})
});

export const agentDiscoverRequestSchema = z.object({
  run_key: optionalRunKeySchema,
  source: z.string().trim().min(2).max(80),
  notes: optionalStringSchema,
  records: z.array(discoveryRecordSchema).min(1).max(500)
});

export const verifyRecordSchema = z.object({
  shop_id: z.string().uuid(),
  status: z.enum(SHOP_STATUSES),
  verification_confidence: z.coerce.number().min(0).max(1),
  last_verified_at: z.string().datetime({ offset: true }).optional().nullable(),
  reason: optionalStringSchema,
  evidence: z.record(z.string(), z.unknown()).optional().default({})
});

export const agentVerifyRequestSchema = z.object({
  run_key: optionalRunKeySchema,
  source: z.string().trim().min(2).max(80),
  notes: optionalStringSchema,
  checks: z.array(verifyRecordSchema).min(1).max(500)
});

const optionalBooleanSchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (["1", "true", "yes", "on"].includes(normalized)) {
        return true;
      }

      if (["0", "false", "no", "off"].includes(normalized)) {
        return false;
      }
    }

    return value;
  },
  z.boolean().optional()
);

export const agentPromoteQuerySchema = z.object({
  run_key: optionalRunKeySchema,
  source: z.string().trim().min(2).max(80).default("promotion-agent"),
  notes: optionalStringSchema,
  limit: z.coerce.number().int().min(1).max(500).default(100),
  min_confidence: z.coerce.number().min(0).max(1).default(0.7),
  dry_run: optionalBooleanSchema.default(false)
});

export type AgentDiscoverRequestInput = z.infer<typeof agentDiscoverRequestSchema>;
export type AgentVerifyRequestInput = z.infer<typeof agentVerifyRequestSchema>;
export type AgentPromoteQueryInput = z.infer<typeof agentPromoteQuerySchema>;
export type DiscoveryRecordInput = z.infer<typeof discoveryRecordSchema>;
export type VerifyRecordInput = z.infer<typeof verifyRecordSchema>;

export function parseAgentPromoteQuery(
  searchParams: URLSearchParams,
  defaults?: { limit?: number; minConfidence?: number }
): AgentPromoteQueryInput {
  const raw: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    raw[key] = value;
  }

  if (defaults?.limit !== undefined && raw.limit === undefined) {
    raw.limit = String(defaults.limit);
  }

  if (defaults?.minConfidence !== undefined && raw.min_confidence === undefined) {
    raw.min_confidence = String(defaults.minConfidence);
  }

  return agentPromoteQuerySchema.parse(raw);
}
