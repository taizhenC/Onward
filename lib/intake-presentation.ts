import {
  INTAKE_MAX_AGE,
  INTAKE_MAX_FEELING_LENGTH,
  INTAKE_MIN_AGE,
  INTAKE_MIN_FEELING_LENGTH,
  intakeFeelingLength,
  isValidIntakeAge,
  isValidIntakeFeeling,
  normalizeIntakeFeeling,
} from "./intake-constraints";

export type IntakeField = "age" | "feeling";

export type IntakeDraft = Readonly<{
  age: string;
  feeling: string;
}>;

export type IntakeDraftValidation = Readonly<
  Record<IntakeField, string | null>
>;

export const INTAKE_WRITING_PROMPTS = Object.freeze([
  "What happened?",
  "What hurts most right now?",
  "What feels uncertain?",
] as const);

export const INTAKE_FICTIONAL_EXAMPLE =
  "Fictional example: I worked hard for an opportunity, it fell apart, and now I am unsure whether to try again.";

export const INTAKE_VALIDATION_COPY = Object.freeze({
  ageRequired: "Enter your age.",
  ageWholeNumber: "Enter your age as a whole number.",
  ageRange: `Enter an age from ${INTAKE_MIN_AGE} to ${INTAKE_MAX_AGE}.`,
  feelingRequired: "Write a little about what is happening.",
  feelingTooShort: `Write at least ${INTAKE_MIN_FEELING_LENGTH} characters so Onward has enough to look for a close story.`,
  feelingTooLong: `Keep this to ${INTAKE_MAX_FEELING_LENGTH.toLocaleString(
    "en-US",
  )} characters or fewer.`,
});

/** Gives the form one validation result for copy and aria-invalid state. */
export function validateIntakeDraft(
  input: IntakeDraft,
): IntakeDraftValidation {
  return Object.freeze({
    age: ageValidationMessage(input.age),
    feeling: feelingValidationMessage(input.feeling),
  });
}

export function firstInvalidIntakeField(
  validation: IntakeDraftValidation,
): IntakeField | null {
  // Age intentionally wins so focus never depends on object-key or render order.
  if (validation.age !== null) return "age";
  if (validation.feeling !== null) return "feeling";
  return null;
}

export type IntakeSubmissionState =
  | "checking_request"
  | "securing_session"
  | "finding_story"
  | "opening_story";

export type IntakeSubmissionCopy = Readonly<{
  buttonLabel: string;
  liveStatus: string;
}>;

/**
 * These states describe observable client transitions, not elapsed-time
 * milestones. Callers should enter them only at the corresponding transition:
 * initial request, post-401 auth, authenticated retry, and successful redirect.
 */
export const INTAKE_SUBMISSION_COPY: Readonly<
  Record<IntakeSubmissionState, IntakeSubmissionCopy>
> = Object.freeze({
  checking_request: Object.freeze({
    buttonLabel: "Checking your request...",
    liveStatus:
      "Checking your request so Onward can find a close life episode and prepare your story.",
  }),
  securing_session: Object.freeze({
    buttonLabel: "Securing a private session...",
    liveStatus: "Securing a private session for your story.",
  }),
  finding_story: Object.freeze({
    buttonLabel: "Finding a close story...",
    liveStatus: "Finding a close life episode and preparing your story.",
  }),
  opening_story: Object.freeze({
    buttonLabel: "Opening your story...",
    liveStatus: "Your story is ready. Opening it now.",
  }),
});

function ageValidationMessage(ageInput: string): string | null {
  const candidate = ageInput.trim();
  if (candidate.length === 0) return INTAKE_VALIDATION_COPY.ageRequired;

  const age = Number(candidate);
  if (!Number.isFinite(age) || !Number.isInteger(age)) {
    return INTAKE_VALIDATION_COPY.ageWholeNumber;
  }
  return isValidIntakeAge(age) ? null : INTAKE_VALIDATION_COPY.ageRange;
}

function feelingValidationMessage(feelingInput: string): string | null {
  const normalized = normalizeIntakeFeeling(feelingInput);
  const meaningfulLength = intakeFeelingLength(normalized.trim());

  if (meaningfulLength === 0) {
    return INTAKE_VALIDATION_COPY.feelingRequired;
  }
  if (intakeFeelingLength(normalized) > INTAKE_MAX_FEELING_LENGTH) {
    return INTAKE_VALIDATION_COPY.feelingTooLong;
  }
  if (
    meaningfulLength < INTAKE_MIN_FEELING_LENGTH ||
    !isValidIntakeFeeling(normalized)
  ) {
    return INTAKE_VALIDATION_COPY.feelingTooShort;
  }
  return null;
}
