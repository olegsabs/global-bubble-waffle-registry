import Link from "next/link";

import { Container } from "@/components/ui/container";

export default function NotFoundPage() {
  return (
    <Container className="py-12">
      <div className="rounded-3xl border border-batter-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-display text-3xl text-ink">Record Not Found</h1>
        <p className="mt-2 text-sm text-ink/75">The requested shop profile does not exist in the registry.</p>
        <Link
          href="/map"
          className="mt-6 inline-flex h-10 items-center rounded-xl bg-batter-500 px-4 text-sm font-semibold text-white transition hover:bg-batter-600"
        >
          Return to map
        </Link>
      </div>
    </Container>
  );
}
