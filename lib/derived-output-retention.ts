import "server-only";
import {
  HYBRID_BRIDGE_TEMPLATE_IDS,
  HYBRID_PLAN_SCHEMA_VERSION,
  HYBRID_TRANSITION_TEMPLATE_IDS,
  type HybridCompositionPlan,
} from "./hybrid-composition";
import type { OpeningCopy, Pick } from "./types";

export const DERIVED_OUTPUT_RETENTION_POLICY_VERSION =
  "derived-output-retention-v1-2026-07" as const;
export const LEGACY_DERIVED_OUTPUT_RETENTION_POLICY_VERSION =
  "legacy-pre-derived-output-retention-v0" as const;

export const RETENTION_CLASSES = [
  "request_ephemeral",
  "recovery_context",
  "owned_story",
  "bounded_feedback",
  "bounded_operational",
  "shared_editorial",
  "curated_reference",
] as const;
export type RetentionClass = (typeof RETENTION_CLASSES)[number];

export const RETENTION_SINKS = [
  "request_memory",
  "external_provider",
  "root_session",
  "owned_story_store",
  "bounded_feedback_store",
  "bounded_operational_store",
  "shared_editorial_store",
  "curated_reference_store",
  "owner_response",
] as const;
export type RetentionSink = (typeof RETENTION_SINKS)[number];

type RetentionClassPolicy = Readonly<{
  expiryHorizon:
    | "request_end"
    | "owner_lifecycle"
    | "60_day_eligibility"
    | "90_day_eligibility"
    | "30_day_eligibility"
    | "editorial_policy"
    | "catalog_history";
  ownerDeletion:
    | "required"
    | "when_owner_linked"
    | "de_linked"
    | "not_applicable";
  contentRule: string;
}>;

export const RETENTION_CLASS_POLICIES = deepFreeze({
  request_ephemeral: {
    expiryHorizon: "request_end",
    ownerDeletion: "not_applicable",
    contentRule:
      "Working Material may be reduced or validated in memory but never persisted, cached, logged, or returned.",
  },
  recovery_context: {
    expiryHorizon: "60_day_eligibility",
    ownerDeletion: "required",
    contentRule:
      "Disclosure, story limits, clarification, and context-bound capabilities stay root-only, become cleanup-eligible at the original 60-day deadline, and are physically cleared by the next daily cleanup.",
  },
  owned_story: {
    expiryHorizon: "owner_lifecycle",
    ownerDeletion: "required",
    contentRule:
      "Only validated owner-visible story content; story, owner, and alternate identity; age; provenance; reading and activity state; and the exact lifecycle control metadata and timestamps named in the field registry may use this class.",
  },
  bounded_feedback: {
    expiryHorizon: "90_day_eligibility",
    ownerDeletion: "required",
    contentRule:
      "Only the closed feedback verdict and one approved reason may be retained; free text is not part of this class, and eligible rows are physically cleared by scheduled cleanup.",
  },
  bounded_operational: {
    expiryHorizon: "30_day_eligibility",
    ownerDeletion: "when_owner_linked",
    contentRule:
      "Only exact identifiers, enums, counts, and time buckets may be retained; no disclosure, prose, provider body, vector, or free-form error, and each table's eligible rows are physically cleared by scheduled cleanup.",
  },
  shared_editorial: {
    expiryHorizon: "editorial_policy",
    ownerDeletion: "de_linked",
    contentRule:
      "Only curated content identifiers and closed editorial states may remain after the report is irreversibly de-linked from its reader and story.",
  },
  curated_reference: {
    expiryHorizon: "catalog_history",
    ownerDeletion: "not_applicable",
    contentRule:
      "Only editorial, evidence, release, and catalog-derived material that is not derived from a reader may use this class.",
  },
} as const satisfies Record<RetentionClass, RetentionClassPolicy>);

type RetentionSurfaceDefinition = Readonly<{
  retentionClass: RetentionClass;
  allowedSinks: readonly RetentionSink[];
}>;

