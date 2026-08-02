import "./_smoke-bootstrap";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";
import { POST as deleteStoryPost } from "../app/api/story-delete/route";
import {
  LOCAL_DEV_USER_ID,
  _setMemoryAuthContextForTests,
} from "../lib/auth";
import { FIGURE_STAGES } from "../lib/figures-data";
import { APPROVED_PRODUCTION_RECIPE } from "../lib/match-config";
import {
  ALTERNATE_STORY_POLICY_VERSION,
} from "../lib/alternate-story-types";
import type { StoredAlternateStoryFlow } from "../lib/alternate-story-store-memory";
import {
  listMemoryAlternateStoryFlows,
} from "../lib/alternate-story-store-memory";
import {
  RESONANCE_FEEDBACK_POLICY_VERSION,
  RESONANCE_FEEDBACK_RETENTION_DAYS,
} from "../lib/resonance-feedback-types";
import {
  listMemoryResonanceFeedback,
} from "../lib/resonance-feedback-store-memory";
import {
  _recordMemoryOwnerStorySaveTransitionForTests,
  getMemoryOwnerStorySaveState,
} from "../lib/owner-story-save-store-memory";
import { createResonanceBrief, RESONANCE_BRIEF_VERSION } from "../lib/resonance-brief";
import {
  createSession,
  getSession,
  listSessionsByUser,
} from "../lib/session";
import { getStoryPlaybackBeforeDeadline } from "../lib/story-playback-deadline";
import { createStoryRequestContext } from "../lib/story-request-context";
import { composeCanonicalStoryArtifact } from "../lib/story-artifact";
import {
  getOwnedMemoryStoryArtifactSync,
  putMemoryStoryArtifact,
} from "../lib/story-artifact-store-memory";
import { buildDraftStorySpec } from "../lib/story-spec";
import { deleteOwnedStory } from "../lib/story-deletion";
import {
  issueStoryDeletionToken,
  storyDeletionTokenDisposition,
  verifyStoryDeletionToken,
} from "../lib/story-deletion-token";
import {
  createTelemetryFlowId,
  recordProductEvent,
} from "../lib/telemetry";
import {
  isMemoryTelemetryFlowRevoked,
} from "../lib/telemetry-flow-state-memory";
import {
  listMemoryProductEventOutbox,
  listMemoryProductEvents,
} from "../lib/telemetry-store-memory";
import type { MatchRecipe, Session } from "../lib/types";
import type { ProductEvent } from "../lib/telemetry-types";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";
process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";

const recipe: MatchRecipe = {
  recipeId: APPROVED_PRODUCTION_RECIPE.recipeId,
  matchConfigVersion: APPROVED_PRODUCTION_RECIPE.matchConfigVersion,
  crisisRegexVersion: "story-deletion-test",
  llmProvider: "stub",
  rerankModelId: "stub",
  proseModelId: "stub",
  embeddingModelId: "stub",
  retrievalMode: "keyword",
  resonanceBriefVersion: RESONANCE_BRIEF_VERSION,
};

async function main(): Promise<void> {
  const failures: string[] = [];
  checkTokenBinding(failures);
  await checkPrivacyControlAvailability(failures);
  await checkUnboundedOwnerPagination(failures);
  await checkAlternateOnlyDeletion(failures);
  await checkRootFamilyDeletion(failures);
  await checkOwnershipAndRoute(failures);
  checkStaticContracts(failures);

  console.log("Onward story deletion validator");
  console.log("================================");
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`${failures.length} story-deletion failure(s).`);
    process.exit(1);
  }
  console.log("PASS owner-scoped root/alternate content cascades and consumed tombstones");
  console.log("PASS story deletion preserves account-level Owner Story Save State");
  console.log("PASS shared raw telemetry retirement, revocation, and unlinkable SLA events");
  console.log("PASS exact same-origin form, signed CSRF binding, replay, and auth behavior");
  console.log("PASS bounded enrichment, complete pagination, SQL locks, and grants");
}

