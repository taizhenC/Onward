import "./_smoke-bootstrap";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { POST as feedbackPost } from "../app/api/story-feedback/route";
import { POST as alternatePost } from "../app/api/story-feedback/alternate/route";
import { POST as capabilityPost } from "../app/api/story-feedback/alternate/capability/route";
import { LOCAL_DEV_USER_ID } from "../lib/auth";
import {
  _listAlternateStoryFlows,
} from "../lib/alternate-story-flow";
import {
  claimMemoryAlternateStoryFlow,
  completeMemoryAlternateStoryUnavailable,
  releaseMemoryAlternateStoryFlow,
} from "../lib/alternate-story-store-memory";
import {
  prepareAlternateRequestedTelemetry,
  prepareAlternateResolvedTelemetry,
} from "../lib/alternate-story-telemetry";
import { createAlternateStory } from "../lib/alternate-story";
import {
  parseAlternateCapabilityRequest,
  parseAlternateStoryRequest,
} from "../lib/alternate-story-request";
import { persistenceMode } from "../lib/persistence";
import { readStrongSecret } from "../lib/secret-config";
import {
  ALTERNATE_STORY_MAX_ATTEMPTS,
  ALTERNATE_STORY_POLICY_VERSION,
  STORY_REQUEST_CONTEXT_VERSION,
  type AlternateStoryCapability,
} from "../lib/alternate-story-types";
import { FIGURE_STAGES } from "../lib/figures-data";
import { handleIntake } from "../lib/intake";
import { APPROVED_PRODUCTION_RECIPE } from "../lib/match-config";
import { createTelemetryFlowId, recordProductEvent } from "../lib/telemetry";
import { resolveOwnedTelemetryFlowForSession } from "../lib/telemetry-flow-binding";
import { registerMemoryTelemetryFlow } from "../lib/telemetry-flow-binding-memory";
import { listMemoryProductEvents } from "../lib/telemetry-store-memory";
import { createResonanceBrief } from "../lib/resonance-brief";
import {
  _listResonanceFeedback,
  getResonanceFeedbackPresentation,
} from "../lib/resonance-feedback";
import {
  createSession,
  getSession,
  updateSession,
} from "../lib/session";
import { composeCanonicalStoryArtifact } from "../lib/story-artifact";
import { getOwnedStoryArtifact } from "../lib/story-artifacts";
import {
  storyProfileAllowed,
  type StoryBoundaries,
} from "../lib/story-boundaries";
import { buildDraftStorySpec } from "../lib/story-spec";
import {
  createStoryRequestContext,
  parseStoryRequestContext,
} from "../lib/story-request-context";
import { storySpecStageKey } from "../lib/story-spec-repository";
import type { FigureStageRow, MatchRecipe } from "../lib/types";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";
process.env.RETRIEVAL_MODE = "keyword";

const PRIVATE_CANARY =
  "My private ultraviolet astrolabe feels rejected and unseen after years of trying.";
const BOUNDARIES: StoryBoundaries = {
  maxIntensity: "direct",
  excludedFlags: ["abuse_or_violence"],
};
const recipe: MatchRecipe = {
  recipeId: APPROVED_PRODUCTION_RECIPE.recipeId,
  matchConfigVersion: APPROVED_PRODUCTION_RECIPE.matchConfigVersion,
  crisisRegexVersion: "test",
  llmProvider: "stub",
  rerankModelId: "stub",
  proseModelId: "stub",
  embeddingModelId: "stub",
  retrievalMode: "keyword",
};

type RootFixture = Awaited<ReturnType<typeof makeRoot>>;

async function main(): Promise<void> {
  const failures: string[] = [];
  checkClosedContracts(failures);
  await checkIntakeValidationParity(failures);
  const happy = await checkHappyConcurrentFlow(failures);
  await checkKillSwitchReadyProjection(happy, failures);
  await checkTerminalAndRetryPolicies(failures);
  await checkLeaseHydrationAndExpiryParity(failures);
  await checkEligibilityFailures(failures);
  await checkSourceCascade(happy, failures);
  checkStaticContracts(failures);

  console.log("Onward one-use alternate story validator");
  console.log("========================================");
  if (failures.length > 0) {
    failures.forEach((failure) => console.error(`FAIL ${failure}`));
    console.error(`${failures.length} alternate-story failure(s).`);
    process.exit(1);
  }
  console.log("PASS exact capability request contains no disclosure or controls");
  console.log("PASS original context is reused once without resetting retention");
  console.log("PASS exact prior stage and original boundaries remain hard exclusions");
  console.log("PASS concurrent clicks converge on one partial alternate artifact");
  console.log("PASS empty/low coverage stops honestly; operational failures retry twice");
  console.log("PASS live second leases hydrate before exhaustion; claim TTL is start-by");
  console.log("PASS no public rate unit, alternate chain, or sensitive flow payload");
  console.log("PASS internal alternate cleanup preserves root telemetry; owner deletion is separately gated");
}

async function checkIntakeValidationParity(failures: string[]): Promise<void> {
  const previous = process.env.STORY_CREATION_ENABLED;
  process.env.STORY_CREATION_ENABLED = "false";
  try {
    const fractional = await handleIntake(
      { age: 25.5, feeling: "I feel uncertain about my direction." },
      {
        userId: LOCAL_DEV_USER_ID,
        ipHash: "parity-fractional",
        telemetryFlowId: createTelemetryFlowId(),
      },
    );
    const shortAfterNormalization = await handleIntake(
      { age: 25, feeling: "e\u0301".repeat(5) },
      {
        userId: LOCAL_DEV_USER_ID,
        ipHash: "parity-unicode-short",
        telemetryFlowId: createTelemetryFlowId(),
      },
    );
    const validAfterNormalization = await handleIntake(
      { age: 25, feeling: "e\u0301".repeat(10) },
      {
        userId: LOCAL_DEV_USER_ID,
        ipHash: "parity-unicode-valid",
        telemetryFlowId: createTelemetryFlowId(),
      },
    );
    if (
      !("error" in fractional) ||
      !("error" in shortAfterNormalization) ||
      !("temporarilyUnavailable" in validAfterNormalization)
    ) {
      failures.push(
        "intake validation did not align integer and NFC code-point lengths before provider work",
      );
    }
  } finally {
    if (previous === undefined) delete process.env.STORY_CREATION_ENABLED;
    else process.env.STORY_CREATION_ENABLED = previous;
  }
}

