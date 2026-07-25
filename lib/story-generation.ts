import "server-only";
import { activeRecipe, writeOpeningCopy } from "./llm";
import { getByKey, listAll } from "./figures";
import type { IntakeMatchResult } from "./matching";
import { crisisRegexVersion } from "./safety";
import { buildDraftStorySpec } from "./story-spec";
import {
  listPublishedStorySpecCatalog,
  storySpecStageKey,
} from "./story-spec-repository";
import { composeStoryArtifact } from "./story-composer";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "./opening-copy";
import {
  filterStorySpecCatalog,
  STORY_BOUNDARY_POLICY_VERSION,
  type StoryBoundaries,
} from "./story-boundaries";
import {
  STORY_SPEC_SCHEMA_VERSION,
  type StorySpec,
} from "./story-spec-types";
import {
  RESONANCE_BRIEF_VERSION,
  createResonanceBrief,
} from "./resonance-brief";
import {
  MATCH_RECOVERY_POLICY_VERSION,
  type MatchClarification,
} from "./match-recovery";
import { ALTERNATE_STORY_POLICY_VERSION } from "./alternate-story-types";
import type { Framing, MatchRecipe } from "./types";
import {
  STORY_ARTIFACT_VALIDATOR_VERSION,
  STORY_COMPOSER_VERSION,
  type StoryArtifact,
} from "./story-artifact-types";
import { persistenceMode } from "./persistence";
import { assertProductionStoryRecipeRuntime } from "./story-recipe";

export type StoryCatalogResult =
  | { status: "ready"; catalog: ReadonlyMap<string, StorySpec> }
  | { status: "no_eligible" }
  | { status: "unavailable" };

export type PreparedStory = {
  figureKey: string;
  stageId: string;
  framing: Framing;
  matchRecipe: MatchRecipe;
  artifact: StoryArtifact;
};

export async function loadEligibleStoryCatalog(input: {
  boundaries: StoryBoundaries | undefined;
  excludedStageKeys?: ReadonlySet<string>;
}): Promise<StoryCatalogResult> {
  let catalog: ReadonlyMap<string, StorySpec>;
  try {
    catalog =
      persistenceMode() === "supabase"
        ? await listPublishedStorySpecCatalog()
        : new Map(
            (await listAll()).map((stage) => [
              storySpecStageKey(stage.figureKey, stage.stageId),
              buildDraftStorySpec(stage),
            ]),
          );
  } catch {
    return { status: "unavailable" };
  }
  if (catalog.size === 0) return { status: "unavailable" };

  // Exclusion happens at the catalog boundary, before age fallback, either
  // retrieval recipe, reranking, keyword fallback, or composition can see it.
  const withoutExcluded = input.excludedStageKeys?.size
    ? new Map(
        [...catalog].filter(([key]) => !input.excludedStageKeys?.has(key)),
      )
    : catalog;
  const eligible = filterStorySpecCatalog(withoutExcluded, input.boundaries);
  return eligible.size > 0
    ? { status: "ready", catalog: eligible }
    : { status: "no_eligible" };
}