function checkTokenBinding(failures: string[]): void {
  const sessionId = "1".repeat(32);
  const now = new Date("2026-07-17T12:00:00.000Z");
  const token = issueStoryDeletionToken(LOCAL_DEV_USER_ID, sessionId, now);
  if (
    !verifyStoryDeletionToken(token, LOCAL_DEV_USER_ID, sessionId, now) ||
    !verifyStoryDeletionToken(
      token,
      LOCAL_DEV_USER_ID,
      sessionId,
      new Date(now.getTime() - 30_000),
    ) ||
    verifyStoryDeletionToken(token, "another-user", sessionId, now) ||
    verifyStoryDeletionToken(token, LOCAL_DEV_USER_ID, "2".repeat(32), now) ||
    verifyStoryDeletionToken(tamperToken(token), LOCAL_DEV_USER_ID, sessionId, now) ||
    verifyStoryDeletionToken(
      token,
      LOCAL_DEV_USER_ID,
      sessionId,
      new Date(now.getTime() + 12 * 60_000),
    ) ||
    storyDeletionTokenDisposition(
      token,
      LOCAL_DEV_USER_ID,
      sessionId,
      new Date(now.getTime() + 12 * 60_000),
    ) !== "expired" ||
    storyDeletionTokenDisposition(
      tamperToken(token),
      LOCAL_DEV_USER_ID,
      sessionId,
      now,
    ) !== "invalid"
  ) {
    failures.push("story deletion CSRF token was not owner/session/expiry bound");
  }
}

async function checkPrivacyControlAvailability(failures: string[]): Promise<void> {
  const family = await makeFamily();
  const playbackStartedAt = Date.now();
  const playback = await getStoryPlaybackBeforeDeadline(family.root, {
    budgetMs: 10,
    load: () => new Promise<never>(() => undefined),
  });
  if (playback !== null || Date.now() - playbackStartedAt > 500) {
    failures.push("a hung optional playback lookup could hide story deletion controls");
  }

  let eventAttempts = 0;
  const deletionStartedAt = Date.now();
  const deleted = await deleteOwnedStory(
    {
      sessionId: family.root.sessionId,
      userId: LOCAL_DEV_USER_ID,
      deletionRequestSeed: issueStoryDeletionToken(
        LOCAL_DEV_USER_ID,
        family.root.sessionId,
      ),
    },
    {
      recordEvent: () => {
        eventAttempts += 1;
        return new Promise(() => undefined);
      },
    },
  );
  if (
    deleted !== "deleted" ||
    (await getSession(family.root.sessionId)) !== null ||
    Date.now() - deletionStartedAt > 750 ||
    eventAttempts !== 1
  ) {
    failures.push("hung deletion telemetry delayed or prevented the privacy mutation");
  }

  const rejectedFamily = await makeFamily();
  let rejectedAttempts = 0;
  const rejectedResult = await deleteOwnedStory(
    {
      sessionId: rejectedFamily.root.sessionId,
      userId: LOCAL_DEV_USER_ID,
    },
    {
      recordEvent: async () => {
        rejectedAttempts += 1;
        throw new Error("synthetic telemetry rejection");
      },
    },
  );
  if (
    rejectedResult !== "deleted" ||
    (await getSession(rejectedFamily.root.sessionId)) !== null ||
    rejectedAttempts !== 2
  ) {
    failures.push("rejected deletion telemetry changed privacy availability");
  }

  const timedFamily = await makeFamily();
  let syntheticNow = 10_000;
  const timedEvents: ProductEvent[] = [];
  const timedResult = await deleteOwnedStory(
    {
      sessionId: timedFamily.root.sessionId,
      userId: LOCAL_DEV_USER_ID,
    },
    {
      now: () => syntheticNow,
      recordEvent: async (event) => {
        timedEvents.push(event);
        if (event.event === "deletion_requested") syntheticNow += 4_000;
      },
    },
  );
  const completion = timedEvents.find(
    (event) => event.event === "deletion_completed",
  );
  if (
    timedResult !== "deleted" ||
    completion?.event !== "deletion_completed" ||
    completion.latencyBucket !== "lt250ms"
  ) {
    failures.push("deletion SLA latency included telemetry delivery time");
  }
}

async function checkUnboundedOwnerPagination(failures: string[]): Promise<void> {
  const userId = "pagination-owner";
  const family = await makeFamily(userId);
  const insertedIds: string[] = [];
  const baseTime = Date.now();
  for (let index = 0; index < 105; index += 1) {
    const sessionId = (index + 10_000).toString(16).padStart(32, "0");
    insertedIds.push(sessionId);
    globalThis.__onwardSessions!.set(sessionId, {
      ...family.root,
      sessionId,
      userId,
      storyArtifactId: null,
      alternateOfSessionId: null,
      createdAt: baseTime + index,
      updatedAt: baseTime + index,
    });
  }
  const expected = [...globalThis.__onwardSessions!.values()]
    .filter((session) => session.userId === userId)
    .sort(
      (a, b) =>
        b.createdAt - a.createdAt || b.sessionId.localeCompare(a.sessionId),
    )
    .map((session) => session.sessionId);
  const first = await listSessionsByUser(userId, { offset: 0, limit: 101 });
  const rest = await listSessionsByUser(userId, { offset: 101, limit: 101 });
  if (
    expected.length <= 100 ||
    [...first, ...rest].map((session) => session.sessionId).join(",") !==
      expected.join(",")
  ) {
    failures.push("owner story pagination omitted or reordered stories beyond 100");
  }
  for (const sessionId of insertedIds) {
    globalThis.__onwardSessions!.delete(sessionId);
  }
}

