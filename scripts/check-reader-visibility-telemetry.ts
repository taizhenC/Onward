import "./_smoke-bootstrap";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { POST as captureFirstContent } from "../app/api/telemetry/first-content/route";
import { POST as capturePassagePresented } from "../app/api/telemetry/passage-presented/route";
import { POST as captureSourceOpened } from "../app/api/telemetry/source-opened/route";
import { LOCAL_DEV_USER_ID } from "../lib/auth";
import { FIGURE_STAGES } from "../lib/figures-data";
import { APPROVED_PRODUCTION_RECIPE } from "../lib/match-config";
import { createResonanceBrief } from "../lib/resonance-brief";
import {
  acknowledgeOwnedSessionPosition,
  createSession,
  getSession,
  updateSession,
} from "../lib/session";
import { createMemoryAlternateSession } from "../lib/session-store-memory";
import { composeCanonicalStoryArtifact } from "../lib/story-artifact";
import type { StoryArtifact } from "../lib/story-artifact-types";
import {
  deriveStoryPassageLayout,
  type BeatPosition,
} from "../lib/story-progress";
import { prepareStoryProgressTelemetry } from "../lib/story-progress-telemetry";
import { createStoryRequestContext } from "../lib/story-request-context";
import { buildDraftStorySpec } from "../lib/story-spec";
import {
  bindFirstContentStory,
  clearFirstContentRequestStarted,
  consumeFirstContentLatencyBucket,
  elapsedLatencyBucket,
  markFirstContentRequestStarted,
} from "../lib/story-visibility-client";
import {
  parseFirstContentShownRequest,
  parsePassagePresentedRequest,
  parseSourceOpenedRequest,
} from "../lib/story-visibility-request";
import {
  createTelemetryFlowId,
  deleteProductEventsForFlow,
} from "../lib/telemetry";
import { listMemoryProductEvents } from "../lib/telemetry-store-memory";
import type {
  LatencyBucket,
  ProductEventRecord,
  StoryRole,
  TelemetryFlowId,
} from "../lib/telemetry-types";
import type { FigureStageRow, MatchRecipe, Session } from "../lib/types";
import { ALTERNATE_STORY_POLICY_VERSION } from "../lib/alternate-story-types";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";
process.env.RETRIEVAL_MODE = "keyword";
process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";

const ORIGIN = "http://onward.test";
const PRIVATE_CANARY =
  "My private chartreuse sextant feels unseen after a difficult rejection.";
const FOREIGN_USER_ID = "22222222-2222-4222-8222-222222222222";
const recipe: MatchRecipe = {
  recipeId: APPROVED_PRODUCTION_RECIPE.recipeId,
  matchConfigVersion: APPROVED_PRODUCTION_RECIPE.matchConfigVersion,
  crisisRegexVersion: "reader-visibility-test",
  llmProvider: "stub",
  rerankModelId: "stub",
  proseModelId: "stub",
  embeddingModelId: "stub",
  retrievalMode: "keyword",
};

type Fixture = Readonly<{
  flowId: TelemetryFlowId | null;
  sessionId: string;
  artifact: StoryArtifact;
}>;

async function main(): Promise<void> {
  checkClosedClientReductions();
  const initial = await makeFixture(FIGURE_STAGES[0], recipe);
  await checkFirstContent(initial, "initial");
  await checkPassagePresentation(initial, "initial");
  await checkSourceOpen(initial, "initial");
  await checkOwnershipAndExactRequests();
  const alternate = await makeAlternateFixture();
  await checkFirstContent(alternate, "alternate");
  await checkPassagePresentation(alternate, "alternate");
  await checkSourceOpen(alternate, "alternate");
  await checkNullAndDisabledFlows();
  checkPrivacy([requireFlow(initial), requireFlow(alternate)]);
  checkStaticIntegration();

  console.log("Onward reader-visibility telemetry validator");
  console.log("=============================================");
  console.log("PASS first content is one first-write-wins flow/role measurement");
  console.log("PASS passage latency uses the server-derived persisted ordinal");
  console.log("PASS source opening is singleton across retries and reloads");
  console.log("PASS missing and foreign stories expose no position oracle");
  console.log("PASS initial and alternate stories derive role from owned sessions");
  console.log("PASS null, revoked, and incident-disabled stories remain fully readable");
  console.log("PASS ephemeral timing and event rows contain no reader or story content");
}

