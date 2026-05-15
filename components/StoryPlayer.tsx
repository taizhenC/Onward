"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ClientFigureOutline, Framing } from "@/lib/types";
import { PrefaceCard } from "./PrefaceCard";
import { StoryBeat, type StoryAdvance } from "./StoryBeat";

type Props = {
  sessionId: string;
  outline: ClientFigureOutline;
  framing: Framing;
  initialBeatIndex: number;
  initialChunkIndex: number;
};

type Phase = "preface" | "playing" | "ended";

export function StoryPlayer({
  sessionId,
  outline,
  framing,
  initialBeatIndex,
  initialChunkIndex,
}: Props) {
  const totalBeats = outline.beats.length;
  const [phase, setPhase] = useState<Phase>(() => {
    if (initialBeatIndex >= totalBeats) return "ended";
    if (initialBeatIndex === 0 && initialChunkIndex === 0) return "preface";
    return "playing";
  });
  const [beatIndex, setBeatIndex] = useState(initialBeatIndex);
  const [chunkIndex, setChunkIndex] = useState(initialChunkIndex);

  const isPastEnd = beatIndex >= totalBeats;
  const currentBeat = isPastEnd ? null : outline.beats[beatIndex];

  function handleComplete(next: StoryAdvance) {
    switch (next) {
      case "chunk":
        setChunkIndex((current) => current + 1);
        break;
      case "beat":
        setBeatIndex((current) => current + 1);
        setChunkIndex(0);
        break;
      case "end":
        // Intentional no-op. Per StoryBeat's contract, when next === "end"
        // the Continue button is hidden and the final chunk stays visible
        // with "The journey ends here." underneath. onComplete should not
        // even be called with "end" in normal flow; this branch only runs
        // if a future caller misuses the contract. The "ended" phase is
        // entered exclusively via the refresh path (initialBeatIndex >= total).
        break;
      default: {
        const exhaustive: never = next;
        return exhaustive;
      }
    }
  }

  const revealName = currentBeat?.kind === "bridge";

  return (
    <div className="space-y-12">
      {phase !== "preface" ? (
        <Header outline={outline} framing={framing} revealName={revealName} />
      ) : null}

      <AnimatePresence mode="wait">
        {phase === "preface" ? (
          <PrefaceCard onBegin={() => setPhase("playing")} />
        ) : phase === "playing" && currentBeat ? (
          <motion.div
            key={`${currentBeat.kind}-${beatIndex}-${chunkIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <StoryBeat
              sessionId={sessionId}
              beatIndex={beatIndex}
              chunkIndex={chunkIndex}
              onComplete={handleComplete}
            />
          </motion.div>
        ) : (
          <motion.p
            key="ended"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-[var(--color-ink-soft)]"
          >
            The journey ends here.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Header({
  outline,
  framing,
  revealName,
}: {
  outline: ClientFigureOutline;
  framing: Framing;
  revealName: boolean;
}) {
  const framingLine =
    framing === "definitive"
      ? "Someone who felt this"
      : "A fragment that rhymes";

  if (!revealName) {
    return (
      <header className="space-y-3 pb-6 border-b border-[var(--color-ink-soft)]/30">
        <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
          {framingLine}
        </p>
      </header>
    );
  }

  const lifespan =
    outline.birthYear && outline.deathYear
      ? ` (${outline.birthYear}–${outline.deathYear})`
      : "";

  return (
    <header className="space-y-3 pb-6 border-b border-[var(--color-ink-soft)]/30">
      <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
        {framingLine}
      </p>
      <h1 className="text-2xl">
        {outline.displayName}
        <span className="text-[var(--color-ink-soft)] text-base font-normal">
          {lifespan}
        </span>
      </h1>
    </header>
  );
}
