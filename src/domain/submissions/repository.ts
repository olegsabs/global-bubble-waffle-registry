import { createSupabaseServiceClient } from "@/lib/supabase/clients";
import type { CreateSubmissionInput } from "@/domain/submissions/schemas";

export async function createShopSubmission(input: CreateSubmissionInput): Promise<{ id: string }> {
  const client = createSupabaseServiceClient();

  const payload = {
    name: input.name,
    country: input.country,
    city: input.city,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    instagram_url: input.instagram_url,
    website_url: input.website_url,
    format: input.format,
    submitted_by_email: input.submitted_by_email,
    source_note: input.source_note,
    raw_payload: input
  };

  const { data, error } = await client.from("shop_submissions").insert(payload).select("id").single();

  if (error || !data) {
    throw new Error(`Failed to create shop submission: ${error?.message ?? "unknown database error"}`);
  }

  return { id: data.id as string };
}
