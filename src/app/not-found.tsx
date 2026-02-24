import Link from "next/link";

import { Container } from "@/components/ui/container";

export default function NotFoundPage() {
  return (
    <Container className="py-12">
      <div className="rounded-3xl border border-batter-200 bg-white p-8 text-center shadow-sm">
        <p className="text-4xl" aria-hidden>🧇</p>
        <h1 className="mt-4 font-display text-3xl text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-ink/75">
          We couldn&rsquo;t find what you&rsquo;re looking for. It may have moved or doesn&rsquo;t exist yet.
        </p>
        <Link
          href="/map"
          className="mt-6 inline-flex h-10 items-center rounded-xl bg-batter-500 px-4 text-sm font-semibold text-white transition hover:bg-batter-600"
        >
          Explore the map
        </Link>
      </div>
    </Container>
  );
}
