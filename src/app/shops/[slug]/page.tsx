import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { getShopBySlug } from "@/domain/shops/repository";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const shop = await getShopBySlug(slug);

    if (!shop) {
      return { title: "Shop not found" };
    }

    return {
      title: `${shop.name} — Bubble Waffle in ${shop.city}`,
      description: `${shop.name} is a bubble waffle shop in ${shop.city}, ${shop.country}. Find address, links, and more on Bubble Waffle.`
    };
  } catch {
    return { title: "Shop profile" };
  }
}

export default async function ShopPage({ params }: PageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop) {
    notFound();
  }

  const statusLabel: Record<string, string> = {
    active: "Open",
    closed: "Permanently closed",
    unknown: "Status unconfirmed"
  };

  const formatLabel: Record<string, string> = {
    kiosk: "Kiosk / Street stall",
    cafe: "Café",
    restaurant: "Restaurant",
    food_truck: "Food truck",
    chain: "Chain",
    other: "Other"
  };

  return (
    <Container className="space-y-6">
      <div className="rounded-3xl border border-batter-200 bg-white p-8 shadow-lg shadow-batter-900/10 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-batter-600">
              {shop.city}, {shop.country}
            </p>
            <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">{shop.name}</h1>
          </div>
          <span className={`mt-1 shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            shop.status === "active"
              ? "bg-green-100 text-green-800"
              : shop.status === "closed"
                ? "bg-red-100 text-red-800"
                : "bg-batter-100 text-batter-800"
          }`}>
            {statusLabel[shop.status] ?? shop.status}
          </span>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Info label="Address" value={shop.address} />
          <Info label="Type" value={formatLabel[shop.format] ?? shop.format} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {shop.instagram_url && (
            <a
              href={shop.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-xl border border-batter-300 px-4 text-sm font-semibold text-ink transition hover:border-batter-500"
            >
              Instagram
            </a>
          )}

          {shop.website_url && (
            <a
              href={shop.website_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-xl border border-batter-300 px-4 text-sm font-semibold text-ink transition hover:border-batter-500"
            >
              Website
            </a>
          )}

          <Link
            href="/map"
            className="inline-flex h-10 items-center rounded-xl bg-batter-500 px-4 text-sm font-semibold text-white transition hover:bg-batter-600"
          >
            View on map
          </Link>
        </div>
      </div>
    </Container>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-batter-200 bg-batter-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-batter-800">{label}</p>
      <p className="mt-1 text-sm text-ink">{value}</p>
    </div>
  );
}
