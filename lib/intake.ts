import "server-only";
import type { MatchResponse } from "./types";
import { CRISIS_RESOURCES, classifyCrisis } from "./safety";
import { createSession } from "./session";
import { match } from "./matching";

export type IntakeInput = {
  age: number;
  feeling: string;
};

export type IntakeValidationError = {
  error: string;
};

type ValidatedIntakeInput = IntakeInput;

const MIN_AGE = 13;
const MAX_AGE = 100;
const MIN_FEELING_LENGTH = 10;
const MAX_FEELING_LENGTH = 1000;

export function handleIntake(input: unknown): MatchResponse {
  const validated = validateIntake(input);
  if ("error" in validated) return validated;

  const crisis = classifyCrisis(validated.feeling);
  if (crisis.crisisDetected) {
    return { crisis: true, resources: CRISIS_RESOURCES };
  }

  const result = match(validated);
  const sessionId = createSession({
    figureKey: result.figureKey,
    stageId: result.stageId,
    framing: result.framing,
    age: validated.age,
    feeling: validated.feeling,
  });

  return { sessionId };
}

function validateIntake(input: unknown): ValidatedIntakeInput | IntakeValidationError {
  if (input === null || typeof input !== "object") {
    return { error: "Intake body must be an object." };
  }

  const candidate = input as Record<string, unknown>;
  const age = candidate.age;
  const feeling = candidate.feeling;

  if (
    typeof age !== "number" ||
    !Number.isFinite(age) ||
    age < MIN_AGE ||
    age > MAX_AGE
  ) {
    return { error: "Age must be a number between 13 and 100." };
  }

  if (
    typeof feeling !== "string" ||
    feeling.trim().length < MIN_FEELING_LENGTH ||
    feeling.length > MAX_FEELING_LENGTH
  ) {
    return { error: "Feeling must be between 10 and 1000 characters." };
  }

  return { age, feeling };
}