function checkClosedClientReductions(): void {
  assert.equal(elapsedLatencyBucket(1_000, 1_249), "lt250ms");
  assert.equal(elapsedLatencyBucket(1_000, 1_250), "250to500ms");
  assert.equal(elapsedLatencyBucket(1_000, 9_000), "6to8s");
  assert.equal(elapsedLatencyBucket(1_000, 9_001), "8to15s");
  assert.equal(elapsedLatencyBucket(2_000, 1_000), null);
  assert.equal(elapsedLatencyBucket(0, 3_600_001), null);

  clearFirstContentRequestStarted();
  markFirstContentRequestStarted();
  bindFirstContentStory("accepted-story");
  assert.equal(consumeFirstContentLatencyBucket("other-story"), null);
  assert.equal(consumeFirstContentLatencyBucket("accepted-story"), null);
  markFirstContentRequestStarted();
  bindFirstContentStory("accepted-story");
  assert.equal(
    consumeFirstContentLatencyBucket("accepted-story"),
    "lt250ms",
  );
  assert.equal(consumeFirstContentLatencyBucket("accepted-story"), null);

  assert.deepEqual(
    parseFirstContentShownRequest({
      sessionId: "session",
      latencyBucket: "lt250ms",
    }),
    { sessionId: "session", latencyBucket: "lt250ms" },
  );
  assert.equal(
    parseFirstContentShownRequest({
      sessionId: "session",
      latencyBucket: "lt250ms",
      disclosure: PRIVATE_CANARY,
    }),
    null,
  );
  assert.equal(
    parsePassagePresentedRequest({
      sessionId: "session",
      beatIndex: 0,
      chunkIndex: 0,
      latencyBucket: "raw-432.12ms",
    }),
    null,
  );
  assert.equal(
    parseSourceOpenedRequest({ sessionId: "session", storyRole: "initial" }),
    null,
  );
}

async function checkFirstContent(
  fixture: Fixture,
  role: StoryRole,
): Promise<void> {
  const before = countEvents(requireFlow(fixture), "first_content_shown", role);
  assert.equal(
    (await post(captureFirstContent, "/api/telemetry/first-content", {
      sessionId: fixture.sessionId,
      latencyBucket: "250to500ms",
    })).status,
    204,
  );
  assert.equal(
    (await post(captureFirstContent, "/api/telemetry/first-content", {
      sessionId: fixture.sessionId,
      latencyBucket: "gt15s",
    })).status,
    204,
  );
  const events = roleEvents(requireFlow(fixture), "first_content_shown", role);
  assert.equal(events.length, before + 1);
  const event = events.at(-1);
  assert(event?.event === "first_content_shown");
  assert.equal(event.latencyBucket, "250to500ms");
}

async function checkSourceOpen(
  fixture: Fixture,
  role: StoryRole,
): Promise<void> {
  const incomplete = await post(
    captureSourceOpened,
    "/api/telemetry/source-opened",
    { sessionId: fixture.sessionId },
  );
  assert.equal(incomplete.status, 409);
  await updateSession(fixture.sessionId, {
    nextBeatIndex: fixture.artifact.beats.length,
    nextChunkIndex: 0,
  });
  const before = countEvents(requireFlow(fixture), "source_opened", role);
  const body = { sessionId: fixture.sessionId };
  assert.equal(
    (await post(captureSourceOpened, "/api/telemetry/source-opened", body)).status,
    204,
  );
  assert.equal(
    (await post(captureSourceOpened, "/api/telemetry/source-opened", body)).status,
    204,
  );
  assert.equal(
    countEvents(requireFlow(fixture), "source_opened", role),
    before + 1,
  );
}

