import slugify from "slugify";

export function normalizeSlug(value: string): string {
  return slugify(value, {
    lower: true,
    strict: true,
    trim: true
  });
}

export function deriveShopSlug(name: string, city: string, country: string): string {
  const base = `${name}-${city}-${country}`;
  const normalized = normalizeSlug(base);
  return normalized || "bubble-waffle-shop";
}
