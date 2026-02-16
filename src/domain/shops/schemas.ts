import { z } from "zod";

import { CREATED_SOURCES, SHOP_FORMATS, SHOP_STATUSES } from "@/types/database";

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

export const createShopSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(240).regex(/^[a-z0-9-]+$/).optional(),
  country: z.string().trim().min(2).max(120),
  city: z.string().trim().min(1).max(120),
  address: z.string().trim().min(2).max(250),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  instagram_url: optionalUrlSchema,
  website_url: optionalUrlSchema,
  status: z.enum(SHOP_STATUSES).default("unknown"),
  format: z.enum(SHOP_FORMATS).default("unknown"),
  last_verified_at: z.string().datetime({ offset: true }).optional().nullable(),
  created_source: z.enum(CREATED_SOURCES).default("manual"),
  verification_confidence: z.coerce.number().min(0).max(1).default(0)
});

export const updateShopSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    slug: z.string().trim().min(2).max(240).regex(/^[a-z0-9-]+$/).optional(),
    country: z.string().trim().min(2).max(120).optional(),
    city: z.string().trim().min(1).max(120).optional(),
    address: z.string().trim().min(2).max(250).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    instagram_url: optionalUrlSchema.optional(),
    website_url: optionalUrlSchema.optional(),
    status: z.enum(SHOP_STATUSES).optional(),
    format: z.enum(SHOP_FORMATS).optional(),
    last_verified_at: z.string().datetime({ offset: true }).optional().nullable(),
    created_source: z.enum(CREATED_SOURCES).optional(),
    verification_confidence: z.coerce.number().min(0).max(1).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export const shopListQuerySchema = z.object({
  country: z.string().trim().min(1).max(120).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  status: z.enum(SHOP_STATUSES).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).default(200).transform((value) => Math.min(value, 1000)),
  offset: z.coerce.number().int().min(0).default(0),
  west: z.coerce.number().min(-180).max(180).optional(),
  south: z.coerce.number().min(-90).max(90).optional(),
  east: z.coerce.number().min(-180).max(180).optional(),
  north: z.coerce.number().min(-90).max(90).optional()
}).superRefine((value, context) => {
  const coordinates = [value.west, value.south, value.east, value.north];
  const providedCount = coordinates.filter((coordinate) => coordinate !== undefined).length;

  if (providedCount > 0 && providedCount < 4) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Bbox requires west, south, east, and north together."
    });
    return;
  }

  if (providedCount === 4 && value.south !== undefined && value.north !== undefined && value.south > value.north) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Bbox south cannot be greater than north."
    });
  }
});

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
export type ShopListQuery = z.infer<typeof shopListQuerySchema>;

export function parseShopListQuery(searchParams: URLSearchParams): ShopListQuery {
  const raw: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    raw[key] = value;
  }

  return shopListQuerySchema.parse(raw);
}
