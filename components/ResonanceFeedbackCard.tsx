"use client";

import { useEffect, useRef, useState } from "react";
import {
  type ResonanceFeedbackInput,
  type ResonanceMissReason,
} from "@/lib/resonance-feedback-types";

type Props = {
  sessionId: string;
  historicalReportingAvailable: boolean;
};

type FeedbackState =
  | { kind: "question" }
  | { kind: "reason"; reason: ResonanceMissReason | null }
  | { kind: "submitting"; feedback: ResonanceFeedbackInput }
  | { kind: "accepted"; verdict: ResonanceFeedbackInput["verdict"] }
  | { kind: "error"; feedback: ResonanceFeedbackInput };

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

export function ResonanceFeedbackCard({
  sessionId,
  historicalReportingAvailable,
}: Props) {
  const [state, setState] = useState<FeedbackState>({ kind: "question" });
  const reasonRef = useRef<HTMLFieldSetElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (state.kind === "reason") reasonRef.current?.focus();
  }, [state.kind]);

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
      setState(
        response.ok
          ? { kind: "accepted", verdict: feedback.verdict }
          : { kind: "error", feedback },
      );
    } catch {
      setState({ kind: "error", feedback });
    } finally {
      submittingRef.current = false;
    }
  }

  function chooseMissReason(reason: ResonanceMissReason) {
    setState({ kind: "reason", reason });
  }

  return (
    <section
      aria-labelledby="resonance-feedback-heading"
      className="space-y-5 border-t border-[var(--color-ink-soft)]/30 pt-8"
    >
      <div className="space-y-2">
        <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
          A final question
        </p>
        <h2 id="resonance-feedback-heading" className="text-xl leading-snug">
          Did this story feel close to what you meant?
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
          One answer helps improve which stories we choose. It sends only your
          answer and this story&apos;s identifiers—not what you wrote or the story text.
        </p>
      </div>

      {state.kind === "question" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              void submit({ sessionId, verdict: "felt_close" })
            }
            className="min-h-11 border border-[var(--color-ink)] px-4 py-3 font-ui text-sm transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
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
                  onChange={() => chooseMissReason(option.value)}
                  className="size-4 accent-[var(--color-accent)]"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          {state.reason === "historical_concern" ? (
            <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {historicalReportingAvailable
                ? "To identify a specific fact or source, use the separate historical concern control in “Sources and story notes” above."
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
              className="min-h-11 border border-[var(--color-ink)] px-5 py-2 font-ui text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send feedback
            </button>
            <button
              type="button"
              onClick={() => setState({ kind: "question" })}
              className="min-h-11 px-3 py-2 font-ui text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
            >
              Back
            </button>
          </div>
        </div>
      ) : null}

      {state.kind === "submitting" ? (
        <p aria-live="polite" className="font-ui text-sm text-[var(--color-ink-soft)]">
          Saving your answer…
        </p>
      ) : null}

      {state.kind === "accepted" ? (
        <p aria-live="polite" className="font-ui text-sm leading-relaxed">
          {state.verdict === "felt_close"
            ? "Thank you. This included only your answer, not what you shared before the story."
            : "Thank you. That helps us improve how stories are matched."}
        </p>
      ) : null}

      {state.kind === "error" ? (
        <div className="space-y-3">
          <p role="alert" className="font-ui text-sm text-[var(--color-accent)]">
            Your feedback could not be saved. Please try again.
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
    </section>
  );
}
