import "./_smoke-bootstrap";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { POST as feedbackPost } from "../app/api/story-feedback/route";
import { LOCAL_DEV_USER_ID } from "../lib/auth";
import { FIGURE_STAGES } from "../lib/figures-data";
import { _listHistoricalConcerns } from "../lib/historical-concerns";
import { createResonanceBrief } from "../lib/resonance-brief";
import { createStoryRequestContext } from "../lib/story-request-context";
import { _listResonanceFeedback } from "../lib/resonance-feedback";
import { parseResonanceFeedbackRequest } from "../lib/resonance-feedback-request";
import {
  RESONANCE_FEEDBACK_POLICY_VERSION,
  RESONANCE_FEEDBACK_RETENTION_DAYS,
  RESONANCE_MISS_REASONS,
} from "../lib/resonance-feedback-types";
import {
  createSession,
  getSession,
  updateSession,
} from "../lib/session";
import { composeCanonicalStoryArtifact } from "../lib/story-artifact";
import { buildDraftStorySpec } from "../lib/story-spec";
import type { MatchRecipe } from "../lib/types";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";

const PRIVATE_DISCLOSURE =
  "My private cerulean sextant stopped making sense after another rejection.";
const STORY_CANARY = "STORY-PROSE-MUST-NOT-ENTER-FEEDBACK";

const recipe: MatchRecipe = {
  recipeId: "resonance-feedback-contract",
  matchConfigVersion: "test",
  crisisRegexVersion: "test",
  llmProvider: "stub",
  rerankModelId: "stub",
  proseModelId: "stub",
  embeddingModelId: "stub",
  retrievalMode: "keyword",
};

async function main(): Promise<void> {
  const failures: string[] = [];
  checkParser(failures);
  await checkRouteAndStorage(failures);
  checkStaticContracts(failures);

  console.log("Onward resonance feedback validator");
  console.log("===================================");
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`${failures.length} resonance-feedback failure(s).`);
    process.exit(1);
  }
  console.log(`PASS closed parser covers ${RESONANCE_MISS_REASONS.length}/${RESONANCE_MISS_REASONS.length} miss reasons`);
  console.log("PASS account-free memory owner and durable completion gates");
  console.log("PASS concurrent retries are idempotent and conflicting answers do not double-count");
  console.log("PASS bounded feedback stores no disclosure, story prose, or historical fact report");
  console.log("PASS default-deny retention migration and accessible end-state UI contracts");
}

function checkParser(failures: string[]): void {
  const sessionId = "a".repeat(32);
  const close = parseResonanceFeedbackRequest({
    sessionId,
    verdict: "felt_close",
  });
  if ("error" in close) failures.push("valid close verdict was rejected");
  for (const reason of RESONANCE_MISS_REASONS) {
    const parsed = parseResonanceFeedbackRequest({
      sessionId,
      verdict: "not_close",
      reason,
    });
    if ("error" in parsed) failures.push(`${reason}: valid miss reason was rejected`);
  }
  const invalid: unknown[] = [
    null,
    [],
    { sessionId: "short", verdict: "felt_close" },
    { sessionId, verdict: "not_close" },
    { sessionId, verdict: "felt_close", reason: "wrong_feeling" },
    { sessionId, verdict: "not_close", reason: "unknown" },
    { sessionId, verdict: "felt_close", feeling: PRIVATE_DISCLOSURE },
    { sessionId, verdict: "felt_close", storyText: STORY_CANARY },
    { sessionId, verdict: "felt_close", note: "free text" },
    { sessionId, verdict: "felt_close", boundaries: { maxIntensity: "direct" } },
  ];
  if (
    invalid.some((value) => !("error" in parseResonanceFeedbackRequest(value)))
  ) {
    failures.push("parser accepted inconsistent, free-form, or extra feedback fields");
  }
}

