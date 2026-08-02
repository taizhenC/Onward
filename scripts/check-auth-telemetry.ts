import "./_smoke-bootstrap";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { POST as matchPost } from "../app/api/match/route";
import {
  _setMemoryAuthContextForTests,
  hasFreshAnonymousAuthentication,
  LOCAL_DEV_USER_ID,
  parseVerifiedAuthenticationMethods,
  type AuthUserContext,
} from "../lib/auth";
import {
  _clearMemoryOwnerStorySaveStatesForTests,
  _recordMemoryOwnerStorySaveTransitionForTests,
} from "../lib/owner-story-save-store-memory";
import {
  claimMemoryTelemetryFlowOwner,
  registerMemoryTelemetryFlow,
  revokeMemoryTelemetryFlow,
} from "../lib/telemetry-flow-binding-memory";
import { getMemoryTelemetryFlowByFlow } from "../lib/telemetry-flow-state-memory";
import { TELEMETRY_FLOW_HEADER } from "../lib/telemetry-flow-header";
import {
  issueAnonymousStoryFlowAuthChallenge,
  issueTelemetryFlowId,
  STORY_FLOW_AUTH_CHALLENGE_TTL_SECONDS,
  verifyAnonymousStoryFlowAuthChallenge,
} from "../lib/telemetry-id";
import {
  readStoryFlowAuthChallengeCookie,
  retireStoryFlowAuthChallengeCookie,
  setStoryFlowAuthChallengeCookie,
  STORY_FLOW_AUTH_CHALLENGE_COOKIE,
} from "../lib/telemetry-auth-challenge-cookie";
import {
  listMemoryProductEventOutbox,
  listMemoryProductEvents,
} from "../lib/telemetry-store-memory";
import { listSessionsByUser } from "../lib/session";
import { createTelemetryFlowId } from "../lib/telemetry";
import type { TelemetryFlowId } from "../lib/telemetry-types";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";
process.env.EMBEDDING_PROVIDER = "stub";
process.env.RETRIEVAL_MODE = "keyword";
process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";
process.env.STORY_CREATION_ENABLED = "true";

const ORIGIN = "http://onward.test";
const PRIVATE_CANARY = "auth-private-canary-must-never-persist";
const INVALID_INTAKE = Object.freeze({ age: 0, feeling: PRIVATE_CANARY });
const VALID_INTAKE = Object.freeze({
  age: 28,
  feeling: "I keep getting rejected and do not know whether to keep trying",
});

async function main(): Promise<void> {
  checkChallengeAndCookieContract();
  checkVerifiedAuthMethodContract();
  await checkFreshAnonymousCaptureAndReplay();
  await checkUnprovedAuthenticationStaysSilent();
  await checkInvalidAndUnavailableProofsStaySilent();
  await checkCrisisAndIncidentSwitches();
  checkPrivacyShape();
  checkStaticIntegration();

  console.log("Onward story-flow auth telemetry validator");
  console.log("============================================");
  console.log("PASS signed HttpOnly challenge is short-lived and flow-bound");
  console.log("PASS fresh verified anonymous auth captures one event/outbox unit");
  console.log("PASS replay, concurrency, invalid proof, and owner conflicts stay safe");
  console.log("PASS crisis, incident switches, and standalone auth surfaces stay silent");
}

