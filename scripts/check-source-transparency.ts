import "./_smoke-bootstrap";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  POST as historicalConcernPost,
} from "../app/api/historical-concern/route";
import { parseHistoricalConcernRequest } from "../lib/historical-concern-request";
import { LOCAL_DEV_USER_ID } from "../lib/auth";
import { FIGURE_STAGES } from "../lib/figures-data";
import {
  _listHistoricalConcerns,
} from "../lib/historical-concerns";
import {
  HYBRID_BRIDGE_TEMPLATE_IDS,
  HYBRID_PLAN_SCHEMA_VERSION,
  HYBRID_TRANSITION_TEMPLATE_IDS,
} from "../lib/hybrid-composition";
import {
  PRIMARY_PRESSURES,
  RESONANCE_BRIEF_VERSION,
  createResonanceBrief,
  type PrimaryPressure,
} from "../lib/resonance-brief";
import { STORY_PROMPT_VERSION_V1 } from "../lib/llm-recipe-constants";
import {
  DEFAULT_PREFACE_LINES,
  NEUTRAL_EYEBROW,
} from "../lib/opening-copy";
import { READER_BRIDGE_SENTENCES } from "../lib/reader-bridge-copy";
import { createSession } from "../lib/session";
import { createStoryRequestContext } from "../lib/story-request-context";
import {
  composeCanonicalStoryArtifact,
  composeHybridStoryArtifact,
  StoryCompositionError,
  storyArtifactContentHash,
  validateStoredStoryArtifact,
  validateStoryArtifact,
  type StoredStoryArtifactEnvelope,
} from "../lib/story-artifact";
import { HYBRID_STORY_ARTIFACT_SCHEMA_VERSION } from "../lib/story-artifact-types";
import { validateStorySpec } from "../lib/story-spec";
import {
  inspectPublishedStorySpecRows,
  parsePublishedStorySpecRow,
  parseStorySpecRow,
} from "../lib/story-spec-repository";
import type { StorySpec } from "../lib/story-spec-types";
import { createTelemetryFlowId } from "../lib/telemetry";
import { APPROVED_PRODUCTION_RECIPE } from "../lib/match-config";
import type { MatchRecipe } from "../lib/types";
import { buildPublishedStorySpecFixture } from "./_story-spec-fixtures";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";

const PRIVATE_DISCLOSURE =
  "Avery left Montréal in 2025 with a private vermilion astrolabe after the eighth closed door.";

const recipe: MatchRecipe = {
  recipeId: APPROVED_PRODUCTION_RECIPE.recipeId,
  matchConfigVersion: APPROVED_PRODUCTION_RECIPE.matchConfigVersion,
  crisisRegexVersion: "test",
  llmProvider: "stub",
  rerankModelId: "stub",
  proseModelId: "stub",
  embeddingModelId: "stub",
  retrievalMode: "keyword",
  resonanceBriefVersion: RESONANCE_BRIEF_VERSION,
  storyPromptVersion: STORY_PROMPT_VERSION_V1,
};

async function main(): Promise<void> {
  const failures: string[] = [];
  const fixture = makeFixture();

  checkPublishedProjection(fixture, failures);
  checkBridgeEvidenceClassification(fixture, failures);
  checkQuoteEvidenceClosure(fixture, failures);
  checkRationalePrivacy(failures);
  checkTamperAndLegacyReplay(fixture, failures);
  await checkHistoricalConcernFlow(failures);
  checkStaticContracts(failures);

  console.log("Onward source transparency validator");
  console.log("====================================");
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`${failures.length} source-transparency failure(s).`);
    process.exit(1);
  }
  console.log("PASS published rationale, StorySpec identity, evidence, sources, and quote traceability");
  console.log(`PASS ${PRIMARY_PRESSURES.length}/${PRIMARY_PRESSURES.length} controlled rationales exclude disclosure data`);
  console.log("PASS v5 tamper rejection and immutable v1-v4 replay boundary");
  console.log("PASS owner-scoped bounded reports are private and idempotent");
  console.log("PASS migration, API, and accessible end-of-story surface contracts");
}