async function checkPassagePresentation(
  fixture: Fixture,
  role: StoryRole,
): Promise<void> {
  const nextPosition = await acknowledgeCurrentPassage(fixture);
  const session = await requireSession(fixture.sessionId);
  const layout = deriveStoryPassageLayout(fixture.artifact.beats, nextPosition);
  assert(layout, "next passage layout is unavailable");
  const before = countEvents(requireFlow(fixture), "passage_presented", role);
  const body = {
    ...nextPosition,
    latencyBucket: "1to3s" as LatencyBucket,
  };
  assert.equal(session.nextBeatIndex, body.beatIndex);
  assert.equal(session.nextChunkIndex, body.chunkIndex);
  assert.equal(
    (await post(
      capturePassagePresented,
      "/api/telemetry/passage-presented",
      body,
    )).status,
    204,
  );
  assert.equal(
    (await post(
      capturePassagePresented,
      "/api/telemetry/passage-presented",
      { ...body, latencyBucket: "gt15s" },
    )).status,
    204,
  );
  const events = roleEvents(requireFlow(fixture), "passage_presented", role);
  assert.equal(events.length, before + 1);
  const event = events.at(-1);
  assert(event?.event === "passage_presented");
  assert.equal(event.passageOrdinal, layout.passageOrdinal);
  assert.equal(event.latencyBucket, "1to3s");

  // The fire-and-forget report may arrive after another acknowledgement. The
  // forward-only persisted position proves this passage was reached.
  await acknowledgeCurrentPassage(fixture);
  const delayed = await post(
    capturePassagePresented,
    "/api/telemetry/passage-presented",
    { ...body, latencyBucket: "gt15s" },
  );
  assert.equal(delayed.status, 204);
  assert.equal(
    countEvents(requireFlow(fixture), "passage_presented", role),
    before + 1,
  );

  const future = await post(
    capturePassagePresented,
    "/api/telemetry/passage-presented",
    {
      sessionId: fixture.sessionId,
      beatIndex: fixture.artifact.beats.length - 1,
      chunkIndex: 0,
      latencyBucket: "lt250ms",
    },
  );
  assert.equal(future.status, 409);
}

async function checkOwnershipAndExactRequests(): Promise<void> {
  const stage = FIGURE_STAGES[2] ?? FIGURE_STAGES[0];
  const foreign = await makeFixture(stage, recipe, FOREIGN_USER_ID, null);
  const before = listMemoryProductEvents().length;
  const foreignResponse = await post(
    capturePassagePresented,
    "/api/telemetry/passage-presented",
    {
      sessionId: foreign.sessionId,
      beatIndex: 99,
      chunkIndex: 99,
      latencyBucket: "lt250ms",
    },
  );
  const missingResponse = await post(
    capturePassagePresented,
    "/api/telemetry/passage-presented",
    {
      sessionId: "f".repeat(32),
      beatIndex: 99,
      chunkIndex: 99,
      latencyBucket: "lt250ms",
    },
  );
  assert.equal(foreignResponse.status, 404);
  assert.equal(missingResponse.status, 404);

  for (const [handler, path, body] of [
    [
      captureFirstContent,
      "/api/telemetry/first-content",
      { sessionId: foreign.sessionId, latencyBucket: "lt250ms" },
    ],
    [
      captureSourceOpened,
      "/api/telemetry/source-opened",
      { sessionId: foreign.sessionId },
    ],
  ] as const) {
    assert.equal((await post(handler, path, body)).status, 404);
    assert.equal(
      (await post(handler, path, { ...body, sessionId: "e".repeat(32) })).status,
      404,
    );
  }

  const malformed = await post(
    capturePassagePresented,
    "/api/telemetry/passage-presented",
    {
      sessionId: foreign.sessionId,
      beatIndex: 0,
      chunkIndex: 0,
      passageOrdinal: 0,
      latencyBucket: "lt250ms",
    },
  );
  assert.equal(malformed.status, 400);
  for (const [handler, path, body] of [
    [
      captureFirstContent,
      "/api/telemetry/first-content",
      { sessionId: foreign.sessionId, latencyBucket: "lt250ms" },
    ],
    [
      capturePassagePresented,
      "/api/telemetry/passage-presented",
      {
        sessionId: foreign.sessionId,
        beatIndex: 0,
        chunkIndex: 0,
        latencyBucket: "lt250ms",
      },
    ],
    [
      captureSourceOpened,
      "/api/telemetry/source-opened",
      { sessionId: foreign.sessionId },
    ],
  ] as const) {
    assert.equal(
      (await post(handler, path, body, "https://attacker.invalid")).status,
      403,
    );
  }
  assert.equal(listMemoryProductEvents().length, before);
}

