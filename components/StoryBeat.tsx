"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import type { StoryAdvance } from "@/lib/types";

// Client-owned reveal pacing (the server no longer delays — see lib/llm-stub.ts).
// Mirrors the landing-page StoryDemo's word-by-word feel. The reveal is a plain
// JS timer (content pacing), so it always plays — reduced-motion is honored for
// the decorative caret blink via the global prefers-reduced-motion CSS rule, the
// same way the demo handles it.
const STREAM_SPEED_MS = 40;

type Props = {
  sessionId: string;
  beatIndex: number;
  chunkIndex: number;
  onComplete: (next: StoryAdvance) => void;
  // Fired once when the ack resolves next === "end" (the in-flow story finish).
  // Separate channel from onComplete, whose contract excludes "end".
  onEnd?: () => void;
};

type FailureKind = "notfound" | "conflict" | "connection" | "generic";

export function StoryBeat({
  sessionId,
  beatIndex,
  chunkIndex,
  onComplete,
  onEnd,
}: Props) {
  const [fullText, setFullText] = useState("");
  const [revealedCount, setRevealedCount] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const [done, setDone] = useState(false);
  const [failure, setFailure] = useState<FailureKind | null>(null);
  const [nextStep, setNextStep] = useState<StoryAdvance | null>(null);
  // Guards the Continue advance so it fires exactly once per passage. The exiting
  // StoryBeat (kept mounted during StoryPlayer's mode="wait" fade) keeps this true,
  // so repeat clicks during the fade can't push the position past the ack'd
  // session position — the cause of the /api/beat 409.
  const [advancing, setAdvancing] = useState(false);

  // Ref so the streaming effect below doesn't list onEnd as a dependency — a parent
  // re-render handing in a fresh closure must not abort and restart the stream.
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  // Whitespace-preserving word tokens (same split the server used), so slicing
  // keeps spacing and paragraph breaks intact under whitespace-pre-wrap.
  const tokens = useMemo(() => fullText.match(/\s*\S+\s*/g) ?? [], [fullText]);
  const totalTokens = tokens.length;
  // Current token count for the interval's functional update without re-subscribing.
  // Synced in an effect (not during render) so the write stays purity-safe.
  const totalRef = useRef(0);
  useEffect(() => {
    totalRef.current = totalTokens;
  }, [totalTokens]);

  const revealedText = tokens.slice(0, revealedCount).join("");
  const revealComplete = streamDone && revealedCount >= totalTokens;
  const hasMoreToReveal = !streamDone || revealedCount < totalTokens;
  const canSkip = !skipped && hasMoreToReveal && totalTokens > 0;
  const showCaret = hasMoreToReveal && totalTokens > 0;

  // Network: stream the chunk, then ack to advance the session.
  useEffect(() => {
    setFullText("");
    setRevealedCount(0);
    setSkipped(false);
    setStreamDone(false);
    setDone(false);
    setFailure(null);
    setNextStep(null);
    setAdvancing(false);

    const controller = new AbortController();
    let cancelled = false;

    async function run() {
      let response: Response;
      try {
        response = await fetch("/api/beat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId, beatIndex, chunkIndex }),
          signal: controller.signal,
        });
      } catch (caught) {
        if (cancelled || (caught as Error).name === "AbortError") return;
        setFailure("connection");
        return;
      }

      if (!response.ok || !response.body) {
        if (!cancelled) setFailure(failureFromStatus(response.status));
        return;
      }

      const headerNext = parseNextStep(response.headers.get("x-onward-next"));
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { value, done: streamEnded } = await reader.read();
          if (cancelled) return;
          if (streamEnded) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk.length > 0) {
            setFullText((previous) => previous + chunk);
          }
        }
        const lastChunk = decoder.decode();
        if (lastChunk.length > 0) {
          setFullText((previous) => previous + lastChunk);
        }
        if (!cancelled) setStreamDone(true);

        const next = await acknowledgeBeat({
          sessionId,
          beatIndex,
          chunkIndex,
          fallbackNext: headerNext,
          signal: controller.signal,
        });
        if (cancelled) return;
        if (next === null) {
          // The ack didn't land (position conflict / lost place). Offer a refresh,
          // which re-reads the true session position server-side.
          setFailure("conflict");
          return;
        }
        setNextStep(next);
        setDone(true);
        if (next === "end") onEndRef.current?.();
      } catch (caught) {
        if (cancelled || (caught as Error).name === "AbortError") return;
        setFailure("connection");
      }
    }

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [sessionId, beatIndex, chunkIndex]);

  // Reveal pacing: a local timer walks revealedCount toward the buffered token
  // count. It pauses when caught up (no-op until more text lands) and stops once
  // the reveal is complete. Skipping bypasses it via the sync effect below.
  useEffect(() => {
    if (skipped || revealComplete) return;
    const id = setInterval(() => {
      setRevealedCount((current) =>
        current < totalRef.current ? current + 1 : current,
      );
    }, STREAM_SPEED_MS);
    return () => clearInterval(id);
  }, [skipped, revealComplete]);

  // Skip: pin the reveal to the full buffer, and keep it pinned as any remaining
  // text arrives.
  useEffect(() => {
    if (skipped) {
      setRevealedCount(totalTokens);
    }
  }, [skipped, totalTokens]);

  function handleSkip() {
    if (!canSkip) return;
    setSkipped(true);
    setRevealedCount(totalTokens);
  }

  function handleAdvance() {
    if (advancing || nextStep === null || nextStep === "end") return;
    setAdvancing(true);
    onComplete(nextStep);
  }

  return (
    <div className="space-y-8">
      <div
        onDoubleClick={canSkip ? handleSkip : undefined}
        onKeyDown={
          canSkip
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleSkip();
                }
              }
            : undefined
        }
        role={canSkip ? "button" : undefined}
        tabIndex={canSkip ? 0 : -1}
        aria-label={canSkip ? "Show the rest of this passage" : undefined}
        className={`focus-visible:outline-offset-4 focus-visible:[outline:2px_solid_var(--color-accent)]${
          canSkip ? " select-none" : ""
        }`}
      >
        {/* Screen readers read the full text immediately, avoiding partial/choppy reading */}
        <div className="sr-only" aria-live="polite">
          {fullText}
        </div>
        {/* Sighted users see the text streaming in cleanly without inline opacity wrapping */}
        <p className="whitespace-pre-wrap" aria-hidden="true">
          {revealedText}
          {showCaret ? (
            <span
              className="ml-[3px] inline-block h-[1.05em] w-[2px] bg-[var(--color-accent)] align-[-2px]"
              style={{ animation: "ow-blink 1s step-end infinite" }}
            />
          ) : null}
        </p>
      </div>

      {failure ? <BeatFailure kind={failure} /> : null}

      {/* Continue appears as soon as the ack lands — i.e. during the reveal too —
          so it's a distinct target from the double-click-to-accelerate on the text:
          a single click on Continue advances; a double-click on the passage only
          speeds the reveal. */}
      {!failure && done && nextStep !== null && nextStep !== "end" ? (
        <button
          type="button"
          onClick={handleAdvance}
          disabled={advancing}
          className={`font-ui text-sm uppercase tracking-wider border border-[var(--color-ink-soft)] px-5 py-2 transition-colors ${
            advancing
              ? "pointer-events-none opacity-40"
              : "hover:border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)]"
          }`}
        >
          Continue
        </button>
      ) : null}

      {!failure && done && nextStep === "end" && revealComplete ? (
        <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)] pt-4">
          The journey ends here.
        </p>
      ) : null}
    </div>
  );
}

