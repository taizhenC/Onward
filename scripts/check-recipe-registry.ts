import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

type StoryRecipeManifest = {
  schemaVersion: string;
  datasets: Array<{ version: string; sha256: string; visibility: string }>;
  selection: {
    primaryRecipeId: string;
    rollbackRecipeId: string;
    decisionId: string;
  };
  promotions: Array<{
    recipeId: string;
    decisionId: string;
    promotedAt: string;
  }>;
  recipes: StoryRecipe[];
};

type StoryRecipe = {
  recipeId: string;
  manifestSha256: string;
  retrievalMode: "keyword" | "facetsrag";
  matchConfigVersion: string;
  librarySnapshotSha256: string;
  datasetVersion: string;
  llmProvider: string;
  rerankModelId: string;
  proseModelId: string;
  embeddingModelId: string | null;
  rerankPromptVersion: string;
  storyPromptVersion: string;
  rerankTemperature: number;
  rerankReasoningEffort: string;
  rerankTopK: number;
  storyTemperature: number;
  storyComposerMode: "canonical" | "hybrid";
  hybridStoryComposerEnabled: boolean;
  composerVersion: string;
  validatorVersion: string;
  storySpecSchemaVersion: string;
  boundaryPolicyVersion: string;
  resonanceBriefVersion: string;
  [key: string]: Json;
};

const REGISTRY_VERSION_ID_SOURCE = "^[a-z0-9][a-z0-9._-]{0,127}$";
const MODEL_ID_SOURCE = "^[a-z0-9][a-z0-9._/@:-]{0,127}$";
const DEPLOYMENT_ID_SOURCE = "^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$";
const registryVersionId = new RegExp(REGISTRY_VERSION_ID_SOURCE);
const modelId = new RegExp(MODEL_ID_SOURCE);
const deploymentId = new RegExp(DEPLOYMENT_ID_SOURCE);

const root = process.cwd();
const migrationsDirectory = resolve(root, "supabase/migrations");
const migrationSources = readdirSync(migrationsDirectory)
  .filter((fileName) => /^\d{4}_.+\.sql$/.test(fileName))
  .sort()
  .map((fileName) => ({
    fileName,
    source: readFileSync(resolve(migrationsDirectory, fileName), "utf8"),
  }));
const migrationPath = resolve(
  root,
  "supabase/migrations/0020_story_recipe_registry.sql",
);
const migration = readFileSync(migrationPath, "utf8");
const manifest = JSON.parse(
  readFileSync(resolve(root, "config/story-recipes.json"), "utf8"),
) as StoryRecipeManifest;
const migration0012 = readFileSync(
  resolve(root, "supabase/migrations/0012_match_telemetry_producers.sql"),
  "utf8",
);
const migration0016 = readFileSync(
  resolve(root, "supabase/migrations/0016_alternate_resolution_telemetry.sql"),
  "utf8",
);
const migration0019 = readFileSync(
  resolve(root, "supabase/migrations/0019_owned_account_deletion.sql"),
  "utf8",
);

function canonicalize(value: Json): Json {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

function manifestHash(recipe: StoryRecipe): string {
  const { manifestSha256: _stored, ...identity } = recipe;
  void _stored;
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(identity as Json)))
    .digest("hex");
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

const REGISTRY_COLUMNS = [
  "recipe_id",
  "manifest_sha256",
  "dataset_version",
  "match_config_version",
  "library_snapshot_sha256",
  "retrieval_mode",
  "llm_provider",
  "rerank_model_id",
  "prose_model_id",
  "embedding_model_id",
  "rerank_prompt_version",
  "story_prompt_version",
  "rerank_temperature",
  "rerank_reasoning_effort",
  "rerank_top_k",
  "story_temperature",
  "story_composer_mode",
  "hybrid_story_composer_enabled",
  "composer_version",
  "validator_version",
  "story_spec_schema_version",
  "boundary_policy_version",
  "resonance_brief_version",
  "decision_id",
  "promoted_at",
] as const;

type RegistryColumn = (typeof REGISTRY_COLUMNS)[number];
type SqlScalar = string | number | boolean | null;
type StaticRegistration = {
  fileName: string;
  kind: "insert" | "register";
  columns: string[];
  argumentCount: number;
  values: Partial<Record<RegistryColumn, SqlScalar | undefined>>;
};

function stripSqlComments(source: string): string {
  let result = "";
  let index = 0;
  let inString = false;
  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];
    if (inString) {
      result += current;
      if (current === "'" && next === "'") {
        result += next;
        index += 2;
        continue;
      }
      if (current === "'") inString = false;
      index += 1;
      continue;
    }
    if (current === "'") {
      inString = true;
      result += current;
      index += 1;
      continue;
    }
    if (current === "-" && next === "-") {
      index += 2;
      while (index < source.length && source[index] !== "\n") index += 1;
      result += "\n";
      continue;
    }
    if (current === "/" && next === "*") {
      index += 2;
      while (
        index < source.length &&
        !(source[index] === "*" && source[index + 1] === "/")
      ) {
        if (source[index] === "\n") result += "\n";
        index += 1;
      }
      index += 2;
      continue;
    }
    result += current;
    index += 1;
  }
  return result;
}