export const DERIVED_OUTPUT_SURFACES = deepFreeze({
  "input.raw_disclosure": {
    retentionClass: "recovery_context",
    allowedSinks: ["request_memory", "external_provider", "root_session"],
  },
  "input.age": {
    retentionClass: "owned_story",
    allowedSinks: [
      "request_memory",
      "external_provider",
      "owned_story_store",
    ],
  },
  "input.story_request_context": {
    retentionClass: "recovery_context",
    allowedSinks: ["request_memory", "root_session"],
  },
  "analysis.resonance_brief": {
    retentionClass: "request_ephemeral",
    allowedSinks: ["request_memory", "external_provider"],
  },
  "analysis.hybrid_retry_feedback": {
    retentionClass: "request_ephemeral",
    allowedSinks: ["request_memory", "external_provider"],
  },
  "provider.rerank_response": {
    retentionClass: "request_ephemeral",
    allowedSinks: ["request_memory"],
  },
  // The facet-tagger reply is a FacetSignal derived from the raw disclosure, so
  // it stays request-ephemeral and may never reach a store or an owner response.
  "provider.facet_tagger_response": {
    retentionClass: "request_ephemeral",
    allowedSinks: ["request_memory"],
  },
  "match.selection": {
    retentionClass: "owned_story",
    allowedSinks: ["request_memory", "owned_story_store"],
  },
  "owner.save_state": {
    retentionClass: "owned_story",
    allowedSinks: ["request_memory", "owned_story_store", "owner_response"],
  },
  "provider.opening_copy_response": {
    retentionClass: "request_ephemeral",
    allowedSinks: ["request_memory"],
  },
  "story.opening_copy": {
    retentionClass: "owned_story",
    allowedSinks: ["request_memory", "owned_story_store", "owner_response"],
  },
  "provider.hybrid_plan_response": {
    retentionClass: "request_ephemeral",
    allowedSinks: ["request_memory"],
  },
  "story.validated_hybrid_plan": {
    retentionClass: "owned_story",
    allowedSinks: ["request_memory", "owned_story_store"],
  },
  "story.artifact": {
    retentionClass: "owned_story",
    allowedSinks: ["request_memory", "owned_story_store", "owner_response"],
  },
  "embedding.query_vector": {
    retentionClass: "request_ephemeral",
    allowedSinks: ["request_memory"],
  },
  "content.curated_reference": {
    retentionClass: "curated_reference",
    allowedSinks: [
      "request_memory",
      "external_provider",
      "curated_reference_store",
      "owner_response",
    ],
  },
  "embedding.curated_vector": {
    retentionClass: "curated_reference",
    allowedSinks: ["request_memory", "curated_reference_store"],
  },
  "feedback.closed_response": {
    retentionClass: "bounded_feedback",
    allowedSinks: ["request_memory", "bounded_feedback_store"],
  },
  "telemetry.product_event": {
    retentionClass: "bounded_operational",
    allowedSinks: ["request_memory", "bounded_operational_store"],
  },
  "telemetry.generation_attempt": {
    retentionClass: "bounded_operational",
    allowedSinks: ["request_memory", "bounded_operational_store"],
  },
  "editorial.historical_concern": {
    retentionClass: "shared_editorial",
    allowedSinks: ["request_memory", "shared_editorial_store"],
  },
} as const satisfies Record<string, RetentionSurfaceDefinition>);

export type DerivedOutputSurface = keyof typeof DERIVED_OUTPUT_SURFACES;

export type PersistedRetentionLabel = Readonly<{
  policyVersion:
    | typeof DERIVED_OUTPUT_RETENTION_POLICY_VERSION
    | typeof LEGACY_DERIVED_OUTPUT_RETENTION_POLICY_VERSION;
  retentionClass: RetentionClass;
}>;

export function retentionPolicyFor(
  surface: DerivedOutputSurface,
): Readonly<RetentionSurfaceDefinition & RetentionClassPolicy> {
  const definition = retentionSurfaceDefinition(surface);
  return Object.freeze({
    ...definition,
    ...RETENTION_CLASS_POLICIES[definition.retentionClass],
  });
}

export function assertRetentionSink(
  surface: DerivedOutputSurface,
  sink: RetentionSink,
): PersistedRetentionLabel {
  const definition = retentionSurfaceDefinition(surface);
  if (!RETENTION_SINKS.includes(sink)) {
    throw new Error("retention sink is not registered");
  }
  if (!(definition.allowedSinks as readonly RetentionSink[]).includes(sink)) {
    throw new Error(`retention sink is forbidden for ${surface}`);
  }
  return Object.freeze({
    policyVersion: DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
    retentionClass: definition.retentionClass,
  });
}

