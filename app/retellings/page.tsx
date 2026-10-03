import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { RetellingCatalog } from "@/components/RetellingCatalog";
import { RetellingsPaused } from "@/components/RetellingsPaused";
import { listRetellings, retellingsPaused } from "@/lib/retellings";
import { RETELLING_DISCLOSURE } from "@/lib/retelling-types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Fictionalized retellings | Onward",
  description: "Clearly labeled fiction inspired by real people, with documented background separated from invented scenes.",
  robots: { index: false, follow: false },
};

export default function RetellingsPage() {
  if (retellingsPaused()) return <RetellingsPaused />;
  return <main className="mx-auto max-w-[36rem] space-y-10 px-6 py-16">
    <nav aria-label="Onward"><Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Onward</Link></nav>
    <header className="space-y-5">
      <p className="font-ui text-sm font-semibold text-[var(--color-accent)]">A separate fiction collection</p>
      <h1 className="text-3xl leading-snug">Fictionalized retellings</h1>
      <p>Real names. Imagined moments. Stories about making, learning, asking for help, and beginning again.</p>
      <p className="text-[var(--color-ink-soft)]">{RETELLING_DISCLOSURE}</p>
      <Link href="/begin" className="inline-flex min-h-11 items-center underline underline-offset-4">Prefer a documented historical story?</Link>
    </header>
    <RetellingCatalog stories={listRetellings()} />
    <footer className="space-y-3 border-t border-[var(--color-rule)] pt-6 text-sm text-[var(--color-ink-soft)]">
      <p>These are fixed public stories for adult readers. They do not use what you wrote in historical intake and are not saved to Your stories.</p>
      <p>Need support now? <a href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">Find local crisis resources</a>.</p>
    </footer>
  </main>;
}
