import "./_smoke-bootstrap";
import assert from "node:assert/strict";
import {
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import {
  DERIVED_OUTPUT_CONSUMERS,
  DERIVED_OUTPUT_POLICIES,
  DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
  DERIVED_OUTPUT_SURFACES,
  EXTERNAL_PROVIDER_EXCHANGES,
  LEGACY_DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
  PERSISTENCE_RETENTION_REGISTRY,
  RETENTION_BEARING_COLUMN_REGISTRY,
  RETENTION_CLASSES,
  RETENTION_CLASS_POLICIES,
  RETENTION_SINKS,
  assertRetentionSink,
  classifyDerivedOutput,
  consumeDerivedOutput,
  parsePersistedRetentionLabel,
  retentionPolicyFor,
  type DerivedOutput,
  type DerivedOutputConsumer,
  type DerivedOutputKind,
  type ExternalProviderExchangeId,
  type RetentionClass,
  type RetentionSink,
} from "../lib/derived-output-retention";
import {
  ExternalProviderBoundaryError,
  ExternalProviderTransportError,
  buildCerebrasHybridPlanRequestBody,
  buildCerebrasOpeningCopyRequestBody,
  buildCerebrasRerankRequestBody,
  buildGeminiDocumentEmbeddingRequestBody,
  buildGeminiQueryEmbeddingRequestBody,
  fetchExternalProvider,
  type ExternalProviderRequestBody,
} from "../lib/provider-exchange";
import { jsonError, textStreamHeaders } from "../lib/api-utils";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LIB = resolve(ROOT, "lib");
const MIGRATIONS = resolve(ROOT, "supabase", "migrations");
const PRIVATE_CANARY =
  "never-retain-provider-output-cobalt-magnolia-2026";
const FORBIDDEN_NETWORK_IDENTIFIERS = [
  "EventSource",
  "Image",
  "RTCPeerConnection",
  "SharedWorker",
  "WebSocket",
  "WebTransport",
  "Worker",
  "XMLHttpRequest",
  "fetch",
  "getBuiltinModule",
  "sendBeacon",
] as const;

async function main(): Promise<void> {
  checkClosedRegistry();
  checkOpaqueOutputs();
  checkPersistenceCoverage();
  checkRelationalEnvelope();
  checkOwnerResponseCaching();
  checkRetentionCopy();
  checkStaticProviderCoverage();
  await checkProviderTransportBoundary();

  console.log("Onward derived-output retention contract");
  console.log("========================================");
  console.log(
    `PASS ${RETENTION_CLASSES.length} closed classes and ${Object.keys(DERIVED_OUTPUT_SURFACES).length} classified surfaces`,
  );
  console.log(
    `PASS ${Object.keys(EXTERNAL_PROVIDER_EXCHANGES).length} provider exchanges have registered surfaces, bound endpoints, and fixed call owners`,
  );
  console.log(
    `PASS ${Object.keys(PERSISTENCE_RETENTION_REGISTRY).length} application-owned tables are exhaustively classified`,
  );
  console.log(
    `PASS ${Object.values(RETENTION_BEARING_COLUMN_REGISTRY).reduce((count, columns) => count + Object.keys(columns).length, 0)} sensitive-table columns match migration history and live catalog proof`,
  );
  console.log(
    "PASS durable labels have a session-first rollout, current-only inserts, immutability, and a closed live schema gate",
  );
  console.log(
    `PASS ${Object.keys(DERIVED_OUTPUT_POLICIES).length} opaque output kinds reject forged tokens and use AST-enumerated literal consumers`,
  );
  console.log("PASS every production fetch call, alias, and property reference is enumerated");
  console.log("PASS raw provider transport errors are reduced without a cause");
  console.log("PASS story prose and private errors are marked no-store");
  console.log("PASS save and privacy copy state both derived-output lifecycles");
}

function checkClosedRegistry(): void {
  assert.equal(new Set(RETENTION_CLASSES).size, RETENTION_CLASSES.length);
  assert.equal(new Set(RETENTION_SINKS).size, RETENTION_SINKS.length);
  assert.equal(
    new Set(DERIVED_OUTPUT_CONSUMERS).size,
    DERIVED_OUTPUT_CONSUMERS.length,
  );
  assert.deepEqual(
    Object.keys(RETENTION_CLASS_POLICIES).sort(),
    [...RETENTION_CLASSES].sort(),
  );
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(EXTERNAL_PROVIDER_EXCHANGES).map(
        ([exchangeId, exchange]) => [
          exchangeId,
          {
            requestSurfaces: exchange.requestSurfaces,
            responseSurface: exchange.responseSurface,
          },
        ],
      ),
    ),
    {
      "cerebras.rerank": {
        requestSurfaces: [
          "input.raw_disclosure",
          "input.age",
          "content.curated_reference",
        ],
        responseSurface: "provider.rerank_response",
      },
      "cerebras.opening_copy": {
        requestSurfaces: [
          "analysis.resonance_brief",
          "content.curated_reference",
        ],
        responseSurface: "provider.opening_copy_response",
      },
      "cerebras.hybrid_plan": {
        requestSurfaces: [
          "analysis.resonance_brief",
          "analysis.hybrid_retry_feedback",
          "content.curated_reference",
        ],
        responseSurface: "provider.hybrid_plan_response",
      },
      "gemini.query_embedding": {
        requestSurfaces: ["input.raw_disclosure"],
        responseSurface: "embedding.query_vector",
      },
      "gemini.document_embedding": {
        requestSurfaces: ["content.curated_reference"],
        responseSurface: "embedding.curated_vector",
      },
    },
    "provider exchanges must retain the exact reviewed request/response surface inventory",
  );
  assert.equal(
    RETENTION_CLASS_POLICIES.recovery_context.expiryHorizon,
    "60_day_eligibility",
  );
  assert.equal(
    "maximumLifetime" in RETENTION_CLASS_POLICIES.recovery_context,
    false,
    "scheduled expiry horizons must not be represented as hard physical maxima",
  );
  assert(deepFrozen(RETENTION_CLASS_POLICIES));
  assert(deepFrozen(DERIVED_OUTPUT_SURFACES));
  assert(deepFrozen(EXTERNAL_PROVIDER_EXCHANGES));
  assert(deepFrozen(PERSISTENCE_RETENTION_REGISTRY));
  assert(deepFrozen(RETENTION_BEARING_COLUMN_REGISTRY));
  assert(deepFrozen(DERIVED_OUTPUT_POLICIES));

  for (const [surface, definition] of Object.entries(
    DERIVED_OUTPUT_SURFACES,
  )) {
    assert(RETENTION_CLASSES.includes(definition.retentionClass));
    assert(definition.allowedSinks.length > 0);
    assert.equal(
      new Set(definition.allowedSinks).size,
      definition.allowedSinks.length,
    );
    for (const sink of definition.allowedSinks) {
      assert(RETENTION_SINKS.includes(sink));
      const label = assertRetentionSink(
        surface as keyof typeof DERIVED_OUTPUT_SURFACES,
        sink,
      );
      assert.deepEqual(label, {
        policyVersion: DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
        retentionClass: definition.retentionClass,
      });
      assert(Object.isFrozen(label));
    }
    const policy = retentionPolicyFor(
      surface as keyof typeof DERIVED_OUTPUT_SURFACES,
    );
    assert(Object.isFrozen(policy));
    assert.equal(policy.retentionClass, definition.retentionClass);
  }

  const persistentSinks: readonly RetentionSink[] = [
    "root_session",
    "owned_story_store",
    "bounded_feedback_store",
    "bounded_operational_store",
    "shared_editorial_store",
    "curated_reference_store",
    "owner_response",
  ];
  for (const [surface, definition] of Object.entries(
    DERIVED_OUTPUT_SURFACES,
  )) {
    if (definition.retentionClass !== "request_ephemeral") continue;
    for (const sink of persistentSinks) {
      assert.throws(() =>
        assertRetentionSink(
          surface as keyof typeof DERIVED_OUTPUT_SURFACES,
          sink,
        ),
      );
    }
  }

  assert.throws(() =>
    assertRetentionSink(
      "analysis.resonance_brief",
      "owned_story_store",
    ),
  );
  assert.throws(() =>
    assertRetentionSink(
      "not.registered" as keyof typeof DERIVED_OUTPUT_SURFACES,
      "request_memory",
    ),
  );
  assert.throws(() =>
    assertRetentionSink(
      "story.artifact",
      "not_registered" as RetentionSink,
    ),
  );

  const current = assertRetentionSink(
    "story.artifact",
    "owned_story_store",
  );
  assert.deepEqual(
    parsePersistedRetentionLabel(current, "owned_story"),
    current,
  );
  assert.deepEqual(
    parsePersistedRetentionLabel(
      {
        policyVersion: LEGACY_DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
        retentionClass: "owned_story",
      },
      "owned_story",
    ),
    {
      policyVersion: LEGACY_DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
      retentionClass: "owned_story",
    },
  );
  const malformedLabels: unknown[] = [
    null,
    {},
    {
      policyVersion: DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
      retentionClass: "owned_story",
      extra: true,
    },
    {
      policyVersion: "future-policy",
      retentionClass: "owned_story",
    },
    {
      policyVersion: DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
      retentionClass: "request_ephemeral",
    },
  ];
  for (const malformed of malformedLabels) {
    assert.throws(() =>
      parsePersistedRetentionLabel(malformed, "owned_story"),
    );
  }

  for (const [exchangeId, exchange] of Object.entries(
    EXTERNAL_PROVIDER_EXCHANGES,
  )) {
    assert(exchangeId.includes("."));
    assert(exchange.requestSurfaces.length > 0);
    for (const surface of exchange.requestSurfaces) {
      assert.doesNotThrow(() =>
        assertRetentionSink(surface, "external_provider"),
      );
    }
    assert.doesNotThrow(() =>
      assertRetentionSink(exchange.responseSurface, "request_memory"),
    );
  }
}

