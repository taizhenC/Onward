import { getAuthUserId } from "@/lib/auth";
import { parseAlternateCapabilityRequest } from "@/lib/alternate-story-request";
import { getResonanceFeedbackPresentation } from "@/lib/resonance-feedback";
import { getOwnedSession } from "@/lib/session";
import { getOwnedStoryArtifact } from "@/lib/story-artifacts";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }
  const parsed = parseAlternateCapabilityRequest(body);
  if ("error" in parsed) return jsonError(parsed.error, 400);

  try {
    const userId = await getAuthUserId();
    const session = await getOwnedSession(parsed.sessionId, userId);
    if (!userId || !session?.storyArtifactId) return notFound();
    const artifact = await getOwnedStoryArtifact(
      session.storyArtifactId,
      userId,
      session.sessionId,
    );
    if (!artifact) return notFound();
    const presentation = await getResonanceFeedbackPresentation({
      userId,
      session,
      artifact,
    });
    if (presentation.status !== "not_close") {
      return jsonError("A durable not-close answer is required.", 409);
    }
    return jsonResponse({ alternate: presentation.alternate });
  } catch {
    return jsonError(
      "Alternate availability could not be checked right now.",
      503,
      { "retry-after": "15" },
    );
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

function notFound(): Response {
  return jsonError("Alternate story target not found.", 404);
}

function jsonError(
  message: string,
  status: number,
  headers?: Record<string, string>,
): Response {
  return jsonResponse({ error: message }, status, headers);
}

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store", ...headers },
  });
}