export function parsePersistedRetentionLabel(
  value: unknown,
  expectedClass: RetentionClass,
): PersistedRetentionLabel {
  if (
    !isExactRecord(value, "policyVersion,retentionClass") ||
    (value.policyVersion !== DERIVED_OUTPUT_RETENTION_POLICY_VERSION &&
      value.policyVersion !==
        LEGACY_DERIVED_OUTPUT_RETENTION_POLICY_VERSION) ||
    value.retentionClass !== expectedClass
  ) {
    throw new Error("persisted retention label is invalid");
  }
  return Object.freeze({
    policyVersion: value.policyVersion,
    retentionClass: expectedClass,
  });
}

export const EXTERNAL_PROVIDER_EXCHANGES = deepFreeze({
  "cerebras.rerank": {
    provider: "cerebras",
    requestSurfaces: [
      "input.raw_disclosure",
      "input.age",
      "content.curated_reference",
    ],
    responseSurface: "provider.rerank_response",
    endpointPathSuffix: "/chat/completions",
  },
  "cerebras.opening_copy": {
    provider: "cerebras",
    requestSurfaces: [
      "analysis.resonance_brief",
      "content.curated_reference",
    ],
    responseSurface: "provider.opening_copy_response",
    endpointPathSuffix: "/chat/completions",
  },
  // Dormant in production: lib/llm.ts forces the stub when NODE_ENV=production,
  // so this exchange is declared but not exercised on a served deployment.
  "cerebras.facet_tagger": {
    provider: "cerebras",
    requestSurfaces: [
      "input.raw_disclosure",
      "content.curated_reference",
    ],
    responseSurface: "provider.facet_tagger_response",
    endpointPathSuffix: "/chat/completions",
  },
  "cerebras.hybrid_plan": {
    provider: "cerebras",
    requestSurfaces: [
      "analysis.resonance_brief",
      "analysis.hybrid_retry_feedback",
      "content.curated_reference",
    ],
    responseSurface: "provider.hybrid_plan_response",
    endpointPathSuffix: "/chat/completions",
  },
  "gemini.query_embedding": {
    provider: "gemini",
    requestSurfaces: ["input.raw_disclosure"],
    responseSurface: "embedding.query_vector",
    endpointPathSuffix: ":embedContent",
  },
  "gemini.document_embedding": {
    provider: "gemini",
    requestSurfaces: ["content.curated_reference"],
    responseSurface: "embedding.curated_vector",
    endpointPathSuffix: ":batchEmbedContents",
  },
} as const satisfies Record<
  string,
  Readonly<{
    provider: "cerebras" | "gemini";
    requestSurfaces: readonly DerivedOutputSurface[];
    responseSurface: DerivedOutputSurface;
    endpointPathSuffix: string;
  }>
>);

export type ExternalProviderExchangeId =
  keyof typeof EXTERNAL_PROVIDER_EXCHANGES;

// This registry is deliberately exhaustive over every application-owned table.
// The CI check derives table names from migrations, so adding a durable store
// without choosing a class fails before merge.
export const PERSISTENCE_RETENTION_REGISTRY = deepFreeze({
  "public.figures": ["curated_reference"],
  "public.figure_stages": ["curated_reference"],
  "public.sessions": ["recovery_context", "owned_story"],
  "public.figure_shape_embeddings": ["curated_reference"],
  "public.figure_facet_embeddings": ["curated_reference"],
  "public.rate_limits": ["bounded_operational"],
  "public.story_specs": ["curated_reference"],
  "public.story_artifacts": ["owned_story"],
  "public.story_artifact_legacy_v5_replay": ["owned_story"],
  "public.match_recovery_flows": ["recovery_context"],
  "public.historical_concern_reports": ["shared_editorial"],
  "public.story_feedback": ["bounded_feedback"],
  "public.alternate_story_flows": ["recovery_context"],
  "public.product_events": ["bounded_operational"],
  "public.generation_attempts": ["bounded_operational"],
  "public.telemetry_flows": ["bounded_operational"],
  "public.telemetry_flow_revocations": ["bounded_operational"],
  "public.product_event_outbox": ["bounded_operational"],
  "public.match_rate_limit_decisions": ["bounded_operational"],
  "public.telemetry_event_daily_rollups": ["bounded_operational"],
  "public.telemetry_rollup_dispatch_control": ["curated_reference"],
  "public.story_recipe_registry": ["curated_reference"],
  "public.owner_story_save_states": ["owned_story"],
} as const satisfies Record<string, readonly RetentionClass[]>);