async function makeAlternateFixture(): Promise<Fixture> {
  const rootStage = FIGURE_STAGES[3] ?? FIGURE_STAGES[0];
  const root = await makeFixture(rootStage, recipe);
  await updateSession(root.sessionId, {
    nextBeatIndex: root.artifact.beats.length,
    nextChunkIndex: 0,
  });
  const alternateStage = FIGURE_STAGES.find(
    (stage) =>
      stage.figureKey !== rootStage.figureKey || stage.stageId !== rootStage.stageId,
  );
  assert(alternateStage, "alternate stage fixture is unavailable");
  const alternateRecipe: MatchRecipe = {
    ...recipe,
    alternateStoryPolicyVersion: ALTERNATE_STORY_POLICY_VERSION,
  };
  const artifact = makeArtifact(alternateStage, alternateRecipe);
  const sessionId = createMemoryAlternateSession({
    userId: LOCAL_DEV_USER_ID,
    sourceSessionId: root.sessionId,
    sourceArtifactId: root.artifact.artifactId,
    artifact,
  });
  return { flowId: root.flowId, sessionId, artifact };
}

async function checkNullAndDisabledFlows(): Promise<void> {
  const noFlow = await makeFixture(FIGURE_STAGES[4] ?? FIGURE_STAGES[0], recipe, LOCAL_DEV_USER_ID, null);
  const before = listMemoryProductEvents().length;
  assert.equal(
    (await post(captureFirstContent, "/api/telemetry/first-content", {
      sessionId: noFlow.sessionId,
      latencyBucket: "lt250ms",
    })).status,
    204,
  );
  assert.equal(
    (await post(
      capturePassagePresented,
      "/api/telemetry/passage-presented",
      {
        sessionId: noFlow.sessionId,
        beatIndex: 0,
        chunkIndex: 0,
        latencyBucket: "lt250ms",
      },
    )).status,
    204,
  );
  await updateSession(noFlow.sessionId, {
    nextBeatIndex: noFlow.artifact.beats.length,
    nextChunkIndex: 0,
  });
  assert.equal(
    (await post(captureSourceOpened, "/api/telemetry/source-opened", {
      sessionId: noFlow.sessionId,
    })).status,
    204,
  );
  assert.equal(listMemoryProductEvents().length, before);

  const revoked = await makeFixture(
    FIGURE_STAGES[5] ?? FIGURE_STAGES[0],
    recipe,
  );
  const revokedFlow = requireFlow(revoked);
  assert.equal(
    await deleteProductEventsForFlow(revokedFlow, LOCAL_DEV_USER_ID),
    1,
  );
  const afterRevocation = listMemoryProductEvents().length;
  assert.equal(
    (await post(captureFirstContent, "/api/telemetry/first-content", {
      sessionId: revoked.sessionId,
      latencyBucket: "lt250ms",
    })).status,
    204,
  );
  assert.equal(listMemoryProductEvents().length, afterRevocation);

  const disabled = await makeFixture(
    FIGURE_STAGES[6] ?? FIGURE_STAGES[0],
    recipe,
  );
  const beforeDisabled = listMemoryProductEvents().length;

  process.env.TELEMETRY_FLOW_BINDING_ENABLED = "false";
  try {
    assert.equal(
      (await post(captureFirstContent, "/api/telemetry/first-content", {
        sessionId: disabled.sessionId,
        latencyBucket: "lt250ms",
      })).status,
      204,
    );
    assert.equal(
      (await post(
        capturePassagePresented,
        "/api/telemetry/passage-presented",
        {
          sessionId: disabled.sessionId,
          beatIndex: 0,
          chunkIndex: 0,
          latencyBucket: "lt250ms",
        },
      )).status,
      204,
    );
    assert.equal(
      (await post(captureSourceOpened, "/api/telemetry/source-opened", {
        sessionId: disabled.sessionId,
      })).status,
      204,
    );
    assert.equal(listMemoryProductEvents().length, beforeDisabled);
  } finally {
    process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";
  }
}

