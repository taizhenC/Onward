import "./_smoke-bootstrap";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { POST as captureIntakeStarted } from "../app/api/telemetry/intake-started/route";
import { POST as captureLandingCta } from "../app/api/telemetry/landing-cta/route";
import { createTelemetryFlowId } from "../lib/telemetry";
import { TELEMETRY_ENTRY_COOKIE } from "../lib/telemetry-entry-handoff";
import { TELEMETRY_FLOW_HEADER } from "../lib/telemetry-flow-header";
import { parseTelemetryFlowId } from "../lib/telemetry-id";
import {
  listMemoryProductEventOutbox,
  listMemoryProductEvents,
} from "../lib/telemetry-store-memory";

process.env.PERSISTENCE = "memory";
process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";

const ORIGIN = "http://onward.test";
const PRIVATE_CANARY = "private-entry-canary-should-never-persist";

async function main(): Promise<void> {
  const flowId = await checkLandingHandoff();
  await checkIntakeStart(flowId);
  await checkUntrustedAndInvalidRequests();
  await checkIncidentSwitch();
  checkPrivacyShape();
  checkStaticIntegration();

  console.log("Onward entry telemetry validator");
  console.log("================================");
  console.log("PASS landing click creates one opaque, short-lived /begin handoff");
  console.log("PASS first intake change captures one first-write-wins viewport bucket");
  console.log("PASS cross-origin, malformed, forged, and incident-disabled requests stay silent");
  console.log("PASS routes and UI expose only fixed/closed telemetry dimensions");
}

async function checkLandingHandoff() {
  const response = await captureLandingCta(
    new Request(`${ORIGIN}/api/telemetry/landing-cta`, {
      method: "POST",
      headers: { origin: ORIGIN },
    }),
  );
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), `${ORIGIN}/begin`);
  assert.equal(response.headers.get("cache-control"), "no-store");

  const setCookie = response.headers.get("set-cookie");
  assert(setCookie, "landing handoff cookie is missing");
  assert.match(setCookie, new RegExp(`^${TELEMETRY_ENTRY_COOKIE}=`));
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /Path=\/begin/i);
  assert.match(setCookie, /Max-Age=30/i);
  assert.match(setCookie, /SameSite=Lax/i);
  assert(!setCookie.includes(PRIVATE_CANARY));

  const encodedFlowId = setCookie.match(
    new RegExp(`${TELEMETRY_ENTRY_COOKIE}=([^;]+)`),
  )?.[1];
  assert(encodedFlowId, "landing handoff has no flow value");
  const flowId = parseTelemetryFlowId(decodeURIComponent(encodedFlowId));
  const events = eventsForFlow(flowId);
  assert.equal(events.length, 1);
  assert.equal(events[0].event, "landing_cta_clicked");
  if (events[0].event === "landing_cta_clicked") {
    assert.equal(events[0].surface, "home_primary");
  }
  return flowId;
}

async function checkIntakeStart(
  flowId: ReturnType<typeof parseTelemetryFlowId>,
): Promise<void> {
  const first = await postIntakeStarted(flowId, { viewportBucket: "small" });
  assert.equal(first.status, 204);

  const retryAfterResize = await postIntakeStarted(flowId, {
    viewportBucket: "large",
  });
  assert.equal(retryAfterResize.status, 204);

  const events = eventsForFlow(flowId);
  const starts = events.filter((event) => event.event === "intake_started");
  assert.equal(starts.length, 1);
  assert.equal(starts[0].event, "intake_started");
  if (starts[0].event === "intake_started") {
    assert.equal(starts[0].viewportBucket, "small");
  }
  assert.equal(events.length, 2);
  assert.equal(
    listMemoryProductEventOutbox().filter((pointer) =>
      events.some((event) => event.eventId === pointer.eventId),
    ).length,
    2,
  );
}

