import "server-only";
import type { StoryArtifact } from "./story-artifact-types";
import { persistenceMode } from "./persistence";
import {
  isHistoricalConcernFact,
  validateLegacyStoredStoryTransparencyV1,
  validateStoredStoryTransparency,
} from "./story-transparency";
import type { HistoricalConcernReason } from "./story-transparency-types";
import {
  listMemoryHistoricalConcerns,
  submitMemoryHistoricalConcern,
} from "./historical-concern-store-memory";
import { submitSupabaseHistoricalConcern } from "./historical-concern-store-supabase";
import { assertRetentionSink } from "./derived-output-retention";

export type SubmitHistoricalConcernInput = {
  userId: string;
  sessionId: string;
  artifact: StoryArtifact;
  factId: string;
  reason: HistoricalConcernReason;
};

export class HistoricalConcernTargetError extends Error {
  constructor() {
    super("historical concern target is unavailable");
    this.name = "HistoricalConcernTargetError";
  }
}

export async function submitHistoricalConcern(
  input: SubmitHistoricalConcernInput,
): Promise<void> {
  assertRetentionSink(
    "editorial.historical_concern",
    "shared_editorial_store",
  );
  const transparency = input.artifact.transparency;
  if (
    !(
      validateStoredStoryTransparency(transparency) ||
      validateLegacyStoredStoryTransparencyV1(transparency)
    ) ||
    transparency.provenance.status !== "editorially_reviewed" ||
    !isHistoricalConcernFact(transparency, input.factId) ||
    !input.artifact.beats.some((beat) => beat.factIds.includes(input.factId))
  ) {
    throw new HistoricalConcernTargetError();
  }

  if (persistenceMode() === "supabase") {
    await submitSupabaseHistoricalConcern({
      userId: input.userId,
      sessionId: input.sessionId,
      artifactId: input.artifact.artifactId,
      factId: input.factId,
      reason: input.reason,
    });
    return;
  }

  await submitMemoryHistoricalConcern({
    storySpecId: transparency.storySpec.storySpecId,
    storySpecVersion: transparency.storySpec.version,
    figureKey: input.artifact.figureKey,
    stageId: input.artifact.stageId,
    factId: input.factId,
    reason: input.reason,
  });
}

export function _listHistoricalConcerns() {
  if (persistenceMode() === "supabase") {
    throw new Error("historical concern test projection is memory-only");
  }
  return listMemoryHistoricalConcerns();
}
