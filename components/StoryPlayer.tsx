"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ClientFigureOutline, Framing } from "@/lib/types";
import { DecisionCards } from "./DecisionCards";
import { StoryBeat } from "./StoryBeat";

type Props = {
  sessionId: string;
  outline: ClientFigureOutline;
  framing: Framing;
  initialBeatIndex: number;
};

export function StoryPlayer({
  sessionId,
  outline,
  framing,
  initialBeatIndex,
}: Props) {
  const [beatIndex, setBeatIndex] = useState(initialBeatIndex);
  const [chooseError, setChooseError] = useState<string | null>(null);

  const totalBeats = outline.beats.length;
  const isPastEnd = beatIndex >= totalBeats;
  const currentBeat = isPastEnd ? null : outline.beats[beatIndex];
  const isFinalBeat = beatIndex === totalBeats - 1;

  async function handlePick(label: string) {
    setChooseError(null);
    let response: Response;
    try {
      response = await fetch("/api/choose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, beatIndex, choice: label }),
      });
    } catch {
      setChooseError("The connection dropped. Please try again.");
      throw new Error("network");
    }
    if (!response.ok) {
      setChooseError("This choice could not be recorded.");
      throw new Error("response");
    }
    const data = (await response.json()) as { nextBeatIndex: number };
    setBeatIndex(data.nextBeatIndex);
  }

  return (
    <div className="space-y-12">
      <Header outline={outline} framing={framing} />

      <AnimatePresence mode="wait">
        {currentBeat ? (
          <motion.div
            key={`${currentBeat.kind}-${beatIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {currentBeat.kind === "decision" ? (
              <DecisionCards
                options={currentBeat.options}
                onPick={handlePick}
              />
            ) : (
              <StoryBeat
                sessionId={sessionId}
                beatIndex={beatIndex}
                isFinal={isFinalBeat}
                onComplete={() => setBeatIndex((current) => current + 1)}
              />
            )}
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

      {chooseError ? (
        <p className="font-ui text-sm text-[var(--color-accent)]">
          {chooseError}
        </p>
      ) : null}
    </div>
  );
}

function Header({
  outline,
  framing,
}: {
  outline: ClientFigureOutline;
  framing: Framing;
}) {
  const lifespan =
    outline.birthYear && outline.deathYear
      ? ` (${outline.birthYear}–${outline.deathYear})`
      : "";
  const framingLine =
    framing === "definitive"
      ? "Someone who felt this"
      : "A fragment that rhymes";

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
