import "./_smoke-bootstrap";
import {
  FACET_PROJECTION_MAX_WORDS,
  FACET_SIGNAL_MAX_ANCHOR_CHARACTERS,
  FACET_SIGNAL_MAX_ANCHORS_PER_LANE,
  FACET_SIGNAL_MAX_OUTPUT_BYTES,
  parseFacetSignalJson,
  resolveFacetQueryText,
  type FacetSignal,
} from "../lib/facet-signal";
import { FACET_TYPES } from "../lib/types";

const RAW_FEELING =
  "I feel overwhelmed after my application was rejected, and I cannot decide whether to try again or walk away.";
const PRIVATE_CANARY = "cobalt-compass-private-canary";

type MutableFixture = {
  confidence: unknown;
  dominantMode: unknown;
  facetImportance: Record<string, unknown>;
  anchors: Record<string, unknown>;
  facetQueries: Record<string, unknown>;
  [key: string]: unknown;
};

const failures: string[] = [];
let assertions = 0;

function main(): void {
  checkValidBoundary();
  checkSignalFailures();
  checkProjectionDegradation();
  checkFallbackAndImmutability();
  checkSilentFailureBoundary();

  console.log("Onward FacetSignal contract");
  console.log("===========================");
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`${failures.length}/${assertions} assertion(s) failed.`);
    process.exit(1);
  }
  console.log(`PASS ${assertions} deterministic assertions`);
  console.log("PASS strict signal rejection and lane-local projection fallback");
  console.log("PASS byte-preserving raw-query fallback and deep freezing");
  console.log("PASS sensitive invalid output remains silent");
}

function checkValidBoundary(): void {
  const fixture = validFixture();
  fixture.confidence = 0.55;
  const signal = parseFixture(fixture);
  check(signal !== null, "confidence boundary 0.55 was rejected");
  if (!signal) return;

  check(
    signal.dominantMode === "emotional_core",
    "dominant mode changed during reconstruction",
  );
  check(
    FACET_TYPES.every(
      (facetType, index) =>
        Object.keys(signal.facetImportance)[index] === facetType &&
        Object.keys(signal.anchors)[index] === facetType &&
        Object.keys(signal.facetQueries)[index] === facetType,
    ),
    "canonical facet ordering was not preserved",
  );

  const first = JSON.stringify(signal);
  const second = JSON.stringify(parseFixture(validFixture()));
  check(first.replace('"confidence":0.55', '"confidence":0.8') === second,
    "same fixture did not reconstruct byte-identically");

  const allNull = validFixture();
  for (const facetType of FACET_TYPES) allNull.facetQueries[facetType] = null;
  const signalWithoutProjections = parseFixture(allNull);
  check(
    signalWithoutProjections !== null &&
      FACET_TYPES.every(
        (facetType) => signalWithoutProjections.facetQueries[facetType] === null,
      ),
    "valid signal with all projections null was rejected",
  );
}

function checkSignalFailures(): void {
  const lowConfidence = validFixture();
  lowConfidence.confidence = 0.549999;
  expectNull("confidence below 0.55", lowConfidence);

  const oneLane = validFixture();
  oneLane.facetImportance = {
    emotional_core: 1,
    decision_shape: 0.299999,
    trigger_event: 0.1,
    agency_state: 0,
  };
  expectNull("single important lane", oneLane);

  for (const [label, value] of [
    ["negative importance", -0.01],
    ["importance above one", 1.01],
    ["string importance", "0.8"],
    ["null importance", null],
  ] as const) {
    const fixture = validFixture();
    fixture.facetImportance.emotional_core = value;
    expectNull(label, fixture);
  }

  const missingImportance = validFixture();
  delete missingImportance.facetImportance.agency_state;
  expectNull("missing importance facet", missingImportance);

  const extraImportance = validFixture();
  extraImportance.facetImportance.shape = 0.4;
  expectNull("extra importance facet", extraImportance);

  const extraTopLevel = validFixture();
  extraTopLevel.rawFeeling = PRIVATE_CANARY;
  expectNull("extra top-level field", extraTopLevel);

  const wrongMode = validFixture();
  wrongMode.dominantMode = "shape";
  expectNull("unknown dominant mode", wrongMode);

  const missingQueryLane = validFixture();
  delete missingQueryLane.facetQueries.trigger_event;
  expectNull("missing query lane", missingQueryLane);

  const arrayQueries = validFixture();
  arrayQueries.facetQueries = [] as unknown as Record<string, unknown>;
  expectNull("array query record", arrayQueries);

  const emptyImportantAnchor = validFixture();
  emptyImportantAnchor.anchors.emotional_core = [];
  expectNull("empty important-lane anchors", emptyImportantAnchor);

  const whitespaceAnchor = validFixture();
  whitespaceAnchor.anchors.emotional_core = [" "];
  expectNull("whitespace-only anchor", whitespaceAnchor);

  const untrimmedAnchor = validFixture();
  untrimmedAnchor.anchors.emotional_core = [" overwhelmed"];
  expectNull("untrimmed anchor", untrimmedAnchor);

  const duplicateAnchor = validFixture();
  duplicateAnchor.anchors.emotional_core = ["overwhelmed", "overwhelmed"];
  expectNull("duplicate anchor", duplicateAnchor);

  const fabricatedAnchor = validFixture();
  fabricatedAnchor.anchors.emotional_core = ["PRIVATE_CANARY"];
  expectNull("fabricated anchor", fabricatedAnchor);

  const caseChangedAnchor = validFixture();
  caseChangedAnchor.anchors.emotional_core = ["Overwhelmed"];
  expectNull("case-changed anchor", caseChangedAnchor);

  const unicodeAnchor = validFixture();
  unicodeAnchor.anchors.emotional_core = ["cafe\u0301"];
  expectNull(
    "Unicode-normalized rather than verbatim anchor",
    unicodeAnchor,
    `${RAW_FEELING} café`,
  );

  const tooManyAnchors = validFixture();
  tooManyAnchors.anchors.emotional_core = Array.from(
    { length: FACET_SIGNAL_MAX_ANCHORS_PER_LANE + 1 },
    () => "overwhelmed",
  );
  expectNull("too many anchors", tooManyAnchors);

  const oversizedAnchor = validFixture();
  oversizedAnchor.anchors.emotional_core = [
    "x".repeat(FACET_SIGNAL_MAX_ANCHOR_CHARACTERS + 1),
  ];
  expectNull("oversized anchor", oversizedAnchor);

  expectRawNull("malformed JSON", "{");
  expectRawNull("JSON null", "null");
  expectRawNull("JSON array", "[]");
  expectRawNull("code-fenced JSON", "```json\n{}\n```");
  expectRawNull(
    "non-finite exponent",
    JSON.stringify(validFixture()).replace(
      '"confidence":0.8',
      '"confidence":1e400',
    ),
  );
  expectRawNull(
    "NaN token",
    JSON.stringify(validFixture()).replace(
      '"confidence":0.8',
      '"confidence":NaN',
    ),
  );
  expectRawNull(
    "oversized provider output",
    " ".repeat(FACET_SIGNAL_MAX_OUTPUT_BYTES + 1),
  );
}

