import "./_smoke-bootstrap";
import { handleIntake } from "../lib/intake";
import { classifyCrisis } from "../lib/safety";
import { listAll, toClientOutline } from "../lib/figures";
import { toRerankCandidate } from "../lib/llm";
import { _sessionMapSize, getSession } from "../lib/session";
import { CHUNK_CHAR_LIMIT, chunkBeatText } from "../lib/chunks";
import { NEUTRAL_EYEBROW, sanitizeEyebrow } from "../lib/opening-copy";
import type { BeatBlueprint } from "../lib/types";

// Smoke always runs in stub mode (provider matrix). getLLM() resolves lazily on the
// first match call, so setting this before main() runs is sufficient.
process.env.LLM_PROVIDER = "stub";

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
  const before = _sessionMapSize();
  const result = await handleIntake(input);

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
  if (!("sessionId" in result)) {
    return { name: label, ok: false, detail: "no sessionId in response" };
  }

  const after = _sessionMapSize();
  if (after !== before + 1) {
    return {
      name: label,
      ok: false,
      detail: `session map did not grow by 1 (before=${before}, after=${after})`,
    };
  }

  const session = getSession(result.sessionId);
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

  const outline = listAll().find(
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
  const before = _sessionMapSize();
  const result = await handleIntake({
    age: 22,
    feeling: "I want to kill myself",
  });
  const after = _sessionMapSize();

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

function runArcShapeAssertion(): AssertionResult {
  const stages = listAll();
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
  const stages = listAll();
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
  const stages = listAll();
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
  const stages = listAll();
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
    runOutlineAssertion(),
    runRerankCandidateAssertion(),
    runEyebrowGuardAssertion(),
    runArcShapeAssertion(),
    runChunkIntegrityAssertion(),
    runChunkBehaviorAssertion(),
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
