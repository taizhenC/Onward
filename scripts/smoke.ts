import "./_smoke-bootstrap";
import { handleIntake } from "../lib/intake";
import type { IntakeContext } from "../lib/intake";
import { classifyCrisis } from "../lib/safety";
import { toClientOutline } from "../lib/figures";
import { FIGURE_STAGES } from "../lib/figures-data";
import { toRerankCandidate } from "../lib/llm";
import {
  _sessionCount,
  acknowledgeOwnedSessionPosition,
  getOwnedSession,
  getSession,
} from "../lib/session";
import { MATCH_LIMITS } from "../lib/rate-limit";
import { resolveRetrievalMode } from "../lib/matching";
import {
  APPROVED_PRODUCTION_RECIPE,
  recipeIdForRetrievalMode,
} from "../lib/match-config";
import { CHUNK_CHAR_LIMIT, chunkBeatText } from "../lib/chunks";
import { NEUTRAL_EYEBROW, sanitizeEyebrow } from "../lib/opening-copy";
import { streamBeat } from "../lib/llm";
import {
  containsDisclosureEcho,
  SAFE_BRIDGE_DISTANCE_LINE,
} from "../lib/story-privacy";
import type { BeatBlueprint } from "../lib/types";

// Smoke always runs in stub mode (provider matrix). getLLM() resolves lazily on the
// first match call, so setting this before main() runs is sufficient.
process.env.LLM_PROVIDER = "stub";
// Sessions + figures from the in-process store/const (no DB) — keeps smoke hermetic.
process.env.PERSISTENCE = "memory";
// An ambient RETRIEVAL_MODE (e.g. facetsrag in a dev shell) would change both the
// intake path and the approved-recipe assertion — pin it out for the same reason.
delete process.env.RETRIEVAL_MODE;

// Fixed request identity for every intake in this run. The whole run shares one
// user, so the rate-limit assertion (which exhausts the 5/hour budget) MUST stay
// last among the intake-driven assertions.
const SMOKE_CTX: IntakeContext = { userId: "smoke-user", ipHash: "smoke-ip" };
const PROGRESS_CTX: IntakeContext = {
  userId: "smoke-progress-user",
  ipHash: "smoke-progress-ip",
};

type AssertionResult = { name: string; ok: boolean; detail: string };

const FORBIDDEN_OUTLINE_KEYS = new Set([
  "text",
  "realChoice",
  "continuationText",
  "decisionContinuations",
  "options",
  "arcVariant",
  "choices",
  "biographicalFacts",
  "shapeSentences",
  "facets",
  "stageLabel",
  "sources",
  "sourceNotes",
]);

const EXPECTED_LINEAR_ROLES = [
  "scene",
  "dark_moment",
  "response",
  "struggle",
  "turning_point",
  "became",
  "bridge",
] as const;

const CRISIS_OVERTRIGGER_PHRASES = [
  "I don't want to kill myself",
  "I'm not suicidal",
  "my friend was suicidal years ago",
  "I won't hurt myself",
  "this isn't a crisis",
  "I want to kill the bug in my code",
  "I almost died laughing",
];