function checkChallengeAndCookieContract(): void {
  const issuedAt = new Date("2026-07-14T12:00:00.000Z");
  const flowId = issueTelemetryFlowId(issuedAt);
  const challenge = issueAnonymousStoryFlowAuthChallenge(flowId, issuedAt);
  const proof = verifyAnonymousStoryFlowAuthChallenge(
    challenge,
    flowId,
    issuedAt,
  );
  assert.equal(proof.expectedAuthMethod, "anonymous");
  assert.equal(proof.issuedAtSeconds, issuedAt.getTime() / 1000);
  assert(!challenge.includes(flowId), "challenge must not disclose its flow");

  const otherFlow = issueTelemetryFlowId(issuedAt);
  assert.throws(
    () =>
      verifyAnonymousStoryFlowAuthChallenge(
        challenge,
        otherFlow,
        issuedAt,
      ),
    /signature/,
  );
  const forged = `${challenge.slice(0, -1)}${challenge.endsWith("0") ? "1" : "0"}`;
  assert.throws(
    () => verifyAnonymousStoryFlowAuthChallenge(forged, flowId, issuedAt),
    /signature/,
  );
  assert.throws(
    () =>
      verifyAnonymousStoryFlowAuthChallenge(
        challenge,
        flowId,
        new Date(
          issuedAt.getTime() +
            STORY_FLOW_AUTH_CHALLENGE_TTL_SECONDS * 1000,
        ),
      ),
    /expired/,
  );

  const response = setStoryFlowAuthChallengeCookie(
    Response.json({ ok: true }),
    challenge,
    new URL("https://onward.test/api/match"),
  );
  const setCookie = response.headers.get("set-cookie");
  assert(setCookie);
  assert.match(setCookie, new RegExp(`^${STORY_FLOW_AUTH_CHALLENGE_COOKIE}=`));
  assert.match(
    setCookie,
    new RegExp(`Max-Age=${STORY_FLOW_AUTH_CHALLENGE_TTL_SECONDS}`),
  );
  assert.match(setCookie, /Path=\/api\/match/i);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.match(setCookie, /Secure/i);
  assert(!setCookie.includes(flowId));

  const previousNodeEnv = process.env.NODE_ENV;
  Reflect.set(process.env, "NODE_ENV", "production");
  try {
    const proxiedProductionCookie = setStoryFlowAuthChallengeCookie(
      Response.json({ ok: true }),
      challenge,
      new URL("http://internal-proxy/api/match"),
    ).headers.get("set-cookie");
    assert.match(proxiedProductionCookie ?? "", /Secure/i);
  } finally {
    if (previousNodeEnv === undefined) {
      Reflect.deleteProperty(process.env, "NODE_ENV");
    } else {
      Reflect.set(process.env, "NODE_ENV", previousNodeEnv);
    }
  }

  const request = new Request(`${ORIGIN}/api/match`, {
    headers: { cookie: `${STORY_FLOW_AUTH_CHALLENGE_COOKIE}=${challenge}` },
  });
  assert.equal(readStoryFlowAuthChallengeCookie(request), challenge);
  const retired = retireStoryFlowAuthChallengeCookie(
    Response.json({ ok: true }),
    new URL(request.url),
  );
  assert.match(retired.headers.get("set-cookie") ?? "", /Max-Age=0/);
}

function checkVerifiedAuthMethodContract(): void {
  const issuedAtSeconds = 1_800_000_000;
  const now = new Date((issuedAtSeconds + 5) * 1000);
  const parsed = parseVerifiedAuthenticationMethods([
    { method: "anonymous", timestamp: issuedAtSeconds },
    { method: "password" },
    "anonymous",
  ]);
  assert.deepEqual(parsed, [
    { method: "anonymous", timestamp: issuedAtSeconds },
  ]);
  const freshAnonymous = authContext({
    isAnonymous: true,
    method: "anonymous",
    timestamp: issuedAtSeconds,
  });
  assert(hasFreshAnonymousAuthentication(freshAnonymous, issuedAtSeconds, now));
  assert(
    !hasFreshAnonymousAuthentication(
      authContext({
        isAnonymous: false,
        method: "anonymous",
        timestamp: issuedAtSeconds,
      }),
      issuedAtSeconds,
      now,
    ),
  );
  assert(
    !hasFreshAnonymousAuthentication(
      authContext({
        isAnonymous: true,
        method: "password",
        timestamp: issuedAtSeconds,
      }),
      issuedAtSeconds,
      now,
    ),
  );
  assert(
    !hasFreshAnonymousAuthentication(
      authContext({
        isAnonymous: true,
        method: "anonymous",
        timestamp: issuedAtSeconds - 31,
      }),
      issuedAtSeconds,
      now,
    ),
  );
}

