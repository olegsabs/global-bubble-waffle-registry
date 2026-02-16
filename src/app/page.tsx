import Link from "next/link";

import { Container } from "@/components/ui/container";

export default function HomePage() {
  return (
    <Container className="space-y-8">
      <section className="rounded-3xl border border-batter-200 bg-white/90 p-8 shadow-lg shadow-batter-900/10">
        <p className="mb-3 inline-flex rounded-full border border-batter-300 bg-batter-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-batter-800">
          AI-native registry platform
        </p>
        <h1 className="max-w-3xl font-display text-4xl leading-tight text-ink sm:text-5xl">
          The canonical global registry for bubble waffle shops.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-ink/80 sm:text-lg">
          Built as structured infrastructure for operators, researchers, and autonomous agents. Discover shops on a world
          map, explore profile records, and submit new locations for verification.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/map"
            className="inline-flex h-11 items-center rounded-xl bg-batter-500 px-5 text-sm font-semibold text-white transition hover:bg-batter-600"
          >
            Open global map
          </Link>
          <Link
            href="/submit"
            className="inline-flex h-11 items-center rounded-xl border border-batter-400 bg-white px-5 text-sm font-semibold text-ink transition hover:border-batter-600"
          >
            Submit a shop
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          title="Structured records"
          body="Every shop is normalized with geolocation, lifecycle status, and verification metadata for downstream automation."
        />
        <Card
          title="Agent-ready APIs"
          body="Agents can insert, read, and patch shops through explicit endpoints designed for verification and autonomous growth."
        />
        <Card
          title="Moderation-first intake"
          body="Public submissions are stored in a dedicated moderation queue before promotion to canonical records."
        />
      </section>
    </Container>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-batter-200 bg-white/90 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-ink/75">{body}</p>
    </article>
  );
}
