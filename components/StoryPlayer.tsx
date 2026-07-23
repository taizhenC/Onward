"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type {
  BeatRole,
  ClientFigureOutline,
  Framing,
  OpeningCopy,
  StoryAdvance,
} from "@/lib/types";
import type { StoryTransparency } from "@/lib/story-transparency-types";
import type { ResonanceFeedbackPresentation } from "@/lib/resonance-feedback-types";
import { PrefaceCard } from "./PrefaceCard";
import { SaveStoriesCard } from "./SaveStoriesCard";
import { StoryAfterword } from "./StoryAfterword";
import { ResonanceFeedbackCard } from "./ResonanceFeedbackCard";
import { StoryBeat } from "./StoryBeat";
import {
  consumeFirstContentLatencyBucket,
  sendFirstContentShown,
} from "@/lib/story-visibility-client";

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
  initialFeedback: ResonanceFeedbackPresentation;
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
  initialFeedback,
}: Props) {
  const totalBeats = outline.beats.length;
  const [phase, setPhase] = useState<Phase>(() => {
    if (initialBeatIndex >= totalBeats) return "ended";
    if (initialBeatIndex === 0 && initialChunkIndex === 0) return "preface";
    return "playing";
  });
  const [beatIndex, setBeatIndex] = useState(initialBeatIndex);
  const [chunkIndex, setChunkIndex] = useState(initialChunkIndex);
  const [presentationStartedAt, setPresentationStartedAt] = useState<
    number | null
  >(null);
  const [visiblePassageKey, setVisiblePassageKey] = useState<string | null>(
    null,
  );
  const firstContentReportedRef = useRef(false);
  const passageFocusPendingRef = useRef(false);
  const endingFocusPendingRef = useRef(false);
  // In-flow story finish (StoryBeat's onEnd). The refresh path lands in phase
  // "ended" instead; the save card below covers both.
  const [reachedEnd, setReachedEnd] = useState(false);

  const isPastEnd = beatIndex >= totalBeats;
  const currentBeat = isPastEnd ? null : outline.beats[beatIndex];
  const capturePassageHeading = useCallback((node: HTMLHeadingElement | null) => {
    if (!node || !passageFocusPendingRef.current) return;
    passageFocusPendingRef.current = false;
    requestAnimationFrame(() => {
      if (node.isConnected) node.focus();
    });
  }, []);
  const captureEndingHeading = useCallback((node: HTMLHeadingElement | null) => {
    if (!node || !endingFocusPendingRef.current) return;
    endingFocusPendingRef.current = false;
    requestAnimationFrame(() => {
      if (node.isConnected) node.focus();
    });
  }, []);

  function handlePrefaceVisible() {
    if (
      firstContentReportedRef.current ||
      initialBeatIndex !== 0 ||
      initialChunkIndex !== 0
    ) {
      return;
    }
    firstContentReportedRef.current = true;
    requestAnimationFrame(() => {
      const latencyBucket = consumeFirstContentLatencyBucket(sessionId);
      if (latencyBucket) {
        void sendFirstContentShown(sessionId, latencyBucket);
      }
    });
  }

  function handleComplete(
    next: StoryAdvance,
    nextPresentationStartedAt: number | null,
  ) {
    setPresentationStartedAt(nextPresentationStartedAt);
    switch (next) {
      case "chunk":
        passageFocusPendingRef.current = true;
        setChunkIndex((current) => current + 1);
        break;
      case "beat":
        passageFocusPendingRef.current = true;
        setBeatIndex((current) => current + 1);
        setChunkIndex(0);
        break;
      case "end":
        // Intentional no-op. Per StoryBeat's contract, when next === "end"
        // the in-flow finish is signalled via onEnd, not onComplete. This
        // branch only runs if a future caller misuses the contract. The
        // "ended" phase is entered exclusively via the refresh path
        // (initialBeatIndex >= total).
        break;
      default: {
        const exhaustive: never = next;
        return exhaustive;
      }
    }
  }

  const revealName = phase === "ended" || currentBeat?.kind === "bridge";
  const passageKey = currentBeat
    ? `${currentBeat.kind}-${beatIndex}-${chunkIndex}`
    : null;

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
            onVisible={handlePrefaceVisible}
            onBegin={() => {
              passageFocusPendingRef.current = true;
              setPhase("playing");
            }}
          />
        ) : phase === "playing" && currentBeat ? (
          <motion.section
            key={passageKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onAnimationComplete={() => setVisiblePassageKey(passageKey)}
            aria-labelledby="story-passage-heading"
            aria-describedby="story-passage-cue"
            className="space-y-8"
          >
            <PassageOrientation
              role={currentBeat.role}
              chunkIndex={chunkIndex}
              headingRef={capturePassageHeading}
            />
            <StoryBeat
              sessionId={sessionId}
              beatIndex={beatIndex}
              chunkIndex={chunkIndex}
              presentationStartedAt={presentationStartedAt}
              presentationVisible={visiblePassageKey === passageKey}
              onComplete={handleComplete}
              onEnd={() => {
                endingFocusPendingRef.current = true;
                setReachedEnd(true);
              }}
            />
          </motion.section>
        ) : (
          <motion.section
            key="ended"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            aria-labelledby="story-passage-heading"
            aria-describedby="story-passage-cue"
            className="space-y-8"
          >
            <PassageOrientation role="bridge" chunkIndex={0} />
            {completedBridgeText ? (
              <p className="whitespace-pre-line text-lg leading-relaxed">
                {completedBridgeText}
              </p>
            ) : null}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Sibling of the AnimatePresence region on purpose — inside the mode="wait"
          block it would unmount the final bridge text. Covers both end paths. */}
      {reachedEnd || phase === "ended" ? (
        <section aria-label="After the story" className="space-y-12">
          <ClosingPause headingRef={captureEndingHeading} />
          <StoryAfterword sessionId={sessionId} transparency={transparency} />
          {feedbackAvailable ? (
            <ResonanceFeedbackCard
              key={feedbackPresentationKey(initialFeedback)}
              sessionId={sessionId}
              historicalReportingAvailable={
                transparency?.provenance.status === "editorially_reviewed" &&
                transparency.facts.length > 0
              }
              initialFeedback={initialFeedback}
            />
          ) : null}
          <SaveStoriesCard />
        </section>
      ) : null}
    </div>
  );
}

