"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";

import {
  acknowledgeStoryPassage,
  beatFailureFromStatus,
  beatFailureRecovery,
  parseStoryAdvance,
  type BeatFailureKind,
  type BeatRequestPhase,
} from "@/lib/story-beat-network";
import {
  elapsedLatencyBucket,
  monotonicEpochMs,
  sendPassagePresented,
} from "@/lib/story-visibility-client";
import type { StoryAdvance } from "@/lib/types";

// Client-owned reveal pacing (the server no longer delays — see lib/llm-stub.ts).
// Readers who request reduced motion receive each buffered passage immediately;
// everyone else can reveal it at once with the explicit control below.
const STREAM_SPEED_MS = 40;
const LOADING_DELAY_MS = 350;
const DELIVERY_TIMEOUT_MS = 15_000;
const ACKNOWLEDGEMENT_TIMEOUT_MS = 12_000;

type Props = {
  sessionId: string;
  beatIndex: number;
  chunkIndex: number;
  presentationStartedAt: number | null;
  presentationVisible: boolean;
  onComplete: (
    next: StoryAdvance,
    presentationStartedAt: number | null,
  ) => void;
  // Fired once after the reader explicitly acknowledges the final passage.
  // Separate channel from onComplete, whose contract excludes "end". Required:
  // without a handler the acknowledged finish would have nowhere to go and the
  // reader would be left on a dead button.
  onEnd: () => void;
};

type BeatFailure = Readonly<{
  kind: BeatFailureKind;
  phase: BeatRequestPhase;
}>;