function checkOpaqueOutputs(): void {
  const pickValue = {
    figureKey: "butler",
    stageId: "early",
    resonance: PRIVATE_CANARY,
    gap: "synthetic gap",
    confidence: "high",
  } as const;
  const pick = classifyDerivedOutput("rerank_response", pickValue);
  assert(Object.isFrozen(pick));
  assert.deepEqual(Object.keys(pick).sort(), ["kind", "policyVersion"]);
  assert(!JSON.stringify(pick).includes(PRIVATE_CANARY));
  assert.strictEqual(
    consumeDerivedOutput(pick, "match_reducer"),
    pickValue,
  );
  assert(Object.isFrozen(pickValue));
  assert.throws(() =>
    consumeDerivedOutput(
      pick,
      "story_artifact_builder" as unknown as "match_reducer",
    ),
  );

  const forged = Object.freeze({
    kind: "rerank_response",
    policyVersion: DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
  }) as DerivedOutput<"rerank_response">;
  assert.throws(() => consumeDerivedOutput(forged, "match_reducer"));
  const stale = Object.freeze({
    kind: "rerank_response",
    policyVersion: LEGACY_DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
  }) as unknown as DerivedOutput<"rerank_response">;
  assert.throws(() => consumeDerivedOutput(stale, "match_reducer"));

  const opening = classifyDerivedOutput("opening_copy_candidate", {
    eyebrow: "A story for the difficult middle",
    prefaceLines: ["The lives are different."],
  });
  assert.equal(
    DERIVED_OUTPUT_POLICIES.opening_copy_candidate.retentionClass,
    "request_ephemeral",
  );
  assert.equal(
    DERIVED_OUTPUT_SURFACES["story.opening_copy"].retentionClass,
    "owned_story",
  );
  const openingValue = consumeDerivedOutput(opening, "story_validator");
  assert(Object.isFrozen(openingValue));
  assert(Object.isFrozen(openingValue.prefaceLines));
  assert.throws(() =>
    consumeDerivedOutput(
      opening,
      "match_reducer" as unknown as "story_validator",
    ),
  );

  const candidateValue = {
    schemaVersion: "untrusted",
    arbitrary: PRIVATE_CANARY,
  };
  const candidate = classifyDerivedOutput(
    "composition_plan_candidate",
    candidateValue,
  );
  assert(
    !JSON.stringify(candidate).includes(PRIVATE_CANARY),
    "untrusted plan leaked through its token",
  );
  assert.strictEqual(
    consumeDerivedOutput(candidate, "composition_plan_validator"),
    candidateValue,
  );
  assert(Object.isFrozen(candidateValue));

  const planValue = {
    schemaVersion: "hybrid-plan-v1-2026-07",
    transitionRole: "turning_point",
    transitionTemplateId: "transition-shared-pressure-v1",
    bridgeTemplateId: "bridge-company-v1",
  } as const;
  const plan = classifyDerivedOutput(
    "validated_composition_plan",
    planValue,
  );
  assert.strictEqual(
    consumeDerivedOutput(plan, "story_artifact_builder"),
    planValue,
  );
  assert.throws(() =>
    classifyDerivedOutput("validated_composition_plan", {
      ...planValue,
      schemaVersion: "wrong",
      transitionRole: "wrong",
      transitionTemplateId: "wrong",
      bridgeTemplateId: "wrong",
    } as never),
  );

  const vectorValue = [0.1, 0.2, 0.3];
  const vector = classifyDerivedOutput(
    "retrieval_query_embedding",
    vectorValue,
  );
  assert.deepEqual(
    consumeDerivedOutput(vector, "retrieval_scoring"),
    vectorValue,
  );
  assert(Object.isFrozen(vectorValue));

  assert.throws(() =>
    classifyDerivedOutput(
      "retrieval_query_embedding",
      [0, Number.NaN],
    ),
  );
  assert.throws(() =>
    classifyDerivedOutput("opening_copy_candidate", {
      eyebrow: "valid",
      prefaceLines: [42],
    } as unknown as {
      eyebrow: string;
      prefaceLines: readonly string[];
    }),
  );
  assert.throws(() =>
    classifyDerivedOutput(
      "not_registered" as DerivedOutputKind,
      null as never,
    ),
  );
}

function checkPersistenceCoverage(): void {
  const migrationTables = new Set<string>();
  const retentionBearingColumns = new Map<string, Set<string>>(
    Object.keys(RETENTION_BEARING_COLUMN_REGISTRY).map((table) => [
      table,
      new Set<string>(),
    ]),
  );
  for (const name of readdirSync(MIGRATIONS).filter((entry) =>
    entry.endsWith(".sql"),
  )) {
    const sql = stripSqlComments(
      readFileSync(resolve(MIGRATIONS, name), "utf8"),
    );
    for (const table of discoverApplicationTables(sql)) {
      migrationTables.add(table);
    }
    collectRetentionBearingColumns(sql, name, retentionBearingColumns);
  }

  assert.deepEqual(
    [...migrationTables].sort(),
    Object.keys(PERSISTENCE_RETENTION_REGISTRY).sort(),
    "every application-owned table must have exactly one registry entry",
  );
  for (const [table, classes] of Object.entries(
    PERSISTENCE_RETENTION_REGISTRY,
  )) {
    assert(table.startsWith("public."));
    assert(classes.length > 0);
    assert.equal(new Set(classes).size, classes.length);
    assert(!classes.includes("request_ephemeral" as never));
    for (const retentionClass of classes) {
      assert(
        RETENTION_CLASSES.includes(retentionClass as RetentionClass),
        `${table} uses an unknown retention class`,
      );
    }
  }

  for (const [table, classifications] of Object.entries(
    RETENTION_BEARING_COLUMN_REGISTRY,
  )) {
    const migrationColumns = retentionBearingColumns.get(table);
    assert(migrationColumns, `${table} has no migration column inventory`);
    assert.deepEqual(
      [...migrationColumns].sort(),
      Object.keys(classifications).sort(),
      `${table} columns and their retention classifications must stay one-to-one`,
    );
    for (const [column, retentionClass] of Object.entries(
      classifications,
    )) {
      assert(
        RETENTION_CLASSES.includes(retentionClass as RetentionClass),
        `${table}.${column} uses an unknown retention class`,
      );
      assert(
        PERSISTENCE_RETENTION_REGISTRY[
          table as keyof typeof PERSISTENCE_RETENTION_REGISTRY
        ].includes(retentionClass as never),
        `${table}.${column} uses ${retentionClass}, which ${table} is not allowed to persist`,
      );
    }
  }
  checkSqlInventoryParser();
}

