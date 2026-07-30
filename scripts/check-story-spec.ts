import "./_smoke-bootstrap";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FIGURE_STAGES } from "../lib/figures-data";
import {
  buildDraftStorySpec,
  parseStorySpecDocument,
  storySpecContainsDisclosure,
  validateStorySpec,
} from "../lib/story-spec";
import type { StorySpec } from "../lib/story-spec-types";
import { buildPublishedStorySpecFixture } from "./_story-spec-fixtures";

const syntheticDisclosure =
  "I feel unusually marooned after a private problem nobody in this biography could possibly know.";

function main(): void {
  const specs = FIGURE_STAGES.map(buildDraftStorySpec);
  const ids = new Set<string>();
  const failures: string[] = [];

  for (const spec of specs) {
    const label = `${spec.figureKey}/${spec.stageId}`;
    if (ids.has(spec.storySpecId)) failures.push(`${label}: duplicate storySpecId`);
    ids.add(spec.storySpecId);

    const draft = validateStorySpec(spec, { forPublish: false });
    if (!draft.valid) failures.push(`${label}: invalid draft: ${draft.errors.join("; ")}`);

    const attemptedPublish = validateStorySpec(
      { ...spec, status: "published" },
      { forPublish: true },
    );
    if (attemptedPublish.valid) {
      failures.push(`${label}: unreviewed broad-source draft passed publish validation`);
    }
    if (!attemptedPublish.errors.some((error) => error.includes("source locator"))) {
      failures.push(`${label}: publish gate did not identify broad evidence mapping`);
    }
    if (!attemptedPublish.errors.some((error) => error.includes("approvals are required"))) {
      failures.push(`${label}: publish gate did not identify missing human review`);
    }
    if (storySpecContainsDisclosure(spec, syntheticDisclosure)) {
      failures.push(`${label}: canonical arc overlaps the synthetic disclosure`);
    }
  }

  const fixture = specs[0];
  const publishedFixture = buildPublishedStorySpecFixture(FIGURE_STAGES[0]);
  checkDocumentBoundary(fixture, failures);
  checkPublicationBoundary(failures);
  expectAccepted(
    failures,
    "reviewed publication fixture",
    publishedFixture,
  );
  expectRejected(
    failures,
    "duplicate published fact source reference",
    mutate(publishedFixture, (spec) => {
      spec.facts[0].sourceRefs.push(
        structuredClone(spec.facts[0].sourceRefs[0]),
      );
    }),
    true,
    "source references must be bounded and unique",
  );
  expectRejected(
    failures,
    "oversized published fact statement",
    mutate(publishedFixture, (spec) => {
      spec.facts[0].statement = "x".repeat(4_001);
    }),
    true,
    "statement must be non-empty and within the public limit",
  );
  expectRejected(
    failures,
    "duplicate published quote source reference",
    mutate(publishedFixture, (spec) => {
      spec.quotes[1].sourceRefs.push(
        structuredClone(spec.quotes[1].sourceRefs[0]),
      );
    }),
    true,
    "source references must be bounded and unique",
  );
  expectRejected(
    failures,
    "oversized published paraphrase",
    mutate(publishedFixture, (spec) => {
      spec.quotes[1].text = "x".repeat(4_001);
    }),
    true,
    "text must be non-empty and within the public limit",
  );
  expectRejected(
    failures,
    "impossible published review date",
    mutate(publishedFixture, (spec) => {
      spec.review.reviewedAt = "2026-99-99";
    }),
    true,
    "reviewedAt must be an ISO date or UTC timestamp",
  );
  expectRejected(
    failures,
    "nonexistent calendar review date",
    mutate(publishedFixture, (spec) => {
      spec.review.reviewedAt = "2026-02-29";
    }),
    true,
    "reviewedAt must be an ISO date or UTC timestamp",
  );

  // Editors narrow evidence claim by claim — the builders must give every
  // fact and quote its own sourceRefs array, never one shared reference.
  if (
    fixture.facts.length >= 2 &&
    fixture.facts[0].sourceRefs === fixture.facts[1].sourceRefs
  ) {
    failures.push("fact atoms share one mutable sourceRefs array");
  }
  if (
    fixture.quotes.length >= 2 &&
    fixture.quotes[0].sourceRefs === fixture.quotes[1].sourceRefs
  ) {
    failures.push("quote records share one mutable sourceRefs array");
  }

  expectRejected(
    failures,
    "missing evidence",
    mutate(fixture, (spec) => {
      spec.facts[0].sourceRefs = [];
    }),
    false,
    "source reference",
  );
  expectRejected(
    failures,
    "unresolved entity",
    mutate(fixture, (spec) => {
      spec.arc[0].entityIds.push("entity-not-reviewed");
    }),
    false,
    "unknown entity",
  );
  expectRejected(
    failures,
    "unsupported quote",
    publishShape(
      mutate(fixture, (spec) => {
        spec.arc[0].canonicalText += ' "This sentence was never documented."';
      }),
    ),
    true,
    "unsupported direct quote",
  );
  expectRejected(
    failures,
    "beat quote linked to no sentence",
    mutate(publishedFixture, (spec) => {
      spec.arc[0].quoteIds.push("quote-verbatim");
    }),
    true,
    "declares quote quote-verbatim without sentence evidence",
  );
  expectRejected(
    failures,
    "sentence quote absent from beat declaration",
    mutate(publishedFixture, (spec) => {
      spec.arc[0].sentenceEvidence[0].quoteIds.push("quote-paraphrase");
    }),
    true,
    "sentence evidence uses undeclared quote quote-paraphrase",
  );
  expectRejected(
    failures,
    "duplicate beat quote link",
    mutate(publishedFixture, (spec) => {
      spec.arc[2].quoteIds.push("quote-verbatim");
    }),
    true,
    "quote links must be unique",
  );
  expectRejected(
    failures,
    "duplicate sentence quote link",
    mutate(publishedFixture, (spec) => {
      spec.arc[2].sentenceEvidence[0].quoteIds.push("quote-verbatim");
    }),
    true,
    "sentence quote links must be unique",
  );
  expectRejected(
    failures,
    "mapped verbatim quote absent from prose",
    mutate(publishedFixture, (spec) => {
      spec.arc[2].canonicalText =
        "The record documents that the work began again.";
    }),
    true,
    "mapped verbatim quote quote-verbatim does not appear in its sentence",
  );
  expectRejected(
    failures,
    "verbatim quote mapped to a different sentence",
    mutate(publishedFixture, (spec) => {
      const beat = spec.arc[2];
      const factId = beat.requiredFactIds[0];
      beat.canonicalText =
        'The record preserves the words "We began again." Work resumed.';
      beat.sentenceEvidence = [
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
    }),
    true,
    "direct quote is not linked in its sentence evidence",
  );
  expectRejected(
    failures,
    "impossible chronology",
    mutate(fixture, (spec) => {
      spec.facts[1].eventOrder = 0;
    }),
    false,
    "eventOrder must be a positive integer",
  );
  expectRejected(
    failures,
    "exact source without locator",
    publishShape(
      mutate(fixture, (spec) => {
        spec.facts[0].sourceRefs = spec.facts[0].sourceRefs.map((ref) => ({
          ...ref,
          scope: "exact",
          locator: undefined,
        }));
      }),
    ),
    true,
    "source reference needs a locator",
  );
  expectRejected(
    failures,
    "missing sentence evidence",
    publishShape(fixture),
    true,
    "sentence-level evidence",
  );
  expectRejected(
    failures,
    "missing bridge sentence classification",
    mutate(publishedFixture, (spec) => {
      spec.arc.at(-1)?.sentenceEvidence.pop();
    }),
    true,
    "sentence-level evidence or reader-bridge classification",
  );
  expectRejected(
    failures,
    "reader treatment outside bridge",
    mutate(publishedFixture, (spec) => {
      const mapping = spec.arc[0].sentenceEvidence[0];
      mapping.treatment = "reader_bridge";
      mapping.factIds = [];
      mapping.interpretationIds = [];
    }),
    true,
    "reader-bridge treatment is only legal on the bridge",
  );
  expectRejected(
    failures,
    "reader treatment with historical evidence",
    mutate(publishedFixture, (spec) => {
      const bridge = spec.arc.at(-1);
      if (!bridge) throw new Error("reviewed fixture is missing its bridge");
      bridge.requiredFactIds = [spec.facts[0].factId];
      bridge.sentenceEvidence[0].factIds = [spec.facts[0].factId];
    }),
    true,
    "reader-bridge treatment cannot reference historical evidence",
  );
  expectRejected(
    failures,
    "unsupported historical claim labeled as reflection",
    mutate(publishedFixture, (spec) => {
      const bridge = spec.arc.at(-1);
      if (!bridge) throw new Error("reviewed fixture is missing its bridge");
      bridge.canonicalText = "In 2007, the project won an award.";
      bridge.sentenceEvidence = [
        {
          sentenceIndex: 0,
          treatment: "reader_bridge",
          factIds: [],
          interpretationIds: [],
          quoteIds: [],
        },
      ];
    }),
    true,
    "reader-bridge treatment must use reviewed reader copy",
  );
  expectRejected(
    failures,
    "historical bridge sentence without evidence",
    mutate(publishedFixture, (spec) => {
      const bridge = spec.arc.at(-1);
      if (!bridge) throw new Error("reviewed fixture is missing its bridge");
      bridge.canonicalText = "The project was published in 2006.";
      bridge.sentenceEvidence = [
        {
          sentenceIndex: 0,
          treatment: "historical_claim",
          factIds: [],
          interpretationIds: [],
          quoteIds: [],
        },
      ];
    }),
    true,
    "historical sentence evidence cannot be empty",
  );
  const primaryFactId = fixture.facts[0].factId;
  const secondaryFactId = fixture.facts[1].factId;
  expectRejected(
    failures,
    "mapped disallowed interpretation",
    evidenceMappingSpec(fixture, {
      declaredFactIds: [primaryFactId],
      mappedFactIds: [primaryFactId],
      interpretation: {
        interpretationId: "interpretation-blocked",
        statement: "An editorial interpretation that is explicitly blocked.",
        supportingFactIds: [primaryFactId],
        allowed: false,
      },
    }),
    true,
    "disallowed interpretation",
  );
  expectRejected(
    failures,
    "undeclared interpretation support",
    evidenceMappingSpec(fixture, {
      declaredFactIds: [primaryFactId],
      mappedFactIds: [primaryFactId],
      interpretation: {
        interpretationId: "interpretation-unsupported-here",
        statement: "An allowed interpretation supported by a different fact.",
        supportingFactIds: [secondaryFactId],
        allowed: true,
      },
    }),
    true,
    `sentence evidence uses undeclared fact ${secondaryFactId}`,
  );
  expectRejected(
    failures,
    "undeclared sentence fact",
    evidenceMappingSpec(fixture, {
      declaredFactIds: [primaryFactId],
      mappedFactIds: [secondaryFactId],
    }),
    true,
    `sentence evidence uses undeclared fact ${secondaryFactId}`,
  );
  expectRejected(
    failures,
    "decorative optional fact",
    evidenceMappingSpec(fixture, {
      declaredFactIds: [primaryFactId],
      optionalFactIds: [secondaryFactId],
      mappedFactIds: [primaryFactId],
    }),
    true,
    `declares fact ${secondaryFactId} without sentence evidence`,
  );
  expectRejected(
    failures,
    "required optional overlap",
    evidenceMappingSpec(fixture, {
      declaredFactIds: [primaryFactId],
      optionalFactIds: [primaryFactId],
      mappedFactIds: [primaryFactId],
    }),
    true,
    "required and optional facts must be disjoint",
  );
  expectRejected(
    failures,
    "duplicate interpretation identity",
    publishShape(
      mutate(fixture, (spec) => {
        const duplicate = {
          interpretationId: "interpretation-duplicate",
          statement: "A duplicate editorial identity.",
          supportingFactIds: [primaryFactId],
          allowed: true,
        };
        spec.interpretations.push(duplicate, structuredClone(duplicate));
      }),
    ),
    true,
    "interpretation IDs must be unique",
  );

  expectAccepted(
    failures,
    "interpretation-only sentence",
    mutate(publishedFixture, (spec) => {
      const beat = spec.arc.find((candidate) => candidate.role === "struggle");
      if (!beat?.sentenceEvidence[0]) {
        throw new Error("reviewed fixture is missing struggle sentence evidence");
      }
      beat.sentenceEvidence[0].factIds = [];
    }),
  );
  expectAccepted(
    failures,
    "unreferenced blocked interpretation",
    mutate(publishedFixture, (spec) => {
      spec.interpretations.push({
        interpretationId: "interpretation-unreferenced",
        statement: "A retained editorial decision that prose cannot use.",
        supportingFactIds: [],
        allowed: false,
      });
    }),
  );
  expectRejected(
    failures,
    "invalid content profile",
    mutate(fixture, (spec) => {
      (spec.contentProfile as { intensity: string }).intensity = "extreme";
    }),
    false,
    "content profile intensity",
  );

  console.log("Onward StorySpec validator");
  console.log("==========================");
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`${failures.length} StorySpec contract failure(s).`);
    process.exit(1);
  }

  console.log(`PASS ${specs.length}/${specs.length} structurally valid draft specs`);
  console.log(`PASS ${specs.length}/${specs.length} unreviewed publish attempts rejected`);
  console.log(
    "PASS negative gates: evidence closure, entity, quote, chronology, locator, and sentence mapping",
  );
  console.log("PASS untrusted documents require exact nested StorySpec shapes");
  console.log("PASS immutable publication and compare-and-set authority are migration-gated");
}

