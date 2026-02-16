import { ShopSubmissionForm } from "@/components/forms/shop-submission-form";
import { Container } from "@/components/ui/container";

export default function SubmitPage() {
  return (
    <Container className="space-y-6">
      <section className="space-y-2">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Submit a Bubble Waffle Shop</h1>
        <p className="max-w-3xl text-sm text-ink/80 sm:text-base">
          Public submissions are queued for moderation before entering the canonical registry. Provide accurate
          coordinates and links to help the verification pipeline.
        </p>
      </section>

      <ShopSubmissionForm />
    </Container>
  );
}