export function StoryBeat({
  sessionId,
  beatIndex,
  chunkIndex,
  presentationStartedAt,
  presentationVisible,
  onComplete,
  onEnd,
}: Props) {
  const shouldReduceMotion = useReducedMotion() === true;
  const [fullText, setFullText] = useState("");
  const [revealedCount, setRevealedCount] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const [failure, setFailure] = useState<BeatFailure | null>(null);
  const [nextStep, setNextStep] = useState<StoryAdvance | null>(null);
  const [deliveryAttempt, setDeliveryAttempt] = useState(0);
  const [deliveryPending, setDeliveryPending] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  // Guards the Continue advance so it fires exactly once per passage. The exiting
  // StoryBeat (kept mounted during StoryPlayer's mode="wait" fade) keeps this true,
  // so repeat clicks during the fade can't push the position past the ack'd
  // session position — the cause of the /api/beat 409.
  const [advancing, setAdvancing] = useState(false);
  const advancingRef = useRef(false);
  const deliveryInFlightRef = useRef(false);
  const acknowledgementControllerRef = useRef<AbortController | null>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const endReportedRef = useRef(false);
  const presentationReportedRef = useRef(false);

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

  const visibleTokenCount = shouldReduceMotion ? totalTokens : revealedCount;
  const revealedText = tokens.slice(0, visibleTokenCount).join("");
  // The not-yet-revealed tail, rendered invisible so the passage reserves its full
  // height from the start — the Continue button below stays put instead of sliding
  // down as words appear (and screen readers get the whole passage immediately).
  const hiddenText = tokens.slice(visibleTokenCount).join("");
  const revealComplete = streamDone && visibleTokenCount >= totalTokens;
  const hasMoreToReveal = !streamDone || visibleTokenCount < totalTokens;
  const canSkip =
    !shouldReduceMotion && !skipped && hasMoreToReveal && totalTokens > 0;

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
    advancingRef.current = false;
    setDeliveryPending(true);
    setShowLoading(false);
    setAnnouncement(
      deliveryAttempt > 0 ? "Trying to bring the passage back." : "",
    );
    deliveryInFlightRef.current = true;

    const controller = new AbortController();
    let cancelled = false;
    let deliveryTimedOut = false;
    const loadingTimer = window.setTimeout(() => {
      if (!cancelled) setShowLoading(true);
    }, LOADING_DELAY_MS);
    const deliveryTimer = window.setTimeout(() => {
      deliveryTimedOut = true;
      controller.abort();
    }, DELIVERY_TIMEOUT_MS);

    function stopLoading() {
      window.clearTimeout(loadingTimer);
      setShowLoading(false);
    }

    function failDelivery(kind: BeatFailureKind) {
      if (cancelled) return;
      stopLoading();
      window.clearTimeout(deliveryTimer);
      deliveryInFlightRef.current = false;
      setDeliveryPending(false);
      // Never leave a truncated passage on screen after a mid-stream failure.
      setFullText("");
      setRevealedCount(0);
      setStreamDone(false);
      setNextStep(null);
      setFailure({ kind, phase: "delivery" });
      setAnnouncement("");
    }

    async function run() {
      let response: Response;
      try {
        response = await fetch("/api/beat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId, beatIndex, chunkIndex }),
          signal: controller.signal,
        });
      } catch {
        if (
          cancelled ||
          (controller.signal.aborted && !deliveryTimedOut)
        ) {
          return;
        }
        failDelivery("connection");
        return;
      }

      if (!response.ok || !response.body) {
        failDelivery(beatFailureFromStatus(response.status));
        return;
      }

      const headerNext = parseStoryAdvance(
        response.headers.get("x-onward-next"),
      );
      if (headerNext === null) {
        void response.body.cancel().catch(() => undefined);
        failDelivery("generic");
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { value, done: streamEnded } = await reader.read();
          if (cancelled) return;
          if (streamEnded) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk.length > 0) {
            stopLoading();
            setFullText((previous) => previous + chunk);
          }
        }
        const lastChunk = decoder.decode();
        if (lastChunk.length > 0) {
          stopLoading();
          setFullText((previous) => previous + lastChunk);
        }
        if (!cancelled) {
          stopLoading();
          window.clearTimeout(deliveryTimer);
          deliveryInFlightRef.current = false;
          setDeliveryPending(false);
          setNextStep(headerNext);
          setStreamDone(true);
          setAnnouncement("Passage ready.");
        }
      } catch {
        if (
          cancelled ||
          (controller.signal.aborted && !deliveryTimedOut)
        ) {
          return;
        }
        failDelivery("connection");
      }
    }

    run();

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
      window.clearTimeout(deliveryTimer);
      deliveryInFlightRef.current = false;
      controller.abort();
    };
  }, [sessionId, beatIndex, chunkIndex, deliveryAttempt]);

  useEffect(() => {
    return () => acknowledgementControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!failure) return;
    const frame = requestAnimationFrame(() => failureRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [failure]);

  // The complete stored passage is already committed to the DOM (including
  // its height-reserving hidden tail). Two frames allow layout/paint before we
  // stop the transition clock; the optional word reveal is deliberately not
  // part of the latency SLO.
  useEffect(() => {
    if (
      presentationReportedRef.current ||
      presentationStartedAt === null ||
      !presentationVisible ||
      !streamDone ||
      fullText.length === 0 ||
      failure
    ) {
      return;
    }
    let firstFrame = 0;
    let secondFrame = 0;
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (presentationReportedRef.current) return;
        const latencyBucket = elapsedLatencyBucket(presentationStartedAt);
        if (!latencyBucket) return;
        presentationReportedRef.current = true;
        void sendPassagePresented({
          sessionId,
          beatIndex,
          chunkIndex,
          latencyBucket,
        });
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [
    beatIndex,
    chunkIndex,
    failure,
    fullText,
    presentationStartedAt,
    presentationVisible,
    sessionId,
    streamDone,
  ]);

  // Reveal pacing: a local timer walks revealedCount toward the buffered token
  // count. It pauses when caught up (no-op until more text lands) and stops once
  // the reveal is complete. Skipping bypasses it via the sync effect below.
  useEffect(() => {
    if (shouldReduceMotion || skipped || revealComplete) return;
    const id = setInterval(() => {
      setRevealedCount((current) =>
        current < totalRef.current ? current + 1 : current,
      );
    }, STREAM_SPEED_MS);
    return () => clearInterval(id);
  }, [shouldReduceMotion, skipped, revealComplete]);

  // Keep already buffered words visible if the OS preference changes while a
  // passage is open; turning motion back on must never make text disappear.
  useEffect(() => {
    if (shouldReduceMotion) setRevealedCount(totalTokens);
  }, [shouldReduceMotion, totalTokens]);

  // Skip: pin the reveal to the full buffer, and keep it pinned as any remaining
  // text arrives.
  useEffect(() => {
    if (skipped) {
      setRevealedCount(totalTokens);
    }
  }, [skipped, totalTokens]);

  // Stable across reveal ticks so the global click effect below doesn't
  // re-attach every 40ms (canSkip and totalTokens only change on new chunks
  // or when the reveal finishes).
  const handleSkip = useCallback(() => {
    if (!canSkip) return;
    setSkipped(true);
    setRevealedCount(totalTokens);
  }, [canSkip, totalTokens]);

  // A non-interactive page click may still reveal the buffered passage. Keyboard
  // readers use the explicit button; Space remains available for page scrolling.
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

    document.addEventListener("click", handleGlobalClick);

    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, [canSkip, handleSkip]);

  function handleDeliveryRetry() {
    if (deliveryInFlightRef.current) return;
    deliveryInFlightRef.current = true;
    setFailure(null);
    setDeliveryPending(true);
    setAnnouncement("Trying to bring the passage back.");
    setDeliveryAttempt((current) => current + 1);
  }

  async function handleAdvance() {
    if (advancingRef.current || nextStep === null || !revealComplete) return;
    advancingRef.current = true;
    setAdvancing(true);
    setFailure(null);
    setAnnouncement("Saving your place.");
    const startedAt = monotonicEpochMs();
    const controller = new AbortController();
    acknowledgementControllerRef.current = controller;
    let acknowledgementTimedOut = false;
    const acknowledgementTimer = window.setTimeout(() => {
      acknowledgementTimedOut = true;
      controller.abort();
    }, ACKNOWLEDGEMENT_TIMEOUT_MS);
    const acknowledged = await acknowledgeStoryPassage({
      sessionId,
      beatIndex,
      chunkIndex,
      signal: controller.signal,
    });
    window.clearTimeout(acknowledgementTimer);
    if (controller.signal.aborted && !acknowledgementTimedOut) return;
    acknowledgementControllerRef.current = null;

    if (!acknowledged.ok) {
      advancingRef.current = false;
      setAdvancing(false);
      setFailure({ kind: acknowledged.kind, phase: "acknowledgement" });
      setAnnouncement("");
      return;
    }

    if (acknowledged.next === "end") {
      if (endReportedRef.current) return;
      endReportedRef.current = true;
      setNextStep(null);
      setAdvancing(false);
      setAnnouncement("Story finished.");
      onEndRef.current();
      return;
    }
    onComplete(acknowledged.next, startedAt);
  }

  return (
    <div className="space-y-8">
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </p>

      {showLoading && deliveryPending && fullText.length === 0 && !failure ? (
        <PassageLoading />
      ) : null}

      <div aria-busy={deliveryPending}>
        {/* The passage is the product; it should be the largest thing on the
            screen, not the same size as the interface around it. At 20px inside
            the 36rem column the line settles near 65 characters, which is the
            range long-form reading research keeps landing on and which the
            previous 18px setting overshot. text-pretty keeps a lone word off the
            last line of a two-sentence passage, where an orphan is very visible. */}
        <p className="whitespace-pre-wrap text-[20px] leading-[1.75] text-pretty">
          {revealedText}
          {hiddenText ? <span className="opacity-0">{hiddenText}</span> : null}
        </p>
      </div>

      {canSkip ? (
        <button
          type="button"
          onClick={handleSkip}
          className="-mx-2 inline-flex min-h-11 items-center px-2 font-ui text-xs tracking-wide text-[var(--color-ink-soft)] underline decoration-[var(--color-ink-soft)]/40 underline-offset-4 hover:text-[var(--color-ink)]"
        >
          Show full passage
        </button>
      ) : null}

      {failure ? (
        <div
          ref={failureRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="outline-none"
        >
          <BeatFailure
            failure={failure}
            advanceLabel={nextStep === "end" ? "Finish story" : "Continue"}
            onRetry={
              failure.phase === "delivery"
                ? handleDeliveryRetry
                : handleAdvance
            }
          />
        </div>
      ) : null}

      {/* Progress changes only after the complete passage is visible and the
          reader deliberately acknowledges it. The explicit reveal action or a
          non-interactive page click makes this button appear. */}
      {!failure && revealComplete && nextStep !== null ? (
        <button
          type="button"
          onClick={handleAdvance}
          disabled={advancing}
          className={`min-h-11 font-ui text-sm uppercase tracking-wider border border-[var(--color-ink-soft)] px-5 py-2 transition-colors ${
            advancing
              ? "pointer-events-none opacity-40"
              : "hover:border-[var(--color-accent-deep)] hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)]"
          }`}
        >
          {advancing
            ? "Saving…"
            : nextStep === "end"
              ? "Finish story"
              : "Continue"}
        </button>
      ) : null}
    </div>
  );
}

function PassageLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-4 text-[var(--color-ink-soft)]"
    >
      <p className="font-ui text-sm">Bringing the next passage into view…</p>
      <div aria-hidden="true" className="space-y-3 opacity-30">
        <div className="h-px w-full bg-[var(--color-ink-soft)]" />
        <div className="h-px w-5/6 bg-[var(--color-ink-soft)]" />
        <div className="h-px w-2/3 bg-[var(--color-ink-soft)]" />
      </div>
    </div>
  );
}

