import "server-only";
import type { MatchRecipe, MatchResponse } from "./types";
import { CRISIS_RESOURCES, classifyCrisis, crisisRegexVersion } from "./safety";
import { createSession } from "./session";
import { match, resolveRetrievalMode } from "./matching";
import { matchConfigVersion } from "./match-config";
import { getByKey } from "./figures";
import { activeRecipe, writeOpeningCopy } from "./llm";
import { embeddingModelId } from "./embeddings";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "./opening-copy";

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

export async function handleIntake(input: unknown): Promise<MatchResponse> {
  const validated = validateIntake(input);
  if ("error" in validated) return validated;

  const crisis = classifyCrisis(validated.feeling);
  if (crisis.crisisDetected) {
    return { crisis: true, resources: CRISIS_RESOURCES };
  }

  const result = await match(validated);

  // Generate the opening eyebrow from the user's feeling + the chosen stage. Best-effort:
  // writeOpeningCopy never throws (it degrades to a neutral line), and a missing stage
  // (shouldn't happen — match() validates in-pool) also falls back, so intake never fails
  // on copy.
  const stage = await getByKey(result.figureKey, result.stageId);
  const openingCopy = stage
    ? await writeOpeningCopy({ feeling: validated.feeling, stage })
    : { eyebrow: NEUTRAL_EYEBROW, prefaceLines: DEFAULT_PREFACE_LINES };

  // Freeze the active config/model versions on the session for auditable replay. activeRecipe()
  // stays LLM-only; the embedder id and configured retrieval mode are merged here so the embedding
  // and LLM provider boundaries stay decoupled.
  const matchRecipe: MatchRecipe = {
    matchConfigVersion,
    crisisRegexVersion,
    ...activeRecipe(),
    embeddingModelId: embeddingModelId(),
    retrievalMode: resolveRetrievalMode(),
  };

  const sessionId = await createSession({
    figureKey: result.figureKey,
    stageId: result.stageId,
    framing: result.framing,
    openingCopy,
    age: validated.age,
    feeling: validated.feeling,
    matchRecipe,
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
