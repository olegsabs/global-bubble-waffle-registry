import type { Metadata } from "next";

import { MapExplorer } from "@/components/map/map-explorer";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Explore the Map",
  description: "Find bubble waffle shops anywhere in the world. Browse the interactive map, search by city, and discover your next favourite spot."
};

export default function MapPage() {
  return (
    <Container className="space-y-6">
      <section className="space-y-2">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Find bubble waffles near&nbsp;you</h1>
        <p className="max-w-3xl text-sm text-ink/80 sm:text-base">
          Browse shops around the world, search by city or country, and zoom in to discover what&rsquo;s nearby.
        </p>
      </section>

      <MapExplorer />
    </Container>
  );
}
