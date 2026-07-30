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
  expectRejected(
    failures,
    "unknown fact confidence",
    mutate(publishedFixture, (spec) => {
      (spec.facts[0] as unknown as { confidence: string }).confidence =
        "invented";
    }),
    true,
    "confidence or claim kind is invalid",
  );
  expectRejected(
    failures,
    "unknown fact claim kind",
    mutate(publishedFixture, (spec) => {
      (spec.facts[0] as unknown as { claimKind: string }).claimKind =
        "prediction";
    }),
    true,
    "confidence or claim kind is invalid",
  );
  expectRejected(
    failures,
    "unknown fact source scope",
    mutate(publishedFixture, (spec) => {
      (spec.facts[0].sourceRefs[0] as unknown as { scope: string }).scope =
        "invented";
    }),
    true,
    "source scope is invalid",
  );
  expectRejected(
    failures,
    "unknown quote status",
    mutate(publishedFixture, (spec) => {
      (spec.quotes[0] as unknown as { status: string }).status = "invented";
    }),
    true,
    "status is invalid",
  );
  expectRejected(
    failures,
    "unknown quote source scope",
    mutate(publishedFixture, (spec) => {
      (spec.quotes[0].sourceRefs[0] as unknown as { scope: string }).scope =
        "invented";
    }),
    true,
    "source scope is invalid",
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
  const migrationSource = read(
    "../supabase/migrations/0023_story_spec_publication_cas.sql",
  );
  const migration = migrationSource
    .toLowerCase()
    .replace(/\s+/g, " ");
  const casePreservedMigration = migrationSource.replace(/\s+/g, " ");
  const statusCommand = read("./set-story-spec-status.ts")
    .toLowerCase()
    .replace(/\s+/g, " ");
  const databaseCheck = read("./check-db.ts")
    .toLowerCase()
    .replace(/\s+/g, " ");
  const storySpecSeed = read("./seed-story-specs.ts").replace(/\s+/g, " ");
  const figureSeed = read("./seed-figures.ts").replace(/\s+/g, " ");
  const cutoverCheck = read("./check-story-spec-cutover.ts")
    .toLowerCase()
    .replace(/\s+/g, " ");
  const packageSource = read("../package.json")
    .toLowerCase()
    .replace(/\s+/g, " ");
  const countOccurrences = (value: string, needle: string): number =>
    value.split(needle).length - 1;

  for (const required of [
    "lock table public.story_specs, public.figure_stages, public.story_artifacts in access exclusive mode",
    "from pg_catalog.pg_inherits inheritance_row",
    "from pg_catalog.pg_rewrite rewrite_row",
    "storyspec cutover forbids inheritance and partition edges",
    "storyspec cutover forbids table rewrite rules",
    "storyspec cutover forbids generated columns on publication tables",
    "storyspec identity primary key is unsafe",
    "storyspec terminal lifecycle has an unsafe schema dependency",
    "story_artifact_legacy_v5_replay",
    "onward-story-artifact-legacy-v5-replay-v1",
    "relation_graph_health as (",
    "rewrite_rule_health as (",
    "generated_column_health as (",
    "legacy_marker_health as (",
    "story_identity_key_health as (",
    "story_specs_document_identity_strict_check",
    "story_specs_status_strict_check",
    "story_specs_stage_strict_fk",
    "figure_stages_status_strict_check",
    "enforce_figure_stage_publication",
    "figure_stages_publication_lifecycle",
    "spec -> 'version' = pg_catalog.to_jsonb(version)",
    "spec -> 'status' = pg_catalog.to_jsonb(status)",
    ") is true",
    "drop index if exists public.story_specs_one_published_stage_idx",
    "onward-story-spec-identity-v1:",
    "onward-story-spec-published-index-v1:",
    "into strict identity_fingerprint",
    "into strict publication_index_fingerprint",
    "into strict story_status_fingerprint",
    "into strict stage_fk_fingerprint",
    "into strict stage_status_fingerprint",
    "into strict stage_trigger_fingerprint",
    "|| ':owner=' || story_specs_owner::text",
    "select database_row.datdba into strict authority_owner",
    "where database_row.datname = pg_catalog.current_database()",
    "(current_user::pg_catalog.regrole)::oid <> authority_owner",
    "with recursive owner_members(member_oid) as (",
    "from pg_catalog.pg_auth_members membership",
    "join owner_members inherited",
    "with recursive service_members(member_oid) as (",
    "join service_members inherited",
    "authenticator_role.oid = 'authenticator'::regrole",
    "not authenticator_role.rolinherit",
    "not authenticator_role.rolsuper",
    "not authenticator_role.rolbypassrls",
    "not authenticator_role.rolcreaterole",
    "service_authority_role.oid = 'service_role'::regrole",
    "service_authority_role.rolbypassrls",
    "anonymous_role.oid = 'anon'::regrole",
    "authenticated_role.oid = 'authenticated'::regrole",
    "service_members.member_oid = authenticator_role.oid",
    "member_role.rolname <> 'supabase_storage_admin'",
    "not canonical_membership.admin_option",
    "pg_catalog.to_jsonb(canonical_membership) ->> 'inherit_option'",
    "pg_catalog.to_jsonb(canonical_membership) ->> 'set_option'",
    "storyspec cutover must run as the database owner",
    "other roles must not inherit storyspec publication authority",
    "storyspec service authority role graph is unsafe",
    "storyspec cutover must run as the canonical table owner",
    "storyspec cutover found an unexpected routine, overload, or owner",
    "figure_stages must not have user triggers",
    "retire every published storyspec before the evidence-contract cutover",
    "story_spec_publication_manifest_v1",
    "select %l::text, %l::text, %l::text, %l::text, %l::text, %l::text, %s::oid",
    "pg_catalog.obj_description(",
    "promote_story_spec_v2",
    "p_expected_review_spec jsonb",
    "v_target.spec is distinct from p_expected_review_spec",
    "target.status = 'review'",
    "target.spec = p_expected_review_spec",
    "story_spec_publication_schema_health_v1",
    "procedure_row.prorettype = 'trigger'::pg_catalog.regtype",
    "published and retired storyspecs require the owner-definer boundary",
    "reviewed storyspecs require an owner-controlled transition",
    "procedure_row.proconfig = array['search_path=pg_catalog, public']::text[]",
    "332ff0ca21935141c04d83c125b016af",
    "36d8d57e86e730a48930a6f0502e4b56",
    "procedure_row.prorettype = 'void'::pg_catalog.regtype",
    "7b030c62cc71ce1e13669bc63baeaeb4",
    "b58ebb00db35f1ece3497c14065529c5",
    "trigger_row.tgtype = 23::smallint",
    "trigger_row.tgattr = ''::pg_catalog.int2vector",
    "count(*) filter ( where not trigger_row.tgisinternal ) = 1",
    "function_namespace.nspname = 'public'",
    "story_specs_one_published_stage_idx",
    "index_row.indisunique",
    "index_row.indimmediate",
    "not index_row.indnullsnotdistinct",
    "index_row.indpred is not null",
    "pg_catalog.pg_get_indexdef(",
    "story_status_constraint_health as (",
    "catalog_alignment_health as (",
    "pg_catalog.pg_depend dependency",
    "status_attribute.attnum = any(other_index.indkey)",
    "published_stage_uniqueness_valid boolean",
    "and publication_index_health.value",
    "pg_catalog.has_table_privilege(",
    "'public.story_specs', 'select'",
    "'public.story_specs', 'update'",
    "'public.figure_stages', 'select'",
    "'public.figure_stages', 'update'",
    "pg_catalog.aclexplode(",
    "acl.grantee <> target.proowner",
    "acl.grantee not in ( procedure_row.proowner, 'service_role'::regrole )",
    "revoke all on table public.story_specs from public, anon, authenticated, service_role",
    "grant select, insert, update on table public.story_specs to service_role",
    "revoke all on table public.figure_stages from public, anon, authenticated, service_role",
    "grant select, insert, update on table public.figure_stages to service_role",
    "public_function_grant_health as (",
    "authority_health as (",
    "private_function_grant_health as (",
    "controlled_routine_inventory_health as (",
    "function_grant_health as (",
    "table_boundary_health as (",
    "stage_boundary_health as (",
    "table_relation.relrowsecurity",
    "(owner_role.rolsuper or owner_role.rolbypassrls)",
    "acl.privilege_type in ('select', 'insert', 'update')",
    "acl.privilege_type not in ('select', 'insert', 'update')",
    "attribute_row.attacl",
    "pg_catalog.aclexplode(attribute_row.attacl)",
    "revoke all (%i) on table public.story_specs from %s",
    "acl.grantee <> story_specs_owner",
    "from pg_catalog.pg_policy policy_row",
    "legacy_rpc_revoked boolean",
    "boundary_granted boolean",
    "revoke all on function public.promote_story_spec(text) from public, anon, authenticated, service_role",
    "grant execute on function public.promote_story_spec_v2(text, jsonb) to service_role",
    "grant execute on function public.retire_story_spec(text) to service_role",
    "manifest_function_health.value",
    "authority_health.value",
    "and retirement_health.value",
    "and stage_boundary_health.value",
    "and stage_lifecycle_health.value",
    "and stage_fk_health.value",
    "database_row.datdba = publication_manifest.authority_owner",
    "select health.ok from public.story_spec_publication_schema_health_v1() health",
  ]) {
    if (!migration.includes(required)) {
      failures.push(`publication migration is missing: ${required}`);
    }
  }
  const draftRefreshStart = storySpecSeed.indexOf(".update({");
  const draftRefreshEnd = storySpecSeed.indexOf(
    '}) .eq("story_spec_id"',
    draftRefreshStart,
  );
  const draftRefresh =
    draftRefreshStart >= 0 && draftRefreshEnd > draftRefreshStart
      ? storySpecSeed.slice(draftRefreshStart, draftRefreshEnd)
      : "";
  if (
    !storySpecSeed.includes("ignoreDuplicates: true") ||
    !storySpecSeed.includes('.eq("status", "draft")') ||
    storySpecSeed.includes('.select("story_spec_id,status")') ||
    !draftRefresh ||
    draftRefresh.includes("status:")
  ) {
    failures.push(
      "StorySpec seeding must insert missing rows and refresh content only through a draft-status CAS",
    );
  }
  if (
    !figureSeed.includes('onConflict: "figure_key,stage_id"') ||
    !figureSeed.includes("defaultToNull: false") ||
    figureSeed.includes("status:") ||
    figureSeed.includes(
      "for (const { identity, content } of stageRows)",
    )
  ) {
    failures.push(
      "figure-stage seeding must use one status-free bulk upsert",
    );
  }
  if (
    !packageSource.includes(
      '"check-story-spec-cutover": "tsx scripts/check-story-spec-cutover.ts"',
    ) ||
    !cutoverCheck.includes("inspectpublishedstoryspecs()") ||
    !cutoverCheck.includes("inspection.rawpublishedrowcount !== 0") ||
    !cutoverCheck.includes('.eq("status", "published")')
  ) {
    failures.push(
      "the release must expose a read-only zero-publication StorySpec cutover gate",
    );
  }
  const identityDdlStart = casePreservedMigration.indexOf(
    "alter table public.story_specs add constraint story_specs_document_identity_strict_check",
  );
  const identityDdlEnd = casePreservedMigration.indexOf(
    "-- Recreate the one-published-version invariant",
    identityDdlStart,
  );
  const identityDdl =
    identityDdlStart >= 0 && identityDdlEnd > identityDdlStart
      ? casePreservedMigration.slice(identityDdlStart, identityDdlEnd).trim()
      : "";
  const canonicalIdentityDdl = `
    alter table public.story_specs
      add constraint story_specs_document_identity_strict_check
      check ((
        pg_catalog.jsonb_typeof(spec) = 'object'
        and spec -> 'storySpecId' = pg_catalog.to_jsonb(story_spec_id)
        and spec -> 'figureKey' = pg_catalog.to_jsonb(figure_key)
        and spec -> 'stageId' = pg_catalog.to_jsonb(stage_id)
        and spec -> 'version' = pg_catalog.to_jsonb(version)
        and spec -> 'schemaVersion' = pg_catalog.to_jsonb(schema_version)
        and spec -> 'status' = pg_catalog.to_jsonb(status)
      ) is true)
      not valid;
    alter table public.story_specs
      validate constraint story_specs_document_identity_strict_check;
    alter table public.story_specs
      drop constraint story_specs_document_identity_check;
    alter table public.story_specs
      rename constraint story_specs_document_identity_strict_check
      to story_specs_document_identity_check;
  `
    .replace(/\s+/g, " ")
    .trim();
  if (identityDdl !== canonicalIdentityDdl) {
    failures.push(
      "publication migration must perform the exact code-owned strict identity handoff",
    );
  }
  const authorityAnchorStart = migration.indexOf(
    "authority_owner oid; begin select database_row.datdba into strict authority_owner",
  );
  const authorityAnchorEnd = migration.indexOf(
    "create or replace function public.enforce_story_spec_lifecycle()",
    authorityAnchorStart,
  );
  const authorityAnchor =
    authorityAnchorStart >= 0 && authorityAnchorEnd > authorityAnchorStart
      ? migration.slice(authorityAnchorStart, authorityAnchorEnd)
      : "";
  for (const requiredAuthorityAnchor of [
    "where database_row.datname = pg_catalog.current_database()",
    "(current_user::pg_catalog.regrole)::oid <> authority_owner",
    "with recursive owner_members(member_oid) as (",
    "where membership.roleid = authority_owner",
    "join owner_members inherited on membership.roleid = inherited.member_oid",
    "from owner_members",
    "with recursive service_members(member_oid) as (",
    "where membership.roleid = 'service_role'::regrole",
    "join service_members inherited on membership.roleid = inherited.member_oid",
    "from pg_catalog.pg_roles authenticator_role",
    "authenticator_role.oid = 'authenticator'::regrole",
    "not authenticator_role.rolinherit",
    "not authenticator_role.rolsuper",
    "not authenticator_role.rolbypassrls",
    "not authenticator_role.rolcreaterole",
    "service_authority_role.oid = 'service_role'::regrole",
    "service_authority_role.rolbypassrls",
    "anonymous_role.oid = 'anon'::regrole",
    "authenticated_role.oid = 'authenticated'::regrole",
    "where service_members.member_oid = authenticator_role.oid",
    "service_members.member_oid not in ( authenticator_role.oid, authority_owner )",
    "member_role.rolname <> 'supabase_storage_admin'",
    "canonical_membership.roleid = 'service_role'::regrole",
    "canonical_membership.member = authenticator_role.oid",
    "not canonical_membership.admin_option",
    "pg_catalog.to_jsonb(canonical_membership) ->> 'inherit_option'",
    "pg_catalog.to_jsonb(canonical_membership) ->> 'set_option'",
    "'public.story_specs'::regclass",
    "'public.figure_stages'::regclass",
    "'public.story_artifacts'::regclass",
    "relation_row.relowner <> authority_owner",
    "procedure_row.proname in ( 'enforce_figure_stage_publication', 'enforce_story_spec_lifecycle', 'promote_story_spec', 'promote_story_spec_v2', 'retire_story_spec', 'story_spec_publication_manifest_v1', 'story_spec_publication_schema_health_v1' )",
    "procedure_row.oid not in ( 'public.enforce_story_spec_lifecycle()'::regprocedure, 'public.promote_story_spec(text)'::regprocedure, 'public.retire_story_spec(text)'::regprocedure )",
    "procedure_row.proowner <> authority_owner",
    "trigger_row.tgrelid = 'public.figure_stages'::regclass",
    "and not trigger_row.tgisinternal",
  ]) {
    if (!authorityAnchor.includes(requiredAuthorityAnchor)) {
      failures.push(
        `publication authority anchor is missing: ${requiredAuthorityAnchor}`,
      );
    }
  }
  const preflightStorageGraphStart = authorityAnchor.indexOf(
    "and not exists ( select 1 from pg_catalog.pg_auth_members authenticator_member",
  );
  const preflightStorageGraphEnd = authorityAnchor.indexOf(
    ") then raise exception 'storyspec service authority role graph is unsafe'",
    preflightStorageGraphStart,
  );
  const preflightStorageGraph =
    preflightStorageGraphStart >= 0 &&
    preflightStorageGraphEnd > preflightStorageGraphStart
      ? authorityAnchor.slice(
          preflightStorageGraphStart,
          preflightStorageGraphEnd,
        )
      : "";
  const storageGraphRequirements = [
    "storage_role.rolname = 'supabase_storage_admin' and storage_role.oid = authenticator_member.member",
    "storage_membership.roleid in ( 'service_role'::regrole, authenticator_role.oid )",
    "and not exists ( select 1 from pg_catalog.pg_auth_members storage_membership where storage_membership.roleid = authenticator_role.oid and storage_membership.member = storage_role.oid )",
    "not exists ( select 1 from pg_catalog.pg_auth_members storage_membership where storage_membership.roleid = 'service_role'::regrole and storage_membership.member = storage_role.oid )",
  ];
  if (
    !preflightStorageGraph ||
    storageGraphRequirements.some(
      (required) => !preflightStorageGraph.includes(required),
    ) ||
    countOccurrences(
      preflightStorageGraph,
      "storage_membership.roleid = 'service_role'::regrole",
    ) !== 2 ||
    countOccurrences(
      preflightStorageGraph,
      "storage_membership.roleid = authenticator_role.oid",
    ) !== 2 ||
    countOccurrences(
      preflightStorageGraph,
      "not storage_membership.admin_option",
    ) !== 2 ||
    countOccurrences(
      preflightStorageGraph,
      "pg_catalog.to_jsonb(storage_membership) ->> 'inherit_option'",
    ) !== 2 ||
    countOccurrences(
      preflightStorageGraph,
      "pg_catalog.to_jsonb(storage_membership) ->> 'set_option'",
    ) !== 2 ||
    countOccurrences(preflightStorageGraph, "storage_role.rolinherit") !== 2
  ) {
    failures.push(
      "publication preflight must allow exactly one direct-or-indirect storage-admin edge with canonical membership options",
    );
  }
  if (migration.includes("pg_catalog.pg_has_role(")) {
    failures.push(
      "publication authority must inspect the actual recursive membership graph rather than effective pg_has_role privileges",
    );
  }
  const boundaryLockIndex = migration.indexOf(
    "lock table public.story_specs, public.figure_stages, public.story_artifacts in access exclusive mode",
  );
  if (
    boundaryLockIndex < 0 ||
    authorityAnchorStart <= boundaryLockIndex
  ) {
    failures.push(
      "publication cutover must lock all three source tables before catalog preflight",
    );
  }
  const preflightProtectedRelations = [
    "'public.story_specs'::regclass",
    "'public.figure_stages'::regclass",
    "'public.story_artifacts'::regclass",
  ];
  const preflightInheritanceStart = authorityAnchor.indexOf(
    "if exists ( select 1 from pg_catalog.pg_inherits inheritance_row",
  );
  const preflightRewriteStart = authorityAnchor.indexOf(
    "if exists ( select 1 from pg_catalog.pg_rewrite rewrite_row",
    preflightInheritanceStart,
  );
  const markerPreflightStart = authorityAnchor.indexOf(
    "if pg_catalog.to_regclass(",
    preflightRewriteStart,
  );
  const preflightInheritance =
    preflightInheritanceStart >= 0 &&
    preflightRewriteStart > preflightInheritanceStart
      ? authorityAnchor.slice(
          preflightInheritanceStart,
          preflightRewriteStart,
        )
      : "";
  const preflightRewrite =
    preflightRewriteStart >= 0 &&
    markerPreflightStart > preflightRewriteStart
      ? authorityAnchor.slice(preflightRewriteStart, markerPreflightStart)
      : "";
  if (
    !preflightInheritance.includes(
      "where inheritance_row.inhparent in (",
    ) ||
    !preflightInheritance.includes(
      "or inheritance_row.inhrelid in (",
    ) ||
    !preflightInheritance.includes(
      "storyspec cutover forbids inheritance and partition edges",
    ) ||
    preflightInheritance.includes(
      "'public.story_artifact_legacy_v5_replay'::regclass",
    ) ||
    preflightProtectedRelations.some(
      (relation) =>
        countOccurrences(preflightInheritance, relation) !== 2,
    )
  ) {
    failures.push(
      "publication preflight must reject both directions of every locked-table inheritance or partition edge",
    );
  }
  if (
    !preflightRewrite.includes("where rewrite_row.ev_class in (") ||
    !preflightRewrite.includes(
      "storyspec cutover forbids table rewrite rules",
    ) ||
    preflightRewrite.includes(
      "'public.story_artifact_legacy_v5_replay'::regclass",
    ) ||
    preflightProtectedRelations.some(
      (relation) => countOccurrences(preflightRewrite, relation) !== 1,
    )
  ) {
    failures.push(
      "publication preflight must reject rewrite rules on every locked source table",
    );
  }
  const preflightGeneratedColumnStart = authorityAnchor.indexOf(
    "if exists ( select 1 from pg_catalog.pg_attribute attribute_row",
    markerPreflightStart,
  );
  const preflightIdentityKeyStart = authorityAnchor.indexOf(
    "if ( select count(*) from pg_catalog.pg_constraint constraint_row",
    preflightGeneratedColumnStart,
  );
  const preflightLifecycleDependencyStart = authorityAnchor.indexOf(
    "if exists ( select 1 from pg_catalog.pg_constraint constraint_row join pg_catalog.pg_attribute terminal_attribute",
    preflightIdentityKeyStart,
  );
  const preflightRoutineInventoryStart = authorityAnchor.indexOf(
    "if exists ( select 1 from pg_catalog.pg_proc procedure_row",
    preflightLifecycleDependencyStart,
  );
  const preflightGeneratedColumn =
    preflightGeneratedColumnStart >= 0 &&
    preflightIdentityKeyStart > preflightGeneratedColumnStart
      ? authorityAnchor.slice(
          preflightGeneratedColumnStart,
          preflightIdentityKeyStart,
        )
      : "";
  if (
    !preflightGeneratedColumn.includes(
      "where attribute_row.attrelid in (",
    ) ||
    !preflightGeneratedColumn.includes("attribute_row.attnum > 0") ||
    !preflightGeneratedColumn.includes(
      "not attribute_row.attisdropped",
    ) ||
    !preflightGeneratedColumn.includes("attribute_row.attgenerated <> ''") ||
    !preflightGeneratedColumn.includes(
      "storyspec cutover forbids generated columns on publication tables",
    ) ||
    countOccurrences(
      preflightGeneratedColumn,
      "'public.story_specs'::regclass",
    ) !== 1 ||
    countOccurrences(
      preflightGeneratedColumn,
      "'public.figure_stages'::regclass",
    ) !== 1 ||
    preflightGeneratedColumn.includes(
      "'public.story_artifacts'::regclass",
    ) ||
    preflightGeneratedColumn.includes(
      "'public.story_artifact_legacy_v5_replay'::regclass",
    )
  ) {
    failures.push(
      "publication preflight must reject every generated column on either publication table",
    );
  }
  const preflightIdentityKey =
    preflightIdentityKeyStart >= 0 &&
    preflightLifecycleDependencyStart > preflightIdentityKeyStart
      ? authorityAnchor.slice(
          preflightIdentityKeyStart,
          preflightLifecycleDependencyStart,
        )
      : "";
  const identityKeyRequirements = [
    "constraint_row.conname = 'story_specs_pkey'",
    "constraint_row.contype = 'p'",
    "constraint_row.convalidated",
    "constraint_row.conislocal",
    "constraint_row.coninhcount = 0",
    "constraint_row.conparentid = 0",
    "constraint_row.connoinherit",
    "not constraint_row.condeferrable",
    "not constraint_row.condeferred",
    "constraint_row.conkey = array[identity_attribute.attnum]::smallint[]",
    "identity_attribute.atttypid = 'text'::pg_catalog.regtype",
    "identity_attribute.attnotnull",
    "not identity_attribute.atthasdef",
    "identity_attribute.attidentity = ''",
    "identity_attribute.attgenerated = ''",
    "index_row.indisprimary",
    "index_row.indisunique",
    "index_row.indimmediate",
    "index_row.indisvalid",
    "index_row.indisready",
    "index_row.indislive",
    "index_row.indnkeyatts = 1",
    "index_row.indnatts = 1",
    "index_row.indexprs is null",
    "index_row.indpred is null",
    "storyspec identity primary key is unsafe",
  ];
  if (
    !preflightIdentityKey.includes(
      "where constraint_row.conrelid = 'public.story_specs'::regclass and constraint_row.contype = 'p' ) <> 1",
    ) ||
    identityKeyRequirements.some(
      (required) => !preflightIdentityKey.includes(required),
    )
  ) {
    failures.push(
      "publication preflight must prove one exact non-null text StorySpec identity primary key",
    );
  }
  const preflightLifecycleDependency =
    preflightLifecycleDependencyStart >= 0 &&
    preflightRoutineInventoryStart > preflightLifecycleDependencyStart
      ? authorityAnchor.slice(
          preflightLifecycleDependencyStart,
          preflightRoutineInventoryStart,
        )
      : "";
  const lifecycleSurfaceInventory =
    "terminal_attribute.attname in ( 'status', 'spec', 'published_at', 'retired_at' )";
  if (
    countOccurrences(
      preflightLifecycleDependency,
      lifecycleSurfaceInventory,
    ) !== 2 ||
    !preflightLifecycleDependency.includes(
      "constraint_row.contype <> 'n'",
    ) ||
    !preflightLifecycleDependency.includes(
      "constraint_row.conname not in ( 'story_specs_status_check', 'story_specs_document_identity_check' )",
    ) ||
    !preflightLifecycleDependency.includes(
      "index_relation.relname <> 'story_specs_one_published_stage_idx'",
    ) ||
    preflightLifecycleDependency.includes("index_row.indisunique") ||
    preflightLifecycleDependency.includes("index_row.indisexclusion") ||
    !preflightLifecycleDependency.includes(
      "terminal_attribute.attnum = any(index_row.indkey)",
    ) ||
    !preflightLifecycleDependency.includes(
      "from pg_catalog.pg_depend dependency",
    ) ||
    !preflightLifecycleDependency.includes(
      "dependency.refobjsubid = terminal_attribute.attnum",
    ) ||
    !preflightLifecycleDependency.includes(
      "storyspec terminal lifecycle has an unsafe schema dependency",
    )
  ) {
    failures.push(
      "publication preflight must inventory every constraint and extra-index dependency on all four terminal lifecycle surfaces",
    );
  }
  const markerDdlStart = migration.indexOf(
    "create table public.story_artifact_legacy_v5_replay (",
  );
  const markerDdlEnd = migration.indexOf(
    "create or replace function public.enforce_story_spec_lifecycle()",
    markerDdlStart,
  );
  const markerDdl =
    markerDdlStart >= 0 && markerDdlEnd > markerDdlStart
      ? migration.slice(markerDdlStart, markerDdlEnd)
      : "";
  const markerDdlRequirements = [
    "artifact_id text not null",
    "constraint story_artifact_legacy_v5_replay_pkey primary key (artifact_id)",
    "constraint story_artifact_legacy_v5_replay_artifact_fk foreign key (artifact_id) references public.story_artifacts (artifact_id) on delete cascade",
    "comment on table public.story_artifact_legacy_v5_replay is 'onward-story-artifact-legacy-v5-replay-v1'",
    "insert into public.story_artifact_legacy_v5_replay (artifact_id) select artifact.artifact_id from only public.story_artifacts artifact where artifact.schema_version = 'story-artifact-v5-2026-07'",
    "alter table public.story_artifact_legacy_v5_replay enable row level security",
    "alter table public.story_artifact_legacy_v5_replay force row level security",
    "revoke all on table public.story_artifact_legacy_v5_replay from public, anon, authenticated, service_role",
    "where acl.grantee <> target.relowner",
    "grant select on table public.story_artifact_legacy_v5_replay to service_role",
  ];
  if (
    countOccurrences(
      migration,
      "create table public.story_artifact_legacy_v5_replay (",
    ) !== 1 ||
    !authorityAnchor.includes(
      "if pg_catalog.to_regclass( 'public.story_artifact_legacy_v5_replay' ) is not null then raise exception 'legacy storyartifact replay marker relation already exists'",
    ) ||
    markerDdlRequirements.some(
      (required) => !markerDdl.includes(required),
    ) ||
    markerDdl.includes("create policy") ||
    /grant\s+(?:insert|update|delete|truncate|references|trigger|all)\s+on table public\.story_artifact_legacy_v5_replay/.test(
      markerDdl,
    )
  ) {
    failures.push(
      "legacy-v5 replay eligibility must be a one-time, v5-only, owner-controlled marker with a forced-RLS read-only boundary",
    );
  }
  const publicationIndexDdlStart = casePreservedMigration.indexOf(
    "drop index if exists public.story_specs_one_published_stage_idx;",
  );
  const publicationIndexDdlEnd = casePreservedMigration.indexOf(
    "-- Capture the server's own exact deparse",
    publicationIndexDdlStart,
  );
  const publicationIndexDdl =
    publicationIndexDdlStart >= 0 &&
    publicationIndexDdlEnd > publicationIndexDdlStart
      ? casePreservedMigration
          .slice(publicationIndexDdlStart, publicationIndexDdlEnd)
          .trim()
      : "";
  const canonicalPublicationIndexDdl = `
    drop index if exists public.story_specs_one_published_stage_idx;
    create unique index story_specs_one_published_stage_idx
      on public.story_specs (figure_key, stage_id)
      where status = 'published';
  `
    .replace(/\s+/g, " ")
    .trim();
  if (publicationIndexDdl !== canonicalPublicationIndexDdl) {
    failures.push(
      "publication migration must recreate the exact code-owned published-stage index",
    );
  }
  const schemaCaptureStart = casePreservedMigration.indexOf(
    "identity_fingerprint text;",
  );
  const promotionDefinitionStart = casePreservedMigration.indexOf(
    "create or replace function public.promote_story_spec_v2",
    schemaCaptureStart,
  );
  const schemaCapture =
    schemaCaptureStart >= 0 && promotionDefinitionStart > schemaCaptureStart
      ? casePreservedMigration.slice(
          schemaCaptureStart,
          promotionDefinitionStart,
        )
      : "";
  if (
    !schemaCapture ||
    /pg_catalog\.(?:lower|translate|replace|regexp_replace)\(/.test(
      schemaCapture,
    ) ||
    !schemaCapture.includes(
      "pg_catalog.md5( pg_catalog.pg_get_constraintdef(",
    ) ||
    !schemaCapture.includes(
      "pg_catalog.md5( pg_catalog.pg_get_indexdef(index_row.indexrelid, 0, true)",
    ) ||
    !schemaCapture.includes("into strict story_status_fingerprint") ||
    !schemaCapture.includes("into strict stage_fk_fingerprint") ||
    !schemaCapture.includes("into strict stage_status_fingerprint") ||
    !schemaCapture.includes("into strict stage_trigger_fingerprint") ||
    !schemaCapture.includes("onward-story-spec-stage-fk-v1:") ||
    !schemaCapture.includes("onward-story-spec-status-v1:") ||
    !schemaCapture.includes("onward-figure-stage-status-v1:") ||
    !schemaCapture.includes("onward-figure-stage-lifecycle-v1:") ||
    !schemaCapture.includes(
      "|| ':owner=' || story_specs_owner::text",
    ) ||
    !schemaCapture.includes(
      "create or replace function public.story_spec_publication_manifest_v1()",
    ) ||
    !schemaCapture.includes(
      "select %L::text, %L::text, %L::text, %L::text, %L::text, %L::text, %s::oid",
    )
  ) {
    failures.push(
      "schema manifest must capture exact identity, stage, trigger, and full-index deparses as independent constants",
    );
  }
  const indexRecreateIndex = migration.indexOf(
    "create unique index story_specs_one_published_stage_idx",
  );
  const schemaCaptureIndex = migration.indexOf(
    "into strict identity_fingerprint",
  );
  if (
    indexRecreateIndex < 0 ||
    schemaCaptureIndex <= indexRecreateIndex
  ) {
    failures.push(
      "schema manifest must follow canonical publication-index recreation",
    );
  }
  if (migration.includes("has_function_privilege(")) {
    failures.push(
      "publication ACL health must enumerate every EXECUTE grantee",
    );
  }
  const functionAclScrub = migration.indexOf(
    "acl.grantee <> target.proowner",
  );
  const v2ServiceGrant = migration.indexOf(
    "grant execute on function public.promote_story_spec_v2",
  );
  const retirementServiceGrant = migration.indexOf(
    "grant execute on function public.retire_story_spec",
  );
  const tableAclScrub = migration.indexOf(
    "revoke all on table public.story_specs",
  );
  const tableServiceGrant = migration.indexOf(
    "grant select, insert, update on table public.story_specs",
  );
  const columnAclScrub = migration.indexOf("for column_grant in");
  const stageTableAclScrub = migration.indexOf(
    "revoke all on table public.figure_stages",
  );
  const stageColumnAclScrub = migration.indexOf(
    "for column_grant in",
    columnAclScrub + 1,
  );
  const stageServiceGrant = migration.indexOf(
    "grant select, insert, update on table public.figure_stages",
  );
  const healthAclScrub = migration.lastIndexOf(
    "acl.grantee <> target.proowner",
  );
  const healthServiceGrant = migration.indexOf(
    "grant execute on function public.story_spec_publication_schema_health_v1",
  );
  if (
    functionAclScrub < 0 ||
    v2ServiceGrant <= functionAclScrub ||
    retirementServiceGrant <= functionAclScrub ||
    tableAclScrub < 0 ||
    columnAclScrub <= tableAclScrub ||
    tableServiceGrant <= tableAclScrub ||
    tableServiceGrant <= columnAclScrub ||
    stageTableAclScrub <= tableServiceGrant ||
    stageColumnAclScrub <= stageTableAclScrub ||
    stageServiceGrant <= stageColumnAclScrub ||
    healthAclScrub <= v2ServiceGrant ||
    healthAclScrub <= stageServiceGrant ||
    healthServiceGrant <= healthAclScrub
  ) {
    failures.push(
      "publication ACL cutover must scrub unknown grantees before restoring service-role access",
    );
  }
  const lifecycleAclTargetStart = migration.indexOf(
    "for target in select procedure_row.oid",
  );
  const lifecycleAclTargetEnd = migration.indexOf(
    "grant execute on function public.promote_story_spec_v2",
    lifecycleAclTargetStart,
  );
  const lifecycleAclTargets =
    lifecycleAclTargetStart >= 0 &&
    lifecycleAclTargetEnd > lifecycleAclTargetStart
      ? migration.slice(lifecycleAclTargetStart, lifecycleAclTargetEnd)
      : "";
  for (const requiredAclTarget of [
    "'public.enforce_figure_stage_publication()'::regprocedure",
    "'public.enforce_story_spec_lifecycle()'::regprocedure",
    "'public.promote_story_spec(text)'::regprocedure",
    "'public.promote_story_spec_v2(text,jsonb)'::regprocedure",
    "'public.retire_story_spec(text)'::regprocedure",
    "'public.story_spec_publication_manifest_v1()'::regprocedure",
  ]) {
    if (!lifecycleAclTargets.includes(requiredAclTarget)) {
      failures.push(
        `publication ACL scrub omits controlled routine: ${requiredAclTarget}`,
      );
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
  const promotionHealthStart = migration.indexOf("promotion_health as (");
  const retirementHealthStart = migration.indexOf(
    "retirement_health as (",
    promotionHealthStart,
  );
  const promotionHealth =
    promotionHealthStart >= 0 && retirementHealthStart > promotionHealthStart
      ? migration.slice(promotionHealthStart, retirementHealthStart)
      : "";
  if (
    !promotionHealth ||
    promotionHealth.includes("position(") ||
    promotionHealth.includes("pg_catalog.lower(") ||
    !promotionHealth.includes(
      "procedure_row.proowner = ( select table_relation.relowner",
    ) ||
    !promotionHealth.includes(
      "'public.figure_stages', 'select'",
    )
  ) {
    failures.push(
      "publication health must use a case-preserving exact fingerprint rather than scan or lowercase tokens",
    );
  }
  const legacyHealthStart = migration.indexOf(
    "legacy_health as (",
    retirementHealthStart,
  );
  const retirementHealth =
    retirementHealthStart >= 0 && legacyHealthStart > retirementHealthStart
      ? migration.slice(retirementHealthStart, legacyHealthStart)
      : "";
  if (
    !retirementHealth ||
    !retirementHealth.includes(
      "'public.retire_story_spec(text)'::regprocedure",
    ) ||
    !retirementHealth.includes(
      "procedure_row.proowner = table_relation.relowner",
    ) ||
    !retirementHealth.includes("b58ebb00db35f1ece3497c14065529c5")
  ) {
    failures.push(
      "retirement health must attest the exact owner-definer body and owner",
    );
  }
  const lifecycleHelperStart = migration.indexOf(
    "lifecycle_helper_health as (",
  );
  const lifecycleTriggerStart = migration.indexOf(
    "lifecycle_trigger_health as (",
    lifecycleHelperStart,
  );
  const lifecycleHelperHealth =
    lifecycleHelperStart >= 0 && lifecycleTriggerStart > lifecycleHelperStart
      ? migration.slice(lifecycleHelperStart, lifecycleTriggerStart)
      : "";
  if (
    !lifecycleHelperHealth ||
    lifecycleHelperHealth.includes("pg_catalog.lower(") ||
    !lifecycleHelperHealth.includes("count(*) = 1") ||
    !lifecycleHelperHealth.includes(
      "procedure_row.proowner = table_relation.relowner",
    ) ||
    !lifecycleHelperHealth.includes(
      "array['search_path=pg_catalog, public']::text[]",
    ) ||
    !lifecycleHelperHealth.includes("332ff0ca21935141c04d83c125b016af")
  ) {
    failures.push(
      "lifecycle health must attest one exact owner-bound transition helper",
    );
  }
  const storyIdentityKeyHealthStart = migration.indexOf(
    "story_identity_key_health as (",
  );
  const identityHealthBoundaryStart = migration.indexOf(
    "identity_health as (",
    storyIdentityKeyHealthStart,
  );
  const storyIdentityKeyHealth =
    storyIdentityKeyHealthStart >= 0 &&
    identityHealthBoundaryStart > storyIdentityKeyHealthStart
      ? migration.slice(
          storyIdentityKeyHealthStart,
          identityHealthBoundaryStart,
        )
      : "";
  const identityKeyHealthRequirements = [
    "count(*) = 1 and count(*) filter (",
    "constraint_row.conname = 'story_specs_pkey'",
    "constraint_row.convalidated",
    "constraint_row.conislocal",
    "constraint_row.coninhcount = 0",
    "constraint_row.conparentid = 0",
    "constraint_row.connoinherit",
    "not constraint_row.condeferrable",
    "not constraint_row.condeferred",
    "constraint_row.conkey = array[identity_attribute.attnum]::smallint[]",
    "table_relation.relowner = publication_manifest.authority_owner",
    "identity_attribute.atttypid = 'text'::pg_catalog.regtype",
    "identity_attribute.attnotnull",
    "not identity_attribute.atthasdef",
    "identity_attribute.attidentity = ''",
    "identity_attribute.attgenerated = ''",
    "index_relation.relname = 'story_specs_pkey'",
    "index_relation.relkind = 'i'",
    "index_relation.relowner = publication_manifest.authority_owner",
    "index_relation.reloptions is null",
    "index_row.indisprimary",
    "index_row.indisunique",
    "index_row.indimmediate",
    "index_row.indisvalid",
    "index_row.indisready",
    "index_row.indislive",
    "index_row.indnkeyatts = 1",
    "index_row.indnatts = 1",
    "index_row.indexprs is null",
    "index_row.indpred is null",
    "where constraint_row.conrelid = 'public.story_specs'::regclass and constraint_row.contype = 'p'",
  ];
  if (
    !storyIdentityKeyHealth ||
    identityKeyHealthRequirements.some(
      (required) => !storyIdentityKeyHealth.includes(required),
    )
  ) {
    failures.push(
      "publication health must attest the exact owner-bound non-null StorySpec identity key and primary index",
    );
  }
  const identityHealthStart = casePreservedMigration.indexOf(
    "identity_health as (",
  );
  const lifecycleHelperCaseStart = casePreservedMigration.indexOf(
    "lifecycle_helper_health as (",
    identityHealthStart,
  );
  const identityHealth =
    identityHealthStart >= 0 && lifecycleHelperCaseStart > identityHealthStart
      ? casePreservedMigration.slice(
          identityHealthStart,
          lifecycleHelperCaseStart,
        )
      : "";
  if (
    !identityHealth ||
    /pg_catalog\.(?:lower|translate|replace|regexp_replace)\(/.test(
      identityHealth,
    ) ||
    !identityHealth.includes(
      "'onward-story-spec-identity-v1:' || publication_manifest.identity_fingerprint",
    ) ||
    !identityHealth.includes(
      "pg_catalog.md5( pg_catalog.pg_get_constraintdef( constraint_row.oid, true ) ) = publication_manifest.identity_fingerprint",
    ) ||
    !identityHealth.includes(
      "table_relation.relowner = publication_manifest.authority_owner",
    )
  ) {
    failures.push(
      "identity health must compare the exact server-captured constraint deparse",
    );
  }
  for (const exactDocumentKey of [
    "spec -> 'storySpecId' =",
    "spec -> 'figureKey' =",
    "spec -> 'stageId' =",
    "spec -> 'schemaVersion' =",
  ]) {
    if (!casePreservedMigration.includes(exactDocumentKey)) {
      failures.push(
        `strict identity constraint omits exact key: ${exactDocumentKey}`,
      );
    }
  }
  const publicationIndexStart = casePreservedMigration.indexOf(
    "publication_index_health as (",
  );
  const promotionHealthCaseStart = casePreservedMigration.indexOf(
    "promotion_health as (",
    publicationIndexStart,
  );
  const publicationIndexHealth =
    publicationIndexStart >= 0 &&
    promotionHealthCaseStart > publicationIndexStart
      ? casePreservedMigration.slice(
          publicationIndexStart,
          promotionHealthCaseStart,
        )
      : "";
  if (
    !publicationIndexHealth ||
    /pg_catalog\.(?:lower|translate|replace|regexp_replace)\(/.test(
      publicationIndexHealth,
    ) ||
    !publicationIndexHealth.includes(
      "'onward-story-spec-published-index-v1:' || publication_manifest.publication_index_fingerprint",
    ) ||
    !publicationIndexHealth.includes(
      "pg_catalog.md5( pg_catalog.pg_get_indexdef( index_row.indexrelid, 0, true ) ) = publication_manifest.publication_index_fingerprint",
    ) ||
    !publicationIndexHealth.includes(
      "index_relation.relowner = table_relation.relowner",
    ) ||
    !publicationIndexHealth.includes(
      "index_relation.relowner = publication_manifest.authority_owner",
    ) ||
    !publicationIndexHealth.includes("index_relation.reloptions is null") ||
    !publicationIndexHealth.includes("index_row.indimmediate") ||
    !publicationIndexHealth.includes("not index_row.indnullsnotdistinct")
  ) {
    failures.push(
      "publication-index health must compare the exact server-captured full definition",
    );
  }
  const triggerHealthStart = migration.indexOf(
    "lifecycle_trigger_health as (",
  );
  const lifecycleHealthStart = migration.indexOf(
    "lifecycle_health as (",
    triggerHealthStart,
  );
  const triggerHealth =
    triggerHealthStart >= 0 && lifecycleHealthStart > triggerHealthStart
      ? migration.slice(triggerHealthStart, lifecycleHealthStart)
      : "";
  if (
    !triggerHealth ||
    !triggerHealth.includes("trigger_row.tgenabled = 'o'") ||
    !triggerHealth.includes(
      "count(*) filter ( where not trigger_row.tgisinternal ) = 1",
    ) ||
    triggerHealth.includes("trigger_row.tgenabled <> 'd'")
  ) {
    failures.push(
      "lifecycle health must attest the sole user trigger, including disabled rows",
    );
  }
  const stageFkHealthStart = migration.indexOf("stage_fk_health as (");
  const storyStatusHealthStart = casePreservedMigration.indexOf(
    "story_status_constraint_health as (",
  );
  const storyStatusHealth =
    storyStatusHealthStart >= 0 &&
    stageFkHealthStart > storyStatusHealthStart
      ? casePreservedMigration.slice(
          storyStatusHealthStart,
          stageFkHealthStart,
        )
      : "";
  if (
    !storyStatusHealth ||
    !storyStatusHealth.includes(
      "constraint_row.conname = 'story_specs_status_check'",
    ) ||
    !storyStatusHealth.includes(
      "'onward-story-spec-status-v1:' || publication_manifest.story_status_fingerprint",
    ) ||
    !storyStatusHealth.includes("other_constraint.contype <> 'n'") ||
    countOccurrences(
      storyStatusHealth,
      lifecycleSurfaceInventory,
    ) !== 2 ||
    !storyStatusHealth.includes(
      "terminal_attribute.attnum = any(other_constraint.conkey)",
    ) ||
    !storyStatusHealth.includes(
      "other_index.indexrelid <> 'public.story_specs_one_published_stage_idx'::regclass",
    ) ||
    storyStatusHealth.includes("other_index.indisunique") ||
    storyStatusHealth.includes("other_index.indisexclusion") ||
    !storyStatusHealth.includes("pg_catalog.pg_depend dependency") ||
    !storyStatusHealth.includes(
      "dependency.refobjsubid = terminal_attribute.attnum",
    )
  ) {
    failures.push(
      "StorySpec status health must reject additive dependencies across every terminal lifecycle surface",
    );
  }
  const stageStatusHealthStart = migration.indexOf(
    "stage_status_constraint_health as (",
    stageFkHealthStart,
  );
  const stageFkHealth =
    stageFkHealthStart >= 0 && stageStatusHealthStart > stageFkHealthStart
      ? migration.slice(stageFkHealthStart, stageStatusHealthStart)
      : "";
  if (
    !stageFkHealth ||
    !stageFkHealth.includes("constraint_row.conname = 'story_specs_stage_fk'") ||
    !stageFkHealth.includes("constraint_row.contype = 'f'") ||
    !stageFkHealth.includes("constraint_row.convalidated") ||
    !stageFkHealth.includes("constraint_row.connoinherit") ||
    !stageFkHealth.includes("constraint_row.confdeltype = 'r'") ||
    !stageFkHealth.includes(
      "constraint_row.confrelid = 'public.figure_stages'::regclass",
    ) ||
    !stageFkHealth.includes(
      "'onward-story-spec-stage-fk-v1:' || publication_manifest.stage_fk_fingerprint",
    ) ||
    !stageFkHealth.includes(
      ") = publication_manifest.stage_fk_fingerprint",
    ) ||
    !stageFkHealth.includes("trigger_row.tgconstraint = constraint_row.oid") ||
    !stageFkHealth.includes("trigger_row.tgenabled = 'o'") ||
    !stageFkHealth.includes(") = 4")
  ) {
    failures.push(
      "stage foreign-key health must attest its exact identity, owner, definition, and enabled internal triggers",
    );
  }
  const storyLifecycleHelperStart = migration.indexOf(
    "lifecycle_helper_health as (",
    stageStatusHealthStart,
  );
  const stageStatusHealth =
    stageStatusHealthStart >= 0 &&
    storyLifecycleHelperStart > stageStatusHealthStart
      ? migration.slice(stageStatusHealthStart, storyLifecycleHelperStart)
      : "";
  if (
    !stageStatusHealth ||
    !stageStatusHealth.includes(
      "constraint_row.conname = 'figure_stages_status_check'",
    ) ||
    !stageStatusHealth.includes("constraint_row.convalidated") ||
    !stageStatusHealth.includes("status_attribute.attnotnull") ||
    !stageStatusHealth.includes("status_attribute.atthasdef") ||
    !stageStatusHealth.includes("= '''draft''::text'") ||
    !stageStatusHealth.includes(
      "'onward-figure-stage-status-v1:' || publication_manifest.stage_status_fingerprint",
    ) ||
    !stageStatusHealth.includes("other_constraint.contype <> 'n'") ||
    stageStatusHealth.includes("other_index.indisunique") ||
    stageStatusHealth.includes("other_index.indisexclusion") ||
    !stageStatusHealth.includes("pg_catalog.pg_depend dependency")
  ) {
    failures.push(
      "figure-stage status health must attest its exact draft contract and reject additive status DDL",
    );
  }
  const stageLifecycleHelperStart = migration.indexOf(
    "stage_lifecycle_helper_health as (",
  );
  const stageLifecycleTriggerStart = migration.indexOf(
    "stage_lifecycle_trigger_health as (",
    stageLifecycleHelperStart,
  );
  const stageLifecycleHealthStart = migration.indexOf(
    "stage_lifecycle_health as (",
    stageLifecycleTriggerStart,
  );
  const stageLifecycleHelperHealth =
    stageLifecycleHelperStart >= 0 &&
    stageLifecycleTriggerStart > stageLifecycleHelperStart
      ? migration.slice(stageLifecycleHelperStart, stageLifecycleTriggerStart)
      : "";
  const stageLifecycleTriggerHealth =
    stageLifecycleTriggerStart >= 0 &&
    stageLifecycleHealthStart > stageLifecycleTriggerStart
      ? migration.slice(stageLifecycleTriggerStart, stageLifecycleHealthStart)
      : "";
  if (
    !stageLifecycleHelperHealth.includes(
      "'public.enforce_figure_stage_publication()'::regprocedure",
    ) ||
    !stageLifecycleHelperHealth.includes(
      "procedure_row.proowner = table_relation.relowner",
    ) ||
    !stageLifecycleHelperHealth.includes(
      "36d8d57e86e730a48930a6f0502e4b56",
    ) ||
    !stageLifecycleTriggerHealth.includes(
      "trigger_row.tgname = 'figure_stages_publication_lifecycle'",
    ) ||
    !stageLifecycleTriggerHealth.includes("trigger_row.tgenabled = 'o'") ||
    !stageLifecycleTriggerHealth.includes(
      "'onward-figure-stage-lifecycle-v1:' || publication_manifest.stage_trigger_fingerprint",
    ) ||
    !stageLifecycleTriggerHealth.includes(
      "count(*) filter ( where not trigger_row.tgisinternal ) = 1",
    )
  ) {
    failures.push(
      "figure-stage lifecycle health must attest the sole owner-gated status trigger and helper",
    );
  }
  if (
    (migration.match(/raise exception 'storyspec stage not found'/g) ?? [])
      .length !== 2
  ) {
    failures.push(
      "both terminal StorySpec routines must fail atomically when their stage projection is missing",
    );
  }
  const catalogAlignmentStart = migration.indexOf(
    "catalog_alignment_health as (",
  );
  const publicationIndexHealthStart = migration.indexOf(
    "publication_index_health as (",
    catalogAlignmentStart,
  );
  const catalogAlignmentHealth =
    catalogAlignmentStart >= 0 &&
    publicationIndexHealthStart > catalogAlignmentStart
      ? migration.slice(
          catalogAlignmentStart,
          publicationIndexHealthStart,
        )
      : "";
  if (
    !catalogAlignmentHealth ||
    !catalogAlignmentHealth.includes(
      "(stage.status = 'published') is distinct from exists",
    ) ||
    !catalogAlignmentHealth.includes(
      "story_spec.figure_key = stage.figure_key",
    ) ||
    !catalogAlignmentHealth.includes(
      "story_spec.stage_id = stage.stage_id",
    ) ||
    !catalogAlignmentHealth.includes(
      "story_spec.status = 'published'",
    )
  ) {
    failures.push(
      "schema health must prove the stage catalog is exactly aligned to published StorySpecs",
    );
  }
  const authorityHealthStart = migration.indexOf("authority_health as (");
  const healthRoleGraphStart = migration.indexOf(
    "with recursive publication_manifest as materialized (",
  );
  const manifestHealthStart = migration.indexOf(
    "manifest_function_health as (",
    authorityHealthStart,
  );
  const healthRoleGraph =
    healthRoleGraphStart >= 0 && authorityHealthStart > healthRoleGraphStart
      ? migration.slice(healthRoleGraphStart, authorityHealthStart)
      : "";
  const authorityHealth =
    authorityHealthStart >= 0 && manifestHealthStart > authorityHealthStart
      ? migration.slice(authorityHealthStart, manifestHealthStart)
      : "";
  for (const requiredHealthRoleGraph of [
    "owner_members(member_oid) as (",
    "from pg_catalog.pg_auth_members membership",
    "membership.roleid = publication_manifest.authority_owner",
    "join owner_members inherited on membership.roleid = inherited.member_oid",
    "service_members(member_oid) as (",
    "membership.roleid = 'service_role'::regrole",
    "join service_members inherited on membership.roleid = inherited.member_oid",
  ]) {
    if (!healthRoleGraph.includes(requiredHealthRoleGraph)) {
      failures.push(
        `publication authority health role graph is missing: ${requiredHealthRoleGraph}`,
      );
    }
  }
  if (
    !authorityHealth ||
    !authorityHealth.includes(
      "database_row.datdba = publication_manifest.authority_owner",
    ) ||
    !authorityHealth.includes(
      "(owner_role.rolsuper or owner_role.rolbypassrls)",
    ) ||
    !authorityHealth.includes(
      "not exists (select 1 from owner_members)",
    ) ||
    !authorityHealth.includes(
      "authenticator_role.oid = 'authenticator'::regrole",
    ) ||
    !authorityHealth.includes("not authenticator_role.rolinherit") ||
    !authorityHealth.includes("not authenticator_role.rolsuper") ||
    !authorityHealth.includes("not authenticator_role.rolbypassrls") ||
    !authorityHealth.includes("not authenticator_role.rolcreaterole") ||
    !authorityHealth.includes(
      "service_authority_role.oid = 'service_role'::regrole",
    ) ||
    !authorityHealth.includes("service_authority_role.rolbypassrls") ||
    !authorityHealth.includes(
      "anonymous_role.oid = 'anon'::regrole",
    ) ||
    !authorityHealth.includes(
      "authenticated_role.oid = 'authenticated'::regrole",
    ) ||
    !authorityHealth.includes(
      "service_members.member_oid = authenticator_role.oid",
    ) ||
    !authorityHealth.includes(
      "service_members.member_oid not in ( authenticator_role.oid, publication_manifest.authority_owner )",
    ) ||
    !authorityHealth.includes(
      "member_role.rolname <> 'supabase_storage_admin'",
    ) ||
    !authorityHealth.includes(
      "canonical_membership.roleid = 'service_role'::regrole",
    ) ||
    !authorityHealth.includes(
      "canonical_membership.member = authenticator_role.oid",
    ) ||
    !authorityHealth.includes("not canonical_membership.admin_option") ||
    !authorityHealth.includes(
      "pg_catalog.to_jsonb(canonical_membership) ->> 'inherit_option'",
    ) ||
    !authorityHealth.includes(
      "pg_catalog.to_jsonb(canonical_membership) ->> 'set_option'",
    )
  ) {
    failures.push(
      "publication authority health must bind the database owner and the exact managed Supabase service-role descendant set",
    );
  }
  const healthStorageGraphStart = authorityHealth.indexOf(
    "and not exists ( select 1 from pg_catalog.pg_auth_members authenticator_member",
  );
  const healthStorageGraphEnd = authorityHealth.indexOf(
    ") = 1 as value from pg_catalog.pg_database",
    healthStorageGraphStart,
  );
  const healthStorageGraph =
    healthStorageGraphStart >= 0 &&
    healthStorageGraphEnd > healthStorageGraphStart
      ? authorityHealth.slice(
          healthStorageGraphStart,
          healthStorageGraphEnd,
        )
      : "";
  if (
    !healthStorageGraph ||
    healthStorageGraph !== preflightStorageGraph ||
    storageGraphRequirements.some(
      (required) => !healthStorageGraph.includes(required),
    ) ||
    countOccurrences(
      healthStorageGraph,
      "storage_membership.roleid = 'service_role'::regrole",
    ) !== 2 ||
    countOccurrences(
      healthStorageGraph,
      "storage_membership.roleid = authenticator_role.oid",
    ) !== 2 ||
    countOccurrences(
      healthStorageGraph,
      "not storage_membership.admin_option",
    ) !== 2 ||
    countOccurrences(
      healthStorageGraph,
      "pg_catalog.to_jsonb(storage_membership) ->> 'inherit_option'",
    ) !== 2 ||
    countOccurrences(
      healthStorageGraph,
      "pg_catalog.to_jsonb(storage_membership) ->> 'set_option'",
    ) !== 2 ||
    countOccurrences(healthStorageGraph, "storage_role.rolinherit") !== 2
  ) {
    failures.push(
      "publication health must mirror the exact mutually-exclusive direct-or-indirect storage-admin graph and options",
    );
  }
  const relationGraphHealthStart = migration.indexOf(
    "relation_graph_health as (",
    authorityHealthStart,
  );
  const rewriteRuleHealthStart = migration.indexOf(
    "rewrite_rule_health as (",
    relationGraphHealthStart,
  );
  const legacyMarkerHealthStart = migration.indexOf(
    "legacy_marker_health as (",
    rewriteRuleHealthStart,
  );
  const relationGraphHealth =
    relationGraphHealthStart >= 0 &&
    rewriteRuleHealthStart > relationGraphHealthStart
      ? migration.slice(relationGraphHealthStart, rewriteRuleHealthStart)
      : "";
  const rewriteRuleHealth =
    rewriteRuleHealthStart >= 0 &&
    legacyMarkerHealthStart > rewriteRuleHealthStart
      ? migration.slice(rewriteRuleHealthStart, legacyMarkerHealthStart)
      : "";
  const legacyMarkerHealth =
    legacyMarkerHealthStart >= 0 &&
    manifestHealthStart > legacyMarkerHealthStart
      ? migration.slice(legacyMarkerHealthStart, manifestHealthStart)
      : "";
  const healthProtectedRelations = [
    ...preflightProtectedRelations,
    "'public.story_artifact_legacy_v5_replay'::regclass",
  ];
  if (
    !relationGraphHealth.includes(
      "from pg_catalog.pg_class relation_row",
    ) ||
    !relationGraphHealth.includes("relation_row.relkind = 'r'") ||
    !relationGraphHealth.includes("relation_row.relpersistence = 'p'") ||
    !relationGraphHealth.includes(
      "relation_row.relowner = publication_manifest.authority_owner",
    ) ||
    !relationGraphHealth.includes(") = 4") ||
    !relationGraphHealth.includes(
      "from pg_catalog.pg_inherits inheritance_row",
    ) ||
    !relationGraphHealth.includes(
      "where inheritance_row.inhparent in (",
    ) ||
    !relationGraphHealth.includes(
      "or inheritance_row.inhrelid in (",
    ) ||
    healthProtectedRelations.some(
      (relation) => countOccurrences(relationGraphHealth, relation) !== 3,
    )
  ) {
    failures.push(
      "publication health must close both inheritance directions across all source and marker relations",
    );
  }
  if (
    !rewriteRuleHealth.includes(
      "from pg_catalog.pg_rewrite rewrite_row",
    ) ||
    !rewriteRuleHealth.includes("where rewrite_row.ev_class in (") ||
    healthProtectedRelations.some(
      (relation) => countOccurrences(rewriteRuleHealth, relation) !== 1,
    )
  ) {
    failures.push(
      "publication health must reject rewrite rules across all source and marker relations",
    );
  }
  const legacyMarkerHealthRequirements = [
    "marker_namespace.nspname = 'public'",
    "marker_relation.relname = 'story_artifact_legacy_v5_replay'",
    "marker_relation.relkind = 'r'",
    "marker_relation.relpersistence = 'p'",
    "marker_relation.relowner = publication_manifest.authority_owner",
    "marker_relation.relrowsecurity",
    "marker_relation.relforcerowsecurity",
    "pg_catalog.obj_description( marker_relation.oid, 'pg_class' ) = 'onward-story-artifact-legacy-v5-replay-v1'",
    "marker_relation.relnatts = 1",
    "attribute_row.attname = 'artifact_id'",
    "attribute_row.atttypid = 'text'::pg_catalog.regtype",
    "attribute_row.attnotnull",
    "not attribute_row.atthasdef",
    "attribute_row.attidentity = ''",
    "attribute_row.attgenerated = ''",
    "attribute_row.attacl is null",
    "constraint_row.conname = 'story_artifact_legacy_v5_replay_pkey'",
    "constraint_row.contype = 'p'",
    "constraint_row.connoinherit",
    "constraint_row.conkey = array[",
    "index_relation.relname = 'story_artifact_legacy_v5_replay_pkey'",
    "index_relation.relowner = publication_manifest.authority_owner",
    "index_row.indisprimary",
    "index_row.indisunique",
    "index_row.indimmediate",
    "index_row.indisvalid",
    "index_row.indisready",
    "index_row.indislive",
    "index_row.indnkeyatts = 1",
    "index_row.indnatts = 1",
    "index_row.indexprs is null",
    "index_row.indpred is null",
    "constraint_row.conname = 'story_artifact_legacy_v5_replay_artifact_fk'",
    "constraint_row.contype = 'f'",
    "constraint_row.confdeltype = 'c'",
    "constraint_row.confrelid = 'public.story_artifacts'::regclass",
    "trigger_row.tgconstraint = constraint_row.oid",
    "trigger_row.tgisinternal",
    "trigger_row.tgenabled = 'o'",
    "where policy_row.polrelid = marker_relation.oid",
    "where trigger_row.tgrelid = marker_relation.oid and not trigger_row.tgisinternal",
    "acl.grantee = 'service_role'::regrole",
    "acl.privilege_type = 'select'",
    "not acl.is_grantable",
    "acl.grantee <> marker_relation.relowner",
    "acl.grantee <> 'service_role'::regrole or acl.privilege_type <> 'select' or acl.is_grantable",
    "from only public.story_artifact_legacy_v5_replay marker join only public.story_artifacts artifact",
    "artifact.schema_version <> 'story-artifact-v5-2026-07'",
    "where marker_relation.oid = 'public.story_artifact_legacy_v5_replay'::regclass",
  ];
  if (
    !legacyMarkerHealth ||
    legacyMarkerHealthRequirements.some(
      (required) => !legacyMarkerHealth.includes(required),
    ) ||
    countOccurrences(
      legacyMarkerHealth,
      "where constraint_row.conrelid = marker_relation.oid and constraint_row.contype <> 'n'",
    ) !== 1 ||
    !legacyMarkerHealth.includes(") = 2") ||
    countOccurrences(
      legacyMarkerHealth,
      "where index_row.indrelid = marker_relation.oid",
    ) !== 1 ||
    !legacyMarkerHealth.includes(") = 1") ||
    countOccurrences(
      legacyMarkerHealth,
      "where trigger_row.tgconstraint = constraint_row.oid",
    ) !== 2 ||
    countOccurrences(legacyMarkerHealth, ") = 4") !== 2
  ) {
    failures.push(
      "legacy marker health must attest its exact v5-only schema, owner, PK/FK cascade, forced RLS, empty-policy set, and service SELECT-only ACL",
    );
  }
  const functionGrantHealthStart = migration.indexOf(
    "public_function_grant_health as (",
  );
  const tableBoundaryHealthStart = migration.indexOf(
    "table_boundary_health as (",
    functionGrantHealthStart,
  );
  const stageBoundaryHealthStart = migration.indexOf(
    "stage_boundary_health as (",
    tableBoundaryHealthStart,
  );
  const generatedColumnHealthStart = migration.indexOf(
    "generated_column_health as (",
    stageBoundaryHealthStart,
  );
  const grantHealthStart = migration.indexOf(
    "grant_health as (",
    generatedColumnHealthStart,
  );
  const functionGrantHealth =
    functionGrantHealthStart >= 0 &&
    tableBoundaryHealthStart > functionGrantHealthStart
      ? migration.slice(functionGrantHealthStart, tableBoundaryHealthStart)
      : "";
  const tableBoundaryHealth =
    tableBoundaryHealthStart >= 0 &&
    stageBoundaryHealthStart > tableBoundaryHealthStart
      ? migration.slice(tableBoundaryHealthStart, stageBoundaryHealthStart)
      : "";
  const stageBoundaryHealth =
    stageBoundaryHealthStart >= 0 &&
    generatedColumnHealthStart > stageBoundaryHealthStart
      ? migration.slice(
          stageBoundaryHealthStart,
          generatedColumnHealthStart,
        )
      : "";
  const generatedColumnHealth =
    generatedColumnHealthStart >= 0 &&
    grantHealthStart > generatedColumnHealthStart
      ? migration.slice(generatedColumnHealthStart, grantHealthStart)
      : "";
  if (
    !functionGrantHealth ||
    !functionGrantHealth.includes(
      "procedure_row.proowner = ( select table_relation.relowner",
    ) ||
    !functionGrantHealth.includes("pg_catalog.aclexplode(") ||
    !functionGrantHealth.includes(
      "'public.retire_story_spec(text)'::regprocedure",
    ) ||
    !functionGrantHealth.includes(
      "'public.enforce_story_spec_lifecycle()'::regprocedure",
    ) ||
    !functionGrantHealth.includes(
      "'public.enforce_figure_stage_publication()'::regprocedure",
    ) ||
    !functionGrantHealth.includes(
      "'public.story_spec_publication_manifest_v1()'::regprocedure",
    ) ||
    !functionGrantHealth.includes("and not acl.is_grantable") ||
    !functionGrantHealth.includes(
      "and controlled_routine_inventory_health.value",
    ) ||
    !functionGrantHealth.includes("count(*) = 7")
  ) {
    failures.push(
      "publication function grants must be exact and table-owner bound",
    );
  }
  if (
    !tableBoundaryHealth ||
    !tableBoundaryHealth.includes(
      "(owner_role.rolsuper or owner_role.rolbypassrls)",
    ) ||
    !tableBoundaryHealth.includes("from pg_catalog.pg_attribute attribute_row") ||
    !tableBoundaryHealth.includes("attribute_row.attacl") ||
    !tableBoundaryHealth.includes(
      "acl.grantee <> table_relation.relowner",
    )
  ) {
    failures.push(
      "publication table health must close owner, table, policy, and column ACL boundaries",
    );
  }
  if (
    !stageBoundaryHealth ||
    !stageBoundaryHealth.includes(
      "table_relation.relname = 'figure_stages'",
    ) ||
    !stageBoundaryHealth.includes(
      "table_relation.relowner = publication_manifest.authority_owner",
    ) ||
    !stageBoundaryHealth.includes(
      "where policy_row.polrelid = table_relation.oid",
    ) ||
    !stageBoundaryHealth.includes(
      "acl.privilege_type in ('select', 'insert', 'update')",
    ) ||
    !stageBoundaryHealth.includes(
      "acl.grantee <> table_relation.relowner",
    ) ||
    !stageBoundaryHealth.includes(
      "from pg_catalog.pg_attribute attribute_row",
    )
  ) {
    failures.push(
      "figure-stage health must close owner, policy, table, and column boundaries",
    );
  }
  if (
    !generatedColumnHealth.includes(
      "from pg_catalog.pg_attribute attribute_row",
    ) ||
    !generatedColumnHealth.includes(
      "where attribute_row.attrelid in (",
    ) ||
    !generatedColumnHealth.includes("attribute_row.attnum > 0") ||
    !generatedColumnHealth.includes("not attribute_row.attisdropped") ||
    !generatedColumnHealth.includes("attribute_row.attgenerated <> ''") ||
    countOccurrences(
      generatedColumnHealth,
      "'public.story_specs'::regclass",
    ) !== 1 ||
    countOccurrences(
      generatedColumnHealth,
      "'public.figure_stages'::regclass",
    ) !== 1 ||
    generatedColumnHealth.includes("'public.story_artifacts'::regclass") ||
    generatedColumnHealth.includes(
      "'public.story_artifact_legacy_v5_replay'::regclass",
    )
  ) {
    failures.push(
      "publication health must reject every generated column on either publication table",
    );
  }
  const closedOutputStart = migration.indexOf(
    "select manifest_function_health.value",
    grantHealthStart,
  );
  const closedOutputEnd = migration.indexOf("$fn$;", closedOutputStart);
  const grantHealth =
    grantHealthStart >= 0 && closedOutputStart > grantHealthStart
      ? migration.slice(grantHealthStart, closedOutputStart)
      : "";
  const closedOutputs =
    closedOutputStart >= 0 && closedOutputEnd > closedOutputStart
      ? migration.slice(closedOutputStart, closedOutputEnd)
      : "";
  for (const requiredClosedGrant of [
    "generated_column_health.value and authority_health.value",
    "and relation_graph_health.value",
    "and rewrite_rule_health.value",
    "and legacy_marker_health.value as value",
    "relation_graph_health, rewrite_rule_health, legacy_marker_health, generated_column_health",
  ]) {
    if (!grantHealth.includes(requiredClosedGrant)) {
      failures.push(
        `closed publication grant health omits: ${requiredClosedGrant}`,
      );
    }
  }
  for (const requiredClosedOutput of [
    "manifest_function_health.value and story_identity_key_health.value",
    "and grant_health.value as ok",
    "story_identity_key_health.value and identity_health.value and stage_fk_health.value and relation_graph_health.value as identity_constraint_valid",
    "generated_column_health.value and lifecycle_health.value and stage_lifecycle_health.value and story_status_constraint_health.value and relation_graph_health.value and rewrite_rule_health.value as lifecycle_trigger_enabled",
    "publication_index_health.value and story_status_constraint_health.value and catalog_alignment_health.value and relation_graph_health.value as published_stage_uniqueness_valid",
    "generated_column_health.value and story_identity_key_health.value and promotion_health.value and retirement_health.value and story_status_constraint_health.value and relation_graph_health.value and rewrite_rule_health.value as promotion_cas_valid",
    "legacy_health.value as legacy_rpc_revoked, grant_health.value as boundary_granted",
    "from manifest_function_health, story_identity_key_health, identity_health",
    "legacy_health, relation_graph_health, rewrite_rule_health, grant_health, generated_column_health",
  ]) {
    if (!closedOutputs.includes(requiredClosedOutput)) {
      failures.push(
        `closed publication readiness outputs omit: ${requiredClosedOutput}`,
      );
    }
  }
  const healthServiceGrantIndex = migration.indexOf(
    "grant execute on function public.story_spec_publication_schema_health_v1",
  );
  const closedCutoverCheckIndex = migration.indexOf(
    "select health.ok from public.story_spec_publication_schema_health_v1() health",
  );
  if (
    healthServiceGrantIndex < 0 ||
    closedCutoverCheckIndex <= healthServiceGrantIndex
  ) {
    failures.push(
      "publication migration must evaluate closed schema health after restoring final grants",
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
    !statusCommand.includes("p_expected_review_spec: stored") ||
    !statusCommand.includes('rpc("retire_story_spec"')
  ) {
    failures.push(
      "publication command must use the validated promotion and retirement RPC boundaries",
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
