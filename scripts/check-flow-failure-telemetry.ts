import "./_smoke-bootstrap";

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { POST as matchPost } from "../app/api/match/route";
import { _setMemoryAuthContextForTests } from "../lib/auth";
import {
  beginInitialStoryPreparationFailureRecorder,
  INITIAL_STORY_FAILURE_CAPTURE_BUDGET_MS,
  type InitialStoryPreparationFailureDependencies,
} from "../lib/flow-failure-telemetry";
import { handleIntake } from "../lib/intake";
import {
  claimProductEventOutbox,
  createTelemetryFlowId,
  createTelemetryOccurrenceId,
  createTelemetryOutboxLeaseId,
  recordProductEvent,
} from "../lib/telemetry";
import {
  activateTelemetryFlowForOwner,
  revokeTelemetryFlow,
} from "../lib/telemetry-flow-lifecycle";
import { TELEMETRY_FLOW_HEADER } from "../lib/telemetry-flow-header";
import { getMemoryTelemetryFlowByFlow } from "../lib/telemetry-flow-state-memory";
import { issueTelemetryFlowId } from "../lib/telemetry-id";
import { latencyBucketForMs } from "../lib/telemetry-latency";
import { reduceFlowFailure } from "../lib/telemetry-reductions";
import { parseProductEvent } from "../lib/telemetry-schema";
import {
  listMemoryProductEventOutbox,
  listMemoryProductEvents,
} from "../lib/telemetry-store-memory";
import type {
  ProductEventRecord,
  TelemetryFlowId,
  TelemetryOccurrenceId,
} from "../lib/telemetry-types";

type FlowFailureRecord = Extract<
  ProductEventRecord,
  { event: "flow_failed" }
>;

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";
process.env.EMBEDDING_PROVIDER = "stub";
process.env.RETRIEVAL_MODE = "keyword";
process.env.HYBRID_STORY_COMPOSER_ENABLED = "false";
process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";
process.env.STORY_CREATION_ENABLED = "true";

const ORIGIN = "http://onward.test";
const VALID_INTAKE = Object.freeze({
  age: 28,
  feeling: "I keep getting rejected and do not know whether to keep trying",
});
const PRIVATE_CANARY =
  "failure-private-canary@example.test session=0123456789abcdef ip=203.0.113.8";

async function main(): Promise<void> {
  await checkSanitizedOwnerAndAmbiguousReplay();
  await checkOccurrenceIdempotencyAndConflict();
  await checkInitialPreparationIntegration();
  await checkCaptureDeadlinePreservesResponse();
  await checkSilentBoundaries();
  checkStringHostileReduction();
  checkStaticAndSqlBoundaries();

  console.log("Onward initial composition failure telemetry validator");
  console.log("========================================================");
  console.log("PASS one eligible initial preparation failure owns one closed event");
  console.log("PASS occurrence replay is idempotent and restores its outbox pointer");
  console.log("PASS raw errors, crisis, expected states, and successful artifacts stay silent");
  console.log("PASS capture failure preserves the existing temporary-unavailable response");
}

async function checkSanitizedOwnerAndAmbiguousReplay(): Promise<void> {
  const { flowId } = await activeFlow("00000000-0000-4000-8000-000000000101");
  const occurrenceId = createTelemetryOccurrenceId();
  const error = Object.assign(new Error(PRIVATE_CANARY), {
    name: "AbortError",
    stack: `stack:${PRIVATE_CANARY}`,
    cause: { token: PRIVATE_CANARY },
    response: { body: PRIVATE_CANARY },
    cookie: PRIVATE_CANARY,
  });
  let writes = 0;
  const recorder = timedRecorder(flowId, occurrenceId, 8_001, {
    write: async (input) => {
      writes += 1;
      const result = await recordProductEvent(input);
      if (writes === 1) throw new Error("synthetic response loss");
      return result;
    },
  });

  assert.equal(await recorder.capture(error), "duplicate");
  assert.equal(writes, 2);
  const failures = failuresFor(flowId);
  assert.equal(failures.length, 1);
  assert.deepEqual(projectFailure(failures[0]), {
    event: "flow_failed",
    domain: "composition",
    errorClass: "timeout",
    statusBucket: "timeout",
    latencyBucket: "8to15s",
  });
  const pointer = listMemoryProductEventOutbox().filter(
    (candidate) => candidate.eventId === failures[0].eventId,
  );
  assert.equal(pointer.length, 1);

  const claimed = await claimProductEventOutbox({
    leaseId: createTelemetryOutboxLeaseId(),
    limit: 100,
  });
  const failureClaim = claimed.find(
    (candidate) => candidate.eventId === failures[0].eventId,
  );
  assert(failureClaim, "the failure outbox pointer was not claimable");
  for (const value of [failures[0], pointer[0], failureClaim]) {
    const serialized = JSON.stringify(value);
    assert(!serialized.includes(PRIVATE_CANARY));
    assert(!serialized.includes("toc_"));
  }
}

