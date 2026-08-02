import "server-only";
import type { StoredStoryArtifactEnvelope } from "./story-artifact";
import {
  STORY_ARTIFACT_SCHEMA_VERSION,
  type StoryArtifact,
} from "./story-artifact-types";
import {
  LEGACY_DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
  assertRetentionSink,
  parsePersistedRetentionLabel,
  type PersistedRetentionLabel,
} from "./derived-output-retention";

type OwnedArtifact = {
  sessionId: string;
  userId: string;
  artifact: StoryArtifact;
  envelope?: StoredStoryArtifactEnvelope;
  // Optional only for globalThis rows created before the retention contract
  // during a development hot reload.
  retention?: PersistedRetentionLabel;
};

declare global {
  var __onwardStoryArtifacts: Map<string, OwnedArtifact> | undefined;
}

const artifacts =
  globalThis.__onwardStoryArtifacts ??
  (globalThis.__onwardStoryArtifacts = new Map<string, OwnedArtifact>());

const CURRENT_ARTIFACT_RETENTION = assertRetentionSink(
  "story.artifact",
  "owned_story_store",
);
const LEGACY_ARTIFACT_RETENTION = parsePersistedRetentionLabel(
  {
    policyVersion: LEGACY_DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
    retentionClass: "owned_story",
  },
  "owned_story",
);

export function putMemoryStoryArtifact(
  sessionId: string,
  userId: string,
  artifact: StoryArtifact,
): void {
  if (artifacts.has(artifact.artifactId)) throw new Error("story artifact ID already exists");
  artifacts.set(artifact.artifactId, {
    sessionId,
    userId,
    artifact,
    envelope: Object.freeze({
      artifactId: artifact.artifactId,
      schemaVersion: artifact.schemaVersion,
      contentHash: artifact.contentHash,
      legacyV5ReplayEligible: false,
    }),
    retention: CURRENT_ARTIFACT_RETENTION,
  });
}

export function deleteMemoryStoryArtifact(artifactId: string): void {
  artifacts.delete(artifactId);
}

export async function getOwnedMemoryStoryArtifact(
  artifactId: string,
  userId: string,
  sessionId: string,
): Promise<
  Readonly<{
    artifact: StoryArtifact;
    envelope?: StoredStoryArtifactEnvelope;
  }> | null
> {
  const artifact = getOwnedMemoryStoryArtifactSync(
    artifactId,
    userId,
    sessionId,
  );
  if (!artifact) return null;
  return {
    artifact,
    envelope: artifacts.get(artifactId)?.envelope,
  };
}

export function getOwnedMemoryStoryArtifactSync(
  artifactId: string,
  userId: string,
  sessionId: string,
): StoryArtifact | null {
  const owned = artifacts.get(artifactId);
  if (owned?.userId !== userId || owned.sessionId !== sessionId) return null;
  parsePersistedRetentionLabel(
    owned.retention ?? LEGACY_ARTIFACT_RETENTION,
    "owned_story",
  );
  return owned.artifact;
}

export function memoryStoryArtifactCount(): number {
  return artifacts.size;
}

// Test-only mirror of migration 0023's one-way cutover marker. Production
// eligibility comes only from public.story_artifact_legacy_v5_replay.
export function _markMemoryStoryArtifactLegacyV5ReplayEligible(
  artifactId: string,
): void {
  const owned = artifacts.get(artifactId);
  if (
    !owned ||
    !owned.envelope ||
    owned.artifact.schemaVersion !== STORY_ARTIFACT_SCHEMA_VERSION
  ) {
    throw new Error("legacy v5 replay marker target is unavailable");
  }
  if (owned.envelope.legacyV5ReplayEligible === true) return;
  artifacts.set(artifactId, {
    ...owned,
    envelope: Object.freeze({
      ...owned.envelope,
      legacyV5ReplayEligible: true,
    }),
  });
}