async function checkFreshAnonymousCaptureAndReplay(): Promise<void> {
  const flowId = createTelemetryFlowId();
  _setMemoryAuthContextForTests(null);
  const first = await postMatch(flowId, undefined, VALID_INTAKE);
  assert.equal(first.status, 401);
  assert.equal(first.headers.get("cache-control"), "no-store");
  const challengeCookie = first.headers.get("set-cookie");
  assert(challengeCookie, "the unauthenticated route did not set a challenge");
  assert.match(challengeCookie, /HttpOnly/i);
  assert.match(challengeCookie, /SameSite=Strict/i);
  assert.match(challengeCookie, /Path=\/api\/match/i);
  assert.equal(getMemoryTelemetryFlowByFlow(flowId), null);
  assert.equal(authEventsForFlow(flowId).length, 0);
  const challenge = challengeCookie.match(
    new RegExp(`${STORY_FLOW_AUTH_CHALLENGE_COOKIE}=([^;]+)`),
  )?.[1];
  assert(challenge, "the route-issued challenge value is missing");

  _setMemoryAuthContextForTests(
    authContext({
      isAnonymous: true,
      method: "anonymous",
      timestamp: Math.floor(Date.now() / 1000),
    }),
  );
  try {
    const authenticatedRetry = await postMatch(
      flowId,
      challenge,
      VALID_INTAKE,
    );
    assert.equal(authenticatedRetry.status, 200);
    assert.match(
      authenticatedRetry.headers.get("set-cookie") ?? "",
      /Max-Age=0/,
    );

    const [exactRetry, concurrentRetry] = await Promise.all([
      postMatch(flowId, challenge, VALID_INTAKE),
      postMatch(flowId, challenge, VALID_INTAKE),
    ]);
    assert.equal(exactRetry.status, 200);
    assert.equal(concurrentRetry.status, 200);
  } finally {
    _setMemoryAuthContextForTests(undefined);
  }

  const events = authEventsForFlow(flowId);
  assert.equal(events.length, 1);
  assert.equal(events[0].event, "auth_established");
  if (events[0].event !== "auth_established") {
    assert.fail("auth event was not narrowed to the expected contract");
  }
  assert.equal(events[0].authMethod, "anonymous");
  assert.equal(
    listMemoryProductEventOutbox().filter(
      (pointer) => pointer.eventId === events[0].eventId,
    ).length,
    1,
  );
}

async function checkUnprovedAuthenticationStaysSilent(): Promise<void> {
  const flowId = createTelemetryFlowId();
  const response = await postMatch(flowId, undefined, VALID_INTAKE);
  assert.equal(response.status, 200);
  assert.equal(authEventsForFlow(flowId).length, 0);

  // Even a legitimate route-issued challenge cannot classify a permanent
  // standalone sign-in as story-flow anonymous auth.
  const permanentFlow = createTelemetryFlowId();
  _setMemoryAuthContextForTests(null);
  const challengeResponse = await postMatch(
    permanentFlow,
    undefined,
    VALID_INTAKE,
  );
  assert.equal(challengeResponse.status, 401);
  const challenge = challengeResponse.headers
    .get("set-cookie")
    ?.match(new RegExp(`${STORY_FLOW_AUTH_CHALLENGE_COOKIE}=([^;]+)`))?.[1];
  assert(challenge);
  _setMemoryAuthContextForTests(
    authContext({
      isAnonymous: false,
      method: "password",
      timestamp: Math.floor(Date.now() / 1000),
    }),
  );
  try {
    _clearMemoryOwnerStorySaveStatesForTests();
    const storiesBefore = await listSessionsByUser("auth-context-test");
    const uncoveredPermanentRetry = await postMatch(
      permanentFlow,
      challenge,
      VALID_INTAKE,
    );
    assert.equal(uncoveredPermanentRetry.status, 503);
    assert.equal(authEventsForFlow(permanentFlow).length, 0);
    assert.equal(getMemoryTelemetryFlowByFlow(permanentFlow), null);
    assert.equal(
      (await listSessionsByUser("auth-context-test")).length,
      storiesBefore.length,
    );

    _recordMemoryOwnerStorySaveTransitionForTests({
      userId: "auth-context-test",
      evidenceKind: "anonymous_upgrade",
      occurredAt: Date.now(),
    });
    const permanentRetry = await postMatch(
      permanentFlow,
      challenge,
      VALID_INTAKE,
    );
    assert.equal(permanentRetry.status, 200);
    assert.equal(authEventsForFlow(permanentFlow).length, 0);
    assert.equal(
      (await listSessionsByUser("auth-context-test")).length,
      storiesBefore.length + 1,
    );
  } finally {
    _clearMemoryOwnerStorySaveStatesForTests();
    _setMemoryAuthContextForTests(undefined);
  }
}

