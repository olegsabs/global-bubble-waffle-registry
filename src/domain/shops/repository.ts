import { createSupabaseAnonClient, createSupabaseServiceClient } from "@/lib/supabase/clients";
import { deriveShopSlug, normalizeSlug } from "@/lib/slug";
import type { Shop } from "@/types/database";
import type { CreateShopInput, ShopListQuery, UpdateShopInput } from "@/domain/shops/schemas";

const SHOP_SELECT =
  "id,name,slug,country,city,address,latitude,longitude,instagram_url,website_url,status,format,created_at,updated_at,last_verified_at,created_source,verification_confidence";

function mapToShop(row: Record<string, unknown>): Shop {
  return row as unknown as Shop;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeLongitude(value: number): number {
  const normalized = ((value + 180) % 360 + 360) % 360 - 180;

  if (normalized === -180 && value > 0) {
    return 180;
  }

  return normalized;
}

export async function listShops(filters: ShopListQuery): Promise<{ shops: Shop[]; total: number }> {
  const client = createSupabaseAnonClient();
  const hasBbox =
    filters.west !== undefined &&
    filters.south !== undefined &&
    filters.east !== undefined &&
    filters.north !== undefined;

  let query = client.from("shops").select(SHOP_SELECT, { count: "exact" });

  if (filters.country) {
    query = query.ilike("country", `%${filters.country}%`);
  }

  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`name.ilike.${term},city.ilike.${term},country.ilike.${term},address.ilike.${term}`);
  }

  if (hasBbox) {
    const rawWest = filters.west as number;
    const rawSouth = filters.south as number;
    const rawEast = filters.east as number;
    const rawNorth = filters.north as number;
    const south = clamp(Math.min(rawSouth, rawNorth), -90, 90);
    const north = clamp(Math.max(rawSouth, rawNorth), -90, 90);

    query = query.gte("latitude", south).lte("latitude", north);

    const longitudeSpan = Math.abs(rawEast - rawWest);

    if (longitudeSpan < 360) {
      const west = normalizeLongitude(rawWest);
      const east = normalizeLongitude(rawEast);

      if (west <= east) {
        query = query.gte("longitude", west).lte("longitude", east);
      } else if (!filters.search) {
        // Antimeridian case (e.g., west=170, east=-170).
        // Skip this when search is present because PostgREST supports a single `or` clause.
        query = query.or(`longitude.gte.${west},longitude.lte.${east}`);
      }
    }
  }

  query = query.order("country", { ascending: true }).order("city", { ascending: true }).range(filters.offset, filters.offset + filters.limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list shops: ${error.message}`);
  }

  return {
    shops: (data ?? []).map((row) => mapToShop(row as Record<string, unknown>)),
    total: count ?? 0
  };
}

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const client = createSupabaseAnonClient();

  const { data, error } = await client.from("shops").select(SHOP_SELECT).eq("slug", slug).maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch shop by slug: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapToShop(data as Record<string, unknown>);
}

function buildCreatePayload(input: CreateShopInput, slug: string) {
  return {
    name: input.name,
    slug,
    country: input.country,
    city: input.city,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    instagram_url: input.instagram_url,
    website_url: input.website_url,
    status: input.status,
    format: input.format,
    last_verified_at: input.last_verified_at,
    created_source: input.created_source,
    verification_confidence: input.verification_confidence
  };
}

export async function createShop(input: CreateShopInput): Promise<Shop> {
  const client = createSupabaseServiceClient();
  const normalizedInputSlug = input.slug ? normalizeSlug(input.slug) : "";
  const baseSlug = normalizedInputSlug || deriveShopSlug(input.name, input.city, input.country);

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidateSlug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    const payload = buildCreatePayload(input, candidateSlug);

    const { data, error } = await client.from("shops").insert(payload).select(SHOP_SELECT).single();

    if (!error && data) {
      return mapToShop(data as Record<string, unknown>);
    }

    if (error?.code === "23505") {
      continue;
    }

    throw new Error(`Failed to create shop: ${error?.message ?? "unknown database error"}`);
  }

  throw new Error("Failed to create a unique slug for the shop after 25 attempts.");
}

export async function updateShop(id: string, input: UpdateShopInput): Promise<Shop | null> {
  const client = createSupabaseServiceClient();

  const updatePayload = {
    ...input,
    ...(input.slug ? { slug: normalizeSlug(input.slug) } : {})
  };

  const { data, error } = await client.from("shops").update(updatePayload).eq("id", id).select(SHOP_SELECT).maybeSingle();

  if (error) {
    throw new Error(`Failed to update shop: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapToShop(data as Record<string, unknown>);
}
