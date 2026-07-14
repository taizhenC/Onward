import { jsonError } from "@/lib/api-utils";
import { getAuthUserId } from "@/lib/auth";
import { handleIntake } from "@/lib/intake";
import { hashRequestIp } from "@/lib/rate-limit";
import { CRISIS_RESOURCES, classifyCrisis } from "@/lib/safety";

export const runtime = "nodejs";
// Rerank + opening copy on a slow provider day can stack past Vercel's default
// function timeout; matching must never die mid-flight.
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  if (body === null || typeof body !== "object") {
    return jsonError("Request body must be an object.", 400);
  }

  // Crisis support precedes auth as well as every provider/write. A reader whose
  // browser blocks cookies must still receive reviewed resources.
  const safetyText = (body as Record<string, unknown>).feeling;
  if (typeof safetyText === "string" && classifyCrisis(safetyText).crisisDetected) {
    return Response.json({ crisis: true, resources: CRISIS_RESOURCES });
  }

  // Non-crisis stories need an owner before matching or persistence.
  let userId: string | null;
  try {
    userId = await getAuthUserId();
  } catch {
    return unavailableResponse();
  }
  if (!userId) {
    return jsonError(
      "We couldn't start a private session. Cookies are needed to keep your story yours.",
      401,
    );
  }

  let result: Awaited<ReturnType<typeof handleIntake>>;
  try {
    result = await handleIntake(body, {
      userId,
      ipHash: hashRequestIp(request),
    });
  } catch {
    return unavailableResponse();
  }

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

function unavailableResponse(): Response {
  return Response.json(
    { temporarilyUnavailable: true },
    {
      status: 503,
      headers: { "cache-control": "no-store", "retry-after": "900" },
    },
  );
}
