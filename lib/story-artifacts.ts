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
  const artifact = validateStoredStoryArtifact(row.artifact, {
    artifactId: row.artifact_id,
    schemaVersion: row.schema_version,
    contentHash: row.content_hash,
  });
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
