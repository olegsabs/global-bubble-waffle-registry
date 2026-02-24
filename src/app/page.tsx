import Link from "next/link";

import { Container } from "@/components/ui/container";

export default function HomePage() {
  return (
    <Container className="space-y-10">
      {/* Hero */}
      <section className="rounded-3xl border border-batter-200 bg-white/90 p-8 shadow-lg shadow-batter-900/10 sm:p-12">
        <h1 className="max-w-3xl font-display text-4xl leading-tight text-ink sm:text-5xl lg:text-6xl">
          Every bubble waffle shop in&nbsp;the&nbsp;world.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink/80 sm:text-lg">
          From the street stalls of Hong Kong to your neighbourhood dessert bar
          &mdash; explore the global map, discover new spots, and help us build
          the most complete guide to bubble waffles on the planet.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/map"
            className="inline-flex h-12 items-center rounded-xl bg-batter-500 px-6 text-sm font-semibold text-white shadow-md shadow-batter-500/25 transition hover:bg-batter-600"
          >
            Explore the map
          </Link>
          <Link
            href="/submit"
            className="inline-flex h-12 items-center rounded-xl border border-batter-400 bg-white px-6 text-sm font-semibold text-ink transition hover:border-batter-600"
          >
            Add a shop you love
          </Link>
        </div>
      </section>

      {/* Value props */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card
          icon="🗺️"
          title="Find waffles anywhere"
          body="Browse shops on an interactive world map. Filter by city, country, or just zoom in wherever you are."
        />
        <Card
          icon="⭐"
          title="Discover the best"
          body="Every shop is verified with real details — address, links, photos, and what makes their waffle special."
        />
        <Card
          icon="🤝"
          title="Built by the community"
          body="Know a great spot we're missing? Submit it and help fellow waffle lovers find their next favourite."
        />
      </section>

      {/* How it works */}
      <section className="rounded-3xl border border-batter-200 bg-white/90 p-8 shadow-sm sm:p-10">
        <h2 className="font-display text-2xl text-ink sm:text-3xl">How it works</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <Step number="1" title="We find them" description="Our team scours cities worldwide to discover every bubble waffle shop — from hidden gems to beloved favourites." />
          <Step number="2" title="We verify" description="Each listing is checked for accuracy: real address, working hours, active social links. No ghost entries." />
          <Step number="3" title="You explore" description="Use the map to find your next waffle, read about shops in your city, or plan a waffle crawl across the globe." />
        </div>
      </section>
    </Container>
  );
}

function Card({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-batter-200 bg-white/90 p-6 shadow-sm">
      <span className="text-2xl" aria-hidden>{icon}</span>
      <h2 className="mt-3 text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/75">{body}</p>
    </article>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-batter-500 text-sm font-bold text-white">
        {number}
      </span>
      <div>
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink/75">{description}</p>
      </div>
    </div>
  );
}