// Exact inventory for the two durable relations that can contain a Disclosure
// or provider-derived Owner Story. CI derives their columns from every
// migration; adding a field without choosing its lifecycle fails. The live
// schema-health RPC independently compares pg_attribute with the same set.
export const RETENTION_BEARING_COLUMN_REGISTRY = deepFreeze({
  "public.sessions": {
    session_id: "owned_story",
    user_id: "owned_story",
    figure_key: "owned_story",
    stage_id: "owned_story",
    story_artifact_id: "owned_story",
    framing: "owned_story",
    opening_copy: "owned_story",
    age: "owned_story",
    feeling: "recovery_context",
    story_request_context: "recovery_context",
    disclosure_expires_at: "owned_story",
    alternate_of_session_id: "owned_story",
    match_recipe: "owned_story",
    next_beat_index: "owned_story",
    next_chunk_index: "owned_story",
    created_at: "owned_story",
    updated_at: "owned_story",
    retention_policy_version: "owned_story",
    story_retention_class: "owned_story",
    context_retention_class: "owned_story",
  },
  "public.story_artifacts": {
    artifact_id: "owned_story",
    session_id: "owned_story",
    user_id: "owned_story",
    story_spec_id: "owned_story",
    story_spec_version: "owned_story",
    story_spec_schema_version: "owned_story",
    figure_key: "owned_story",
    stage_id: "owned_story",
    schema_version: "owned_story",
    composition_mode: "owned_story",
    content_hash: "owned_story",
    artifact: "owned_story",
    created_at: "owned_story",
    retention_policy_version: "owned_story",
    retention_class: "owned_story",
  },
} as const satisfies Record<
  "public.sessions" | "public.story_artifacts",
  Readonly<Record<string, RetentionClass>>
>);

export type DerivedOutputValues = {
  rerank_response: Pick;
  opening_copy_candidate: OpeningCopy;
  composition_plan_candidate: unknown;
  validated_composition_plan: HybridCompositionPlan;
  retrieval_query_embedding: number[];
};

export type DerivedOutputKind = keyof DerivedOutputValues;

export const DERIVED_OUTPUT_CONSUMERS = [
  "match_reducer",
  "story_validator",
  "composition_plan_validator",
  "story_artifact_builder",
  "retrieval_scoring",
  "provider_health_check",
] as const;
export type DerivedOutputConsumer =
  (typeof DERIVED_OUTPUT_CONSUMERS)[number];

type DerivedOutputPolicy = Readonly<{
  retentionClass: RetentionClass;
  shape:
    | "rerank_pick"
    | "opening_copy"
    | "untrusted_record"
    | "validated_plan"
    | "vector";
  allowedConsumers: readonly DerivedOutputConsumer[];
}>;

export const DERIVED_OUTPUT_POLICIES = deepFreeze({
  rerank_response: {
    retentionClass: "request_ephemeral",
    shape: "rerank_pick",
    allowedConsumers: ["match_reducer", "provider_health_check"],
  },
  opening_copy_candidate: {
    retentionClass: "request_ephemeral",
    shape: "opening_copy",
    allowedConsumers: ["story_validator", "provider_health_check"],
  },
  composition_plan_candidate: {
    retentionClass: "request_ephemeral",
    shape: "untrusted_record",
    allowedConsumers: [
      "composition_plan_validator",
      "provider_health_check",
    ],
  },
  validated_composition_plan: {
    retentionClass: "owned_story",
    shape: "validated_plan",
    allowedConsumers: ["story_artifact_builder"],
  },
  retrieval_query_embedding: {
    retentionClass: "request_ephemeral",
    shape: "vector",
    allowedConsumers: ["retrieval_scoring", "provider_health_check"],
  },
} as const satisfies Record<DerivedOutputKind, DerivedOutputPolicy>);

type AllowedConsumer<Kind extends DerivedOutputKind> =
  (typeof DERIVED_OUTPUT_POLICIES)[Kind]["allowedConsumers"][number];