type Fixture = ReturnType<typeof makeFixture>;

function makeFixture(pressure: PrimaryPressure = "rejection") {
  const stage = FIGURE_STAGES[0];
  const storySpec = buildPublishedStorySpecFixture(stage);
  const resonanceBrief = createResonanceBrief(
    PRIVATE_DISCLOSURE,
    undefined,
    pressure,
  );
  const artifact = composeCanonicalStoryArtifact({
    storySpec,
    stage,
    matchRecipe: recipe,
    openingCopy: {
      eyebrow: NEUTRAL_EYEBROW,
      prefaceLines: DEFAULT_PREFACE_LINES,
    },
    framing: "partial",
    resonanceBrief,
    now: new Date("2026-07-10T12:00:00.000Z"),
  });
  return { stage, storySpec, resonanceBrief, artifact };
}

function checkPublishedProjection(fixture: Fixture, failures: string[]): void {
  const { artifact, storySpec, resonanceBrief } = fixture;
  const transparency = artifact.transparency;
  const specValidation = validateStorySpec(storySpec, { forPublish: true });
  if (!specValidation.valid) {
    failures.push(`published fixture is invalid: ${specValidation.errors.join("; ")}`);
    return;
  }
  checkPublishedHydration(storySpec, failures);
  if (
    !transparency ||
    transparency.provenance.status !== "editorially_reviewed" ||
    transparency.provenance.reviewedAt !== storySpec.review.reviewedAt ||
    transparency.storySpec.storySpecId !== storySpec.storySpecId ||
    transparency.storySpec.version !== storySpec.version ||
    transparency.storySpec.schemaVersion !== storySpec.schemaVersion ||
    transparency.sources.length !== storySpec.sources.length ||
    transparency.facts.length !== 6 ||
    transparency.quotes.length !== 3 ||
    !Object.isFrozen(transparency) ||
    !Object.isFrozen(transparency.facts)
  ) {
    failures.push("published artifact omitted or weakened its immutable transparency projection");
    return;
  }
  if (
    !validateStoredStoryArtifact(structuredClone(artifact)) ||
    !validateStoryArtifact(artifact, storySpec, resonanceBrief).valid
  ) {
    failures.push("published transparency failed stored or StorySpec-aware validation");
  }
  const quoteStatuses = new Set(transparency.quotes.map((quote) => quote.status));
  if (
    !quoteStatuses.has("verbatim") ||
    !quoteStatuses.has("paraphrase") ||
    !quoteStatuses.has("disputed") ||
    transparency.quotes.some(
      (quote) =>
        quote.sourceRefs.length === 0 ||
        quote.sourceRefs.some(
          (ref) => ref.scope === "broad" || !ref.locator,
        ),
    )
  ) {
    failures.push("public quote status or evidence traceability is incomplete");
  }
  if (
    !transparency.beats.some(
      (beat) => beat.evidenceClass === "documented_with_interpretation",
    ) ||
    !transparency.beats.some(
      (beat) => beat.evidenceClass === "qualified_historical_evidence",
    ) ||
    transparency.beats.at(-1)?.evidenceClass !== "reader_bridge" ||
    transparency.facts.some(
      (fact) =>
        fact.sourceRefs.length === 0 ||
        fact.sourceRefs.some((ref) => ref.scope === "broad" || !ref.locator),
    )
  ) {
    failures.push("passage evidence classes or fact-to-source links are incomplete");
  }
  if (
    transparency.beats.some((beat, index) => {
      const specBeat = storySpec.arc[index];
      return (
        !specBeat ||
        !sameSet(beat.factIds, [
          ...specBeat.requiredFactIds,
          ...specBeat.optionalFactIds,
        ]) ||
        !sameSet(beat.quoteIds, specBeat.quoteIds)
      );
    })
  ) {
    failures.push("public passage evidence diverged from the validated StorySpec closure");
  }

  const hybrid = composeHybridStoryArtifact({
    storySpec,
    stage: fixture.stage,
    matchRecipe: recipe,
    openingCopy: artifact.openingCopy,
    framing: "partial",
    resonanceBrief,
    plan: {
      schemaVersion: HYBRID_PLAN_SCHEMA_VERSION,
      transitionRole: "struggle",
      transitionTemplateId: HYBRID_TRANSITION_TEMPLATE_IDS[0],
      bridgeTemplateId: HYBRID_BRIDGE_TEMPLATE_IDS[0],
    },
    attemptCount: 1,
  });
  if (
    !validateStoredStoryArtifact(structuredClone(hybrid)) ||
    hybrid.transparency?.beats.find((beat) => beat.role === "struggle")
      ?.hasPersonalizedTransition !== true ||
    hybrid.transparency?.beats.find((beat) => beat.role === "bridge")
      ?.hasPersonalizedTransition !== false
  ) {
    failures.push("hybrid connective wording was not separated from historical evidence");
  }

  const unsafeSpec = structuredClone(storySpec);
  unsafeSpec.sources[0].url = "javascript:alert(1)";
  if (validateStorySpec(unsafeSpec, { forPublish: true }).valid) {
    failures.push("StorySpec validation accepted an unsafe source URL");
  }
  const credentialSpec = structuredClone(storySpec);
  credentialSpec.sources[0].url = "https://user:secret@example.test/archive";
  if (validateStorySpec(credentialSpec, { forPublish: true }).valid) {
    failures.push("StorySpec validation accepted credentials in a source URL");
  }

  const blockedInterpretation = structuredClone(storySpec);
  blockedInterpretation.interpretations[0].allowed = false;
  const blockedValidation = validateStoryArtifact(
    artifact,
    blockedInterpretation,
    resonanceBrief,
  );
  if (
    blockedValidation.valid ||
    !blockedValidation.failureReasons.includes("story_spec_invalid")
  ) {
    failures.push("artifact validation accepted a disallowed mapped interpretation");
  }
  try {
    composeCanonicalStoryArtifact({
      storySpec: blockedInterpretation,
      stage: fixture.stage,
      matchRecipe: recipe,
      openingCopy: artifact.openingCopy,
      framing: "partial",
      resonanceBrief,
    });
    failures.push("canonical composition accepted a disallowed mapped interpretation");
  } catch (error) {
    if (
      !(error instanceof StoryCompositionError) ||
      !error.reasons.includes("story_spec_invalid")
    ) {
      failures.push("invalid evidence closure escaped the closed composition error");
    }
  }
}