function checkRelationalEnvelope(): void {
  const migrationPath = resolve(
    MIGRATIONS,
    "0021_derived_output_retention.sql",
  );
  const migration = readFileSync(migrationPath, "utf8").toLowerCase();
  const requiredSql = [
    "set local lock_timeout = '10s'",
    "lock table public.sessions in access exclusive mode",
    "lock table public.story_artifacts in access exclusive mode",
    "alter table public.story_artifacts",
    "add column retention_policy_version text not null",
    "add column retention_class text not null",
    "alter table public.sessions",
    "add column story_retention_class text not null",
    "add column context_retention_class text not null",
    "legacy-pre-derived-output-retention-v0",
    "derived-output-retention-v1-2026-07",
    "retention_class = 'owned_story'",
    "story_retention_class = 'owned_story'",
    "context_retention_class = 'recovery_context'",
    "sessions_retention_contract_immutable",
    "session retention contract is immutable",
    "enforce_current_session_retention_contract_v1",
    "enforce_current_artifact_retention_contract_v1",
    "new rows require the current retention contract",
    "sessions_retention_contract_current_insert",
    "story_artifacts_retention_contract_current_insert",
    "derived_output_retention_schema_health_v1",
    "pg_catalog.pg_get_expr",
    "pg_catalog.pg_get_constraintdef",
    "pg_catalog.pg_get_triggerdef",
    "pg_catalog.pg_get_functiondef",
    "story_artifacts_immutable",
    "reject_story_artifact_update",
    "grant execute on function public.derived_output_retention_schema_health_v1()",
    "notify pgrst, 'reload schema'",
  ];
  for (const fragment of requiredSql) {
    assert(
      migration.includes(fragment),
      `migration 0021 is missing ${fragment}`,
    );
  }
  const liveColumnInventory = migration.match(
    /-- retention-column-health:start([\s\S]*?)-- retention-column-health:end/,
  );
  assert(
    liveColumnInventory,
    "migration 0021 must expose its closed live column inventory to CI",
  );
  const liveColumns = [
    ...liveColumnInventory[1].matchAll(
      /\(\s*'([a-z_][a-z0-9_]*)'(?:\s*::text)?\s*,\s*'([a-z_][a-z0-9_]*)'(?:\s*::text)?\s*,\s*'([a-z_][a-z0-9_]*)'(?:\s*::text)?\s*\)/g,
    ),
  ].map((match) => `public.${match[1]}.${match[2]}->${match[3]}`);
  const registeredColumns = Object.entries(
    RETENTION_BEARING_COLUMN_REGISTRY,
  ).flatMap(([table, columns]) =>
    Object.entries(columns).map(
      ([column, retentionClass]) =>
        `${table}.${column}->${retentionClass}`,
    ),
  );
  assert.deepEqual(
    [...liveColumns].sort(),
    [...registeredColumns].sort(),
    "the live pg_attribute proof must exactly mirror the code-owned column registry",
  );
  const legacyDefault = migration.indexOf(
    "default 'legacy-pre-derived-output-retention-v0'",
  );
  const currentDefault = migration.indexOf(
    "set default 'derived-output-retention-v1-2026-07'",
  );
  const sessionLock = migration.indexOf(
    "lock table public.sessions in access exclusive mode",
  );
  const artifactLock = migration.indexOf(
    "lock table public.story_artifacts in access exclusive mode",
  );
  assert(
    sessionLock >= 0 && artifactLock > sessionLock,
    "migration must preserve the live session-before-artifact lock order",
  );
  assert(
    legacyDefault >= 0 &&
      currentDefault > legacyDefault,
    "existing rows must receive an honest legacy label before new-write defaults switch current",
  );
  assert(
    !/\bupdate\s+public\.story_artifacts\b/.test(migration),
    "retention migration must not rewrite immutable artifact rows or JSON",
  );
  assert(
    !/story-artifact-v6|jsonb_set|\bartifact\s*=/.test(migration),
    "retention metadata must remain outside content-addressed StoryArtifact JSON",
  );

  const artifactStore = readFileSync(
    resolve(LIB, "story-artifacts.ts"),
    "utf8",
  );
  assert(
    artifactStore.includes(
      '.select("artifact, retention_class, retention_policy_version")',
    ) &&
      artifactStore.includes("parsePersistedRetentionLabel("),
    "durable artifacts must fail reads with unknown retention labels",
  );
  const sessionStore = readFileSync(
    resolve(LIB, "session-store-supabase.ts"),
    "utf8",
  );
  for (const field of [
    "retention_policy_version",
    "story_retention_class",
    "context_retention_class",
  ]) {
    assert(
      sessionStore.includes(field),
      `Supabase session reads do not validate ${field}`,
    );
  }
  assert.equal(
    countOccurrences(sessionStore, "parsePersistedRetentionLabel("),
    2,
    "a mixed session row must validate both story and recovery-context labels",
  );

  const memoryArtifactStore = readFileSync(
    resolve(LIB, "story-artifact-store-memory.ts"),
    "utf8",
  );
  assert(
    memoryArtifactStore.includes("CURRENT_ARTIFACT_RETENTION") &&
      memoryArtifactStore.includes("LEGACY_ARTIFACT_RETENTION") &&
      memoryArtifactStore.includes("parsePersistedRetentionLabel("),
    "memory artifacts must stamp new writes and classify pre-contract hot-reload rows",
  );
  const databaseCheck = readFileSync(
    resolve(ROOT, "scripts", "check-db.ts"),
    "utf8",
  );
  assert(
    databaseCheck.includes(
      '.rpc(\n      "derived_output_retention_schema_health_v1",',
    ) &&
      databaseCheck.includes(
        "derived-output retention schema health is unsafe",
      ),
    "the live database gate must fail on drifted defaults, constraints, triggers, labels, or grants",
  );

  const requiredSinkOwners: Readonly<Record<string, readonly string[]>> = {
    "story.artifact": [
      "lib/session-store-memory.ts",
      "lib/session-store-supabase.ts",
      "lib/story-artifact-store-memory.ts",
      "lib/alternate-story-store-supabase.ts",
    ],
    "telemetry.product_event": ["lib/telemetry.ts"],
    "telemetry.generation_attempt": ["lib/telemetry.ts"],
    "feedback.closed_response": ["lib/resonance-feedback.ts"],
    "editorial.historical_concern": ["lib/historical-concerns.ts"],
    "embedding.curated_vector": ["scripts/seed-embeddings.ts"],
  };
  for (const [surface, owners] of Object.entries(requiredSinkOwners)) {
    for (const owner of owners) {
      const source = readFileSync(resolve(ROOT, owner), "utf8");
      assert(
        source.includes(`"${surface}"`),
        `${owner} does not name the ${surface} retention surface`,
      );
    }
  }
}

function collectRetentionBearingColumns(
  sqlSource: string,
  migrationName: string,
  inventory: Map<string, Set<string>>,
): void {
  const sql = stripSqlComments(sqlSource);
  for (const match of sql.matchAll(createTableHeaderPattern())) {
    const tail = sql.slice((match.index ?? 0) + match[0].length);
    const identifier = parseCanonicalPublicIdentifier(
      tail,
      `${migrationName} CREATE TABLE`,
    );
    const table = `public.${identifier.name}`;
    if (!inventory.has(table)) continue;
    const columns = inventory.get(table);
    assert(columns, `${table} is missing from the column registry`);
    const afterIdentifier = tail.slice(identifier.consumed).trimStart();
    assert(
      afterIdentifier.startsWith("("),
      `${migrationName} must declare ${table} columns explicitly`,
    );
    const closing = matchingSqlParenthesis(afterIdentifier, 0);
    assert(
      closing > 0,
      `${migrationName} has an unterminated ${table} definition`,
    );
    const body = afterIdentifier.slice(1, closing);
    for (const definition of splitTopLevelSqlList(body)) {
      const trimmed = definition.trim();
      if (trimmed === "") continue;
      const parsed = parseCanonicalIdentifier(
        trimmed,
        `${migrationName} ${table} column`,
      );
      const column = parsed.name;
      if (
        [
          "check",
          "constraint",
          "exclude",
          "foreign",
          "primary",
          "unique",
        ].includes(column)
      ) {
        continue;
      }
      columns.add(column);
    }
  }

  for (const match of sql.matchAll(alterTableHeaderPattern())) {
    const tail = sql.slice((match.index ?? 0) + match[0].length);
    const identifier = parseCanonicalPublicIdentifier(
      tail,
      `${migrationName} ALTER TABLE`,
    );
    const table = `public.${identifier.name}`;
    if (!inventory.has(table)) continue;
    const columns = inventory.get(table);
    assert(columns, `${table} is missing from the column registry`);
    let afterIdentifier = tail.slice(identifier.consumed).trimStart();
    if (afterIdentifier.startsWith("*")) {
      afterIdentifier = afterIdentifier.slice(1).trimStart();
    }
    const statementEnd = sqlStatementEnd(afterIdentifier);
    assert(
      statementEnd >= 0,
      `${migrationName} has an unterminated ${table} ALTER statement`,
    );
    const body = afterIdentifier.slice(0, statementEnd);
    for (const clauseSource of splitTopLevelSqlList(body)) {
      const clause = clauseSource.trim();
      assert(
        !/^(?:drop|rename)\b/i.test(clause),
        `${migrationName} changes a ${table} identity; update the fail-closed schema extractor explicitly`,
      );
      if (!/^add\b/i.test(clause)) continue;
      if (
        /^add\s+(?:check|constraint|exclude|foreign|primary|unique)\b/i.test(
          clause,
        )
      ) {
        continue;
      }
      const addPrefix = clause.match(
        /^add\s+(?:column\s+)?(?:if\s+not\s+exists\s+)?/i,
      );
      assert(
        addPrefix,
        `${migrationName} has an unparsed ${table} ADD clause; update the fail-closed schema extractor explicitly`,
      );
      const column = parseCanonicalIdentifier(
        clause.slice(addPrefix[0].length),
        `${migrationName} ${table} ADD column`,
      );
      columns.add(column.name);
    }
  }
}

function discoverApplicationTables(sqlSource: string): string[] {
  const sql = stripSqlComments(sqlSource);
  const tables: string[] = [];
  for (const match of sql.matchAll(createTableHeaderPattern())) {
    const tail = sql.slice((match.index ?? 0) + match[0].length);
    const identifier = parseCanonicalPublicIdentifier(
      tail,
      "CREATE TABLE inventory",
    );
    tables.push(`public.${identifier.name}`);
  }
  return tables;
}

function createTableHeaderPattern(): RegExp {
  return /\bcreate\s+(?:(?:foreign|unlogged)\s+)?table\s+(?:if\s+not\s+exists\s+)?/gi;
}

function alterTableHeaderPattern(): RegExp {
  return /\balter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?/gi;
}

function parseCanonicalPublicIdentifier(
  source: string,
  label: string,
): Readonly<{ name: string; consumed: number }> {
  const match = source.match(
    /^(?:(?:"public"|public)\s*\.\s*)?(?:"([a-z_][a-z0-9_]*)"|([a-z_][a-z0-9_]*))(?=\s|\()/,
  );
  assert(
    match,
    `${label} must use a complete canonical lowercase public identifier`,
  );
  return { name: match[1] ?? match[2], consumed: match[0].length };
}

function parseCanonicalIdentifier(
  source: string,
  label: string,
): Readonly<{ name: string; consumed: number }> {
  const match = source.match(
    /^(?:"([a-z_][a-z0-9_]*)"|([a-z_][a-z0-9_]*))(?=\s|$)/,
  );
  assert(match, `${label} must use a complete canonical lowercase identifier`);
  return { name: match[1] ?? match[2], consumed: match[0].length };
}

function matchingSqlParenthesis(source: string, opening: number): number {
  let depth = 0;
  let quote: "'" | '"' | null = null;
  for (let index = opening; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote) {
        if (source[index + 1] === quote) index += 1;
        else quote = null;
      }
      continue;
    }
    if (character === "'" || character === '"') quote = character;
    else if (character === "(") depth += 1;
    else if (character === ")") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function sqlStatementEnd(source: string): number {
  let depth = 0;
  let quote: "'" | '"' | null = null;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote) {
        if (source[index + 1] === quote) index += 1;
        else quote = null;
      }
      continue;
    }
    if (character === "'" || character === '"') quote = character;
    else if (character === "(") depth += 1;
    else if (character === ")") depth -= 1;
    else if (character === ";" && depth === 0) return index;
  }
  return -1;
}