function BeatFailure({ kind }: { kind: FailureKind }) {
  const actionClass =
    "inline-block font-ui text-sm uppercase tracking-wider border border-[var(--color-ink-soft)] px-5 py-2 transition-colors hover:border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)]";

  if (kind === "notfound") {
    return (
      <div className="space-y-3">
        <p className="font-ui text-sm text-[var(--color-accent)]">
          This story has drifted away.
        </p>
        <Link href="/begin" className={actionClass}>
          Begin a new story
        </Link>
      </div>
    );
  }

  const message =
    kind === "conflict"
      ? "We lost your place for a moment."
      : kind === "connection"
        ? "The connection dropped."
        : "This beat could not be loaded.";

  return (
    <div className="space-y-3">
      <p className="font-ui text-sm text-[var(--color-accent)]">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className={actionClass}
      >
        Refresh
      </button>
    </div>
  );
}

function failureFromStatus(status: number): FailureKind {
  if (status === 404) return "notfound";
  if (status === 409) return "conflict";
  return "generic";
}

type AcknowledgeBeatInput = {
  sessionId: string;
  beatIndex: number;
  chunkIndex: number;
  fallbackNext: StoryAdvance;
  signal: AbortSignal;
};

async function acknowledgeBeat({
  sessionId,
  beatIndex,
  chunkIndex,
  fallbackNext,
  signal,
}: AcknowledgeBeatInput): Promise<StoryAdvance | null> {
  let response: Response;
  try {
    response = await fetch("/api/beat/ack", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, beatIndex, chunkIndex }),
      signal,
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return fallbackNext;
  }

  if (body !== null && typeof body === "object" && "next" in body) {
    return parseNextStep((body as { next: unknown }).next, fallbackNext);
  }

  return fallbackNext;
}

function parseNextStep(value: unknown, fallback: StoryAdvance = "end"): StoryAdvance {
  if (value === "chunk" || value === "beat" || value === "end") {
    return value;
  }
  return fallback;
}