async function runMatchAssertion(
  label: string,
  input: { age: number; feeling: string },
  expectedFigureKey: string,
): Promise<AssertionResult> {
  const before = await _sessionCount();
  const result = await handleIntake(input, SMOKE_CTX);

  if ("error" in result) {
    return { name: label, ok: false, detail: `validation error: ${result.error}` };
  }
  if ("crisis" in result) {
    return {
      name: label,
      ok: false,
      detail: `crisis triggered unexpectedly`,
    };
  }
  if ("rateLimited" in result) {
    return { name: label, ok: false, detail: "rate-limited unexpectedly" };
  }
  if (!("sessionId" in result)) {
    return { name: label, ok: false, detail: "no sessionId in response" };
  }

  const after = await _sessionCount();
  if (after !== before + 1) {
    return {
      name: label,
      ok: false,
      detail: `session map did not grow by 1 (before=${before}, after=${after})`,
    };
  }

  const session = await getSession(result.sessionId);
  if (!session) {
    return {
      name: label,
      ok: false,
      detail: `sessionId=${result.sessionId.slice(0, 8)} not found after creation`,
    };
  }
  if (session.figureKey !== expectedFigureKey) {
    return {
      name: label,
      ok: false,
      detail: `matched figureKey=${session.figureKey}, expected ${expectedFigureKey}`,
    };
  }

  if (
    !session.openingCopy ||
    session.openingCopy.eyebrow.trim().length === 0 ||
    session.openingCopy.eyebrow.includes("\n")
  ) {
    return {
      name: label,
      ok: false,
      detail: "session.openingCopy.eyebrow missing or not a clean single line",
    };
  }

  const prefaceLines = session.openingCopy.prefaceLines;
  if (
    !Array.isArray(prefaceLines) ||
    prefaceLines.length === 0 ||
    prefaceLines.some((line) => line.trim().length === 0)
  ) {
    return {
      name: label,
      ok: false,
      detail: "session.openingCopy.prefaceLines missing, empty, or has a blank line",
    };
  }

  const outline = FIGURE_STAGES.find(
    (stage) => stage.figureKey === expectedFigureKey,
  );
  if (!outline) {
    return {
      name: label,
      ok: false,
      detail: `expected figureKey=${expectedFigureKey} not in library`,
    };
  }

  return {
    name: label,
    ok: true,
    detail: `sessionId=${result.sessionId.slice(0, 8)}…`,
  };
}

async function runCrisisAssertion(): Promise<AssertionResult> {
  const before = await _sessionCount();
  const result = await handleIntake(
    {
      age: 22,
      feeling: "I want to kill myself",
    },
    SMOKE_CTX,
  );
  const after = await _sessionCount();

  if ("error" in result) {
    return {
      name: "crisis: no session created",
      ok: false,
      detail: `validation error: ${result.error}`,
    };
  }
  if (!("crisis" in result) || !result.crisis) {
    return {
      name: "crisis: no session created",
      ok: false,
      detail: "crisis flag not set on response",
    };
  }
  if ("sessionId" in result) {
    return {
      name: "crisis: no session created",
      ok: false,
      detail: "sessionId leaked on a crisis response",
    };
  }
  if (after !== before) {
    return {
      name: "crisis: no session created",
      ok: false,
      detail: `session map changed during crisis (before=${before}, after=${after})`,
    };
  }
  if (!Array.isArray(result.resources) || result.resources.length === 0) {
    return {
      name: "crisis: no session created",
      ok: false,
      detail: "no crisis resources returned",
    };
  }

  return {
    name: "crisis: no session created",
    ok: true,
    detail: `resources=${result.resources.length}, sessions=${after}`,
  };
}

// Ownership chokepoint: a foreign or absent user must read null (the routes' 404),
// indistinguishable from a missing session.
async function runOwnershipAssertion(): Promise<AssertionResult> {
  const name = "ownership: foreign/absent user cannot read a session";
  const result = await handleIntake(
    {
      age: 28,
      feeling: "I keep getting rejected and I don't know if I should keep trying",
    },
    SMOKE_CTX,
  );
  if (!("sessionId" in result)) {
    return { name, ok: false, detail: "intake did not create a session" };
  }

  const owned = await getOwnedSession(result.sessionId, SMOKE_CTX.userId);
  if (!owned) {
    return { name, ok: false, detail: "owner could not read their own session" };
  }
  const foreign = await getOwnedSession(result.sessionId, "someone-else");
  if (foreign) {
    return { name, ok: false, detail: "foreign user could read the session" };
  }
  const absent = await getOwnedSession(result.sessionId, null);
  if (absent) {
    return { name, ok: false, detail: "absent user could read the session" };
  }

  return { name, ok: true, detail: "owner reads; foreign and absent users get null" };
}