async function checkLeaseHydrationAndExpiryParity(
  failures: string[],
): Promise<void> {
  const activeSecond = await makeRoot();
  await negativeCapability(activeSecond, failures);
  const activeFlow = globalThis.__onwardAlternateStoryFlows?.get(
    activeSecond.sessionId,
  );
  if (!activeFlow) {
    failures.push("active-second-attempt fixture did not create a flow");
    return;
  }
  const identity = {
    userId: activeFlow.userId,
    sourceSessionId: activeFlow.sourceSessionId,
    sourceArtifactId: activeFlow.sourceArtifactId,
    tokenHash: activeFlow.tokenHash,
    policyVersion: activeFlow.policyVersion,
  };
  const firstLeaseId = "1".repeat(32);
  const secondLeaseId = "2".repeat(32);
  const firstClaim = claimMemoryAlternateStoryFlow({
    ...identity,
    leaseId: firstLeaseId,
    leaseExpiresAt: Date.now() + 120_000,
    ...(await alternateClaimTelemetry(
      identity.userId,
      identity.sourceSessionId,
    )),
  });
  releaseMemoryAlternateStoryFlow({
    userId: identity.userId,
    sourceSessionId: identity.sourceSessionId,
    leaseId: firstLeaseId,
    telemetry: await alternateResolutionCapture(
      identity.userId,
      identity.sourceSessionId,
      "failed",
    ),
  });
  activeFlow.nextAttemptAt = Date.now() - 1;
  const secondClaim = claimMemoryAlternateStoryFlow({
    ...identity,
    leaseId: secondLeaseId,
    leaseExpiresAt: Date.now() + 120_000,
    ...(await alternateClaimTelemetry(
      identity.userId,
      identity.sourceSessionId,
    )),
  });
  const hydrated = await requestCapability(activeSecond.sessionId);
  const hydratedBody = await hydrated.json();
  if (
    firstClaim.status !== "claimed" ||
    secondClaim.status !== "claimed" ||
    hydrated.status !== 200 ||
    !isRecord(hydratedBody) ||
    !isRecord(hydratedBody.alternate) ||
    hydratedBody.alternate.status !== "preparing"
  ) {
    failures.push("a live second attempt hydrated as exhausted or unavailable");
  }
  activeFlow.leaseExpiresAt = Date.now() - 1;

  const startBy = await makeRoot();
  await negativeCapability(startBy, failures);
  const startByFlow = globalThis.__onwardAlternateStoryFlows?.get(
    startBy.sessionId,
  );
  if (!startByFlow) {
    failures.push("start-by TTL fixture did not create a flow");
    return;
  }
  const leaseId = "3".repeat(32);
  const claim = claimMemoryAlternateStoryFlow({
    userId: startByFlow.userId,
    sourceSessionId: startByFlow.sourceSessionId,
    sourceArtifactId: startByFlow.sourceArtifactId,
    tokenHash: startByFlow.tokenHash,
    policyVersion: startByFlow.policyVersion,
    leaseId,
    leaseExpiresAt: Date.now() + 120_000,
    ...(await alternateClaimTelemetry(
      startByFlow.userId,
      startByFlow.sourceSessionId,
    )),
  });
  startByFlow.expiresAt = Date.now() - 1;
  const activeAfterStartBy = await requestCapability(startBy.sessionId);
  const activeAfterStartByBody = await activeAfterStartBy.json();
  const completed = completeMemoryAlternateStoryUnavailable({
    userId: startByFlow.userId,
    sourceSessionId: startByFlow.sourceSessionId,
    leaseId,
    telemetry: await alternateResolutionCapture(
      startByFlow.userId,
      startByFlow.sourceSessionId,
      "unavailable",
    ),
  });
  if (
    claim.status !== "claimed" ||
    activeAfterStartBy.status !== 200 ||
    !isRecord(activeAfterStartByBody) ||
    !isRecord(activeAfterStartByBody.alternate) ||
    activeAfterStartByBody.alternate.status !== "preparing" ||
    !completed
  ) {
    failures.push(
      "memory did not honor the documented start-by capability TTL during a live lease",
    );
  }

  const retention = await makeRoot();
  await negativeCapability(retention, failures);
  const retentionFlow = globalThis.__onwardAlternateStoryFlows?.get(
    retention.sessionId,
  );
  if (!retentionFlow) {
    failures.push("retention-deadline fixture did not create a flow");
    return;
  }
  const retentionLeaseId = "4".repeat(32);
  const retentionClaim = claimMemoryAlternateStoryFlow({
    userId: retentionFlow.userId,
    sourceSessionId: retentionFlow.sourceSessionId,
    sourceArtifactId: retentionFlow.sourceArtifactId,
    tokenHash: retentionFlow.tokenHash,
    policyVersion: retentionFlow.policyVersion,
    leaseId: retentionLeaseId,
    leaseExpiresAt: Date.now() + 120_000,
    ...(await alternateClaimTelemetry(
      retentionFlow.userId,
      retentionFlow.sourceSessionId,
    )),
  });
  retentionFlow.contextExpiresAt = Date.now() - 1;
  const retentionCompleted = completeMemoryAlternateStoryUnavailable({
    userId: retentionFlow.userId,
    sourceSessionId: retentionFlow.sourceSessionId,
    leaseId: retentionLeaseId,
    telemetry: await alternateResolutionCapture(
      retentionFlow.userId,
      retentionFlow.sourceSessionId,
      "unavailable",
    ),
  });
  if (retentionClaim.status !== "claimed" || retentionCompleted) {
    failures.push(
      "memory terminalized a claim after the original disclosure deadline",
    );
  }
}