async function checkOccurrenceIdempotencyAndConflict(): Promise<void> {
  const { flowId } = await activeFlow("00000000-0000-4000-8000-000000000102");
  const occurrenceId = createTelemetryOccurrenceId();
  const recorders = Array.from({ length: 12 }, () =>
    timedRecorder(flowId, occurrenceId, 250),
  );
  const results = await Promise.all(
    recorders.map((recorder) =>
      recorder.capture({ errorClass: "network", message: PRIVATE_CANARY }),
    ),
  );
  assert.equal(results.filter((result) => result === "created").length, 1);
  assert.equal(results.filter((result) => result === "duplicate").length, 11);

  const [stored] = failuresFor(flowId);
  assert(stored);
  assert.equal(failuresFor(flowId).length, 1);
  assert.equal(
    listMemoryProductEventOutbox().filter(
      (candidate) => candidate.eventId === stored.eventId,
    ).length,
    1,
  );

  globalThis.__onwardProductEventOutbox?.delete(stored.eventId);
  assert.equal(
    await timedRecorder(flowId, occurrenceId, 250).capture({
      errorClass: "network",
    }),
    "duplicate",
  );
  assert.equal(
    listMemoryProductEventOutbox().filter(
      (candidate) => candidate.eventId === stored.eventId,
    ).length,
    1,
  );

  assert.equal(
    await timedRecorder(flowId, occurrenceId, 8_001).capture({
      errorClass: "timeout",
    }),
    "unavailable",
  );
  assert.deepEqual(projectFailure(failuresFor(flowId)[0]), {
    event: "flow_failed",
    domain: "composition",
    errorClass: "network",
    statusBucket: "network",
    latencyBucket: "250to500ms",
  });

  assert.equal(
    await timedRecorder(
      flowId,
      createTelemetryOccurrenceId(),
      8_001,
    ).capture({ errorClass: "timeout" }),
    "created",
  );
  assert.equal(failuresFor(flowId).length, 2);
}

async function checkInitialPreparationIntegration(): Promise<void> {
  const thrown = await runForcedPreparation("throw");
  assert.deepEqual(thrown.result, { temporarilyUnavailable: true });
  assert.equal(failuresFor(thrown.flowId).length, 1);
  assert.equal(failuresFor(thrown.flowId)[0].errorClass, "timeout");
  assert(!JSON.stringify(failuresFor(thrown.flowId)).includes(PRIVATE_CANARY));
  assertEligibleFailureSequence(thrown.flowId);

  const rejected = await runForcedPreparation("null");
  assert.deepEqual(rejected.result, { temporarilyUnavailable: true });
  assert.deepEqual(projectFailure(failuresFor(rejected.flowId)[0]), {
    event: "flow_failed",
    domain: "composition",
    errorClass: "conflict",
    statusBucket: "invalid_request",
    latencyBucket: failuresFor(rejected.flowId)[0].latencyBucket,
  });
  assertEligibleFailureSequence(rejected.flowId);

  const successfulFlow = createTelemetryFlowId();
  const success = await handleIntake(VALID_INTAKE, {
    userId: "00000000-0000-4000-8000-000000000105",
    ipHash: "5".repeat(64),
    telemetryFlowId: successfulFlow,
  });
  assert("sessionId" in success, "canonical preparation did not create a story");
  assert.equal(failuresFor(successfulFlow).length, 0);

}