async function runAtomicProgressAssertion(): Promise<AssertionResult> {
  const name = "progress: explicit acknowledgement is atomic and owner-scoped";
  const result = await handleIntake(
    {
      age: 28,
      feeling: "I keep getting rejected and I don't know if I should keep trying",
    },
    PROGRESS_CTX,
  );
  if (!("sessionId" in result)) {
    return { name, ok: false, detail: "intake did not create a progress session" };
  }

  const input = {
    sessionId: result.sessionId,
    userId: PROGRESS_CTX.userId,
    expectedBeatIndex: 0,
    expectedChunkIndex: 0,
    nextBeatIndex: 0,
    nextChunkIndex: 1,
  } as const;
  const first = await acknowledgeOwnedSessionPosition(input);
  const repeated = await acknowledgeOwnedSessionPosition(input);
  const stale = await acknowledgeOwnedSessionPosition({
    ...input,
    nextBeatIndex: 1,
    nextChunkIndex: 0,
  });
  const foreign = await acknowledgeOwnedSessionPosition({
    ...input,
    userId: "someone-else",
  });
  const session = await getOwnedSession(result.sessionId, PROGRESS_CTX.userId);

  if (
    first !== "advanced" ||
    repeated !== "already_advanced" ||
    stale !== "conflict" ||
    foreign !== "not_found" ||
    session?.nextBeatIndex !== 0 ||
    session.nextChunkIndex !== 1
  ) {
    return {
      name,
      ok: false,
      detail: `first=${first}, repeat=${repeated}, stale=${stale}, foreign=${foreign}, position=${session?.nextBeatIndex}/${session?.nextChunkIndex}`,
    };
  }

  return {
    name,
    ok: true,
    detail: "advanced once; retry idempotent; stale/foreign writes rejected",
  };
}

async function runStoryCreationKillSwitchAssertion(): Promise<AssertionResult> {
  const name = "safety: story kill switch preserves crisis support and persists nothing";
  const previous = process.env.STORY_CREATION_ENABLED;
  const ctx = { userId: "smoke-disabled-user", ipHash: "smoke-disabled-ip" };
  const before = await _sessionCount();
  try {
    process.env.STORY_CREATION_ENABLED = "false";
    const blocked = await handleIntake(
      { age: 28, feeling: "I feel rejected and uncertain about what comes next" },
      ctx,
    );
    const crisis = await handleIntake(
      { age: 22, feeling: "I want to kill myself" },
      ctx,
    );
    const after = await _sessionCount();
    const ok =
      "temporarilyUnavailable" in blocked &&
      "crisis" in crisis &&
      after === before;
    return {
      name,
      ok,
      detail: ok
        ? "new story blocked; crisis resources still returned; no session created"
        : `blocked=${JSON.stringify(blocked)}, crisis=${"crisis" in crisis}, sessions=${before}/${after}`,
    };
  } finally {
    if (previous === undefined) delete process.env.STORY_CREATION_ENABLED;
    else process.env.STORY_CREATION_ENABLED = previous;
  }
}

function runApprovedRecipeAssertion(): AssertionResult {
  const name = "recipe: production retrieval is explicit and approved";
  const defaultMode = resolveRetrievalMode(undefined, "development");
  const productionMode = resolveRetrievalMode("keyword", "production");
  let autoRejected = false;
  try {
    resolveRetrievalMode("auto", "production");
  } catch {
    autoRejected = true;
  }

  // The frozen recipe id must describe the path that ran: approved id for the
  // approved mode, an explicit unapproved marker for everything else.
  const approvedId = recipeIdForRetrievalMode(
    APPROVED_PRODUCTION_RECIPE.retrievalMode,
  );
  const challengerId = recipeIdForRetrievalMode("facetsrag");
  const ok =
    defaultMode === APPROVED_PRODUCTION_RECIPE.retrievalMode &&
    productionMode === "keyword" &&
    autoRejected &&
    approvedId === APPROVED_PRODUCTION_RECIPE.recipeId &&
    challengerId.startsWith("unapproved-facetsrag");
  return {
    name,
    ok,
    detail: ok
      ? `${APPROVED_PRODUCTION_RECIPE.recipeId}; production auto rejected; unapproved modes stamped`
      : `default=${defaultMode}, production=${productionMode}, autoRejected=${autoRejected}, ids=${approvedId}/${challengerId}`,
  };
}

