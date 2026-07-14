import "server-only";
import { activeRecipe, writeOpeningCopy } from "./llm";
import { embeddingModelId } from "./embeddings";
import { getByKey, listAll } from "./figures";
import { matchConfigVersion, recipeIdForRetrievalMode } from "./match-config";
import { resolveRetrievalMode, type IntakeMatchResult } from "./matching";
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
  type StoryBoundaries,
} from "./story-boundaries";
import type { StorySpec } from "./story-spec-types";
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
import type { StoryArtifact } from "./story-artifact-types";
import { persistenceMode } from "./persistence";

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
  const matchRecipe = activeMatchRecipe(input.mode);
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

function activeMatchRecipe(mode: "initial" | "alternate"): MatchRecipe {
  const retrievalMode = resolveRetrievalMode();
  return {
    recipeId: recipeIdForRetrievalMode(retrievalMode),
    matchConfigVersion,
    crisisRegexVersion,
    ...activeRecipe(),
    embeddingModelId: embeddingModelId(),
    retrievalMode,
    resonanceBriefVersion: RESONANCE_BRIEF_VERSION,
    matchRecoveryPolicyVersion: MATCH_RECOVERY_POLICY_VERSION,
    ...(mode === "alternate"
      ? { alternateStoryPolicyVersion: ALTERNATE_STORY_POLICY_VERSION }
      : {}),
  };
}
