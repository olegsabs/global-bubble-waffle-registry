import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_MAP_TILE_URL: z.string().min(1).default("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ADMIN_API_KEY: z.string().min(16).optional(),
  AGENT_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(10000).optional()
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

let publicEnvCache: PublicEnv | null = null;
let serverEnvCache: ServerEnv | null = null;

export function getPublicEnv(): PublicEnv {
  if (publicEnvCache) {
    return publicEnvCache;
  }

  const parsed = publicEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid public environment variables: ${parsed.error.message}`);
  }

  publicEnvCache = parsed.data;
  return publicEnvCache;
}

export function getServerEnv(): ServerEnv {
  if (serverEnvCache) {
    return serverEnvCache;
  }

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid server environment variables: ${parsed.error.message}`);
  }

  serverEnvCache = parsed.data;
  return serverEnvCache;
}
