import "server-only";
import { getSupabase } from "./db";
import {
  getOwnedMemoryStoryArtifact,
  memoryStoryArtifactCount,
} from "./story-artifact-store-memory";
import type { StoryArtifact } from "./story-artifact-types";
import { validateStoredStoryArtifact } from "./story-artifact";

export async function getOwnedStoryArtifact(
  artifactId: string,
  userId: string,
  sessionId: string,
): Promise<StoryArtifact | null> {
  if (process.env.PERSISTENCE !== "supabase") {
    const stored = await getOwnedMemoryStoryArtifact(artifactId, userId, sessionId);
    if (!stored) return null;
    const artifact = validateStoredStoryArtifact(stored);
    if (!artifact) throw new Error("stored StoryArtifact failed integrity validation");
    return artifact;
  }

  const result = await getSupabase()
    .from("story_artifacts")
    .select("artifact")
    .eq("artifact_id", artifactId)
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .maybeSingle();
  if (result.error) throw new Error(`load story artifact failed: ${result.error.message}`);
  if (!result.data) return null;
  const artifact = validateStoredStoryArtifact(result.data.artifact);
  if (!artifact) throw new Error("stored StoryArtifact failed integrity validation");
  return artifact;
}

export async function _storyArtifactCount(): Promise<number> {
  if (process.env.PERSISTENCE !== "supabase") return memoryStoryArtifactCount();
  const result = await getSupabase()
    .from("story_artifacts")
    .select("*", { count: "exact", head: true });
  if (result.error) throw new Error(`count story artifacts failed: ${result.error.message}`);
  return result.count ?? 0;
}