function checkBridgeEvidenceClassification(
  fixture: Fixture,
  failures: string[],
): void {
  const mixedSpec = structuredClone(fixture.storySpec);
  const mixedBridge = mixedSpec.arc.at(-1);
  const bridgeFact = mixedSpec.facts.at(-1);
  if (!mixedBridge || !bridgeFact) {
    failures.push("reviewed fixture is missing bridge-classification inputs");
    return;
  }
  mixedBridge.canonicalText = [
    bridgeFact.statement,
    ...READER_BRIDGE_SENTENCES,
  ].join(" ");
  mixedBridge.requiredFactIds = [bridgeFact.factId];
  mixedBridge.optionalFactIds = [];
  mixedBridge.sentenceEvidence = [
    {
      sentenceIndex: 0,
      treatment: "historical_claim",
      factIds: [bridgeFact.factId],
      interpretationIds: [],
      quoteIds: [],
    },
    ...READER_BRIDGE_SENTENCES.map((_, sentenceIndex) => ({
      sentenceIndex: sentenceIndex + 1,
      treatment: "reader_bridge" as const,
      factIds: [],
      interpretationIds: [],
      quoteIds: [],
    })),
  ];
  const mixedValidation = validateStorySpec(mixedSpec, {
    forPublish: true,
  });
  if (!mixedValidation.valid) {
    failures.push(
      `mixed historical bridge was rejected: ${mixedValidation.errors.join("; ")}`,
    );
    return;
  }
  const mixedArtifact = composeCanonicalStoryArtifact({
    storySpec: mixedSpec,
    stage: fixture.stage,
    matchRecipe: recipe,
    openingCopy: fixture.artifact.openingCopy,
    framing: "partial",
    resonanceBrief: fixture.resonanceBrief,
  });
  const projectedBridge = mixedArtifact.transparency?.beats.at(-1);
  if (
    projectedBridge?.evidenceClass !== "documented_scene" ||
    !projectedBridge.factIds.includes(bridgeFact.factId)
  ) {
    failures.push(
      "mixed bridge history was projected publicly as unsupported reflection",
    );
  }

  const unsupportedSpec = structuredClone(fixture.storySpec);
  const unsupportedBridge = unsupportedSpec.arc.at(-1);
  if (!unsupportedBridge) {
    failures.push("reviewed fixture is missing its bridge");
    return;
  }
  unsupportedBridge.canonicalText =
    "In 2007, the project won an unsupported award.";
  unsupportedBridge.sentenceEvidence = [
    {
      sentenceIndex: 0,
      treatment: "reader_bridge",
      factIds: [],
      interpretationIds: [],
      quoteIds: [],
    },
  ];
  const unsupportedValidation = validateStorySpec(unsupportedSpec, {
    forPublish: true,
  });
  if (
    unsupportedValidation.valid ||
    !unsupportedValidation.errors.some((error) =>
      error.includes("reviewed reader copy"),
    )
  ) {
    failures.push("unsupported bridge history escaped reader-copy validation");
  }
  try {
    composeCanonicalStoryArtifact({
      storySpec: unsupportedSpec,
      stage: fixture.stage,
      matchRecipe: recipe,
      openingCopy: fixture.artifact.openingCopy,
      framing: "partial",
      resonanceBrief: fixture.resonanceBrief,
    });
    failures.push("canonical composition accepted unsupported bridge history");
  } catch (error) {
    if (
      !(error instanceof StoryCompositionError) ||
      !error.reasons.includes("story_spec_invalid")
    ) {
      failures.push(
        "unsupported bridge history escaped the closed composition error",
      );
    }
  }
}

