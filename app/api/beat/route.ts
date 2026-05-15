import {
  jsonError,
  streamText,
  textStreamHeaders,
} from "@/lib/api-utils";
import { chunkBeatText } from "@/lib/chunks";
import { getByKey } from "@/lib/figures";
import { streamBeat } from "@/lib/llm-stub";
import { getSession, updateSession } from "@/lib/session";
import type { StoryAdvance } from "@/lib/types";

export const runtime = "nodejs";

type BeatRequestBody = {
  sessionId?: unknown;
  beatIndex?: unknown;
  chunkIndex?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = parseBeatRequest(body);
  if ("error" in parsed) return jsonError(parsed.error, 400);

  const session = getSession(parsed.sessionId);
  if (!session) return jsonError("Story session not found.", 404);

  if (session.nextBeatIndex !== parsed.beatIndex) {
    return jsonError("Beat index does not match the current session position.", 409);
  }
  if (session.nextChunkIndex !== parsed.chunkIndex) {
    return jsonError("Chunk index does not match the current session position.", 409);
  }

  const stage = getByKey(session.figureKey, session.stageId);
  if (!stage) return jsonError("Figure stage not found.", 404);

  const beat = stage.beats[parsed.beatIndex];
  if (!beat) return jsonError("Beat index is out of range.", 400);

  const chunks = chunkBeatText(beat);
  const chunk = chunks[parsed.chunkIndex];
  if (!chunk) return jsonError("Chunk index is out of range.", 400);

  const nextPosition = getNextPosition({
    beatIndex: parsed.beatIndex,
    chunkIndex: parsed.chunkIndex,
    chunkCount: chunks.length,
    beatCount: stage.beats.length,
  });

  return new Response(
    streamText(streamBeat({ session, beat, textOverride: chunk }), () => {
      updateSession(parsed.sessionId, nextSessionPosition(parsed, nextPosition));
    }),
    {
      headers: {
        ...textStreamHeaders,
        "x-onward-next": nextPosition,
      },
    },
  );
}

function parseBeatRequest(
  body: unknown,
): { sessionId: string; beatIndex: number; chunkIndex: number } | { error: string } {
  if (body === null || typeof body !== "object") {
    return { error: "Request body must be an object." };
  }

  const candidate = body as BeatRequestBody;
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

function getNextPosition({
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

function nextSessionPosition(
  parsed: { beatIndex: number; chunkIndex: number },
  nextPosition: StoryAdvance,
): { nextBeatIndex: number; nextChunkIndex: number } {
  switch (nextPosition) {
    case "chunk":
      return {
        nextBeatIndex: parsed.beatIndex,
        nextChunkIndex: parsed.chunkIndex + 1,
      };
    case "beat":
    case "end":
      return {
        nextBeatIndex: parsed.beatIndex + 1,
        nextChunkIndex: 0,
      };
    default: {
      const exhaustive: never = nextPosition;
      return exhaustive;
    }
  }
}