function checkDocumentBoundary(spec: StorySpec, failures: string[]): void {
  const jsonRoundTrip = JSON.parse(JSON.stringify(spec)) as unknown;
  if (parseStorySpecDocument(jsonRoundTrip) === null) {
    failures.push("exact parser rejected a generated draft StorySpec");
  }

  const extraTopLevel = { ...structuredClone(spec), unexpected: true };
  expectDocumentRejected(failures, "extra top-level field", extraTopLevel);

  const extraEpisode = structuredClone(spec);
  (
    extraEpisode.episode as StorySpec["episode"] & {
      unexpected?: boolean;
    }
  ).unexpected = true;
  expectDocumentRejected(failures, "extra episode field", extraEpisode);

  const extraFact = structuredClone(spec);
  (
    extraFact.facts[0] as StorySpec["facts"][number] & {
      unexpected?: boolean;
    }
  ).unexpected = true;
  expectDocumentRejected(failures, "extra fact field", extraFact);

  const invalidEnum = structuredClone(spec);
  (
    invalidEnum.contentProfile as unknown as {
      intensity: string;
    }
  ).intensity = "extreme";
  expectDocumentRejected(failures, "unknown content intensity", invalidEnum);

  const invalidTreatment = buildPublishedStorySpecFixture(FIGURE_STAGES[0]);
  (
    invalidTreatment.arc[0].sentenceEvidence[0] as unknown as {
      treatment: string;
    }
  ).treatment = "editorial_guess";
  expectDocumentRejected(
    failures,
    "unknown sentence treatment",
    invalidTreatment,
  );

  const missingSentenceQuoteIds = JSON.parse(
    JSON.stringify(buildPublishedStorySpecFixture(FIGURE_STAGES[0])),
  ) as StorySpec;
  delete (
    missingSentenceQuoteIds.arc[0].sentenceEvidence[0] as Partial<
      StorySpec["arc"][number]["sentenceEvidence"][number]
    >
  ).quoteIds;
  expectDocumentRejected(
    failures,
    "missing sentence quote links",
    missingSentenceQuoteIds,
  );

  const malformedArray = structuredClone(spec);
  malformedArray.facts = [null] as unknown as StorySpec["facts"];
  expectDocumentRejected(failures, "malformed fact member", malformedArray);

  const invalidOptional = structuredClone(spec);
  (
    invalidOptional.sources[0] as StorySpec["sources"][number] & {
      locator?: string | undefined;
    }
  ).locator = undefined;
  expectDocumentRejected(failures, "present undefined optional field", invalidOptional);
}