function checkQuoteEvidenceClosure(
  fixture: Fixture,
  failures: string[],
): void {
  const ghostQuoteSpec = structuredClone(fixture.storySpec);
  ghostQuoteSpec.arc[0].quoteIds.push("quote-verbatim");
  const ghostValidation = validateStorySpec(ghostQuoteSpec, {
    forPublish: true,
  });
  if (
    ghostValidation.valid ||
    !ghostValidation.errors.some((error) =>
      error.includes("without sentence evidence"),
    )
  ) {
    failures.push("a passage could claim a quote it never used");
  }
  const artifactValidation = validateStoryArtifact(
    fixture.artifact,
    ghostQuoteSpec,
    fixture.resonanceBrief,
  );
  if (
    artifactValidation.valid ||
    !artifactValidation.failureReasons.includes("story_spec_invalid")
  ) {
    failures.push("artifact validation accepted a ghost quote attribution");
  }
  try {
    composeCanonicalStoryArtifact({
      storySpec: ghostQuoteSpec,
      stage: fixture.stage,
      matchRecipe: recipe,
      openingCopy: fixture.artifact.openingCopy,
      framing: "partial",
      resonanceBrief: fixture.resonanceBrief,
    });
    failures.push("canonical composition accepted a ghost quote attribution");
  } catch (error) {
    if (
      !(error instanceof StoryCompositionError) ||
      !error.reasons.includes("story_spec_invalid")
    ) {
      failures.push(
        "ghost quote attribution escaped the closed composition error",
      );
    }
  }

  const wrongSentenceSpec = structuredClone(fixture.storySpec);
  const quoteBeat = wrongSentenceSpec.arc[2];
  const factId = quoteBeat.requiredFactIds[0];
  quoteBeat.canonicalText =
    'The record preserves the words "We began again." Work resumed.';
  quoteBeat.sentenceEvidence = [
    {
      sentenceIndex: 0,
      treatment: "historical_claim",
      factIds: [factId],
      interpretationIds: [],
      quoteIds: [],
    },
    {
      sentenceIndex: 1,
      treatment: "historical_claim",
      factIds: [factId],
      interpretationIds: [],
      quoteIds: ["quote-verbatim"],
    },
  ];
  const wrongSentenceValidation = validateStorySpec(wrongSentenceSpec, {
    forPublish: true,
  });
  if (
    wrongSentenceValidation.valid ||
    !wrongSentenceValidation.errors.some((error) =>
      error.includes("direct quote is not linked in its sentence evidence"),
    )
  ) {
    failures.push("a verbatim quote could be attributed to the wrong sentence");
  }
}

