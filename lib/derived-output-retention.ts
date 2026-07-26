import "server-only";
import type { HybridCompositionPlan } from "./hybrid-composition";
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
  maximumLifetime:
    | "request"
    | "owner_lifecycle"
    | "60_days"
    | "90_days"
    | "30_days"
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
    maximumLifetime: "request",
    ownerDeletion: "not_applicable",
    contentRule:
      "Working Material may be reduced or validated in memory but never persisted, cached, logged, or returned.",
  },
  recovery_context: {
    maximumLifetime: "60_days",
    ownerDeletion: "required",
    contentRule:
      "Disclosure, story limits, clarification, and context-bound capabilities stay root-only and expire no later than the original context deadline.",
  },
  owned_story: {
    maximumLifetime: "owner_lifecycle",
    ownerDeletion: "required",
    contentRule:
      "Only validated owner-visible story content, story identity, age, provenance, and reading state may use this class.",
  },
  bounded_feedback: {
    maximumLifetime: "90_days",
    ownerDeletion: "required",
    contentRule:
      "Only the closed feedback verdict and one approved reason may be retained; free text is not part of this class.",
  },
  bounded_operational: {
    maximumLifetime: "30_days",
    ownerDeletion: "when_owner_linked",
    contentRule:
      "Only exact identifiers, enums, counts, and time buckets may be retained; no disclosure, prose, provider body, vector, or free-form error.",
  },
  shared_editorial: {
    maximumLifetime: "editorial_policy",
    ownerDeletion: "de_linked",
    contentRule:
      "Only curated content identifiers and closed editorial states may remain after the report is irreversibly de-linked from its reader and story.",
  },
  curated_reference: {
    maximumLifetime: "catalog_history",
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
  "input.story_request_context": {
    retentionClass: "recovery_context",
    allowedSinks: ["request_memory", "root_session"],
  },
  "analysis.resonance_brief": {
    retentionClass: "request_ephemeral",
    allowedSinks: ["request_memory", "external_provider"],
  },
  "provider.rerank_response": {
    retentionClass: "request_ephemeral",
    allowedSinks: ["request_memory"],
  },
  "match.selection": {
    retentionClass: "owned_story",
    allowedSinks: ["request_memory", "owned_story_store"],
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
    requestSurface: "input.raw_disclosure",
    responseSurface: "provider.rerank_response",
  },
  "cerebras.opening_copy": {
    requestSurface: "analysis.resonance_brief",
    responseSurface: "provider.opening_copy_response",
  },
  "cerebras.hybrid_plan": {
    requestSurface: "analysis.resonance_brief",
    responseSurface: "provider.hybrid_plan_response",
  },
  "gemini.query_embedding": {
    requestSurface: "input.raw_disclosure",
    responseSurface: "embedding.query_vector",
  },
  "gemini.document_embedding": {
    requestSurface: "content.curated_reference",
    responseSurface: "embedding.curated_vector",
  },
} as const satisfies Record<
  string,
  Readonly<{
    requestSurface: DerivedOutputSurface;
    responseSurface: DerivedOutputSurface;
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
  "public.telemetry_rollup_dispatch_control": ["bounded_operational"],
  "public.story_recipe_registry": ["curated_reference"],
} as const satisfies Record<string, readonly RetentionClass[]>);

export type DerivedOutputValues = {
  rerank_response: Pick;
  opening_copy: OpeningCopy;
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
  opening_copy: {
    retentionClass: "owned_story",
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
    case "opening_copy":
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
        typeof value.schemaVersion === "string" &&
        typeof value.transitionRole === "string" &&
        typeof value.transitionTemplateId === "string" &&
        typeof value.bridgeTemplateId === "string"
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
