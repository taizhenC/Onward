import { jsonError } from "@/lib/api-utils";
import { getAuthUserId } from "@/lib/auth";
import {
  acknowledgeOwnedSessionPosition,
  getOwnedSession,
} from "@/lib/session";
import {
  getNextStoryAdvance,
  nextSessionPosition,
  parseBeatPositionRequest,
} from "@/lib/story-progress";
import { getStoryPlayback } from "@/lib/story-playback";

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

  // Ownership 404 fires before any position check — a foreign session must be
  // indistinguishable from a missing one (no position oracle).
  const userId = await getAuthUserId();
  if (!userId) return jsonError("Story session not found.", 404);
  const session = await getOwnedSession(parsed.sessionId, userId);
  if (!session) return jsonError("Story session not found.", 404);

  const playback = await getStoryPlayback(session);
  if (!playback) return jsonError("Story artifact not found.", 404);

  const beat = playback.beats[parsed.beatIndex];
  if (!beat) return jsonError("Beat index is out of range.", 400);

  if (!beat.chunks[parsed.chunkIndex]) {
    return jsonError("Chunk index is out of range.", 400);
  }

  const next = getNextStoryAdvance({
    beatIndex: parsed.beatIndex,
    chunkIndex: parsed.chunkIndex,
    chunkCount: beat.chunks.length,
    beatCount: playback.beats.length,
  });
  const nextPosition = nextSessionPosition(parsed, next);

  const result = await acknowledgeOwnedSessionPosition({
    sessionId: parsed.sessionId,
    userId,
    expectedBeatIndex: parsed.beatIndex,
    expectedChunkIndex: parsed.chunkIndex,
    nextBeatIndex: nextPosition.nextBeatIndex,
    nextChunkIndex: nextPosition.nextChunkIndex,
  });

  if (result === "advanced" || result === "already_advanced") {
    return Response.json({ next });
  }

  if (result === "not_found") return jsonError("Story session not found.", 404);

  return jsonError("Beat index does not match the current session position.", 409);
}