async function checkAlternateOnlyDeletion(failures: string[]): Promise<void> {
  const family = await makeFamily();
  const beforeDeletionEvents = deletionEvents().length;
  const familyEventIds = new Set(
    listMemoryProductEvents()
      .filter((event) => event.flowId === family.flowId)
      .map((event) => event.eventId),
  );
  const result = await deleteOwnedStory({
    sessionId: family.alternate.sessionId,
    userId: LOCAL_DEV_USER_ID,
  });
  const root = await getSession(family.root.sessionId);
  const alternate = await getSession(family.alternate.sessionId);
  const flow = listMemoryAlternateStoryFlows().find(
    (candidate) => candidate.sourceSessionId === family.root.sessionId,
  );
  if (
    result !== "deleted" ||
    !root ||
    alternate !== null ||
    getOwnedMemoryStoryArtifactSync(
      family.alternateArtifact.artifactId,
      LOCAL_DEV_USER_ID,
      family.alternate.sessionId,
    ) !== null ||
    !getOwnedMemoryStoryArtifactSync(
      family.rootArtifact.artifactId,
      LOCAL_DEV_USER_ID,
      family.root.sessionId,
    ) ||
    listMemoryResonanceFeedback().some(
      (item) => item.sessionId === family.alternate.sessionId,
    ) ||
    !listMemoryResonanceFeedback().some(
      (item) => item.sessionId === family.root.sessionId,
    ) ||
    flow?.status !== "unavailable" ||
    flow.resultSessionId !== null
  ) {
    failures.push("alternate-only deletion did not preserve the exact root/tombstone boundary");
  }
  if (
    !isMemoryTelemetryFlowRevoked(family.flowId) ||
    listMemoryProductEvents().some((event) => event.flowId === family.flowId) ||
    listMemoryProductEventOutbox().some((pointer) =>
      familyEventIds.has(pointer.eventId),
    ) ||
    deletionEvents().length !== beforeDeletionEvents + 2
  ) {
    failures.push("alternate deletion did not retire family telemetry and retain only SLA events");
  }
  const recreation = await recordProductEvent({
    event: { event: "source_opened", storyRole: "initial" },
    flowId: family.flowId,
  });
  if (recreation !== "conflict") {
    failures.push("a deleted story family telemetry capability was recreatable");
  }
}

async function checkRootFamilyDeletion(failures: string[]): Promise<void> {
  const family = await makeFamily();
  const saveStateBefore = _recordMemoryOwnerStorySaveTransitionForTests({
    userId: LOCAL_DEV_USER_ID,
    evidenceKind: "anonymous_upgrade",
    occurredAt: Date.parse("2026-07-17T12:00:00.000Z"),
  });
  const result = await deleteOwnedStory({
    sessionId: family.root.sessionId,
    userId: LOCAL_DEV_USER_ID,
  });
  const saveStateAfter = getMemoryOwnerStorySaveState(LOCAL_DEV_USER_ID);
  if (!isDeepStrictEqual(saveStateAfter, saveStateBefore)) {
    failures.push("story deletion altered account-level Owner Story Save State");
  }
  if (
    result !== "deleted" ||
    (await getSession(family.root.sessionId)) !== null ||
    (await getSession(family.alternate.sessionId)) !== null ||
    getOwnedMemoryStoryArtifactSync(
      family.rootArtifact.artifactId,
      LOCAL_DEV_USER_ID,
      family.root.sessionId,
    ) !== null ||
    getOwnedMemoryStoryArtifactSync(
      family.alternateArtifact.artifactId,
      LOCAL_DEV_USER_ID,
      family.alternate.sessionId,
    ) !== null ||
    listMemoryResonanceFeedback().some(
      (item) =>
        item.sessionId === family.root.sessionId ||
        item.sessionId === family.alternate.sessionId,
    ) ||
    listMemoryAlternateStoryFlows().some(
      (item) => item.sourceSessionId === family.root.sessionId,
    ) ||
    !isMemoryTelemetryFlowRevoked(family.flowId)
  ) {
    failures.push("root deletion did not remove the complete owned story family");
  }
}