function checkClosedContracts(failures: string[]): void {
  const valid = {
    sessionId: "a".repeat(32),
    token: "A".repeat(43),
  };
  if ("error" in parseAlternateStoryRequest(valid)) {
    failures.push("exact alternate request was rejected");
  }
  if (
    "error" in parseAlternateCapabilityRequest({ sessionId: valid.sessionId }) ||
    !("error" in
      parseAlternateCapabilityRequest({
        sessionId: valid.sessionId,
        feeling: PRIVATE_CANARY,
      }))
  ) {
    failures.push("alternate capability refresh parser is not exact and string-hostile");
  }
  const invalid = [
    null,
    [],
    { ...valid, feeling: PRIVATE_CANARY },
    { ...valid, age: 30 },
    { ...valid, boundaries: BOUNDARIES },
    { ...valid, clarification: "uncertainty" },
    { ...valid, stageId: "prior" },
    { ...valid, reason: "wrong_feeling" },
    { ...valid, token: "short" },
    { ...valid, sessionId: "A".repeat(32) },
  ];
  if (invalid.some((value) => !("error" in parseAlternateStoryRequest(value)))) {
    failures.push("alternate parser accepted extra, sensitive, or malformed fields");
  }

  const secretNames = [
    "ALTERNATE_STORY_TOKEN_SECRET",
    "MATCH_RECOVERY_TOKEN_SECRET",
    "IP_HASH_SALT",
  ] as const;
  const originalSecrets = new Map(
    secretNames.map((name) => [name, process.env[name]] as const),
  );
  try {
    secretNames.forEach((name) => delete process.env[name]);
    process.env.ALTERNATE_STORY_TOKEN_SECRET = "weak";
    let weakRejected = false;
    try {
      readStrongSecret(secretNames);
    } catch {
      weakRejected = true;
    }
    process.env.ALTERNATE_STORY_TOKEN_SECRET = "   ";
    let whitespaceRejected = false;
    try {
      readStrongSecret(secretNames);
    } catch {
      whitespaceRejected = true;
    }
    process.env.ALTERNATE_STORY_TOKEN_SECRET = "a".repeat(64);
    if (
      !weakRejected ||
      !whitespaceRejected ||
      readStrongSecret(secretNames) !== "a".repeat(64)
    ) {
      failures.push("HMAC and IP-hash secret configuration accepted a weak value");
    }
  } finally {
    for (const name of secretNames) {
      const original = originalSecrets.get(name);
      if (original === undefined) delete process.env[name];
      else process.env[name] = original;
    }
  }

  const context = createStoryRequestContext({
    boundaries: {
      maxIntensity: "moderate",
      excludedFlags: ["serious_illness", "death_or_grief"],
    },
    clarification: "uncertainty",
  });
  const parsed = parseStoryRequestContext(context);
  if (
    !parsed ||
    parsed.schemaVersion !== STORY_REQUEST_CONTEXT_VERSION ||
    parsed.boundaries?.excludedFlags.join(",") !==
      "death_or_grief,serious_illness" ||
    parsed.clarification !== "uncertainty" ||
    parseStoryRequestContext(null) !== null ||
    parseStoryRequestContext({ ...context, extra: PRIVATE_CANARY }) !== null
  ) {
    failures.push("closed request context did not preserve null/legacy distinction");
  }

  const originalNodeEnv = process.env.NODE_ENV;
  const originalPersistence = process.env.PERSISTENCE;
  const originalOverride = process.env.ONWARD_ALLOW_MEMORY_IN_PRODUCTION;
  const originalLifecycle = process.env.npm_lifecycle_event;
  const mutableEnv = process.env as Record<string, string | undefined>;
  try {
    mutableEnv.NODE_ENV = "production";
    process.env.PERSISTENCE = "memory";
    delete process.env.ONWARD_ALLOW_MEMORY_IN_PRODUCTION;
    let rejected = false;
    try {
      persistenceMode();
    } catch {
      rejected = true;
    }
    process.env.ONWARD_ALLOW_MEMORY_IN_PRODUCTION = "true";
    let runtimeOverrideRejected = false;
    try {
      persistenceMode();
    } catch {
      runtimeOverrideRejected = true;
    }
    process.env.npm_lifecycle_event = "build";
    if (
      !rejected ||
      !runtimeOverrideRejected ||
      persistenceMode() !== "memory"
    ) {
      failures.push(
        "production persistence did not restrict the memory override to build processes",
      );
    }
  } finally {
    mutableEnv.NODE_ENV = originalNodeEnv;
    process.env.PERSISTENCE = originalPersistence;
    if (originalOverride === undefined) {
      delete process.env.ONWARD_ALLOW_MEMORY_IN_PRODUCTION;
    } else {
      process.env.ONWARD_ALLOW_MEMORY_IN_PRODUCTION = originalOverride;
    }
    if (originalLifecycle === undefined) {
      delete process.env.npm_lifecycle_event;
    } else {
      process.env.npm_lifecycle_event = originalLifecycle;
    }
  }
}

async function checkHappyConcurrentFlow(
  failures: string[],
): Promise<
  RootFixture & {
    alternateSessionId: string;
    alternateArtifactId: string;
    alternateToken: string;
  }
