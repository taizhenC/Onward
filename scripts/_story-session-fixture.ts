import { persistenceMode } from "../lib/persistence";
import {
  acknowledgeOwnedSessionPosition,
  getSession,
} from "../lib/session";
import type { StoryArtifact } from "../lib/story-artifact-types";
import { deriveStoryPassageLayout } from "../lib/story-progress";

const MAX_FIXTURE_PASSAGES = 128;

/**
 * Completes a memory-mode story fixture through the same artifact-derived
 * compare-and-set boundary as the reader. Flow binding is disabled only while
 * arranging the fixture so unrelated passage/completion telemetry does not
 * contaminate the contract under test.
 */
export async function completeMemoryStorySessionFixture(input: {
  sessionId: string;
  userId: string;
  artifact: StoryArtifact;
}): Promise<void> {
  if (persistenceMode() !== "memory") {
    throw new Error("story completion fixtures require memory persistence");
  }

  const previousBinding = process.env.TELEMETRY_FLOW_BINDING_ENABLED;
  process.env.TELEMETRY_FLOW_BINDING_ENABLED = "false";
  try {
    for (let passage = 0; passage < MAX_FIXTURE_PASSAGES; passage += 1) {
      const session = await getSession(input.sessionId);
      if (
        !session ||
        session.userId !== input.userId ||
        session.storyArtifactId !== input.artifact.artifactId
      ) {
        throw new Error("story completion fixture is unavailable");
      }
      if (
        session.nextBeatIndex === input.artifact.beats.length &&
        session.nextChunkIndex === 0
      ) {
        return;
      }

      const layout = deriveStoryPassageLayout(input.artifact.beats, {
        beatIndex: session.nextBeatIndex,
        chunkIndex: session.nextChunkIndex,
      });
      if (!layout) {
        throw new Error("story completion fixture has an invalid passage layout");
      }

      const result = await acknowledgeOwnedSessionPosition({
        sessionId: input.sessionId,
        userId: input.userId,
        storyArtifactId: input.artifact.artifactId,
        telemetry: null,
        expectedBeatIndex: session.nextBeatIndex,
        expectedChunkIndex: session.nextChunkIndex,
        nextBeatIndex: layout.nextBeatIndex,
        nextChunkIndex: layout.nextChunkIndex,
      });
      if (result !== "advanced" && result !== "already_advanced") {
        throw new Error(`story completion fixture failed: ${result}`);
      }
    }
    throw new Error("story completion fixture exceeded the passage limit");
  } finally {
    if (previousBinding === undefined) {
      delete process.env.TELEMETRY_FLOW_BINDING_ENABLED;
    } else {
      process.env.TELEMETRY_FLOW_BINDING_ENABLED = previousBinding;
    }
  }
}