function mutate(source: StorySpec, change: (copy: StorySpec) => void): StorySpec {
  const copy = structuredClone(source);
  change(copy);
  return copy;
}

function publishShape(spec: StorySpec): StorySpec {
  return { ...spec, status: "published" };
}

function evidenceMappingSpec(
  source: StorySpec,
  input: Readonly<{
    declaredFactIds: string[];
    optionalFactIds?: string[];
    mappedFactIds: string[];
    interpretation?: StorySpec["interpretations"][number];
  }>,
): StorySpec {
  return publishShape(
    mutate(source, (spec) => {
      const beat = spec.arc[0];
      beat.requiredFactIds = [...input.declaredFactIds];
      beat.optionalFactIds = [...(input.optionalFactIds ?? [])];
      beat.sentenceEvidence = [
        {
          sentenceIndex: 0,
          treatment: "historical_claim",
          factIds: [...input.mappedFactIds],
          interpretationIds: input.interpretation
            ? [input.interpretation.interpretationId]
            : [],
          quoteIds: [],
        },
      ];
      if (input.interpretation) {
        spec.interpretations.push(structuredClone(input.interpretation));
      }
    }),
  );
}

function expectRejected(
  failures: string[],
  name: string,
  spec: StorySpec,
  forPublish: boolean,
  expectedError: string,
): void {
  const result = validateStorySpec(spec, { forPublish });
  if (result.valid || !result.errors.some((error) => error.includes(expectedError))) {
    failures.push(`${name}: expected rejection containing "${expectedError}"`);
  }
}