> {
  const sourceStage = chooseNonRejectionSource();
  const root = await makeRoot({
    stage: sourceStage,
    boundaries: BOUNDARIES,
    clarification: "uncertainty",
  });
  const feedback = await requestFeedback({
    sessionId: root.sessionId,
    verdict: "not_close",
    reason: "wrong_situation",
  });
  const capability = await readCapability(feedback, failures, "happy flow");
  const beforeRate = rateSnapshot();
  const requests = await Promise.all(
    Array.from({ length: 12 }, () =>
      requestAlternate(root.sessionId, capability.token),
    ),
  );
  if (
    requests.some((response) => ![200, 202].includes(response.status)) ||
    !requests.some((response) => response.status === 200)
  ) {
    failures.push("concurrent alternate requests did not resolve as ready/preparing");
  }
  const retryBodies = await Promise.all(
    Array.from({ length: 4 }, async () => {
      const response = await requestAlternate(root.sessionId, capability.token);
      return { status: response.status, body: await response.json() };
    }),
  );
  const sessionIds = new Set(
    retryBodies.map(({ body }) =>
      isRecord(body) && typeof body.sessionId === "string" ? body.sessionId : "",
    ),
  );
  sessionIds.delete("");
  const alternateSessionId = [...sessionIds][0] ?? "";
  if (
    retryBodies.some(({ status, body }) =>
      status !== 200 || !isRecord(body) || body.status !== "ready"
    ) ||
    sessionIds.size !== 1
  ) {
    failures.push(
      `completed alternate retries did not return one stable session: ${JSON.stringify(retryBodies)}`,
    );
  }

  const source = await getSession(root.sessionId);
  const alternate = await getSession(alternateSessionId);
  const artifact =
    alternate?.storyArtifactId
      ? await getOwnedStoryArtifact(
          alternate.storyArtifactId,
          LOCAL_DEV_USER_ID,
          alternate.sessionId,
        )
      : null;
  const flow = _listAlternateStoryFlows().find(
    (item) => item.sourceSessionId === root.sessionId,
  );
  const priorKey = storySpecStageKey(root.stage.figureKey, root.stage.stageId);
  const alternateKey = alternate
    ? storySpecStageKey(alternate.figureKey, alternate.stageId)
    : priorKey;
  const rootTelemetry = await resolveOwnedTelemetryFlowForSession(
    root.sessionId,
    LOCAL_DEV_USER_ID,
  );
  const alternateTelemetry = await resolveOwnedTelemetryFlowForSession(
    alternateSessionId,
    LOCAL_DEV_USER_ID,
  );
  if (
    !source ||
    !alternate ||
    !artifact ||
    alternateKey === priorKey ||
    alternate.alternateOfSessionId !== root.sessionId ||
    alternate.framing !== "partial" ||
    artifact.framing !== "partial" ||
    alternate.feeling !== null ||
    alternate.age !== null ||
    alternate.storyRequestContext !== null ||
    alternate.disclosureExpiresAt !== source.disclosureExpiresAt ||
    artifact.recipe.match.alternateStoryPolicyVersion !==
      ALTERNATE_STORY_POLICY_VERSION ||
    !storyProfileAllowed(artifact.contentProfile, BOUNDARIES) ||
    flow?.status !== "ready" ||
    flow.attemptCount !== 1 ||
    flow.resultSessionId !== alternateSessionId ||
    !rootTelemetry ||
    alternateTelemetry?.flowId !== rootTelemetry.flowId ||
    alternateTelemetry.rootSessionId !== root.sessionId
  ) {
    failures.push(
      `alternate lineage, partial framing, boundaries, or flow was invalid: ${JSON.stringify({
        source: Boolean(source),
        alternate: alternate
          ? {
              id: alternate.sessionId,
              key: alternateKey,
              source: alternate.alternateOfSessionId,
              framing: alternate.framing,
              feeling: alternate.feeling,
              context: alternate.storyRequestContext,
              sameExpiry: alternate.disclosureExpiresAt === source?.disclosureExpiresAt,
            }
          : null,
        artifact: artifact
          ? {
              id: artifact.artifactId,
              framing: artifact.framing,
              policy: artifact.recipe.match.alternateStoryPolicyVersion,
              allowed: storyProfileAllowed(artifact.contentProfile, BOUNDARIES),
            }
          : null,
        flow,
      })}`,
    );
  }
  if (rateSnapshot() !== beforeRate) {
    failures.push("alternate generation consumed the public match rate counter");
  }
  const safeProjection = JSON.stringify({ alternate, artifact, flow });
  if (
    safeProjection.includes(PRIVATE_CANARY) ||
    safeProjection.includes('"excludedFlags"') ||
    countOccurrences(JSON.stringify([...globalThis.__onwardSessions!.values()]), PRIVATE_CANARY) !== 1
  ) {
    failures.push("alternate/flow duplicated disclosure or private request controls");
  }
  const hydratedRoot = await getResonanceFeedbackPresentation({
    userId: LOCAL_DEV_USER_ID,
    session: source!,
    artifact: root.artifact,
  });
  if (
    hydratedRoot.status !== "not_close" ||
    hydratedRoot.alternate.status !== "ready" ||
    hydratedRoot.alternate.sessionId !== alternateSessionId
  ) {
    failures.push("refresh projection did not restore the ready alternate outcome");
  }
  const hydratedResponse = await requestCapability(root.sessionId);
  const hydratedBody = await hydratedResponse.json();
  if (
    hydratedResponse.status !== 200 ||
    !isRecord(hydratedBody) ||
    !isRecord(hydratedBody.alternate) ||
    hydratedBody.alternate.status !== "ready" ||
    hydratedBody.alternate.sessionId !== alternateSessionId
  ) {
    failures.push("capability refresh endpoint did not restore the ready alternate");
  }

  await updateSession(alternateSessionId, {
    nextBeatIndex: artifact?.beats.length ?? 7,
    nextChunkIndex: 0,
  });
  const alternateFeedback = await requestFeedback({
    sessionId: alternateSessionId,
    verdict: "not_close",
    reason: "wrong_feeling",
  });
  const alternateFeedbackBody = await alternateFeedback.json();
  if (
    alternateFeedback.status !== 202 ||
    !isRecord(alternateFeedbackBody) ||
    !isRecord(alternateFeedbackBody.alternate) ||
    alternateFeedbackBody.alternate.status !== "not_offered"
  ) {
    failures.push(
      `an alternate story offered an alternate-of-alternate chain: ${alternateFeedback.status} ${JSON.stringify(alternateFeedbackBody)}`,
    );
  }
  const refreshedAlternate = await getSession(alternateSessionId);
  const hydratedAlternate =
    refreshedAlternate && artifact
      ? await getResonanceFeedbackPresentation({
          userId: LOCAL_DEV_USER_ID,
          session: refreshedAlternate,
          artifact,
        })
      : null;
  if (
    hydratedAlternate?.status !== "not_close" ||
    hydratedAlternate.alternate.status !== "not_offered"
  ) {
    failures.push("refresh projection reopened an alternate chain");
  }

  return {
    ...root,
    alternateSessionId,
    alternateArtifactId: artifact?.artifactId ?? "",
    alternateToken: capability.token,
  };
}