async function checkUntrustedAndInvalidRequests(): Promise<void> {
  const before = listMemoryProductEvents().length;
  const foreignLanding = await captureLandingCta(
    new Request(`${ORIGIN}/api/telemetry/landing-cta`, {
      method: "POST",
      headers: { origin: "https://attacker.invalid" },
      body: PRIVATE_CANARY,
    }),
  );
  assert.equal(foreignLanding.status, 303);
  assert.equal(foreignLanding.headers.get("set-cookie"), null);

  const flowId = createTelemetryFlowId();
  const foreignIntake = await captureIntakeStarted(
    new Request(`${ORIGIN}/api/telemetry/intake-started`, {
      method: "POST",
      headers: {
        origin: "https://attacker.invalid",
        "content-type": "application/json",
        [TELEMETRY_FLOW_HEADER]: flowId,
      },
      body: JSON.stringify({ viewportBucket: "small" }),
    }),
  );
  assert.equal(foreignIntake.status, 204);

  const malformed = await postIntakeStarted(flowId, {
    viewportBucket: "small",
    disclosure: PRIVATE_CANARY,
  });
  assert.equal(malformed.status, 400);

  const forged = await captureIntakeStarted(
    new Request(`${ORIGIN}/api/telemetry/intake-started`, {
      method: "POST",
      headers: {
        origin: ORIGIN,
        "content-type": "application/json",
        [TELEMETRY_FLOW_HEADER]: PRIVATE_CANARY,
      },
      body: JSON.stringify({ viewportBucket: "small" }),
    }),
  );
  assert.equal(forged.status, 204);
  assert.equal(listMemoryProductEvents().length, before);
}

async function checkIncidentSwitch(): Promise<void> {
  const before = listMemoryProductEvents().length;
  process.env.TELEMETRY_FLOW_BINDING_ENABLED = "false";
  try {
    const landing = await captureLandingCta(
      new Request(`${ORIGIN}/api/telemetry/landing-cta`, {
        method: "POST",
        headers: { origin: ORIGIN },
      }),
    );
    assert.equal(landing.status, 303);
    assert.equal(landing.headers.get("set-cookie"), null);

    const intake = await postIntakeStarted(createTelemetryFlowId(), {
      viewportBucket: "large",
    });
    assert.equal(intake.status, 204);
    assert.equal(listMemoryProductEvents().length, before);
  } finally {
    process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";
  }
}

function checkPrivacyShape(): void {
  const serialized = JSON.stringify(listMemoryProductEvents());
  assert(!serialized.includes(PRIVATE_CANARY));
  for (const key of [
    "age",
    "feeling",
    "disclosure",
    "sessionId",
    "artifactId",
    "userId",
    "cookie",
    "url",
  ]) {
    assert(!serialized.includes(key), `entry event exposed forbidden ${key}`);
  }
}

function checkStaticIntegration(): void {
  const landingPage = source("app/page.tsx");
  const beginPage = source("app/begin/page.tsx");
  const form = source("components/IntakeForm.tsx");
  const landingRoute = source("app/api/telemetry/landing-cta/route.ts");
  const intakeRoute = source("app/api/telemetry/intake-started/route.ts");
  const workflow = source(".github/workflows/ci.yml");

  assert.equal(
    landingPage.match(/action="\/api\/telemetry\/landing-cta"/g)?.length,
    1,
    "landing CTAs do not share the fixed form component",
  );
  assert(landingPage.includes('<StoryStartButton label="Read a story" />'));
  assert(landingPage.includes('<StoryStartButton label="Begin" />'));
  assert(beginPage.includes("parseTelemetryFlowId(handoff)"));
  assert(beginPage.includes("createTelemetryFlowId()"));
  assert(form.includes("onChange={markIntakeStarted}"));
  assert(form.includes("JSON.stringify({ viewportBucket })"));
  assert(form.includes("event.nativeEvent.isTrusted"));
  assert(!landingRoute.includes("request.json"));
  assert(landingRoute.includes('surface: "home_primary"') === false);
  assert(intakeRoute.includes("Object.keys(value).length !== 1"));
  assert(workflow.includes("npm run check-entry-telemetry"));
}

async function postIntakeStarted(
  flowId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return captureIntakeStarted(
    new Request(`${ORIGIN}/api/telemetry/intake-started`, {
      method: "POST",
      headers: {
        origin: ORIGIN,
        "content-type": "application/json",
        [TELEMETRY_FLOW_HEADER]: flowId,
      },
      body: JSON.stringify(body),
    }),
  );
}

function eventsForFlow(flowId: string) {
  return listMemoryProductEvents().filter((event) => event.flowId === flowId);
}

function source(relativePath: string): string {
  return readFileSync(resolve(relativePath), "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
