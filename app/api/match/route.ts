import { jsonError } from "@/lib/api-utils";
import {
  getAuthUserId,
  getAuthUserContext,
  hasFreshAnonymousAuthentication,
} from "@/lib/auth";
import { handleIntake, validateIntakeInput } from "@/lib/intake";
import { hashRequestIp } from "@/lib/rate-limit";
import { CRISIS_RESOURCES, classifyCrisis } from "@/lib/safety";
import {
  issueAnonymousStoryFlowAuthChallenge,
  parseTelemetryFlowId,
  verifyAnonymousStoryFlowAuthChallenge,
} from "@/lib/telemetry-id";
import { TELEMETRY_FLOW_HEADER } from "@/lib/telemetry-flow-header";
import {
  readStoryFlowAuthChallengeCookie,
  retireStoryFlowAuthChallengeCookie,
  setStoryFlowAuthChallengeCookie,
} from "@/lib/telemetry-auth-challenge-cookie";
import {
  activateTelemetryFlowForOwner,
  telemetryFlowBindingEnabled,
} from "@/lib/telemetry-flow-lifecycle";
import {
  authEstablishedEvent,
  recordLinkedProductEventBestEffort,
} from "@/lib/telemetry-producers";
import type { TelemetryFlowId } from "@/lib/telemetry-types";

export const runtime = "nodejs";
// Rerank + opening copy on a slow provider day can stack past Vercel's default
// function timeout; matching must never die mid-flight.
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
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

  // Stop every non-crisis story before flow parsing, auth, registration, or any
  // other durable work. The deeper intake guard remains a defense for scripts
  // and non-route callers, but this boundary preserves the public no-write
  // contract while an operator has paused story creation.
  if (process.env.STORY_CREATION_ENABLED?.trim().toLowerCase() === "false") {
    return unavailableResponse();
  }

  // Parse the opaque flow only after the crisis branch. Missing or forged flow
  // IDs must never make reviewed crisis resources depend on UI state.
  let telemetryFlowId: TelemetryFlowId | null = null;
  const flowHeader = request.headers.get(TELEMETRY_FLOW_HEADER);
  if (flowHeader !== null) {
    try {
      telemetryFlowId = parseTelemetryFlowId(flowHeader);
    } catch (error) {
      // Signature verification happens before the age check, so this branch is
      // safe only for an authentic capability whose fixed lifetime elapsed.
      // The client can recover by starting a fresh story; forged, future, or
      // wrong-purpose values remain generic bad requests.
      if (
        error instanceof Error &&
        error.message === "telemetry flow ID has expired"
      ) {
        return flowConflictResponse();
      }
      return jsonError("Story flow is invalid. Please refresh and try again.", 400);
    }
  }

  // The shared pure parser keeps malformed intake, boundary, and recovery
  // requests out of both authentication and its funnel telemetry. handleIntake
  // repeats this check as a defense for non-route callers.
  const validated = validateIntakeInput(body);
  if ("error" in validated) return jsonError(validated.error, 400);

  const authChallenge = readStoryFlowAuthChallengeCookie(request);
  let authProof: ReturnType<
    typeof verifyAnonymousStoryFlowAuthChallenge
  > | null = null;
  if (telemetryFlowId && telemetryFlowBindingEnabled() && authChallenge) {
    try {
      authProof = verifyAnonymousStoryFlowAuthChallenge(
        authChallenge,
        telemetryFlowId,
      );
    } catch {
      authProof = null;
    }
  }

  // Ordinary authenticated story starts need only the validated Auth user.
  // Claims/AMR verification is requested only after a valid same-flow challenge
  // proves that method telemetry could be accepted.
  let authUser: Awaited<ReturnType<typeof getAuthUserContext>> = null;
  let userId: string | null;
  try {
    if (authProof) {
      authUser = await getAuthUserContext();
      userId = authUser?.userId ?? null;
    } else {
      userId = await getAuthUserId();
    }
  } catch {
    return unavailableResponse();
  }
  if (!userId) {
    return privateSessionRequiredResponse(telemetryFlowId, requestUrl);
  }
  let preserveAuthChallenge = false;
  const finish = (response: Response): Response =>
    authChallenge && !preserveAuthChallenge && response.status !== 503
      ? retireStoryFlowAuthChallengeCookie(response, requestUrl)
      : response;

  // The HttpOnly challenge is minted only after this same flow reached a prior
  // unauthenticated 401. Its signed purpose is anonymous auth; the fresh AMR
  // entry comes from a verified Supabase JWT, never from the browser. Invalid,
  // expired, cross-flow, or unverifiable measurement remains silent.
  const anonymousAuthEstablished = Boolean(
    authProof &&
      authUser &&
      hasFreshAnonymousAuthentication(authUser, authProof.issuedAtSeconds),
  );

  // Claim the authenticated owner after exact validation but before matching,
  // providers, or writes. Missing flow/config or the explicit kill switch uses
  // v2; a failure after a valid capability is present stays unavailable until
  // schema/config is repaired or the operator enables the incident switch.
  if (telemetryFlowId && telemetryFlowBindingEnabled()) {
    try {
      const activation = await activateTelemetryFlowForOwner(
        telemetryFlowId,
        userId,
      );
      if (activation !== "active") {
        return finish(flowConflictResponse());
      }
      if (anonymousAuthEstablished) {
        const capture = await recordLinkedProductEventBestEffort(
          authEstablishedEvent("anonymous"),
          telemetryFlowId,
        );
        preserveAuthChallenge = capture === "unavailable";
      }
    } catch {
      return unavailableResponse();
    }
  } else {
    telemetryFlowId = null;
  }

  let result: Awaited<ReturnType<typeof handleIntake>>;
  try {
    result = await handleIntake(body, {
      userId,
      ipHash: hashRequestIp(request),
      telemetryFlowId,
      telemetryFlowOwnerClaimed: telemetryFlowId !== null,
    });
  } catch {
    return unavailableResponse();
  }

  if ("error" in result) {
    return finish(jsonError(result.error, 400));
  }

  if ("flowConflict" in result) return finish(flowConflictResponse());

  if ("rateLimited" in result) {
    // Honest for the hour window; the day window is rarer and self-explains.
    const retryAfterSeconds = 3600 - (Math.floor(Date.now() / 1000) % 3600);
    return finish(
      Response.json(result, {
        status: 429,
        headers: { "retry-after": String(retryAfterSeconds) },
      }),
    );
  }

  if ("temporarilyUnavailable" in result) {
    return Response.json(result, {
      status: 503,
      headers: { "retry-after": "900" },
    });
  }

  return finish(Response.json(result));
}

function privateSessionRequiredResponse(
  telemetryFlowId: TelemetryFlowId | null,
  requestUrl: URL,
): Response {
  const response = Response.json(
    {
      error:
        "We couldn't start a private session. Cookies are needed to keep your story yours.",
    },
    { status: 401, headers: { "cache-control": "no-store" } },
  );
  if (telemetryFlowId && telemetryFlowBindingEnabled()) {
    try {
      return setStoryFlowAuthChallengeCookie(
        response,
        issueAnonymousStoryFlowAuthChallenge(telemetryFlowId),
        requestUrl,
      );
    } catch {
      // Authentication and crisis support never depend on observability.
    }
  }
  return response;
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

function flowConflictResponse(): Response {
  return Response.json(
    { flowConflict: true },
    { status: 409, headers: { "cache-control": "no-store" } },
  );
}
