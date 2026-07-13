import {
  APPROVED_TELEMETRY_RECIPE_IDS,
  ARTIFACT_FALLBACK_REASONS,
  GENERATION_ATTEMPT_RETENTION_DAYS,
  GENERATION_ATTEMPT_SCHEMA_VERSION,
  GENERATION_OPERATIONS,
  LATENCY_BUCKETS,
  PRODUCT_EVENT_RETENTION_DAYS,
  PRODUCT_EVENT_SCHEMA_VERSION,
  STATUS_BUCKETS,
  STORY_ROLES,
  TELEMETRY_ERROR_CLASSES,
  TELEMETRY_PROVIDERS,
  UNLINKABLE_PRODUCT_EVENTS,
  VALIDATION_OUTCOMES,
  type GenerationAttempt,
  type GenerationAttemptId,
  type GenerationAttemptRecord,
  type ProductEvent,
  type ProductEventRecord,
  type TelemetryEventId,
  type TelemetryFlowId,
} from "./telemetry-types";
import { MATCH_RECOVERY_POLICY_VERSION } from "./match-recovery";
import {
  parseDeletionCorrelationId,
  parseGenerationAttemptId,
  parseTelemetryEventId,
  parseTelemetryFlowId,
} from "./telemetry-id";

type Validator = (value: unknown) => boolean;
type EventDefinition = Readonly<Record<string, Validator>>;

const oneOf = <T extends readonly unknown[]>(values: T): Validator =>
  (value) => values.includes(value);
const exact = (expected: unknown): Validator => (value) => value === expected;
const boolean: Validator = (value) => typeof value === "boolean";
const passageOrdinal: Validator = (value) =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 63;
const costMicros: Validator = (value) =>
  Number.isInteger(value) &&
  (value as number) >= 0 &&
  (value as number) <= 10_000_000;

const productEventDefinitions = {
  landing_cta_clicked: { surface: exact("home_primary") },
  intake_started: { viewportBucket: oneOf(["small", "large"] as const) },
  intake_submitted: {},
  auth_established: {
    authMethod: oneOf(["anonymous", "email_link", "password"] as const),
  },
  crisis_intercepted: {},
  rate_limited: {
    operation: oneOf([
      "intake",
      "feedback",
      "alternate_story",
      "historical_concern",
      "auth",
    ] as const),
    limitScope: oneOf(["user", "ip"] as const),
  },
  match_completed: {
    recipeId: oneOf(APPROVED_TELEMETRY_RECIPE_IDS),
    storyRole: oneOf(STORY_ROLES),
    disposition: oneOf([
      "close",
      "adjacent",
      "clarification_required",
      "no_close_match",
    ] as const),
    confidenceBucket: oneOf([
      "high",
      "medium",
      "low",
      "not_applicable",
    ] as const),
    matchPath: oneOf(["rerank", "keyword_fallback", "not_run"] as const),
    ageFallback: boolean,
    boundaryOutcome: oneOf([
      "not_set",
      "passed",
      "no_eligible",
    ] as const),
  },
  clarification_shown: {
    policyVersion: exact(MATCH_RECOVERY_POLICY_VERSION),
  },
  artifact_created: {
    recipeId: oneOf(APPROVED_TELEMETRY_RECIPE_IDS),
    storyRole: oneOf(STORY_ROLES),
    compositionMode: oneOf(["hybrid", "canonical_fallback"] as const),
    fallbackReason: oneOf(ARTIFACT_FALLBACK_REASONS),
    attemptBucket: oneOf([
      "not_attempted",
      "first",
      "retry",
      "exhausted",
    ] as const),
  },
  first_content_shown: {
    storyRole: oneOf(STORY_ROLES),
    latencyBucket: oneOf(LATENCY_BUCKETS),
  },
  passage_acknowledged: {
    storyRole: oneOf(STORY_ROLES),
    passageOrdinal,
  },
  passage_presented: {
    storyRole: oneOf(STORY_ROLES),
    passageOrdinal,
    latencyBucket: oneOf(LATENCY_BUCKETS),
  },
  story_completed: { storyRole: oneOf(STORY_ROLES) },
  source_opened: { storyRole: oneOf(STORY_ROLES) },
  feedback_submitted: {
    storyRole: oneOf(STORY_ROLES),
    verdict: oneOf(["felt_close", "not_close"] as const),
  },
  alternate_requested: {},
  alternate_resolved: {
    outcome: oneOf([
      "ready",
      "unavailable",
      "expired",
      "exhausted",
      "failed",
    ] as const),
  },
  story_saved: { storyRole: oneOf(STORY_ROLES) },
  saved_story_reopened: {
    storyRole: oneOf(STORY_ROLES),
    ageBucket: oneOf(["lt7d", "7to30d"] as const),
  },
  deletion_requested: {
    deletionId: validDeletionId,
    scope: oneOf(["story", "account"] as const),
  },
  deletion_completed: {
    deletionId: validDeletionId,
    scope: oneOf(["story", "account"] as const),
    latencyBucket: oneOf(LATENCY_BUCKETS),
  },
  flow_failed: {
    domain: oneOf([
      "auth",
      "database",
      "matching",
      "composition",
      "reader",
      "feedback",
      "alternate",
      "deletion",
    ] as const),
    errorClass: oneOf(TELEMETRY_ERROR_CLASSES.filter((value) => value !== "none")),
    statusBucket: oneOf(STATUS_BUCKETS.filter((value) => value !== "ok")),
    latencyBucket: oneOf(LATENCY_BUCKETS),
  },
} as const satisfies Record<ProductEvent["event"], EventDefinition>;

