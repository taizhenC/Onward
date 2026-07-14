"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  // Fired once after the reader explicitly acknowledges the final passage.
  // Separate channel from onComplete, whose contract excludes "end". Required:
  // without a handler the acknowledged finish would have nowhere to go and the
  // reader would be left on a dead button.
  onEnd: () => void;
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
  const [failure, setFailure] = useState<FailureKind | null>(null);
  const [nextStep, setNextStep] = useState<StoryAdvance | null>(null);
  // Guards the Continue advance so it fires exactly once per passage. The exiting
  // StoryBeat (kept mounted during StoryPlayer's mode="wait" fade) keeps this true,
  // so repeat clicks during the fade can't push the position past the ack'd
  // session position — the cause of the /api/beat 409.
  const [advancing, setAdvancing] = useState(false);
  // The final passage was acknowledged. Hides Finish story so the closing text
  // stands alone next to whatever the parent renders for the story's end.
  const [ended, setEnded] = useState(false);

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
  // The not-yet-revealed tail, rendered invisible so the passage reserves its full
  // height from the start — the Continue button below stays put instead of sliding
  // down as words appear (and screen readers get the whole passage immediately).
  const hiddenText = tokens.slice(revealedCount).join("");
  const revealComplete = streamDone && revealedCount >= totalTokens;
  const hasMoreToReveal = !streamDone || revealedCount < totalTokens;
  const canSkip = !skipped && hasMoreToReveal && totalTokens > 0;
  const showCaret = hasMoreToReveal && totalTokens > 0;

  // Network: deliver the current chunk without changing durable progress. The
  // reader's explicit Continue/Finish action below owns acknowledgement.
  useEffect(() => {
    setFullText("");
    setRevealedCount(0);
    setSkipped(false);
    setStreamDone(false);
    setFailure(null);
    setNextStep(null);
    setAdvancing(false);
    setEnded(false);

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
        if (!cancelled) {
          setNextStep(headerNext);
          setStreamDone(true);
        }
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

  // Stable across reveal ticks so the global-listener effect below doesn't
  // re-attach every 40ms (canSkip and totalTokens only change on new chunks
  // or when the reveal finishes).
  const handleSkip = useCallback(() => {
    if (!canSkip) return;
    setSkipped(true);
    setRevealedCount(totalTokens);
  }, [canSkip, totalTokens]);

  // Global click & space-to-skip handling during animation
  useEffect(() => {
    if (!canSkip) return;

    function handleGlobalClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      // Do not skip if user clicks on a button, link, or input fields
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("input") ||
        target.closest("textarea")
      ) {
        return;
      }
      handleSkip();
    }

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (event.key === " ") {
        const target = event.target as HTMLElement;
        // Do not skip if user is typing in an input, textarea, or contenteditable
        // element, or activating a focused button/link (preventDefault would
        // swallow space-activation, e.g. the failure Refresh button).
        if (
          target.closest("button") ||
          target.closest("a") ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        event.preventDefault(); // prevent scrolling the page
        handleSkip();
      }
    }

    document.addEventListener("click", handleGlobalClick);
    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [canSkip, handleSkip]);

  async function handleAdvance() {
    if (advancing || nextStep === null || !revealComplete) return;
    setAdvancing(true);
    const result = await acknowledgeBeat({
      sessionId,
      beatIndex,
      chunkIndex,
      fallbackNext: nextStep,
    });
    if (!result.ok) {
      setFailure(result.failure);
      setAdvancing(false);
      return;
    }
    if (result.next === "end") {
      setEnded(true);
      onEndRef.current();
      return;
    }
    onComplete(result.next);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="whitespace-pre-wrap">
          {revealedText}
          {showCaret ? (
            <span
              aria-hidden
              className="ml-[3px] inline-block h-[1.05em] w-[2px] bg-[var(--color-accent)] align-[-2px]"
              style={{ animation: "ow-blink 1s step-end infinite" }}
            />
          ) : null}
          {hiddenText ? <span className="opacity-0">{hiddenText}</span> : null}
        </p>
      </div>

      {canSkip ? (
        <button
          type="button"
          onClick={handleSkip}
          className="font-ui text-xs tracking-wide text-[var(--color-ink-soft)] underline decoration-[var(--color-ink-soft)]/40 underline-offset-4 hover:text-[var(--color-ink)]"
        >
          Show full passage
        </button>
      ) : null}

      {failure ? <BeatFailure kind={failure} /> : null}

      {/* Progress changes only after the complete passage is visible and the
          reader deliberately acknowledges it. Clicking anywhere or pressing space
          skips the animation, which is what makes this button appear. */}
      {!failure && !ended && revealComplete && nextStep !== null ? (
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
          {nextStep === "end" ? "Finish story" : "Continue"}
        </button>
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
  signal?: AbortSignal;
};

// Distinguishes why an ack failed so the reader sees the right recovery copy:
// a dropped connection is not "we lost your place", and a 404 means the story
// itself is gone, not the position.
type AcknowledgeBeatResult =
  | { ok: true; next: StoryAdvance }
  | { ok: false; failure: FailureKind };

async function acknowledgeBeat({
  sessionId,
  beatIndex,
  chunkIndex,
  fallbackNext,
  signal,
}: AcknowledgeBeatInput): Promise<AcknowledgeBeatResult> {
  let response: Response;
  try {
    response = await fetch("/api/beat/ack", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, beatIndex, chunkIndex }),
      signal,
    });
  } catch {
    return { ok: false, failure: "connection" };
  }

  if (!response.ok) {
    return { ok: false, failure: failureFromStatus(response.status) };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: true, next: fallbackNext };
  }

  if (body !== null && typeof body === "object" && "next" in body) {
    return {
      ok: true,
      next: parseNextStep((body as { next: unknown }).next, fallbackNext),
    };
  }

  return { ok: true, next: fallbackNext };
}

function parseNextStep(value: unknown, fallback: StoryAdvance = "end"): StoryAdvance {
  if (value === "chunk" || value === "beat" || value === "end") {
    return value;
  }
  return fallback;
}
