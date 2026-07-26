import "./_smoke-bootstrap";
import assert from "node:assert/strict";
import {
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DERIVED_OUTPUT_CONSUMERS,
  DERIVED_OUTPUT_POLICIES,
  DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
  DERIVED_OUTPUT_SURFACES,
  EXTERNAL_PROVIDER_EXCHANGES,
  LEGACY_DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
  PERSISTENCE_RETENTION_REGISTRY,
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
  ExternalProviderTransportError,
  fetchExternalProvider,
} from "../lib/provider-exchange";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LIB = resolve(ROOT, "lib");
const MIGRATIONS = resolve(ROOT, "supabase", "migrations");
const PRIVATE_CANARY =
  "never-retain-provider-output-cobalt-magnolia-2026";

async function main(): Promise<void> {
  checkClosedRegistry();
  checkOpaqueOutputs();
  checkPersistenceCoverage();
  checkRelationalEnvelope();
  checkStaticProviderCoverage();
  await checkProviderTransportBoundary();

  console.log("Onward derived-output retention contract");
  console.log("========================================");
  console.log(
    `PASS ${RETENTION_CLASSES.length} closed classes and ${Object.keys(DERIVED_OUTPUT_SURFACES).length} classified surfaces`,
  );
  console.log(
    `PASS ${Object.keys(EXTERNAL_PROVIDER_EXCHANGES).length} provider exchanges require registered request/output policies`,
  );
  console.log(
    `PASS ${Object.keys(PERSISTENCE_RETENTION_REGISTRY).length} application-owned tables are exhaustively classified`,
  );
  console.log("PASS current and legacy durable labels are relational and immutable");
  console.log(
    `PASS ${Object.keys(DERIVED_OUTPUT_POLICIES).length} opaque output kinds reject forged tokens and forbidden consumers`,
  );
  console.log("PASS raw provider transport errors are reduced without a cause");
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
  assert(deepFrozen(RETENTION_CLASS_POLICIES));
  assert(deepFrozen(DERIVED_OUTPUT_SURFACES));
  assert(deepFrozen(EXTERNAL_PROVIDER_EXCHANGES));
  assert(deepFrozen(PERSISTENCE_RETENTION_REGISTRY));
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
    assert.doesNotThrow(() =>
      assertRetentionSink(exchange.requestSurface, "external_provider"),
    );
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

  const opening = classifyDerivedOutput("opening_copy", {
    eyebrow: "A story for the difficult middle",
    prefaceLines: ["The lives are different."],
  });
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
    classifyDerivedOutput("opening_copy", {
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
  for (const name of readdirSync(MIGRATIONS).filter((entry) =>
    entry.endsWith(".sql"),
  )) {
    const sql = readFileSync(resolve(MIGRATIONS, name), "utf8");
    for (const match of sql.matchAll(
      /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:(public)\.)?([a-z_][a-z0-9_]*)/gi,
    )) {
      migrationTables.add(`public.${match[2].toLowerCase()}`);
    }
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
}

function checkRelationalEnvelope(): void {
  const migrationPath = resolve(
    MIGRATIONS,
    "0021_derived_output_retention.sql",
  );
  const migration = readFileSync(migrationPath, "utf8").toLowerCase();
  const requiredSql = [
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
  ];
  for (const fragment of requiredSql) {
    assert(
      migration.includes(fragment),
      `migration 0021 is missing ${fragment}`,
    );
  }
  const legacyDefault = migration.indexOf(
    "default 'legacy-pre-derived-output-retention-v0'",
  );
  const currentDefault = migration.indexOf(
    "set default 'derived-output-retention-v1-2026-07'",
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

function checkStaticProviderCoverage(): void {
  const libSources = sourceFiles(LIB).map((path) => ({
    path,
    relative: path.slice(LIB.length + 1).replaceAll("\\", "/"),
    source: readFileSync(path, "utf8"),
  }));

  const directFetchAllowlist = new Set([
    "provider-exchange.ts",
    "story-visibility-client.ts",
  ]);
  for (const file of libSources) {
    if (/\bfetch\s*\(/.test(file.source)) {
      assert(
        directFetchAllowlist.has(file.relative),
        `${file.relative} bypasses the classified provider/first-party fetch boundaries`,
      );
    }
  }
  assert(
    /\bfetch\s*\(/.test(
      libSources.find((file) => file.relative === "provider-exchange.ts")!
        .source,
    ),
  );

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
        new RegExp(`["']${escapeRegExp(exchangeId)}["']`).test(source),
      `${exchangeId} is registered but not called by ${owner}`,
    );
  }

  const classifierOwners: Readonly<Record<DerivedOutputKind, string>> = {
    rerank_response: "llm.ts",
    opening_copy: "llm.ts",
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
      "scripts/check-derived-output-retention.ts",
    ],
  };
  assert.deepEqual(
    Object.keys(consumerOwners).sort(),
    [...DERIVED_OUTPUT_CONSUMERS].sort(),
  );
  const auditedSources = [
    ...libSources.map((file) => ({
      path: `lib/${file.relative}`,
      source: file.source,
    })),
    ...sourceFiles(resolve(ROOT, "scripts")).map((path) => ({
      path: `scripts/${path.slice(resolve(ROOT, "scripts").length + 1).replaceAll("\\", "/")}`,
      source: readFileSync(path, "utf8"),
    })),
  ].filter(
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

async function checkProviderTransportBoundary(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  try {
    globalThis.fetch = async (input) => {
      capturedUrl = String(input);
      return new Response("{}", { status: 200 });
    };
    const response = await fetchExternalProvider(
      "cerebras.rerank",
      "https://provider.invalid/test",
      { method: "POST", body: PRIVATE_CANARY },
    );
    assert.equal(response.status, 200);
    assert.equal(capturedUrl, "https://provider.invalid/test");

    globalThis.fetch = async () => {
      throw new Error(PRIVATE_CANARY, {
        cause: { body: PRIVATE_CANARY },
      });
    };
    await assert.rejects(
      () =>
        fetchExternalProvider(
          "gemini.query_embedding",
          "https://provider.invalid/fail",
          { method: "POST", body: PRIVATE_CANARY },
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

    await assert.rejects(() =>
      fetchExternalProvider(
        "not.registered" as ExternalProviderExchangeId,
        "https://provider.invalid/unknown",
        { method: "POST" },
      ),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function sourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(directory)) {
    const path = resolve(directory, name);
    if (statSync(path).isDirectory()) {
      files.push(...sourceFiles(path));
    } else if (path.endsWith(".ts") || path.endsWith(".tsx")) {
      files.push(path);
    }
  }
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
