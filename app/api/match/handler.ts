import { jsonError } from "@/lib/api-utils";
import { CRISIS_RESOURCES, classifyCrisis } from "@/lib/safety";
import type { TelemetryFlowId } from "@/lib/telemetry-types";

export async function handleMatchRequest(
  request: Request,
  loadDependencies: typeof loadNonCrisisDependencies =
    loadNonCrisisDependencies,
): Promise<Response> {
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

  // A deployment may serve reviewed crisis support even while its story recipe
  // configuration is invalid. Validate only after the crisis/kill-switch
  // branches, but before flow parsing, authentication, providers, limits, or
  // writes, so no unevaluated runtime can create a public story.
  let dependencies: Awaited<ReturnType<typeof loadNonCrisisDependencies>>;
  try {
    dependencies = await loadDependencies();
    const runtime =
      dependencies.storyRecipe.assertProductionStoryRecipeRuntime();
    await dependencies.recipeRegistration.assertProductionStoryRecipeRegistered(
      runtime,
    );
  } catch {
    return unavailableResponse();
  }
  const {
    auth: {
      getAuthUserContext,
      getAuthUserId,
      hasFreshAnonymousAuthentication,
    },
    intake,
    rateLimit: { hashRequestIp },
    telemetryAuthCookie: {
      readStoryFlowAuthChallengeCookie,
      retireStoryFlowAuthChallengeCookie,
      setStoryFlowAuthChallengeCookie,
    },
    telemetryFlowHeader: { TELEMETRY_FLOW_HEADER },
    telemetryFlowLifecycle: {
      activateTelemetryFlowForOwner,
      telemetryFlowBindingEnabled,
    },
    telemetryId: {
      issueAnonymousStoryFlowAuthChallenge,
      parseTelemetryFlowId,
      verifyAnonymousStoryFlowAuthChallenge,
    },
    telemetryProducers: {
      authEstablishedEvent,
      recordLinkedProductEventBestEffort,
    },
  } = dependencies;

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
  const validated = intake.validateIntakeInput(body);
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
    return privateSessionRequiredResponse(telemetryFlowId, requestUrl, {
      issueAnonymousStoryFlowAuthChallenge,
      setStoryFlowAuthChallengeCookie,
      telemetryFlowBindingEnabled,
    });
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

  let result: Awaited<ReturnType<typeof intake.handleIntake>>;
  try {
    result = await intake.handleIntake(body, {
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
  telemetry: Readonly<{
    issueAnonymousStoryFlowAuthChallenge: typeof import("@/lib/telemetry-id").issueAnonymousStoryFlowAuthChallenge;
    setStoryFlowAuthChallengeCookie: typeof import("@/lib/telemetry-auth-challenge-cookie").setStoryFlowAuthChallengeCookie;
    telemetryFlowBindingEnabled: typeof import("@/lib/telemetry-flow-lifecycle").telemetryFlowBindingEnabled;
  }>,
): Response {
  const response = Response.json(
    {
      error:
        "We couldn't start a private session. Cookies are needed to keep your story yours.",
    },
    { status: 401, headers: { "cache-control": "no-store" } },
  );
  if (telemetryFlowId && telemetry.telemetryFlowBindingEnabled()) {
    try {
      return telemetry.setStoryFlowAuthChallengeCookie(
        response,
        telemetry.issueAnonymousStoryFlowAuthChallenge(telemetryFlowId),
        requestUrl,
      );
    } catch {
      // Authentication and crisis support never depend on observability.
    }
  }
  return response;
}

async function loadNonCrisisDependencies() {
  // Keep the entire story/runtime dependency graph behind the reviewed crisis
  // response. Some telemetry modules consume recipe IDs too, so lazy-loading
  // only intake would still let malformed immutable config break crisis help.
  const [
    auth,
    intake,
    rateLimit,
    storyRecipe,
    recipeRegistration,
    telemetryAuthCookie,
    telemetryFlowHeader,
    telemetryFlowLifecycle,
    telemetryId,
    telemetryProducers,
  ] = await Promise.all([
    import("@/lib/auth"),
    import("@/lib/intake"),
    import("@/lib/rate-limit"),
    import("@/lib/story-recipe"),
    import("@/lib/story-recipe-registration"),
    import("@/lib/telemetry-auth-challenge-cookie"),
    import("@/lib/telemetry-flow-header"),
    import("@/lib/telemetry-flow-lifecycle"),
    import("@/lib/telemetry-id"),
    import("@/lib/telemetry-producers"),
  ]);
  return {
    auth,
    intake,
    rateLimit,
    storyRecipe,
    recipeRegistration,
    telemetryAuthCookie,
    telemetryFlowHeader,
    telemetryFlowLifecycle,
    telemetryId,
    telemetryProducers,
  };
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