async function checkInvalidAndUnavailableProofsStaySilent(): Promise<void> {
  const malformedFlow = createTelemetryFlowId();
  const malformedChallenge = issueAnonymousStoryFlowAuthChallenge(malformedFlow);
  assert.equal(
    (await postMatch(malformedFlow, malformedChallenge, INVALID_INTAKE)).status,
    400,
  );
  assert.equal(getMemoryTelemetryFlowByFlow(malformedFlow), null);
  assert.equal(authEventsForFlow(malformedFlow).length, 0);

  const forgedFlow = createTelemetryFlowId();
  const validChallenge = issueAnonymousStoryFlowAuthChallenge(forgedFlow);
  const forgedChallenge = `${validChallenge.slice(0, -1)}${validChallenge.endsWith("0") ? "1" : "0"}`;
  assert.equal(
    (await postMatch(forgedFlow, forgedChallenge, VALID_INTAKE)).status,
    200,
  );
  assert.equal(authEventsForFlow(forgedFlow).length, 0);

  const staleIssuedAt = new Date(
    Date.now() - (STORY_FLOW_AUTH_CHALLENGE_TTL_SECONDS + 1) * 1000,
  );
  const staleFlow = issueTelemetryFlowId(staleIssuedAt);
  const staleChallenge = issueAnonymousStoryFlowAuthChallenge(
    staleFlow,
    staleIssuedAt,
  );
  assert.equal(
    (await postMatch(staleFlow, staleChallenge, VALID_INTAKE)).status,
    200,
  );
  assert.equal(authEventsForFlow(staleFlow).length, 0);

  const challengeFlow = createTelemetryFlowId();
  const wrongFlow = createTelemetryFlowId();
  const wrongFlowChallenge = issueAnonymousStoryFlowAuthChallenge(challengeFlow);
  assert.equal(
    (await postMatch(wrongFlow, wrongFlowChallenge, VALID_INTAKE)).status,
    200,
  );
  assert.equal(authEventsForFlow(wrongFlow).length, 0);

  const foreignFlow = createTelemetryFlowId();
  assert.equal(registerMemoryTelemetryFlow(foreignFlow), "created");
  assert.equal(
    claimMemoryTelemetryFlowOwner({ flowId: foreignFlow, userId: "foreign" }),
    "claimed",
  );
  const foreignResponse = await postMatch(
    foreignFlow,
    issueAnonymousStoryFlowAuthChallenge(foreignFlow),
    VALID_INTAKE,
  );
  assert.equal(foreignResponse.status, 409);
  assert.equal(authEventsForFlow(foreignFlow).length, 0);

  const revokedFlow = createTelemetryFlowId();
  assert.equal(registerMemoryTelemetryFlow(revokedFlow), "created");
  assert.equal(
    claimMemoryTelemetryFlowOwner({
      flowId: revokedFlow,
      userId: LOCAL_DEV_USER_ID,
    }),
    "claimed",
  );
  assert.equal(
    revokeMemoryTelemetryFlow(revokedFlow, LOCAL_DEV_USER_ID),
    "revoked",
  );
  const revokedResponse = await postMatch(
    revokedFlow,
    issueAnonymousStoryFlowAuthChallenge(revokedFlow),
    VALID_INTAKE,
  );
  assert.equal(revokedResponse.status, 409);
  assert.equal(authEventsForFlow(revokedFlow).length, 0);
}

async function checkCrisisAndIncidentSwitches(): Promise<void> {
  const crisisFlow = createTelemetryFlowId();
  const beforeCrisis = listMemoryProductEvents().length;
  const crisisResponse = await postMatch(
    crisisFlow,
    issueAnonymousStoryFlowAuthChallenge(crisisFlow),
    { age: 22, feeling: "I want to kill myself" },
  );
  assert.equal(crisisResponse.status, 200);
  assert.equal((await crisisResponse.json() as { crisis?: unknown }).crisis, true);
  assert.equal(crisisResponse.headers.get("set-cookie"), null);
  assert.equal(getMemoryTelemetryFlowByFlow(crisisFlow), null);
  assert.equal(listMemoryProductEvents().length, beforeCrisis);

  const pausedFlow = createTelemetryFlowId();
  const pausedChallenge = issueAnonymousStoryFlowAuthChallenge(pausedFlow);
  process.env.STORY_CREATION_ENABLED = "false";
  try {
    const paused = await postMatch(pausedFlow, pausedChallenge);
    assert.equal(paused.status, 503);
    assert.equal(paused.headers.get("set-cookie"), null);
    assert.equal(getMemoryTelemetryFlowByFlow(pausedFlow), null);
    assert.equal(authEventsForFlow(pausedFlow).length, 0);
  } finally {
    process.env.STORY_CREATION_ENABLED = "true";
  }

  const disabledFlow = createTelemetryFlowId();
  const disabledChallenge = issueAnonymousStoryFlowAuthChallenge(disabledFlow);
  process.env.TELEMETRY_FLOW_BINDING_ENABLED = "false";
  try {
    const disabled = await postMatch(disabledFlow, disabledChallenge);
    assert.equal(disabled.status, 400);
    assert.equal(disabled.headers.get("set-cookie"), null);
    assert.equal(authEventsForFlow(disabledFlow).length, 0);
  } finally {
    process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";
  }
}