async function checkKillSwitchReadyProjection(
  happy: RootFixture & {
    alternateSessionId: string;
    alternateToken: string;
  },
  failures: string[],
): Promise<void> {
  const previous = process.env.STORY_CREATION_ENABLED;
  process.env.STORY_CREATION_ENABLED = "false";
  try {
    const projectionResponse = await requestCapability(happy.sessionId);
    const projectionBody = await projectionResponse.json();
    const postResponse = await requestAlternate(
      happy.sessionId,
      happy.alternateToken,
    );
    const postBody = await postResponse.json();
    if (
      projectionResponse.status !== 200 ||
      !isRecord(projectionBody) ||
      !isRecord(projectionBody.alternate) ||
      projectionBody.alternate.status !== "ready" ||
      projectionBody.alternate.sessionId !== happy.alternateSessionId ||
      postResponse.status !== 200 ||
      !isRecord(postBody) ||
      postBody.status !== "ready" ||
      postBody.sessionId !== happy.alternateSessionId
    ) {
      failures.push("story kill switch hid an already-completed alternate");
    }
  } finally {
    if (previous === undefined) delete process.env.STORY_CREATION_ENABLED;
    else process.env.STORY_CREATION_ENABLED = previous;
  }
}

async function checkTerminalAndRetryPolicies(failures: string[]): Promise<void> {
  const killSwitch = await makeRoot();
  const previousCreationFlag = process.env.STORY_CREATION_ENABLED;
  process.env.STORY_CREATION_ENABLED = "false";
  try {
    const response = await requestFeedback({
      sessionId: killSwitch.sessionId,
      verdict: "not_close",
      reason: "other",
    });
    const body = await response.json();
    if (
      response.status !== 202 ||
      !isRecord(body) ||
      !isRecord(body.alternate) ||
      body.alternate.status !== "temporarily_unavailable" ||
      typeof body.alternate.retryAfterMs !== "number" ||
      globalThis.__onwardAlternateStoryFlows?.has(killSwitch.sessionId)
    ) {
      failures.push("story kill switch created or exposed an alternate capability window");
    }
  } finally {
    if (previousCreationFlag === undefined) {
      delete process.env.STORY_CREATION_ENABLED;
    } else {
      process.env.STORY_CREATION_ENABLED = previousCreationFlag;
    }
  }

  const noEligible = await makeRoot({ clarification: "uncertainty" });
  const noEligibleCapability = await negativeCapability(noEligible, failures);
  const noEligibleResult = await createAlternateStory(
    { sessionId: noEligible.sessionId, token: noEligibleCapability.token },
    LOCAL_DEV_USER_ID,
    { loadCatalog: async () => ({ status: "no_eligible" }) },
  );
  if (noEligibleResult.status !== "unavailable") {
    failures.push("empty eligible catalog did not stop with an honest unavailable result");
  }

  const low = await makeRoot({
    boundaries: BOUNDARIES,
    clarification: "uncertainty",
  });
  const lowCapability = await negativeCapability(low, failures);
  let observedClarification: unknown;
  let sourceWasExcluded = false;
  let allProfilesAllowed = false;
  const lowResult = await createAlternateStory(
    { sessionId: low.sessionId, token: lowCapability.token },
    LOCAL_DEV_USER_ID,
    {
      loadCatalog: async (input) => {
        const { loadEligibleStoryCatalog } = await import("../lib/story-generation");
        const result = await loadEligibleStoryCatalog(input);
        if (result.status === "ready") {
          sourceWasExcluded = !result.catalog.has(
            storySpecStageKey(low.stage.figureKey, low.stage.stageId),
          );
          allProfilesAllowed = [...result.catalog.values()].every((spec) =>
            storyProfileAllowed(spec.contentProfile, BOUNDARIES),
          );
        }
        return result;
      },
      match: async (input) => {
        observedClarification = input.clarification;
        const key = [...(input.eligibleStageKeys ?? [])][0];
        const [figureKey, stageId] = key.split("\u0000");
        return {
          figureKey,
          stageId,
          framing: "partial",
          confidence: "low",
          chosenBy: "rerank",
          ageFallback: false,
          retrievalMode: "keyword",
        };
      },
    },
  );
  if (
    lowResult.status !== "unavailable" ||
    observedClarification !== "uncertainty" ||
    !sourceWasExcluded ||
    !allProfilesAllowed
  ) {
    failures.push("low-confidence alternate relaxed context or failed to stop honestly");
  }

  const beforeMatch = await makeRoot();
  const beforeMatchCapability = await negativeCapability(beforeMatch, failures);
  let matcherCalled = false;
  const beforeMatchResult = await createAlternateStory(
    { sessionId: beforeMatch.sessionId, token: beforeMatchCapability.token },
    LOCAL_DEV_USER_ID,
    {
      loadCatalog: async (input) => {
        const { loadEligibleStoryCatalog } = await import("../lib/story-generation");
        const result = await loadEligibleStoryCatalog(input);
        const row = globalThis.__onwardSessions?.get(beforeMatch.sessionId);
        if (row) row.disclosureExpiresAt = Date.now() - 1;
        return result;
      },
      match: async () => {
        matcherCalled = true;
        throw new Error("matcher must not receive expired disclosure");
      },
    },
  );
  if (beforeMatchResult.status !== "expired" || matcherCalled) {
    failures.push("disclosure expiry was not rechecked immediately before matching");
  }

  const beforeComposer = await makeRoot();
  const beforeComposerCapability = await negativeCapability(
    beforeComposer,
    failures,
  );
  let composerCalled = false;
  const beforeComposerResult = await createAlternateStory(
    { sessionId: beforeComposer.sessionId, token: beforeComposerCapability.token },
    LOCAL_DEV_USER_ID,
    {
      match: async (input) => {
        const key = [...(input.eligibleStageKeys ?? [])][0];
        const [figureKey, stageId] = key.split("\u0000");
        const row = globalThis.__onwardSessions?.get(beforeComposer.sessionId);
        if (row) row.disclosureExpiresAt = Date.now() - 1;
        return {
          figureKey,
          stageId,
          framing: "partial",
          confidence: "high",
          chosenBy: "rerank",
          ageFallback: false,
          retrievalMode: "keyword",
        };
      },
      prepare: async () => {
        composerCalled = true;
        throw new Error("composer must not receive expired disclosure");
      },
    },
  );
  if (beforeComposerResult.status !== "expired" || composerCalled) {
    failures.push("disclosure expiry was not rechecked immediately before composition");
  }

  const staleLease = await makeRoot();
  const staleCapability = await negativeCapability(staleLease, failures);
  const staleResult = await createAlternateStory(
    { sessionId: staleLease.sessionId, token: staleCapability.token },
    LOCAL_DEV_USER_ID,
    {
      prepare: async (input) => {
        const { prepareStory } = await import("../lib/story-generation");
        const prepared = await prepareStory(input);
        const flow = globalThis.__onwardAlternateStoryFlows?.get(
          staleLease.sessionId,
        );
        if (flow) flow.leaseExpiresAt = Date.now() - 1;
        return prepared;
      },
    },
  );
  if (
    staleResult.status !== "temporarily_unavailable" ||
    [...(globalThis.__onwardSessions?.values() ?? [])].some(
      (session) => session.alternateOfSessionId === staleLease.sessionId,
    )
  ) {
    failures.push("an expired memory lease persisted an orphan alternate");
  }

  const retry = await makeRoot();
  const retryCapability = await negativeCapability(retry, failures);
  let operationalCalls = 0;
  const dependency = {
    loadCatalog: async () => {
      operationalCalls += 1;
      throw new Error("injected catalog outage");
    },
  };
  const outcomes = [
    await createAlternateStory(
      { sessionId: retry.sessionId, token: retryCapability.token },
      LOCAL_DEV_USER_ID,
      dependency,
    ),
  ];
  const coolingResponse = await requestCapability(retry.sessionId);
  const coolingBody = await coolingResponse.json();
  if (
    coolingResponse.status !== 200 ||
    !isRecord(coolingBody) ||
    !isRecord(coolingBody.alternate) ||
    coolingBody.alternate.status !== "preparing" ||
    typeof coolingBody.alternate.retryAfterMs !== "number"
  ) {
    failures.push("released provider attempt did not hydrate as a timed cooldown");
  }
  outcomes.push(
    await createAlternateStory(
      { sessionId: retry.sessionId, token: retryCapability.token },
      LOCAL_DEV_USER_ID,
      dependency,
    ),
  );
  const retryFlow = globalThis.__onwardAlternateStoryFlows?.get(retry.sessionId);
  if (retryFlow) retryFlow.nextAttemptAt = Date.now() - 1;
  outcomes.push(
    await createAlternateStory(
      { sessionId: retry.sessionId, token: retryCapability.token },
      LOCAL_DEV_USER_ID,
      dependency,
    ),
  );
  const exhaustedResponse = await requestCapability(retry.sessionId);
  const exhaustedBody = await exhaustedResponse.json();
  if (
    exhaustedResponse.status !== 200 ||
    !isRecord(exhaustedBody) ||
    !isRecord(exhaustedBody.alternate) ||
    exhaustedBody.alternate.status !== "exhausted"
  ) {
    failures.push("exhausted alternate flow hydrated as a usable capability");
  }
  outcomes.push(
    await createAlternateStory(
      { sessionId: retry.sessionId, token: retryCapability.token },
      LOCAL_DEV_USER_ID,
      dependency,
    ),
  );
  if (
    outcomes[0]?.status !== "temporarily_unavailable" ||
    outcomes[1]?.status !== "preparing" ||
    outcomes[2]?.status !== "temporarily_unavailable" ||
    outcomes[3]?.status !== "exhausted" ||
    operationalCalls !== ALTERNATE_STORY_MAX_ATTEMPTS
  ) {
    failures.push("operational alternate failures did not preserve the bounded retry policy");
  }
}

