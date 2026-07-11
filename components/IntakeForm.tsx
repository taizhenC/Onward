"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { CrisisCard } from "./CrisisCard";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { CrisisResource } from "@/lib/types";
import {
  BOUNDARY_TOPICS,
  type StoryBoundaries,
  type StoryIntensity,
} from "@/lib/story-boundaries";
import type { ContentFlag } from "@/lib/story-spec-types";
import {
  MATCH_CLARIFICATION_OPTIONS,
  type MatchClarification,
} from "@/lib/match-recovery";

type MatchSuccess = { sessionId: string };
type MatchCrisis = { crisis: true; resources: CrisisResource[] };
type MatchRateLimited = { rateLimited: true };
type MatchUnavailable = { temporarilyUnavailable: true };
type MatchNoEligible = { noEligibleStory: true };
type MatchClarificationNeeded = {
  clarificationNeeded: true;
  policyVersion: string;
  recoveryToken: string;
};
type MatchNoClose = {
  noCloseMatch: true;
  policyVersion: string;
  recoveryToken: string;
};
type MatchError = { error: string };
type MatchPayload =
  | MatchSuccess
  | MatchCrisis
  | MatchRateLimited
  | MatchUnavailable
  | MatchNoEligible
  | MatchClarificationNeeded
  | MatchNoClose
  | MatchError;

// Invisible anonymous-first auth: make sure this browser holds an auth session
// (anonymous or permanent) before posting the intake. Signing in at SUBMIT, not page
// mount, means bouncing visitors mint no users. Without Supabase env (offline/memory
// dev) there's no client and the server falls back to its local dev user.
async function ensureAuthSession(): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowser();
    if (!supabase) return true;
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return false;
    if (data.session) return true;
    const { error } = await supabase.auth.signInAnonymously();
    return !error;
  } catch {
    // Still post the intake: the route can return crisis resources without an
    // auth cookie, while every non-crisis path remains owner-gated.
    return false;
  }
}

