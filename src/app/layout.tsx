import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bubble Waffle — Find the Best Bubble Waffles Worldwide",
    template: "%s | Bubble Waffle"
  },
  description:
    "Discover bubble waffle shops around the world. Explore the global map, read city guides, and find your next favourite waffle spot.",
  openGraph: {
    siteName: "Bubble Waffle",
    locale: "en_US",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="relative min-h-screen pb-10">
          <header className="border-b border-batter-200/70 bg-white/80 backdrop-blur">
            <Container className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center gap-2 font-display text-lg text-ink sm:text-xl">
                <span aria-hidden className="text-2xl">🧇</span>
                <span>Bubble Waffle</span>
                <span className="inline-flex rounded-full border border-batter-300 bg-batter-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-batter-800">
                  Beta
                </span>
              </Link>
              <nav className="flex items-center gap-1.5 sm:gap-2.5">
                <NavLink href="/map">Explore Map</NavLink>
                <NavLink href="/submit">Add a Shop</NavLink>
              </nav>
            </Container>
          </header>

          <main className="pt-6">{children}</main>

          <footer className="mt-16 border-t border-batter-200/70 py-8">
            <Container>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <p className="text-sm text-ink/70">
                  &copy; {new Date().getFullYear()} bubblewaffle.com
                </p>
                <div className="flex items-center gap-4">
                  <a
                    href="https://instagram.com/bubblewaffle"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-ink/70 transition hover:text-batter-600"
                  >
                    Instagram
                  </a>
                  <Link href="/submit" className="text-sm font-medium text-ink/70 transition hover:text-batter-600">
                    Add a Shop
                  </Link>
                  <Link href="/map" className="text-sm font-medium text-ink/70 transition hover:text-batter-600">
                    Map
                  </Link>
                </div>
              </div>
            </Container>
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