function checkProjectionDegradation(): void {
  const exactlyAtLimit = projectionWithWordCount(FACET_PROJECTION_MAX_WORDS);
  expectProjection(
    "32-word projection",
    { text: exactlyAtLimit, anchors: ["overwhelmed"] },
    true,
  );
  expectProjection(
    "33-word projection",
    {
      text: projectionWithWordCount(FACET_PROJECTION_MAX_WORDS + 1),
      anchors: ["overwhelmed"],
    },
    false,
  );

  const cases: Array<[string, unknown]> = [
    [
      "empty projection anchors",
      {
        text: "Someone felt overwhelmed by another closed door.",
        anchors: [],
      },
    ],
    [
      "fabricated projection anchor",
      {
        text: "Someone felt overwhelmed by another closed door.",
        anchors: [PRIVATE_CANARY],
      },
    ],
    [
      "projection anchor outside lane signal anchors",
      {
        text: "Someone felt overwhelmed by another closed door.",
        anchors: ["application was rejected"],
      },
    ],
    [
      "first-person projection",
      {
        text: "Someone felt my confidence fading after another attempt.",
        anchors: ["overwhelmed"],
      },
    ],
    [
      "four-digit year",
      {
        text: "Someone felt stuck after 2024 changed everything.",
        anchors: ["overwhelmed"],
      },
    ],
    [
      "diagnosis vocabulary",
      {
        text: "Someone felt depression narrowing every possible choice.",
        anchors: ["overwhelmed"],
      },
    ],
    [
      "present tense",
      {
        text: "Someone feels unable to trust another attempt.",
        anchors: ["overwhelmed"],
      },
    ],
    [
      "future tense",
      {
        text: "Someone will feel unable to trust another attempt.",
        anchors: ["overwhelmed"],
      },
    ],
    [
      "proper name",
      {
        text: "Someone felt rejected while Priya moved forward.",
        anchors: ["overwhelmed"],
      },
    ],
    [
      "unsubstantiated concrete event",
      {
        text: "Someone felt alone after her father died.",
        anchors: ["overwhelmed"],
      },
    ],
    [
      "non-neutral subject",
      {
        text: "A worker felt unable to trust another attempt.",
        anchors: ["overwhelmed"],
      },
    ],
    [
      "multiple sentences",
      {
        text: "Someone felt rejected. They tried again.",
        anchors: ["overwhelmed"],
      },
    ],
    [
      "multiline sentence",
      {
        text: "Someone felt rejected,\nbut they tried again.",
        anchors: ["overwhelmed"],
      },
    ],
    [
      "quotation marks",
      {
        text: 'Someone felt "trapped" after another refusal.',
        anchors: ["overwhelmed"],
      },
    ],
    [
      "URL",
      {
        text: "Someone felt rejected after https://example.com responded.",
        anchors: ["overwhelmed"],
      },
    ],
    [
      "untrimmed projection",
      {
        text: " Someone felt overwhelmed by another closed door.",
        anchors: ["overwhelmed"],
      },
    ],
    [
      "extra projection field",
      {
        text: "Someone felt overwhelmed by another closed door.",
        anchors: ["overwhelmed"],
        explanation: PRIVATE_CANARY,
      },
    ],
    ["array projection", []],
    ["string projection", "Someone felt overwhelmed."],
  ];

  for (const [label, query] of cases) {
    expectProjection(label, query, false);
  }

  expectProjection(
    "approved multi-word neutral subject",
    {
      text: "The person felt overwhelmed by another closed door.",
      anchors: ["overwhelmed"],
    },
    true,
  );
}