function checkPrivacyShape(): void {
  const serialized = JSON.stringify({
    events: listMemoryProductEvents(),
    outbox: listMemoryProductEventOutbox(),
  });
  assert(!serialized.includes(PRIVATE_CANARY));
  for (const forbidden of [
    "email",
    "password",
    "userId",
    "sessionId",
    "cookie",
    "challenge",
    "authenticationMethods",
  ]) {
    assert(
      !serialized.includes(forbidden),
      `auth telemetry exposed forbidden ${forbidden}`,
    );
  }
}

function checkStaticIntegration(): void {
  const handler = source("app/api/match/handler.ts");
  const intakeForm = source("components/IntakeForm.tsx");
  const workflow = source(".github/workflows/ci.yml");

  assert(
    handler.indexOf("classifyCrisis(safetyText)") <
      handler.indexOf("readStoryFlowAuthChallengeCookie(request)"),
  );
  assert(
    handler.indexOf("STORY_CREATION_ENABLED") <
      handler.indexOf("readStoryFlowAuthChallengeCookie(request)"),
  );
  assert(
    handler.indexOf("const validated = intake.validateIntakeInput(body)") <
      handler.indexOf("readStoryFlowAuthChallengeCookie(request)"),
  );
  assert(
    handler.indexOf("authProof = verifyAnonymousStoryFlowAuthChallenge") <
      handler.indexOf("authUser = await getAuthUserContext()"),
  );
  assert(
    handler.indexOf("const activation = await activateTelemetryFlowForOwner") <
      handler.indexOf("await recordLinkedProductEventBestEffort"),
  );
  assert(handler.includes('authEstablishedEvent("anonymous")'));
  assert(handler.includes("hasFreshAnonymousAuthentication"));
  assert(!intakeForm.includes(STORY_FLOW_AUTH_CHALLENGE_COOKIE));
  assert(!intakeForm.includes("authChallenge"));
  assert(
    intakeForm.includes(
      "response.status === 401 && (await ensureAuthSession())",
    ),
  );
  assert(workflow.includes("npm run check-auth-telemetry"));

  for (const relativePath of [
    "components/SignInForm.tsx",
    "components/SaveStoriesCard.tsx",
    "components/SetPasswordForm.tsx",
    "app/auth/confirm/route.ts",
    "app/stories/page.tsx",
  ]) {
    const contents = source(relativePath);
    assert(!contents.includes("authEstablishedEvent"));
    assert(!contents.includes("onward_auth_retry"));
    assert(!contents.includes("AnonymousStoryFlowAuthChallenge"));
  }
}

async function postMatch(
  flowId: TelemetryFlowId,
  challenge?: string,
  body: Record<string, unknown> = INVALID_INTAKE,
): Promise<Response> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    [TELEMETRY_FLOW_HEADER]: flowId,
  };
  if (challenge) {
    headers.cookie = `${STORY_FLOW_AUTH_CHALLENGE_COOKIE}=${challenge}`;
  }
  return matchPost(
    new Request(`${ORIGIN}/api/match`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }),
  );
}

function authContext(input: {
  isAnonymous: boolean;
  method: string;
  timestamp: number;
}): AuthUserContext {
  return Object.freeze({
    userId: "auth-context-test",
    isAnonymous: input.isAnonymous,
    authenticationMethods: Object.freeze([
      Object.freeze({ method: input.method, timestamp: input.timestamp }),
    ]),
  });
}

function authEventsForFlow(flowId: TelemetryFlowId) {
  return listMemoryProductEvents().filter(
    (event) => event.flowId === flowId && event.event === "auth_established",
  );
}

function source(relativePath: string): string {
  return readFileSync(resolve(relativePath), "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
