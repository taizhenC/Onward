import "./_smoke-bootstrap";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FACET_PROJECTION_MAX_WORDS,
  FACET_PROJECTION_TEMPLATE_CATALOG,
  FACET_PROJECTION_TEMPLATE_ID_CATALOG,
  FACET_SIGNAL_MAX_ANCHOR_CHARACTERS,
  FACET_SIGNAL_MAX_ANCHORS_PER_LANE,
  FACET_SIGNAL_MAX_OUTPUT_BYTES,
  parseFacetSignalJson,
  resolveFacetQueryText,
  type ValidatedFacetSignal,
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
  checkDormantBoundary();

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

  for (const weakAnchor of ["I", "feel", ","]) {
    const fixture = validFixture();
    fixture.anchors.emotional_core = [weakAnchor];
    expectNull(`weak anchor ${JSON.stringify(weakAnchor)}`, fixture);
  }
  for (const weakAnchor of [
    "2024",
    "now",
    "very",
    "just",
    "again",
    "everything",
  ]) {
    const fixture = validFixture();
    for (const facetType of FACET_TYPES) {
      fixture.anchors[facetType] = [weakAnchor];
      const query = fixture.facetQueries[facetType];
      if (
        query !== null &&
        typeof query === "object" &&
        !Array.isArray(query)
      ) {
        (query as Record<string, unknown>).anchors = [weakAnchor];
      }
    }
    expectNull(
      `numeric or filler anchor ${JSON.stringify(weakAnchor)}`,
      fixture,
      `I feel ${weakAnchor} right now.`,
    );
  }

  const usefulShortAnchors = validFixture();
  usefulShortAnchors.anchors = {
    emotional_core: ["job"],
    decision_shape: ["lost"],
    trigger_event: ["job"],
    agency_state: ["stuck"],
  };
  usefulShortAnchors.facetQueries = {
    emotional_core: {
      templateId: "effort_unrecognized",
      anchors: ["job"],
    },
    decision_shape: {
      templateId: "remain_or_restart",
      anchors: ["lost"],
    },
    trigger_event: {
      templateId: "stability_lost",
      anchors: ["job"],
    },
    agency_state: {
      templateId: "pressure_trapped",
      anchors: ["stuck"],
    },
  };
  check(
    parseFixture(
      usefulShortAnchors,
      "I lost my job and now I feel completely stuck.",
    ) !== null,
    "useful short semantic anchors were rejected",
  );

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
  checkTemplateCatalog();

  for (const facetType of FACET_TYPES) {
    for (const template of FACET_PROJECTION_TEMPLATE_CATALOG[facetType]) {
      expectProjection(
        `${facetType}/${template.templateId}`,
        {
          templateId: template.templateId,
          anchors: [anchorFor(facetType)],
        },
        true,
        facetType,
        template.text,
      );
      for (const wrongFacet of FACET_TYPES) {
        if (wrongFacet === facetType) continue;
        expectProjection(
          `${template.templateId} selected for ${wrongFacet}`,
          {
            templateId: template.templateId,
            anchors: [anchorFor(wrongFacet)],
          },
          false,
          wrongFacet,
        );
      }
    }
  }

  const invalidSelections: Array<[string, unknown]> = [
    [
      "empty projection anchors",
      { templateId: "pressure_overwhelming", anchors: [] },
    ],
    [
      "fabricated projection anchor",
      {
        templateId: "pressure_overwhelming",
        anchors: [PRIVATE_CANARY],
      },
    ],
    [
      "projection anchor outside lane signal anchors",
      {
        templateId: "pressure_overwhelming",
        anchors: ["application was rejected"],
      },
    ],
    [
      "unknown template ID",
      { templateId: "unknown_projection", anchors: ["overwhelmed"] },
    ],
    [
      "wrong-case template ID",
      { templateId: "Pressure_overwhelming", anchors: ["overwhelmed"] },
    ],
    [
      "whitespace-padded template ID",
      { templateId: " pressure_overwhelming", anchors: ["overwhelmed"] },
    ],
    [
      "Unicode-confusable template ID",
      { templateId: "prеssure_overwhelming", anchors: ["overwhelmed"] },
    ],
    [
      "invisible-character template ID",
      { templateId: "pressure_\u200boverwhelming", anchors: ["overwhelmed"] },
    ],
    [
      "wrong-facet template ID",
      { templateId: "continue_or_stop", anchors: ["overwhelmed"] },
    ],
    [
      "provider-authored text",
      {
        text: "Someone felt overwhelmed by pressure they could not resolve.",
        anchors: ["overwhelmed"],
      },
    ],
    [
      "provider text alongside template ID",
      {
        templateId: "pressure_overwhelming",
        text: PRIVATE_CANARY,
        anchors: ["overwhelmed"],
      },
    ],
    ["array projection", []],
    ["string projection", "pressure_overwhelming"],
  ];
  for (const [label, query] of invalidSelections) {
    expectProjection(label, query, false);
  }

  const adversarialProviderText = [
    "Someone felt overwhelmed after a car crashed and a house burned.",
    "Someone walks away whenever overwhelmed.",
    "Someone felt overwhelmed while priya lost a court case.",
    "Someone felt overwhelmed after Pr\u200biya lost a lawsuit.",
    "Someone felt overwhelmed after their startup collapsed.",
    "Someone felt my confidence fading after another attempt.",
    "Someone felt stuck after 2024 changed everything.",
    "Someone felt depression narrowing every possible choice.",
  ];
  for (const text of adversarialProviderText) {
    expectProjection(
      "provider-authored adversarial prose",
      { text, anchors: ["overwhelmed"] },
      false,
    );
  }
}

