import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const migrationName = "0024_story_recipe_manifest_v2.sql";
const migration = readFileSync(
  resolve(root, "supabase/migrations", migrationName),
  "utf8",
);
const migration0020 = readFileSync(
  resolve(root, "supabase/migrations/0020_story_recipe_registry.sql"),
  "utf8",
);
const attestor = readFileSync(
  resolve(root, "scripts/trusted/recipe-promotion-attestor.mjs"),
  "utf8",
);

const TAGGER_KEYS = [
  "mode",
  "modelId",
  "promptVersion",
  "temperature",
  "reasoningEffort",
  "timeoutMs",
  "signalSchemaVersion",
  "projectionSchemaVersion",
  "queryMode",
  "weightingMode",
  "expansionEnabled",
] as const;
const REGISTRY_ID = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const MODEL_ID = /^[a-z0-9][a-z0-9._/@:-]{0,127}$/;

type TaggerIdentity = Readonly<{
  mode: "closed_template";
  modelId: string;
  promptVersion: string;
  temperature: 0;
  reasoningEffort: string;
  timeoutMs: 3000;
  signalSchemaVersion: string;
  projectionSchemaVersion: string;
  queryMode: "raw" | "validated_projection";
  weightingMode: "static" | "bounded_dynamic";
  expansionEnabled: false;
}>;

type RecipeIdentity = Readonly<{
  retrievalMode: "keyword" | "facetsrag";
  embeddingModelId: string | null;
  manifestSchemaVersion?: "story-recipe-manifest-v2";
  facetTagger?: TaggerIdentity;
}>;

type RegistryIdentity = Readonly<{
  manifestSchemaVersion: string | null;
  facetTagger: unknown;
}>;

function main(): void {
  checkMigrationPosition();
  checkSchemaExtension();
  checkFacetTaggerValidator();
  checkRegistrationBoundary();
  checkPromotedIdentityUpgrade();
  checkAttestorSeparation();
  checkIdentityMirror();

  console.log("Story recipe registry v2 identity: PASS");
  console.log("  v1 rows remain null/null; v2 rows require the exact nested identity");
  console.log("  insert-only v2 registration is migration-owner-only and replay-safe");
  console.log("  persisted recipes accept v2 identity while promotion execution stays blocked");
}

function checkMigrationPosition(): void {
  const migrations = readdirSync(resolve(root, "supabase/migrations"))
    .filter((name) => /^\d{4}_.+\.sql$/u.test(name))
    .sort();
  assert.equal(
    migrations.at(-1),
    migrationName,
    "manifest-v2 identity is not the latest append-only migration",
  );
}

function checkSchemaExtension(): void {
  assert.match(
    migration,
    /alter table public\.story_recipe_registry[\s\S]*?add column manifest_schema_version text,[\s\S]*?add column facet_tagger jsonb,/u,
  );
  assert.match(
    migration,
    /manifest_schema_version is null\s+and facet_tagger is null/u,
  );
  assert.match(
    migration,
    /manifest_schema_version = 'story-recipe-manifest-v2'/u,
  );
  assert.match(
    migration,
    /public\.is_valid_facet_tagger_recipe_v1\(facet_tagger\)/u,
  );
  assert.match(
    migration,
    /retrieval_mode = 'facetsrag'\s+and embedding_model_id is not null/u,
  );
  assert.equal(
    occurrences(migration, "insert into public.story_recipe_registry"),
    1,
    "migration seeds a recipe or has a second registry write path",
  );
}

