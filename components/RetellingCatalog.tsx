"use client";

import { useState } from "react";
import Link from "next/link";
import { RETELLING_LABEL, RETELLING_TOPICS, type RetellingTopic } from "@/lib/retelling-types";
import type { RetellingSummary } from "@/lib/retellings";

export function RetellingCatalog({ stories }: { stories: readonly RetellingSummary[] }) {
  const [topic, setTopic] = useState<RetellingTopic | "all">("all");
  const shown = topic === "all" ? stories : stories.filter(story => story.topics.includes(topic));
  return <section aria-label="Choose a retelling" className="space-y-8">
    <div className="space-y-3">
      <label htmlFor="retelling-topic" className="block font-ui text-sm">What would you like to read about?</label>
      <select id="retelling-topic" value={topic} onChange={event => {
        const next = event.target.value;
        if (next === "all" || Object.hasOwn(RETELLING_TOPICS, next)) setTopic(next as RetellingTopic | "all");
      }} className="min-h-11 w-full rounded-sm border border-[var(--color-rule-strong)] bg-[var(--color-bg)] px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]">
        <option value="all">All retellings</option>
        {Object.entries(RETELLING_TOPICS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
      <p className="text-sm text-[var(--color-ink-soft)]">This is a reading preference, not a personal assessment or historical match. Your choice stays in this page; it is not saved to an account.</p>
      <p role="status" className="text-sm text-[var(--color-ink-soft)]">{shown.length} {shown.length === 1 ? "retelling" : "retellings"} to explore</p>
    </div>
    <ul className="space-y-8">
      {shown.map(story => <li key={story.slug} className="space-y-3 border-t border-[var(--color-rule)] pt-6">
        <p className="font-ui text-sm font-semibold text-[var(--color-accent)]">{RETELLING_LABEL}</p>
        <h2 className="text-2xl"><Link href={`/retellings/${story.slug}`} prefetch={false} className="inline-block min-h-11 underline decoration-[var(--color-rule-strong)] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]">{story.title}</Link></h2>
        <p>Inspired by {story.figureName}</p>
        <p>{story.summary}</p>
        <p className="text-sm text-[var(--color-ink-soft)]">Content note: {story.contentNote}</p>
      </li>)}
    </ul>
    {shown.length === 0 && <p>No retelling has this topic yet. You can choose another topic or browse the full collection.</p>}
  </section>;
}