function expectDocumentRejected(
  failures: string[],
  name: string,
  value: unknown,
): void {
  if (parseStorySpecDocument(value) !== null) {
    failures.push(`${name}: exact parser accepted malformed StorySpec JSON`);
  }
}

function expectAccepted(
  failures: string[],
  name: string,
  spec: StorySpec,
): void {
  const result = validateStorySpec(spec, { forPublish: true });
  if (!result.valid) {
    failures.push(
      `${name}: valid published StorySpec was rejected: ${result.errors.join("; ")}`,
    );
  }
}

function checkPublicationBoundary(failures: string[]): void {
  const migration = read(
    "../supabase/migrations/0023_story_spec_publication_cas.sql",
  )
    .toLowerCase()
    .replace(/\s+/g, " ");
  const statusCommand = read("./set-story-spec-status.ts")
    .toLowerCase()
    .replace(/\s+/g, " ");
  const databaseCheck = read("./check-db.ts")
    .toLowerCase()
    .replace(/\s+/g, " ");

  for (const required of [
    "story_specs_document_identity_strict_check",
    "spec -> 'version' = pg_catalog.to_jsonb(version)",
    "spec -> 'status' = pg_catalog.to_jsonb(status)",
    ") is true",
    "andspec->''status''=to_jsonbstatusistrue",
    "promote_story_spec_v2",
    "p_expected_review_spec jsonb",
    "v_target.spec is distinct from p_expected_review_spec",
    "target.status = 'review'",
    "target.spec = p_expected_review_spec",
    "story_spec_publication_schema_health_v1",
    "procedure_row.prorettype = 'trigger'::pg_catalog.regtype",
    "procedure_row.proconfig = array['search_path=public']::text[]",
    "4319d665aca2de512bf07bdb2b865f3a",
    "trigger_row.tgtype = 23::smallint",
    "trigger_row.tgattr = ''::pg_catalog.int2vector",
    "function_namespace.nspname = 'public'",
    "story_specs_one_published_stage_idx",
    "index_row.indisunique",
    "index_row.indpred is not null",
    "pg_catalog.pg_get_indexdef(",
    "published_stage_uniqueness_valid boolean",
    "and publication_index_health.value",
    "legacy_rpc_revoked boolean",
    "boundary_granted boolean",
    "revoke all on function public.promote_story_spec(text) from public, anon, authenticated, service_role",
    "grant execute on function public.promote_story_spec_v2(text, jsonb) to service_role",
  ]) {
    if (!migration.includes(required)) {
      failures.push(`publication migration is missing: ${required}`);
    }
  }
  const lockIndex = migration.indexOf("for update;");
  const snapshotIndex = migration.indexOf(
    "v_target.spec is distinct from p_expected_review_spec",
  );
  const retirementIndex = migration.indexOf("set status = 'retired'");
  if (
    lockIndex < 0 ||
    snapshotIndex <= lockIndex ||
    retirementIndex <= snapshotIndex
  ) {
    failures.push(
      "publication migration does not lock and compare the validated snapshot before retirement",
    );
  }
  if (
    /grant execute on function public\.promote_story_spec\(text\)/.test(
      migration,
    )
  ) {
    failures.push("publication migration re-grants the legacy ID-only RPC");
  }
  if (
    !statusCommand.includes('rpc("promote_story_spec_v2"') ||
    !statusCommand.includes("p_expected_review_spec: stored")
  ) {
    failures.push(
      "publication command does not submit the exact validated review document",
    );
  }
  for (const readinessProof of [
    "inspectpublishedstoryspecs",
    "quarantinedrowcount",
    "const disabled",
    "const uncovered",
    "story_spec_publication_schema_health_v1",
    "published_stage_uniqueness_valid",
    "one published version per stage",
  ]) {
    if (!databaseCheck.includes(readinessProof)) {
      failures.push(`database readiness omits: ${readinessProof}`);
    }
  }
}

function read(relative: string): string {
  return readFileSync(
    fileURLToPath(new URL(relative, import.meta.url)),
    "utf8",
  );
}

main();
