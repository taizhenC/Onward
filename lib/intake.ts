import "server-only";
import type { MatchResponse } from "./types";
import { CRISIS_RESOURCES, classifyCrisis } from "./safety";
import { createSession } from "./session";
import { matchForIntake } from "./matching";
import { consumeMatchRateLimit } from "./rate-limit";
import {
  parseStoryBoundaries,
  type StoryBoundaries,
} from "./story-boundaries";
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
import { createStoryRequestContext } from "./story-request-context";
import {
  loadEligibleStoryCatalog,
  prepareStory,
} from "./story-generation";
import {
  isValidIntakeAge,
  isValidIntakeFeeling,
  normalizeIntakeFeeling,
} from "./intake-constraints";

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

  const catalogResult = await loadEligibleStoryCatalog({
    boundaries: validated.boundaries,
  });
  if (catalogResult.status === "unavailable") {
    return { temporarilyUnavailable: true };
  }
  if (catalogResult.status === "no_eligible") return { noEligibleStory: true };
  const eligibleCatalog = catalogResult.catalog;
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
  let prepared;
  try {
    prepared = await prepareStory({
      age: validated.age,
      feeling: validated.feeling,
      boundaries: validated.boundaries,
      clarification: validated.clarification,
      match: result,
      catalog: eligibleCatalog,
      framing: selectedFraming,
      mode: "initial",
    });
  } catch {
    // Never reflect or log composition detail: it may contain curated prose.
    return { temporarilyUnavailable: true };
  }
  if (!prepared) return { temporarilyUnavailable: true };

  let sessionId: string;
  try {
    sessionId = await createSession({
      userId: ctx.userId,
      figureKey: prepared.figureKey,
      stageId: prepared.stageId,
      framing: prepared.framing,
      age: validated.age,
      feeling: validated.feeling,
      storyRequestContext: createStoryRequestContext({
        boundaries: validated.boundaries,
        clarification: validated.clarification,
      }),
      matchRecipe: prepared.matchRecipe,
      artifact: prepared.artifact,
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
    !isValidIntakeAge(age)
  ) {
    return { error: "Age must be a whole number between 13 and 100." };
  }

  const normalizedFeeling =
    typeof feeling === "string" ? normalizeIntakeFeeling(feeling) : null;
  if (
    normalizedFeeling === null ||
    !isValidIntakeFeeling(normalizedFeeling)
  ) {
    return { error: "Feeling must be between 10 and 1000 characters." };
  }

  return {
    age,
    feeling: normalizedFeeling,
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
