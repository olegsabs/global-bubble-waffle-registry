import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";

import "./globals.css";

export const metadata: Metadata = {
  title: "Global Bubble Waffle Registry",
  description: "Canonical global registry and intelligence layer for bubble waffle shops."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="relative min-h-screen pb-10">
          <header className="border-b border-batter-200/70 bg-white/80 backdrop-blur">
            <Container className="flex h-16 items-center justify-between">
              <Link href="/" className="font-display text-lg text-ink sm:text-xl">
                Global Bubble Waffle Registry
              </Link>
              <nav className="flex items-center gap-2 sm:gap-3">
                <NavLink href="/map">Map</NavLink>
                <NavLink href="/submit">Submit</NavLink>
              </nav>
            </Container>
          </header>

          <main className="pt-6">{children}</main>

          <footer className="mt-16 border-t border-batter-200/70 py-6 text-center text-xs text-ink/70">
            Canonical registry infrastructure for the global bubble waffle ecosystem.
          </footer>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center rounded-lg border border-batter-300 bg-white px-3 text-sm font-semibold text-ink transition hover:border-batter-500 hover:text-batter-700"
    >
      {children}
    </Link>
  );
}
