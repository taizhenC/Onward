"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type {
  ClientFigureOutline,
  Framing,
  OpeningCopy,
  StoryAdvance,
} from "@/lib/types";
import type { StoryTransparency } from "@/lib/story-transparency-types";
import { PrefaceCard } from "./PrefaceCard";
import { SaveStoriesCard } from "./SaveStoriesCard";
import { StoryAfterword } from "./StoryAfterword";
import { ResonanceFeedbackCard } from "./ResonanceFeedbackCard";
import { StoryBeat } from "./StoryBeat";

type Props = {
  sessionId: string;
  outline: ClientFigureOutline;
  openingCopy: OpeningCopy;
  contentNote: string | null;
  transparency: StoryTransparency | null;
  framing: Framing;
  initialBeatIndex: number;
  initialChunkIndex: number;
  completedBridgeText: string | null;
  feedbackAvailable: boolean;
};

type Phase = "preface" | "playing" | "ended";

export function StoryPlayer({
  sessionId,
  outline,
  openingCopy,
  contentNote,
  transparency,
  framing,
  initialBeatIndex,
  initialChunkIndex,
  completedBridgeText,
  feedbackAvailable,
}: Props) {
  const totalBeats = outline.beats.length;
  const [phase, setPhase] = useState<Phase>(() => {
    if (initialBeatIndex >= totalBeats) return "ended";
    if (initialBeatIndex === 0 && initialChunkIndex === 0) return "preface";
    return "playing";
  });
  const [beatIndex, setBeatIndex] = useState(initialBeatIndex);
  const [chunkIndex, setChunkIndex] = useState(initialChunkIndex);
  // In-flow story finish (StoryBeat's onEnd). The refresh path lands in phase
  // "ended" instead; the save card below covers both.
  const [reachedEnd, setReachedEnd] = useState(false);

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
        // Intentional no-op. Per StoryBeat's contract the acknowledged finish
        // arrives via onEnd, never onComplete — the final chunk stays visible
        // and the save card renders below it. This branch only runs if a
        // future caller misuses the contract. The "ended" phase is entered
        // exclusively via the refresh path (initialBeatIndex >= total).
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
        <Header outline={outline} eyebrow={openingCopy.eyebrow} revealName={revealName} />
      ) : null}

      <AnimatePresence mode="wait">
        {phase === "preface" ? (
          <PrefaceCard
            lines={openingCopy.prefaceLines}
            contentNote={contentNote}
            framing={framing}
            onBegin={() => setPhase("playing")}
          />
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
              onEnd={() => setReachedEnd(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="ended"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {completedBridgeText ? (
              <p className="whitespace-pre-line text-lg leading-relaxed">
                {completedBridgeText}
              </p>
            ) : null}
            <p className="text-[var(--color-ink-soft)]">The journey ends here.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sibling of the AnimatePresence region on purpose — inside the mode="wait"
          block it would unmount the final bridge text. Covers both end paths. */}
      {reachedEnd || phase === "ended" ? (
        <>
          <StoryAfterword sessionId={sessionId} transparency={transparency} />
          {feedbackAvailable ? (
            <ResonanceFeedbackCard
              sessionId={sessionId}
              historicalReportingAvailable={
                transparency?.provenance.status === "editorially_reviewed" &&
                transparency.facts.length > 0
              }
            />
          ) : null}
          <SaveStoriesCard />
        </>
      ) : null}
    </div>
  );
}

function Header({
  outline,
  eyebrow,
  revealName,
}: {
  outline: ClientFigureOutline;
  eyebrow: string;
  revealName: boolean;
}) {
  if (!revealName) {
    return (
      <header className="space-y-3 pb-6 border-b border-[var(--color-ink-soft)]/30">
        <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
          {eyebrow}
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
        {eyebrow}
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