// MUST run last among intake assertions: it spends the rest of smoke-user's hourly
// budget. Earlier assertions consumed 4 (3 matches + 1 ownership); the 5th here
// still passes, the 6th must come back rate-limited — without a session and without
// blocking crisis.
async function runRateLimitAssertion(): Promise<AssertionResult> {
  const name = `rate limit: intake ${MATCH_LIMITS.userPerHour + 1} of the hour is refused`;
  const input = {
    age: 28,
    feeling: "I keep getting rejected and I don't know if I should keep trying",
  };

  const fifth = await handleIntake(input, SMOKE_CTX);
  if (!("sessionId" in fifth)) {
    return {
      name,
      ok: false,
      detail: `intake ${MATCH_LIMITS.userPerHour} of the hour should still pass`,
    };
  }

  const before = await _sessionCount();
  const sixth = await handleIntake(input, SMOKE_CTX);
  const after = await _sessionCount();
  if (!("rateLimited" in sixth)) {
    return { name, ok: false, detail: "over-budget intake was not rate-limited" };
  }
  if (after !== before) {
    return {
      name,
      ok: false,
      detail: `rate-limited intake changed the session map (before=${before}, after=${after})`,
    };
  }

  const crisis = await handleIntake(
    { age: 22, feeling: "I want to kill myself" },
    SMOKE_CTX,
  );
  if (!("crisis" in crisis)) {
    return {
      name,
      ok: false,
      detail: "crisis did not bypass the rate limit while over budget",
    };
  }

  return {
    name,
    ok: true,
    detail: "limit holds, no session created, crisis still bypasses",
  };
}

function runArcShapeAssertion(): AssertionResult {
  const stages = FIGURE_STAGES;
  if (stages.length === 0) {
    return {
      name: "arc shape: 7 linear beats per figure",
      ok: false,
      detail: "no stages in library",
    };
  }

  for (const stage of stages) {
    if (stage.beats.length !== EXPECTED_LINEAR_ROLES.length) {
      return {
        name: "arc shape: 7 linear beats per figure",
        ok: false,
        detail: `figure=${stage.figureKey} has ${stage.beats.length} beats, expected ${EXPECTED_LINEAR_ROLES.length}`,
      };
    }
    for (let index = 0; index < EXPECTED_LINEAR_ROLES.length; index += 1) {
      const expected = EXPECTED_LINEAR_ROLES[index];
      const actual = stage.beats[index].role;
      if (actual !== expected) {
        return {
          name: "arc shape: 7 linear beats per figure",
          ok: false,
          detail: `figure=${stage.figureKey} beat[${index}] role=${actual}, expected ${expected}`,
        };
      }
    }
    const finalKind = stage.beats[stage.beats.length - 1].kind;
    if (finalKind !== "bridge") {
      return {
        name: "arc shape: 7 linear beats per figure",
        ok: false,
        detail: `figure=${stage.figureKey} final beat kind=${finalKind}, expected bridge`,
      };
    }
  }

  return {
    name: "arc shape: 7 linear beats per figure",
    ok: true,
    detail: `${stages.length} figure(s), all 7-beat linear arcs`,
  };
}

function runOutlineAssertion(): AssertionResult {
  const stages = FIGURE_STAGES;
  if (stages.length === 0) {
    return {
      name: "toClientOutline strips server-only fields",
      ok: false,
      detail: "no stages in library",
    };
  }

  for (const stage of stages) {
    const outline = toClientOutline(stage);
    const violation = findForbiddenKey(outline);
    if (violation) {
      return {
        name: "toClientOutline strips server-only fields",
        ok: false,
        detail: `figure=${stage.figureKey} leaked key=${violation}`,
      };
    }
  }

  return {
    name: "toClientOutline strips server-only fields",
    ok: true,
    detail: `${stages.length} outline(s) audited`,
  };
}

