import "server-only";
import type { MatchRecipe, MatchResponse } from "./types";
import { CRISIS_RESOURCES, classifyCrisis, crisisRegexVersion } from "./safety";
import { createSession } from "./session";
import { match, resolveRetrievalMode } from "./matching";
import { APPROVED_PRODUCTION_RECIPE, matchConfigVersion } from "./match-config";
import { getByKey, listAll } from "./figures";
import { activeRecipe, writeOpeningCopy } from "./llm";
import { embeddingModelId } from "./embeddings";
import { consumeMatchRateLimit } from "./rate-limit";
import { buildDraftStorySpec } from "./story-spec";
import {
  listPublishedStorySpecCatalog,
  storySpecStageKey,
} from "./story-spec-repository";
import { composeCanonicalStoryArtifact } from "./story-artifact";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "./opening-copy";
import {
  filterStorySpecCatalog,
  parseStoryBoundaries,
  type StoryBoundaries,
} from "./story-boundaries";
import type { StorySpec } from "./story-spec-types";

export type IntakeInput = {
  age: number;
  feeling: string;
  boundaries?: StoryBoundaries;
};

// Request identity, composed by the caller (the route pairs the authenticated user
// with the hashed request IP; scripts pass fixed ids). handleIntake deliberately does
// NOT import lib/auth.ts — keeping it callable outside request scope (smoke, check-db).
export type IntakeContext = {
  userId: string;
  ipHash: string;
};

export type IntakeValidationError = {
  error: string;
};

type CoreIntakeInput = {
  age: number;
  feeling: string;
  boundariesRaw: unknown;
};

type ValidatedIntakeInput = {
  age: number;
  feeling: string;
  boundaries: StoryBoundaries | undefined;
};

const MIN_AGE = 13;
const MAX_AGE = 100;
const MIN_FEELING_LENGTH = 10;
const MAX_FEELING_LENGTH = 1000;

export async function handleIntake(
  input: unknown,
  ctx: IntakeContext,
): Promise<MatchResponse> {
  // Crisis detection uses any string feeling before age/boundary validation and
  // is never rate-limited. Malformed optional controls cannot hide resources.
  const safetyText = feelingForSafety(input);
  if (safetyText) {
    const crisis = classifyCrisis(safetyText);
    if (crisis.crisisDetected) {
      return { crisis: true, resources: CRISIS_RESOURCES };
    }
  }

  const core = validateCoreIntake(input);
  if ("error" in core) return core;
  const parsedBoundaries = parseStoryBoundaries(core.boundariesRaw);
  if ("error" in parsedBoundaries) return parsedBoundaries;
  const validated: ValidatedIntakeInput = {
    age: core.age,
    feeling: core.feeling,
    boundaries: parsedBoundaries.value,
  };

  // Operational kill switch for a safety, privacy, or content incident. Crisis
  // support remains available because it is evaluated above this branch. The
  // disabled path persists nothing and spends no provider or rate-limit budget.
  if (process.env.STORY_CREATION_ENABLED?.trim().toLowerCase() === "false") {
    return { temporarilyUnavailable: true };
  }

  let catalog: ReadonlyMap<string, StorySpec>;
  try {
    catalog =
      process.env.PERSISTENCE === "supabase"
        ? await listPublishedStorySpecCatalog()
        : new Map(
            (await listAll()).map((stage) => [
              storySpecStageKey(stage.figureKey, stage.stageId),
              buildDraftStorySpec(stage),
            ]),
          );
  } catch {
    return { temporarilyUnavailable: true };
  }
  if (catalog.size === 0) return { temporarilyUnavailable: true };

  const eligibleCatalog = filterStorySpecCatalog(catalog, validated.boundaries);
  if (eligibleCatalog.size === 0) return { noEligibleStory: true };
  const eligibleStageKeys = new Set(eligibleCatalog.keys());

  // Rate limit before matching/providers, but after the cheap content-readiness
  // gate so an editorial outage never consumes a reader's attempt budget.
  const allowed = await consumeMatchRateLimit(ctx.userId, ctx.ipHash);
  if (!allowed) {
    return { rateLimited: true };
  }

  let result;
  try {
    result = await match({
      age: validated.age,
      feeling: validated.feeling,
      eligibleStageKeys,
    });
  } catch {
    return { temporarilyUnavailable: true };
  }

  // The chosen content must still resolve after matching; a concurrent editorial
  // retirement fails closed before prose generation or persistence.
  const stage = await getByKey(result.figureKey, result.stageId);
  if (!stage) return { temporarilyUnavailable: true };

  // Freeze the active config/model versions on the session for auditable replay. activeRecipe()
  // stays LLM-only; the embedder id and configured retrieval mode are merged here so the embedding
  // and LLM provider boundaries stay decoupled.
  const matchRecipe: MatchRecipe = {
    recipeId: APPROVED_PRODUCTION_RECIPE.recipeId,
    matchConfigVersion,
    crisisRegexVersion,
    ...activeRecipe(),
    embeddingModelId: embeddingModelId(),
    retrievalMode: resolveRetrievalMode(),
  };

  // The selected spec comes from the already validated and boundary-filtered
  // catalog. The persistence RPC rechecks publication under a row lock.
  const storySpec = eligibleCatalog.get(
    storySpecStageKey(result.figureKey, result.stageId),
  );
  if (!storySpec) return { temporarilyUnavailable: true };

  const generatedOpeningCopy = await writeOpeningCopy({
    feeling: validated.feeling,
    stage,
  });

  let artifact;
  try {
    artifact = composeCanonicalStoryArtifact({
      storySpec,
      stage,
      matchRecipe,
      openingCopy: generatedOpeningCopy,
      framing: result.framing,
      disclosure: validated.feeling,
      boundaries: validated.boundaries,
      allowDraftSpec: process.env.PERSISTENCE !== "supabase",
    });
  } catch {
    try {
      artifact = composeCanonicalStoryArtifact({
        storySpec,
        stage,
        matchRecipe,
        openingCopy: {
          eyebrow: NEUTRAL_EYEBROW,
          prefaceLines: DEFAULT_PREFACE_LINES,
        },
        framing: result.framing,
        disclosure: validated.feeling,
        boundaries: validated.boundaries,
        fallbackReason: "validator_rejected",
        allowDraftSpec: process.env.PERSISTENCE !== "supabase",
      });
    } catch {
      // Never reflect or log composition detail: it may contain curated prose.
      return { temporarilyUnavailable: true };
    }
  }

  let sessionId: string;
  try {
    sessionId = await createSession({
      userId: ctx.userId,
      figureKey: result.figureKey,
      stageId: result.stageId,
      framing: result.framing,
      age: validated.age,
      feeling: validated.feeling,
      matchRecipe,
      artifact,
    });
  } catch {
    return { temporarilyUnavailable: true };
  }

  return { sessionId };
}

function validateCoreIntake(input: unknown): CoreIntakeInput | IntakeValidationError {
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

  return { age, feeling, boundariesRaw: candidate.boundaries };
}

function feelingForSafety(input: unknown): string | null {
  if (input === null || typeof input !== "object") return null;
  const feeling = (input as Record<string, unknown>).feeling;
  return typeof feeling === "string" ? feeling : null;
}