async function checkEligibilityFailures(failures: string[]): Promise<void> {
  const positive = await makeRoot();
  const positiveResponse = await requestFeedback({
    sessionId: positive.sessionId,
    verdict: "felt_close",
  });
  const positiveBody = await positiveResponse.json();
  if (
    positiveResponse.status !== 202 ||
    !isRecord(positiveBody) ||
    !isRecord(positiveBody.alternate) ||
    positiveBody.alternate.status !== "not_offered"
  ) {
    failures.push("positive feedback received an alternate capability");
  }
  if ((await requestCapability(positive.sessionId)).status !== 409) {
    failures.push("capability refresh accepted positive feedback");
  }

  const incomplete = await makeRoot({ completed: false });
  const incompleteResponse = await requestFeedback({
    sessionId: incomplete.sessionId,
    verdict: "not_close",
    reason: "other",
  });
  if (incompleteResponse.status !== 409) {
    failures.push("incomplete story received alternate entitlement");
  }

  const legacy = await makeRoot();
  const legacyRow = globalThis.__onwardSessions?.get(legacy.sessionId);
  if (legacyRow) legacyRow.storyRequestContext = null;
  const legacyResponse = await requestFeedback({
    sessionId: legacy.sessionId,
    verdict: "not_close",
    reason: "other",
  });
  const legacyBody = await legacyResponse.json();
  if (
    legacyResponse.status !== 202 ||
    !isRecord(legacyBody) ||
    !isRecord(legacyBody.alternate) ||
    legacyBody.alternate.status !== "not_offered"
  ) {
    failures.push("legacy row without exact context was treated as no-boundary consent");
  }
  const legacyCapability = await requestCapability(legacy.sessionId);
  const legacyCapabilityBody = await legacyCapability.json();
  if (
    legacyCapability.status !== 200 ||
    !isRecord(legacyCapabilityBody) ||
    !isRecord(legacyCapabilityBody.alternate) ||
    legacyCapabilityBody.alternate.status !== "not_offered"
  ) {
    failures.push("legacy capability refresh inferred missing boundaries as consent");
  }

  const expired = await makeRoot();
  const expiredCapability = await negativeCapability(expired, failures);
  const expiredRow = globalThis.__onwardSessions?.get(expired.sessionId);
  if (expiredRow) expiredRow.disclosureExpiresAt = Date.now() - 1;
  const expiredResponse = await requestAlternate(
    expired.sessionId,
    expiredCapability.token,
  );
  if (expiredResponse.status !== 410) {
    failures.push("expired original context did not close the alternate capability");
  }
  const expiredOfferResponse = await requestCapability(expired.sessionId);
  const expiredOfferBody = await expiredOfferResponse.json();
  if (
    expiredOfferResponse.status !== 200 ||
    !isRecord(expiredOfferBody) ||
    !isRecord(expiredOfferBody.alternate) ||
    expiredOfferBody.alternate.status !== "expired"
  ) {
    failures.push("expired context hydrated as content unavailability or eligibility failure");
  }

  const foreign = await makeRoot({ userId: "foreign-alternate-user" });
  const missingResponse = await requestAlternate("0".repeat(32), "A".repeat(43));
  const foreignResponse = await requestAlternate(
    foreign.sessionId,
    "A".repeat(43),
  );
  if (
    missingResponse.status !== 404 ||
    foreignResponse.status !== 404 ||
    (await missingResponse.text()) !== (await foreignResponse.text())
  ) {
    failures.push("missing and foreign alternate targets exposed an ownership oracle");
  }
  const missingCapability = await requestCapability("0".repeat(32));
  const foreignCapability = await requestCapability(foreign.sessionId);
  if (
    missingCapability.status !== 404 ||
    foreignCapability.status !== 404 ||
    (await missingCapability.text()) !== (await foreignCapability.text())
  ) {
    failures.push("capability refresh exposed a missing/foreign ownership oracle");
  }
  const crossOrigin = await requestAlternate(
    positive.sessionId,
    "A".repeat(43),
    "https://attacker.example",
  );
  if (crossOrigin.status !== 403) {
    failures.push("cross-origin alternate request was accepted");
  }
  if (
    (await requestCapability(positive.sessionId, "https://attacker.example"))
      .status !== 403
  ) {
    failures.push("cross-origin alternate capability refresh was accepted");
  }
}