const CHAPTER_LABELS: Record<BeatRole, string> = {
  scene: "Where it began",
  dark_moment: "The difficult part",
  response: "What came next",
  struggle: "The long middle",
  turning_point: "What began to change",
  became: "What followed",
  bridge: "A reflection for you",
};

function PassageOrientation({
  role,
  chunkIndex,
  headingRef,
}: {
  role: BeatRole;
  chunkIndex: number;
  headingRef?: (node: HTMLHeadingElement | null) => void;
}) {
  const cue =
    role === "bridge"
      ? "The story closes in this reflection. Read at your own pace."
      : chunkIndex > 0
        ? "This chapter continues in another short passage."
        : "Read this short passage at your own pace. Continue opens the next one.";

  return (
    <header className="space-y-2 border-b border-[var(--color-ink-soft)]/20 pb-5">
      <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
        Chapter
      </p>
      <h2
        id="story-passage-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
      >
        {CHAPTER_LABELS[role]}
      </h2>
      <p
        id="story-passage-cue"
        className="font-ui text-sm leading-relaxed text-[var(--color-ink-soft)]"
      >
        {cue}
      </p>
    </header>
  );
}

function ClosingPause({
  headingRef,
}: {
  headingRef: (node: HTMLHeadingElement | null) => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      aria-labelledby="story-ending-heading"
      className="space-y-3 border-t border-[var(--color-ink-soft)]/30 pt-8"
    >
      <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
        Coda
      </p>
      <h2
        id="story-ending-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
      >
        The story can rest here.
      </h2>
      <p className="max-w-prose leading-relaxed text-[var(--color-ink-soft)]">
        Take what felt close. You can leave the rest.
      </p>
    </motion.section>
  );
}

function feedbackPresentationKey(
  presentation: ResonanceFeedbackPresentation,
): string {
  if (presentation.status !== "not_close") return presentation.status;
  const offer = presentation.alternate;
  if (offer.status === "ready") return `not_close:ready:${offer.sessionId}`;
  return `not_close:${offer.status}`;
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
        <h1 className="sr-only">Your Onward story</h1>
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
