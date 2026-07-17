import { getAuthUserId } from "@/lib/auth";
import {
  HistoricalConcernTargetError,
  submitHistoricalConcern,
} from "@/lib/historical-concerns";
import { getOwnedSession } from "@/lib/session";
import { getOwnedStoryArtifact } from "@/lib/story-artifacts";
import {
  parseHistoricalConcernRequest,
} from "@/lib/historical-concern-request";

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
  const parsed = parseHistoricalConcernRequest(body);
  if ("error" in parsed) return errorResponse(parsed.error, 400);

  const userId = await getAuthUserId();
  const session = await getOwnedSession(parsed.sessionId, userId);
  if (!session?.storyArtifactId || !userId) return notFoundResponse();

  const artifact = await getOwnedStoryArtifact(
    session.storyArtifactId,
    userId,
    session.sessionId,
  );
  if (!artifact) return notFoundResponse();

  try {
    await submitHistoricalConcern({
      userId,
      sessionId: session.sessionId,
      artifact,
      factId: parsed.factId,
      reason: parsed.reason,
    });
  } catch (error) {
    if (error instanceof HistoricalConcernTargetError) return notFoundResponse();
    return errorResponse("The report could not be added. Please try again.", 503);
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
  return errorResponse("Story evidence not found.", 404);
}

function errorResponse(message: string, status: number): Response {
  return Response.json(
    { error: message },
    { status, headers: { "cache-control": "no-store" } },
  );
}