async function checkOwnershipAndRoute(failures: string[]): Promise<void> {
  const foreign = await makeFamily("foreign-story-owner");
  const before = deletionEvents().length;
  const denied = await deleteOwnedStory({
    sessionId: foreign.root.sessionId,
    userId: LOCAL_DEV_USER_ID,
  });
  if (
    denied !== "not_found" ||
    !(await getSession(foreign.root.sessionId)) ||
    deletionEvents().length !== before
  ) {
    failures.push("foreign deletion changed content or emitted a deletion denominator");
  }

  const owner = await makeFamily();
  const token = issueStoryDeletionToken(LOCAL_DEV_USER_ID, owner.root.sessionId);
  const crossOrigin = await requestDeletion(owner.root.sessionId, token, {
    origin: "https://attacker.example",
  });
  const missingOrigin = await requestDeletion(owner.root.sessionId, token, {
    origin: null,
  });
  const crossSite = await requestDeletion(owner.root.sessionId, token, {
    fetchSite: "cross-site",
  });
  const tampered = await requestDeletion(
    owner.root.sessionId,
    tamperToken(token),
  );
  const extra = await requestDeletion(owner.root.sessionId, token, {
    extraField: true,
  });
  if (
    crossOrigin.status !== 403 ||
    missingOrigin.status !== 403 ||
    crossSite.status !== 403 ||
    tampered.status !== 403 ||
    extra.status !== 400 ||
    !(await getSession(owner.root.sessionId))
  ) {
    failures.push("destructive form origin, fetch-metadata, token, or exact-shape gate failed");
  }

  const expiredFamily = await makeFamily();
  const expiredToken = issueStoryDeletionToken(
    LOCAL_DEV_USER_ID,
    expiredFamily.root.sessionId,
    new Date(Date.now() - 12 * 60_000),
  );
  const expired = await requestDeletion(
    expiredFamily.root.sessionId,
    expiredToken,
  );
  const expiredLocation = new URL(
    expired.headers.get("location") ?? "http://invalid",
  );
  if (
    expired.status !== 303 ||
    expiredLocation.pathname !==
      `/stories/${expiredFamily.root.sessionId}/delete` ||
    expiredLocation.searchParams.get("error") !== "expired" ||
    !(await getSession(expiredFamily.root.sessionId))
  ) {
    failures.push("expired confirmation did not return to a safe retry surface");
  }

  _setMemoryAuthContextForTests(null);
  const signedOut = await requestDeletion(owner.root.sessionId, token);
  _setMemoryAuthContextForTests(undefined);
  if (
    signedOut.status !== 303 ||
    new URL(signedOut.headers.get("location") ?? "http://invalid").pathname !== "/signin"
  ) {
    failures.push("expired authentication did not redirect without deleting");
  }

  const accepted = await requestDeletion(owner.root.sessionId, token);
  if (
    accepted.status !== 303 ||
    new URL(accepted.headers.get("location") ?? "http://invalid").searchParams.get(
      "deletion",
    ) !== "complete" ||
    (await getSession(owner.root.sessionId)) !== null
  ) {
    failures.push("valid deletion form did not hard-delete then use Post/Redirect/Get");
  }
  const replay = await requestDeletion(owner.root.sessionId, token);
  if (replay.status !== 303) {
    failures.push("valid response-loss replay was not idempotent");
  }

  const concurrentFamily = await makeFamily();
  const concurrentToken = issueStoryDeletionToken(
    LOCAL_DEV_USER_ID,
    concurrentFamily.root.sessionId,
  );
  const beforeConcurrentEvents = deletionEvents().length;
  const concurrentResponses = await Promise.all([
    requestDeletion(concurrentFamily.root.sessionId, concurrentToken),
    requestDeletion(concurrentFamily.root.sessionId, concurrentToken),
  ]);
  if (
    concurrentResponses.some((response) => response.status !== 303) ||
    (await getSession(concurrentFamily.root.sessionId)) !== null ||
    deletionEvents().length !== beforeConcurrentEvents + 2
  ) {
    failures.push("concurrent same-form deletion did not converge to one event pair");
  }
}