declare const DERIVED_OUTPUT_VALUE: unique symbol;

export type DerivedOutput<Kind extends DerivedOutputKind> = Readonly<{
  kind: Kind;
  policyVersion: typeof DERIVED_OUTPUT_RETENTION_POLICY_VERSION;
  readonly [DERIVED_OUTPUT_VALUE]: DerivedOutputValues[Kind];
}>;

const classifiedValues = new WeakMap<object, unknown>();

export function classifyDerivedOutput<Kind extends DerivedOutputKind>(
  kind: Kind,
  value: DerivedOutputValues[Kind],
): DerivedOutput<Kind> {
  if (!(kind in DERIVED_OUTPUT_POLICIES)) {
    throw new Error("derived output kind is not registered");
  }
  if (!validDerivedOutputValue(kind, value)) {
    throw new Error(`derived output shape is invalid for ${kind}`);
  }
  const token = Object.freeze({
    kind,
    policyVersion: DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
  });
  classifiedValues.set(token, deepFreeze(value));
  return token as DerivedOutput<Kind>;
}

export function consumeDerivedOutput<
  Kind extends DerivedOutputKind,
  Consumer extends AllowedConsumer<Kind>,
>(
  output: DerivedOutput<Kind>,
  consumer: Consumer,
): DerivedOutputValues[Kind] {
  if (
    output === null ||
    typeof output !== "object" ||
    !classifiedValues.has(output) ||
    output.policyVersion !== DERIVED_OUTPUT_RETENTION_POLICY_VERSION ||
    !(output.kind in DERIVED_OUTPUT_POLICIES)
  ) {
    throw new Error("derived output token is invalid");
  }
  const policy = DERIVED_OUTPUT_POLICIES[output.kind];
  if (
    !(policy.allowedConsumers as readonly DerivedOutputConsumer[]).includes(
      consumer,
    )
  ) {
    throw new Error(`derived output consumer is forbidden for ${output.kind}`);
  }
  return classifiedValues.get(output) as DerivedOutputValues[Kind];
}

function retentionSurfaceDefinition(
  surface: DerivedOutputSurface,
): RetentionSurfaceDefinition {
  const definition = (
    DERIVED_OUTPUT_SURFACES as Readonly<
      Record<string, RetentionSurfaceDefinition | undefined>
    >
  )[surface];
  if (!definition) throw new Error("derived output surface is not registered");
  return definition;
}

function validDerivedOutputValue<Kind extends DerivedOutputKind>(
  kind: Kind,
  value: DerivedOutputValues[Kind],
): boolean {
  switch (kind) {
    case "rerank_response":
      return (
        isExactRecord(value, "confidence,figureKey,gap,resonance,stageId") &&
        typeof value.figureKey === "string" &&
        typeof value.stageId === "string" &&
        typeof value.resonance === "string" &&
        typeof value.gap === "string" &&
        ["low", "medium", "high"].includes(String(value.confidence))
      );
    case "opening_copy_candidate":
      return (
        isExactRecord(value, "eyebrow,prefaceLines") &&
        typeof value.eyebrow === "string" &&
        Array.isArray(value.prefaceLines) &&
        value.prefaceLines.every((line) => typeof line === "string")
      );
    case "composition_plan_candidate":
      return true;
    case "validated_composition_plan":
      return (
        isExactRecord(
          value,
          "bridgeTemplateId,schemaVersion,transitionRole,transitionTemplateId",
        ) &&
        value.schemaVersion === HYBRID_PLAN_SCHEMA_VERSION &&
        [
          "scene",
          "dark_moment",
          "response",
          "struggle",
          "turning_point",
          "became",
          "bridge",
        ].includes(String(value.transitionRole)) &&
        HYBRID_TRANSITION_TEMPLATE_IDS.includes(
          value.transitionTemplateId as
            (typeof HYBRID_TRANSITION_TEMPLATE_IDS)[number],
        ) &&
        HYBRID_BRIDGE_TEMPLATE_IDS.includes(
          value.bridgeTemplateId as
            (typeof HYBRID_BRIDGE_TEMPLATE_IDS)[number],
        )
      );
    case "retrieval_query_embedding":
      return (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
      );
  }
}

function isExactRecord(
  value: unknown,
  sortedKeys: string,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).sort().join(",") ===
      sortedKeys
  );
}

function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
