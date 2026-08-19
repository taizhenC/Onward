"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { CrisisCard } from "./CrisisCard";
import {
  selectedStoryBoundaries,
  StoryBoundaryEditor,
  type StoryBoundaryEditorValue,
} from "./StoryBoundaryEditor";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { CrisisResource } from "@/lib/types";
import {
  MATCH_CLARIFICATION_OPTIONS,
  type MatchClarification,
} from "@/lib/match-recovery";
import {
  INTAKE_MAX_AGE,
  INTAKE_MAX_FEELING_LENGTH,
  INTAKE_MIN_AGE,
  intakeFeelingLength,
  normalizeIntakeFeeling,
} from "@/lib/intake-constraints";
import { containsCrisisLanguage } from "@/lib/crisis-language";
import { buildIntakeMatchRequest } from "@/lib/intake-match-request";
import {
  INTAKE_FICTIONAL_EXAMPLE,
  INTAKE_SUBMISSION_COPY,
  INTAKE_WRITING_PROMPTS,
  firstInvalidIntakeField,
  type IntakeSubmissionState,
  validateIntakeDraft,
} from "@/lib/intake-presentation";
import {
  beginMatchRequest,
  confirmCurrentRequestCreatedNoStory,
  crisisResourceOrigin,
  INITIAL_MATCH_REQUEST_PRIVACY,
  matchRequestMayHaveCreatedStory,
  type CrisisResourceOrigin,
  type MatchRequestPrivacy,
} from "@/lib/intake-request-privacy";
import { TELEMETRY_FLOW_HEADER } from "@/lib/telemetry-flow-header";
import type { TelemetryFlowId } from "@/lib/telemetry-types";
import {
  bindFirstContentStory,
  clearFirstContentRequestStarted,
  markFirstContentRequestStarted,
} from "@/lib/story-visibility-client";

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
type MatchFlowConflict = { flowConflict: true };
type MatchPayload =
  | MatchSuccess
  | MatchCrisis
  | MatchRateLimited
  | MatchUnavailable
  | MatchNoEligible
  | MatchClarificationNeeded
  | MatchNoClose
  | MatchFlowConflict
  | MatchError;

type CrisisPresentation = Readonly<{
  resources: CrisisResource[];
  origin: CrisisResourceOrigin;
}>;

// Invisible anonymous-first auth is attempted only after the server has ruled
// out the crisis path and returned 401. That keeps reviewed resources independent
// of cookies and prevents bouncing visitors from minting anonymous users. Without
// Supabase env (offline/memory dev), the server uses its local development owner.
async function ensureAuthSessionUnless(
  interrupted: () => boolean,
): Promise<boolean> {
  try {
    if (interrupted()) return false;
    const supabase = getSupabaseBrowser();
    if (!supabase) return true;
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || interrupted()) return false;
    if (data.session) return true;
    if (interrupted()) return false;
    const { error } = await supabase.auth.signInAnonymously();
    return !error && !interrupted();
  } catch {
    // Still post the intake: the route can return crisis resources without an
    // auth cookie, while every non-crisis path remains owner-gated.
    return false;
  }
}