function checkStaticContracts(failures: string[]): void {
  const migration = read("../supabase/migrations/0018_owned_story_deletion.sql");
  const listPage = read("../app/stories/page.tsx");
  const confirmPage = read("../app/stories/[sessionId]/delete/page.tsx");
  const route = read("../app/api/story-delete/route.ts");
  const nextConfig = read("../next.config.ts");
  const supabaseStore = read("../lib/session-store-supabase.ts");
  const privacyCopy = read("../README.md");
  const requiredSql = [
    "delete_owned_story_v1",
    "coalesce(target.alternate_of_session_id, target.session_id)",
    "pg_advisory_xact_lock(hashtextextended(v_root_session_id, 0))",
    "family.alternate_of_session_id = v_root_session_id",
    "order by family.session_id",
    "for update",
    "delete from public.telemetry_flows",
    "delete from public.sessions",
    "revoke delete on table public.sessions from service_role",
    "grant execute on function public.delete_owned_story_v1(uuid, text)",
  ];
  if (
    requiredSql.some((fragment) =>
      !migration.toLowerCase().includes(fragment.toLowerCase()),
    ) ||
    /delete\s+from\s+public\.telemetry_event_daily_rollups/i.test(migration)
  ) {
    failures.push("story deletion migration lacks locks, ownership, telemetry retirement, or safe grants");
  }
  if (
    /(?:delete\s+from|update|insert\s+into)\s+public\.owner_story_save_states/i.test(
      migration,
    )
  ) {
    failures.push("story deletion SQL mutates account-level Owner Story Save State");
  }
  if (
    !listPage.includes("playback?.outline.displayName ?? \"Story\"") ||
    !listPage.includes("getStoryPlaybackBeforeDeadline") ||
    !listPage.includes("Delete story") ||
    !listPage.includes("Newer stories") ||
    !listPage.includes("Older stories") ||
    !confirmPage.includes('method="post"') ||
    !confirmPage.includes('name="csrfToken"') ||
    !confirmPage.includes("Delete story now") ||
    !confirmPage.includes("hard-deletes from Onward's active database") ||
    !confirmPage.includes('/privacy#retention-after-deletion') ||
    !confirmPage.includes('kind="alert"') ||
    confirmPage.includes("getStoryPlayback") ||
    !confirmPage.includes("formatStoryTimestamp(session.createdAt)") ||
    !listPage.includes("story ${index + 1} on this page") ||
    !confirmPage.includes("currently have no automatic expiry") ||
    !route.includes('fetchSite === "cross-site"') ||
    !route.includes('tokenDisposition === "expired"') ||
    !route.includes('status: 303') ||
    !nextConfig.includes("frame-ancestors 'none'") ||
    !nextConfig.includes('key: "X-Frame-Options"') ||
    !nextConfig.includes('value: "DENY"') ||
    !nextConfig.includes('value: "private, no-store, max-age=0"') ||
    !supabaseStore.includes(
      ".range(options.offset, options.offset + options.limit - 1)",
    ) ||
    !supabaseStore.includes('if (!current) return "deleted"') ||
    privacyCopy.includes("anonymous totals and anonymous fact reports") ||
    !privacyCopy.includes("currently have no automatic expiry")
  ) {
    failures.push("story deletion UI/route lacks the progressive, accessible privacy contract");
  }
  if (/<Link[\s\S]{0,500}<button/i.test(listPage)) {
    failures.push("story list nests a destructive button inside its story link");
  }
}

async function makeFamily(userId = LOCAL_DEV_USER_ID) {
  const rootStage = FIGURE_STAGES[0];
  const alternateStage = FIGURE_STAGES[1];
  const rootArtifact = makeArtifact(rootStage, "A private root test disclosure.");
  const flowId = createTelemetryFlowId();
  const rootSessionId = await createSession({
    userId,
    telemetryFlowId: flowId,
    figureKey: rootStage.figureKey,
    stageId: rootStage.stageId,
    framing: "partial",
    age: Math.max(13, rootStage.ageMin),
    feeling: "A private root test disclosure.",
    storyRequestContext: createStoryRequestContext({
      boundaries: undefined,
      clarification: undefined,
    }),
    matchRecipe: recipe,
    artifact: rootArtifact,
  });
  const root = (await getSession(rootSessionId))!;
  root.nextBeatIndex = rootArtifact.beats.length;

  const alternateArtifact = makeArtifact(
    alternateStage,
    "A separate private alternate test disclosure.",
  );
  const alternateSessionId = randomBytes(16).toString("hex");
  const now = Date.now();
  const alternate: Session = {
    sessionId: alternateSessionId,
    userId,
    figureKey: alternateStage.figureKey,
    stageId: alternateStage.stageId,
    storyArtifactId: alternateArtifact.artifactId,
    framing: "partial",
    openingCopy: alternateArtifact.openingCopy,
    age: null,
    feeling: null,
    storyRequestContext: null,
    disclosureExpiresAt: root.disclosureExpiresAt,
    alternateOfSessionId: root.sessionId,
    matchRecipe: recipe,
    nextBeatIndex: alternateArtifact.beats.length,
    nextChunkIndex: 0,
    createdAt: now,
    updatedAt: now,
  };
  globalThis.__onwardSessions!.set(alternateSessionId, alternate);
  putMemoryStoryArtifact(alternateSessionId, userId, alternateArtifact);
  seedFeedback(root, rootArtifact, "felt_close");
  seedFeedback(alternate, alternateArtifact, "felt_close");
  seedAlternateFlow(root, alternate, now);
  return { root, alternate, rootArtifact, alternateArtifact, flowId };
}