async function checkCaptureDeadlinePreservesResponse(): Promise<void> {
  const flowId = createTelemetryFlowId();
  const startedAt = performance.now();
  const result = await handleIntake(
    VALID_INTAKE,
    {
      userId: "00000000-0000-4000-8000-000000000106",
      ipHash: "6".repeat(64),
      telemetryFlowId: flowId,
    },
    {
      prepare: async () => {
        throw Object.assign(new Error(PRIVATE_CANARY), {
          errorClass: "timeout",
        });
      },
      failureTelemetry: {
        write: async () => new Promise(() => undefined),
      },
    },
  );
  const elapsed = performance.now() - startedAt;
  assert.deepEqual(result, { temporarilyUnavailable: true });
  assert(
    elapsed < INITIAL_STORY_FAILURE_CAPTURE_BUDGET_MS + 1_000,
    `failure capture exceeded its response budget: ${elapsed}ms`,
  );
  assert.equal(failuresFor(flowId).length, 0);
}

async function checkSilentBoundaries(): Promise<void> {
  const crisisFlow = createTelemetryFlowId();
  const beforeCrisis = storedTelemetrySnapshot();
  const crisis = await postMatch(crisisFlow, {
    age: 28,
    feeling: "I am going to kill myself tonight",
  });
  assert.equal(crisis.status, 200);
  assert.equal(storedTelemetrySnapshot(), beforeCrisis);
  assert.equal(getMemoryTelemetryFlowByFlow(crisisFlow), null);

  const malformedFlow = createTelemetryFlowId();
  const beforeMalformed = storedTelemetrySnapshot();
  const malformed = await postMatch(malformedFlow, {
    age: 0,
    feeling: PRIVATE_CANARY,
  });
  assert.equal(malformed.status, 400);
  assert.equal(storedTelemetrySnapshot(), beforeMalformed);
  assert.equal(getMemoryTelemetryFlowByFlow(malformedFlow), null);

  const disabledFlow = createTelemetryFlowId();
  const beforeDisabled = storedTelemetrySnapshot();
  process.env.STORY_CREATION_ENABLED = "false";
  try {
    const disabled = await postMatch(disabledFlow, VALID_INTAKE);
    assert.equal(disabled.status, 503);
    assert.equal(storedTelemetrySnapshot(), beforeDisabled);
    assert.equal(getMemoryTelemetryFlowByFlow(disabledFlow), null);
  } finally {
    process.env.STORY_CREATION_ENABLED = "true";
  }

  let writes = 0;
  const noFlow = beginInitialStoryPreparationFailureRecorder(null, {
    write: async () => {
      writes += 1;
      return "created";
    },
  });
  assert.equal(await noFlow.capture(new Error(PRIVATE_CANARY)), "skipped");
  process.env.TELEMETRY_FLOW_BINDING_ENABLED = "false";
  try {
    const incidentDisabled = beginInitialStoryPreparationFailureRecorder(
      createTelemetryFlowId(),
      {
        write: async () => {
          writes += 1;
          return "created";
        },
      },
    );
    assert.equal(
      await incidentDisabled.capture(new Error(PRIVATE_CANARY)),
      "skipped",
    );
  } finally {
    process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";
  }
  assert.equal(writes, 0);

  const owner = "00000000-0000-4000-8000-000000000107";
  const revokedFlow = createTelemetryFlowId();
  assert.equal(
    await activateTelemetryFlowForOwner(revokedFlow, owner),
    "active",
  );
  assert.equal(await revokeTelemetryFlow(revokedFlow, owner), "revoked");
  assert.equal(
    await timedRecorder(
      revokedFlow,
      createTelemetryOccurrenceId(),
      10,
    ).capture({ errorClass: "timeout" }),
    "unavailable",
  );
  assert.equal(eventsFor(revokedFlow).length, 0);

  const expiredFlow = issueTelemetryFlowId(
    new Date(Date.now() - 31 * 86_400_000),
  );
  assert.equal(
    await timedRecorder(
      expiredFlow,
      createTelemetryOccurrenceId(),
      10,
    ).capture({ errorClass: "timeout" }),
    "unavailable",
  );
  assert.equal(eventsFor(expiredFlow).length, 0);
}

