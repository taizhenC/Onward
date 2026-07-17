import "server-only";
import {
  APPROVED_PRODUCTION_RECIPE,
  requireApprovedProductionRecipe,
} from "./match-config";
import type { IntakeMatchResult } from "./matching";
import type { MatchDisposition } from "./match-recovery";
import type { StoryArtifact } from "./story-artifact-types";
import type { StoryBoundaries } from "./story-boundaries";
import { recordProductEvent } from "./telemetry";
import type { RetrievalMode } from "./types";
import type {
  ProductEvent,
  StoryRole,
  TelemetryFlowId,
} from "./telemetry-types";

export type LinkedTelemetryWriteResult =
  | "created"
  | "duplicate"
  | "conflict"
  | "unavailable"
  | "skipped";

export function matchCompletedEvent(input: {
  result: IntakeMatchResult;
  disposition: MatchDisposition;
  storyRole: StoryRole;
  boundaries: StoryBoundaries | undefined;
}): Extract<ProductEvent, { event: "match_completed" }> {
  const recipe = requireApprovedProductionRecipe(input.result.retrievalMode);
  return {
    event: "match_completed",
    recipeId: recipe.recipeId,
    storyRole: input.storyRole,
    disposition: telemetryDisposition(input.disposition),
    confidenceBucket: input.result.confidence,
    matchPath:
      input.result.chosenBy === "rerank" ? "rerank" : "keyword_fallback",
    ageFallback: input.result.ageFallback,
    boundaryOutcome: input.boundaries ? "passed" : "not_set",
  };
}

export function noEligibleMatchCompletedEvent(
  configuredRetrievalMode: RetrievalMode,
): Extract<
  ProductEvent,
  { event: "match_completed" }
> {
  const recipe = requireApprovedProductionRecipe(configuredRetrievalMode);
  return {
    event: "match_completed",
    recipeId: recipe.recipeId,
    storyRole: "initial",
    disposition: "no_close_match",
    confidenceBucket: "not_applicable",
    matchPath: "not_run",
    ageFallback: false,
    boundaryOutcome: "no_eligible",
  };
}

export function artifactCreatedEvent(
  artifact: StoryArtifact,
  storyRole: StoryRole,
): Extract<ProductEvent, { event: "artifact_created" }> {
  if (
    artifact.recipe.match.recipeId !== APPROVED_PRODUCTION_RECIPE.recipeId ||
    artifact.recipe.match.matchConfigVersion !==
      APPROVED_PRODUCTION_RECIPE.matchConfigVersion ||
    artifact.recipe.match.retrievalMode !==
      APPROVED_PRODUCTION_RECIPE.retrievalMode
  ) {
    throw new Error("artifact telemetry requires the approved recipe");
  }

  const attempts = artifact.composition.attemptCount;
  if (!Number.isInteger(attempts) || attempts === undefined || attempts < 0) {
    throw new Error("artifact telemetry requires a valid attempt count");
  }

  if (artifact.composition.mode === "hybrid") {
    if (attempts !== 1 && attempts !== 2) {
      throw new Error("hybrid artifact telemetry requires one or two attempts");
    }
    if (artifact.composition.fallbackReason !== undefined) {
      throw new Error("hybrid artifact telemetry cannot carry a fallback");
    }
    return {
      event: "artifact_created",
      recipeId: APPROVED_PRODUCTION_RECIPE.recipeId,
      storyRole,
      compositionMode: "hybrid",
      fallbackReason: "none",
      attemptBucket: attempts === 1 ? "first" : "retry",
    };
  }

  const fallbackReason = artifact.composition.fallbackReason;
  if (!fallbackReason) {
    throw new Error("canonical artifact telemetry requires a fallback reason");
  }
  const notAttempted = attempts === 0;
  if (
    notAttempted &&
    fallbackReason !== "canonical_only" &&
    fallbackReason !== "validator_rejected"
  ) {
    throw new Error("canonical artifact fallback and attempt count conflict");
  }
  if (!notAttempted && fallbackReason === "canonical_only") {
    throw new Error("canonical-only telemetry cannot report provider attempts");
  }
  if (attempts > 2) {
    throw new Error("artifact telemetry attempt count exceeds policy");
  }
  return {
    event: "artifact_created",
    recipeId: APPROVED_PRODUCTION_RECIPE.recipeId,
    storyRole,
    compositionMode: "canonical_fallback",
    fallbackReason,
    attemptBucket: notAttempted ? "not_attempted" : "exhausted",
  };
}

// Pure observability must not turn a valid non-crisis product response into an
// error. Transaction-coupled events use prepareProductEventCapture() instead;
// this helper is only for milestones whose durable state is the event itself.
export async function recordLinkedProductEventBestEffort(
  event: ProductEvent,
  flowId: TelemetryFlowId | null,
): Promise<LinkedTelemetryWriteResult> {
  if (!flowId) return "skipped";
  try {
    return await recordProductEvent({ event, flowId });
  } catch {
    return "unavailable";
  }
}

function telemetryDisposition(
  disposition: MatchDisposition,
): Extract<ProductEvent, { event: "match_completed" }>["disposition"] {
  switch (disposition) {
    case "close_match":
      return "close";
    case "adjacent_match":
      return "adjacent";
    case "clarification_needed":
      return "clarification_required";
    case "no_close_match":
      return "no_close_match";
    default: {
      const exhaustive: never = disposition;
      return exhaustive;
    }
  }
}