async function checkRouteAndStorage(failures: string[]): Promise<void> {
  const incomplete = await makeSession(LOCAL_DEV_USER_ID, false);
  const before = _listResonanceFeedback().length;
  const incompleteResponse = await requestFeedback({
    sessionId: incomplete.sessionId,
    verdict: "felt_close",
  });
  if (
    incompleteResponse.status !== 409 ||
    _listResonanceFeedback().length !== before
  ) {
    failures.push("incomplete story created feedback or returned the wrong status");
  }

  const owner = await makeSession(LOCAL_DEV_USER_ID, true);
  const payload = {
    sessionId: owner.sessionId,
    verdict: "not_close" as const,
    reason: "wrong_feeling" as const,
  };
  const responses = await Promise.all(
    Array.from({ length: 12 }, () => requestFeedback(payload)),
  );
  const rows = _listResonanceFeedback().filter(
    (item) => item.sessionId === owner.sessionId,
  );
  if (
    responses.some((response) => response.status !== 202) ||
    responses.some(
      (response) => response.headers.get("cache-control") !== "no-store",
    ) ||
    rows.length !== 1
  ) {
    failures.push("identical concurrent feedback was not idempotent");
  }
  const conflict = await requestFeedback({
    sessionId: owner.sessionId,
    verdict: "felt_close",
  });
  if (
    conflict.status !== 409 ||
    _listResonanceFeedback().filter(
      (item) => item.sessionId === owner.sessionId,
    ).length !== 1
  ) {
    failures.push("conflicting retry changed or duplicated feedback");
  }

  const stored = rows[0];
  const serialized = JSON.stringify(stored);
  const allowedKeys = new Set([
    "feedbackId",
    "userId",
    "sessionId",
    "artifactId",
    "storySpecId",
    "storySpecVersion",
    "figureKey",
    "stageId",
    "recipeId",
    "policyVersion",
    "verdict",
    "reason",
    "createdAt",
    "expiresAt",
  ]);
  if (
    !stored ||
    stored.policyVersion !== RESONANCE_FEEDBACK_POLICY_VERSION ||
    stored.verdict !== "not_close" ||
    stored.reason !== "wrong_feeling" ||
    Object.keys(stored).some((key) => !allowedKeys.has(key)) ||
    serialized.includes(PRIVATE_DISCLOSURE) ||
    serialized.includes(STORY_CANARY) ||
    /"(?:feeling|storyText|rationale|citation|sourceRefs|prompt|response|boundaries|note)"\s*:/i.test(
      serialized,
    )
  ) {
    failures.push("bounded feedback storage retained a forbidden semantic surface");
  }
  const retentionDays =
    (Date.parse(stored.expiresAt) - Date.parse(stored.createdAt)) / 86_400_000;
  if (Math.abs(retentionDays - RESONANCE_FEEDBACK_RETENTION_DAYS) > 0.001) {
    failures.push("memory feedback retention does not match the documented policy");
  }

  const missing = await requestFeedback({
    sessionId: "0".repeat(32),
    verdict: "felt_close",
  });
  const foreign = await makeSession("foreign-feedback-user", true);
  const foreignResponse = await requestFeedback({
    sessionId: foreign.sessionId,
    verdict: "felt_close",
  });
  if (
    missing.status !== 404 ||
    foreignResponse.status !== 404 ||
    (await missing.text()) !== (await foreignResponse.text())
  ) {
    failures.push("missing and foreign feedback targets exposed an ownership oracle");
  }
  const crossOrigin = await requestFeedback(
    { sessionId: owner.sessionId, verdict: "not_close", reason: "wrong_feeling" },
    "https://attacker.example",
  );
  if (crossOrigin.status !== 403) {
    failures.push("cross-origin feedback submission was accepted");
  }

  const historical = await makeSession(LOCAL_DEV_USER_ID, true);
  const historicalBefore = _listHistoricalConcerns().length;
  const historicalResponse = await requestFeedback({
    sessionId: historical.sessionId,
    verdict: "not_close",
    reason: "historical_concern",
  });
  if (
    historicalResponse.status !== 202 ||
    _listHistoricalConcerns().length !== historicalBefore
  ) {
    failures.push("subjective historical feedback fabricated a fact-level concern report");
  }

  const sessionMap = globalThis.__onwardSessions;
  const expiring = sessionMap?.get(owner.sessionId);
  if (expiring) expiring.createdAt = Date.now() - 2 * 60 * 60 * 1000;
  await getSession(owner.sessionId);
  if (
    _listResonanceFeedback().some((item) => item.sessionId === owner.sessionId)
  ) {
    failures.push("memory session expiry did not cascade feedback deletion");
  }
}