function runRerankCandidateAssertion(): AssertionResult {
  const name = "anti-echo: toRerankCandidate excludes embedded surfaces";
  const stages = FIGURE_STAGES;
  if (stages.length === 0) {
    return { name, ok: false, detail: "no stages in library" };
  }

  const allowedKeys = new Set([
    "figureKey",
    "stageId",
    "displayName",
    "ageMin",
    "ageMax",
    "biographicalFacts",
  ]);

  for (const stage of stages) {
    const candidate = toRerankCandidate(stage);

    const extraKey = Object.keys(candidate).find((key) => !allowedKeys.has(key));
    if (extraKey) {
      return {
        name,
        ok: false,
        detail: `figure=${stage.figureKey} leaked key=${extraKey}`,
      };
    }

    // Content guard: the embedded surfaces (shape sentences, facet text, beat prose)
    // must never ride along into the rerank prompt.
    const serialized = JSON.stringify(candidate);
    const embedded = [
      ...stage.shapeSentences,
      stage.facets.emotionalCore,
      stage.facets.decisionShape,
      stage.facets.triggerEvent,
      stage.facets.agencyState,
      ...stage.beats.map((beat) => beat.text),
    ];
    const leak = embedded.find((text) => text && serialized.includes(text));
    if (leak) {
      return {
        name,
        ok: false,
        detail: `figure=${stage.figureKey} rerank candidate contained embedded (shape/facet/beat) text`,
      };
    }
  }

  return { name, ok: true, detail: `${stages.length} candidate(s) audited` };
}

function runEyebrowGuardAssertion(): AssertionResult {
  const name =
    "opening copy: eyebrow guard yields one clean line or the neutral fallback";
  const cases: Array<{
    label: string;
    raw: string | null;
    displayName: string;
    expectNeutral: boolean;
  }> = [
    { label: "null", raw: null, displayName: "Octavia Butler", expectNeutral: true },
    { label: "blank", raw: "   ", displayName: "Octavia Butler", expectNeutral: true },
    {
      label: "clean line",
      raw: "a weight you carry without setting down",
      displayName: "Octavia Butler",
      expectNeutral: false,
    },
    {
      label: "quoted clean line",
      raw: '"the long wait for a yes"',
      displayName: "Frederick Douglass",
      expectNeutral: false,
    },
    {
      label: "article in figure name is not a leak",
      raw: "the pressure before the next step",
      displayName: "The Buddha",
      expectNeutral: false,
    },
    {
      label: "epithet in figure name is not a leak",
      raw: "a great pressure held quietly",
      displayName: "Catherine the Great",
      expectNeutral: false,
    },
    {
      label: "preamble (multi-line)",
      raw: "Here is the line:\nthe long wait for a yes",
      displayName: "Octavia Butler",
      expectNeutral: true,
    },
    {
      label: "names the figure",
      raw: "what Douglass carried alone",
      displayName: "Frederick Douglass",
      expectNeutral: true,
    },
    {
      label: "too long",
      raw: "x".repeat(120),
      displayName: "Frances Glessner Lee",
      expectNeutral: true,
    },
  ];

  for (const testCase of cases) {
    const out = sanitizeEyebrow(testCase.raw, testCase.displayName);
    const isNeutral = out === NEUTRAL_EYEBROW;
    if (isNeutral !== testCase.expectNeutral) {
      return {
        name,
        ok: false,
        detail: `case "${testCase.label}": expected ${
          testCase.expectNeutral ? "neutral fallback" : "kept line"
        }, got "${out}"`,
      };
    }
    if (!testCase.expectNeutral && (out.includes("\n") || out !== out.trim())) {
      return {
        name,
        ok: false,
        detail: `case "${testCase.label}": kept line not clean: "${out}"`,
      };
    }
  }

  return { name, ok: true, detail: `${cases.length} guard case(s) audited` };
}

