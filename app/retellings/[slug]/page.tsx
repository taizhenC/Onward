import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RetellingPlayer } from "@/components/RetellingPlayer";
import { RetellingsPaused } from "@/components/RetellingsPaused";
import { getRetelling, retellingsPaused } from "@/lib/retellings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Fictionalized retelling | Onward",
  description: "Public fiction inspired by a real person. Invented scenes are not historical evidence.",
  robots: { index: false, follow: false },
};

export default async function RetellingPage({ params }: { params: Promise<{ slug: string }> }) {
  if (retellingsPaused()) return <RetellingsPaused />;
  const story = getRetelling((await params).slug);
  if (!story) notFound();
  return <main className="mx-auto max-w-[36rem] space-y-8 px-6 py-16">
    <nav aria-label="Retelling collection"><Link href="/retellings" className="inline-flex min-h-11 items-center underline underline-offset-4">All fictionalized retellings</Link></nav>
    <RetellingPlayer key={story.slug} story={story} />
  </main>;
}