function checkPublishedHydration(
  storySpec: StorySpec,
  failures: string[],
): void {
  const row = {
    story_spec_id: storySpec.storySpecId,
    figure_key: storySpec.figureKey,
    stage_id: storySpec.stageId,
    version: storySpec.version,
    schema_version: storySpec.schemaVersion,
    status: storySpec.status,
    spec: JSON.parse(JSON.stringify(storySpec)) as unknown,
  };
  const hydrated = parsePublishedStorySpecRow(row);
  if (
    hydrated === null ||
    !Object.isFrozen(hydrated) ||
    !Object.isFrozen(hydrated.arc) ||
    hydrated === storySpec
  ) {
    failures.push("published StorySpec row did not hydrate as an immutable clone");
  }

  for (const field of [
    "story_spec_id",
    "figure_key",
    "stage_id",
    "version",
    "schema_version",
    "status",
  ] as const) {
    const mismatch: Record<string, unknown> = structuredClone(row);
    if (field === "version") {
      mismatch[field] = Number(mismatch[field]) + 1;
    } else {
      mismatch[field] = `${String(mismatch[field])}-mismatch`;
    }
    if (parsePublishedStorySpecRow(mismatch) !== null) {
      failures.push(`published StorySpec accepted mismatched row ${field}`);
    }
  }

  const extraDocumentField = structuredClone(row);
  extraDocumentField.spec = {
    ...(extraDocumentField.spec as Record<string, unknown>),
    unexpected: true,
  };
  if (parsePublishedStorySpecRow(extraDocumentField) !== null) {
    failures.push("published StorySpec accepted an extra document field");
  }

  const extraRowField = { ...row, unexpected: true };
  if (parsePublishedStorySpecRow(extraRowField) !== null) {
    failures.push("published StorySpec accepted an extra row-envelope field");
  }

  const reviewRow = structuredClone(row);
  reviewRow.status = "review";
  (reviewRow.spec as StorySpec).status = "review";
  if (
    parseStorySpecRow(reviewRow, "review") === null ||
    parsePublishedStorySpecRow(reviewRow) !== null
  ) {
    failures.push("review-state StorySpec row did not honor the explicit status boundary");
  }

  const semanticallyInvalid = structuredClone(row);
  const invalidSpec = semanticallyInvalid.spec as StorySpec;
  invalidSpec.interpretations[0].allowed = false;
  if (parsePublishedStorySpecRow(semanticallyInvalid) !== null) {
    failures.push("published StorySpec hydration accepted invalid evidence closure");
  }

  const quarantinedInspection = inspectPublishedStorySpecRows([
    row,
    extraDocumentField,
  ]);
  if (
    quarantinedInspection.rawPublishedRowCount !== 2 ||
    quarantinedInspection.quarantinedRowCount !== 1 ||
    quarantinedInspection.catalog.size !== 1
  ) {
    failures.push("published catalog inspection hid a quarantined StorySpec row");
  }

  const duplicateInspection = inspectPublishedStorySpecRows([row, row]);
  if (
    duplicateInspection.rawPublishedRowCount !== 2 ||
    duplicateInspection.quarantinedRowCount !== 2 ||
    duplicateInspection.catalog.size !== 0
  ) {
    failures.push("published catalog inspection did not quarantine both duplicate rows");
  }
}