function checkStaticContracts(failures: string[]): void {
  const migration = read("../supabase/migrations/0008_story_feedback.sql");
  const component = read("../components/ResonanceFeedbackCard.tsx");
  const player = read("../components/StoryPlayer.tsx");
  const table = /create table story_feedback \([\s\S]*?\n\);/i.exec(migration)?.[0] ?? "";
  const requiredSql = [
    "alter table story_feedback enable row level security",
    "revoke all on table story_feedback from public, anon, authenticated",
    "revoke all on table story_feedback from service_role",
    "submit_story_feedback",
    "story_feedback_immutable",
    "delete_expired_story_feedback",
    "interval '90 days'",
    "session.next_beat_index < jsonb_array_length",
  ];
  if (
    requiredSql.some((value) => !migration.toLowerCase().includes(value.toLowerCase())) ||
    !table ||
    /\b(feeling|disclosure|story_text|prose|rationale|citation|source_text|prompt|response|free_text|note)\b/i.test(
      table,
    ) ||
    /grant\s+(?:insert|update|delete)[^;]*story_feedback/i.test(migration)
  ) {
    failures.push("feedback migration lacks the bounded default-deny retention contract");
  }
  const requiredUi = [
    "Did this story feel close to what you meant?",
    "<fieldset",
    "<legend",
    'aria-live="polite"',
    'role="alert"',
    "not what you wrote or the story text",
  ];
  if (
    requiredUi.some((value) => !component.includes(value)) ||
    /<textarea|dangerouslySetInnerHTML/i.test(component)
  ) {
    failures.push("feedback card lacks the accessible, bounded, no-free-text contract");
  }
  const afterwordIndex = player.indexOf("<StoryAfterword");
  const feedbackIndex = player.indexOf("<ResonanceFeedbackCard");
  const saveIndex = player.indexOf("<SaveStoriesCard");
  if (
    afterwordIndex < 0 ||
    feedbackIndex < afterwordIndex ||
    saveIndex < feedbackIndex ||
    !player.includes('reachedEnd || phase === "ended"')
  ) {
    failures.push("feedback is not sequenced after provenance and before save at story end");
  }
}

async function makeSession(userId: string, completed: boolean) {
  const stage = {
    ...FIGURE_STAGES[0],
    beats: FIGURE_STAGES[0].beats.map((beat, index) =>
      index === 0 ? { ...beat, text: `${beat.text}\n\n${STORY_CANARY}` } : beat,
    ),
  };
  const spec = buildDraftStorySpec(stage);
  const brief = createResonanceBrief(PRIVATE_DISCLOSURE);
  const artifact = composeCanonicalStoryArtifact({
    storySpec: spec,
    stage,
    matchRecipe: recipe,
    openingCopy: {
      eyebrow: "A story for the difficult middle",
      prefaceLines: ["This story is true.", "Your life is not theirs."],
    },
    framing: "partial",
    resonanceBrief: brief,
    allowDraftSpec: true,
  });
  const sessionId = await createSession({
    userId,
    figureKey: artifact.figureKey,
    stageId: artifact.stageId,
    framing: artifact.framing,
    age: 30,
    feeling: PRIVATE_DISCLOSURE,
    storyRequestContext: createStoryRequestContext({
      boundaries: undefined,
      clarification: undefined,
    }),
    matchRecipe: recipe,
    artifact,
  });
  if (completed) {
    await updateSession(sessionId, {
      nextBeatIndex: artifact.beats.length,
      nextChunkIndex: 0,
    });
  }
  return { sessionId, artifact };
}

async function requestFeedback(
  body: Record<string, unknown>,
  origin = "http://localhost",
): Promise<Response> {
  return feedbackPost(
    new Request("http://localhost/api/story-feedback", {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify(body),
    }),
  );
}

function read(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
