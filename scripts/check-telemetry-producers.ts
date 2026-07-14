import "./_smoke-bootstrap";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { handleIntake, type IntakeContext } from "../lib/intake";
import { APPROVED_PRODUCTION_RECIPE } from "../lib/match-config";
import {
  MATCH_RECOVERY_POLICY_VERSION,
  type MatchDisposition,
} from "../lib/match-recovery";
import {
  consumeMatchRecoveryToken,
  issueMatchRecoveryToken,
} from "../lib/match-recovery-flow";
import type { IntakeMatchResult } from "../lib/matching";
import { consumeMatchRateLimit, MATCH_LIMITS } from "../lib/rate-limit";
import { createSession, getOwnedSession } from "../lib/session";
import type { StoryArtifact } from "../lib/story-artifact-types";
import { getOwnedStoryArtifact } from "../lib/story-artifacts";
import type { StoryBoundaries } from "../lib/story-boundaries";
import { createTelemetryFlowId } from "../lib/telemetry";
import {
  artifactCreatedEvent,
  matchCompletedEvent,
  noEligibleMatchCompletedEvent,
} from "../lib/telemetry-producers";
import { parseProductEvent } from "../lib/telemetry-schema";
import { listMemoryProductEvents } from "../lib/telemetry-store-memory";
import type {
  ProductEvent,
  ProductEventRecord,
  StoryRole,
  TelemetryFlowId,
} from "../lib/telemetry-types";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";
process.env.EMBEDDING_PROVIDER = "stub";
process.env.RETRIEVAL_MODE = "keyword";
process.env.HYBRID_STORY_COMPOSER_ENABLED = "true";
process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";
delete process.env.STORY_CREATION_ENABLED;

const recipeId = APPROVED_PRODUCTION_RECIPE.recipeId;
const HAPPY_DISCLOSURE =
  "I keep getting rejected and do not know whether I should keep trying.";
const AMBIGUOUS_DISCLOSURE =
  "A peculiar cobalt fog has changed the texture of every ordinary day.";
const BOUNDARIES: StoryBoundaries = {
  maxIntensity: "moderate",
  excludedFlags: [],
};

async function main(): Promise<void> {
  checkMatchEventMappings();
  checkArtifactEventMappings();
  checkTransactionalProducerBoundaries();
  await checkRecoveryDimensionDriftReconciliation();
  await checkClarificationProducers();
  await checkSuccessfulIntakeProducers();
  await checkRateLimitProducerAndPrecedence();

  console.log(
    "Telemetry producers OK: closed mappings, singleton intake/match/clarification/artifact milestones, unlinkable limiter denial, and privacy-safe rows",
  );
}

