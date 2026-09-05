"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AlternateStoryOffer } from "@/lib/alternate-story-types";
import {
  type ResonanceFeedbackInput,
  type ResonanceFeedbackPresentation,
  type ResonanceMissReason,
} from "@/lib/resonance-feedback-types";
import {
  bindFirstContentStory,
  clearFirstContentRequestStarted,
  markFirstContentRequestStarted,
} from "@/lib/story-visibility-client";

type Props = {
  sessionId: string;
  historicalReportingAvailable: boolean;
  initialFeedback: ResonanceFeedbackPresentation;
};

type AlternateAction =
  | { kind: "idle" }
  | { kind: "preparing" }
  | { kind: "waiting"; retryAt: number; message: string }
  | { kind: "unavailable"; message: string }
  | { kind: "error"; message: string }
  | { kind: "dismissed" };

type FeedbackState =
  | { kind: "question" }
  | { kind: "reason"; reason: ResonanceMissReason | null }
  | { kind: "submitting"; feedback: ResonanceFeedbackInput }
  | { kind: "accepted_close" }
  | {
      kind: "accepted_miss";
      offer: AlternateStoryOffer;
      alternate: AlternateAction;
    }
  | { kind: "conflict" }
  | { kind: "error"; feedback: ResonanceFeedbackInput; message?: string };

const MISS_OPTIONS: Array<{
  value: ResonanceMissReason;
  label: string;
}> = [
  { value: "wrong_situation", label: "The situation was different" },
  { value: "wrong_feeling", label: "The feeling was different" },
  { value: "life_stage_mismatch", label: "The age or life stage was off" },
  { value: "story_felt_generic", label: "The story felt too general" },
  { value: "tone_felt_wrong", label: "The tone did not feel right" },
  { value: "historical_concern", label: "Something historical seemed wrong" },
  { value: "other", label: "Something else" },
];

const feedbackRefreshFocusTargets = new Set<string>();

