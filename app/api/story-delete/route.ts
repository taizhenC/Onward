import { getAuthUserId } from "@/lib/auth";
import { deleteOwnedStory, isStorySessionId } from "@/lib/story-deletion";
import { storyDeletionTokenDisposition } from "@/lib/story-deletion-token";

export const runtime = "nodejs";

const MAX_BODY_LENGTH = 2_048;

export async function POST(request: Request): Promise<Response> {
  if (!isTrustedMutationRequest(request)) return textResponse("Forbidden.", 403);
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
  if (contentType !== "application/x-www-form-urlencoded") {
    return textResponse("Invalid request.", 400);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_LENGTH) {
    return textResponse("Invalid request.", 400);
  }

  let encoded: string;
  try {
    encoded = await request.text();
  } catch {
    return textResponse("Invalid request.", 400);
  }
  if (encoded.length === 0 || encoded.length > MAX_BODY_LENGTH) {
    return textResponse("Invalid request.", 400);
  }

  const form = new URLSearchParams(encoded);
  const entries = [...form.entries()];
  const keys = entries.map(([key]) => key).sort().join(",");
  if (
    entries.length !== 3 ||
    keys !== "csrfToken,intent,sessionId" ||
    form.get("intent") !== "delete_story"
  ) {
    return textResponse("Invalid request.", 400);
  }
  const sessionId = form.get("sessionId");
  const csrfToken = form.get("csrfToken");
  if (!isStorySessionId(sessionId) || typeof csrfToken !== "string") {
    return textResponse("Invalid request.", 400);
  }

  let userId: string | null;
  try {
    userId = await getAuthUserId();
  } catch {
    return redirectResponse(new URL("/signin", request.url));
  }
  if (!userId) return redirectResponse(new URL("/signin", request.url));
  let tokenDisposition: ReturnType<typeof storyDeletionTokenDisposition>;
  try {
    tokenDisposition = storyDeletionTokenDisposition(
      csrfToken,
      userId,
      sessionId,
    );
  } catch {
    return textResponse("Deletion is temporarily unavailable.", 503);
  }
  if (tokenDisposition === "expired") {
    return redirectResponse(
      new URL(`/stories/${sessionId}/delete?error=expired`, request.url),
    );
  }
  if (tokenDisposition !== "valid") {
    return textResponse("Forbidden.", 403);
  }

  try {
    // A valid signed replay after a response loss is intentionally success,
    // while an invalid/foreign target cannot obtain a token from the UI.
    await deleteOwnedStory({
      sessionId,
      userId,
      deletionRequestSeed: csrfToken,
    });
  } catch {
    return redirectResponse(
      new URL(`/stories/${sessionId}/delete?error=temporary`, request.url),
    );
  }
  return redirectResponse(new URL("/stories?deletion=complete", request.url));
}

function isTrustedMutationRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function redirectResponse(location: URL): Response {
  return new Response(null, {
    status: 303,
    headers: { location: location.toString(), "cache-control": "no-store" },
  });
}

function textResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
