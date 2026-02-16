import { MapExplorer } from "@/components/map/map-explorer";
import { Container } from "@/components/ui/container";

export default function MapPage() {
  return (
    <Container className="space-y-6">
      <section className="space-y-2">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Global Shop Map</h1>
        <p className="max-w-3xl text-sm text-ink/80 sm:text-base">
          Explore bubble waffle shops worldwide. Filter by geography, operational status, and free-text query.
        </p>
      </section>

      <MapExplorer />
    </Container>
  );
}