function checkStringHostileReduction(): void {
  const inspected = new Set<string>();
  const hostile = new Proxy(Object.create(null) as Record<string, unknown>, {
    get(_target, property) {
      const key = String(property);
      inspected.add(key);
      if (key === "name") return "AbortError";
      throw new Error(PRIVATE_CANARY);
    },
  });
  const reduced = reduceFlowFailure({
    domain: "composition",
    error: hostile,
    durationMs: 8_001,
  });
  assert.equal(reduced.errorClass, "timeout");
  assert.deepEqual([...inspected], ["status", "errorClass", "name"]);
  assert(!inspected.has("message"));
  assert(!inspected.has("stack"));
  assert(!inspected.has("cause"));
  assert(!inspected.has("response"));

  for (const [milliseconds, expected] of [
    [249, "lt250ms"],
    [250, "250to500ms"],
    [500, "250to500ms"],
    [501, "500ms_to1s"],
    [1_000, "1to3s"],
    [3_000, "3to6s"],
    [6_000, "6to8s"],
    [8_000, "6to8s"],
    [15_000, "8to15s"],
    [15_001, "gt15s"],
  ] as const) {
    assert.equal(latencyBucketForMs(milliseconds), expected);
  }
  assert.throws(() => latencyBucketForMs(-1));
  assert.throws(() => latencyBucketForMs(3_600_001));
  assert.throws(() =>
    parseProductEvent({
      ...reduced,
      message: PRIVATE_CANARY,
    }),
  );
  assert.throws(() =>
    parseProductEvent({
      ...reduced,
      metadata: { body: PRIVATE_CANARY },
    }),
  );
}

function checkStaticAndSqlBoundaries(): void {
  const ownerSource = read("lib/flow-failure-telemetry.ts");
  const intakeSource = read("lib/intake.ts");
  const routeSource = read("app/api/match/route.ts");
  const alternateSource = read("lib/alternate-story.ts");
  const migration10 = read("supabase/migrations/0010_privacy_safe_telemetry.sql");
  const migration11 = read(
    "supabase/migrations/0011_transactional_telemetry_outbox.sql",
  );

  assert.match(ownerSource, /domain: "composition"/);
  assert.match(ownerSource, /createTelemetryOccurrenceId/);
  assert.match(ownerSource, /INITIAL_STORY_FAILURE_CAPTURE_BUDGET_MS = 1_000/);
  assert.match(ownerSource, /attempt < CAPTURE_ATTEMPTS/);
  assert.match(ownerSource, /Promise\.race/);
  assert(!ownerSource.includes("console."));
  assert(!ownerSource.includes("error.message"));
  assert(!ownerSource.includes("error.stack"));
  assert(!ownerSource.includes("JSON.stringify(error"));
  assert.match(intakeSource, /beginInitialStoryPreparationFailureRecorder/);
  assert.match(intakeSource, /preparationFailure\.capture\(error\)/);
  assert.match(intakeSource, /preparationFailure\.captureContentConflict\(\)/);
  assert(!routeSource.includes("flow_failed"));
  assert(!alternateSource.includes("flow_failed"));
  assert.deepEqual(productionSourcesContaining("reduceFlowFailure("), [
    "lib/flow-failure-telemetry.ts",
    "lib/telemetry-reductions.ts",
  ]);
  assert.deepEqual(
    productionSourcesContaining("beginInitialStoryPreparationFailureRecorder"),
    ["lib/flow-failure-telemetry.ts", "lib/intake.ts"],
  );
  assert.deepEqual(productionSourcesContaining('event: "flow_failed"'), [
    "lib/flow-failure-telemetry.ts",
    "lib/telemetry-reductions.ts",
    "lib/telemetry-store-supabase.ts",
    "lib/telemetry-types.ts",
  ]);

  assert.match(migration10, /when 'flow_failed' then[\s\S]*num_nonnulls\([\s\S]*\) = 4/);
  assert.match(migration11, /product event requires an active registered flow/);
  assert.match(migration11, /pg_advisory_xact_lock\(hashtextextended\(p_event_id, 0\)\)/);
  assert.match(migration11, /on conflict \(event_id\) do nothing/);
  assert.match(migration11, /revoke insert, delete on table public\.product_events from service_role/);
}