function checkRationalePrivacy(failures: string[]): void {
  const rationales = new Set<string>();
  for (const pressure of PRIMARY_PRESSURES) {
    const { artifact } = makeFixture(pressure);
    const serialized = JSON.stringify(artifact.transparency);
    const rationale = artifact.transparency?.rationale;
    if (
      !rationale ||
      !rationale.gap.toLowerCase().includes("not an equivalence") ||
      serialized.includes(PRIVATE_DISCLOSURE) ||
      serialized.includes("Avery") ||
      serialized.includes("Montréal") ||
      serialized.includes("2025") ||
      serialized.includes("vermilion astrolabe") ||
      serialized.includes('"emotionalCore"') ||
      serialized.includes('"situationShape"') ||
      serialized.includes('"sourceSpanHash"') ||
      serialized.includes('"forbiddenEchoHashes"')
    ) {
      failures.push(`${pressure}: rationale leaked input or omitted explicit distance`);
    } else {
      rationales.add(rationale.resonance);
    }
  }
  if (rationales.size !== PRIMARY_PRESSURES.length) {
    failures.push("controlled rationale policy did not cover every governed pressure distinctly");
  }
}

function checkTamperAndLegacyReplay(
  fixture: Fixture,
  failures: string[],
): void {
  const { artifact, storySpec, resonanceBrief } = fixture;
  const rationaleTamper = structuredClone(artifact);
  if (!rationaleTamper.transparency) {
    failures.push("tamper fixture lacks transparency");
    return;
  }
  rationaleTamper.transparency.rationale.resonance = PRIVATE_DISCLOSURE;
  rationaleTamper.contentHash = storyArtifactContentHash(rationaleTamper);
  if (validateStoredStoryArtifact(rationaleTamper)) {
    failures.push("stored validator accepted rehashed free-form rationale prose");
  }

  const sourceTamper = structuredClone(artifact);
  sourceTamper.transparency!.sources[0].citation += " Altered after composition.";
  sourceTamper.contentHash = storyArtifactContentHash(sourceTamper);
  const detailed = validateStoryArtifact(
    sourceTamper,
    storySpec,
    resonanceBrief,
  );
  if (detailed.valid || !detailed.failureReasons.includes("transparency_invalid")) {
    failures.push("StorySpec-aware validation accepted rehashed source divergence");
  }

  const unsafeLink = structuredClone(artifact);
  unsafeLink.transparency!.sources[0].url = "data:text/html,unsafe";
  unsafeLink.contentHash = storyArtifactContentHash(unsafeLink);
  if (validateStoredStoryArtifact(unsafeLink)) {
    failures.push("stored validator accepted an unsafe projected source link");
  }

  const legacy = structuredClone(artifact);
  legacy.schemaVersion = HYBRID_STORY_ARTIFACT_SCHEMA_VERSION;
  delete legacy.transparency;
  legacy.contentHash = storyArtifactContentHash(legacy);
  if (
    !validateStoredStoryArtifact(legacy, storedEnvelope(legacy))
  ) {
    failures.push("v4 artifact without transparency no longer replays");
  }
  const fabricatedLegacy = structuredClone(legacy);
  fabricatedLegacy.transparency = structuredClone(artifact.transparency);
  fabricatedLegacy.contentHash = storyArtifactContentHash(fabricatedLegacy);
  if (
    validateStoredStoryArtifact(
      fabricatedLegacy,
      storedEnvelope(fabricatedLegacy),
    )
  ) {
    failures.push("legacy replay accepted fabricated current provenance");
  }
}

