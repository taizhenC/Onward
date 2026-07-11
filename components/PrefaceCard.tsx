"use client";

import { motion } from "motion/react";

type Props = {
  lines: readonly string[];
  contentNote: string | null;
  onBegin: () => void;
};

// The preface copy is supplied by the opening-copy layer (lib/opening-copy.ts →
// DEFAULT_PREFACE_LINES today). Phase 1 personalizes those lines from the user's intake
// language in lib/llm-real.ts; this component just renders whatever it is handed.
export function PrefaceCard({ lines, contentNote, onBegin }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-8 pt-8"
    >
      <div className="space-y-5 text-xl leading-relaxed">
        {lines.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>

      {contentNote ? (
        <aside
          aria-label="Content note"
          className="border-l-2 border-[var(--color-ink-faint)] pl-4 text-[var(--color-ink-soft)]"
        >
          <p className="font-ui text-xs font-medium uppercase tracking-widest">
            Content note
          </p>
          <p className="mt-2 text-base leading-relaxed">{contentNote}</p>
        </aside>
      ) : null}

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
