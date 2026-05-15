import "./_smoke-bootstrap";
import { handleIntake } from "../lib/intake";
import { classifyCrisis } from "../lib/safety";
import { listAll, toClientOutline } from "../lib/figures";
import { _sessionMapSize } from "../lib/session";
import { CHUNK_CHAR_LIMIT, chunkBeatText } from "../lib/chunks";
import type { BeatBlueprint } from "../lib/types";

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

function runMatchAssertion(
  label: string,
  input: { age: number; feeling: string },
  expectedFigureKey: string,
): AssertionResult {
  const before = _sessionMapSize();
  const result = handleIntake(input);

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

function runCrisisAssertion(): AssertionResult {
  const before = _sessionMapSize();
  const result = handleIntake({
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

function main(): void {
  const assertions: AssertionResult[] = [
    runMatchAssertion(
      "match: rejection feeling at 28 → Butler",
      {
        age: 28,
        feeling:
          "I keep getting rejected and I don't know if I should keep trying",
      },
      "butler",
    ),
    runMatchAssertion(
      "match: escape feeling at 21 → Douglass",
      { age: 21, feeling: "I escaped and don't know who I am" },
      "douglass",
    ),
    runMatchAssertion(
      "match: stuck-in-wrong-life at 52 → Lee",
      {
        age: 52,
        feeling: "I'm stuck in the wrong life and don't know how to leave",
      },
      "lee",
    ),
    runCrisisAssertion(),
    runOutlineAssertion(),
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

main();
