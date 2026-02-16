import { createSupabaseAnonClient } from "@/lib/supabase/clients";
import { getServerEnv } from "@/lib/env";

type AdminAuthOk = {
  ok: true;
  actor: "admin_api_key" | "supabase_user";
  userId?: string;
};

type AdminAuthFail = {
  ok: false;
  status: number;
  error: string;
};

export type AdminAuthResult = AdminAuthOk | AdminAuthFail;

export async function requireAdmin(request: Request): Promise<AdminAuthResult> {
  const authorization = request.headers.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return {
      ok: false,
      status: 401,
      error: "Missing Bearer token."
    };
  }

  const token = authorization.replace("Bearer ", "").trim();
  const env = getServerEnv();

  if (env.ADMIN_API_KEY && token === env.ADMIN_API_KEY) {
    return {
      ok: true,
      actor: "admin_api_key"
    };
  }

  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      ok: false,
      status: 401,
      error: "Invalid auth token."
    };
  }

  const role = data.user.app_metadata?.role ?? data.user.user_metadata?.role;

  if (role !== "admin") {
    return {
      ok: false,
      status: 403,
      error: "Admin role is required."
    };
  }

  return {
    ok: true,
    actor: "supabase_user",
    userId: data.user.id
  };
}
