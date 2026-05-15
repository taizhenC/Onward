import type { StoryAdvance } from "./types";

type BeatPositionRequestBody = {
  sessionId?: unknown;
  beatIndex?: unknown;
  chunkIndex?: unknown;
};

export type BeatPosition = {
  sessionId: string;
  beatIndex: number;
  chunkIndex: number;
};

export type SessionPositionPatch = {
  nextBeatIndex: number;
  nextChunkIndex: number;
};

export function parseBeatPositionRequest(
  body: unknown,
): BeatPosition | { error: string } {
  if (body === null || typeof body !== "object") {
    return { error: "Request body must be an object." };
  }

  const candidate = body as BeatPositionRequestBody;
  const sessionId = candidate.sessionId;
  const beatIndex = candidate.beatIndex;
  const chunkIndex = candidate.chunkIndex;

  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return { error: "sessionId is required." };
  }

  if (
    typeof beatIndex !== "number" ||
    !Number.isInteger(beatIndex) ||
    beatIndex < 0
  ) {
    return { error: "beatIndex must be a non-negative integer." };
  }

  if (
    typeof chunkIndex !== "number" ||
    !Number.isInteger(chunkIndex) ||
    chunkIndex < 0
  ) {
    return { error: "chunkIndex must be a non-negative integer." };
  }

  return { sessionId, beatIndex, chunkIndex };
}

export function getNextStoryAdvance({
  beatIndex,
  chunkIndex,
  chunkCount,
  beatCount,
}: {
  beatIndex: number;
  chunkIndex: number;
  chunkCount: number;
  beatCount: number;
}): StoryAdvance {
  if (chunkIndex < chunkCount - 1) return "chunk";
  if (beatIndex < beatCount - 1) return "beat";
  return "end";
}

export function nextSessionPosition(
  position: { beatIndex: number; chunkIndex: number },
  nextPosition: StoryAdvance,
): SessionPositionPatch {
  switch (nextPosition) {
    case "chunk":
      return {
        nextBeatIndex: position.beatIndex,
        nextChunkIndex: position.chunkIndex + 1,
      };
    case "beat":
    case "end":
      return {
        nextBeatIndex: position.beatIndex + 1,
        nextChunkIndex: 0,
      };
    default: {
      const exhaustive: never = nextPosition;
      return exhaustive;
    }
  }
}
