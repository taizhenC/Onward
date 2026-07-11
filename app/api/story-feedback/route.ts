import { getAuthUserId } from "@/lib/auth";
import {
  ResonanceFeedbackConflictError,
  ResonanceFeedbackIncompleteError,
  ResonanceFeedbackTargetError,
  submitResonanceFeedback,
} from "@/lib/resonance-feedback";
import { parseResonanceFeedbackRequest } from "@/lib/resonance-feedback-request";
import { getOwnedSession } from "@/lib/session";
import { getOwnedStoryArtifact } from "@/lib/story-artifacts";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) {
    return errorResponse("Request origin is not allowed.", 403);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }
  const parsed = parseResonanceFeedbackRequest(body);
  if ("error" in parsed) return errorResponse(parsed.error, 400);

  const userId = await getAuthUserId();
  const session = await getOwnedSession(parsed.sessionId, userId);
  if (!userId || !session?.storyArtifactId) return notFoundResponse();
  const artifact = await getOwnedStoryArtifact(
    session.storyArtifactId,
    userId,
    session.sessionId,
  );
  if (!artifact) return notFoundResponse();

  try {
    await submitResonanceFeedback({
      userId,
      session,
      artifact,
      feedback: parsed,
    });
  } catch (error) {
    if (error instanceof ResonanceFeedbackTargetError) return notFoundResponse();
    if (error instanceof ResonanceFeedbackIncompleteError) {
      return errorResponse("Finish the story before sharing feedback.", 409);
    }
    if (error instanceof ResonanceFeedbackConflictError) {
      return errorResponse("Feedback has already been recorded for this story.", 409);
    }
    return errorResponse("Feedback could not be saved. Please try again.", 503);
  }

  return Response.json(
    { accepted: true },
    { status: 202, headers: { "cache-control": "no-store" } },
  );
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

function notFoundResponse(): Response {
  return errorResponse("Story feedback target not found.", 404);
}

function errorResponse(message: string, status: number): Response {
  return Response.json(
    { error: message },
    { status, headers: { "cache-control": "no-store" } },
  );
}
