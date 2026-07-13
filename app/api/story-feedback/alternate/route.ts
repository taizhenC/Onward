import { getAuthUserId } from "@/lib/auth";
import { createAlternateStory } from "@/lib/alternate-story";
import { parseAlternateStoryRequest } from "@/lib/alternate-story-request";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const parsed = parseAlternateStoryRequest(body);
  if ("error" in parsed) return errorResponse(parsed.error, 400);

  let result;
  try {
    result = await createAlternateStory(parsed, await getAuthUserId());
  } catch {
    return errorResponse(
      "Another story could not be prepared right now. Please try again.",
      503,
      { "retry-after": "15" },
    );
  }
  switch (result.status) {
    case "ready":
      return jsonResponse({ status: "ready", sessionId: result.sessionId });
    case "unavailable":
      return jsonResponse({ status: "unavailable" });
    case "preparing":
      return jsonResponse(
        { status: "preparing", retryAfterMs: result.retryAfterMs },
        202,
        {
          "retry-after": String(
            Math.max(1, Math.ceil(result.retryAfterMs / 1000)),
          ),
        },
      );
    case "expired":
      return errorResponse("This alternate-story key has expired.", 410);
    case "exhausted":
      return errorResponse(
        "The bounded alternate-story retry allowance has been used.",
        429,
      );
    case "invalid_state":
      return errorResponse(
        "Finish this story and record that it did not feel close first.",
        409,
      );
    case "not_found":
      return errorResponse("Alternate story target not found.", 404);
    case "temporarily_unavailable":
      return errorResponse(
        "Another story could not be prepared right now. Please try again.",
        503,
        { "retry-after": "15" },
      );
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
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

function errorResponse(
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