export async function prepareStory(input: {
  age: number;
  feeling: string;
  boundaries: StoryBoundaries | undefined;
  clarification: MatchClarification | undefined;
  match: IntakeMatchResult;
  catalog: ReadonlyMap<string, StorySpec>;
  framing: Framing;
  mode: "initial" | "alternate";
}): Promise<PreparedStory | null> {
  const framing = input.mode === "alternate" ? "partial" : input.framing;
  const key = storySpecStageKey(input.match.figureKey, input.match.stageId);
  const storySpec = input.catalog.get(key);
  if (!storySpec) return null;

  // A concurrent editorial retirement or source drift fails closed before any
  // artifact is persisted. The database completion RPC repeats this check.
  const stage = await getByKey(input.match.figureKey, input.match.stageId);
  if (!stage) return null;

  const resonanceBrief = createResonanceBrief(
    input.feeling,
    input.boundaries,
    input.clarification,
  );
  const matchRecipe = activeMatchRecipe(input.match, input.mode);
  const generatedOpeningCopy = await writeOpeningCopy({ resonanceBrief, stage });
  const artifact = await composeStoryArtifact({
    storySpec,
    stage,
    matchRecipe,
    openingCopy: generatedOpeningCopy,
    fallbackOpeningCopy: {
      eyebrow: NEUTRAL_EYEBROW,
      prefaceLines: DEFAULT_PREFACE_LINES,
    },
    framing,
    resonanceBrief,
    boundaries: input.boundaries,
    allowDraftSpec: persistenceMode() === "memory",
  });

  return {
    figureKey: input.match.figureKey,
    stageId: input.match.stageId,
    framing,
    matchRecipe,
    artifact,
  };
}

function activeMatchRecipe(
  match: IntakeMatchResult,
  mode: "initial" | "alternate",
): MatchRecipe {
  const runtime = assertProductionStoryRecipeRuntime();
  const approvedRecipe = runtime.recipe;
  if (match.retrievalMode !== approvedRecipe.retrievalMode) {
    throw new Error("The matched retrieval path is not approved.");
  }
  const llmRecipe = activeRecipe();
  if (
    approvedRecipe.rerankPromptVersion !== llmRecipe.rerankPromptVersion ||
    approvedRecipe.storyPromptVersion !== llmRecipe.storyPromptVersion ||
    approvedRecipe.composerVersion !== STORY_COMPOSER_VERSION ||
    approvedRecipe.validatorVersion !== STORY_ARTIFACT_VALIDATOR_VERSION ||
    approvedRecipe.storySpecSchemaVersion !== STORY_SPEC_SCHEMA_VERSION ||
    approvedRecipe.boundaryPolicyVersion !== STORY_BOUNDARY_POLICY_VERSION ||
    approvedRecipe.resonanceBriefVersion !== RESONANCE_BRIEF_VERSION
  ) {
    throw new Error("The story recipe code identity is not approved.");
  }
  return {
    recipeId: approvedRecipe.recipeId,
    recipeManifestHash: approvedRecipe.manifestSha256,
    datasetVersion: approvedRecipe.datasetVersion,
    deploymentVersion: runtime.deploymentVersion,
    matchConfigVersion: approvedRecipe.matchConfigVersion,
    librarySnapshotSha256: approvedRecipe.librarySnapshotSha256,
    crisisRegexVersion,
    ...llmRecipe,
    embeddingModelId: approvedRecipe.embeddingModelId,
    // The path that actually produced this match is authoritative. Never
    // re-read mutable process configuration after matching and accidentally
    // assign a different recipe identity to the persisted session.
    retrievalMode: match.retrievalMode,
    rerankTemperature: approvedRecipe.rerankTemperature,
    rerankReasoningEffort: approvedRecipe.rerankReasoningEffort,
    rerankTopK: approvedRecipe.rerankTopK,
    storyTemperature: approvedRecipe.storyTemperature,
    storyComposerMode: approvedRecipe.storyComposerMode,
    hybridStoryComposerEnabled:
      approvedRecipe.hybridStoryComposerEnabled,
    composerVersion: approvedRecipe.composerVersion,
    validatorVersion: approvedRecipe.validatorVersion,
    storySpecSchemaVersion: approvedRecipe.storySpecSchemaVersion,
    boundaryPolicyVersion: approvedRecipe.boundaryPolicyVersion,
    resonanceBriefVersion: RESONANCE_BRIEF_VERSION,
    matchRecoveryPolicyVersion: MATCH_RECOVERY_POLICY_VERSION,
    ...(mode === "alternate"
      ? { alternateStoryPolicyVersion: ALTERNATE_STORY_POLICY_VERSION }
      : {}),
  };
}