async function acknowledgeCurrentPassage(fixture: Fixture): Promise<BeatPosition> {
  const session = await requireSession(fixture.sessionId);
  const position = {
    beatIndex: session.nextBeatIndex,
    chunkIndex: session.nextChunkIndex,
  };
  const layout = deriveStoryPassageLayout(fixture.artifact.beats, position);
  assert(layout && layout.next !== "end", "fixture has no following passage");
  const telemetry = await prepareStoryProgressTelemetry({
    session,
    userId: session.userId,
    layout,
  });
  const result = await acknowledgeOwnedSessionPosition({
    sessionId: fixture.sessionId,
    userId: session.userId,
    storyArtifactId: session.storyArtifactId,
    telemetry,
    expectedBeatIndex: position.beatIndex,
    expectedChunkIndex: position.chunkIndex,
    nextBeatIndex: layout.nextBeatIndex,
    nextChunkIndex: layout.nextChunkIndex,
  });
  assert.equal(result, "advanced");
  return {
    sessionId: fixture.sessionId,
    beatIndex: layout.nextBeatIndex,
    chunkIndex: layout.nextChunkIndex,
  };
}

async function makeFixture(
  stage: FigureStageRow | undefined,
  matchRecipe: MatchRecipe,
  userId = LOCAL_DEV_USER_ID,
  flowId: TelemetryFlowId | null = createTelemetryFlowId(),
): Promise<Fixture> {
  assert(stage, "figure fixture is unavailable");
  const artifact = makeArtifact(stage, matchRecipe);
  const sessionId = await createSession({
    userId,
    telemetryFlowId: flowId,
    figureKey: stage.figureKey,
    stageId: stage.stageId,
    framing: "partial",
    age: 27,
    feeling: PRIVATE_CANARY,
    storyRequestContext: createStoryRequestContext({
      boundaries: undefined,
      clarification: undefined,
    }),
    matchRecipe,
    artifact,
  });
  return { flowId, sessionId, artifact };
}

function makeArtifact(
  stage: FigureStageRow,
  matchRecipe: MatchRecipe,
): StoryArtifact {
  return composeCanonicalStoryArtifact({
    storySpec: buildDraftStorySpec(stage),
    stage,
    matchRecipe,
    openingCopy: {
      eyebrow: "A true story",
      prefaceLines: ["This story is true.", "Your life is not theirs."],
    },
    framing: "partial",
    resonanceBrief: createResonanceBrief(PRIVATE_CANARY),
    allowDraftSpec: true,
  });
}

function checkPrivacy(flowIds: readonly TelemetryFlowId[]): void {
  const serialized = JSON.stringify(
    listMemoryProductEvents().filter((event) =>
      flowIds.includes(event.flowId as TelemetryFlowId),
    ),
  );
  assert(!serialized.includes(PRIVATE_CANARY));
  for (const key of [
    "feeling",
    "disclosure",
    "sessionId",
    "artifactId",
    "figureKey",
    "stageId",
    "userId",
    "text",
    "sourceId",
  ]) {
    assert(!serialized.includes(key), `visibility telemetry exposed ${key}`);
  }
}

