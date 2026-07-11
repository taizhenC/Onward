import "server-only";
import type { MatchRecipe, MatchResponse } from "./types";
import { CRISIS_RESOURCES, classifyCrisis, crisisRegexVersion } from "./safety";
import { createSession } from "./session";
import { matchForIntake, resolveRetrievalMode } from "./matching";
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
import { composeStoryArtifact } from "./story-composer";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "./opening-copy";
import {
  filterStorySpecCatalog,
  parseStoryBoundaries,
  type StoryBoundaries,
} from "./story-boundaries";
import type { StorySpec } from "./story-spec-types";
import {
  RESONANCE_BRIEF_VERSION,
  createResonanceBrief,
} from "./resonance-brief";
import {
  MATCH_RECOVERY_POLICY_VERSION,
  decideMatchDisposition,
  parseMatchClarification,
  type MatchClarification,
} from "./match-recovery";
import {
  consumeMatchRecoveryToken,
  issueMatchRecoveryToken,
  parseMatchRecoveryToken,
  type MatchRecoveryIdentity,
} from "./match-recovery-flow";

export type IntakeInput = {
  age: number;
  feeling: string;
  boundaries?: StoryBoundaries;
  clarification?: MatchClarification;
  acceptAdjacent?: boolean;
  recoveryToken?: string;
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
  clarificationRaw: unknown;
  acceptAdjacentRaw: unknown;
  recoveryTokenRaw: unknown;
};

type ValidatedIntakeInput = {
  age: number;
  feeling: string;
  boundaries: StoryBoundaries | undefined;
  clarification: MatchClarification | undefined;
  acceptAdjacent: boolean;
  recoveryToken: string | undefined;
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
  const parsedClarification = parseMatchClarification(core.clarificationRaw);
  if ("error" in parsedClarification) return parsedClarification;
  if (
    core.acceptAdjacentRaw !== undefined &&
    typeof core.acceptAdjacentRaw !== "boolean"
  ) {
    return { error: "Adjacent-match preference must be a boolean." };
  }
  const parsedRecoveryToken = parseMatchRecoveryToken(core.recoveryTokenRaw);
  if ("error" in parsedRecoveryToken) return parsedRecoveryToken;
  if (
    parsedRecoveryToken.value &&
    parsedClarification.value === undefined &&
    core.acceptAdjacentRaw !== true
  ) {
    return { error: "Choose an answer or accept the adjacent story to continue." };
  }
  const validated: ValidatedIntakeInput = {
    age: core.age,
    feeling: core.feeling,
    boundaries: parsedBoundaries.value,
    clarification: parsedClarification.value,
    acceptAdjacent: core.acceptAdjacentRaw === true,
    recoveryToken: parsedRecoveryToken.value,
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

  const recoveryIdentity: MatchRecoveryIdentity = {
    age: validated.age,
    feeling: validated.feeling,
    ...(validated.boundaries ? { boundaries: validated.boundaries } : {}),
  };

  // Rate limit before matching/providers, but after the cheap content-readiness
  // gate so an editorial outage never consumes a reader's attempt budget.
  if (validated.recoveryToken) {
    let recoveryPurpose: "clarification" | "adjacent_acceptance" | null = null;
    try {
      recoveryPurpose = await consumeMatchRecoveryToken(
        validated.recoveryToken,
        ctx.userId,
        recoveryIdentity,
      );
    } catch {
      return { temporarilyUnavailable: true };
    }
    if (!recoveryPurpose) {
      return { error: "This match step expired. Please revise and try again." };
    }
    if (
      recoveryPurpose === "adjacent_acceptance" &&
      !validated.acceptAdjacent
    ) {
      return {
        error: "This final recovery step can only open the clearly labeled adjacent story.",
      };
    }
  } else {
    const allowed = await consumeMatchRateLimit(ctx.userId, ctx.ipHash);
    if (!allowed) {
      return { rateLimited: true };
    }
  }

  let result;
  try {
    result = await matchForIntake({
      age: validated.age,
      feeling: validated.feeling,
      eligibleStageKeys,
      clarification: validated.clarification,
    });
  } catch {
    return { temporarilyUnavailable: true };
  }

  const disposition = decideMatchDisposition({
    confidence: result.confidence,
    framing: result.framing,
    ageFallback: result.ageFallback,
    clarificationProvided: validated.clarification !== undefined,
    acceptAdjacent: validated.acceptAdjacent,
  });
  if (disposition === "clarification_needed") {
    let recoveryToken: string;
    try {
      recoveryToken = await issueMatchRecoveryToken(
        ctx.userId,
        recoveryIdentity,
        "clarification",
      );
    } catch {
      return { temporarilyUnavailable: true };
    }
    return {
      clarificationNeeded: true,
      policyVersion: MATCH_RECOVERY_POLICY_VERSION,
      recoveryToken,
    };
  }
  if (disposition === "no_close_match") {
    let recoveryToken: string;
    try {
      recoveryToken = await issueMatchRecoveryToken(
        ctx.userId,
        recoveryIdentity,
        "adjacent_acceptance",
      );
    } catch {
      return { temporarilyUnavailable: true };
    }
    return {
      noCloseMatch: true,
      policyVersion: MATCH_RECOVERY_POLICY_VERSION,
      recoveryToken,
    };
  }
  const selectedFraming =
    disposition === "close_match" ? result.framing : "partial";
  const resonanceBrief = createResonanceBrief(
    validated.feeling,
    validated.boundaries,
    validated.clarification,
  );

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
    resonanceBriefVersion: RESONANCE_BRIEF_VERSION,
    matchRecoveryPolicyVersion: MATCH_RECOVERY_POLICY_VERSION,
  };

  // The selected spec comes from the already validated and boundary-filtered
  // catalog. The persistence RPC rechecks publication under a row lock.
  const storySpec = eligibleCatalog.get(
    storySpecStageKey(result.figureKey, result.stageId),
  );
  if (!storySpec) return { temporarilyUnavailable: true };

  const generatedOpeningCopy = await writeOpeningCopy({
    resonanceBrief,
    stage,
  });

  let artifact;
  try {
    artifact = await composeStoryArtifact({
      storySpec,
      stage,
      matchRecipe,
      openingCopy: generatedOpeningCopy,
      fallbackOpeningCopy: {
        eyebrow: NEUTRAL_EYEBROW,
        prefaceLines: DEFAULT_PREFACE_LINES,
      },
      framing: selectedFraming,
      resonanceBrief,
      boundaries: validated.boundaries,
      allowDraftSpec: process.env.PERSISTENCE !== "supabase",
    });
  } catch {
    // Never reflect or log composition detail: it may contain curated prose.
    return { temporarilyUnavailable: true };
  }

  let sessionId: string;
  try {
    sessionId = await createSession({
      userId: ctx.userId,
      figureKey: result.figureKey,
      stageId: result.stageId,
      framing: selectedFraming,
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

  return {
    age,
    feeling,
    boundariesRaw: candidate.boundaries,
    clarificationRaw: candidate.clarification,
    acceptAdjacentRaw: candidate.acceptAdjacent,
    recoveryTokenRaw: candidate.recoveryToken,
  };
}

function feelingForSafety(input: unknown): string | null {
  if (input === null || typeof input !== "object") return null;
  const feeling = (input as Record<string, unknown>).feeling;
  return typeof feeling === "string" ? feeling : null;
}