function checkTransactionalProducerBoundaries(): void {
  const migration = readFileSync(
    resolve("supabase/migrations/0012_match_telemetry_producers.sql"),
    "utf8",
  );
  const sessionStore = readFileSync(
    resolve("lib/session-store-supabase.ts"),
    "utf8",
  );
  const recoveryStore = readFileSync(
    resolve("lib/match-recovery-flow.ts"),
    "utf8",
  );
  const limiter = readFileSync(resolve("lib/rate-limit.ts"), "utf8");

  for (const functionName of [
    "consume_match_rate_limit_v2",
    "issue_match_recovery_flow_v2",
    "create_story_session_v4",
  ]) {
    assert.match(
      migration,
      new RegExp(`create or replace function public\\.${functionName}\\(`),
    );
    assert.match(
      migration,
      new RegExp(`grant execute on function public\\.${functionName}\\(`),
    );
  }
  assert.match(migration, /p_user_key !~[\s\S]*\^u:/);
  assert.match(migration, /p_ip_key !~ '\^ip:\[0-9a-f\]\{64\}\$'/);
  assert(
    migration.indexOf("then 'user'") < migration.indexOf("then 'ip'"),
    "user scope must win a dual limiter denial",
  );
  assert.match(
    migration,
    /consume_match_rate_limit_v2[\s\S]*capture_product_event_v1\([\s\S]*p_event_name => 'rate_limited'/,
  );
  assert.match(
    migration,
    /create table public\.match_rate_limit_decisions \(/,
  );
  assert.match(
    migration,
    /alter table public\.match_rate_limit_decisions force row level security/,
  );
  assert.match(
    migration,
    /onward-prune-match-rate-limit-decisions[\s\S]*expires_at <= now\(\)/,
  );
  const decisionTable = migration.match(
    /create table public\.match_rate_limit_decisions \(([\s\S]*?)\n\);/,
  )?.[1];
  assert(decisionTable, "the limiter decision table must have a closed schema");
  for (const forbiddenIdentityColumn of [
    "user_key",
    "ip_key",
    "user_id",
    "ip_hash",
  ]) {
    assert.equal(
      decisionTable.includes(forbiddenIdentityColumn),
      false,
      `limiter decisions must not store ${forbiddenIdentityColumn}`,
    );
  }
  const limiterFunction = migration.slice(
    migration.indexOf(
      "create or replace function public.consume_match_rate_limit_v2(",
    ),
    migration.indexOf(
      "revoke all on function public.consume_match_rate_limit_v2(",
    ),
  );
  assert.match(limiterFunction, /pg_advisory_xact_lock\(/);
  assert(
    limiterFunction.indexOf("select * into v_existing") <
      limiterFunction.indexOf("insert into public.rate_limits"),
    "a retry must resolve its stored decision before consuming counters",
  );
  assert(
    limiterFunction.indexOf("capture_product_event_v1(") <
      limiterFunction.indexOf("insert into public.match_rate_limit_decisions"),
    "denial telemetry and its replayable decision must commit together",
  );
  assert.match(
    migration,
    /issue_match_recovery_flow_v2[\s\S]*root_session_id is not null[\s\S]*insert into public\.match_recovery_flows[\s\S]*p_event_name => 'match_completed'/,
  );
  assert.match(
    migration,
    /v_capture_status = 'conflict'[\s\S]*from public\.product_events existing[\s\S]*existing\.flow_id = p_telemetry_flow_id[\s\S]*existing\.story_role = 'initial'[\s\S]*existing\.match_disposition = v_match_disposition[\s\S]*insert into public\.product_event_outbox/,
    "recovery RPC must preserve the first measured match row on semantic retry",
  );
  assert.match(
    migration,
    /create_story_session_v4[\s\S]*create_story_session_v3\([\s\S]*from public\.story_artifacts[\s\S]*p_event_name => 'artifact_created'/,
  );
  assert.match(
    migration,
    /v_session\.match_recipe ->> 'matchConfigVersion'\) is distinct from[\s\S]*'figure-library-50-2026-07-02'/,
  );
  assert.match(
    migration,
    /v_session\.match_recipe ->> 'retrievalMode'\) is distinct from 'keyword'/,
  );
  assert.match(sessionStore, /rpc\("create_story_session_v4"/);
  assert.match(recoveryStore, /rpc\([\s\S]*"issue_match_recovery_flow_v2"/);
  assert.match(limiter, /rpc\([\s\S]*"consume_match_rate_limit_v2"/);
  assert.match(
    limiter,
    /const first = await consumeSupabaseRateLimitV2\(args\)[\s\S]*const retry = await consumeSupabaseRateLimitV2\(args\)/,
  );
  assert.match(
    limiter,
    /if \(first\.kind === "missing"\)[\s\S]*consumeLegacySupabaseRateLimit/,
  );
  assert.match(
    limiter,
    /const retry = await consumeSupabaseRateLimitV2\(args\);\s*return retry\.kind === "decision" \? retry\.allowed : true;/,
  );
}

async function checkRecoveryDimensionDriftReconciliation(): Promise<void> {
  const flowId = createTelemetryFlowId();
  const userId = `telemetry-producer-drift-${Date.now()}`;
  const identity = {
    age: 32,
    feeling: AMBIGUOUS_DISCLOSURE,
    telemetryFlowId: flowId,
  };
  const firstMatch: Extract<ProductEvent, { event: "match_completed" }> = {
    event: "match_completed",
    recipeId,
    storyRole: "initial",
    disposition: "no_close_match",
    confidenceBucket: "low",
    matchPath: "rerank",
    ageFallback: false,
    boundaryOutcome: "not_set",
  };
  const driftedRetry: Extract<ProductEvent, { event: "match_completed" }> = {
    ...firstMatch,
    confidenceBucket: "medium",
    matchPath: "keyword_fallback",
    ageFallback: true,
    boundaryOutcome: "passed",
  };

  const firstToken = await issueMatchRecoveryToken(
    userId,
    identity,
    "adjacent_acceptance",
    { flowId, matchEvent: firstMatch },
  );
  const retryToken = await issueMatchRecoveryToken(
    userId,
    identity,
    "adjacent_acceptance",
    { flowId, matchEvent: driftedRetry },
  );

  assert.notEqual(retryToken, firstToken, "a retry must issue a fresh token");
  assert.equal(
    await consumeMatchRecoveryToken(firstToken, userId, identity),
    "adjacent_acceptance",
  );
  assert.equal(
    await consumeMatchRecoveryToken(retryToken, userId, identity),
    "adjacent_acceptance",
  );
  const events = eventsForFlow(flowId);
  assertEventCount(events, "match_completed", 1);
  assert.deepEqual(
    eventPayload(onlyEvent(events, "match_completed")),
    firstMatch,
    "the first accepted calibration dimensions must remain authoritative",
  );
}

function checkMatchEventMappings(): void {
  const cases: ReadonlyArray<{
    name: string;
    disposition: MatchDisposition;
    result: IntakeMatchResult;
    storyRole: StoryRole;
    boundaries: StoryBoundaries | undefined;
    expected: ProductEvent;
  }> = [
    {
      name: "close rerank without boundaries",
      disposition: "close_match",
      result: matchResult("high", "rerank", false, "definitive"),
      storyRole: "initial",
      boundaries: undefined,
      expected: {
        event: "match_completed",
        recipeId,
        storyRole: "initial",
        disposition: "close",
        confidenceBucket: "high",
        matchPath: "rerank",
        ageFallback: false,
        boundaryOutcome: "not_set",
      },
    },
    {
      name: "adjacent keyword fallback with boundaries",
      disposition: "adjacent_match",
      result: matchResult("medium", "keyword_fallback", true, "partial"),
      storyRole: "alternate",
      boundaries: BOUNDARIES,
      expected: {
        event: "match_completed",
        recipeId,
        storyRole: "alternate",
        disposition: "adjacent",
        confidenceBucket: "medium",
        matchPath: "keyword_fallback",
        ageFallback: true,
        boundaryOutcome: "passed",
      },
    },
    {
      name: "clarification rerank with boundaries",
      disposition: "clarification_needed",
      result: matchResult("low", "rerank", false, "partial"),
      storyRole: "initial",
      boundaries: BOUNDARIES,
      expected: {
        event: "match_completed",
        recipeId,
        storyRole: "initial",
        disposition: "clarification_required",
        confidenceBucket: "low",
        matchPath: "rerank",
        ageFallback: false,
        boundaryOutcome: "passed",
      },
    },
    {
      name: "no-close keyword fallback without boundaries",
      disposition: "no_close_match",
      result: matchResult("low", "keyword_fallback", true, "partial"),
      storyRole: "initial",
      boundaries: undefined,
      expected: {
        event: "match_completed",
        recipeId,
        storyRole: "initial",
        disposition: "no_close_match",
        confidenceBucket: "low",
        matchPath: "keyword_fallback",
        ageFallback: true,
        boundaryOutcome: "not_set",
      },
    },
  ];

  for (const testCase of cases) {
    const actual = matchCompletedEvent(testCase);
    assert.deepEqual(actual, testCase.expected, testCase.name);
    assert.deepEqual(parseProductEvent(actual), testCase.expected);
  }

  const noEligible: ProductEvent = {
    event: "match_completed",
    recipeId,
    storyRole: "initial",
    disposition: "no_close_match",
    confidenceBucket: "not_applicable",
    matchPath: "not_run",
    ageFallback: false,
    boundaryOutcome: "no_eligible",
  };
  assert.deepEqual(noEligibleMatchCompletedEvent("keyword"), noEligible);
  assert.deepEqual(
    parseProductEvent(noEligibleMatchCompletedEvent("keyword")),
    noEligible,
  );
  assert.throws(
    () =>
      matchCompletedEvent({
        result: matchResult(
          "high",
          "rerank",
          false,
          "definitive",
          "facetsrag",
        ),
        disposition: "close_match",
        storyRole: "initial",
        boundaries: undefined,
      }),
    /not approved/,
    "a challenger retrieval path must not acquire the approved recipe id",
  );
  assert.throws(
    () => noEligibleMatchCompletedEvent("facetsrag"),
    /not approved/,
    "a no-eligible event must validate the configured recipe before stamping it",
  );
}

function checkArtifactEventMappings(): void {
  const valid: Array<{
    name: string;
    composition: StoryArtifact["composition"];
    storyRole: StoryRole;
    expected: ProductEvent;
  }> = [
    artifactCase("hybrid first pass", "hybrid", undefined, 1, "first"),
    artifactCase("hybrid retry", "hybrid", undefined, 2, "retry", "alternate"),
    artifactCase(
      "canonical-only path",
      "canonical_fallback",
      "canonical_only",
      0,
      "not_attempted",
    ),
    artifactCase(
      "opening validation fallback",
      "canonical_fallback",
      "validator_rejected",
      0,
      "not_attempted",
    ),
  ];

  for (const fallbackReason of [
    "provider_timeout",
    "provider_error",
    "provider_output_invalid",
    "validator_rejected",
  ] as const) {
    for (const attemptCount of [1, 2] as const) {
      valid.push(
        artifactCase(
          `${fallbackReason} after attempt ${attemptCount}`,
          "canonical_fallback",
          fallbackReason,
          attemptCount,
          "exhausted",
          attemptCount === 2 ? "alternate" : "initial",
        ),
      );
    }
  }

  for (const testCase of valid) {
    const actual = artifactCreatedEvent(
      artifactFixture(testCase.composition),
      testCase.storyRole,
    );
    assert.deepEqual(actual, testCase.expected, testCase.name);
    assert.deepEqual(parseProductEvent(actual), testCase.expected);
  }

  const invalid: ReadonlyArray<{
    name: string;
    artifact: StoryArtifact;
  }> = [
    {
      name: "unapproved recipe",
      artifact: artifactFixture(
        { mode: "hybrid", attemptCount: 1 },
        "unapproved-recipe",
      ),
    },
    {
      name: "unapproved retrieval path",
      artifact: artifactFixture(
        { mode: "hybrid", attemptCount: 1 },
        recipeId,
        "facetsrag",
      ),
    },
    {
      name: "stale match config",
      artifact: artifactFixture(
        { mode: "hybrid", attemptCount: 1 },
        recipeId,
        "keyword",
        "stale-match-config",
      ),
    },
    {
      name: "missing attempt count",
      artifact: artifactFixture({ mode: "hybrid" }),
    },
    {
      name: "negative attempt count",
      artifact: artifactFixture({ mode: "hybrid", attemptCount: -1 }),
    },
    {
      name: "fractional attempt count",
      artifact: artifactFixture({ mode: "hybrid", attemptCount: 1.5 }),
    },
    {
      name: "hybrid without a provider attempt",
      artifact: artifactFixture({ mode: "hybrid", attemptCount: 0 }),
    },
    {
      name: "hybrid beyond retry policy",
      artifact: artifactFixture({ mode: "hybrid", attemptCount: 3 }),
    },
    {
      name: "hybrid carrying a fallback",
      artifact: artifactFixture({
        mode: "hybrid",
        fallbackReason: "provider_timeout",
        attemptCount: 1,
      }),
    },
    {
      name: "canonical fallback without a reason",
      artifact: artifactFixture({
        mode: "canonical_fallback",
        attemptCount: 0,
      }),
    },
    {
      name: "canonical-only path claiming an attempt",
      artifact: artifactFixture({
        mode: "canonical_fallback",
        fallbackReason: "canonical_only",
        attemptCount: 1,
      }),
    },
    ...(["provider_timeout", "provider_error", "provider_output_invalid"] as const).map(
      (fallbackReason) => ({
        name: `${fallbackReason} without a provider attempt`,
        artifact: artifactFixture({
          mode: "canonical_fallback" as const,
          fallbackReason,
          attemptCount: 0,
        }),
      }),
    ),
    {
      name: "canonical fallback beyond retry policy",
      artifact: artifactFixture({
        mode: "canonical_fallback",
        fallbackReason: "provider_error",
        attemptCount: 3,
      }),
    },
  ];

  for (const testCase of invalid) {
    assert.throws(
      () => artifactCreatedEvent(testCase.artifact, "initial"),
      testCase.name,
    );
  }
}

async function checkClarificationProducers(): Promise<void> {
  const flowId = createTelemetryFlowId();
  const context: IntakeContext = {
    userId: `telemetry-producer-clarification-${Date.now()}`,
    ipHash: `telemetry-producer-clarification-ip-${Date.now()}`,
    telemetryFlowId: flowId,
  };
  const input = { age: 34, feeling: AMBIGUOUS_DISCLOSURE };

  const first = await handleIntake(input, context);
  const retry = await handleIntake(input, context);
  assert("clarificationNeeded" in first, "fixture must request clarification");
  assert("clarificationNeeded" in retry, "clarification retry must reconcile");

  const events = eventsForFlow(flowId);
  assertEventCount(events, "intake_submitted", 1);
  assertEventCount(events, "match_completed", 1);
  assertEventCount(events, "clarification_shown", 1);
  assertEventCount(events, "artifact_created", 0);

  const match = onlyEvent(events, "match_completed");
  assert.equal(match.disposition, "clarification_required");
  assert.equal(match.storyRole, "initial");
  assert.equal(match.confidenceBucket, "low");
  const clarification = onlyEvent(events, "clarification_shown");
  assert.equal(clarification.policyVersion, MATCH_RECOVERY_POLICY_VERSION);
  assertPrivacySafe(events, [AMBIGUOUS_DISCLOSURE, context.userId, context.ipHash]);
}

async function checkSuccessfulIntakeProducers(): Promise<void> {
  const flowId = createTelemetryFlowId();
  const context: IntakeContext = {
    userId: `telemetry-producer-story-${Date.now()}`,
    ipHash: `telemetry-producer-story-ip-${Date.now()}`,
    telemetryFlowId: flowId,
  };
  const input = { age: 28, feeling: HAPPY_DISCLOSURE };

  const created = await handleIntake(input, context);
  assert("sessionId" in created, "fixture must create a story");
  const replay = await handleIntake(input, context);
  assert("sessionId" in replay, "same-flow retry must reconcile the story");
  assert.equal(replay.sessionId, created.sessionId);

  const session = await getOwnedSession(created.sessionId, context.userId);
  assert(session, "created story must remain owner-readable");
  const artifactId = session.storyArtifactId;
  assert(artifactId, "created story must reference its artifact");
  const artifact = await getOwnedStoryArtifact(
    artifactId,
    context.userId,
    session.sessionId,
  );
  assert(artifact, "created story must have an owner-readable artifact");

  assert(session.age !== null, "initial story must retain its age");
  assert(session.feeling !== null, "initial story must retain its disclosure");
  assert(
    session.storyRequestContext !== null,
    "initial story must retain its request context",
  );
  const driftedArtifact = artifactWithDifferentTelemetryDimensions(artifact);
  assert.notDeepEqual(
    artifactCreatedEvent(driftedArtifact, "initial"),
    artifactCreatedEvent(artifact, "initial"),
    "the replay fixture must actually drift artifact telemetry dimensions",
  );
  const directReplaySessionId = await createSession({
    userId: context.userId,
    telemetryFlowId: flowId,
    telemetryFlowOwnerClaimed: true,
    figureKey: session.figureKey,
    stageId: session.stageId,
    framing: session.framing,
    age: session.age,
    feeling: session.feeling,
    storyRequestContext: session.storyRequestContext,
    matchRecipe: session.matchRecipe,
    artifact: driftedArtifact,
  });
  assert.equal(
    directReplaySessionId,
    session.sessionId,
    "a direct response-loss replay must retain the committed artifact",
  );

  const events = eventsForFlow(flowId);
  assertEventCount(events, "intake_submitted", 1);
  assertEventCount(events, "match_completed", 1);
  assertEventCount(events, "artifact_created", 1);
  assertEventCount(events, "clarification_shown", 0);

  const match = onlyEvent(events, "match_completed");
  assert.equal(match.storyRole, "initial");
  assert.equal(match.disposition, "close");
  assert.equal(match.confidenceBucket, "high");
  assert.equal(match.matchPath, "rerank");
  assert.equal(match.boundaryOutcome, "not_set");

  assert.deepEqual(
    eventPayload(onlyEvent(events, "artifact_created")),
    artifactCreatedEvent(artifact, "initial"),
    "the committed artifact must own the exact telemetry reduction",
  );
  assertPrivacySafe(events, [
    HAPPY_DISCLOSURE,
    context.userId,
    context.ipHash,
    session.sessionId,
    session.figureKey,
    session.stageId,
    artifactId,
    artifact.storySpecId,
    artifact.contentHash,
  ]);
}

async function checkRateLimitProducerAndPrecedence(): Promise<void> {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const userId = `telemetry-producer-limited-user-${suffix}`;
  const ipHash = `telemetry-producer-limited-ip-${suffix}`;

  for (let index = 0; index < MATCH_LIMITS.userPerHour; index += 1) {
    assert.equal(
      await consumeMatchRateLimit(userId, `telemetry-user-warm-ip-${suffix}`),
      true,
      "user warm-up request must remain in budget",
    );
  }
  for (let index = 0; index < MATCH_LIMITS.ipPerHour; index += 1) {
    assert.equal(
      await consumeMatchRateLimit(
        `telemetry-ip-warm-user-${suffix}-${index}`,
        ipHash,
      ),
      true,
      "IP warm-up request must remain in budget",
    );
  }

  const beforeIds = new Set(listMemoryProductEvents().map((event) => event.eventId));
  const flowId = createTelemetryFlowId();
  const denied = await handleIntake(
    { age: 28, feeling: HAPPY_DISCLOSURE },
    { userId, ipHash, telemetryFlowId: flowId },
  );
  assert("rateLimited" in denied, "over-budget intake must be refused");

  const delta = listMemoryProductEvents().filter(
    (event) => !beforeIds.has(event.eventId),
  );
  const denials = delta.filter(
    (event): event is Extract<ProductEventRecord, { event: "rate_limited" }> =>
      event.event === "rate_limited",
  );
  assert.equal(denials.length, 1, "one limiter decision must emit one occurrence");
  assert.equal(denials[0].flowId, null, "limiter events must remain unlinkable");
  assert.equal(denials[0].operation, "intake");
  assert.equal(
    denials[0].limitScope,
    "user",
    "user scope must win deterministically when both user and IP are over",
  );

  const linked = eventsForFlow(flowId);
  assertEventCount(linked, "intake_submitted", 1);
  assertEventCount(linked, "match_completed", 0);
  assertEventCount(linked, "artifact_created", 0);
  assertPrivacySafe(delta, [HAPPY_DISCLOSURE, userId, ipHash]);
}

function matchResult(
  confidence: IntakeMatchResult["confidence"],
  chosenBy: IntakeMatchResult["chosenBy"],
  ageFallback: boolean,
  framing: IntakeMatchResult["framing"],
  retrievalMode: IntakeMatchResult["retrievalMode"] = "keyword",
): IntakeMatchResult {
  return {
    figureKey: "mapping-fixture",
    stageId: "mapping-stage",
    framing,
    confidence,
    chosenBy,
    ageFallback,
    retrievalMode,
  };
}

function artifactCase(
  name: string,
  mode: StoryArtifact["composition"]["mode"],
  fallbackReason: StoryArtifact["composition"]["fallbackReason"],
  attemptCount: number,
  attemptBucket: Extract<
    ProductEvent,
    { event: "artifact_created" }
  >["attemptBucket"],
  storyRole: StoryRole = "initial",
): {
  name: string;
  composition: StoryArtifact["composition"];
  storyRole: StoryRole;
  expected: ProductEvent;
} {
  return {
    name,
    composition: {
      mode,
      ...(fallbackReason ? { fallbackReason } : {}),
      attemptCount,
    },
    storyRole,
    expected: {
      event: "artifact_created",
      recipeId,
      storyRole,
      compositionMode: mode,
      fallbackReason: fallbackReason ?? "none",
      attemptBucket,
    },
  };
}

function artifactFixture(
  composition: StoryArtifact["composition"],
  fixtureRecipeId: string = recipeId,
  retrievalMode: StoryArtifact["recipe"]["match"]["retrievalMode"] = "keyword",
  matchConfigVersion: string = APPROVED_PRODUCTION_RECIPE.matchConfigVersion,
): StoryArtifact {
  return {
    recipe: {
      match: {
        recipeId: fixtureRecipeId,
        matchConfigVersion,
        retrievalMode,
      },
    },
    composition,
  } as unknown as StoryArtifact;
}

function artifactWithDifferentTelemetryDimensions(
  artifact: StoryArtifact,
): StoryArtifact {
  const composition: StoryArtifact["composition"] =
    artifact.composition.mode === "hybrid"
      ? {
          mode: "hybrid",
          attemptCount: artifact.composition.attemptCount === 1 ? 2 : 1,
        }
      : artifact.composition.attemptCount === 0
        ? {
            mode: "canonical_fallback",
            fallbackReason:
              artifact.composition.fallbackReason === "canonical_only"
                ? "validator_rejected"
                : "canonical_only",
            attemptCount: 0,
          }
        : {
            mode: "canonical_fallback",
            fallbackReason:
              artifact.composition.fallbackReason === "provider_error"
                ? "provider_timeout"
                : "provider_error",
            attemptCount: artifact.composition.attemptCount,
          };
  return { ...structuredClone(artifact), composition };
}

function eventsForFlow(
  flowId: TelemetryFlowId,
): ReadonlyArray<Readonly<ProductEventRecord>> {
  return listMemoryProductEvents().filter((event) => event.flowId === flowId);
}

function assertEventCount(
  events: ReadonlyArray<Readonly<ProductEventRecord>>,
  name: ProductEvent["event"],
  expected: number,
): void {
  assert.equal(
    events.filter((event) => event.event === name).length,
    expected,
    `${name} count`,
  );
}

function onlyEvent<Name extends ProductEvent["event"]>(
  events: ReadonlyArray<Readonly<ProductEventRecord>>,
  name: Name,
): Readonly<Extract<ProductEventRecord, { event: Name }>> {
  const matching = events.filter(
    (event): event is Readonly<Extract<ProductEventRecord, { event: Name }>> =>
      event.event === name,
  );
  assert.equal(matching.length, 1, `${name} must be a singleton`);
  return matching[0];
}

function eventPayload(record: Readonly<ProductEventRecord>): ProductEvent {
  const { eventId, schemaVersion, flowId, occurredAt, expiresAt, ...event } = record;
  void eventId;
  void schemaVersion;
  void flowId;
  void occurredAt;
  void expiresAt;
  return event as ProductEvent;
}

const FORBIDDEN_TELEMETRY_KEYS = new Set([
  "age",
  "feeling",
  "figure",
  "figureKey",
  "figure_key",
  "stageId",
  "stage_id",
  "sessionId",
  "session_id",
  "artifactId",
  "artifact_id",
  "storySpecId",
  "story_spec_id",
  "displayName",
  "display_name",
  "text",
  "biographicalFacts",
  "biographical_facts",
  "contentHash",
  "content_hash",
]);

function assertPrivacySafe(
  events: ReadonlyArray<Readonly<ProductEventRecord>>,
  forbiddenValues: readonly string[],
): void {
  for (const event of events) {
    for (const [key, value] of Object.entries(event)) {
      assert.equal(
        FORBIDDEN_TELEMETRY_KEYS.has(key),
        false,
        `telemetry exposed forbidden field ${key}`,
      );
      assert(
        value === null || typeof value !== "object",
        `telemetry field ${key} must remain scalar`,
      );
    }
  }
  const serialized = JSON.stringify(events);
  for (const value of forbiddenValues) {
    assert.equal(
      serialized.includes(value),
      false,
      "telemetry copied a forbidden disclosure or domain identifier",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
