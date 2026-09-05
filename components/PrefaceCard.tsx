"use client";

import { motion } from "motion/react";
import type { Framing } from "@/lib/types";

type Props = {
  lines: readonly string[];
  contentNote: string | null;
  framing: Framing;
  hasSourceRecord: boolean;
  onBegin: () => void;
  onVisible: () => void;
};

// The preface copy is supplied by the opening-copy layer. This component also
// makes partial-match distance explicit before any story text is revealed.
export function PrefaceCard({
  lines,
  contentNote,
  framing,
  hasSourceRecord,
  onBegin,
  onVisible,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      onAnimationComplete={onVisible}
      className="space-y-8 pt-8"
    >
      <div className="space-y-5 text-xl leading-relaxed">
        {lines.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
        This is a real person&apos;s story, told in our words. Their name comes
        at the end.
        {hasSourceRecord ? (
          <> The record and any scene details we imagined are listed there too.</>
        ) : null}
      </p>

      {framing === "partial" ? (
        <aside
          aria-label="How this story relates"
          className="border-l-2 border-[var(--color-accent)] pl-4 text-[var(--color-ink-soft)]"
        >
          <p className="font-ui text-xs font-medium uppercase tracking-widest">
            A partial parallel
          </p>
          <p className="mt-2 text-base leading-relaxed">
            This is not the same situation. One part of this life may still rhyme
            with what you are carrying.
          </p>
        </aside>
      ) : null}

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
        onClick={() => {
          // A very fast reader can activate Begin before the fade completes;
          // that interaction itself proves the preface was readable.
          onVisible();
          onBegin();
        }}
        className="inline-flex min-h-11 items-center border border-[var(--color-rule-strong)] px-7 py-[10px] text-[15px] tracking-[0.14em] text-[var(--color-accent-deep)] [font-variant-caps:small-caps] transition-colors hover:border-[var(--color-accent-deep)] hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)]"
      >
        Begin
      </button>
    </motion.div>
  );
}
