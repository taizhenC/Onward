import "server-only";
import { getSupabase } from "./db";
import { persistenceMode } from "./persistence";
import {
  getOwnedMemoryStoryArtifact,
  memoryStoryArtifactCount,
} from "./story-artifact-store-memory";
import type { StoryArtifact } from "./story-artifact-types";
import { validateStoredStoryArtifact } from "./story-artifact";
import { parsePersistedRetentionLabel } from "./derived-output-retention";

type StoredArtifactRow = {
  artifact_id: unknown;
  schema_version: unknown;
  content_hash: unknown;
  artifact: unknown;
  retention_class: unknown;
  retention_policy_version: unknown;
};

export async function getOwnedStoryArtifact(
  artifactId: string,
  userId: string,
  sessionId: string,
): Promise<StoryArtifact | null> {
  if (persistenceMode() === "memory") {
    const stored = await getOwnedMemoryStoryArtifact(artifactId, userId, sessionId);
    if (!stored) return null;
    const artifact = validateStoredStoryArtifact(
      stored.artifact,
      stored.envelope,
    );
    if (!artifact) throw new Error("stored StoryArtifact failed integrity validation");
    return artifact;
  }

  const result = await getSupabase()
    .from("story_artifacts")
    .select(
      "artifact_id, schema_version, content_hash, artifact, retention_class, retention_policy_version",
    )
    .eq("artifact_id", artifactId)
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .maybeSingle();
  if (result.error) throw new Error(`load story artifact failed: ${result.error.message}`);
  if (!result.data) return null;
  const row = result.data as StoredArtifactRow;
  parsePersistedRetentionLabel(
    {
      policyVersion: row.retention_policy_version,
      retentionClass: row.retention_class,
    },
    "owned_story",
  );
  if (
    typeof row.artifact_id !== "string" ||
    typeof row.schema_version !== "string" ||
    typeof row.content_hash !== "string"
  ) {
    throw new Error("stored StoryArtifact envelope is invalid");
  }
  const envelope = {
    artifactId: row.artifact_id,
    schemaVersion: row.schema_version,
    contentHash: row.content_hash,
    legacyV5ReplayEligible: false,
  } as const;
  const strictArtifact = validateStoredStoryArtifact(row.artifact, envelope);
  if (strictArtifact) return strictArtifact;

  // Compatibility is a database-owned capability, not an assertion artifact
  // JSON can make about itself. Resolve ownership first, then consult the
  // immutable one-way marker only for a row that failed current validation.
  const marker = await getSupabase()
    .from("story_artifact_legacy_v5_replay")
    .select("artifact_id")
    .eq("artifact_id", row.artifact_id)
    .maybeSingle();
  if (marker.error) {
    throw new Error(
      `load legacy StoryArtifact eligibility failed: ${marker.error.message}`,
    );
  }
  const exactMarker = isExactLegacyV5ReplayMarker(
    marker.data,
    row.artifact_id,
  );
  if (marker.data !== null && !exactMarker) {
    throw new Error("stored legacy StoryArtifact eligibility is invalid");
  }
  const artifact = exactMarker
    ? validateStoredStoryArtifact(row.artifact, {
        ...envelope,
        legacyV5ReplayEligible: true,
      })
    : null;
  if (!artifact) throw new Error("stored StoryArtifact failed integrity validation");
  return artifact;
}

export async function _storyArtifactCount(): Promise<number> {
  if (persistenceMode() === "memory") return memoryStoryArtifactCount();
  const result = await getSupabase()
    .from("story_artifacts")
    .select("*", { count: "exact", head: true });
  if (result.error) throw new Error(`count story artifacts failed: ${result.error.message}`);
  return result.count ?? 0;
}

function isExactLegacyV5ReplayMarker(
  value: unknown,
  expectedArtifactId: string,
): value is Readonly<{ artifact_id: string }> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const marker = value as Record<string, unknown>;
  return (
    Object.keys(marker).length === 1 &&
    marker.artifact_id === expectedArtifactId
  );
}
