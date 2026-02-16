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
      return { title: "Shop not found | Global Bubble Waffle Registry" };
    }

    return {
      title: `${shop.name} | Global Bubble Waffle Registry`,
      description: `${shop.name} in ${shop.city}, ${shop.country}.`
    };
  } catch {
    return { title: "Shop profile | Global Bubble Waffle Registry" };
  }
}

export default async function ShopPage({ params }: PageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop) {
    notFound();
  }

  return (
    <Container className="space-y-6">
      <div className="rounded-3xl border border-batter-200 bg-white p-8 shadow-lg shadow-batter-900/10">
        <p className="inline-flex rounded-full border border-batter-300 bg-batter-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-batter-800">
          Registry profile
        </p>

        <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl">{shop.name}</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Info label="Country" value={shop.country} />
          <Info label="City" value={shop.city} />
          <Info label="Address" value={shop.address} />
          <Info label="Format" value={shop.format} />
          <Info label="Status" value={shop.status} />
          <Info label="Created source" value={shop.created_source} />
          <Info label="Latitude" value={String(shop.latitude)} />
          <Info label="Longitude" value={String(shop.longitude)} />
          <Info label="Verification confidence" value={shop.verification_confidence.toFixed(2)} />
          <Info label="Last verified" value={shop.last_verified_at ?? "Not verified yet"} />
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
            Back to map
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
