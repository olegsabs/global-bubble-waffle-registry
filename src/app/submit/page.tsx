import type { Metadata } from "next";

import { ShopSubmissionForm } from "@/components/forms/shop-submission-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Add a Shop",
  description: "Know a bubble waffle spot we haven't listed yet? Submit it and help fellow waffle lovers discover great new places."
};

export default function SubmitPage() {
  return (
    <Container className="space-y-6">
      <section className="space-y-2">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Know a great spot?</h1>
        <p className="max-w-3xl text-sm text-ink/80 sm:text-base">
          Help us build the most complete guide to bubble waffles in the world.
          Tell us about a shop and we&rsquo;ll verify it and add it to the map.
        </p>
      </section>

      <ShopSubmissionForm />
    </Container>
  );
}