function checkSqlInventoryParser(): void {
  assert.deepEqual(
    discoverApplicationTables(`
      create unlogged table "public"."provider_dumps" (payload jsonb);
      create foreign table public.provider_archive (payload text)
        server example;
    `).sort(),
    ["public.provider_archive", "public.provider_dumps"],
  );
  for (const invalidTable of [
    'create table public."sessions-leak" (payload text);',
    "create table public.sessions$leak (payload text);",
  ]) {
    assert.throws(() => discoverApplicationTables(invalidTable));
  }
  const inventory = new Map<string, Set<string>>([
    ["public.sessions", new Set<string>()],
    ["public.story_artifacts", new Set<string>()],
  ]);
  collectRetentionBearingColumns(
    `
      create table public.sessions (
        session_id text primary key
      );
      alter table if exists only "public"."sessions" *
        add raw_provider_response custom_type,
        add column if not exists explicit_payload jsonb;
    `,
    "adversarial.sql",
    inventory,
  );
  assert.deepEqual(
    [...(inventory.get("public.sessions") ?? [])].sort(),
    ["explicit_payload", "raw_provider_response", "session_id"],
  );
  for (const mutation of [
    "alter table public.sessions drop feeling;",
    "alter table public.sessions rename feeling to old_feeling;",
    'alter table public.sessions add column "feeling-leak" text;',
    "alter table public.sessions add column feeling$leak text;",
  ]) {
    assert.throws(() =>
      collectRetentionBearingColumns(
        mutation,
        "adversarial.sql",
        new Map<string, Set<string>>([
          ["public.sessions", new Set<string>()],
          ["public.story_artifacts", new Set<string>()],
        ]),
      ),
    );
  }
}

function stripSqlComments(sql: string): string {
  return sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, " ");
}