function splitSqlList(source: string): string[] {
  const values: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (inString) {
      current += character;
      if (character === "'" && next === "'") {
        current += next;
        index += 1;
      } else if (character === "'") {
        inString = false;
      }
      continue;
    }
    if (character === "'") {
      inString = true;
      current += character;
    } else if (character === "(") {
      depth += 1;
      current += character;
    } else if (character === ")") {
      depth -= 1;
      current += character;
    } else if (character === "," && depth === 0) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (current.trim() || source.trim()) values.push(current.trim());
  return values;
}

function parseSqlScalar(source: string | undefined): SqlScalar | undefined {
  if (source === undefined) return undefined;
  const value = compact(source);
  const stringMatch = value.match(/^'((?:''|[^'])*)'(?::: ?timestamptz)?$/i);
  if (stringMatch) return stringMatch[1].replaceAll("''", "'");
  if (/^null$/i.test(value)) return null;
  if (/^true$/i.test(value)) return true;
  if (/^false$/i.test(value)) return false;
  if (/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
    return Number(value);
  }
  return undefined;
}

function extractStaticRegistrations(
  fileName: string,
  rawSource: string,
): StaticRegistration[] {
  const source = stripSqlComments(rawSource);
  const registrations: StaticRegistration[] = [];
  const calls =
    /(?:select|perform)\s+public\.register_story_recipe_v1\s*\(([\s\S]*?)\)\s*;/gi;
  for (const match of source.matchAll(calls)) {
    const args = splitSqlList(match[1]);
    const recipeId = parseSqlScalar(args[0]);
    if (typeof recipeId !== "string") continue;
    const values: StaticRegistration["values"] = {};
    REGISTRY_COLUMNS.forEach((column, index) => {
      values[column] = parseSqlScalar(args[index]);
    });
    registrations.push({
      fileName,
      kind: "register",
      columns: [...REGISTRY_COLUMNS],
      argumentCount: args.length,
      values,
    });
  }

  const inserts =
    /insert\s+into\s+public\.story_recipe_registry\s*\(([\s\S]*?)\)\s*values\s*\(([\s\S]*?)\)\s*(?:on\s+conflict[\s\S]*?)?;/gi;
  for (const match of source.matchAll(inserts)) {
    const columns = splitSqlList(match[1]).map((column) =>
      compact(column).toLowerCase(),
    );
    const args = splitSqlList(match[2]);
    const recipeIndex = columns.indexOf("recipe_id");
    const recipeId = parseSqlScalar(args[recipeIndex]);
    if (typeof recipeId !== "string") continue;
    const values: StaticRegistration["values"] = {};
    columns.forEach((column, index) => {
      if ((REGISTRY_COLUMNS as readonly string[]).includes(column)) {
        values[column as RegistryColumn] = parseSqlScalar(args[index]);
      }
    });
    registrations.push({
      fileName,
      kind: "insert",
      columns,
      argumentCount: args.length,
      values,
    });
  }
  return registrations;
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

function removeRecipeValidation(body: string): string {
  return body.replace(
    /v_recipe_id\s*:=\s*[^;]+;\s*if[\s\S]*?raise exception 'persisted (?:artifact|alternate) recipe identity is invalid';\s*end if;/,
    "<RECIPE_VALIDATION>",
  );
}

function removeRecoveryRecipeCheck(body: string): string {
  return body
    .replace(
      /or p_recipe_id is distinct from\s*'keyword-rerank-figure-library-50-2026-07-02'/,
      "or <RECIPE_ID_CHECK>",
    )
    .replace(
      /or public\.is_registered_story_recipe_id_v1\(p_recipe_id\)\s*is distinct from true/,
      "or <RECIPE_ID_CHECK>",
    );
}

const BOOTSTRAP_RECIPE_ID =
  "keyword-rerank-figure-library-50-2026-07-02";
const BOOTSTRAP_DECISION_ID =
  "rd_c5c82ca18b56997b606f2d30e8d03cde57365a806b78fefeb436065085b2ad8b";
const primary = manifest.recipes.find(
  (recipe) => recipe.recipeId === BOOTSTRAP_RECIPE_ID,
);
assert(primary, "immutable 0020 bootstrap recipe is missing from the manifest");
const bootstrapPromotion = manifest.promotions.find(
  (promotion) => promotion.recipeId === BOOTSTRAP_RECIPE_ID,
);
assert(bootstrapPromotion, "immutable 0020 bootstrap promotion is missing");
assert.equal(
  bootstrapPromotion.decisionId,
  BOOTSTRAP_DECISION_ID,
  "bootstrap promotion decision drifted",
);
assert.equal(
  manifest.datasets.some(
    (dataset) => dataset.version === primary.datasetVersion,
  ),
  true,
  "bootstrap recipe references an unknown dataset",
);
assert.equal(
  manifestHash(primary),
  primary.manifestSha256,
  "primary manifest hash is not the canonical recipe hash",
);
assert.match(
  manifest.selection.decisionId,
  /^rd_[0-9a-f]{64}$/,
  "promotion decision must be content-addressed",
);

const seedStart = migration.indexOf("-- Current reviewed production baseline");
const seedEnd = migration.indexOf(
  "-- Private closed-ID helper",
  seedStart,
);
assert(seedStart >= 0 && seedEnd > seedStart, "registry seed block is missing");
const seed = compact(migration.slice(seedStart, seedEnd));
const expectedSeed = compact(`
  values (
    ${sqlLiteral(primary.recipeId)},
    ${sqlLiteral(primary.manifestSha256)},
    ${sqlLiteral(primary.datasetVersion)},
    ${sqlLiteral(primary.matchConfigVersion)},
    ${sqlLiteral(primary.librarySnapshotSha256)},
    ${sqlLiteral(primary.retrievalMode)},
    ${sqlLiteral(primary.llmProvider)},
    ${sqlLiteral(primary.rerankModelId)},
    ${sqlLiteral(primary.proseModelId)},
    ${primary.embeddingModelId === null ? "null" : sqlLiteral(primary.embeddingModelId)},
    ${sqlLiteral(primary.rerankPromptVersion)},
    ${sqlLiteral(primary.storyPromptVersion)},
    ${primary.rerankTemperature},
    ${sqlLiteral(primary.rerankReasoningEffort)},
    ${primary.rerankTopK},
    ${primary.storyTemperature},
    ${sqlLiteral(primary.storyComposerMode)},
    ${primary.hybridStoryComposerEnabled},
    ${sqlLiteral(primary.composerVersion)},
    ${sqlLiteral(primary.validatorVersion)},
    ${sqlLiteral(primary.storySpecSchemaVersion)},
    ${sqlLiteral(primary.boundaryPolicyVersion)},
    ${sqlLiteral(primary.resonanceBriefVersion)},
    ${sqlLiteral(BOOTSTRAP_DECISION_ID)},
    ${sqlLiteral(bootstrapPromotion.promotedAt)}::timestamptz
  );
`);
assert(
  seed.includes(expectedSeed),
  "database seed does not exactly match the selected manifest recipe",
);
for (const challenger of manifest.recipes.filter(
  (recipe) => recipe.recipeId !== primary.recipeId,
)) {
  assert(!seed.includes(challenger.recipeId), "challenger recipe was seeded");
  assert(
    !seed.includes(challenger.manifestSha256),
    "challenger manifest hash was seeded",
  );
}

function expectedRegistryValues(
  recipe: StoryRecipe,
  promotion: StoryRecipeManifest["promotions"][number],
): Record<RegistryColumn, SqlScalar> {
  return {
    recipe_id: recipe.recipeId,
    manifest_sha256: recipe.manifestSha256,
    dataset_version: recipe.datasetVersion,
    match_config_version: recipe.matchConfigVersion,
    library_snapshot_sha256: recipe.librarySnapshotSha256,
    retrieval_mode: recipe.retrievalMode,
    llm_provider: recipe.llmProvider,
    rerank_model_id: recipe.rerankModelId,
    prose_model_id: recipe.proseModelId,
    embedding_model_id: recipe.embeddingModelId,
    rerank_prompt_version: recipe.rerankPromptVersion,
    story_prompt_version: recipe.storyPromptVersion,
    rerank_temperature: recipe.rerankTemperature,
    rerank_reasoning_effort: recipe.rerankReasoningEffort,
    rerank_top_k: recipe.rerankTopK,
    story_temperature: recipe.storyTemperature,
    story_composer_mode: recipe.storyComposerMode,
    hybrid_story_composer_enabled: recipe.hybridStoryComposerEnabled,
    composer_version: recipe.composerVersion,
    validator_version: recipe.validatorVersion,
    story_spec_schema_version: recipe.storySpecSchemaVersion,
    boundary_policy_version: recipe.boundaryPolicyVersion,
    resonance_brief_version: recipe.resonanceBriefVersion,
    decision_id: promotion.decisionId,
    promoted_at: promotion.promotedAt,
  };
}

const staticRegistrations = migrationSources.flatMap(({ fileName, source }) =>
  extractStaticRegistrations(fileName, source),
);
const promotionIds = manifest.promotions.map((promotion) => promotion.recipeId);
assert.equal(
  new Set(promotionIds).size,
  promotionIds.length,
  "each recipe may have only one immutable promotion record",
);
for (const promotion of manifest.promotions) {
  const recipe = manifest.recipes.find(
    (candidate) => candidate.recipeId === promotion.recipeId,
  );
  assert(recipe, `promoted recipe ${promotion.recipeId} is absent from recipes[]`);
  assert.equal(
    manifestHash(recipe),
    recipe.manifestSha256,
    `promoted recipe ${recipe.recipeId} has a non-canonical manifest hash`,
  );
  const registrations = staticRegistrations.filter(
    (candidate) => candidate.values.recipe_id === promotion.recipeId,
  );
  assert.equal(
    registrations.length,
    1,
    `${promotion.recipeId} must have exactly one literal append-only migration registration`,
  );
  const [candidate] = registrations;
  assert.equal(
    candidate.argumentCount,
    REGISTRY_COLUMNS.length,
    `${promotion.recipeId} migration registration has the wrong arity`,
  );
  assert.equal(
    new Set(candidate.columns).size,
    REGISTRY_COLUMNS.length,
    `${promotion.recipeId} migration registration has missing or duplicate columns`,
  );
  assert.deepStrictEqual(
    [...candidate.columns].sort(),
    [...REGISTRY_COLUMNS].sort(),
    `${promotion.recipeId} migration registration has the wrong columns`,
  );
  const expected = expectedRegistryValues(recipe, promotion);
  for (const column of REGISTRY_COLUMNS) {
    assert.deepStrictEqual(
      candidate.values[column],
      expected[column],
      `${promotion.recipeId} migration ${candidate.fileName} mismatches ${column}`,
    );
  }
  if (promotion.recipeId === BOOTSTRAP_RECIPE_ID) {
    assert.equal(
      candidate.fileName,
      "0020_story_recipe_registry.sql",
      "bootstrap recipe must be seeded exactly once by migration 0020",
    );
    assert.equal(
      candidate.kind,
      "insert",
      "bootstrap recipe must remain the immutable migration 0020 seed",
    );
  } else {
    const migrationNumber = Number(candidate.fileName.slice(0, 4));
    assert(
      migrationNumber > 20,
      `${promotion.recipeId} must be registered by a new migration after 0020`,
    );
  }
}
for (const registrationRow of staticRegistrations) {
  assert(
    promotionIds.includes(String(registrationRow.values.recipe_id)),
    `${registrationRow.fileName} registers ${registrationRow.values.recipe_id} without a promotions[] record`,
  );
}

for (const { fileName, source } of migrationSources) {
  for (const statement of stripSqlComments(source).split(";")) {
    const granteeClause = statement.match(/\bto\s+([\s\S]*)$/i)?.[1] ?? "";
    const grantsRuntimeRole =
      /\b(?:public|anon|authenticated|service_role)\b/i.test(granteeClause);
    const grantsNamedFunction =
      /grant\s+(?:all(?:\s+privileges)?|execute)\s+on\s+function\s+public\.register_story_recipe_v1\b/i.test(
        statement,
      );
    const grantsAllPublicFunctions =
      /grant\s+(?:all(?:\s+privileges)?|execute)\s+on\s+all\s+functions\s+in\s+schema\s+public\b/i.test(
        statement,
      );
    assert(
      !(grantsRuntimeRole && (grantsNamedFunction || grantsAllPublicFunctions)),
      `${fileName} grants recipe-promotion authority to a runtime role`,
    );
    const registryGrant = statement.match(
      /grant\s+([\s\S]*?)\s+on\s+(?:(?:table\s+)?public\.story_recipe_registry\b|all\s+tables\s+in\s+schema\s+public\b)/i,
    );
    const grantsRegistryWrite =
      registryGrant !== null &&
      /\b(?:all(?:\s+privileges)?|insert|update|delete)\b/i.test(
        registryGrant[1],
      );
    assert(
      !(grantsRuntimeRole && grantsRegistryWrite),
      `${fileName} grants direct registry-write authority to a runtime role`,
    );
  }
}

const tableDefinition = migration.slice(
  migration.indexOf("create table public.story_recipe_registry"),
  migration.indexOf(
    "alter table public.story_recipe_registry enable row level security",
  ),
);
for (const column of [
  "recipe_id",
  "manifest_sha256",
  "dataset_version",
  "match_config_version",
  "library_snapshot_sha256",
  "retrieval_mode",
  "llm_provider",
  "rerank_model_id",
  "prose_model_id",
  "embedding_model_id",
  "rerank_prompt_version",
  "story_prompt_version",
  "rerank_temperature",
  "rerank_reasoning_effort",
  "rerank_top_k",
  "story_temperature",
  "story_composer_mode",
  "hybrid_story_composer_enabled",
  "composer_version",
  "validator_version",
  "story_spec_schema_version",
  "boundary_policy_version",
  "resonance_brief_version",
  "decision_id",
  "promoted_at",
]) {
  assert.match(tableDefinition, new RegExp(`\\b${column}\\b`));
}
for (const column of [
  "recipe_id",
  "dataset_version",
  "match_config_version",
  "rerank_prompt_version",
  "story_prompt_version",
  "rerank_reasoning_effort",
  "composer_version",
  "validator_version",
  "story_spec_schema_version",
  "boundary_policy_version",
  "resonance_brief_version",
  "decision_id",
]) {
  assert(
    tableDefinition.includes(`${column} ~ '${REGISTRY_VERSION_ID_SOURCE}'`),
    `${column} does not use the conservative registry/version grammar`,
  );
}
for (const column of [
  "rerank_model_id",
  "prose_model_id",
  "embedding_model_id",
]) {
  assert(
    tableDefinition.includes(`${column} ~ '${MODEL_ID_SOURCE}'`),
    `${column} does not use the provider-qualified model grammar`,
  );
}
assert.match(tableDefinition, /recipe_id text primary key/);
assert.match(tableDefinition, /manifest_sha256 text not null unique/);
assert.match(
  tableDefinition,
  /retrieval_mode = 'keyword' and embedding_model_id is null/,
);
assert.match(
  tableDefinition,
  /retrieval_mode = 'facetsrag' and embedding_model_id is not null/,
);
assert.doesNotMatch(tableDefinition, /\b(?:active|selected|primary)_recipe\b/i);

assert.match(
  migration,
  /alter table public\.story_recipe_registry enable row level security;/,
);
assert.match(
  migration,
  /alter table public\.story_recipe_registry force row level security;/,
);
assert.match(
  migration,
  /revoke all on table public\.story_recipe_registry\s+from public, anon, authenticated, service_role;/,
);
assert.match(
  migration,
  /grant select on table public\.story_recipe_registry to service_role;/,
);
assert.doesNotMatch(
  migration,
  /grant\s+(?:all|insert|update|delete)[\s\S]{0,100}story_recipe_registry[\s\S]{0,100}service_role/i,
);
assert.match(
  migration,
  /create trigger story_recipe_registry_immutable\s+before update or delete on public\.story_recipe_registry/,
);
assert.match(
  functionBody(migration, "reject_story_recipe_mutation_v1"),
  /raise exception 'story recipe registry rows are immutable'/,
);

const registration = functionBody(migration, "register_story_recipe_v1");
const compactRegistration = compact(registration);
assert.match(registration, /insert into public\.story_recipe_registry/);
assert.match(registration, /on conflict do nothing/);
assert.match(registration, /return 'created'/);
assert.match(registration, /return 'existing'/);
assert.match(registration, /story recipe identity conflicts with immutable registry/);
assert.doesNotMatch(
  registration,
  /(?:update\s+public\.story_recipe_registry|delete\s+from\s+public\.story_recipe_registry)/i,
);
for (const parameter of [
  "p_recipe_id",
  "p_dataset_version",
  "p_match_config_version",
  "p_rerank_prompt_version",
  "p_story_prompt_version",
  "p_rerank_reasoning_effort",
  "p_composer_version",
  "p_validator_version",
  "p_story_spec_schema_version",
  "p_boundary_policy_version",
  "p_resonance_brief_version",
  "p_decision_id",
]) {
  assert(
    compactRegistration.includes(
      `${parameter} !~ '${REGISTRY_VERSION_ID_SOURCE}'`,
    ),
    `${parameter} registration guard has a divergent identifier grammar`,
  );
}
for (const parameter of [
  "p_rerank_model_id",
  "p_prose_model_id",
  "p_embedding_model_id",
]) {
  assert(
    compactRegistration.includes(`${parameter} !~ '${MODEL_ID_SOURCE}'`),
    `${parameter} registration guard has a divergent model grammar`,
  );
}
assert.match(
  migration,
  /revoke all on function public\.register_story_recipe_v1\([\s\S]*?\) from public, anon, authenticated, service_role;/,
);
assert.doesNotMatch(
  migration,
  /grant execute on function public\.register_story_recipe_v1\([\s\S]*?\) to service_role;/,
  "the web service role must not hold recipe-promotion authority",
);

const promotedHelper = functionBody(
  migration,
  "is_promoted_story_recipe_v1",
);
const registeredIdHelper = compact(
  functionBody(migration, "is_registered_story_recipe_id_v1"),
);
assert(
  registeredIdHelper.includes(
    `p_recipe_id ~ '${REGISTRY_VERSION_ID_SOURCE}'`,
  ),
  "registered recipe helper has a divergent identifier grammar",
);
for (const key of [
  "recipeId",
  "recipeManifestHash",
  "datasetVersion",
  "deploymentVersion",
  "matchConfigVersion",
  "librarySnapshotSha256",
  "retrievalMode",
  "llmProvider",
  "rerankModelId",
  "proseModelId",
  "embeddingModelId",
  "rerankPromptVersion",
  "storyPromptVersion",
  "rerankTemperature",
  "rerankReasoningEffort",
  "rerankTopK",
  "storyTemperature",
  "storyComposerMode",
  "hybridStoryComposerEnabled",
  "composerVersion",
  "validatorVersion",
  "storySpecSchemaVersion",
  "boundaryPolicyVersion",
  "crisisRegexVersion",
  "resonanceBriefVersion",
  "matchRecoveryPolicyVersion",
  "alternateStoryPolicyVersion",
]) {
  assert(promotedHelper.includes(`'${key}'`), `helper omits ${key}`);
}
assert.match(promotedHelper, /jsonb_object_keys\(p_recipe\)/);
assert(
  compact(promotedHelper).includes(
    `(p_recipe ->> 'deploymentVersion') ~ '${DEPLOYMENT_ID_SOURCE}'`,
  ),
  "deployment identifier grammar drifted",
);
for (const key of [
  "crisisRegexVersion",
  "resonanceBriefVersion",
  "matchRecoveryPolicyVersion",
  "alternateStoryPolicyVersion",
]) {
  assert(
    compact(promotedHelper).includes(
      `(p_recipe ->> '${key}') ~ '${REGISTRY_VERSION_ID_SOURCE}'`,
    ),
    `${key} does not use the conservative version grammar`,
  );
}
for (const [column, key] of [
  ["recipe_id", "recipeId"],
  ["manifest_sha256", "recipeManifestHash"],
  ["dataset_version", "datasetVersion"],
  ["match_config_version", "matchConfigVersion"],
  ["library_snapshot_sha256", "librarySnapshotSha256"],
  ["retrieval_mode", "retrievalMode"],
  ["llm_provider", "llmProvider"],
  ["rerank_model_id", "rerankModelId"],
  ["prose_model_id", "proseModelId"],
  ["rerank_prompt_version", "rerankPromptVersion"],
  ["story_prompt_version", "storyPromptVersion"],
  ["rerank_reasoning_effort", "rerankReasoningEffort"],
  ["story_composer_mode", "storyComposerMode"],
  ["composer_version", "composerVersion"],
  ["validator_version", "validatorVersion"],
  ["story_spec_schema_version", "storySpecSchemaVersion"],
  ["boundary_policy_version", "boundaryPolicyVersion"],
  ["resonance_brief_version", "resonanceBriefVersion"],
] as const) {
  assert.match(
    promotedHelper,
    new RegExp(`recipe\\.${column}\\s*=\\s*p_recipe ->> '${key}'`),
    `helper does not compare ${key} to ${column}`,
  );
}
assert.match(
  promotedHelper,
  /recipe\.embedding_model_id is null[\s\S]*?'embeddingModelId' = 'null'::jsonb/,
);
for (const [column, key] of [
  ["rerank_temperature", "rerankTemperature"],
  ["rerank_top_k", "rerankTopK"],
  ["story_temperature", "storyTemperature"],
] as const) {
  assert.match(
    promotedHelper,
    new RegExp(`recipe\\.${column}::text\\s*=\\s*(?:p_recipe ->>\\s*)?'${key}'`),
    `helper does not compare ${key} to ${column}`,
  );
}
assert.match(
  promotedHelper,
  /recipe\.hybrid_story_composer_enabled is false/,
);

const sessionTrigger = functionBody(
  migration,
  "enforce_session_story_recipe_v1",
);
assert.match(
  sessionTrigger,
  /new\.match_recipe is distinct from old\.match_recipe/,
);
assert.match(sessionTrigger, /is_promoted_story_recipe_v1\(new\.match_recipe\)/);
assert.match(
  migration,
  /create trigger sessions_promoted_story_recipe\s+before insert or update of match_recipe on public\.sessions/,
);

for (const table of ["product_events", "generation_attempts"]) {
  assert.match(
    migration,
    new RegExp(
      `alter table public\\.${table}[\\s\\S]*?drop constraint ${table}_recipe_id_check;`,
    ),
  );
  assert.match(
    migration,
    new RegExp(
      `alter table public\\.${table}\\s+add constraint ${table}_recipe_id_fkey\\s+foreign key \\(recipe_id\\) references public\\.story_recipe_registry\\(recipe_id\\)`,
    ),
  );
}
assert.match(
  migration,
  /when 'recipe_id' then\s+public\.is_registered_story_recipe_id_v1\(dimension_value\)/,
);

const recovery = functionBody(migration, "issue_match_recovery_flow_v2");
assert.match(recovery, /is_registered_story_recipe_id_v1\(p_recipe_id\)/);
assert.doesNotMatch(recovery, /keyword-rerank-figure-library-50-2026-07-02/);
assert.equal(
  compact(removeRecoveryRecipeCheck(recovery)),
  compact(
    removeRecoveryRecipeCheck(
      functionBody(migration0012, "issue_match_recovery_flow_v2"),
    ),
  ),
  "recovery RPC changed outside its recipe allowlist check",
);

const initialV4 = functionBody(
  migration,
  "create_story_session_v4_unserialized",
);
assert.match(initialV4, /is_promoted_story_recipe_v1\(v_session\.match_recipe\)/);
assert.match(
  initialV4,
  /v_artifact\.artifact #> '\{recipe,match\}'\s+is distinct from v_session\.match_recipe/,
);
assert.doesNotMatch(initialV4, /keyword-rerank-figure-library-50-2026-07-02/);
assert.doesNotMatch(initialV4, /figure-library-50-2026-07-02/);
assert.equal(
  compact(removeRecipeValidation(initialV4)),
  compact(
    removeRecipeValidation(
      functionBody(migration0012, "create_story_session_v4"),
    ),
  ),
  "initial v4 implementation changed outside recipe validation",
);
assert.match(
  functionBody(migration0019, "create_story_session_v4"),
  /pg_advisory_xact_lock[\s\S]*?create_story_session_v4_unserialized/,
  "live v4 account-deletion lock no longer wraps the replaced implementation",
);

const alternate = functionBody(
  migration,
  "complete_alternate_story_session_v2",
);
assert.match(
  alternate,
  /is_promoted_story_recipe_v1\(v_result_session\.match_recipe\)/,
);
assert.match(
  alternate,
  /v_result_artifact\.artifact #> '\{recipe,match\}'\s+is distinct from v_result_session\.match_recipe/,
);
assert.match(alternate, /alternateStoryPolicyVersion/);
assert.doesNotMatch(alternate, /keyword-rerank-figure-library-50-2026-07-02/);
assert.doesNotMatch(alternate, /figure-library-50-2026-07-02/);
assert.equal(
  compact(removeRecipeValidation(alternate)),
  compact(
    removeRecipeValidation(
      functionBody(migration0016, "complete_alternate_story_session_v2"),
    ),
  ),
  "alternate completion changed outside recipe validation",
);

const requiredKeys = [
  "recipeId",
  "recipeManifestHash",
  "datasetVersion",
  "deploymentVersion",
  "matchConfigVersion",
  "librarySnapshotSha256",
  "retrievalMode",
  "llmProvider",
  "rerankModelId",
  "proseModelId",
  "embeddingModelId",
  "rerankPromptVersion",
  "storyPromptVersion",
  "rerankTemperature",
  "rerankReasoningEffort",
  "rerankTopK",
  "storyTemperature",
  "storyComposerMode",
  "hybridStoryComposerEnabled",
  "composerVersion",
  "validatorVersion",
  "storySpecSchemaVersion",
  "boundaryPolicyVersion",
  "crisisRegexVersion",
  "resonanceBriefVersion",
  "matchRecoveryPolicyVersion",
] as const;
const allowedKeys = new Set<string>([
  ...requiredKeys,
  "alternateStoryPolicyVersion",
]);
const registered = new Map([[primary.recipeId, primary]]);

function mirrorsPromotedHelper(candidate: unknown): boolean {
  if (
    candidate === null ||
    typeof candidate !== "object" ||
    Array.isArray(candidate)
  ) {
    return false;
  }
  const value = candidate as Record<string, unknown>;
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return false;
  if (requiredKeys.some((key) => !(key in value))) return false;
  const versionFields = [
    "recipeId",
    "datasetVersion",
    "matchConfigVersion",
    "rerankPromptVersion",
    "storyPromptVersion",
    "rerankReasoningEffort",
    "composerVersion",
    "validatorVersion",
    "storySpecSchemaVersion",
    "boundaryPolicyVersion",
    "crisisRegexVersion",
    "resonanceBriefVersion",
    "matchRecoveryPolicyVersion",
  ];
  const modelFields = ["rerankModelId", "proseModelId"];
  if (
    typeof value.deploymentVersion !== "string" ||
    !deploymentId.test(value.deploymentVersion) ||
    versionFields.some(
      (key) =>
        typeof value[key] !== "string" || !registryVersionId.test(value[key]),
    ) ||
    modelFields.some(
      (key) => typeof value[key] !== "string" || !modelId.test(value[key]),
    ) ||
    (value.embeddingModelId !== null &&
      (typeof value.embeddingModelId !== "string" ||
        !modelId.test(value.embeddingModelId))) ||
    ("alternateStoryPolicyVersion" in value &&
      (typeof value.alternateStoryPolicyVersion !== "string" ||
        !registryVersionId.test(value.alternateStoryPolicyVersion)))
  ) {
    return false;
  }
  const row =
    typeof value.recipeId === "string"
      ? registered.get(value.recipeId)
      : undefined;
  if (!row) return false;
  return (
    value.recipeManifestHash === row.manifestSha256 &&
    value.datasetVersion === row.datasetVersion &&
    value.matchConfigVersion === row.matchConfigVersion &&
    value.librarySnapshotSha256 === row.librarySnapshotSha256 &&
    value.retrievalMode === row.retrievalMode &&
    value.llmProvider === row.llmProvider &&
    value.rerankModelId === row.rerankModelId &&
    value.proseModelId === row.proseModelId &&
    value.embeddingModelId === row.embeddingModelId &&
    value.rerankPromptVersion === row.rerankPromptVersion &&
    value.storyPromptVersion === row.storyPromptVersion &&
    value.rerankTemperature === row.rerankTemperature &&
    value.rerankReasoningEffort === row.rerankReasoningEffort &&
    value.rerankTopK === row.rerankTopK &&
    value.storyTemperature === row.storyTemperature &&
    value.storyComposerMode === row.storyComposerMode &&
    value.hybridStoryComposerEnabled ===
      row.hybridStoryComposerEnabled &&
    value.composerVersion === row.composerVersion &&
    value.validatorVersion === row.validatorVersion &&
    value.storySpecSchemaVersion === row.storySpecSchemaVersion &&
    value.boundaryPolicyVersion === row.boundaryPolicyVersion &&
    value.resonanceBriefVersion === row.resonanceBriefVersion
  );
}

for (const candidate of [
  "v1",
  "recipe-v1.2_candidate",
  `r${"a".repeat(127)}`,
]) {
  assert(
    registryVersionId.test(candidate),
    `valid registry/version identifier was rejected: ${candidate}`,
  );
}
for (const candidate of [
  "Recipe-v1",
  "recipe:v1",
  "recipe/v1",
  "recipe@v1",
  ".recipe",
  "recipe v1",
  `r${"a".repeat(128)}`,
]) {
  assert(
    !registryVersionId.test(candidate),
    `unsafe registry/version identifier was accepted: ${candidate}`,
  );
}
for (const candidate of [
  "gpt-oss-120b",
  "provider/model:v1@prod-1.0_2",
  `m${"a".repeat(127)}`,
]) {
  assert(modelId.test(candidate), `valid model identifier was rejected: ${candidate}`);
}
for (const candidate of [
  "Provider/model",
  "/provider/model",
  "provider model",
  "provider+model",
  `m${"a".repeat(128)}`,
]) {
  assert(!modelId.test(candidate), `unsafe model identifier was accepted: ${candidate}`);
}
for (const candidate of [
  "deploy_2026-07-18.a1",
  "Deploy_2026-07-18.A1",
]) {
  assert(
    deploymentId.test(candidate),
    `valid deployment identifier was rejected: ${candidate}`,
  );
}
for (const candidate of ["bad/value", "bad:value", ".deploy"]) {
  assert(
    !deploymentId.test(candidate),
    `unsafe deployment identifier was accepted: ${candidate}`,
  );
}

const validMatchRecipe: Record<string, unknown> = {
  recipeId: primary.recipeId,
  recipeManifestHash: primary.manifestSha256,
  datasetVersion: primary.datasetVersion,
  deploymentVersion: "deploy_2026-07-18.a1",
  matchConfigVersion: primary.matchConfigVersion,
  librarySnapshotSha256: primary.librarySnapshotSha256,
  retrievalMode: primary.retrievalMode,
  llmProvider: primary.llmProvider,
  rerankModelId: primary.rerankModelId,
  proseModelId: primary.proseModelId,
  embeddingModelId: primary.embeddingModelId,
  rerankPromptVersion: primary.rerankPromptVersion,
  storyPromptVersion: primary.storyPromptVersion,
  rerankTemperature: primary.rerankTemperature,
  rerankReasoningEffort: primary.rerankReasoningEffort,
  rerankTopK: primary.rerankTopK,
  storyTemperature: primary.storyTemperature,
  storyComposerMode: primary.storyComposerMode,
  hybridStoryComposerEnabled: primary.hybridStoryComposerEnabled,
  composerVersion: primary.composerVersion,
  validatorVersion: primary.validatorVersion,
  storySpecSchemaVersion: primary.storySpecSchemaVersion,
  boundaryPolicyVersion: primary.boundaryPolicyVersion,
  crisisRegexVersion: "v2-2026-07",
  resonanceBriefVersion: primary.resonanceBriefVersion,
  matchRecoveryPolicyVersion: "match-recovery-v1-2026-07",
};
assert(mirrorsPromotedHelper(validMatchRecipe), "valid recipe mirror failed");
assert(
  mirrorsPromotedHelper({
    ...validMatchRecipe,
    deploymentVersion: "Deploy_2026-07-18.A1",
  }),
  "unchanged case-preserving deployment grammar was rejected",
);
assert(
  mirrorsPromotedHelper({
    ...validMatchRecipe,
    alternateStoryPolicyVersion: "alternate-story-v1-2026-07",
  }),
  "known optional alternate policy was rejected",
);
for (const key of requiredKeys) {
  const missing = { ...validMatchRecipe };
  delete missing[key];
  assert(!mirrorsPromotedHelper(missing), `missing ${key} was accepted`);
}
for (const [key, badValue] of [
  ["recipeManifestHash", "0".repeat(64)],
  ["datasetVersion", "other-dataset"],
  ["matchConfigVersion", "other-config"],
  ["librarySnapshotSha256", "0".repeat(64)],
  ["retrievalMode", "facetsrag"],
  ["llmProvider", "stub"],
  ["rerankModelId", "other-model"],
  ["proseModelId", "other-model"],
  ["embeddingModelId", "gemini-embedding-001@d1536"],
  ["rerankPromptVersion", "other-prompt"],
  ["storyPromptVersion", "other-prompt"],
  ["rerankTemperature", 0.7],
  ["rerankReasoningEffort", "high"],
  ["rerankTopK", 99],
  ["storyTemperature", 0.9],
  ["storyComposerMode", "hybrid"],
  ["hybridStoryComposerEnabled", true],
  ["composerVersion", "other-composer"],
  ["validatorVersion", "other-validator"],
  ["storySpecSchemaVersion", "other-spec"],
  ["boundaryPolicyVersion", "other-boundary"],
  ["resonanceBriefVersion", "other-resonance"],
] as const) {
  assert(
    !mirrorsPromotedHelper({ ...validMatchRecipe, [key]: badValue }),
    `tampered ${key} was accepted`,
  );
}
assert(
  !mirrorsPromotedHelper({ ...validMatchRecipe, recipeId: "unknown-recipe" }),
  "unknown recipe was accepted",
);
assert(
  !mirrorsPromotedHelper({
    ...validMatchRecipe,
    recipeId: manifest.recipes.find(
      (recipe) => recipe.recipeId !== primary.recipeId,
    )?.recipeId,
  }),
  "unpromoted challenger was accepted",
);
assert(
  !mirrorsPromotedHelper({ ...validMatchRecipe, deploymentVersion: "bad/value" }),
  "unsafe deployment version was accepted",
);
assert(
  !mirrorsPromotedHelper({ ...validMatchRecipe, disclosure: "private text" }),
  "unbounded extra recipe field was accepted",
);
assert(
  !mirrorsPromotedHelper({ ...validMatchRecipe, crisisRegexVersion: 2 }),
  "non-string operational version was accepted",
);
assert(
  !mirrorsPromotedHelper({
    ...validMatchRecipe,
    crisisRegexVersion: "Crisis-v2-2026-07",
  }),
  "uppercase operational version was accepted",
);
assert(
  !mirrorsPromotedHelper({
    ...validMatchRecipe,
    matchRecoveryPolicyVersion: "match:recovery",
  }),
  "punctuation outside the version grammar was accepted",
);
assert(
  !mirrorsPromotedHelper({
    ...validMatchRecipe,
    alternateStoryPolicyVersion: "bad/value",
  }),
  "unsafe optional policy version was accepted",
);

console.log("PASS story recipe registry seed matches canonical manifest hash");
console.log("PASS registry is append-only, default-deny, and promotion-guarded");
console.log("PASS sessions require immutable exact promoted recipe identities");
console.log("PASS telemetry/recovery/rollup recipe IDs use the registry allowlist");
console.log("PASS initial and alternate wrappers preserve non-recipe semantics");
console.log("PASS static negative tamper matrix rejects recipe drift and extras");