export function IntakeForm({
  telemetryFlowId,
  reviewedCrisisResources,
}: {
  telemetryFlowId: TelemetryFlowId | null;
  reviewedCrisisResources: CrisisResource[];
}) {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [feeling, setFeeling] = useState("");
  const [ageTouched, setAgeTouched] = useState(false);
  const [feelingTouched, setFeelingTouched] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionState, setSubmissionState] =
    useState<IntakeSubmissionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [crisisPresentation, setCrisisPresentation] =
    useState<CrisisPresentation | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitRetryMinutes, setRateLimitRetryMinutes] = useState<
    number | null
  >(null);
  const [storyBoundaryEditorValue, setStoryBoundaryEditorValue] =
    useState<StoryBoundaryEditorValue>({
      enabled: false,
      boundaries: {
        maxIntensity: "moderate",
        excludedFlags: [],
      },
    });
  const [noEligibleStory, setNoEligibleStory] = useState(false);
  const [clarificationNeeded, setClarificationNeeded] = useState(false);
  const [clarification, setClarification] =
    useState<MatchClarification | null>(null);
  const [noCloseMatch, setNoCloseMatch] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [flowConflict, setFlowConflict] = useState(false);
  const boundaryRef = useRef<HTMLFieldSetElement>(null);
  const noEligibleRef = useRef<HTMLDivElement>(null);
  const rateLimitedRef = useRef<HTMLDivElement>(null);
  const clarificationRef = useRef<HTMLFieldSetElement>(null);
  const noCloseRef = useRef<HTMLDivElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const feelingRef = useRef<HTMLTextAreaElement>(null);
  const flowConflictRef = useRef<HTMLAnchorElement>(null);
  const submittingRef = useRef(false);
  const intakeStartedRef = useRef(false);
  const manualCrisisOpenedRef = useRef(false);
  const matchRequestPrivacyRef = useRef<MatchRequestPrivacy>(
    INITIAL_MATCH_REQUEST_PRIVACY,
  );
  const intakeAbandonedRef = useRef(false);
  const componentMountedRef = useRef(true);
  const storyNavigationCommittedRef = useRef(false);

  useEffect(() => {
    if (flowConflict) flowConflictRef.current?.focus();
    else if (noCloseMatch) noCloseRef.current?.focus();
    else if (clarificationNeeded) clarificationRef.current?.focus();
    else if (noEligibleStory) noEligibleRef.current?.focus();
    else if (rateLimited) rateLimitedRef.current?.focus();
  }, [
    clarificationNeeded,
    flowConflict,
    noCloseMatch,
    noEligibleStory,
    rateLimited,
  ]);

  useEffect(() => {
    // React Strict Mode runs setup → cleanup → setup in development.
    componentMountedRef.current = true;
    intakeAbandonedRef.current = false;
    return () => {
      componentMountedRef.current = false;
      if (!storyNavigationCommittedRef.current) {
        intakeAbandonedRef.current = true;
        clearFirstContentRequestStarted();
      }
    };
  }, []);

  const ageNum = Number(age);
  const feelingLength = intakeFeelingLength(feeling);
  const intakeValidation = validateIntakeDraft({ age, feeling });
  const ageError =
    ageTouched || validationAttempted ? intakeValidation.age : null;
  const feelingError =
    feelingTouched || validationAttempted ? intakeValidation.feeling : null;
  const submissionCopy = submissionState
    ? INTAKE_SUBMISSION_COPY[submissionState]
    : null;
  const ambiguousRequestRecoveryCopy = recoveryToken
    ? "Check Your stories first. This follow-up cannot be safely replayed because its recovery token may have been used; review your draft and start a fresh match only if no story appeared."
    : telemetryFlowId
      ? "Retry the unchanged request and Onward will try to recover the same journey."
      : "Check Your stories before retrying. Without a recovery ID, another retry may start another story.";
  const requestHistoryMayHaveCreatedStory = matchRequestMayHaveCreatedStory(
    matchRequestPrivacyRef.current,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (noCloseMatch || flowConflict) return;
    await submitMatch(false);
  }

  function markIntakeStarted(event: React.FormEvent<HTMLFormElement>) {
    if (
      intakeStartedRef.current ||
      !telemetryFlowId ||
      !event.nativeEvent.isTrusted
    ) {
      return;
    }
    intakeStartedRef.current = true;
    const viewportBucket = window.matchMedia("(max-width: 767px)").matches
      ? "small"
      : "large";
    void sendIntakeStarted(telemetryFlowId, viewportBucket);
  }

  async function ensureAuthSession(): Promise<boolean> {
    return ensureAuthSessionUnless(
      () =>
        manualCrisisOpenedRef.current || intakeAbandonedRef.current,
    );
  }

  async function submitMatch(acceptAdjacent: boolean) {
    if (
      submittingRef.current ||
      flowConflict ||
      (clarificationNeeded && clarification === null && !acceptAdjacent)
    ) {
      return;
    }
    const firstInvalidField = firstInvalidIntakeField(intakeValidation);
    if (firstInvalidField !== null) {
      // The server remains the authoritative crisis gate for every valid
      // request. This shared predicate prevents local field validation from
      // hiding reviewed resources when age or disclosure length is invalid.
      if (containsCrisisLanguage(feeling)) {
        openCrisisResources();
        return;
      }
      setValidationAttempted(true);
      requestAnimationFrame(() => {
        if (firstInvalidField === "age") ageRef.current?.focus();
        else feelingRef.current?.focus();
      });
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setRateLimited(false);
    setError(null);
    setNoEligibleStory(false);
    setNoCloseMatch(false);
    setFlowConflict(false);

    let response: Response;
    const body = JSON.stringify(
      buildIntakeMatchRequest({
        age: ageNum,
        feeling,
        boundaries: selectedStoryBoundaries(storyBoundaryEditorValue),
        clarification,
        acceptAdjacent,
        recoveryToken,
      }),
    );
    const postMatch = () => {
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      if (telemetryFlowId) headers[TELEMETRY_FLOW_HEADER] = telemetryFlowId;
      // Record uncertainty before dispatch. Beginning a later retry promotes
      // any still-unresolved current attempt into immutable prior uncertainty.
      matchRequestPrivacyRef.current = beginMatchRequest(
        matchRequestPrivacyRef.current,
      );
      markFirstContentRequestStarted();
      return fetch("/api/match", { method: "POST", headers, body });
    };
    setSubmissionState("checking_request");
    try {
      // Crisis classification reaches the server before the browser auth SDK.
      // Only a non-crisis 401 creates an anonymous session and retries.
      response = await postMatch();
      if (stopForInterruptedIntake()) return;
      if (response.status === 401) {
        matchRequestPrivacyRef.current = confirmCurrentRequestCreatedNoStory(
          matchRequestPrivacyRef.current,
        );
        setSubmissionState("securing_session");
      }
      if (response.status === 401 && (await ensureAuthSession())) {
        if (stopForInterruptedIntake()) return;
        setSubmissionState("finding_story");
        response = await postMatch();
        if (stopForInterruptedIntake()) return;
      }
      if (stopForInterruptedIntake()) return;
    } catch {
      if (stopForInterruptedIntake()) return;
      clearFirstContentRequestStarted();
      if (recoveryToken) resetMatchRecovery();
      setError(
        `The connection dropped. What you wrote is still in this form on this page; refreshing or leaving will clear it. The server may already have received the request. ${ambiguousRequestRecoveryCopy}`,
      );
      finishSubmitting();
      return;
    }

    let payload: MatchPayload;
    try {
      payload = (await response.json()) as MatchPayload;
      if (stopForInterruptedIntake()) return;
    } catch {
      if (stopForInterruptedIntake()) return;
      clearFirstContentRequestStarted();
      if (recoveryToken) resetMatchRecovery();
      setError(
        response.ok || response.status === 503
          ? `Onward received the request, but this page could not read the result. A story may already exist. What you wrote is still in this form on this page. ${ambiguousRequestRecoveryCopy}`
          : `The server returned an error (${response.status}).`,
      );
      finishSubmitting();
      return;
    }

    // A timestamp survives only for a successful story navigation. Crisis,
    // recovery, rate-limit, conflict, and failure paths cannot leak a stale
    // measurement into a later saved-story visit.
    if (!(response.ok && "sessionId" in payload)) {
      clearFirstContentRequestStarted();
    }

    if (response.status === 409 || "flowConflict" in payload) {
      setFlowConflict(true);
      finishSubmitting();
      return;
    }

    // A gentle terminal state, not an error: the 429 means "come back in a while".
    if (response.status === 429 || "rateLimited" in payload) {
      matchRequestPrivacyRef.current = confirmCurrentRequestCreatedNoStory(
        matchRequestPrivacyRef.current,
      );
      setRateLimitRetryMinutes(
        parseRetryAfterMinutes(response.headers.get("retry-after")),
      );
      setRateLimited(true);
      finishSubmitting();
      return;
    }

    if (response.status === 503 || "temporarilyUnavailable" in payload) {
      if (recoveryToken) resetMatchRecovery();
      setError(
        `Onward could not confirm a new story. A story may already exist, and what you wrote is still in this form on this page. ${ambiguousRequestRecoveryCopy}`,
      );
      finishSubmitting();
      return;
    }

    if ("noEligibleStory" in payload) {
      matchRequestPrivacyRef.current = confirmCurrentRequestCreatedNoStory(
        matchRequestPrivacyRef.current,
      );
      setNoEligibleStory(true);
      finishSubmitting();
      return;
    }

    if ("clarificationNeeded" in payload) {
      matchRequestPrivacyRef.current = confirmCurrentRequestCreatedNoStory(
        matchRequestPrivacyRef.current,
      );
      setClarificationNeeded(true);
      setClarification(null);
      setRecoveryToken(payload.recoveryToken);
      finishSubmitting();
      return;
    }

    if ("noCloseMatch" in payload) {
      matchRequestPrivacyRef.current = confirmCurrentRequestCreatedNoStory(
        matchRequestPrivacyRef.current,
      );
      setClarificationNeeded(true);
      setNoCloseMatch(true);
      setRecoveryToken(payload.recoveryToken);
      finishSubmitting();
      return;
    }

    if (response.status === 401) {
      matchRequestPrivacyRef.current = confirmCurrentRequestCreatedNoStory(
        matchRequestPrivacyRef.current,
      );
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
      matchRequestPrivacyRef.current = confirmCurrentRequestCreatedNoStory(
        matchRequestPrivacyRef.current,
      );
      setCrisisPresentation(
        Object.freeze({
          resources: payload.resources,
          origin: crisisResourceOrigin(matchRequestPrivacyRef.current, true),
        }),
      );
      finishSubmitting();
      return;
    }
    if ("sessionId" in payload) {
      storyNavigationCommittedRef.current = true;
      bindFirstContentStory(payload.sessionId);
      setSubmissionState("opening_story");
      router.push(`/story/${payload.sessionId}`);
      return;
    }
    setError("Unexpected response from the matcher.");
    finishSubmitting();
  }

  function finishSubmitting() {
    submittingRef.current = false;
    if (!componentMountedRef.current) return;
    setSubmitting(false);
    setSubmissionState(null);
  }

  function openCrisisResources() {
    manualCrisisOpenedRef.current = true;
    const origin = crisisResourceOrigin(matchRequestPrivacyRef.current);
    clearFirstContentRequestStarted();
    setCrisisPresentation(
      Object.freeze({ resources: reviewedCrisisResources, origin }),
    );
  }

  function abandonIntake(event: React.MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.currentTarget.target === "_blank"
    ) {
      return;
    }
    intakeAbandonedRef.current = true;
    clearFirstContentRequestStarted();
  }

  function stopForInterruptedIntake(): boolean {
    if (
      !manualCrisisOpenedRef.current &&
      !intakeAbandonedRef.current
    ) {
      return false;
    }
    clearFirstContentRequestStarted();
    finishSubmitting();
    return true;
  }

  function handleBoundaryEditorChange(next: StoryBoundaryEditorValue) {
    setStoryBoundaryEditorValue(next);
    resetMatchRecovery();
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

  function focusRateLimitedDraft() {
    requestAnimationFrame(() => feelingRef.current?.focus());
  }

  if (crisisPresentation) {
    return (
      <CrisisCard
        resources={crisisPresentation.resources}
        origin={crisisPresentation.origin}
      />
    );
  }

  return (
    <>
      <motion.form
        onSubmit={handleSubmit}
        onChange={markIntakeStarted}
        noValidate
        aria-busy={submitting}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="space-y-10"
      >
      <header className="space-y-4">
        <Link
          href="/"
          onClick={abandonIntake}
          aria-label="Onward home"
          className="inline-flex min-h-11 items-center font-ui text-xs uppercase tracking-wider underline decoration-[var(--color-ink-soft)]/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
        >
          Onward home
        </Link>
        <h1 className="text-3xl">What are you carrying right now?</h1>
        <p className="text-[var(--color-ink-soft)]">
          Share only what feels useful. A few grounded details help us look for
          one documented life episode with a similar emotional shape. If the
          fit is uncertain, we will say so and may ask one question.
        </p>
      </header>

      <div className="border-l-2 border-[var(--color-accent)] pl-4">
        <button
          type="button"
          onClick={openCrisisResources}
          className="inline-flex min-h-11 items-center font-ui text-xs uppercase tracking-wider underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
        >
          I need immediate help
        </button>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Crisis resources are available without an age or story submission.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="intake-age"
          className="block font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]"
        >
          Age
        </label>
        <input
          ref={ageRef}
          id="intake-age"
          type="number"
          min={INTAKE_MIN_AGE}
          max={INTAKE_MAX_AGE}
          step={1}
          required
          value={age}
          onChange={(event) => {
            setAge(event.target.value);
            resetMatchRecovery();
          }}
          onBlur={() => setAgeTouched(true)}
          disabled={submitting}
          aria-invalid={ageError !== null}
          aria-describedby={
            ageError ? "intake-age-help intake-age-error" : "intake-age-help"
          }
          className="min-h-11 w-32 border-b border-[var(--color-ink-soft)] bg-transparent px-1 py-2 focus-visible:border-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
        />
        <p
          id="intake-age-help"
          className="max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]"
        >
          The current beta is for adults ages {INTAKE_MIN_AGE} to{" "}
          {INTAKE_MAX_AGE}. Your age helps us look for a documented episode
          from a similar life stage.
        </p>
        {ageError ? (
          <p
            id="intake-age-error"
            aria-live="polite"
            className="font-ui text-sm text-[var(--color-accent)]"
          >
            {ageError}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="intake-feeling"
            className="block font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]"
          >
            What is going on
          </label>
          <p
            id="intake-feeling-guidance"
            className="text-sm leading-relaxed text-[var(--color-ink-soft)]"
          >
            You can use any of these as a starting point:
          </p>
          <ul className="grid gap-2 text-sm sm:grid-cols-3">
            {INTAKE_WRITING_PROMPTS.map((prompt) => (
              <li
                key={prompt}
                className="border-l-2 border-[var(--color-accent)] pl-3"
              >
                {prompt}
              </li>
            ))}
          </ul>
          <p
            id="intake-feeling-example"
            className="text-sm italic leading-relaxed text-[var(--color-ink-soft)]"
          >
            {INTAKE_FICTIONAL_EXAMPLE}
          </p>
        </div>
        <textarea
          ref={feelingRef}
          id="intake-feeling"
          value={feeling}
          onChange={(event) => {
            const next = normalizeIntakeFeeling(event.target.value);
            setFeeling(next);
            resetMatchRecovery();
          }}
          onBlur={() => setFeelingTouched(true)}
          disabled={submitting}
          required
          rows={6}
          placeholder="A few sentences are enough. Leave out names or details you do not want to share."
          aria-invalid={feelingError !== null}
          aria-describedby={[
            "intake-feeling-guidance",
            "intake-feeling-example",
            "intake-feeling-count",
            "intake-feeling-privacy",
            ...(feelingError ? ["intake-feeling-error"] : []),
          ].join(" ")}
          className="font-body block min-h-44 w-full resize-y border border-[var(--color-rule-strong)] bg-[var(--color-paper-deep)] p-6 text-[19px] leading-[1.7] focus-visible:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
        />
        <p
          id="intake-feeling-count"
          className={`text-right font-ui text-xs ${
            feelingLength > INTAKE_MAX_FEELING_LENGTH
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-ink-soft)]"
          }`}
        >
          {feelingLength}/{INTAKE_MAX_FEELING_LENGTH}
        </p>
        {feelingError ? (
          <p
            id="intake-feeling-error"
            aria-live="polite"
            className="font-ui text-sm text-[var(--color-accent)]"
          >
            {feelingError}
          </p>
        ) : null}
        <p
          id="intake-feeling-privacy"
          className="text-sm leading-relaxed text-[var(--color-ink-soft)]"
        >
          What you write is used to find and shape one story. It may be
          processed by our model providers and is removed from your saved
          session after 60 days. It is not repeated back in the story.{" "}
          <Link
            href="/privacy"
            onClick={abandonIntake}
            className="inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Read the privacy details
          </Link>
          .
        </p>
      </div>

      <StoryBoundaryEditor
        ref={boundaryRef}
        value={storyBoundaryEditorValue}
        onChange={handleBoundaryEditorChange}
        disabled={submitting}
      />

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
              disabled={submitting}
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
            The nearest story is only an adjacent parallel.{" "}
            {requestHistoryMayHaveCreatedStory
              ? "This latest match saved no story or answer, but an earlier response-lost attempt may have created a story; check Your stories before continuing."
              : "No story or answer was saved."}{" "}
            The temporary key for this step expires within ten minutes. You can
            read the story with its limitation made clear, revise what you
            wrote, or leave.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={submitting}
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
              onClick={abandonIntake}
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
            {requestHistoryMayHaveCreatedStory
              ? "This latest request saved no story or answer, but an earlier response-lost attempt may have created a story; check Your stories before continuing."
              : "No story or answer was saved."}{" "}
            You can change the limits, edit what you wrote, or leave this here.
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
              onClick={abandonIntake}
              className="font-ui text-xs uppercase tracking-wider underline underline-offset-4"
            >
              Leave
            </Link>
          </div>
        </div>
      ) : null}

      {rateLimited ? (
        <div
          ref={rateLimitedRef}
          tabIndex={-1}
          role="status"
          className="space-y-4 border border-[var(--color-ink-soft)]/35 p-5 focus:outline-2 focus:outline-offset-4 focus:outline-[var(--color-accent)]"
        >
          <h2 className="text-xl">A pause</h2>
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Onward has reached a recent story-start limit for this account or
            connection. The rate-limited request did not start a story.{" "}
            {requestHistoryMayHaveCreatedStory
              ? "An earlier response-lost attempt may still have created one; check Your stories before continuing. "
              : ""}
            {rateLimitRetryMinutes === null
              ? "Please try again later."
              : `Try again in at least ${rateLimitRetryMinutes} ${
                  rateLimitRetryMinutes === 1 ? "minute" : "minutes"
                }.`}{" "}
            A daily limit can take longer.
          </p>
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Your draft remains in this form on this page. Refreshing or leaving
            will clear it.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submitMatch(false)}
              className="inline-flex min-h-11 items-center font-ui text-xs uppercase tracking-wider underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
            >
              Try again after the wait
            </button>
            <button
              type="button"
              onClick={focusRateLimitedDraft}
              className="inline-flex min-h-11 items-center font-ui text-xs uppercase tracking-wider underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
            >
              Review what I wrote
            </button>
            <Link
              href="/"
              onClick={abandonIntake}
              className="inline-flex min-h-11 items-center font-ui text-xs uppercase tracking-wider underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
            >
              Return home
            </Link>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="font-ui text-sm text-[var(--color-accent)]">
          {error}
        </p>
      ) : null}

      {flowConflict ? (
        <div role="alert" className="space-y-3 border-l-2 border-[var(--color-accent)] pl-4">
          <p className="font-ui text-sm text-[var(--color-accent)]">
            This story journey has already been used or has expired.
          </p>
          <a
            ref={flowConflictRef}
            href="/begin"
            onClick={abandonIntake}
            className="font-ui text-xs uppercase tracking-wider underline underline-offset-4"
          >
            Start a fresh story
          </a>
        </div>
      ) : null}

      {!noCloseMatch && !flowConflict && !rateLimited ? (
        <div className="space-y-3">
          <p
            aria-hidden="true"
            className="min-h-5 font-ui text-sm text-[var(--color-ink-soft)]"
          >
            {submissionCopy?.liveStatus ?? ""}
          </p>
          <button
            type="submit"
            disabled={
              submitting || (clarificationNeeded && clarification === null)
            }
            className="min-h-11 border border-[var(--color-accent-deep)] px-6 py-3 font-ui text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {submissionCopy
              ? submissionCopy.buttonLabel
              : clarificationNeeded
                ? "Use this answer"
                : "Begin"}
          </button>
        </div>
      ) : null}
      </motion.form>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {submissionCopy?.liveStatus ?? ""}
      </p>
    </>
  );
}

function parseRetryAfterMinutes(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.max(1, Math.ceil(seconds / 60));
}

async function sendIntakeStarted(
  flowId: TelemetryFlowId,
  viewportBucket: "small" | "large",
): Promise<void> {
  const request = () =>
    fetch("/api/telemetry/intake-started", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [TELEMETRY_FLOW_HEADER]: flowId,
      },
      body: JSON.stringify({ viewportBucket }),
      cache: "no-store",
      keepalive: true,
    });
  try {
    const response = await request();
    if (response.ok) return;
    await request();
  } catch {
    try {
      await request();
    } catch {
      // Visibility telemetry never changes form behavior.
    }
  }
}
