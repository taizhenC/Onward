import { getAuthUserId } from "@/lib/auth";
import { getOwnedSession } from "@/lib/session";
import { getStoryPlayback } from "@/lib/story-playback";
import { recordSourceOpenedTelemetry } from "@/lib/story-visibility-telemetry";
import { parseSourceOpenedRequest } from "@/lib/story-visibility-request";
import { telemetryFlowBindingEnabled } from "@/lib/telemetry-flow-lifecycle";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!telemetryFlowBindingEnabled()) return noContent();
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
  const body = await readJson(request);
  const parsed = parseSourceOpenedRequest(body);
  if (!parsed) return new Response(null, { status: 400 });

  const userId = await getAuthUserId();
  const session = await getOwnedSession(parsed.sessionId, userId);
  if (!userId || !session) return new Response(null, { status: 404 });
  const playback = await getStoryPlayback(session);
  if (!playback) return new Response(null, { status: 404 });
  if (
    session.nextBeatIndex < playback.beats.length ||
    playback.transparency === null
  ) {
    return new Response(null, { status: 409 });
  }

  await recordSourceOpenedTelemetry({ session, userId });
  return noContent();
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