function splitTopLevelSqlList(body: string): string[] {
  const definitions: string[] = [];
  let start = 0;
  let depth = 0;
  let quote: "'" | '"' | null = null;
  for (let index = 0; index < body.length; index += 1) {
    const character = body[index];
    if (quote) {
      if (character === quote) {
        if (body[index + 1] === quote) {
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (character === "(") depth += 1;
    else if (character === ")") depth -= 1;
    else if (character === "," && depth === 0) {
      definitions.push(body.slice(start, index));
      start = index + 1;
    }
  }
  definitions.push(body.slice(start));
  return definitions;
}

function checkOwnerResponseCaching(): void {
  assert.equal(textStreamHeaders["cache-control"], "no-store");
  assert.equal(
    jsonError("private failure", 400).headers.get("cache-control"),
    "no-store",
  );
  const beatRoute = readFileSync(
    resolve(ROOT, "app", "api", "beat", "route.ts"),
    "utf8",
  );
  assert(
    beatRoute.includes("...textStreamHeaders"),
    "the owner-only prose route must use the no-store stream headers",
  );
}

function checkRetentionCopy(): void {
  const saveCard = readFileSync(
    resolve(ROOT, "components", "SaveStoriesCard.tsx"),
    "utf8",
  );
  for (const phrase of [
    "generated wording",
    "age used to find it",
    "fixed 60-day deadline",
    "until you delete",
  ]) {
    assert(
      saveCard.includes(phrase),
      `save consent omits the ${phrase} lifecycle`,
    );
  }
  const privacyPage = readFileSync(
    resolve(ROOT, "app", "privacy", "page.tsx"),
    "utf8",
  );
  for (const phrase of [
    "Short-lived working material",
    "raw AI responses",
    "Only validated generated wording enters the saved story",
  ]) {
    assert(
      privacyPage.includes(phrase),
      `privacy guide omits ${phrase}`,
    );
  }
}

function checkStaticProviderCoverage(): void {
  const libSources = sourceFiles(LIB).map((path) => ({
    path,
    relative: path.slice(LIB.length + 1).replaceAll("\\", "/"),
    source: readFileSync(path, "utf8"),
  }));
  const scriptDirectory = resolve(ROOT, "scripts");
  const productionSources = productionSourceFiles().map((path) => ({
    path: relative(ROOT, path).replaceAll("\\", "/"),
    source: readFileSync(path, "utf8"),
  }));
  const codeSources = [
    ...productionSources,
    ...sourceFiles(scriptDirectory).map((path) => ({
      path: `scripts/${path.slice(scriptDirectory.length + 1).replaceAll("\\", "/")}`,
      source: readFileSync(path, "utf8"),
    })),
  ];
  auditNetworkEgress(productionSources);
  auditProductionImports(productionSources);
  auditOpaqueBoundaryCalls(codeSources);
  auditRetentionSinkCalls(codeSources);
  auditCuratedEmbeddingBoundary(codeSources);
  auditProviderCallSites(libSources);

  const providerExchangeImportOwners = new Set([
    "lib/llm-real.ts",
    "lib/embeddings-real.ts",
    "scripts/check-derived-output-retention.ts",
  ]);
  const providerExchangeImport =
    /(?:\bfrom\s+|\bimport\s*\(\s*)["'][^"']*provider-exchange["']/;
  const rawProviderImplementationImport =
    /(?:\bfrom\s+|\bimport\s*\(\s*)["'][^"']*(?:llm|embeddings)-(?:real|stub)["']/;
  const rawProviderImportOwners = new Set([
    "lib/llm.ts",
    "lib/embeddings.ts",
  ]);
  for (const file of codeSources) {
    if (providerExchangeImport.test(file.source)) {
      assert(
        providerExchangeImportOwners.has(file.path),
        `${file.path} imports the raw provider transport outside its reviewed owner`,
      );
    }
    if (rawProviderImplementationImport.test(file.source)) {
      assert(
        rawProviderImportOwners.has(file.path),
        `${file.path} imports a raw provider implementation instead of its classified boundary`,
      );
    }
  }

  const exchangeOwners: Readonly<
    Record<ExternalProviderExchangeId, string>
  > = {
    "cerebras.rerank": "llm-real.ts",
    "cerebras.opening_copy": "llm-real.ts",
    "cerebras.hybrid_plan": "llm-real.ts",
    "gemini.query_embedding": "embeddings-real.ts",
    "gemini.document_embedding": "embeddings-real.ts",
  };
  assert.deepEqual(
    Object.keys(exchangeOwners).sort(),
    Object.keys(EXTERNAL_PROVIDER_EXCHANGES).sort(),
  );
  for (const [exchangeId, owner] of Object.entries(exchangeOwners)) {
    const source = libSources.find((file) => file.relative === owner)?.source;
    assert(
      source &&
        source.includes("fetchExternalProvider(") &&
        countOccurrences(source, `"${exchangeId}"`) +
          countOccurrences(source, `'${exchangeId}'`) ===
          1,
      `${exchangeId} is registered but not called by ${owner}`,
    );
  }
  const providerTransport = libSources.find(
    (file) => file.relative === "provider-exchange.ts",
  )!.source;
  assert(
    providerTransport.includes("providerBaseUrl(exchange.provider)") &&
      providerTransport.includes("path.startsWith") &&
      providerTransport.includes('redirect: "error"'),
    "the transport must own the configured origin and reject unbound paths or redirects",
  );

  const classifierOwners: Readonly<Record<DerivedOutputKind, string>> = {
    rerank_response: "llm.ts",
    opening_copy_candidate: "llm.ts",
    composition_plan_candidate: "llm.ts",
    validated_composition_plan: "story-composer.ts",
    retrieval_query_embedding: "embeddings.ts",
  };
  assert.deepEqual(
    Object.keys(classifierOwners).sort(),
    Object.keys(DERIVED_OUTPUT_POLICIES).sort(),
  );
  for (const [kind, owner] of Object.entries(classifierOwners)) {
    const source = libSources.find((file) => file.relative === owner)?.source;
    assert(
      source &&
        new RegExp(
          `classifyDerivedOutput\\(\\s*["']${escapeRegExp(kind)}["']`,
        ).test(source),
      `${kind} must be classified by ${owner}`,
    );
  }

  const consumerOwners: Readonly<
    Record<DerivedOutputConsumer, readonly string[]>
  > = {
    match_reducer: ["lib/matching.ts"],
    story_validator: ["lib/story-generation.ts"],
    composition_plan_validator: ["lib/story-composer.ts"],
    story_artifact_builder: ["lib/story-composer.ts"],
    retrieval_scoring: ["lib/facets-retrieval.ts"],
    provider_health_check: [
      "scripts/check-provider.ts",
      "scripts/check-embeddings.ts",
      "scripts/check-resonance-brief.ts",
      "scripts/check-story-composer.ts",
      "scripts/check-derived-output-retention.ts",
    ],
  };
  assert.deepEqual(
    Object.keys(consumerOwners).sort(),
    [...DERIVED_OUTPUT_CONSUMERS].sort(),
  );
  const auditedSources = codeSources.filter(
    (file) =>
      file.path !== "lib/derived-output-retention.ts" &&
      file.path !== "scripts/check-derived-output-retention.ts",
  );
  for (const consumer of DERIVED_OUTPUT_CONSUMERS) {
    for (const file of auditedSources) {
      if (!file.source.includes(`"${consumer}"`)) continue;
      assert(
        consumerOwners[consumer].includes(file.path),
        `${consumer} is used by unapproved consumer module ${file.path}`,
      );
    }
  }
}

type AuditedSource = Readonly<{ path: string; source: string }>;

function auditNetworkEgress(sources: readonly AuditedSource[]): void {
  const expected: Readonly<
    Record<string, Readonly<{ calls: number; references: number }>>
  > = {
    "lib/provider-exchange.ts": { calls: 1, references: 0 },
    "lib/story-beat-network.ts": { calls: 0, references: 1 },
    "lib/story-visibility-client.ts": { calls: 1, references: 0 },
    "components/IntakeForm.tsx": { calls: 2, references: 0 },
    "components/ResonanceFeedbackCard.tsx": { calls: 3, references: 0 },
    "components/StoryAfterword.tsx": { calls: 1, references: 0 },
    "components/StoryBeat.tsx": { calls: 1, references: 0 },
  };
  const expectedDestinations: Readonly<Record<string, readonly string[]>> = {
    "lib/provider-exchange.ts": ["$provider_request_url"],
    "lib/story-visibility-client.ts": ["$visibility_path"],
    "components/IntakeForm.tsx": [
      "/api/match",
      "/api/telemetry/intake-started",
    ],
    "components/ResonanceFeedbackCard.tsx": [
      "/api/story-feedback",
      "/api/story-feedback/alternate",
      "/api/story-feedback/alternate/capability",
    ],
    "components/StoryAfterword.tsx": ["/api/historical-concern"],
    "components/StoryBeat.tsx": ["/api/beat"],
  };
  for (const file of sources) {
    let calls = 0;
    let references = 0;
    let forbiddenReferences = 0;
    const destinations: string[] = [];
    visitSource(file, (node) => {
      if (ts.isIdentifier(node) && node.text === "fetch") {
        if (
          ts.isCallExpression(node.parent) &&
          node.parent.expression === node
        ) {
          calls += 1;
          destinations.push(networkArgument(node.parent.arguments[0]));
        } else {
          references += 1;
        }
      }
      if (
        ts.isElementAccessExpression(node) &&
        (FORBIDDEN_NETWORK_IDENTIFIERS as readonly string[]).includes(
          stringLiteralValue(node.argumentExpression) ?? "",
        )
      ) {
        forbiddenReferences += 1;
      }
      if (
        ts.isIdentifier(node) &&
        (FORBIDDEN_NETWORK_IDENTIFIERS as readonly string[])
          .filter((name) => name !== "fetch")
          .includes(node.text)
      ) {
        forbiddenReferences += 1;
      }
    });
    assert.deepEqual(
      { calls, references },
      expected[file.path] ?? { calls: 0, references: 0 },
      `${file.path} has an unreviewed fetch call, alias, or property reference`,
    );
    assert.equal(
      forbiddenReferences,
      0,
      `${file.path} uses a computed or alternate browser network primitive`,
    );
    assert.deepEqual(
      destinations.sort(),
      [...(expectedDestinations[file.path] ?? [])].sort(),
      `${file.path} changed a reviewed same-origin/provider destination`,
    );
    assert(
      !/(?:\bfrom\s+|\bimport\s*\(\s*|\brequire\s*\(\s*)["'](?:@google\/generative-ai|@google\/genai|axios|cerebras[^"']*|cross-fetch|dgram|eventsource|got|groq-sdk|http2?|https|ky|net|node-fetch|node:dgram|node:http2?|node:https|node:net|node:tls|openai|superagent|tls|undici|ws)["']/.test(
        file.source,
      ),
      `${file.path} imports an unreviewed alternate network transport`,
    );
  }
  for (const owner of Object.keys(expected)) {
    assert(
      sources.some((file) => file.path === owner),
      `reviewed network owner ${owner} is missing`,
    );
  }

  const visibility = sources.find(
    (file) => file.path === "lib/story-visibility-client.ts",
  )!;
  assert.deepEqual(
    literalCallValues(visibility, "sendVisibility", 0).sort(),
    [
      "/api/telemetry/first-content",
      "/api/telemetry/passage-presented",
      "/api/telemetry/source-opened",
    ].sort(),
    "visibility fetch path must remain within its three reviewed routes",
  );
  assert.equal(
    identifierReferenceCount(visibility, "sendVisibility"),
    4,
    "the private visibility sender may only be declared and directly called by its three reviewed routes",
  );
  assert(
    visibility.source.includes("VISIBILITY_PATHS.has(path)"),
    "the visibility sender must enforce its same-origin allowlist at runtime",
  );
  const storyBeatNetwork = sources.find(
    (file) => file.path === "lib/story-beat-network.ts",
  )!;
  assert.deepEqual(
    literalCallValues(storyBeatNetwork, "fetcher", 0),
    ["/api/beat/ack"],
    "the injectable story-beat fetch must remain same-origin",
  );
  assert.equal(
    identifierReferenceCount(storyBeatNetwork, "fetcher"),
    2,
    "the injectable story-beat fetcher may only be declared and called at its fixed route",
  );

  const provider = sources.find(
    (file) => file.path === "lib/provider-exchange.ts",
  )!;
  let providerFetchVerified = false;
  visitSource(provider, (node) => {
    if (
      !isNamedCall(node, "fetch") ||
      enclosingFunctionName(node) !== "fetchExternalProvider"
    ) {
      return;
    }
    assert.equal(node.arguments.length, 2);
    assert.equal(node.arguments[0]?.getText(), "request.url");
    assert.equal(node.arguments[1]?.getText(), "request.init");
    providerFetchVerified = true;
  });
  assert(providerFetchVerified, "provider transport has no reviewed final fetch");
  const providerFile = ts.createSourceFile(
    provider.path,
    provider.source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const providerBoundary = providerFile.statements.find(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === "fetchExternalProvider",
  );
  assert(providerBoundary, "provider transport boundary function is missing");
  let requestReferences = 0;
  const countRequest = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && node.text === "request") {
      requestReferences += 1;
    }
    ts.forEachChild(node, countRequest);
  };
  countRequest(providerBoundary);
  assert.equal(
    requestReferences,
    3,
    "validated provider request may only be bound and passed unchanged to fetch",
  );
}

function auditProductionImports(sources: readonly AuditedSource[]): void {
  const forbiddenSegments = new Set([
    "__tests__",
    "evals",
    "scripts",
    "test",
    "tests",
  ]);
  for (const file of sources) {
    visitSource(file, (node) => {
      let specifier: string | null = null;
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        specifier = node.moduleSpecifier.text;
      } else if (
        ts.isCallExpression(node) &&
        node.arguments.length > 0 &&
        ((ts.isIdentifier(node.expression) &&
          node.expression.text === "require") ||
          node.expression.kind === ts.SyntaxKind.ImportKeyword)
      ) {
        specifier = stringLiteralValue(node.arguments[0]);
      }
      if (specifier === null) return;
      const segments = specifier
        .replaceAll("\\", "/")
        .split("/")
        .filter((segment) => segment !== "." && segment !== "..");
      assert(
        !segments.some((segment) => forbiddenSegments.has(segment)),
        `${file.path} imports excluded non-production code from ${specifier}`,
      );
    });
  }
}

function auditOpaqueBoundaryCalls(sources: readonly AuditedSource[]): void {
  const consumeExpected: Readonly<
    Record<
      string,
      Readonly<Partial<Record<DerivedOutputConsumer, number>>>
    >
  > = {
    "lib/facets-retrieval.ts": { retrieval_scoring: 1 },
    "lib/matching.ts": { match_reducer: 1 },
    "lib/story-composer.ts": {
      composition_plan_validator: 1,
      story_artifact_builder: 1,
    },
    "lib/story-generation.ts": { story_validator: 1 },
    "scripts/check-embeddings.ts": { provider_health_check: 1 },
    "scripts/check-provider.ts": { provider_health_check: 3 },
    "scripts/check-resonance-brief.ts": { provider_health_check: 2 },
    "scripts/check-story-composer.ts": { provider_health_check: 1 },
  };
  const classifyExpected: Readonly<
    Record<string, Readonly<Partial<Record<DerivedOutputKind, number>>>>
  > = {
    "lib/embeddings.ts": { retrieval_query_embedding: 1 },
    "lib/llm.ts": {
      rerank_response: 1,
      opening_copy_candidate: 1,
      composition_plan_candidate: 1,
    },
    "lib/story-composer.ts": { validated_composition_plan: 1 },
  };
  const consumeOwnerExpected: Readonly<Record<string, readonly string[]>> = {
    "lib/facets-retrieval.ts": ["retrieval_scoring@retrieveFacets"],
    "lib/matching.ts": ["match_reducer@matchWithExecution"],
    "lib/story-composer.ts": [
      "composition_plan_validator@composeStoryArtifact",
      "story_artifact_builder@composeStoryArtifact",
    ],
    "lib/story-generation.ts": ["story_validator@prepareStory"],
    "scripts/check-embeddings.ts": [
      "provider_health_check@probeEmbedder",
    ],
    "scripts/check-provider.ts": [
      "provider_health_check@checkHybridPlan",
      "provider_health_check@checkOpeningCopy",
      "provider_health_check@checkPickFigure",
    ],
    "scripts/check-resonance-brief.ts": [
      "provider_health_check@checkProviderBoundary",
      "provider_health_check@checkProviderBoundary",
    ],
    "scripts/check-story-composer.ts": [
      "provider_health_check@checkProviderProjection",
    ],
  };
  const classifyOwnerExpected: Readonly<Record<string, readonly string[]>> = {
    "lib/embeddings.ts": [
      "retrieval_query_embedding@embedQuery",
    ],
    "lib/llm.ts": [
      "composition_plan_candidate@requestHybridPlan",
      "opening_copy_candidate@writeOpeningCopy",
      "rerank_response@pickFigure",
    ],
    "lib/story-composer.ts": [
      "validated_composition_plan@composeStoryArtifact",
    ],
  };

  for (const file of sources) {
    if (
      file.path === "lib/derived-output-retention.ts" ||
      file.path === "scripts/check-derived-output-retention.ts"
    ) {
      continue;
    }
    const consumes = literalCallCounts(
      file,
      "consumeDerivedOutput",
      1,
      "consumer",
    );
    const classifications = literalCallCounts(
      file,
      "classifyDerivedOutput",
      0,
      "kind",
    );
    assert.deepEqual(
      consumes,
      consumeExpected[file.path] ?? {},
      `${file.path} has an unreviewed or non-literal derived-output consumer`,
    );
    assert.deepEqual(
      classifications,
      classifyExpected[file.path] ?? {},
      `${file.path} has an unreviewed or non-literal derived-output classifier`,
    );
    assert.deepEqual(
      boundaryCallOwners(file, "consumeDerivedOutput", 1).sort(),
      [...(consumeOwnerExpected[file.path] ?? [])].sort(),
      `${file.path} moved a privileged consume call outside its reviewed reducer/validator`,
    );
    assert.deepEqual(
      boundaryCallOwners(file, "classifyDerivedOutput", 0).sort(),
      [...(classifyOwnerExpected[file.path] ?? [])].sort(),
      `${file.path} moved a classifier outside its reviewed provider/validator boundary`,
    );
    const expectedConsumeCalls = Object.values(
      consumeExpected[file.path] ?? {},
    ).reduce((sum, count) => sum + (count ?? 0), 0);
    const expectedClassifyCalls = Object.values(
      classifyExpected[file.path] ?? {},
    ).reduce((sum, count) => sum + (count ?? 0), 0);
    assert.equal(
      identifierReferenceCount(file, "consumeDerivedOutput"),
      expectedConsumeCalls === 0 ? 0 : expectedConsumeCalls + 1,
      `${file.path} aliases, shadows, or otherwise references consumeDerivedOutput`,
    );
    assert.equal(
      identifierReferenceCount(file, "classifyDerivedOutput"),
      expectedClassifyCalls === 0 ? 0 : expectedClassifyCalls + 1,
      `${file.path} aliases, shadows, or otherwise references classifyDerivedOutput`,
    );
    if (expectedConsumeCalls > 0) {
      assert(
        hasExactNamedImport(
          file,
          "consumeDerivedOutput",
          derivedRetentionImportFor(file.path),
        ),
        `${file.path} must import consumeDerivedOutput without an alias`,
      );
    }
    if (expectedClassifyCalls > 0) {
      assert(
        hasExactNamedImport(
          file,
          "classifyDerivedOutput",
          derivedRetentionImportFor(file.path),
        ),
        `${file.path} must import classifyDerivedOutput without an alias`,
      );
    }
    assert.equal(
      identifierReferenceCount(file, "DERIVED_OUTPUT_CONSUMERS"),
      0,
      `${file.path} may not derive a consumer capability by tuple index`,
    );
  }
}

function auditProviderCallSites(
  libSources: readonly Readonly<{
    relative: string;
    source: string;
  }>[],
): void {
  const llm = libSources.find((file) => file.relative === "llm-real.ts");
  const embeddings = libSources.find(
    (file) => file.relative === "embeddings-real.ts",
  );
  assert(llm && embeddings, "raw provider owners are missing");
  assert(
    hasExactNamedImport(
      { path: "lib/llm-real.ts", source: llm.source },
      "fetchExternalProvider",
      "./provider-exchange",
    ) &&
      hasExactNamedImport(
        {
          path: "lib/embeddings-real.ts",
          source: embeddings.source,
        },
        "fetchExternalProvider",
        "./provider-exchange",
      ),
    "provider owners must import the exact reviewed transport module",
  );
  assert.equal(
    identifierReferenceCount(
      { path: "lib/llm-real.ts", source: llm.source },
      "fetchExternalProvider",
    ),
    4,
    "llm-real may only import and directly call its three fixed exchanges",
  );
  assert.equal(
    identifierReferenceCount(
      { path: "lib/embeddings-real.ts", source: embeddings.source },
      "fetchExternalProvider",
    ),
    2,
    "embeddings-real may only import and directly call its one transport helper",
  );
  const builderOwners: Readonly<Record<string, string>> = {
    buildCerebrasRerankRequestBody: "llm-real.ts",
    buildCerebrasOpeningCopyRequestBody: "llm-real.ts",
    buildCerebrasHybridPlanRequestBody: "llm-real.ts",
    buildGeminiQueryEmbeddingRequestBody: "embeddings-real.ts",
    buildGeminiDocumentEmbeddingRequestBody: "embeddings-real.ts",
  };
  for (const [builder, owner] of Object.entries(builderOwners)) {
    for (const file of libSources) {
      const expectedReferences =
        file.relative === "provider-exchange.ts"
          ? 1
          : file.relative === owner
            ? 2
            : 0;
      assert.equal(
        identifierReferenceCount(
          { path: `lib/${file.relative}`, source: file.source },
          builder,
        ),
        expectedReferences,
        `${file.relative} references ${builder} outside its reviewed exchange owner`,
      );
    }
    const ownerSource = libSources.find(
      (file) => file.relative === owner,
    );
    assert(ownerSource, `${owner} is missing`);
    assert(
      hasExactNamedImport(
        { path: `lib/${owner}`, source: ownerSource.source },
        builder,
        "./provider-exchange",
      ),
      `${owner} must import ${builder} from the exact provider boundary`,
    );
  }
  assert.equal(
    identifierReferenceCount(
      { path: "lib/embeddings-real.ts", source: embeddings.source },
      "postJson",
    ),
    3,
    "embeddings-real may only declare postJson and call its two fixed exchanges",
  );
  assert.equal(
    identifierReferenceCount(
      { path: "lib/embeddings-real.ts", source: embeddings.source },
      "postJsonOnce",
    ),
    2,
    "embeddings-real may only declare and directly call its retry transport",
  );

  const llmExpected = {
    pickFigureReal: "cerebras.rerank",
    generateEyebrowLine: "cerebras.opening_copy",
    requestHybridPlanReal: "cerebras.hybrid_plan",
  } as const;
  const llmObserved: Record<
    string,
    Readonly<{ exchange: string; path: string }>
  > = {};
  visitSource(
    { path: "lib/llm-real.ts", source: llm.source },
    (node) => {
      if (!isNamedCall(node, "fetchExternalProvider")) return;
      const owner = enclosingFunctionName(node);
      const exchange = stringLiteralValue(node.arguments[0]);
      const path = stringLiteralValue(node.arguments[1]);
      assert(
        owner && exchange && path,
        "Cerebras exchange must have a fixed owner, ID, and path",
      );
      assert(!(owner in llmObserved), `${owner} has multiple provider egresses`);
      llmObserved[owner] = { exchange, path };
    },
  );
  assert.deepEqual(
    llmObserved,
    Object.fromEntries(
      Object.entries(llmExpected).map(([owner, exchange]) => [
        owner,
        { exchange, path: "/chat/completions" },
      ]),
    ),
    "Cerebras exchanges may not swap policy labels or call owners",
  );

  const embeddingFetches: Array<Readonly<{ owner: string; argument: string }>> =
    [];
  const embeddingRequests: Record<
    string,
    Readonly<{ exchange: string; path: string }>
  > = {};
  visitSource(
    { path: "lib/embeddings-real.ts", source: embeddings.source },
    (node) => {
      if (isNamedCall(node, "fetchExternalProvider")) {
        embeddingFetches.push({
          owner: enclosingFunctionName(node) ?? "",
          argument: ts.isIdentifier(node.arguments[0])
            ? node.arguments[0].text
            : "",
        });
      }
      if (!isNamedCall(node, "postJson")) return;
      const owner = enclosingFunctionName(node);
      const exchange = stringLiteralValue(node.arguments[0]);
      assert(owner && exchange, "Gemini exchange must have a fixed owner and ID");
      assert(!(owner in embeddingRequests), `${owner} has multiple request labels`);
      embeddingRequests[owner] = {
        exchange,
        path: node.arguments[1]?.getText() ?? "",
      };
    },
  );
  assert.deepEqual(embeddingFetches, [
    { owner: "postJsonOnce", argument: "exchangeId" },
  ]);
  assert.deepEqual(embeddingRequests, {
    embedQueryReal: {
      exchange: "gemini.query_embedding",
      path: "`models/${modelName()}:embedContent`",
    },
    embedDocumentsReal: {
      exchange: "gemini.document_embedding",
      path: "`models/${modelName()}:batchEmbedContents`",
    },
  });
}

function auditRetentionSinkCalls(sources: readonly AuditedSource[]): void {
  const expected: Readonly<Record<string, Readonly<Record<string, number>>>> = {
    "lib/alternate-story-store-supabase.ts": {
      "story.artifact->owned_story_store": 1,
    },
    "lib/historical-concerns.ts": {
      "editorial.historical_concern->shared_editorial_store": 1,
    },
    "lib/resonance-feedback.ts": {
      "feedback.closed_response->bounded_feedback_store": 1,
    },
    "lib/session-store-memory.ts": {
      "input.age->owned_story_store": 1,
      "input.raw_disclosure->root_session": 1,
      "input.story_request_context->root_session": 1,
      "match.selection->owned_story_store": 1,
      "story.artifact->owned_story_store": 1,
      "story.opening_copy->owned_story_store": 1,
    },
    "lib/session-store-supabase.ts": {
      "input.age->owned_story_store": 1,
      "input.raw_disclosure->root_session": 1,
      "input.story_request_context->root_session": 1,
      "match.selection->owned_story_store": 1,
      "story.artifact->owned_story_store": 1,
      "story.opening_copy->owned_story_store": 1,
    },
    "lib/story-artifact-store-memory.ts": {
      "story.artifact->owned_story_store": 1,
    },
    "lib/telemetry.ts": {
      "telemetry.generation_attempt->bounded_operational_store": 1,
      "telemetry.product_event->bounded_operational_store": 2,
      "telemetry.product_event->request_memory": 1,
    },
    "scripts/seed-embeddings.ts": {
      "embedding.curated_vector->curated_reference_store": 1,
    },
  };

  for (const file of sources) {
    if (
      file.path === "lib/derived-output-retention.ts" ||
      file.path === "lib/provider-exchange.ts" ||
      file.path === "scripts/check-derived-output-retention.ts"
    ) {
      continue;
    }
    const observed: Record<string, number> = {};
    let calls = 0;
    visitSource(file, (node) => {
      if (!isNamedCall(node, "assertRetentionSink")) return;
      calls += 1;
      const surface = stringLiteralValue(node.arguments[0]);
      const sink = stringLiteralValue(node.arguments[1]);
      assert(
        surface && sink,
        `${file.path} must use literal surface and sink capabilities`,
      );
      const key = `${surface}->${sink}`;
      observed[key] = (observed[key] ?? 0) + 1;
    });
    assert.deepEqual(
      observed,
      expected[file.path] ?? {},
      `${file.path} changed a reviewed persistence/request sink assertion`,
    );
    assert.equal(
      identifierReferenceCount(file, "assertRetentionSink"),
      calls === 0 ? 0 : calls + 1,
      `${file.path} aliases, shadows, or otherwise references assertRetentionSink`,
    );
    if (calls > 0) {
      assert(
        hasExactNamedImport(
          file,
          "assertRetentionSink",
          derivedRetentionImportFor(file.path),
        ),
        `${file.path} must import assertRetentionSink without an alias`,
      );
    }
  }
  for (const owner of Object.keys(expected)) {
    assert(
      sources.some((file) => file.path === owner),
      `reviewed retention-sink owner ${owner} is missing`,
    );
  }

  const provider = sources.find(
    (file) => file.path === "lib/provider-exchange.ts",
  );
  assert(provider, "the external-provider sink owner is missing");
  assert.equal(
    identifierReferenceCount(provider, "assertRetentionSink"),
    3,
    "provider-exchange may only import and call its request/response sink checks",
  );
  assert(
    hasExactNamedImport(
      provider,
      "assertRetentionSink",
      "./derived-output-retention",
    ),
    "provider-exchange must import assertRetentionSink without an alias",
  );
}

function auditCuratedEmbeddingBoundary(
  sources: readonly AuditedSource[],
): void {
  for (const file of sources) {
    const references = identifierReferenceCount(file, "embedDocuments");
    const expected =
      file.path === "lib/embeddings.ts"
        ? 1
        : file.path === "scripts/seed-embeddings.ts"
          ? 2
          : 0;
    assert.equal(
      references,
      expected,
      `${file.path} references the curated-document embedder outside its reviewed seeder`,
    );
    const queryReferences = identifierReferenceCount(file, "embedQuery");
    const expectedQuery =
      file.path === "lib/embeddings.ts"
        ? 1
        : file.path === "lib/facets-retrieval.ts" ||
            file.path === "scripts/check-embeddings.ts"
          ? 2
          : 0;
    assert.equal(
      queryReferences,
      expectedQuery,
      `${file.path} references query embedding outside retrieval or its synthetic health probe`,
    );
  }
  const seeder = sources.find(
    (file) => file.path === "scripts/seed-embeddings.ts",
  );
  assert(seeder, "the reviewed curated-document seeder is missing");
  assert(
    hasExactNamedImport(
      seeder,
      "embedDocuments",
      "../lib/embeddings",
    ),
    "the seeder must import the exact classified embedding boundary",
  );
  assert.deepEqual(
    boundaryCallOwners(seeder, "embedDocuments", -1),
    ["$no-capability@main"],
    "only the seed command may invoke document embedding",
  );
  for (const [path, owner] of [
    ["lib/facets-retrieval.ts", "retrieveFacets"],
    ["scripts/check-embeddings.ts", "probeEmbedder"],
  ] as const) {
    const source = sources.find((file) => file.path === path);
    assert(source, `${path} is missing`);
    assert(
      hasExactNamedImport(
        source,
        "embedQuery",
        path.startsWith("lib/")
          ? "./embeddings"
          : "../lib/embeddings",
      ),
      `${path} must import the exact classified query embedder`,
    );
    assert.deepEqual(
      boundaryCallOwners(source, "embedQuery", -1),
      [`$no-capability@${owner}`],
      `${path} moved query embedding outside its reviewed owner`,
    );
  }

  const boundary = sources.find(
    (file) => file.path === "lib/embeddings.ts",
  );
  const implementation = sources.find(
    (file) => file.path === "lib/embeddings-real.ts",
  );
  assert(boundary && implementation, "embedding boundaries are missing");
  assert.equal(
    identifierReferenceCount(boundary, "embedDocumentsReal"),
    2,
    "the classified embedding boundary may only import and call document embedding",
  );
  assert(
    hasExactNamedImport(
      boundary,
      "embedDocumentsReal",
      "./embeddings-real",
    ),
    "the classified boundary must import the exact raw document embedder",
  );
  assert.equal(
    identifierReferenceCount(implementation, "embedDocumentsReal"),
    1,
    "the raw document embedder may only expose its reviewed implementation",
  );
  assert.equal(
    identifierReferenceCount(boundary, "embedQueryReal"),
    2,
    "the classified embedding boundary may only import and call query embedding",
  );
  assert(
    hasExactNamedImport(
      boundary,
      "embedQueryReal",
      "./embeddings-real",
    ),
    "the classified boundary must import the exact raw query embedder",
  );
  assert.equal(
    identifierReferenceCount(implementation, "embedQueryReal"),
    1,
    "the raw query embedder may only expose its reviewed implementation",
  );
}

function literalCallCounts(
  file: AuditedSource,
  functionName: string,
  argumentIndex: number,
  label: string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  visitSource(file, (node) => {
    if (!isNamedCall(node, functionName)) return;
    assert(
      ts.isIdentifier(node.expression),
      `${file.path} must call ${functionName} directly`,
    );
    const value = stringLiteralValue(node.arguments[argumentIndex]);
    assert(value, `${file.path} has a non-literal ${label}`);
    counts[value] = (counts[value] ?? 0) + 1;
  });
  return counts;
}

function boundaryCallOwners(
  file: AuditedSource,
  functionName: string,
  argumentIndex: number,
): string[] {
  const owners: string[] = [];
  visitSource(file, (node) => {
    if (!isNamedCall(node, functionName)) return;
    const capability =
      argumentIndex < 0
        ? "$no-capability"
        : stringLiteralValue(node.arguments[argumentIndex]) ??
          "$nonliteral";
    owners.push(
      `${capability}@${enclosingFunctionName(node) ?? "$module"}`,
    );
  });
  return owners;
}

function literalCallValues(
  file: AuditedSource,
  functionName: string,
  argumentIndex: number,
): string[] {
  const values: string[] = [];
  visitSource(file, (node) => {
    if (!isNamedCall(node, functionName)) return;
    values.push(
      stringLiteralValue(node.arguments[argumentIndex]) ?? "$nonliteral",
    );
  });
  return values;
}

function networkArgument(node: ts.Expression | undefined): string {
  const literal = stringLiteralValue(node);
  if (literal !== null) return literal;
  if (
    node &&
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "request" &&
    node.name.text === "url"
  ) {
    return "$provider_request_url";
  }
  if (node && ts.isIdentifier(node) && node.text === "path") {
    return "$visibility_path";
  }
  return "$unreviewed";
}

function identifierReferenceCount(
  file: AuditedSource,
  identifier: string,
): number {
  let count = 0;
  visitSource(file, (node) => {
    if (ts.isIdentifier(node) && node.text === identifier) count += 1;
  });
  return count;
}

function hasExactNamedImport(
  file: AuditedSource,
  importedName: string,
  moduleSpecifier: string,
): boolean {
  let found = false;
  visitSource(file, (node) => {
    if (
      !ts.isImportDeclaration(node) ||
      !ts.isStringLiteral(node.moduleSpecifier) ||
      node.moduleSpecifier.text !== moduleSpecifier ||
      !node.importClause?.namedBindings ||
      !ts.isNamedImports(node.importClause.namedBindings)
    ) {
      return;
    }
    found ||= node.importClause.namedBindings.elements.some(
      (element) =>
        element.propertyName === undefined &&
        element.name.text === importedName,
    );
  });
  return found;
}

function derivedRetentionImportFor(path: string): string {
  if (path.startsWith("lib/")) return "./derived-output-retention";
  if (path.startsWith("scripts/")) {
    return "../lib/derived-output-retention";
  }
  throw new Error(`${path} has no reviewed retention-boundary import path`);
}

function isNamedCall(
  node: ts.Node,
  functionName: string,
): node is ts.CallExpression {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === functionName
  );
}

function stringLiteralValue(node: ts.Expression | undefined): string | null {
  return node && ts.isStringLiteral(node) ? node.text : null;
}

function enclosingFunctionName(node: ts.Node): string | null {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isFunctionDeclaration(current) && current.name) {
      return current.name.text;
    }
  }
  return null;
}

function visitSource(
  file: AuditedSource,
  visitor: (node: ts.Node) => void,
): void {
  const sourceFile = ts.createSourceFile(
    file.path,
    file.source,
    ts.ScriptTarget.Latest,
    true,
    file.path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const visit = (node: ts.Node): void => {
    visitor(node);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

async function checkProviderTransportBoundary(): Promise<void> {
  const originalFetch = globalThis.fetch;
  const previousLlmBaseUrl = process.env.LLM_BASE_URL;
  const previousEmbeddingBaseUrl = process.env.EMBEDDING_BASE_URL;
  let capturedUrl = "";
  let capturedRedirect: RequestRedirect | undefined;
  try {
    process.env.LLM_BASE_URL = "https://provider.invalid/v1";
    process.env.EMBEDDING_BASE_URL = "https://provider.invalid/v1";
    globalThis.fetch = async (input, init) => {
      capturedUrl = String(input);
      capturedRedirect = init?.redirect;
      return new Response("{}", { status: 200 });
    };
    const response = await fetchExternalProvider(
      "cerebras.rerank",
      "/chat/completions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer contract-test",
        },
        body: validRerankRequestBody(PRIVATE_CANARY),
      },
    );
    assert.equal(response.status, 200);
    assert.equal(
      capturedUrl,
      "https://provider.invalid/v1/chat/completions",
    );
    assert.equal(capturedRedirect, "error");
    const validRequests: ReadonlyArray<
      Readonly<{
        exchange: ExternalProviderExchangeId;
        path: string;
        headers: Record<string, string>;
        body: ExternalProviderRequestBody;
      }>
    > = [
      {
        exchange: "cerebras.opening_copy" as const,
        path: "/chat/completions",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer contract-test",
        },
        body: buildCerebrasOpeningCopyRequestBody({
          model: "contract-test",
          temperature: 0,
          systemPrompt: "contract system prompt",
          userPrompt: PRIVATE_CANARY,
        }),
      },
      {
        exchange: "cerebras.hybrid_plan" as const,
        path: "/chat/completions",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer contract-test",
        },
        body: buildCerebrasHybridPlanRequestBody({
          model: "contract-test",
          temperature: 0,
          systemPrompt: "contract system prompt",
          userPrompt: PRIVATE_CANARY,
          responseFormat: "json_object",
        }),
      },
      {
        exchange: "gemini.query_embedding" as const,
        path: "/models/test:embedContent",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": "contract-test",
        },
        body: validQueryEmbeddingRequestBody(PRIVATE_CANARY),
      },
      {
        exchange: "gemini.document_embedding" as const,
        path: "/models/test:batchEmbedContents",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": "contract-test",
        },
        body: validDocumentEmbeddingRequestBody(PRIVATE_CANARY),
      },
    ];
    for (const request of validRequests) {
      const validResponse = await fetchExternalProvider(
        request.exchange,
        request.path,
        {
          method: "POST",
          headers: request.headers,
          body: request.body,
        },
      );
      assert.equal(validResponse.status, 200);
    }

    globalThis.fetch = async () => {
      throw new Error(PRIVATE_CANARY, {
        cause: { body: PRIVATE_CANARY },
      });
    };
    await assert.rejects(
      () =>
        fetchExternalProvider(
          "gemini.query_embedding",
          "/models/test:embedContent",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-goog-api-key": "contract-test",
            },
            body: validQueryEmbeddingRequestBody(PRIVATE_CANARY),
          },
        ),
      (error: unknown) => {
        assert(error instanceof ExternalProviderTransportError);
        assert.equal(error.exchangeId, "gemini.query_embedding");
        assert(!error.message.includes(PRIVATE_CANARY));
        assert(!error.stack?.includes(PRIVATE_CANARY));
        assert(!("cause" in error));
        return true;
      },
    );

    await assert.rejects(
      () =>
        fetchExternalProvider(
          "cerebras.rerank",
          "/models/test:embedContent",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: "Bearer contract-test",
            },
            body: validRerankRequestBody(PRIVATE_CANARY),
          },
        ),
      (error: unknown) =>
        error instanceof ExternalProviderBoundaryError &&
        error.errorClass === "endpoint" &&
        !error.message.includes(PRIVATE_CANARY),
    );
    await assert.rejects(
      () =>
        fetchExternalProvider(
          "cerebras.rerank",
          "/chat/completions",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: "Bearer contract-test",
            },
            body: buildCerebrasOpeningCopyRequestBody({
              model: "contract-test",
              temperature: 0,
              systemPrompt: "contract system prompt",
              userPrompt: PRIVATE_CANARY,
            }),
          },
        ),
      (error: unknown) =>
        error instanceof ExternalProviderBoundaryError &&
        error.errorClass === "body" &&
        !error.message.includes(PRIVATE_CANARY),
    );
    await assert.rejects(
      () =>
        fetchExternalProvider(
          "cerebras.opening_copy",
          "/chat/completions",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: "Bearer contract-test",
            },
            body: PRIVATE_CANARY as unknown as ExternalProviderRequestBody,
          },
        ),
      (error: unknown) =>
        error instanceof ExternalProviderBoundaryError &&
        error.errorClass === "body" &&
        !error.message.includes(PRIVATE_CANARY),
    );
    await assert.rejects(
      () =>
        fetchExternalProvider(
          "cerebras.rerank",
          "/chat/completions",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: "Bearer contract-test",
            },
            body: buildCerebrasRerankRequestBody({
              model: "",
              temperature: 0,
              systemPrompt: "contract system prompt",
              userPrompt: PRIVATE_CANARY,
              responseFormat: "json_object",
            }),
          },
        ),
      (error: unknown) =>
        error instanceof ExternalProviderBoundaryError &&
        error.errorClass === "schema" &&
        !error.message.includes(PRIVATE_CANARY),
    );
    await assert.rejects(() =>
      fetchExternalProvider(
        "not.registered" as ExternalProviderExchangeId,
        "/unknown",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: Object.freeze({}) as ExternalProviderRequestBody,
        },
      ),
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv("LLM_BASE_URL", previousLlmBaseUrl);
    restoreEnv("EMBEDDING_BASE_URL", previousEmbeddingBaseUrl);
  }
}

