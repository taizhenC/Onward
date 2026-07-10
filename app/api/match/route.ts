import { jsonError } from "@/lib/api-utils";
import { getAuthUserId } from "@/lib/auth";
import { handleIntake } from "@/lib/intake";
import { hashRequestIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
// Rerank + opening copy on a slow provider day can stack past Vercel's default
// function timeout; matching must never die mid-flight.
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  // Auth gate: the client signs in (anonymously) before posting, so a missing user
  // means a misconfigured or cookie-blocking client — 401, not 404 (there's no
  // session resource to hide yet; 404-over-500 governs session-scoped reads).
  const userId = await getAuthUserId();
  if (!userId) {
    return jsonError(
      "We couldn't start a private session. Cookies are needed to keep your story yours.",
      401,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  if (body === null || typeof body !== "object") {
    return jsonError("Request body must be an object.", 400);
  }

  const result = await handleIntake(body, {
    userId,
    ipHash: hashRequestIp(request),
  });

  if ("error" in result) {
    return jsonError(result.error, 400);
  }

  if ("rateLimited" in result) {
    // Honest for the hour window; the day window is rarer and self-explains.
    const retryAfterSeconds = 3600 - (Math.floor(Date.now() / 1000) % 3600);
    return Response.json(result, {
      status: 429,
      headers: { "retry-after": String(retryAfterSeconds) },
    });
  }

  if ("temporarilyUnavailable" in result) {
    return Response.json(result, {
      status: 503,
      headers: { "retry-after": "900" },
    });
  }

  return Response.json(result);
}
