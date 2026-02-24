import type { DiscoveryRecordInput } from "@/domain/agents/schemas";

const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  websiteUri?: string;
  googleMapsUri?: string;
  primaryType?: string;
  types?: string[];
}

interface TextSearchResponse {
  places?: PlaceResult[];
  nextPageToken?: string;
}

export type CityTarget = {
  city: string;
  country: string;
  query?: string;
};

const SEARCH_QUERIES = ["bubble waffle", "egg waffle", "hong kong waffle"];

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.primaryType",
  "places.types",
  "places.addressComponents"
].join(",");

interface AddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

async function searchPlaces(
  apiKey: string,
  query: string,
  city: string,
  country: string
): Promise<(PlaceResult & { addressComponents?: AddressComponent[] })[]> {
  const textQuery = `${query} in ${city}, ${country}`;

  const response = await fetch(PLACES_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "en",
      maxResultCount: 20
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Places API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as TextSearchResponse;
  return data.places ?? [];
}

function extractFromAddressComponents(
  components: AddressComponent[] | undefined,
  type: string
): string | null {
  if (!components) return null;
  const match = components.find((c) => c.types?.includes(type));
  return match?.longText ?? match?.shortText ?? null;
}

function placeToDiscoveryRecord(
  place: PlaceResult & { addressComponents?: AddressComponent[] },
  city: string,
  country: string,
  query: string
): DiscoveryRecordInput | null {
  if (!place.displayName?.text || !place.location) {
    return null;
  }

  const resolvedCountry =
    extractFromAddressComponents(place.addressComponents, "country") ?? country;
  const resolvedCity =
    extractFromAddressComponents(place.addressComponents, "locality") ??
    extractFromAddressComponents(place.addressComponents, "administrative_area_level_1") ??
    city;

  return {
    external_ref: `google_places:${place.id}`,
    source_url: place.googleMapsUri ?? null,
    name: place.displayName.text,
    country: resolvedCountry,
    city: resolvedCity,
    address: place.formattedAddress ?? `${resolvedCity}, ${resolvedCountry}`,
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    instagram_url: null,
    website_url: place.websiteUri ?? null,
    format: "unknown" as const,
    status: "unknown" as const,
    confidence: 0.65,
    discovered_at: new Date().toISOString(),
    raw_payload: {
      google_place_id: place.id,
      primary_type: place.primaryType ?? null,
      types: place.types ?? [],
      matched_query: query
    }
  };
}

export async function discoverShopsInCity(
  apiKey: string,
  target: CityTarget
): Promise<DiscoveryRecordInput[]> {
  const queries = target.query ? [target.query] : SEARCH_QUERIES;
  const seenPlaceIds = new Set<string>();
  const results: DiscoveryRecordInput[] = [];

  for (const query of queries) {
    const places = await searchPlaces(apiKey, query, target.city, target.country);

    for (const place of places) {
      if (seenPlaceIds.has(place.id)) continue;
      seenPlaceIds.add(place.id);

      const record = placeToDiscoveryRecord(place, target.city, target.country, query);
      if (record) {
        results.push(record);
      }
    }
  }

  return results;
}

export const TARGET_CITIES: CityTarget[] = [
  { city: "Hong Kong", country: "Hong Kong" },
  { city: "Bangkok", country: "Thailand" },
  { city: "Taipei", country: "Taiwan" },
  { city: "Seoul", country: "South Korea" },
  { city: "Tokyo", country: "Japan" },
  { city: "Singapore", country: "Singapore" },
  { city: "Kuala Lumpur", country: "Malaysia" },
  { city: "London", country: "United Kingdom" },
  { city: "New York", country: "United States" },
  { city: "Los Angeles", country: "United States" },
  { city: "Paris", country: "France" },
  { city: "Berlin", country: "Germany" },
  { city: "Sydney", country: "Australia" },
  { city: "Melbourne", country: "Australia" },
  { city: "Toronto", country: "Canada" },
  { city: "Vancouver", country: "Canada" },
  { city: "Dubai", country: "United Arab Emirates" },
  { city: "Istanbul", country: "Turkey" },
  { city: "Miami", country: "United States" },
  { city: "Chicago", country: "United States" },
  { city: "San Francisco", country: "United States" },
  { city: "Seattle", country: "United States" },
  { city: "Amsterdam", country: "Netherlands" },
  { city: "Barcelona", country: "Spain" },
  { city: "Prague", country: "Czech Republic" },
  { city: "Vienna", country: "Austria" },
  { city: "Warsaw", country: "Poland" },
  { city: "Lisbon", country: "Portugal" },
  { city: "Manila", country: "Philippines" },
  { city: "Jakarta", country: "Indonesia" }
];