const generationAttemptDefinition = {
  operation: oneOf(GENERATION_OPERATIONS),
  recipeId: oneOf(APPROVED_TELEMETRY_RECIPE_IDS),
  provider: oneOf(TELEMETRY_PROVIDERS),
  outcome: oneOf(["success", "fallback", "failure"] as const),
  attempt: oneOf(["first", "retry"] as const),
  latencyBucket: oneOf(LATENCY_BUCKETS),
  statusBucket: oneOf(STATUS_BUCKETS),
  errorClass: oneOf(TELEMETRY_ERROR_CLASSES),
  fallbackReason: oneOf(ARTIFACT_FALLBACK_REASONS),
  validationOutcome: oneOf(VALIDATION_OUTCOMES),
  costMicros,
} as const satisfies EventDefinition;

export function parseProductEvent(input: unknown): Readonly<ProductEvent> {
  const object = plainObject(input, "product event");
  const name = object.event;
  if (typeof name !== "string" || !(name in productEventDefinitions)) {
    throw new Error("product event name is not approved");
  }
  const definition = productEventDefinitions[
    name as ProductEvent["event"]
  ] as EventDefinition;
  assertExactShape(object, { event: exact(name), ...definition }, "product event");
  const parsed = object as ProductEvent;
  if (
    parsed.event === "match_completed" &&
    !validMatchEvent(parsed)
  ) {
    throw new Error("match event contains an impossible disposition combination");
  }
  if (
    parsed.event === "artifact_created" &&
    !validArtifactEvent(parsed)
  ) {
    throw new Error("artifact event composition and fallback conflict");
  }
  return Object.freeze({ ...object }) as Readonly<ProductEvent>;
}

function validArtifactEvent(
  event: Extract<ProductEvent, { event: "artifact_created" }>,
): boolean {
  if (event.compositionMode === "hybrid") {
    return (
      event.fallbackReason === "none" &&
      (event.attemptBucket === "first" || event.attemptBucket === "retry")
    );
  }
  if (event.fallbackReason === "canonical_only") {
    return event.attemptBucket === "not_attempted";
  }
  if (event.attemptBucket === "not_attempted") {
    return event.fallbackReason === "validator_rejected";
  }
  return (
    event.fallbackReason !== "none" && event.attemptBucket === "exhausted"
  );
}

function validMatchEvent(
  event: Extract<ProductEvent, { event: "match_completed" }>,
): boolean {
  if (
    event.disposition === "close" &&
    (event.confidenceBucket !== "high" ||
      event.ageFallback ||
      event.boundaryOutcome === "no_eligible" ||
      event.storyRole === "alternate")
  ) {
    return false;
  }
  if (
    event.disposition === "clarification_required" &&
    (event.storyRole !== "initial" ||
      event.confidenceBucket === "high" ||
      event.confidenceBucket === "not_applicable" ||
      event.boundaryOutcome === "no_eligible")
  ) {
    return false;
  }
  if (
    event.boundaryOutcome === "no_eligible" &&
    (event.disposition !== "no_close_match" ||
      event.confidenceBucket !== "not_applicable" ||
      event.matchPath !== "not_run")
  ) {
    return false;
  }
  if (
    event.confidenceBucket === "not_applicable" &&
    event.boundaryOutcome !== "no_eligible"
  ) {
    return false;
  }
  if (
    event.matchPath === "not_run" && event.boundaryOutcome !== "no_eligible"
  ) {
    return false;
  }
  if (
    event.disposition === "no_close_match" &&
    event.confidenceBucket === "high"
  ) {
    return false;
  }
  return true;
}