function runChunkIntegrityAssertion(): AssertionResult {
  const stages = FIGURE_STAGES;
  let beatCount = 0;
  let chunkCount = 0;

  for (const stage of stages) {
    for (let index = 0; index < stage.beats.length; index += 1) {
      const beat = stage.beats[index];
      const chunks = chunkBeatText(beat);
      beatCount += 1;
      chunkCount += chunks.length;

      if (chunks.length === 0) {
        return {
          name: "chunking: beat text preserved in small chunks",
          ok: false,
          detail: `figure=${stage.figureKey} beat[${index}] produced no chunks`,
        };
      }

      const overLimit = chunks.find((chunk) => chunk.length > CHUNK_CHAR_LIMIT);
      if (overLimit) {
        return {
          name: "chunking: beat text preserved under limit",
          ok: false,
          detail: `figure=${stage.figureKey} beat[${index}] produced ${overLimit.length} char chunk, limit=${CHUNK_CHAR_LIMIT}`,
        };
      }

      const reassembled = chunks.join("\n\n");
      if (normalizeChunkText(reassembled) !== normalizeChunkText(beat.text)) {
        return {
          name: "chunking: beat text preserved under limit",
          ok: false,
          detail: `figure=${stage.figureKey} beat[${index}] did not preserve normalized text`,
        };
      }
    }
  }

  return {
    name: "chunking: beat text preserved under limit",
    ok: true,
    detail: `${beatCount} beat(s), ${chunkCount} chunk(s)`,
  };
}

async function runStoryPrivacyAssertion(): Promise<AssertionResult> {
  const name = "story privacy: canonical and legacy paths never echo disclosure";
  const disclosure =
    "I moved across the country and now I feel completely alone every night";

  for (const stage of FIGURE_STAGES) {
    const text = stage.beats.map((beat) => beat.text).join("\n");
    if (
      text.includes("{feeling}") ||
      /You wrote:/i.test(text) ||
      containsDisclosureEcho(text, disclosure)
    ) {
      return {
        name,
        ok: false,
        detail: `figure=${stage.figureKey} contains a disclosure echo surface`,
      };
    }
  }

  const legacyBeat: BeatBlueprint = {
    kind: "bridge",
    role: "bridge",
    text: 'You wrote: "{feeling}"\n\nThe story continues.',
  };
  let rendered = "";
  for await (const token of streamBeat({ beat: legacyBeat })) rendered += token;

  if (
    rendered.includes("{feeling}") ||
    /You wrote:/i.test(rendered) ||
    !rendered.includes(SAFE_BRIDGE_DISTANCE_LINE)
  ) {
    return {
      name,
      ok: false,
      detail: "legacy bridge sanitizer did not replace the disclosure surface",
    };
  }

  if (
    !containsDisclosureEcho(
      `A preface. ${disclosure}. A coda.`,
      disclosure,
    ) ||
    containsDisclosureEcho(SAFE_BRIDGE_DISTANCE_LINE, disclosure)
  ) {
    return {
      name,
      ok: false,
      detail: "disclosure overlap guard is not classifying exact/safe copy correctly",
    };
  }

  // Word-boundary regression: a disclosure that is a substring of different
  // words ("ice person waits" inside "nice person waits") is not an echo.
  if (
    containsDisclosureEcho("They said a nice person waits", "ice person waits") ||
    !containsDisclosureEcho("They said a nice person waits", "nice person waits")
  ) {
    return {
      name,
      ok: false,
      detail: "overlap guard is not matching on whole-word boundaries",
    };
  }

  // Backstop: a bare placeholder outside the canonical legacy line must never
  // render literally.
  let bareRendered = "";
  const bareBeat: BeatBlueprint = {
    kind: "bridge",
    role: "bridge",
    text: "They kept going through {feeling} and worse.",
  };
  for await (const token of streamBeat({ beat: bareBeat })) bareRendered += token;
  if (bareRendered.includes("{feeling}")) {
    return {
      name,
      ok: false,
      detail: "bare legacy placeholder reached rendered prose",
    };
  }

  return {
    name,
    ok: true,
    detail: `${FIGURE_STAGES.length} stages clean; legacy placeholder sanitized`,
  };
}