function BeatFailure({
  failure,
  advanceLabel,
  onRetry,
}: {
  failure: BeatFailure;
  advanceLabel: "Continue" | "Finish story";
  onRetry: () => void;
}) {
  const { kind, phase } = failure;
  const actionClass =
    "inline-flex min-h-11 items-center font-ui text-sm uppercase tracking-wider border border-[var(--color-ink-soft)] px-5 py-2 transition-colors hover:border-[var(--color-accent-deep)] hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)]";

  const recovery = beatFailureRecovery(kind);
  if (recovery === "restart") {
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

  if (recovery === "reload") {
    return (
      <div className="space-y-3">
        <p className="font-ui text-sm text-[var(--color-accent)]">
          This story moved forward somewhere else. Reload to continue from its
          saved place.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={actionClass}
        >
          Reload saved place
        </button>
      </div>
    );
  }

  const message = retryMessage(failure);
  const retryLabel =
    phase === "delivery" ? "Try passage again" : `Try ${advanceLabel} again`;

  return (
    <div className="space-y-3">
      <p className="font-ui text-sm text-[var(--color-accent)]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className={actionClass}
      >
        {retryLabel}
      </button>
    </div>
  );
}

function retryMessage({ kind, phase }: BeatFailure): string {
  if (phase === "acknowledgement") {
    if (kind === "connection") {
      return "Your place may already be saved, but the response did not make it back.";
    }
    return "We could not confirm your saved place just yet.";
  }
  if (kind === "connection") {
    return "The connection dropped before this passage arrived.";
  }
  return "This passage is taking longer than it should.";
}
