import { getAuthUserId } from "@/lib/auth";
import { getOwnedSession } from "@/lib/session";
import { deriveStoryPassageLayout } from "@/lib/story-progress";
import { getStoryPlayback } from "@/lib/story-playback";
import { recordPassagePresentedTelemetry } from "@/lib/story-visibility-telemetry";
import { parsePassagePresentedRequest } from "@/lib/story-visibility-request";
import { telemetryFlowBindingEnabled } from "@/lib/telemetry-flow-lifecycle";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!telemetryFlowBindingEnabled()) return noContent();
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
  const body = await readJson(request);
  const parsed = parsePassagePresentedRequest(body);
  if (!parsed) return new Response(null, { status: 400 });

  // Ownership is intentionally checked before position so a foreign story is
  // indistinguishable from a missing one.
  const userId = await getAuthUserId();
  const session = await getOwnedSession(parsed.sessionId, userId);
  if (!userId || !session) return new Response(null, { status: 404 });

  const playback = await getStoryPlayback(session);
  if (!playback) return new Response(null, { status: 404 });
  const layout = deriveStoryPassageLayout(playback.beats, parsed);
  if (!layout) return new Response(null, { status: 400 });
  if (
    !positionHasBeenReached(
      {
        beatIndex: session.nextBeatIndex,
        chunkIndex: session.nextChunkIndex,
      },
      parsed,
    )
  ) {
    return new Response(null, { status: 409 });
  }

  await recordPassagePresentedTelemetry({
    session,
    userId,
    layout,
    latencyBucket: parsed.latencyBucket,
  });
  return noContent();
}

// A fire-and-forget visibility request may arrive after the reader has already
// acknowledged that passage. Persisted forward-only progress is authoritative
// proof that it was reached, so delayed reports remain valid while future
// positions are rejected.
function positionHasBeenReached(
  current: { beatIndex: number; chunkIndex: number },
  requested: { beatIndex: number; chunkIndex: number },
): boolean {
  return (
    current.beatIndex > requested.beatIndex ||
    (current.beatIndex === requested.beatIndex &&
      current.chunkIndex >= requested.chunkIndex)
  );
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function noContent(): Response {
  return new Response(null, {
    status: 204,
    headers: { "cache-control": "no-store" },
  });
}