function validRerankRequestBody(
  content: string,
): ExternalProviderRequestBody {
  return buildCerebrasRerankRequestBody({
    model: "contract-test",
    temperature: 0,
    systemPrompt: "contract system prompt",
    userPrompt: content,
    responseFormat: "json_object",
  });
}

function validDocumentEmbeddingRequestBody(
  text: string,
): ExternalProviderRequestBody {
  return buildGeminiDocumentEmbeddingRequestBody({
    model: "test",
    texts: [text],
    outputDimensionality: 3,
  });
}

function validQueryEmbeddingRequestBody(
  text: string,
): ExternalProviderRequestBody {
  return buildGeminiQueryEmbeddingRequestBody({
    model: "test",
    text,
    outputDimensionality: 3,
  });
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function sourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(directory)) {
    const path = resolve(directory, name);
    if (statSync(path).isDirectory()) {
      files.push(...sourceFiles(path));
    } else if (/\.(?:cjs|js|jsx|mjs|ts|tsx)$/.test(path)) {
      files.push(path);
    }
  }
  return files;
}

function productionSourceFiles(): string[] {
  const excludedDirectories = new Set([
    ".agents",
    ".antigravitycli",
    ".claude",
    ".git",
    ".github",
    "docs",
    "evals",
    "node_modules",
    "prompts",
    "roadmap",
    "scripts",
    "test",
    "tests",
    "__tests__",
  ]);
  const files: string[] = [];
  const walk = (directory: string): void => {
    for (const name of readdirSync(directory)) {
      const path = resolve(directory, name);
      if (statSync(path).isDirectory()) {
        if (
          excludedDirectories.has(name) ||
          name === ".next" ||
          name.startsWith(".next-")
        ) {
          continue;
        }
        walk(path);
      } else if (/\.(?:cjs|js|jsx|mjs|ts|tsx)$/.test(path)) {
        files.push(path);
      }
    }
  };
  walk(ROOT);
  return files;
}

function deepFrozen(value: unknown): boolean {
  if (value === null || typeof value !== "object") return true;
  return (
    Object.isFrozen(value) &&
    Object.values(value).every((child) => deepFrozen(child))
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countOccurrences(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

main().catch((error: unknown) => {
  console.error("Derived-output retention contract failed.");
  console.error(error instanceof Error ? error.message : "unknown failure");
  process.exit(1);
});
