import "server-only";
import type { StoryArtifact } from "./story-artifact-types";

type OwnedArtifact = { sessionId: string; userId: string; artifact: StoryArtifact };

declare global {
  var __onwardStoryArtifacts: Map<string, OwnedArtifact> | undefined;
}

const artifacts =
  globalThis.__onwardStoryArtifacts ??
  (globalThis.__onwardStoryArtifacts = new Map<string, OwnedArtifact>());

export function putMemoryStoryArtifact(
  sessionId: string,
  userId: string,
  artifact: StoryArtifact,
): void {
  if (artifacts.has(artifact.artifactId)) throw new Error("story artifact ID already exists");
  artifacts.set(artifact.artifactId, { sessionId, userId, artifact });
}

export function deleteMemoryStoryArtifact(artifactId: string): void {
  artifacts.delete(artifactId);
}

export async function getOwnedMemoryStoryArtifact(
  artifactId: string,
  userId: string,
  sessionId: string,
): Promise<StoryArtifact | null> {
  return getOwnedMemoryStoryArtifactSync(artifactId, userId, sessionId);
}

export function getOwnedMemoryStoryArtifactSync(
  artifactId: string,
  userId: string,
  sessionId: string,
): StoryArtifact | null {
  const owned = artifacts.get(artifactId);
  return owned?.userId === userId && owned.sessionId === sessionId
    ? owned.artifact
    : null;
}

export function memoryStoryArtifactCount(): number {
  return artifacts.size;
}