function checkFacetTaggerValidator(): void {
  const body = functionBody(migration, "is_valid_facet_tagger_recipe_v1");
  for (const key of TAGGER_KEYS) {
    assert(
      body.includes(`'${key}'`),
      `database facet-tagger validator omits ${key}`,
    );
  }
  assert.match(body, /jsonb_object_keys\(p_tagger\)/u);
  assert.match(body, /p_tagger \?& array\[/u);
  assert.match(body, /p_tagger ->> 'mode' = 'closed_template'/u);
  assert.match(body, /p_tagger -> 'temperature' = '0'::jsonb/u);
  assert.match(body, /p_tagger -> 'timeoutMs' = '3000'::jsonb/u);
  assert.match(
    compact(body),
    /p_tagger ->> 'queryMode' in \('raw', 'validated_projection'\)/u,
  );
  assert.match(
    compact(body),
    /p_tagger ->> 'weightingMode' in \('static', 'bounded_dynamic'\)/u,
  );
  assert.match(body, /p_tagger -> 'expansionEnabled' = 'false'::jsonb/u);
  assert.match(
    migration,
    /revoke all on function public\.is_valid_facet_tagger_recipe_v1\(jsonb\)\s+from public, anon, authenticated, service_role;/u,
  );
}

function checkRegistrationBoundary(): void {
  const definition = functionDefinition(migration, "register_story_recipe_v2");
  const body = functionBody(migration, "register_story_recipe_v2");
  const compactBody = compact(body);
  assert.match(definition, /p_manifest_schema_version text/u);
  assert.match(definition, /p_facet_tagger jsonb/u);
  assert.match(
    body,
    /p_manifest_schema_version is distinct from 'story-recipe-manifest-v2'/u,
  );
  assert.match(
    body,
    /is_valid_facet_tagger_recipe_v1\(p_facet_tagger\)[\s\S]*?is distinct from true/u,
  );
  assert.match(body, /insert into public\.story_recipe_registry/u);
  assert.match(body, /on conflict do nothing/u);
  assert.match(body, /return 'created'/u);
  assert.match(body, /return 'existing'/u);
  assert.doesNotMatch(
    body,
    /(?:update\s+public\.story_recipe_registry|delete\s+from\s+public\.story_recipe_registry)/iu,
  );

  const comparisons = [
    ["manifest_sha256", "manifest_sha256"],
    ["dataset_version", "dataset_version"],
    ["match_config_version", "match_config_version"],
    ["library_snapshot_sha256", "library_snapshot_sha256"],
    ["retrieval_mode", "retrieval_mode"],
    ["llm_provider", "llm_provider"],
    ["rerank_model_id", "rerank_model_id"],
    ["prose_model_id", "prose_model_id"],
    ["embedding_model_id", "embedding_model_id"],
    ["rerank_prompt_version", "rerank_prompt_version"],
    ["story_prompt_version", "story_prompt_version"],
    ["rerank_temperature", "rerank_temperature"],
    ["rerank_reasoning_effort", "rerank_reasoning_effort"],
    ["rerank_top_k", "rerank_top_k"],
    ["story_temperature", "story_temperature"],
    ["story_composer_mode", "story_composer_mode"],
    ["hybrid_story_composer_enabled", "hybrid_story_composer_enabled"],
    ["composer_version", "composer_version"],
    ["validator_version", "validator_version"],
    ["story_spec_schema_version", "story_spec_schema_version"],
    ["boundary_policy_version", "boundary_policy_version"],
    ["resonance_brief_version", "resonance_brief_version"],
    ["manifest_schema_version", "manifest_schema_version"],
    ["facet_tagger", "facet_tagger"],
    ["decision_id", "decision_id"],
    ["promoted_at", "promoted_at"],
  ] as const;
  for (const [column, parameter] of comparisons) {
    assert(
      compactBody.includes(
        `v_existing.${column} is distinct from p_${parameter}`,
      ),
      `v2 registration replay omits ${column}`,
    );
  }
  assert.match(
    migration,
    /revoke all on function public\.register_story_recipe_v2\([\s\S]*?\) from public, anon, authenticated, service_role;/u,
  );
  assert.doesNotMatch(
    migration,
    /grant\s+execute\s+on\s+function\s+public\.register_story_recipe_v2/iu,
  );
}

function checkPromotedIdentityUpgrade(): void {
  assert.equal(
    compact(
      functionBody(migration, "is_promoted_story_recipe_legacy_v1"),
    ),
    compact(functionBody(migration0020, "is_promoted_story_recipe_v1")),
    "the private v1 compatibility predicate drifted from migration 0020",
  );
  const upgraded = functionBody(migration, "is_promoted_story_recipe_v2");
  assert.match(upgraded, /not \(p_recipe \? 'manifestSchemaVersion'\)/u);
  assert.match(upgraded, /not \(p_recipe \? 'facetTagger'\)/u);
  assert.match(
    upgraded,
    /recipe\.manifest_schema_version is null\s+and recipe\.facet_tagger is null/u,
  );
  assert.match(
    upgraded,
    /p_recipe \?& array\['manifestSchemaVersion', 'facetTagger'\]/u,
  );
  assert.match(
    upgraded,
    /is_valid_facet_tagger_recipe_v1\(p_recipe -> 'facetTagger'\)/u,
  );
  assert.match(
    upgraded,
    /p_recipe - 'manifestSchemaVersion' - 'facetTagger'/u,
  );
  assert.match(
    upgraded,
    /recipe\.facet_tagger = p_recipe -> 'facetTagger'/u,
  );
  assert.equal(
    compact(functionBody(migration, "is_promoted_story_recipe_v1")),
    "select public.is_promoted_story_recipe_v2(p_recipe);",
    "historical call sites do not delegate to the upgraded predicate",
  );
  for (const name of [
    "is_promoted_story_recipe_legacy_v1",
    "is_promoted_story_recipe_v2",
    "is_promoted_story_recipe_v1",
  ]) {
    assert.match(
      migration,
      new RegExp(
        `revoke all on function public\\.${name}\\(jsonb\\)\\s+from public, anon, authenticated, service_role;`,
        "u",
      ),
    );
  }
}

function checkAttestorSeparation(): void {
  assert.match(
    attestor,
    /select public\.register_story_recipe_\$\{isV2 \? "v2" : "v1"\}/u,
  );
  assert.match(attestor, /sqlJsonb\(recipe\.facetTagger\)/u);
  assert.match(
    attestor,
    /story-recipe-manifest-v2 cannot be promoted until execution support is installed/u,
  );
  assert.match(
    attestor,
    /assertPromotionExecutionSupported\(challengerRecipe\)/u,
  );
}

function checkIdentityMirror(): void {
  const tagger = validTaggerFixture();
  const v1: RecipeIdentity = {
    retrievalMode: "keyword",
    embeddingModelId: null,
  };
  const v2: RecipeIdentity = {
    retrievalMode: "facetsrag",
    embeddingModelId: "gemini-embedding-001@d1536",
    manifestSchemaVersion: "story-recipe-manifest-v2",
    facetTagger: tagger,
  };
  assert(
    mirrorsRegistryIdentity(v1, {
      manifestSchemaVersion: null,
      facetTagger: null,
    }),
    "v1 null/null identity was rejected",
  );
  assert(
    !mirrorsRegistryIdentity(v1, {
      manifestSchemaVersion: "story-recipe-manifest-v2",
      facetTagger: tagger,
    }),
    "v1 identity matched a v2 row",
  );
  assert(
    mirrorsRegistryIdentity(v2, {
      manifestSchemaVersion: "story-recipe-manifest-v2",
      facetTagger: structuredClone(tagger),
    }),
    "exact v2 identity was rejected",
  );

  for (const key of TAGGER_KEYS) {
    const missing = structuredClone(tagger) as Record<string, unknown>;
    delete missing[key];
    assert(
      !isValidTaggerIdentity(missing),
      `tagger missing ${key} was accepted`,
    );
  }
  assert(
    !isValidTaggerIdentity({ ...tagger, unreviewed: true }),
    "tagger with an extra key was accepted",
  );
  for (const [key, value] of [
    ["mode", "free_text"],
    ["modelId", "bad model"],
    ["promptVersion", "bad/version"],
    ["temperature", 0.1],
    ["reasoningEffort", ""],
    ["timeoutMs", 3001],
    ["signalSchemaVersion", "bad/version"],
    ["projectionSchemaVersion", "bad/version"],
    ["queryMode", "authored_projection"],
    ["weightingMode", "unbounded"],
    ["expansionEnabled", true],
  ] as const) {
    assert(
      !isValidTaggerIdentity({ ...tagger, [key]: value }),
      `tagger with invalid ${key} was accepted`,
    );
  }
  assert(
    !mirrorsRegistryIdentity(
      {
        ...v2,
        facetTagger: { ...tagger, queryMode: "raw" },
      },
      {
        manifestSchemaVersion: "story-recipe-manifest-v2",
        facetTagger: tagger,
      },
    ),
    "drifted nested v2 identity matched the registered row",
  );
  assert(
    !mirrorsRegistryIdentity(
      { ...v2, retrievalMode: "keyword", embeddingModelId: null },
      {
        manifestSchemaVersion: "story-recipe-manifest-v2",
        facetTagger: tagger,
      },
    ),
    "keyword/no-embedder manifest v2 identity was accepted",
  );
}

function mirrorsRegistryIdentity(
  recipe: RecipeIdentity,
  row: RegistryIdentity,
): boolean {
  const hasSchema = Object.hasOwn(recipe, "manifestSchemaVersion");
  const hasTagger = Object.hasOwn(recipe, "facetTagger");
  if (hasSchema !== hasTagger) return false;
  if (!hasSchema) {
    return row.manifestSchemaVersion === null && row.facetTagger === null;
  }
  return (
    recipe.manifestSchemaVersion === "story-recipe-manifest-v2" &&
    recipe.retrievalMode === "facetsrag" &&
    recipe.embeddingModelId !== null &&
    isValidTaggerIdentity(recipe.facetTagger) &&
    row.manifestSchemaVersion === recipe.manifestSchemaVersion &&
    canonical(row.facetTagger) === canonical(recipe.facetTagger)
  );
}

function isValidTaggerIdentity(value: unknown): value is TaggerIdentity {
  if (
    !isRecord(value) ||
    Object.keys(value).sort().join(",") !== [...TAGGER_KEYS].sort().join(",")
  ) {
    return false;
  }
  return (
    value.mode === "closed_template" &&
    typeof value.modelId === "string" &&
    MODEL_ID.test(value.modelId) &&
    typeof value.promptVersion === "string" &&
    REGISTRY_ID.test(value.promptVersion) &&
    value.temperature === 0 &&
    typeof value.reasoningEffort === "string" &&
    REGISTRY_ID.test(value.reasoningEffort) &&
    value.timeoutMs === 3000 &&
    typeof value.signalSchemaVersion === "string" &&
    REGISTRY_ID.test(value.signalSchemaVersion) &&
    typeof value.projectionSchemaVersion === "string" &&
    REGISTRY_ID.test(value.projectionSchemaVersion) &&
    (value.queryMode === "raw" ||
      value.queryMode === "validated_projection") &&
    (value.weightingMode === "static" ||
      value.weightingMode === "bounded_dynamic") &&
    value.expansionEnabled === false
  );
}

function validTaggerFixture(): TaggerIdentity {
  return {
    mode: "closed_template",
    modelId: "gpt-oss-120b",
    promptVersion: "facet-tagger-prompt-v1-2026-07",
    temperature: 0,
    reasoningEffort: "low",
    timeoutMs: 3000,
    signalSchemaVersion: "facet-signal-v1-2026-07",
    projectionSchemaVersion: "facet-query-template-catalog-v1-2026-07",
    queryMode: "validated_projection",
    weightingMode: "static",
    expansionEnabled: false,
  };
}

function functionDefinition(source: string, name: string): string {
  const marker = `create or replace function public.${name}(`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing SQL function ${name}`);
  const bodyStart = source.indexOf("as $fn$", start);
  assert.notEqual(bodyStart, -1, `missing body for SQL function ${name}`);
  const end = source.indexOf("$fn$;", bodyStart + 7);
  assert.notEqual(end, -1, `unterminated SQL function ${name}`);
  return source.slice(start, end + 5);
}

function functionBody(source: string, name: string): string {
  const definition = functionDefinition(source, name);
  const start = definition.indexOf("as $fn$") + "as $fn$".length;
  const end = definition.lastIndexOf("$fn$;");
  return definition.slice(start, end);
}

function compact(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

main();