function checkTemplateCatalog(): void {
  const seenIds = new Set<string>();
  const seenTexts = new Set<string>();
  check(
    Object.isFrozen(FACET_PROJECTION_TEMPLATE_CATALOG),
    "template catalog root is mutable",
  );
  check(
    Object.isFrozen(FACET_PROJECTION_TEMPLATE_ID_CATALOG),
    "provider ID catalog root is mutable",
  );
  for (const facetType of FACET_TYPES) {
    const templates = FACET_PROJECTION_TEMPLATE_CATALOG[facetType];
    const providerIds = FACET_PROJECTION_TEMPLATE_ID_CATALOG[facetType];
    check(Object.isFrozen(templates), `${facetType} template list is mutable`);
    check(
      Object.isFrozen(providerIds),
      `${facetType} provider ID list is mutable`,
    );
    check(templates.length > 0, `${facetType} has no projection templates`);
    check(
      JSON.stringify(providerIds) ===
        JSON.stringify(templates.map(({ templateId }) => templateId)),
      `${facetType} provider ID catalog drifted from the closed templates`,
    );
    check(
      templates.every(({ text }) => !JSON.stringify(providerIds).includes(text)),
      `${facetType} provider ID catalog contains server-owned prose`,
    );
    for (const template of templates) {
      const words =
        template.text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) ??
        [];
      check(Object.isFrozen(template), `${template.templateId} is mutable`);
      check(
        /^[a-z][a-z0-9_]{2,63}$/u.test(template.templateId),
        `${template.templateId} is not a canonical ASCII identifier`,
      );
      check(
        !seenIds.has(template.templateId),
        `${template.templateId} is not globally unique`,
      );
      check(
        !seenTexts.has(template.text),
        `${template.templateId} reuses another template's text`,
      );
      check(
        template.text.trim() === template.text &&
          !/\p{C}/u.test(template.text) &&
          !/[{}\[\]]/u.test(template.text) &&
          template.text.endsWith(".") &&
          (template.text.match(/[.!?]/gu) ?? []).length === 1 &&
          words.length > 0 &&
          words.length <= FACET_PROJECTION_MAX_WORDS,
        `${template.templateId} violates closed sentence invariants`,
      );
      const predicate = template.text.replace(/^\S+\s+/u, "");
      check(
        /^(?:Someone|They|A|An|Something)\b/u.test(template.text) &&
          !/\b\p{Lu}[\p{L}\p{M}\p{N}'’-]{2,}\b/u.test(predicate) &&
          !/\b\d{4}\b/u.test(template.text) &&
          !/\b(?:I|me|my|mine|myself|we|us|our|ours|ourselves)\b/iu.test(
            template.text,
          ) &&
          !/\b(?:adhd|anxiety|bipolar|depress(?:ed|ion|ive)?|diagnos(?:ed|is)|disorder|ocd|ptsd|suicid(?:al|e)|trauma(?:tic)?)\b/iu.test(
            template.text,
          ) &&
          !/(?:https?:\/\/|www\.|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b)/iu.test(
            template.text,
          ) &&
          !/\b(?:should|must|ought to|need to|needs to|try to|you)\b/iu.test(
            template.text,
          ),
        `${template.templateId} violates figure-neutral editorial rules`,
      );
      check(
        /\b(?:felt|carried|feared|faced|changed|ended|had|was|were|stopped|went|failed|disrupted|kept|remained|held|wanted)\b/iu.test(
          template.text,
        ),
        `${template.templateId} is not explicitly past tense`,
      );
      seenIds.add(template.templateId);
      seenTexts.add(template.text);
    }
  }
}