async function checkSourceCascade(
  happy: RootFixture & { alternateSessionId: string; alternateArtifactId: string },
  failures: string[],
): Promise<void> {
  const telemetry = await resolveOwnedTelemetryFlowForSession(
    happy.sessionId,
    LOCAL_DEV_USER_ID,
  );
  if (!telemetry) {
    failures.push("root flow mapping was missing before cascade check");
    return;
  }
  await recordProductEvent({
    flowId: telemetry.flowId,
    event: { event: "source_opened", storyRole: "initial" },
  });
  const alternateRow = globalThis.__onwardSessions?.get(happy.alternateSessionId);
  if (alternateRow) alternateRow.createdAt = Date.now() - 2 * 60 * 60 * 1000;
  await getSession(happy.alternateSessionId);
  const rootAfterAlternateDelete = await resolveOwnedTelemetryFlowForSession(
    happy.sessionId,
    LOCAL_DEV_USER_ID,
  );
  if (
    rootAfterAlternateDelete?.flowId !== telemetry.flowId ||
    !listMemoryProductEvents().some(
      (event) => event.flowId === telemetry.flowId,
    )
  ) {
    failures.push("alternate-only deletion retired the root telemetry flow");
  }
  const source = globalThis.__onwardSessions?.get(happy.sessionId);
  if (source) source.createdAt = Date.now() - 2 * 60 * 60 * 1000;
  await getSession(happy.sessionId);
  const alternate = await getSession(happy.alternateSessionId);
  const artifact = await getOwnedStoryArtifact(
    happy.alternateArtifactId,
    LOCAL_DEV_USER_ID,
    happy.alternateSessionId,
  );
  if (
    alternate !== null ||
    artifact !== null ||
    _listResonanceFeedback().some(
      (feedback) =>
        feedback.sessionId === happy.sessionId ||
        feedback.sessionId === happy.alternateSessionId,
    ) ||
    _listAlternateStoryFlows().some(
      (flow) => flow.sourceSessionId === happy.sessionId,
    ) ||
    (await resolveOwnedTelemetryFlowForSession(
      happy.sessionId,
      LOCAL_DEV_USER_ID,
    )) !== null ||
    listMemoryProductEvents().some(
      (event) => event.flowId === telemetry.flowId,
    ) ||
    registerMemoryTelemetryFlow(telemetry.flowId) !== "revoked"
  ) {
    failures.push("source expiry did not cascade alternate session, artifact, and flow");
  }
}

function checkStaticContracts(failures: string[]): void {
  const migration = read("../supabase/migrations/0009_alternate_story_flows.sql");
  const cleanupMigration = read(
    "../supabase/rollout/remove_legacy_story_session_rpc.sql",
  );
  const route = read("../app/api/story-feedback/alternate/route.ts");
  const capabilityRoute = read(
    "../app/api/story-feedback/alternate/capability/route.ts",
  );
  const feedbackRoute = read("../app/api/story-feedback/route.ts");
  const component = read("../components/ResonanceFeedbackCard.tsx");
  const intakeComponent = read("../components/IntakeForm.tsx");
  const databaseCheck = read("./check-db.ts");
  const table =
    /create table public\.alternate_story_flows \([\s\S]*?\n\);/i.exec(migration)?.[0] ?? "";
  const requiredSql = [
    "story_request_context",
    "disclosure_expires_at",
    "sessions_one_alternate_per_source_idx",
    "on delete cascade",
    "claim_alternate_story_flow",
    "complete_alternate_story_session",
    "complete_alternate_story_unavailable",
    "attempt_count between 0 and 2",
    "next_attempt_at",
    "p_allow_create boolean",
    "alternateStoryPolicyVersion",
    "story_content_allowed_by_context",
    "v_story_spec.spec -> 'contentProfile'",
    "jsonb_typeof(p_content_profile -> 'flags') is distinct from 'array'",
    "jsonb_typeof(item) is distinct from 'string'",
    "select count(distinct value)",
    "p_artifact #> '{contentProfile,flags}'",
    "p_artifact -> 'openingCopy', null, null, null",
    "alternate_of_session_id is not null",
    "set feeling = null, story_request_context = null",
  ];
  if (
    requiredSql.some((item) => !migration.includes(item)) ||
    !cleanupMigration.includes("outside\n-- supabase/migrations") ||
    !cleanupMigration.includes("drop function public.create_story_session") ||
    !table ||
    /\b(feeling|boundaries|clarification|prompt|prose|candidate|reason|story_text)\b/i.test(
      table,
    ) ||
    /grant\s+(?:insert|update|delete)[^;]*alternate_story_flows/i.test(migration)
  ) {
    failures.push("alternate migration lacks root-only, leased, default-deny invariants");
  }
  const routeRequirements = [
    "parseAlternateStoryRequest",
    "isSameOrigin",
    '"cache-control": "no-store"',
    'case "preparing"',
    'case "unavailable"',
    'case "temporarily_unavailable"',
  ];
  const uiRequirements = [
    "Try another story",
    "one-use key",
    "does not resend your text or extend",
    'aria-busy=',
    'role="status"',
    'role="alert"',
    "router.push",
    "initialFeedback",
  ];
  if (
    routeRequirements.some((item) => !route.includes(item)) ||
    !capabilityRoute.includes("parseAlternateCapabilityRequest") ||
    !capabilityRoute.includes('"cache-control": "no-store"') ||
    !feedbackRoute.includes('"story_incomplete"') ||
    !feedbackRoute.includes('"feedback_conflict"') ||
    !intakeComponent.includes("step={1}") ||
    !intakeComponent.includes("normalizeIntakeFeeling") ||
    intakeComponent.includes("maxLength={1000}") ||
    !databaseCheck.includes("p_allow_create: false") ||
    uiRequirements.some((item) => !component.includes(item))
  ) {
    failures.push("alternate endpoint/UI lacks exact, private, accessible recovery states");
  }
}