function checkFallbackAndImmutability(): void {
  const signal = parseFixture(validFixture());
  check(signal !== null, "valid fixture unavailable for fallback checks");
  if (!signal) return;

  check(
    resolveFacetQueryText(RAW_FEELING, signal, "emotional_core") ===
      "Someone felt overwhelmed after their effort was rejected.",
    "valid projection did not route to its facet lane",
  );
  check(
    resolveFacetQueryText(RAW_FEELING, signal, "agency_state") === RAW_FEELING,
    "null facet projection did not preserve raw feeling byte-for-byte",
  );
  check(
    resolveFacetQueryText(RAW_FEELING, null, "emotional_core") === RAW_FEELING,
    "null signal did not preserve raw feeling byte-for-byte",
  );

  check(Object.isFrozen(signal), "signal root is mutable");
  check(Object.isFrozen(signal.facetImportance), "importance record is mutable");
  check(Object.isFrozen(signal.anchors), "anchor record is mutable");
  check(
    FACET_TYPES.every((facetType) => Object.isFrozen(signal.anchors[facetType])),
    "an anchor list is mutable",
  );
  check(Object.isFrozen(signal.facetQueries), "query record is mutable");
  check(
    FACET_TYPES.every((facetType) => {
      const query = signal.facetQueries[facetType];
      return (
        query === null ||
        (Object.isFrozen(query) && Object.isFrozen(query.anchors))
      );
    }),
    "a projection or projection-anchor list is mutable",
  );
}

function checkSilentFailureBoundary(): void {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const captured: string[] = [];
  console.log = (...values: unknown[]) => captured.push(values.join(" "));
  console.warn = (...values: unknown[]) => captured.push(values.join(" "));
  console.error = (...values: unknown[]) => captured.push(values.join(" "));
  try {
    parseFacetSignalJson(
      `{"rawFeeling":"${PRIVATE_CANARY}","malformed":true}`,
      `${RAW_FEELING} ${PRIVATE_CANARY}`,
    );
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }
  check(
    captured.length === 0 &&
      captured.every((line) => !line.includes(PRIVATE_CANARY)),
    "invalid sensitive output was written to the console",
  );
}

function expectProjection(
  label: string,
  query: unknown,
  expectedValid: boolean,
): void {
  const fixture = validFixture();
  fixture.facetQueries.emotional_core = query;
  const signal = parseFixture(fixture);
  check(signal !== null, `${label} invalidated the entire signal`);
  if (!signal) return;
  const actualValid = signal.facetQueries.emotional_core !== null;
  check(
    actualValid === expectedValid,
    `${label} was ${actualValid ? "accepted" : "rejected"}`,
  );
  check(
    signal.facetQueries.decision_shape !== null,
    `${label} degraded an unrelated valid projection`,
  );
}

function projectionWithWordCount(wordCount: number): string {
  const words = ["Someone", "felt"];
  while (words.length < wordCount) words.push("uncertain");
  return `${words.join(" ")}.`;
}

function validFixture(): MutableFixture {
  return {
    confidence: 0.8,
    dominantMode: "emotional_core",
    facetImportance: {
      emotional_core: 0.8,
      decision_shape: 0.7,
      trigger_event: 0.4,
      agency_state: 0.2,
    },
    anchors: {
      emotional_core: ["overwhelmed"],
      decision_shape: ["cannot decide"],
      trigger_event: ["application was rejected"],
      agency_state: ["try again"],
    },
    facetQueries: {
      emotional_core: {
        text: "Someone felt overwhelmed after their effort was rejected.",
        anchors: ["overwhelmed"],
      },
      decision_shape: {
        text: "They faced whether to try again or walk away.",
        anchors: ["cannot decide"],
      },
      trigger_event: {
        text: "A person saw an effort rejected after hoping it would work.",
        anchors: ["application was rejected"],
      },
      agency_state: null,
    },
  };
}

function parseFixture(
  fixture: MutableFixture,
  rawFeeling = RAW_FEELING,
): FacetSignal | null {
  return parseFacetSignalJson(JSON.stringify(fixture), rawFeeling);
}

function expectNull(
  label: string,
  fixture: MutableFixture,
  rawFeeling = RAW_FEELING,
): void {
  check(parseFixture(fixture, rawFeeling) === null, `${label} was accepted`);
}

function expectRawNull(label: string, rawOutput: string): void {
  check(
    parseFacetSignalJson(rawOutput, RAW_FEELING) === null,
    `${label} was accepted`,
  );
}

function check(condition: boolean, label: string): void {
  assertions += 1;
  if (!condition) failures.push(label);
}

void main();
