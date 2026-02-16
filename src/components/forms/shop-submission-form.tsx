"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

import { SHOP_FORMATS } from "@/types/database";

type SubmissionFormState = {
  name: string;
  country: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  instagram_url: string;
  website_url: string;
  format: (typeof SHOP_FORMATS)[number];
  submitted_by_email: string;
  source_note: string;
  company: string;
};

const initialState: SubmissionFormState = {
  name: "",
  country: "",
  city: "",
  address: "",
  latitude: "",
  longitude: "",
  instagram_url: "",
  website_url: "",
  format: "unknown",
  submitted_by_email: "",
  source_note: "",
  company: ""
};

export function ShopSubmissionForm() {
  const [form, setForm] = useState<SubmissionFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        submitted_by_email: form.submitted_by_email || null
      };

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const body = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setStatus({ kind: "error", message: body.error ?? "Submission failed." });
        return;
      }

      setStatus({ kind: "success", message: body.message ?? "Submission received." });
      setForm(initialState);
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Unexpected submission error."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4 rounded-3xl border border-batter-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Shop name" required>
          <input
            className="input"
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </Field>

        <Field label="Format">
          <select
            className="input"
            value={form.format}
            onChange={(event) =>
              setForm((current) => ({ ...current, format: event.target.value as SubmissionFormState["format"] }))
            }
          >
            {SHOP_FORMATS.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Country" required>
          <input
            className="input"
            required
            value={form.country}
            onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
          />
        </Field>

        <Field label="City" required>
          <input
            className="input"
            required
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
          />
        </Field>
      </div>

      <Field label="Street address" required>
        <input
          className="input"
          required
          value={form.address}
          onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Latitude" required>
          <input
            className="input"
            required
            type="number"
            step="any"
            value={form.latitude}
            onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))}
          />
        </Field>

        <Field label="Longitude" required>
          <input
            className="input"
            required
            type="number"
            step="any"
            value={form.longitude}
            onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))}
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Instagram URL">
          <input
            className="input"
            type="url"
            placeholder="https://instagram.com/example"
            value={form.instagram_url}
            onChange={(event) => setForm((current) => ({ ...current, instagram_url: event.target.value }))}
          />
        </Field>

        <Field label="Website URL">
          <input
            className="input"
            type="url"
            placeholder="https://example.com"
            value={form.website_url}
            onChange={(event) => setForm((current) => ({ ...current, website_url: event.target.value }))}
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Submitter email">
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={form.submitted_by_email}
            onChange={(event) => setForm((current) => ({ ...current, submitted_by_email: event.target.value }))}
          />
        </Field>

        <Field label="Hidden field" hidden>
          <input
            className="input"
            tabIndex={-1}
            autoComplete="off"
            value={form.company}
            onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
          />
        </Field>
      </div>

      <Field label="Source note">
        <textarea
          className="input min-h-24"
          placeholder="How did you discover this shop?"
          value={form.source_note}
          onChange={(event) => setForm((current) => ({ ...current, source_note: event.target.value }))}
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-batter-500 px-5 text-sm font-semibold text-white transition hover:bg-batter-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit shop"}
      </button>

      {status && (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            status.kind === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {status.message}
        </p>
      )}
    </form>
  );
}

type FieldProps = {
  label: string;
  children: ReactNode;
  required?: boolean;
  hidden?: boolean;
};

function Field({ label, children, required = false, hidden = false }: FieldProps) {
  return (
    <label className={hidden ? "hidden" : "block space-y-2 text-sm font-medium text-ink"}>
      <span>
        {label}
        {required && <span className="ml-1 text-batter-600">*</span>}
      </span>
      {children}
    </label>
  );
}