function checkStaticIntegration(): void {
  const form = source("components/IntakeForm.tsx");
  const player = source("components/StoryPlayer.tsx");
  const beat = source("components/StoryBeat.tsx");
  const afterword = source("components/StoryAfterword.tsx");
  const preface = source("components/PrefaceCard.tsx");
  const feedback = source("components/ResonanceFeedbackCard.tsx");
  const client = source("lib/story-visibility-client.ts");
  const passageRoute = source(
    "app/api/telemetry/passage-presented/route.ts",
  );
  const helper = source("lib/story-visibility-telemetry.ts");

  assert(form.includes("markFirstContentRequestStarted();"));
  assert(
    form.indexOf("bindFirstContentStory(payload.sessionId)") <
      form.indexOf("router.push(`/story/${payload.sessionId}`)"),
  );
  assert(form.includes("clearFirstContentRequestStarted();"));
  assert(
    feedback.indexOf("markFirstContentRequestStarted();") <
      feedback.indexOf('fetch("/api/story-feedback/alternate"'),
  );
  assert(
    feedback.indexOf("bindFirstContentStory(body.sessionId)") <
      feedback.indexOf("router.push(`/story/${body.sessionId}`)"),
  );
  assert(player.includes("consumeFirstContentLatencyBucket(sessionId)"));
  assert(preface.includes("onAnimationComplete={onVisible}"));
  assert(player.includes("onAnimationComplete={() => setVisiblePassageKey(passageKey)}"));
  assert(beat.indexOf("const startedAt = monotonicEpochMs()") < beat.indexOf("await acknowledgeBeat({"));
  assert(beat.includes("elapsedLatencyBucket(presentationStartedAt)"));
  assert(beat.includes("!presentationVisible"));
  assert(afterword.includes("event.currentTarget.open"));
  assert(afterword.includes("sourceOpenedRef.current"));
  assert(client.includes("let pendingFirstContentTiming"));
  assert(!client.includes("sessionStorage"));
  assert(!client.includes("localStorage"));
  assert(!client.includes("telemetryFlowId"));
  assert(!client.includes("storyRole"));
  assert(!client.includes("passageOrdinal"));
  assert(passageRoute.indexOf("await getOwnedSession(") < passageRoute.indexOf("positionHasBeenReached("));
  assert(passageRoute.includes("deriveStoryPassageLayout(playback.beats, parsed)"));
  assert(passageRoute.includes("current.beatIndex > requested.beatIndex"));
  assert(helper.includes("input.session.alternateOfSessionId === null"));
  assert(helper.includes("input.layout.passageOrdinal"));
}

async function post(
  handler: (request: Request) => Promise<Response>,
  path: string,
  body: Record<string, unknown>,
  origin = ORIGIN,
): Promise<Response> {
  return handler(
    new Request(`${ORIGIN}${path}`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function roleEvents(
  flowId: TelemetryFlowId,
  event: ProductEventRecord["event"],
  role: StoryRole,
): ReadonlyArray<Readonly<ProductEventRecord>> {
  return listMemoryProductEvents().filter(
    (candidate) =>
      candidate.flowId === flowId &&
      candidate.event === event &&
      "storyRole" in candidate &&
      candidate.storyRole === role,
  );
}

function countEvents(
  flowId: TelemetryFlowId,
  event: ProductEventRecord["event"],
  role: StoryRole,
): number {
  return roleEvents(flowId, event, role).length;
}

function requireFlow(fixture: Fixture): TelemetryFlowId {
  assert(fixture.flowId, "fixture has no telemetry flow");
  return fixture.flowId;
}

async function requireSession(sessionId: string): Promise<Session> {
  const session = await getSession(sessionId);
  assert(session, "fixture session is unavailable");
  return session;
}

function source(relativePath: string): string {
  return readFileSync(resolve(relativePath), "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
