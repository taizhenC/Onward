"use client";

import { motion } from "motion/react";

type Props = {
  onBegin: () => void;
};

// Phase 1 replaces this universal copy with LLM-personalized preface text
// generated from the user's intake language.
export function PrefaceCard({ onBegin }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-8 pt-8"
    >
      <div className="space-y-5 text-xl leading-relaxed">
        <p>That hurts.</p>
        <p>You do not have to solve everything right now.</p>
        <p>Here is someone who stood in a similar kind of weight.</p>
        <p>Let's start with their story.</p>
      </div>

      <button
        type="button"
        onClick={onBegin}
        className="font-ui text-sm uppercase tracking-wider border border-[var(--color-ink-soft)] px-5 py-2 hover:border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] transition-colors"
      >
        Begin
      </button>
    </motion.div>
  );
}