export function ResonanceFeedbackCard({
  sessionId,
  historicalReportingAvailable,
  initialFeedback,
}: Props) {
  const router = useRouter();
  const [state, setState] = useState<FeedbackState>(() =>
    initialFeedback.status === "felt_close"
      ? { kind: "accepted_close" }
      : initialFeedback.status === "not_close"
        ? {
            kind: "accepted_miss",
            offer: initialFeedback.alternate,
            alternate: initialAlternateAction(initialFeedback.alternate),
          }
        : { kind: "question" },
  );
  const reasonRef = useRef<HTMLFieldSetElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);
  const hydrationResultRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const focusQuestionAfterBackRef = useRef(false);
  const focusAlternateResultRef = useRef(false);

  useEffect(() => {
    if (state.kind === "reason") reasonRef.current?.focus();
  }, [state.kind]);

  useEffect(() => {
    if (
      initialFeedback.status !== "unanswered" &&
      feedbackRefreshFocusTargets.delete(sessionId)
    ) {
      hydrationResultRef.current?.focus();
    }
  }, [initialFeedback.status, sessionId]);

  useEffect(() => {
    if (state.kind === "question" && focusQuestionAfterBackRef.current) {
      focusQuestionAfterBackRef.current = false;
      questionRef.current?.focus();
    }
  }, [state.kind]);

  const alternateResultKind =
    state.kind === "accepted_miss" ? state.alternate.kind : null;
  const alternateOfferStatus =
    state.kind === "accepted_miss" ? state.offer.status : null;
  useEffect(() => {
    if (
      state.kind === "accepted_miss" &&
      (alternateResultKind === "unavailable" ||
        alternateResultKind === "error" ||
        alternateResultKind === "dismissed" ||
        (focusAlternateResultRef.current &&
          (alternateResultKind === "idle" ||
            alternateResultKind === "preparing" ||
            alternateResultKind === "waiting" ||
            alternateOfferStatus === "ready" ||
            alternateOfferStatus === "unavailable" ||
            alternateOfferStatus === "expired" ||
            alternateOfferStatus === "exhausted")))
    ) {
      focusAlternateResultRef.current = false;
      resultRef.current?.focus();
    }
  }, [state.kind, alternateResultKind, alternateOfferStatus]);

  useEffect(() => {
    if (state.kind !== "accepted_miss" || state.alternate.kind !== "waiting") {
      return;
    }
    const timeout = window.setTimeout(() => {
      focusAlternateResultRef.current = true;
      setAlternateAction({ kind: "idle" });
    }, Math.max(0, state.alternate.retryAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [state]);

  async function submit(feedback: ResonanceFeedbackInput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setState({ kind: "submitting", feedback });
    try {
      const response = await fetch("/api/story-feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(feedback),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 409 && hasCode(body, "feedback_conflict")) {
          setState({ kind: "conflict" });
        } else if (response.status === 409 && hasCode(body, "story_incomplete")) {
          setState({
            kind: "error",
            feedback,
            message:
              "This story is not recorded as finished yet. Refresh the page before trying again.",
          });
        } else {
          setState({ kind: "error", feedback });
        }
        return;
      }
      const offer = parseAlternateOffer(body);
      if (!offer) {
        setState({ kind: "error", feedback });
        return;
      }
      setState(
        feedback.verdict === "felt_close"
          ? { kind: "accepted_close" }
          : {
              kind: "accepted_miss",
              offer,
              alternate: initialAlternateAction(offer),
            },
      );
    } catch {
      setState({ kind: "error", feedback });
    } finally {
      submittingRef.current = false;
    }
  }

  async function requestAlternate(offer: AlternateStoryOffer) {
    if (offer.status === "ready") {
      clearFirstContentRequestStarted();
      router.push(`/story/${offer.sessionId}`);
      return;
    }
    if (offer.status !== "available" || submittingRef.current) return;
    submittingRef.current = true;
    setAlternateAction({ kind: "preparing" });
    try {
      markFirstContentRequestStarted();
      const response = await fetch("/api/story-feedback/alternate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, token: offer.token }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (response.ok && isReadyResponse(body)) {
        bindFirstContentStory(body.sessionId);
        setAcceptedMissOffer(
          { status: "ready", sessionId: body.sessionId },
          true,
        );
        router.push(`/story/${body.sessionId}`);
        return;
      }
      clearFirstContentRequestStarted();
      if (response.status === 202 && hasStatus(body, "preparing")) {
        setAlternateActionWithFocus({
          kind: "waiting",
          retryAt: Date.now() + retryDelayMs(response, body, 2000),
          message:
            "Another request is already preparing this story. You can check again shortly.",
        });
        return;
      }
      if (response.ok && hasStatus(body, "unavailable")) {
        setAcceptedMissOffer({ status: "unavailable" }, true);
        return;
      }
      if (response.status === 410) {
        setAcceptedMissOffer({ status: "expired" }, true);
        return;
      }
      if (response.status === 429) {
        setAcceptedMissOffer({ status: "exhausted" }, true);
        return;
      }
      if (response.status === 503) {
        setAlternateActionWithFocus({
          kind: "waiting",
          retryAt: Date.now() + retryDelayMs(response, body, 15_000),
          message:
            "Another story is temporarily unavailable. The same one-use key will be ready to retry shortly.",
        });
        return;
      }
      setAlternateAction({
        kind: "error",
        message: "Another story could not be prepared right now. Please try again.",
      });
    } catch {
      clearFirstContentRequestStarted();
      setAlternateAction({
        kind: "error",
        message: "Another story could not be prepared right now. Please try again.",
      });
    } finally {
      submittingRef.current = false;
    }
  }

  async function refreshAlternateOffer() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setAlternateActionWithFocus({ kind: "preparing" });
    try {
      const response = await fetch(
        "/api/story-feedback/alternate/capability",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId }),
        },
      );
      const body: unknown = await response.json().catch(() => null);
      const offer = response.ok ? parseAlternateOffer(body) : null;
      if (offer) {
        setAcceptedMissOffer(offer, true);
        return;
      }
      if (response.status === 503) {
        setAlternateActionWithFocus({
          kind: "waiting",
          retryAt: Date.now() + retryDelayMs(response, body, 15_000),
          message:
            "Alternate availability cannot be checked yet. We will keep your recorded feedback intact.",
        });
        return;
      }
      if (response.status === 404) {
        setAlternateAction({
          kind: "unavailable",
          message: "This story or its saved feedback is no longer available.",
        });
        return;
      }
      if (response.status === 409) {
        setAlternateAction({
          kind: "unavailable",
          message:
            "A saved not-close answer is required before another story can be offered.",
        });
        return;
      }
      setAlternateAction({
        kind: "error",
        message:
          "Alternate availability could not be checked. Your feedback is still saved.",
      });
    } catch {
      setAlternateAction({
        kind: "error",
        message:
          "Alternate availability could not be checked. Your feedback is still saved.",
      });
    } finally {
      submittingRef.current = false;
    }
  }

  function setAlternateAction(alternate: AlternateAction) {
    setState((current) =>
      current.kind === "accepted_miss" ? { ...current, alternate } : current,
    );
  }

  function setAlternateActionWithFocus(alternate: AlternateAction) {
    focusAlternateResultRef.current = true;
    setAlternateAction(alternate);
  }

  function setAcceptedMissOffer(
    offer: AlternateStoryOffer,
    focusResult = false,
  ) {
    if (focusResult) focusAlternateResultRef.current = true;
    setState((current) =>
      current.kind === "accepted_miss"
        ? { ...current, offer, alternate: initialAlternateAction(offer) }
        : current,
    );
  }

  const feedbackRecorded =
    state.kind === "accepted_close" ||
    state.kind === "accepted_miss" ||
    state.kind === "conflict";

  return (
    <section
      aria-labelledby="resonance-feedback-heading"
      aria-busy={
        state.kind === "submitting" ||
        (state.kind === "accepted_miss" &&
          state.alternate.kind === "preparing")
      }
      className="space-y-5 border-t border-[var(--color-ink-soft)]/30 pt-8"
    >
      <div className="space-y-2">
        <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
          {feedbackRecorded ? "Feedback recorded" : "A final question"}
        </p>
        <h2 id="resonance-feedback-heading" className="text-xl leading-snug">
          {feedbackRecorded
            ? "Thank you for telling us how the match felt."
            : "Did this story feel close to what you meant?"}
        </h2>
        {!feedbackRecorded ? (
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            One answer helps improve which stories we choose. It sends only your
            answer and this story&apos;s identifiers - not what you wrote or the story text.
          </p>
        ) : null}
      </div>

      {state.kind === "question" ? (
        <div
          ref={questionRef}
          tabIndex={-1}
          className="grid gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] sm:grid-cols-2"
        >
          <button
            type="button"
            onClick={() => void submit({ sessionId, verdict: "felt_close" })}
            className="min-h-11 border border-[var(--color-accent-deep)] px-4 py-3 font-ui text-sm transition-colors hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Yes, it felt close
          </button>
          <button
            type="button"
            onClick={() => setState({ kind: "reason", reason: null })}
            className="min-h-11 border border-[var(--color-ink-soft)] px-4 py-3 font-ui text-sm transition-colors hover:border-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Not really
          </button>
        </div>
      ) : null}

      {state.kind === "reason" ? (
        <div className="space-y-5">
          <fieldset
            ref={reasonRef}
            tabIndex={-1}
            className="space-y-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            <legend className="font-ui text-sm font-medium">
              What was the main reason?
            </legend>
            {MISS_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex min-h-11 items-center gap-3 text-sm"
              >
                <input
                  type="radio"
                  name="resonance-miss-reason"
                  value={option.value}
                  checked={state.reason === option.value}
                  onChange={() =>
                    setState({ kind: "reason", reason: option.value })
                  }
                  className="size-4 accent-[var(--color-accent)]"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          {state.reason === "historical_concern" ? (
            <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {historicalReportingAvailable
                ? "To identify a specific fact or source, use the separate historical concern control in the afterword above."
                : "This records the concern category. Fact-level reporting is not available for this earlier story record."}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={state.reason === null}
              onClick={() => {
                if (state.reason) {
                  void submit({
                    sessionId,
                    verdict: "not_close",
                    reason: state.reason,
                  });
                }
              }}
              className="min-h-11 border border-[var(--color-accent-deep)] px-5 py-2 font-ui text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send feedback
            </button>
            <button
              type="button"
              onClick={() => {
                focusQuestionAfterBackRef.current = true;
                setState({ kind: "question" });
              }}
              className="min-h-11 px-3 py-2 font-ui text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
            >
              Back
            </button>
          </div>
        </div>
      ) : null}

      {state.kind === "submitting" ? (
        <p
          role="status"
          aria-live="polite"
          className="font-ui text-sm text-[var(--color-ink-soft)]"
        >
          Saving your answer...
        </p>
      ) : null}

      {state.kind === "accepted_close" ? (
        <div
          ref={hydrationResultRef}
          tabIndex={-1}
          role="status"
          className="font-ui text-sm leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
        >
          Thank you. This included only your answer, not what you shared before the story.
        </div>
      ) : null}

      {state.kind === "accepted_miss" ? (
        <div
          ref={hydrationResultRef}
          tabIndex={-1}
          className="space-y-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
        >
          <p role="status" className="font-ui text-sm leading-relaxed">
            Thank you. That helps us improve how stories are matched.
          </p>
          <AlternateStoryControls
            offer={state.offer}
            action={state.alternate}
            resultRef={resultRef}
            onRequest={() => void requestAlternate(state.offer)}
            onRefresh={() => void refreshAlternateOffer()}
            onDismiss={() => {
              focusAlternateResultRef.current = true;
              setAlternateAction({ kind: "dismissed" });
            }}
          />
        </div>
      ) : null}

      {state.kind === "error" ? (
        <div className="space-y-3">
          <p role="alert" className="font-ui text-sm text-[var(--color-accent)]">
            {state.message ?? "Your feedback could not be saved. Please try again."}
          </p>
          <button
            type="button"
            onClick={() => void submit(state.feedback)}
            className="min-h-11 border border-[var(--color-ink-soft)] px-5 py-2 font-ui text-sm uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Try again
          </button>
        </div>
      ) : null}

      {state.kind === "conflict" ? (
        <div className="space-y-3">
          <p role="status" className="font-ui text-sm text-[var(--color-ink-soft)]">
            Feedback for this story was already recorded, possibly in another tab.
          </p>
          <button
            type="button"
            onClick={() => {
              feedbackRefreshFocusTargets.add(sessionId);
              router.refresh();
            }}
            className={secondaryButtonClass}
          >
            Refresh feedback status
          </button>
        </div>
      ) : null}
    </section>
  );
}

function AlternateStoryControls({
  offer,
  action,
  resultRef,
  onRequest,
  onRefresh,
  onDismiss,
}: {
  offer: AlternateStoryOffer;
  action: AlternateAction;
  resultRef: React.RefObject<HTMLDivElement | null>;
  onRequest: () => void;
  onRefresh: () => void;
  onDismiss: () => void;
}) {
  if (action.kind === "unavailable" || action.kind === "error") {
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        className="space-y-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
      >
        <p
          role={action.kind === "error" ? "alert" : "status"}
          className="text-sm leading-relaxed text-[var(--color-ink-soft)]"
        >
          {action.message}
        </p>
        {action.kind === "error" ? (
          <button
            type="button"
            onClick={offer.status === "available" ? onRequest : onRefresh}
            className={secondaryButtonClass}
          >
            {offer.status === "available" ? "Try again" : "Check again"}
          </button>
        ) : (
          <Link href="/" className={textLinkClass}>
            Start again
          </Link>
        )}
      </div>
    );
  }
  if (action.kind === "waiting") {
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        className="space-y-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
        role="status"
      >
        <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
          {action.message}
        </p>
        <button type="button" disabled className={secondaryButtonClass}>
          Check again shortly
        </button>
      </div>
    );
  }
  if (action.kind === "preparing" && offer.status !== "available") {
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        className="space-y-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
        role="status"
      >
        <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Checking whether another story is available...
        </p>
        <button type="button" disabled className={secondaryButtonClass}>
          Checking...
        </button>
      </div>
    );
  }
  if (offer.status === "ready") {
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        role="status"
        className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
      >
        <Link href={`/story/${offer.sessionId}`} className={primaryButtonClass}>
          Read the other story
        </Link>
      </div>
    );
  }
  if (offer.status === "unavailable") {
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        role="status"
        className="space-y-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
      >
        <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
          We do not have another reviewed story that fits closely enough right now.
        </p>
        <Link href="/" className={textLinkClass}>
          Start again with different wording or limits
        </Link>
      </div>
    );
  }
  if (offer.status === "expired" || offer.status === "exhausted") {
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        role="status"
        className="space-y-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
      >
        <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
          {offer.status === "expired"
            ? "The one-use window for another story has ended."
            : "The bounded preparation attempts have been used."}
        </p>
        <Link href="/" className={textLinkClass}>
          Start again with different wording or limits
        </Link>
      </div>
    );
  }
  if (offer.status === "not_offered") {
    return (
      <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
        This story is not eligible for another automatic match. You can{" "}
        <Link href="/" className={textLinkClass}>
          start again
        </Link>{" "}
        with different wording or limits.
      </p>
    );
  }
  if (
    offer.status === "temporarily_unavailable" ||
    offer.status === "preparing"
  ) {
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        className="space-y-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
      >
        <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
          {offer.status === "preparing"
            ? "Another request is still preparing this story."
            : "Your feedback is saved, but alternate availability cannot be checked right now."}
        </p>
        <button type="button" onClick={onRefresh} className={secondaryButtonClass}>
          Check again
        </button>
      </div>
    );
  }
  if (action.kind === "dismissed") {
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
      >
        <button type="button" onClick={onRequest} className={textLinkClass}>
          Ask for another story after all
        </button>
      </div>
    );
  }
  return (
    <div
      ref={resultRef}
      tabIndex={-1}
      className="space-y-3 border border-[var(--color-ink-soft)]/40 p-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
    >
      <p className="text-sm leading-relaxed">
        You can ask for one different story. Onward will reuse the private text
        and limits already held for this story.
      </p>
      <p className="text-xs leading-relaxed text-[var(--color-ink-soft)]">
        This page sends only a one-use key. It does not resend your text or extend
        its deletion date.
      </p>
      {action.kind === "preparing" ? (
        <p role="status" className="font-ui text-sm text-[var(--color-ink-soft)]">
          Looking for a different story that keeps your limits...
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={action.kind === "preparing"}
          onClick={onRequest}
          className={primaryButtonClass}
        >
          {action.kind === "preparing" ? "Preparing..." : "Try another story"}
        </button>
        <button
          type="button"
          disabled={action.kind === "preparing"}
          onClick={onDismiss}
          className={secondaryButtonClass}
        >
          Stay with this story
        </button>
      </div>
    </div>
  );
}

function parseAlternateOffer(value: unknown): AlternateStoryOffer | null {
  if (value === null || typeof value !== "object") return null;
  const alternate = (value as Record<string, unknown>).alternate;
  if (alternate === null || typeof alternate !== "object") return null;
  const item = alternate as Record<string, unknown>;
  if (
    item.status === "not_offered" ||
    item.status === "unavailable" ||
    item.status === "expired" ||
    item.status === "exhausted"
  ) {
    return { status: item.status };
  }
  if (
    (item.status === "preparing" ||
      item.status === "temporarily_unavailable") &&
    typeof item.retryAfterMs === "number" &&
    Number.isFinite(item.retryAfterMs) &&
    item.retryAfterMs >= 0
  ) {
    return { status: item.status, retryAfterMs: item.retryAfterMs };
  }
  if (
    item.status === "ready" &&
    typeof item.sessionId === "string" &&
    /^[0-9a-f]{32}$/.test(item.sessionId)
  ) {
    return { status: "ready", sessionId: item.sessionId };
  }
  if (
    item.status === "available" &&
    typeof item.token === "string" &&
    /^[A-Za-z0-9_-]{43}$/.test(item.token) &&
    typeof item.expiresAt === "string" &&
    !Number.isNaN(Date.parse(item.expiresAt))
  ) {
    return { status: "available", token: item.token, expiresAt: item.expiresAt };
  }
  return null;
}

function initialAlternateAction(offer: AlternateStoryOffer): AlternateAction {
  if (offer.status === "preparing") {
    return {
      kind: "waiting",
      retryAt: Date.now() + Math.min(60_000, Math.max(0, offer.retryAfterMs)),
      message: "Another request is preparing this story. Check again shortly.",
    };
  }
  if (offer.status === "temporarily_unavailable") {
    return {
      kind: "waiting",
      retryAt:
        Date.now() + Math.min(60_000, Math.max(0, offer.retryAfterMs)),
      message:
        "Your feedback is saved. Alternate availability can be checked again shortly.",
    };
  }
  return { kind: "idle" };
}

function retryDelayMs(
  response: Response,
  body: unknown,
  fallback: number,
): number {
  const bodyDelay =
    body !== null &&
    typeof body === "object" &&
    typeof (body as Record<string, unknown>).retryAfterMs === "number"
      ? ((body as Record<string, unknown>).retryAfterMs as number)
      : null;
  const headerSeconds = Number(response.headers.get("retry-after"));
  const delay =
    bodyDelay !== null && Number.isFinite(bodyDelay)
      ? bodyDelay
      : Number.isFinite(headerSeconds) && headerSeconds > 0
        ? headerSeconds * 1000
        : fallback;
  return Math.min(60_000, Math.max(500, delay));
}

function hasStatus(value: unknown, status: string): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    (value as Record<string, unknown>).status === status
  );
}

function hasCode(value: unknown, code: string): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    (value as Record<string, unknown>).code === code
  );
}

function isReadyResponse(
  value: unknown,
): value is { status: "ready"; sessionId: string } {
  return (
    hasStatus(value, "ready") &&
    typeof (value as Record<string, unknown>).sessionId === "string" &&
    /^[0-9a-f]{32}$/.test((value as Record<string, unknown>).sessionId as string)
  );
}

const primaryButtonClass =
  "min-h-11 border border-[var(--color-accent-deep)] px-5 py-2 font-ui text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] disabled:cursor-wait disabled:opacity-50";
const secondaryButtonClass =
  "min-h-11 border border-[var(--color-ink-soft)] px-5 py-2 font-ui text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] disabled:cursor-wait disabled:opacity-50";
const textLinkClass =
  "min-h-11 inline-flex items-center font-ui text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]";
