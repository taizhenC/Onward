import type { StoryAdvance } from "./types";
import { MAX_STORY_PASSAGES } from "./story-artifact-types";

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

export type StoryPassageLayout = SessionPositionPatch & {
  next: StoryAdvance;
  passageOrdinal: number;
  totalPassages: number;
};

type ChunkedBeat = Readonly<{ chunks: readonly string[] }>;

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
    !Number.isSafeInteger(beatIndex) ||
    beatIndex < 0
  ) {
    return { error: "beatIndex must be a non-negative integer." };
  }

  if (
    typeof chunkIndex !== "number" ||
    !Number.isSafeInteger(chunkIndex) ||
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

// Authoritative in-memory mirror of migration 0013's persisted-artifact
// reduction. The ordinal is zero-based across every stored chunk, and the
// returned position always acknowledges exactly one passage.
export function deriveStoryPassageLayout(
  beats: readonly ChunkedBeat[],
  position: { beatIndex: number; chunkIndex: number },
): StoryPassageLayout | null {
  if (
    beats.length === 0 ||
    !Number.isSafeInteger(position.beatIndex) ||
    !Number.isSafeInteger(position.chunkIndex) ||
    position.beatIndex < 0 ||
    position.chunkIndex < 0
  ) {
    return null;
  }

  let passageOrdinal = 0;
  let totalPassages = 0;
  for (const [beatIndex, beat] of beats.entries()) {
    if (
      !Array.isArray(beat.chunks) ||
      beat.chunks.length === 0 ||
      beat.chunks.some(
        (chunk) => typeof chunk !== "string" || !chunk.trim(),
      )
    ) {
      return null;
    }
    if (beatIndex < position.beatIndex) {
      passageOrdinal += beat.chunks.length;
    }
    totalPassages += beat.chunks.length;
    if (totalPassages > MAX_STORY_PASSAGES) return null;
  }

  const beat = beats[position.beatIndex];
  if (!beat || position.chunkIndex >= beat.chunks.length) return null;
  passageOrdinal += position.chunkIndex;

  const next = getNextStoryAdvance({
    beatIndex: position.beatIndex,
    chunkIndex: position.chunkIndex,
    chunkCount: beat.chunks.length,
    beatCount: beats.length,
  });
  return {
    ...nextSessionPosition(position, next),
    next,
    passageOrdinal,
    totalPassages,
  };
}
