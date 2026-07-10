import {
  jsonError,
  textStreamHeaders,
} from "@/lib/api-utils";
import { getAuthUserId } from "@/lib/auth";
import {
  getNextStoryAdvance,
  parseBeatPositionRequest,
} from "@/lib/story-progress";
import { getOwnedSession } from "@/lib/session";
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

  // Ownership 404 fires before the 409 position checks — a foreign session must be
  // indistinguishable from a missing one (no position oracle).
  const session = await getOwnedSession(parsed.sessionId, await getAuthUserId());
  if (!session) return jsonError("Story session not found.", 404);

  if (session.nextBeatIndex !== parsed.beatIndex) {
    return jsonError("Beat index does not match the current session position.", 409);
  }
  if (session.nextChunkIndex !== parsed.chunkIndex) {
    return jsonError("Chunk index does not match the current session position.", 409);
  }

  const playback = await getStoryPlayback(session);
  if (!playback) return jsonError("Story artifact not found.", 404);

  const beat = playback.beats[parsed.beatIndex];
  if (!beat) return jsonError("Beat index is out of range.", 400);

  const chunk = beat.chunks[parsed.chunkIndex];
  if (!chunk) return jsonError("Chunk index is out of range.", 400);

  const nextPosition = getNextStoryAdvance({
    beatIndex: parsed.beatIndex,
    chunkIndex: parsed.chunkIndex,
    chunkCount: beat.chunks.length,
    beatCount: playback.beats.length,
  });

  return new Response(chunk, {
    headers: {
      ...textStreamHeaders,
      "x-onward-next": nextPosition,
    },
  });
}