function makeArtifact(
  stage: (typeof FIGURE_STAGES)[number],
  disclosure: string,
) {
  return composeCanonicalStoryArtifact({
    storySpec: buildDraftStorySpec(stage),
    stage,
    matchRecipe: recipe,
    openingCopy: {
      eyebrow: "A documented life in a difficult middle",
      prefaceLines: ["This story is true.", "Your life is not theirs."],
    },
    framing: "partial",
    resonanceBrief: createResonanceBrief(disclosure),
    allowDraftSpec: true,
  });
}

function seedFeedback(
  session: Session,
  artifact: ReturnType<typeof makeArtifact>,
  verdict: "felt_close",
): void {
  const now = new Date();
  globalThis.__onwardResonanceFeedback!.set(session.sessionId, {
    feedbackId: randomBytes(16).toString("hex"),
    userId: session.userId,
    sessionId: session.sessionId,
    artifactId: artifact.artifactId,
    storySpecId: artifact.storySpecId,
    storySpecVersion: artifact.storySpecVersion,
    figureKey: artifact.figureKey,
    stageId: artifact.stageId,
    recipeId: recipe.recipeId,
    policyVersion: RESONANCE_FEEDBACK_POLICY_VERSION,
    verdict,
    reason: null,
    createdAt: now.toISOString(),
    expiresAt: new Date(
      now.getTime() + RESONANCE_FEEDBACK_RETENTION_DAYS * 86_400_000,
    ).toISOString(),
  });
}

function seedAlternateFlow(root: Session, alternate: Session, now: number): void {
  const flow: StoredAlternateStoryFlow = {
    userId: root.userId,
    sourceSessionId: root.sessionId,
    sourceArtifactId: root.storyArtifactId!,
    tokenHash: "a".repeat(64),
    policyVersion: ALTERNATE_STORY_POLICY_VERSION,
    expiresAt: now + 60 * 60_000,
    contextExpiresAt: root.disclosureExpiresAt,
    status: "ready",
    attemptCount: 1,
    leaseId: null,
    leaseExpiresAt: null,
    nextAttemptAt: null,
    resultSessionId: alternate.sessionId,
    createdAt: now,
    updatedAt: now,
  };
  globalThis.__onwardAlternateStoryFlows!.set(root.sessionId, flow);
}

function deletionEvents() {
  return listMemoryProductEvents().filter(
    (event) =>
      event.event === "deletion_requested" ||
      event.event === "deletion_completed",
  );
}

function tamperToken(token: string): string {
  return `${token.slice(0, -1)}${token.endsWith("x") ? "y" : "x"}`;
}

async function requestDeletion(
  sessionId: string,
  csrfToken: string,
  options: {
    origin?: string | null;
    fetchSite?: string;
    extraField?: boolean;
  } = {},
): Promise<Response> {
  const form = new URLSearchParams({
    intent: "delete_story",
    sessionId,
    csrfToken,
  });
  if (options.extraField) form.set("extra", "forbidden");
  const headers = new Headers({
    "content-type": "application/x-www-form-urlencoded",
  });
  if (options.origin !== null) {
    headers.set("origin", options.origin ?? "http://localhost");
  }
  if (options.fetchSite) headers.set("sec-fetch-site", options.fetchSite);
  return deleteStoryPost(
    new Request("http://localhost/api/story-delete", {
      method: "POST",
      headers,
      body: form.toString(),
    }),
  );
}

function read(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
