import { jsonError } from "@/lib/api-utils";
import { chunkBeatText } from "@/lib/chunks";
import { getByKey } from "@/lib/figures";
import { getSession, updateSession } from "@/lib/session";
import {
  getNextStoryAdvance,
  nextSessionPosition,
  parseBeatPositionRequest,
} from "@/lib/story-progress";
import type { SessionPositionPatch } from "@/lib/story-progress";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = parseBeatPositionRequest(body);
  if ("error" in parsed) return jsonError(parsed.error, 400);

  const session = await getSession(parsed.sessionId);
  if (!session) return jsonError("Story session not found.", 404);

  const stage = await getByKey(session.figureKey, session.stageId);
  if (!stage) return jsonError("Figure stage not found.", 404);

  const beat = stage.beats[parsed.beatIndex];
  if (!beat) return jsonError("Beat index is out of range.", 400);

  const chunks = chunkBeatText(beat);
  if (!chunks[parsed.chunkIndex]) {
    return jsonError("Chunk index is out of range.", 400);
  }

  const next = getNextStoryAdvance({
    beatIndex: parsed.beatIndex,
    chunkIndex: parsed.chunkIndex,
    chunkCount: chunks.length,
    beatCount: stage.beats.length,
  });
  const nextPosition = nextSessionPosition(parsed, next);

  if (isCurrentPosition(session, parsed)) {
    await updateSession(parsed.sessionId, nextPosition);
    return Response.json({ next });
  }

  if (isAlreadyAcknowledged(session, nextPosition)) {
    return Response.json({ next });
  }

  return jsonError("Beat index does not match the current session position.", 409);
}

function isCurrentPosition(
  session: { nextBeatIndex: number; nextChunkIndex: number },
  position: { beatIndex: number; chunkIndex: number },
): boolean {
  return (
    session.nextBeatIndex === position.beatIndex &&
    session.nextChunkIndex === position.chunkIndex
  );
}

function isAlreadyAcknowledged(
  session: { nextBeatIndex: number; nextChunkIndex: number },
  position: SessionPositionPatch,
): boolean {
  return (
    session.nextBeatIndex === position.nextBeatIndex &&
    session.nextChunkIndex === position.nextChunkIndex
  );
}