export function parseGenerationAttempt(
  input: unknown,
): Readonly<GenerationAttempt> {
  const object = plainObject(input, "generation attempt");
  assertExactShape(object, generationAttemptDefinition, "generation attempt");
  const parsed = object as GenerationAttempt;
  if (
    parsed.outcome === "success" &&
    (parsed.statusBucket !== "ok" ||
      parsed.errorClass !== "none" ||
      parsed.fallbackReason !== "none" ||
      !["not_run", "passed"].includes(parsed.validationOutcome) ||
      (parsed.operation === "validate" &&
        parsed.validationOutcome !== "passed"))
  ) {
    throw new Error("successful generation attempt has failure dimensions");
  }
  if (parsed.outcome === "fallback" && parsed.fallbackReason === "none") {
    throw new Error("fallback generation attempt requires a closed reason");
  }
  if (
    parsed.outcome === "fallback" &&
    parsed.fallbackReason !== "canonical_only" &&
    (parsed.statusBucket === "ok" || parsed.errorClass === "none")
  ) {
    throw new Error("generation fallback requires a reduced failure");
  }
  if (
    parsed.outcome === "fallback" &&
    parsed.fallbackReason === "canonical_only" &&
    (parsed.statusBucket !== "not_applicable" ||
      parsed.errorClass !== "none" ||
      !["not_run", "passed"].includes(parsed.validationOutcome))
  ) {
    throw new Error("canonical-only fallback cannot carry a provider failure");
  }
  if (
    parsed.outcome === "failure" &&
    (parsed.errorClass === "none" ||
      parsed.statusBucket === "ok" ||
      parsed.fallbackReason !== "none")
  ) {
    throw new Error("failed generation attempt requires a closed error class");
  }
  const validationRejected = !["not_run", "passed"].includes(
    parsed.validationOutcome,
  );
  if (parsed.outcome !== "success" && parsed.fallbackReason !== "canonical_only") {
    const validationFamilyValid =
      (parsed.errorClass === "validation_rejected" && validationRejected) ||
      (parsed.errorClass === "invalid_output" &&
        parsed.validationOutcome === "schema_rejected") ||
      (!validationRejected &&
        parsed.errorClass !== "validation_rejected" &&
        parsed.errorClass !== "invalid_output");
    if (!validationFamilyValid) {
      throw new Error("generation validation outcome and error class conflict");
    }
  }
  if (parsed.outcome === "fallback") {
    const fallbackFamilyValid =
      parsed.fallbackReason === "canonical_only" ||
      (parsed.fallbackReason === "validator_rejected" &&
        parsed.errorClass === "validation_rejected" &&
        validationRejected) ||
      (parsed.fallbackReason === "provider_output_invalid" &&
        parsed.errorClass === "invalid_output" &&
        parsed.validationOutcome === "schema_rejected") ||
      ((parsed.fallbackReason === "provider_timeout" ||
        parsed.fallbackReason === "provider_error") &&
        parsed.validationOutcome === "not_run" &&
        parsed.errorClass !== "validation_rejected" &&
        parsed.errorClass !== "invalid_output");
    if (!fallbackFamilyValid) {
      throw new Error("generation fallback and validation outcome conflict");
    }
  }
  return Object.freeze({ ...object }) as Readonly<GenerationAttempt>;
}

export function createProductEventRecord(input: {
  eventId: TelemetryEventId;
  flowId: TelemetryFlowId | null;
  event: unknown;
  now?: Date;
}): Readonly<ProductEventRecord> {
  const event = parseProductEvent(input.event);
  const eventId = parseTelemetryEventId(input.eventId);
  const unlinkable = (UNLINKABLE_PRODUCT_EVENTS as readonly string[]).includes(
    event.event,
  );
  const flowId =
    input.flowId === null ? null : parseTelemetryFlowId(input.flowId);
  if (unlinkable !== (flowId === null)) {
    throw new Error(
      unlinkable
        ? `${event.event} must be unlinkable`
        : `${event.event} requires an opaque flow ID`,
    );
  }
  const now = validDate(input.now ?? new Date(), "event time");
  return Object.freeze({
    ...event,
    eventId,
    schemaVersion: PRODUCT_EVENT_SCHEMA_VERSION,
    flowId,
    occurredAt: now.toISOString(),
    expiresAt: new Date(
      now.getTime() + PRODUCT_EVENT_RETENTION_DAYS * 86_400_000,
    ).toISOString(),
  }) as Readonly<ProductEventRecord>;
}

export function createGenerationAttemptRecord(input: {
  attemptId: GenerationAttemptId;
  attempt: unknown;
  now?: Date;
}): Readonly<GenerationAttemptRecord> {
  const attempt = parseGenerationAttempt(input.attempt);
  const attemptId = parseGenerationAttemptId(input.attemptId);
  const now = validDate(input.now ?? new Date(), "attempt time");
  return Object.freeze({
    ...attempt,
    attemptId,
    schemaVersion: GENERATION_ATTEMPT_SCHEMA_VERSION,
    occurredAt: now.toISOString(),
    expiresAt: new Date(
      now.getTime() + GENERATION_ATTEMPT_RETENTION_DAYS * 86_400_000,
    ).toISOString(),
  });
}

function validDeletionId(value: unknown): boolean {
  try {
    parseDeletionCorrelationId(value);
    return true;
  } catch {
    return false;
  }
}

function plainObject(value: unknown, label: string): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(`${label} must be a plain object`);
  }
  return value as Record<string, unknown>;
}

function assertExactShape(
  object: Record<string, unknown>,
  definition: EventDefinition,
  label: string,
): void {
  const expected = Object.keys(definition).sort();
  const actual = Object.keys(object).sort();
  if (
    expected.length !== actual.length ||
    expected.some((key, index) => key !== actual[index])
  ) {
    throw new Error(`${label} contains missing or forbidden fields`);
  }
  for (const [key, validator] of Object.entries(definition)) {
    if (!validator(object[key])) {
      throw new Error(`${label}.${key} is not an approved value`);
    }
  }
}

function validDate(value: Date, label: string): Date {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new Error(`${label} is invalid`);
  }
  return new Date(value.getTime());
}