async function runForcedPreparation(
  outcome: "throw" | "null",
): Promise<{
  flowId: TelemetryFlowId;
  result: Awaited<ReturnType<typeof handleIntake>>;
}> {
  const suffix = outcome === "throw" ? "103" : "104";
  const flowId = createTelemetryFlowId();
  const result = await handleIntake(
    VALID_INTAKE,
    {
      userId: `00000000-0000-4000-8000-000000000${suffix}`,
      ipHash: suffix[0].repeat(64),
      telemetryFlowId: flowId,
    },
    {
      prepare:
        outcome === "throw"
          ? async () => {
              throw Object.assign(new Error(PRIVATE_CANARY), {
                name: "AbortError",
                stack: PRIVATE_CANARY,
                cause: PRIVATE_CANARY,
              });
            }
          : async () => null,
    },
  );
  return { flowId, result };
}

function timedRecorder(
  flowId: TelemetryFlowId,
  occurrenceId: TelemetryOccurrenceId,
  durationMs: number,
  overrides: Pick<InitialStoryPreparationFailureDependencies, "write"> = {},
) {
  let clockCalls = 0;
  return beginInitialStoryPreparationFailureRecorder(flowId, {
    issueOccurrenceId: () => occurrenceId,
    now: () => (clockCalls++ === 0 ? 10_000 : 10_000 + durationMs),
    ...overrides,
  });
}

async function activeFlow(userId: string): Promise<{ flowId: TelemetryFlowId }> {
  const flowId = createTelemetryFlowId();
  assert.equal(await activateTelemetryFlowForOwner(flowId, userId), "active");
  return { flowId };
}

async function postMatch(flowId: TelemetryFlowId, body: unknown): Promise<Response> {
  _setMemoryAuthContextForTests(null);
  return matchPost(
    new Request(`${ORIGIN}/api/match`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [TELEMETRY_FLOW_HEADER]: flowId,
      },
      body: JSON.stringify(body),
    }),
  );
}

function failuresFor(flowId: TelemetryFlowId): FlowFailureRecord[] {
  return eventsFor(flowId).filter(
    (event): event is FlowFailureRecord => event.event === "flow_failed",
  );
}

function eventsFor(flowId: TelemetryFlowId): ProductEventRecord[] {
  return listMemoryProductEvents().filter(
    (event) => event.flowId === flowId,
  ) as ProductEventRecord[];
}

function projectFailure(event: FlowFailureRecord) {
  return {
    event: event.event,
    domain: event.domain,
    errorClass: event.errorClass,
    statusBucket: event.statusBucket,
    latencyBucket: event.latencyBucket,
  };
}

function assertEligibleFailureSequence(flowId: TelemetryFlowId): void {
  const events = eventsFor(flowId);
  const failureIndex = events.findIndex((event) => event.event === "flow_failed");
  const matchIndex = events.findIndex(
    (event) =>
      event.event === "match_completed" &&
      event.storyRole === "initial" &&
      (event.disposition === "close" || event.disposition === "adjacent"),
  );
  assert(matchIndex >= 0, "failure did not have an eligible initial match denominator");
  assert(matchIndex < failureIndex, "failure preceded its eligible match denominator");
  assert(!events.some((event) => event.event === "artifact_created"));
}

function storedTelemetrySnapshot(): string {
  return JSON.stringify({
    events: listMemoryProductEvents(),
    outbox: listMemoryProductEventOutbox(),
  });
}

function productionSourcesContaining(needle: string): string[] {
  const matches: string[] = [];
  const visit = (relativeDirectory: string) => {
    const absoluteDirectory = resolve(process.cwd(), relativeDirectory);
    for (const entry of readdirSync(absoluteDirectory, { withFileTypes: true })) {
      const relativePath = `${relativeDirectory}/${entry.name}`;
      if (entry.isDirectory()) {
        visit(relativePath);
      } else if (
        (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
        read(relativePath).includes(needle)
      ) {
        matches.push(relativePath.replaceAll("\\", "/"));
      }
    }
  };
  visit("app");
  visit("lib");
  return matches.sort();
}

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
