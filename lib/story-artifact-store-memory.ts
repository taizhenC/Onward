import "server-only";
import type { StoredStoryArtifactEnvelope } from "./story-artifact";
import type { StoryArtifact } from "./story-artifact-types";
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