async function checkHistoricalConcernFlow(failures: string[]): Promise<void> {
  const owner = makeFixture();
  const ownerSessionId = await createSession({
    userId: LOCAL_DEV_USER_ID,
    telemetryFlowId: createTelemetryFlowId(),
    figureKey: owner.artifact.figureKey,
    stageId: owner.artifact.stageId,
    framing: owner.artifact.framing,
    age: 30,
    feeling: PRIVATE_DISCLOSURE,
    storyRequestContext: createStoryRequestContext({
      boundaries: undefined,
      clarification: undefined,
    }),
    matchRecipe: recipe,
    artifact: owner.artifact,
  });
  const factId = owner.artifact.transparency?.facts[0]?.factId;
  if (!factId) {
    failures.push("published report fixture has no reportable fact");
    return;
  }

  const first = await reportRequest({
    sessionId: ownerSessionId,
    factId,
    reason: "incorrect_fact",
  });
  const duplicates = await Promise.all([
    reportRequest({ sessionId: ownerSessionId, factId, reason: "incorrect_fact" }),
    reportRequest({ sessionId: ownerSessionId, factId, reason: "incorrect_fact" }),
  ]);
  const queue = _listHistoricalConcerns();
  if (
    first.status !== 202 ||
    first.headers.get("cache-control") !== "no-store" ||
    duplicates.some((response) => response.status !== 202) ||
    queue.length !== 1 ||
    queue[0].reportCount !== 3
  ) {
    failures.push("valid or concurrent duplicate reports were not safely idempotent");
  }
  const stored = JSON.stringify(queue);
  const safeKeys = new Set([
    "reportId",
    "storySpecId",
    "storySpecVersion",
    "figureKey",
    "stageId",
    "factId",
    "reason",
    "status",
    "reportCount",
    "firstReportedAt",
    "lastReportedAt",
  ]);
  if (
    queue.some((item) => Object.keys(item).some((key) => !safeKeys.has(key))) ||
    stored.includes(PRIVATE_DISCLOSURE) ||
    /userId|sessionId|artifactId|rationale|citation|sourceRefs|feeling|boundaries/.test(stored)
  ) {
    failures.push("historical concern storage retained a user/session/story surface");
  }

  const beforeInvalid = _listHistoricalConcerns()[0].reportCount;
  const extra = await reportRequest({
    sessionId: ownerSessionId,
    factId,
    reason: "incorrect_fact",
    disclosure: PRIVATE_DISCLOSURE,
  });
  const fakeFact = await reportRequest({
    sessionId: ownerSessionId,
    factId: "fact-does-not-exist",
    reason: "incorrect_fact",
  });
  const invalidReason = await reportRequest({
    sessionId: ownerSessionId,
    factId,
    reason: "other_with_free_text",
  });
  if (
    extra.status !== 400 ||
    fakeFact.status !== 404 ||
    invalidReason.status !== 400 ||
    _listHistoricalConcerns()[0].reportCount !== beforeInvalid
  ) {
    failures.push("invalid fields, target, or reason changed the editorial queue");
  }

  const foreign = makeFixture("uncertainty");
  const foreignSessionId = await createSession({
    userId: "foreign-user",
    telemetryFlowId: createTelemetryFlowId(),
    figureKey: foreign.artifact.figureKey,
    stageId: foreign.artifact.stageId,
    framing: foreign.artifact.framing,
    age: 30,
    feeling: "foreign private input",
    storyRequestContext: createStoryRequestContext({
      boundaries: undefined,
      clarification: undefined,
    }),
    matchRecipe: recipe,
    artifact: foreign.artifact,
  });
  const missing = await reportRequest({
    sessionId: "0".repeat(32),
    factId,
    reason: "incorrect_fact",
  });
  const foreignResponse = await reportRequest({
    sessionId: foreignSessionId,
    factId,
    reason: "incorrect_fact",
  });
  if (
    missing.status !== 404 ||
    foreignResponse.status !== 404 ||
    (await missing.text()) !== (await foreignResponse.text())
  ) {
    failures.push("missing and foreign report targets exposed an ownership oracle");
  }

  const crossOrigin = await reportRequest(
    { sessionId: ownerSessionId, factId, reason: "incorrect_fact" },
    "https://attacker.example",
  );
  if (crossOrigin.status !== 403) {
    failures.push("cross-origin historical concern submission was accepted");
  }

  const legacy = structuredClone(makeFixture().artifact);
  legacy.schemaVersion = HYBRID_STORY_ARTIFACT_SCHEMA_VERSION;
  delete legacy.transparency;
  legacy.contentHash = storyArtifactContentHash(legacy);
  const legacySessionId = await createSession({
    userId: LOCAL_DEV_USER_ID,
    telemetryFlowId: createTelemetryFlowId(),
    figureKey: legacy.figureKey,
    stageId: legacy.stageId,
    framing: legacy.framing,
    age: 30,
    feeling: "legacy private input",
    storyRequestContext: createStoryRequestContext({
      boundaries: undefined,
      clarification: undefined,
    }),
    matchRecipe: recipe,
    artifact: legacy,
  });
  const legacyResponse = await reportRequest({
    sessionId: legacySessionId,
    factId,
    reason: "incorrect_fact",
  });
  if (legacyResponse.status !== 404) {
    failures.push("legacy artifact accepted fabricated report targeting");
  }

  const validParse = parseHistoricalConcernRequest({
    sessionId: ownerSessionId,
    factId,
    reason: "source_problem",
  });
  const invalidParses = [
    null,
    [],
    { sessionId: ownerSessionId, factId: "", reason: "source_problem" },
    { sessionId: ownerSessionId, factId, reason: "unknown" },
    { sessionId: ownerSessionId, factId, reason: "source_problem", text: "free" },
  ].map(parseHistoricalConcernRequest);
  if (
    "error" in validParse ||
    invalidParses.some((parsed) => !("error" in parsed))
  ) {
    failures.push("historical concern parser is not exact and closed");
  }
}

