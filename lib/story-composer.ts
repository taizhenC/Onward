import "server-only";
import { requestHybridPlan } from "./llm";
import {
  buildHybridPlanRequest,
  HybridPlanProviderError,
  validateHybridCompositionPlan,
  type HybridPlanFailureReason,
  type HybridPlanRequest,
} from "./hybrid-composition";
import {
  composeCanonicalStoryArtifact,
  composeHybridStoryArtifact,
  StoryCompositionError,
  type ComposeCanonicalArtifactInput,
} from "./story-artifact";
import type { StoryArtifact } from "./story-artifact-types";
import type { OpeningCopy } from "./types";
import { productionStoryRecipeExecutionPlan } from "./story-recipe";

const MAX_HYBRID_ATTEMPTS = 2;

export type StoryComposerInput = Omit<
  ComposeCanonicalArtifactInput,
  "fallbackReason" | "attemptCount"
> & {
  fallbackOpeningCopy: OpeningCopy;
};

export type HybridPlanRequester = (
  input: HybridPlanRequest,
) => Promise<unknown>;

export type StoryComposerOptions = {
  hybridEnabled?: boolean;
  requestPlan?: HybridPlanRequester;
};

export async function composeStoryArtifact(
  input: StoryComposerInput,
  options: StoryComposerOptions = {},
): Promise<StoryArtifact> {
  const { fallbackOpeningCopy, ...compositionInput } = input;
  let safeOpeningCopy = compositionInput.openingCopy;
  let baseline: StoryArtifact;
  try {
    baseline = composeCanonicalStoryArtifact({
      ...compositionInput,
      openingCopy: safeOpeningCopy,
      fallbackReason: "canonical_only",
      attemptCount: 0,
    });
  } catch (error) {
    if (!isOpeningFailure(error)) throw error;
    safeOpeningCopy = fallbackOpeningCopy;
    baseline = composeCanonicalStoryArtifact({
      ...compositionInput,
      openingCopy: safeOpeningCopy,
      fallbackReason: "validator_rejected",
      attemptCount: 0,
    });
  }

  const hybridEnabled =
    process.env.NODE_ENV === "production"
      ? hybridStoryComposerEnabled()
      : (options.hybridEnabled ?? hybridStoryComposerEnabled());
  if (!hybridEnabled) return baseline;

  const requester = options.requestPlan ?? requestHybridPlan;
  const failures: HybridPlanFailureReason[] = [];
  let fallbackReason: StoryArtifact["composition"]["fallbackReason"] =
    "provider_output_invalid";
  let attempts = 0;

  for (let attempt = 1; attempt <= MAX_HYBRID_ATTEMPTS; attempt += 1) {
    const request = buildHybridPlanRequest(
      compositionInput.storySpec,
      compositionInput.resonanceBrief,
      failures,
    );
    if (request.allowedTransitionRoles.length === 0) return baseline;

    attempts = attempt;
    let candidate: unknown;
    try {
      candidate = await requester(request);
    } catch (error) {
      const reason =
        error instanceof HybridPlanProviderError
          ? error.reason
          : "provider_error";
      addFailure(failures, reason);
      fallbackReason =
        reason === "provider_timeout" ? "provider_timeout" : "provider_error";
      continue;
    }

    const validation = validateHybridCompositionPlan(candidate, request);
    if (!validation.valid) {
      validation.failureReasons.forEach((reason) => addFailure(failures, reason));
      fallbackReason = "provider_output_invalid";
      continue;
    }

    try {
      return composeHybridStoryArtifact({
        ...compositionInput,
        openingCopy: safeOpeningCopy,
        plan: validation.plan,
        attemptCount: attempt as 1 | 2,
      });
    } catch (error) {
      if (!(error instanceof StoryCompositionError)) throw error;
      addFailure(failures, "artifact_rejected");
      fallbackReason = "validator_rejected";
    }
  }

  return composeCanonicalStoryArtifact({
    ...compositionInput,
    openingCopy: safeOpeningCopy,
    fallbackReason,
    attemptCount: attempts,
  });
}

export function hybridStoryComposerEnabled(
  configured = process.env.HYBRID_STORY_COMPOSER_ENABLED,
  environment = process.env.NODE_ENV,
): boolean {
  if (environment === "production" && environment === process.env.NODE_ENV) {
    return (
      productionStoryRecipeExecutionPlan()?.hybridStoryComposerEnabled ?? false
    );
  }
  const normalized = configured?.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  // Production promotion is deliberate and eval-gated. Local/stub development
  // exercises the hybrid path by default so it cannot silently rot.
  return environment !== "production";
}

function isOpeningFailure(error: unknown): boolean {
  return (
    error instanceof StoryCompositionError &&
    error.reasons.every((reason) =>
      ["opening_copy_invalid", "tone_invalid", "disclosure_echo"].includes(reason),
    )
  );
}

function addFailure(
  failures: HybridPlanFailureReason[],
  reason: HybridPlanFailureReason,
): void {
  if (!failures.includes(reason)) failures.push(reason);
}