function runChunkBehaviorAssertion(): AssertionResult {
  const grouped = chunkBeatText({
    kind: "narrative",
    role: "scene",
    text: "One.\n\nTwo.\n\nThree.",
  } satisfies BeatBlueprint);

  if (grouped.length !== 1 || grouped[0] !== "One.\n\nTwo.\n\nThree.") {
    return {
      name: "chunking: groups short paragraphs and wraps long ones",
      ok: false,
      detail: `expected three short paragraphs to fit in one chunk, got ${grouped.length}`,
    };
  }

  const longText = Array.from({ length: 80 }, (_, index) => `word${index}`).join(
    " ",
  );
  const wrapped = chunkBeatText({
    kind: "narrative",
    role: "scene",
    text: longText,
  } satisfies BeatBlueprint);
  const overLimit = wrapped.find((chunk) => chunk.length > CHUNK_CHAR_LIMIT);

  if (wrapped.length <= 1 || overLimit) {
    return {
      name: "chunking: groups short paragraphs and wraps long ones",
      ok: false,
      detail: overLimit
        ? `wrapped chunk length ${overLimit.length} exceeded limit=${CHUNK_CHAR_LIMIT}`
        : "long paragraph did not wrap into multiple chunks",
    };
  }

  if (normalizeChunkText(wrapped.join("\n\n")) !== normalizeChunkText(longText)) {
    return {
      name: "chunking: groups short paragraphs and wraps long ones",
      ok: false,
      detail: "wrapped long paragraph did not preserve normalized text",
    };
  }

  return {
    name: "chunking: groups short paragraphs and wraps long ones",
    ok: true,
    detail: `short=${grouped.length} chunk, long=${wrapped.length} chunks`,
  };
}

function normalizeChunkText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function findForbiddenKey(value: unknown): string | null {
  if (value === null || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const hit = findForbiddenKey(item);
      if (hit) return hit;
    }
    return null;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_OUTLINE_KEYS.has(key)) return key;
    const hit = findForbiddenKey(child);
    if (hit) return hit;
  }
  return null;
}

function printOverTriggerMap(): void {
  console.log("");
  console.log("Crisis regex over-trigger map (informational, not asserted):");
  console.log(
    "  The Phase 0 regex is intentionally pessimistic. False positives are",
  );
  console.log(
    "  acceptable; false negatives are not. This is the surface to inspect.",
  );
  console.log("");
  for (const phrase of CRISIS_OVERTRIGGER_PHRASES) {
    const result = classifyCrisis(phrase);
    const label = result.crisisDetected ? "FIRES   " : "passes  ";
    console.log(`  [${label}] ${JSON.stringify(phrase)}`);
  }
}

async function main(): Promise<void> {
  const assertions: AssertionResult[] = [
    await runMatchAssertion(
      "match: rejection feeling at 28 → Butler",
      {
        age: 28,
        feeling:
          "I keep getting rejected and I don't know if I should keep trying",
      },
      "butler",
    ),
    await runMatchAssertion(
      "match: escape feeling at 21 → Douglass",
      { age: 21, feeling: "I escaped and don't know who I am" },
      "douglass",
    ),
    await runMatchAssertion(
      "match: stuck-in-wrong-life at 52 → Lee",
      {
        age: 52,
        feeling: "I'm stuck in the wrong life and don't know how to leave",
      },
      "lee",
    ),
    await runCrisisAssertion(),
    await runOwnershipAssertion(),
    await runAtomicProgressAssertion(),
    await runStoryCreationKillSwitchAssertion(),
    runApprovedRecipeAssertion(),
    runOutlineAssertion(),
    runRerankCandidateAssertion(),
    runEyebrowGuardAssertion(),
    runArcShapeAssertion(),
    await runStoryPrivacyAssertion(),
    runChunkIntegrityAssertion(),
    runChunkBehaviorAssertion(),
    // Last on purpose — exhausts smoke-user's hourly budget (see the comment above).
    await runRateLimitAssertion(),
  ];

  console.log("Onward Phase 0 smoke check");
  console.log("==========================");
  console.log("");

  let failed = 0;
  assertions.forEach((assertion, index) => {
    const tag = assertion.ok ? "OK  " : "FAIL";
    const number = `[${index + 1}/${assertions.length}]`;
    console.log(`${number} ${tag}  ${assertion.name}`);
    if (assertion.detail) console.log(`         ${assertion.detail}`);
    if (!assertion.ok) failed += 1;
  });

  printOverTriggerMap();

  console.log("");
  if (failed === 0) {
    console.log(`All ${assertions.length} assertion(s) passed.`);
    process.exit(0);
  }
  console.log(`${failed} assertion(s) failed.`);
  process.exit(1);
}

void main();