function checkFallbackAndImmutability(): void {
  const signal = parseFixture(validFixture());
  check(signal !== null, "valid fixture unavailable for fallback checks");
  if (!signal) return;

  check(
    resolveFacetQueryText(RAW_FEELING, signal, "emotional_core") ===
      "Someone felt overwhelmed by pressure they could not resolve.",
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
  const forged = { ...signal } as unknown as ValidatedFacetSignal;
  check(
    resolveFacetQueryText(RAW_FEELING, forged, "emotional_core") === RAW_FEELING,
    "structurally forged signal bypassed the runtime validation brand",
  );
  const symbolForged = { ...signal } as Record<PropertyKey, unknown>;
  for (const symbol of Object.getOwnPropertySymbols(signal)) {
    symbolForged[symbol] = (signal as unknown as Record<PropertyKey, unknown>)[
      symbol
    ];
  }
  check(
    resolveFacetQueryText(
      RAW_FEELING,
      symbolForged as unknown as ValidatedFacetSignal,
      "emotional_core",
    ) === RAW_FEELING,
    "copied private symbols bypassed validated-signal identity",
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

  const privateFixture = validFixture();
  for (const facetType of FACET_TYPES) {
    privateFixture.anchors[facetType] = [PRIVATE_CANARY];
    privateFixture.facetQueries[facetType] = {
      templateId:
        FACET_PROJECTION_TEMPLATE_CATALOG[facetType][0]?.templateId ?? "",
      anchors: [PRIVATE_CANARY],
    };
  }
  const privateSignal = parseFixture(
    privateFixture,
    `I am carrying ${PRIVATE_CANARY} through this.`,
  );
  check(
    privateSignal !== null &&
      FACET_TYPES.every((facetType) => {
        const query = privateSignal.facetQueries[facetType];
        return query !== null && !query.text.includes(PRIVATE_CANARY);
      }),
    "raw feeling or anchors were interpolated into server template text",
  );
  check(
    privateSignal !== null &&
      !JSON.stringify(privateSignal.facetQueries).includes(
        "pressure_overwhelming",
      ),
    "provider template ID escaped the validation boundary",
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

function checkDormantBoundary(): void {
  const productionRoots = ["app", "components", "lib"];
  const importers: string[] = [];
  for (const root of productionRoots) {
    for (const path of sourceFiles(join(process.cwd(), root))) {
      if (path.endsWith(`${join("lib", "facet-signal.ts")}`)) continue;
      const source = readFileSync(path, "utf8");
      if (
        /(?:from\s+|import\s*\()\s*["'][^"']*facet-signal["']/u.test(source)
      ) {
        importers.push(path);
      }
    }
  }
  // Reviewed facet-contract importers (2026-08-17 wiring slice): the real-provider adapter
  // (prompt/IDs surface), FacetsRAG retrieval (branded query-text exit), and the closed-template
  // query-vector cache (catalog membership guard). Anything else importing the contract is drift.
  const allowedContractImporters = [
    join(process.cwd(), "lib", "facet-query-embeddings.ts"),
    join(process.cwd(), "lib", "facets-retrieval.ts"),
    join(process.cwd(), "lib", "llm-real.ts"),
  ].sort();
  check(
    importers.length === allowedContractImporters.length &&
      [...importers]
        .sort()
        .every((path, index) => path === allowedContractImporters[index]),
    "facet contract escaped the designated real-provider adapter",
  );
  // The tagger call itself has exactly one reviewed runtime consumer: the env-gated (default
  // off), production-refusing FacetsRAG slice in lib/matching.ts. Served production stays
  // dormant via the llm facade's NODE_ENV hard-off, proven by check-facet-tagger-provider.
  const allowedRuntimeConsumer = join(process.cwd(), "lib", "matching.ts");
  const runtimeConsumers = sourceFiles(join(process.cwd(), "lib"))
    .filter((path) => !path.endsWith(join("lib", "llm.ts")))
    .filter((path) => /\btagAndExpand\s*\(/u.test(readFileSync(path, "utf8")));
  check(
    runtimeConsumers.length === 1 &&
      runtimeConsumers[0] === allowedRuntimeConsumer,
    "dormant facet provider is called by production library code",
  );
}

function sourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...sourceFiles(path));
    } else if (entry.isFile() && /\.(?:ts|tsx)$/u.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

function expectProjection(
  label: string,
  query: unknown,
  expectedValid: boolean,
  facetType: (typeof FACET_TYPES)[number] = "emotional_core",
  expectedText?: string,
): void {
  const fixture = validFixture();
  fixture.facetQueries[facetType] = query;
  const signal = parseFixture(fixture);
  check(signal !== null, `${label} invalidated the entire signal`);
  if (!signal) return;
  const actual = signal.facetQueries[facetType];
  const actualValid = actual !== null;
  check(
    actualValid === expectedValid,
    `${label} was ${actualValid ? "accepted" : "rejected"}`,
  );
  if (expectedText !== undefined) {
    check(
      actual?.text === expectedText,
      `${label} did not resolve to server-owned template text`,
    );
  }
  const unaffectedFacet =
    facetType === "emotional_core" ? "decision_shape" : "emotional_core";
  check(
    signal.facetQueries[unaffectedFacet] !== null,
    `${label} degraded an unrelated valid projection`,
  );
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
        templateId: "pressure_overwhelming",
        anchors: ["overwhelmed"],
      },
      decision_shape: {
        templateId: "continue_or_stop",
        anchors: ["cannot decide"],
      },
      trigger_event: {
        templateId: "effort_rejected",
        anchors: ["application was rejected"],
      },
      agency_state: null,
    },
  };
}

function parseFixture(
  fixture: MutableFixture,
  rawFeeling = RAW_FEELING,
): ValidatedFacetSignal | null {
  return parseFacetSignalJson(JSON.stringify(fixture), rawFeeling);
}

function anchorFor(facetType: (typeof FACET_TYPES)[number]): string {
  return {
    emotional_core: "overwhelmed",
    decision_shape: "cannot decide",
    trigger_event: "application was rejected",
    agency_state: "try again",
  }[facetType];
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