export function IntakeForm() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [feeling, setFeeling] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crisisResources, setCrisisResources] = useState<
    CrisisResource[] | null
  >(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [boundaryEnabled, setBoundaryEnabled] = useState(false);
  const [maxIntensity, setMaxIntensity] =
    useState<StoryIntensity>("moderate");
  const [excludedFlags, setExcludedFlags] = useState<ContentFlag[]>([]);
  const [noEligibleStory, setNoEligibleStory] = useState(false);
  const [clarificationNeeded, setClarificationNeeded] = useState(false);
  const [clarification, setClarification] =
    useState<MatchClarification | null>(null);
  const [noCloseMatch, setNoCloseMatch] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const boundaryRef = useRef<HTMLFieldSetElement>(null);
  const noEligibleRef = useRef<HTMLDivElement>(null);
  const clarificationRef = useRef<HTMLFieldSetElement>(null);
  const noCloseRef = useRef<HTMLDivElement>(null);
  const feelingRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (noCloseMatch) noCloseRef.current?.focus();
    else if (clarificationNeeded) clarificationRef.current?.focus();
    else if (noEligibleStory) noEligibleRef.current?.focus();
  }, [clarificationNeeded, noCloseMatch, noEligibleStory]);

  const ageNum = Number.parseInt(age, 10);
  const ageValid =
    Number.isInteger(ageNum) && ageNum >= 13 && ageNum <= 100;
  const trimmedFeeling = feeling.trim();
  const feelingValid =
    trimmedFeeling.length >= 10 && feeling.length <= 1000;
  const baseCanSubmit = ageValid && feelingValid && !submitting;
  const canSubmit =
    baseCanSubmit && (!clarificationNeeded || clarification !== null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (noCloseMatch) return;
    await submitMatch(false);
  }

  async function submitMatch(acceptAdjacent: boolean) {
    if (
      !baseCanSubmit ||
      submittingRef.current ||
      (clarificationNeeded && clarification === null && !acceptAdjacent)
    ) {
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    setNoEligibleStory(false);
    setNoCloseMatch(false);

    const authed = await ensureAuthSession();

    let response: Response;
    try {
      response = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          age: ageNum,
          feeling,
          ...(boundaryEnabled
            ? {
                boundaries: {
                  maxIntensity,
                  excludedFlags,
                } satisfies StoryBoundaries,
              }
            : {}),
          ...(clarification ? { clarification } : {}),
          ...(acceptAdjacent ? { acceptAdjacent: true } : {}),
          ...(recoveryToken ? { recoveryToken } : {}),
        }),
      });
    } catch {
      setError("The connection dropped. Please try again.");
      finishSubmitting();
      return;
    }

    let payload: MatchPayload;
    try {
      payload = (await response.json()) as MatchPayload;
    } catch {
      setError(
        response.ok
          ? "Couldn't read the response."
          : `The server returned an error (${response.status}).`,
      );
      finishSubmitting();
      return;
    }

    // A gentle terminal state, not an error: the 429 means "come back in a while".
    if (response.status === 429 || "rateLimited" in payload) {
      setRateLimited(true);
      return;
    }

    if (response.status === 503 || "temporarilyUnavailable" in payload) {
      if (recoveryToken) resetMatchRecovery();
      setError(
        "Onward is pausing new stories for a little while. What you wrote was not saved. Please try again later.",
      );
      finishSubmitting();
      return;
    }

    if ("noEligibleStory" in payload) {
      setNoEligibleStory(true);
      finishSubmitting();
      return;
    }

    if ("clarificationNeeded" in payload) {
      setClarificationNeeded(true);
      setClarification(null);
      setRecoveryToken(payload.recoveryToken);
      finishSubmitting();
      return;
    }

    if ("noCloseMatch" in payload) {
      setClarificationNeeded(true);
      setNoCloseMatch(true);
      setRecoveryToken(payload.recoveryToken);
      finishSubmitting();
      return;
    }

    if (!authed && response.status === 401) {
      setError(
        "We couldn't start a private session. Your browser may be blocking cookies — they're needed to keep your story yours.",
      );
      finishSubmitting();
      return;
    }

    if (!response.ok) {
      if (recoveryToken) resetMatchRecovery();
      const message =
        "error" in payload ? payload.error : "Something went wrong.";
      setError(message);
      finishSubmitting();
      return;
    }

    if ("crisis" in payload && payload.crisis) {
      setCrisisResources(payload.resources);
      return;
    }
    if ("sessionId" in payload) {
      router.push(`/story/${payload.sessionId}`);
      return;
    }
    setError("Unexpected response from the matcher.");
    finishSubmitting();
  }

  function finishSubmitting() {
    submittingRef.current = false;
    setSubmitting(false);
  }

  function toggleExcludedFlag(flag: ContentFlag) {
    resetMatchRecovery();
    setExcludedFlags((current) =>
      current.includes(flag)
        ? current.filter((candidate) => candidate !== flag)
        : [...current, flag],
    );
  }

  function focusBoundaries() {
    setNoEligibleStory(false);
    requestAnimationFrame(() => boundaryRef.current?.focus());
  }

  function resetMatchRecovery() {
    setNoEligibleStory(false);
    setClarificationNeeded(false);
    setClarification(null);
    setNoCloseMatch(false);
    setRecoveryToken(null);
  }

  function focusDisclosure() {
    setNoCloseMatch(false);
    setClarificationNeeded(false);
    setClarification(null);
    setRecoveryToken(null);
    requestAnimationFrame(() => feelingRef.current?.focus());
  }

  if (crisisResources) {
    return <CrisisCard resources={crisisResources} />;
  }

  if (rateLimited) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <header className="space-y-3">
          <h1 className="text-3xl">A pause</h1>
        </header>
        <p className="text-[var(--color-ink-soft)] leading-relaxed">
          You&apos;ve begun several stories in a short while, so Onward is
          asking for a little time. The door opens again within the hour. The
          stories will be here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-10"
    >
      <header className="space-y-3">
        <h1 className="text-3xl">Onward</h1>
        <p className="text-[var(--color-ink-soft)]">
          Tell us how old you are and what you are going through. We will look
          for one useful point of contact in a real life. If the fit is
          uncertain, we will say so and may ask one question.
        </p>
      </header>

      <label className="block space-y-2">
        <span className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
          Age
        </span>
        <input
          type="number"
          min={13}
          max={100}
          value={age}
          onChange={(event) => {
            setAge(event.target.value);
            resetMatchRecovery();
          }}
          disabled={submitting}
          className="w-32 bg-transparent border-b border-[var(--color-ink-soft)] focus:border-[var(--color-ink)] focus:outline-none px-1 py-2"
        />
      </label>

      <label className="block space-y-2">
        <span className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
          What is going on
        </span>
        <textarea
          ref={feelingRef}
          value={feeling}
          onChange={(event) => {
            setFeeling(event.target.value);
            resetMatchRecovery();
          }}
          disabled={submitting}
          rows={6}
          maxLength={1000}
          placeholder="A few sentences. Whatever feels honest."
          className="block w-full bg-transparent border border-[var(--color-ink-soft)] focus:border-[var(--color-ink)] focus:outline-none p-4 resize-none"
        />
        <span className="block font-ui text-xs text-[var(--color-ink-soft)]/70 text-right">
          {feeling.length}/1000
        </span>
        <span className="block text-sm leading-relaxed text-[var(--color-ink-soft)]">
          What you write stays private and is not repeated back in the story.
        </span>
      </label>

      <fieldset
        ref={boundaryRef}
        tabIndex={-1}
        disabled={submitting}
        className="space-y-5 border border-[var(--color-ink-soft)]/35 p-5 focus:outline-2 focus:outline-offset-4 focus:outline-[var(--color-accent)]"
      >
        <legend className="px-2 font-ui text-xs font-medium uppercase tracking-widest text-[var(--color-ink-soft)]">
          Keep this story…
        </legend>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={boundaryEnabled}
            onChange={(event) => {
              setBoundaryEnabled(event.target.checked);
              resetMatchRecovery();
            }}
            className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
          />
          <span>
            <span className="block font-ui text-sm font-medium">
              Set limits for this story
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-[var(--color-ink-soft)]">
              Optional. These limits are used only to choose this story and are
              not added to it.
            </span>
          </span>
        </label>

        {boundaryEnabled ? (
          <div className="space-y-6 border-t border-[var(--color-ink-soft)]/20 pt-5">
            <fieldset className="space-y-3">
              <legend className="font-ui text-sm font-medium">Level of detail</legend>
              {[
                {
                  value: "gentle" as const,
                  label: "Gentle",
                  note: "Keep difficult events at a greater distance.",
                },
                {
                  value: "moderate" as const,
                  label: "Balanced",
                  note: "Name difficult events without dwelling on them.",
                },
                {
                  value: "direct" as const,
                  label: "More direct",
                  note: "Still non-graphic, with less distance from hard facts.",
                },
              ].map((option) => (
                <label key={option.value} className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="story-intensity"
                    value={option.value}
                    checked={maxIntensity === option.value}
                    onChange={() => {
                      setMaxIntensity(option.value);
                      resetMatchRecovery();
                    }}
                    className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                  />
                  <span>
                    <span className="block font-ui text-sm font-medium">
                      {option.label}
                    </span>
                    <span className="block text-sm text-[var(--color-ink-soft)]">
                      {option.note}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="font-ui text-sm font-medium">
                Topics to leave out
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {BOUNDARY_TOPICS.map((topic) => (
                  <label key={topic.flag} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={excludedFlags.includes(topic.flag)}
                      onChange={() => toggleExcludedFlag(topic.flag)}
                      className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                    />
                    <span>
                      <span className="block font-ui text-sm font-medium">
                        {topic.label}
                      </span>
                      <span className="block text-xs leading-relaxed text-[var(--color-ink-soft)]">
                        {topic.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        ) : null}
      </fieldset>

      {clarificationNeeded ? (
        <fieldset
          ref={clarificationRef}
          tabIndex={-1}
          disabled={submitting || noCloseMatch}
          className="space-y-5 border-l-2 border-[var(--color-accent)] pl-5 focus:outline-2 focus:outline-offset-4 focus:outline-[var(--color-accent)]"
        >
          <legend className="pr-2 font-ui text-xs font-medium uppercase tracking-widest text-[var(--color-ink-soft)]">
            One clarifying question
          </legend>
          <div className="space-y-2">
            <p className="text-lg leading-relaxed">
              Which part feels hardest right now?
            </p>
            <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
              Choose the closest answer. We ask only once, use it only for this
              match, and do not save the choice itself.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {MATCH_CLARIFICATION_OPTIONS.map((option) => (
              <label key={option.id} className="flex items-start gap-3">
                <input
                  type="radio"
                  name="match-clarification"
                  value={option.id}
                  checked={clarification === option.id}
                  onChange={() => {
                    setClarification(option.id);
                    setNoCloseMatch(false);
                  }}
                  className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                />
                <span>
                  <span className="block font-ui text-sm font-medium">
                    {option.label}
                  </span>
                  <span className="block text-xs leading-relaxed text-[var(--color-ink-soft)]">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {!noCloseMatch ? (
            <button
              type="button"
              disabled={!baseCanSubmit}
              onClick={() => void submitMatch(true)}
              className="font-ui text-xs uppercase tracking-wider underline underline-offset-4 disabled:opacity-40"
            >
              Skip and show the closest story
            </button>
          ) : null}
        </fieldset>
      ) : null}

      {noCloseMatch ? (
        <div
          ref={noCloseRef}
          tabIndex={-1}
          role="status"
          className="space-y-4 border border-[var(--color-ink-soft)]/35 p-5 focus:outline-2 focus:outline-offset-4 focus:outline-[var(--color-accent)]"
        >
          <p className="font-ui text-sm font-medium">
            We do not have a close enough story yet.
          </p>
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            The nearest story is only an adjacent parallel. No story or answer
            was saved; the temporary key for this step expires within ten
            minutes. You can read the story with its limitation made clear,
            revise what you wrote, or leave.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!baseCanSubmit}
              onClick={() => void submitMatch(true)}
              className="font-ui text-xs uppercase tracking-wider underline underline-offset-4 disabled:opacity-40"
            >
              Read the closest story
            </button>
            <button
              type="button"
              onClick={focusDisclosure}
              className="font-ui text-xs uppercase tracking-wider underline underline-offset-4"
            >
              Revise what I wrote
            </button>
            <Link
              href="/"
              className="font-ui text-xs uppercase tracking-wider underline underline-offset-4"
            >
              Leave
            </Link>
          </div>
        </div>
      ) : null}

      {noEligibleStory ? (
        <div
          ref={noEligibleRef}
          tabIndex={-1}
          role="status"
          className="space-y-4 border-l-2 border-[var(--color-accent)] pl-4 focus:outline-none"
        >
          <p className="font-ui text-sm font-medium">No reviewed story fits those limits yet.</p>
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Nothing was saved. You can change the limits, edit what you wrote,
            or leave this here.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={focusBoundaries}
              className="font-ui text-xs uppercase tracking-wider underline underline-offset-4"
            >
              Change limits
            </button>
            <Link
              href="/"
              className="font-ui text-xs uppercase tracking-wider underline underline-offset-4"
            >
              Leave
            </Link>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="font-ui text-sm text-[var(--color-accent)]">
          {error}
        </p>
      ) : null}

      {!noCloseMatch ? (
        <button
          type="submit"
          disabled={!canSubmit}
          className="font-ui text-sm uppercase tracking-wider border border-[var(--color-ink)] px-6 py-3 hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {submitting
            ? "Finding…"
            : clarificationNeeded
              ? "Use this answer"
              : "Begin"}
        </button>
      ) : null}
    </motion.form>
  );
}
