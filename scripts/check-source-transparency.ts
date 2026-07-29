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
import { createSession } from "../lib/session";
import { createStoryRequestContext } from "../lib/story-request-context";
import {
  composeCanonicalStoryArtifact,
  composeHybridStoryArtifact,
  storyArtifactContentHash,
  validateStoredStoryArtifact,
  validateStoryArtifact,
} from "../lib/story-artifact";
import { HYBRID_STORY_ARTIFACT_SCHEMA_VERSION } from "../lib/story-artifact-types";
import { validateStorySpec } from "../lib/story-spec";
import type { StorySpec, StoryBeatSpec } from "../lib/story-spec-types";
import { createTelemetryFlowId } from "../lib/telemetry";
import { APPROVED_PRODUCTION_RECIPE } from "../lib/match-config";
import type { MatchRecipe } from "../lib/types";

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
  const storySpec = publishedStorySpec();
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
  if (!validateStoredStoryArtifact(legacy)) {
    failures.push("v4 artifact without transparency no longer replays");
  }
  const fabricatedLegacy = structuredClone(legacy);
  fabricatedLegacy.transparency = structuredClone(artifact.transparency);
  fabricatedLegacy.contentHash = storyArtifactContentHash(fabricatedLegacy);
  if (validateStoredStoryArtifact(fabricatedLegacy)) {
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

function publishedStorySpec(): StorySpec {
  const roles: StoryBeatSpec["role"][] = [
    "scene",
    "dark_moment",
    "response",
    "struggle",
    "turning_point",
    "became",
    "bridge",
  ];
  const texts = [
    "In 2001, the subject began a documented project.",
    "The first attempt ended in 2002.",
    'The record preserves the words "We began again."',
    "Work continued for three years, which the archive describes as a deliberate return.",
    "In 2005, a second route opened, though one account disputes its timing.",
    "The project was published in 2006.",
    "A life can remain distinct and still offer company.",
  ];
  const factIds = ["fact-1", "fact-2", "fact-3", "fact-4", "fact-5", "fact-6"];
  const arc: StoryBeatSpec[] = roles.map((role, index) => {
    const isBridge = role === "bridge";
    const factId = isBridge ? undefined : factIds[index];
    const quoteIds =
      role === "response"
        ? ["quote-verbatim"]
        : role === "struggle"
          ? ["quote-paraphrase"]
          : role === "turning_point"
            ? ["quote-disputed"]
            : [];
    return {
      role,
      canonicalText: texts[index],
      requiredFactIds: factId ? [factId] : [],
      optionalFactIds: [],
      entityIds: ["entity-subject"],
      quoteIds,
      sentenceEvidence: factId
        ? [
            {
              sentenceIndex: 0,
              factIds: [factId],
              interpretationIds:
                role === "struggle" ? ["interpretation-return"] : [],
            },
          ]
        : [],
      personalizationZones: isBridge
        ? ["reader_bridge"]
        : role === "scene" || role === "became"
          ? ["none"]
          : ["emphasis", "transition"],
    };
  });

  return {
    storySpecId: "douglass:1838-1841-nyc-to-nantucket:transparency-test-v2",
    schemaVersion: "story-spec-v1-2026-07",
    figureKey: FIGURE_STAGES[0].figureKey,
    stageId: FIGURE_STAGES[0].stageId,
    version: 2,
    status: "published",
    episode: {
      ageMin: FIGURE_STAGES[0].ageMin,
      ageMax: FIGURE_STAGES[0].ageMax,
      startDate: "2001-01-01",
      endDate: "2006-12-31",
      throughLine: "A documented project was restarted after an early failure.",
    },
    contentProfile: {
      intensity: "gentle",
      flags: [],
      contentNote: "Includes a professional setback.",
    },
    sources: [
      {
        sourceId: "source-archive",
        citation: "Example Archive. Project papers, 2001–2006.",
        locator: "Collection 4",
        url: "https://example.org/archive/project-papers",
      },
      {
        sourceId: "source-history",
        citation: "Historian, A. A History of the Project (2020).",
        locator: "Chapter 3",
        url: "https://example.org/history/project",
      },
    ],
    facts: factIds.map((factId, index) => ({
      factId,
      statement: texts[index],
      sourceRefs: [
        {
          sourceId: index < 3 ? "source-archive" : "source-history",
          locator: index < 3 ? `Folder ${index + 1}` : `pp. ${40 + index}`,
          scope: "exact",
        },
      ],
      eventOrder: index + 1,
      confidence: index === 4 ? "disputed" : "documented",
      claimKind: index === 3 ? "context" : "event",
    })),
    entities: [
      {
        entityId: "entity-subject",
        kind: "person",
        value: FIGURE_STAGES[0].displayName,
        aliases: ["the subject"],
      },
    ],
    quotes: [
      {
        quoteId: "quote-verbatim",
        text: "We began again.",
        status: "verbatim",
        speaker: "Project record",
        sourceRefs: [
          {
            sourceId: "source-archive",
            locator: "Folder 3, leaf 2",
            scope: "exact",
          },
        ],
      },
      {
        quoteId: "quote-paraphrase",
        text: "The work was a deliberate return.",
        status: "paraphrase",
        sourceRefs: [
          {
            sourceId: "source-history",
            locator: "p. 43",
            scope: "bounded",
          },
        ],
      },
      {
        quoteId: "quote-disputed",
        text: "The second route opened in 2005.",
        status: "disputed",
        sourceRefs: [
          {
            sourceId: "source-history",
            locator: "pp. 44–45",
            scope: "bounded",
          },
        ],
      },
    ],
    arc,
    interpretations: [
      {
        interpretationId: "interpretation-return",
        statement: "The continuation can be read as a deliberate return.",
        supportingFactIds: ["fact-4"],
        allowed: true,
      },
    ],
    dramatizationLimits: ["No invented dialogue or interior monologue."],
    avoidRules: ["Do not add unsupported historical claims."],
    review: {
      researcherId: "researcher-test",
      historicalReviewerId: "historian-test",
      toneReviewerId: "tone-test",
      reviewedAt: "2026-07-10T10:00:00.000Z",
      contentProfileReviewed: true,
    },
  };
}

function read(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