async function makeRoot(options: {
  userId?: string;
  stage?: FigureStageRow;
  boundaries?: StoryBoundaries;
  clarification?: "uncertainty";
  completed?: boolean;
} = {}) {
  const userId = options.userId ?? LOCAL_DEV_USER_ID;
  const stage = options.stage ?? chooseNonRejectionSource();
  const boundaries = options.boundaries;
  const clarification = options.clarification;
  const spec = buildDraftStorySpec(stage);
  if (!storyProfileAllowed(spec.contentProfile, boundaries)) {
    throw new Error("test source violates its own boundaries");
  }
  const brief = createResonanceBrief(PRIVATE_CANARY, boundaries, clarification);
  const artifact = composeCanonicalStoryArtifact({
    storySpec: spec,
    stage,
    matchRecipe: recipe,
    openingCopy: {
      eyebrow: "A different true story",
      prefaceLines: ["This story is true.", "Your life is not theirs."],
    },
    framing: "partial",
    resonanceBrief: brief,
    boundaries,
    allowDraftSpec: true,
  });
  const sessionId = await createSession({
    userId,
    telemetryFlowId: createTelemetryFlowId(),
    figureKey: stage.figureKey,
    stageId: stage.stageId,
    framing: "partial",
    age: 34,
    feeling: PRIVATE_CANARY,
    storyRequestContext: createStoryRequestContext({
      boundaries,
      clarification,
    }),
    matchRecipe: recipe,
    artifact,
  });
  if (options.completed !== false) {
    await updateSession(sessionId, {
      nextBeatIndex: artifact.beats.length,
      nextChunkIndex: 0,
    });
  }
  return { sessionId, artifact, stage };
}

async function alternateRequestedCapture(userId: string, sessionId: string) {
  const session = await getSession(sessionId);
  if (!session || session.userId !== userId) {
    throw new Error("alternate-request telemetry fixture is unavailable");
  }
  return prepareAlternateRequestedTelemetry({ session, userId });
}

async function alternateClaimTelemetry(userId: string, sessionId: string) {
  const telemetry = await alternateRequestedCapture(userId, sessionId);
  return {
    telemetry,
    resolutionTelemetry: prepareAlternateResolvedTelemetry(
      telemetry?.flowId ?? null,
      "exhausted",
    ),
  };
}

async function alternateResolutionCapture(
  userId: string,
  sessionId: string,
  outcome: "ready" | "unavailable" | "expired" | "exhausted" | "failed",
) {
  const telemetry = await alternateRequestedCapture(userId, sessionId);
  return prepareAlternateResolvedTelemetry(telemetry?.flowId ?? null, outcome);
}

function chooseNonRejectionSource(): FigureStageRow {
  return (
    FIGURE_STAGES.find((stage) => {
      const profile = buildDraftStorySpec(stage).contentProfile;
      return (
        !stage.themes.includes("creative_dismissal") &&
        storyProfileAllowed(profile, BOUNDARIES)
      );
    }) ?? FIGURE_STAGES[0]
  );
}

async function negativeCapability(
  root: RootFixture,
  failures: string[],
): Promise<AlternateStoryCapability> {
  const response = await requestFeedback({
    sessionId: root.sessionId,
    verdict: "not_close",
    reason: "wrong_feeling",
  });
  return readCapability(response, failures, root.sessionId);
}

async function readCapability(
  response: Response,
  failures: string[],
  label: string,
): Promise<AlternateStoryCapability> {
  const body = await response.json();
  const alternate = isRecord(body) && isRecord(body.alternate)
    ? body.alternate
    : null;
  if (
    response.status !== 202 ||
    alternate?.status !== "available" ||
    typeof alternate.token !== "string" ||
    typeof alternate.expiresAt !== "string"
  ) {
    failures.push(`${label}: negative feedback did not issue one capability`);
    return { token: "A".repeat(43), expiresAt: new Date().toISOString() };
  }
  return { token: alternate.token, expiresAt: alternate.expiresAt };
}

function requestFeedback(body: Record<string, unknown>): Promise<Response> {
  return feedbackPost(
    new Request("http://localhost/api/story-feedback", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify(body),
    }),
  );
}

function requestAlternate(
  sessionId: string,
  token: string,
  origin = "http://localhost",
): Promise<Response> {
  return alternatePost(
    new Request("http://localhost/api/story-feedback/alternate", {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ sessionId, token }),
    }),
  );
}

function requestCapability(
  sessionId: string,
  origin = "http://localhost",
): Promise<Response> {
  return capabilityPost(
    new Request("http://localhost/api/story-feedback/alternate/capability", {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ sessionId }),
    }),
  );
}

function rateSnapshot(): string {
  return JSON.stringify(
    [...(globalThis.__onwardRateLimits?.entries() ?? [])].sort(([a], [b]) =>
      a.localeCompare(b),
    ),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function countOccurrences(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

function read(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