function checkStaticContracts(failures: string[]): void {
  const migration = read("../supabase/migrations/0007_historical_concern_reports.sql");
  const component = read("../components/StoryAfterword.tsx");
  const player = read("../components/StoryPlayer.tsx");
  const table = /create table historical_concern_reports \([\s\S]*?\n\);/i.exec(migration)?.[0] ?? "";
  const requiredSql = [
    "alter table historical_concern_reports enable row level security",
    "revoke all on table historical_concern_reports from public, anon, authenticated",
    "revoke all on table historical_concern_reports from service_role",
    "historical_concern_reports_active_dedupe_idx",
    "historical_concern_reports_queue_idx",
    "submit_historical_concern",
    "triage_historical_concern",
    "artifact.user_id = p_user_id",
    "story-artifact-v5-2026-07",
    "retire_story_spec",
  ];
  if (
    requiredSql.some((value) => !migration.toLowerCase().includes(value.toLowerCase())) ||
    !table ||
    /\b(user_id|session_id|artifact_id|disclosure|feeling|details|free_text|rationale|story_prose)\b/i.test(table) ||
    /grant\s+(?:insert|update|delete)[^;]*historical_concern_reports/i.test(migration)
  ) {
    failures.push("historical concern migration lacks default-deny, safe queue, or atomic ownership guarantees");
  }
  const requiredUi = [
    "<details",
    "<summary",
    "<fieldset",
    "<legend",
    'aria-live="polite"',
    'role="alert"',
    "It does not include what you wrote before the story.",
    'rel="noopener noreferrer"',
  ];
  if (
    requiredUi.some((value) => !component.includes(value)) ||
    /<textarea|dangerouslySetInnerHTML/i.test(component)
  ) {
    failures.push("afterword lacks the native accessible drawer/report contract");
  }
  const afterwordIndex = player.indexOf("<StoryAfterword");
  const saveIndex = player.indexOf("<SaveStoriesCard");
  if (
    !player.includes('reachedEnd || phase === "ended"') ||
    afterwordIndex < 0 ||
    saveIndex < 0 ||
    afterwordIndex > saveIndex
  ) {
    failures.push("afterword is not gated at story end before account conversion");
  }
}

async function reportRequest(
  body: Record<string, unknown>,
  origin = "http://localhost",
): Promise<Response> {
  return historicalConcernPost(
    new Request("http://localhost/api/historical-concern", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin,
      },
      body: JSON.stringify(body),
    }),
  );
}

function sameSet(left: string[], right: string[]): boolean {
  const leftSet = [...new Set(left)].sort();
  const rightSet = [...new Set(right)].sort();
  return (
    leftSet.length === rightSet.length &&
    leftSet.every((value, index) => value === rightSet[index])
  );
}

function read(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
}

function storedEnvelope(
  artifact: Readonly<{
    artifactId: string;
    schemaVersion: string;
    contentHash: string;
  }>,
): StoredStoryArtifactEnvelope {
  return {
    artifactId: artifact.artifactId,
    schemaVersion: artifact.schemaVersion,
    contentHash: artifact.contentHash,
  };
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
