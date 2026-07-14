import "server-only";
import { isDeepStrictEqual } from "node:util";
import { getSupabase } from "./db";
import {
  parseTelemetryEventId,
  parseTelemetryFlowIdForRetirement,
  parseTelemetryOutboxLeaseId,
} from "./telemetry-id";
import { parseProductEvent } from "./telemetry-schema";
import type { TelemetryWriteResult } from "./telemetry-store-memory";
import {
  PRODUCT_EVENT_SCHEMA_VERSION,
  TELEMETRY_ERROR_CLASSES,
  UNLINKABLE_PRODUCT_EVENTS,
} from "./telemetry-types";
import type {
  ClaimedProductEvent,
  GenerationAttemptRecord,
  ProductEvent,
  ProductEventRecord,
  TelemetryErrorClass,
  TelemetryEventId,
  TelemetryOutboxLeaseId,
  TelemetryOutboxAckResult,
  TelemetryOutboxNackResult,
} from "./telemetry-types";

type ProductEventRow = ReturnType<typeof toProductEventRow>;
type GenerationAttemptRow = ReturnType<typeof toGenerationAttemptRow>;

export async function appendSupabaseProductEvent(
  record: Readonly<ProductEventRecord>,
): Promise<TelemetryWriteResult> {
  const row = toProductEventRow(record);
  const { data, error } = await getSupabase().rpc(
    "capture_product_event_v1",
    toCaptureProductEventArgs(row),
  );
  if (error) throw new Error("product event could not be captured");
  if (data === "created" || data === "duplicate" || data === "conflict") {
    return data;
  }
  throw new Error("product event capture returned an invalid disposition");
}

export async function claimSupabaseProductEventOutbox(input: {
  leaseId: TelemetryOutboxLeaseId;
  limit: number;
}): Promise<ReadonlyArray<Readonly<ClaimedProductEvent>>> {
  const leaseId = parseTelemetryOutboxLeaseId(input.leaseId);
  const limit = parseClaimLimit(input.limit);
  const { data, error } = await getSupabase().rpc(
    "claim_product_event_outbox_v1",
    { p_lease_id: leaseId, p_limit: limit },
  );
  if (error) throw new Error("product event outbox could not be claimed");
  if (!Array.isArray(data)) {
    throw new Error("product event outbox claim returned an invalid result");
  }
  return Object.freeze(
    data.map((row) => parseClaimedProductEvent(row, leaseId)),
  );
}

export async function ackSupabaseProductEventOutbox(input: {
  eventId: TelemetryEventId;
  leaseId: TelemetryOutboxLeaseId;
}): Promise<TelemetryOutboxAckResult> {
  const eventId = parseTelemetryEventId(input.eventId);
  const leaseId = parseTelemetryOutboxLeaseId(input.leaseId);
  const { data, error } = await getSupabase().rpc(
    "ack_product_event_outbox_v1",
    { p_event_id: eventId, p_lease_id: leaseId },
  );
  if (error) throw new Error("product event outbox could not be acknowledged");
  if (
    data === "acknowledged" ||
    data === "duplicate" ||
    data === "exhausted" ||
    data === "stale" ||
    data === "not_found"
  ) {
    return data;
  }
  throw new Error("product event outbox acknowledgement was invalid");
}

export async function nackSupabaseProductEventOutbox(input: {
  eventId: TelemetryEventId;
  leaseId: TelemetryOutboxLeaseId;
  errorClass: Exclude<TelemetryErrorClass, "none">;
}): Promise<TelemetryOutboxNackResult> {
  const eventId = parseTelemetryEventId(input.eventId);
  const leaseId = parseTelemetryOutboxLeaseId(input.leaseId);
  const errorClass = parseOutboxErrorClass(input.errorClass);
  const { data, error } = await getSupabase().rpc(
    "nack_product_event_outbox_v1",
    {
      p_event_id: eventId,
      p_lease_id: leaseId,
      p_error_class: errorClass,
    },
  );
  if (error) throw new Error("product event outbox could not be released");
  if (
    data === "released" ||
    data === "exhausted" ||
    data === "delivered" ||
    data === "stale" ||
    data === "not_found"
  ) {
    return data;
  }
  throw new Error("product event outbox release was invalid");
}

export async function appendSupabaseGenerationAttempt(
  record: Readonly<GenerationAttemptRecord>,
): Promise<TelemetryWriteResult> {
  const row = toGenerationAttemptRow(record);
  const inserted = await getSupabase().from("generation_attempts").insert(row);
  if (!inserted.error) return "created";
  if (inserted.error.code !== "23505") {
    throw new Error("generation attempt could not be stored");
  }
  const existing = await getSupabase()
    .from("generation_attempts")
    .select("*")
    .eq("attempt_id", record.attemptId)
    .maybeSingle();
  if (existing.error || !existing.data) {
    throw new Error("generation attempt idempotency could not be verified");
  }
  return isDeepStrictEqual(projectRow(existing.data, row), row)
    ? "duplicate"
    : "conflict";
}

export function toProductEventRow(record: Readonly<ProductEventRecord>) {
  const dimensions = {
    surface: null as string | null,
    viewport_bucket: null as string | null,
    auth_method: null as string | null,
    rate_operation: null as string | null,
    limit_scope: null as string | null,
    recipe_id: null as string | null,
    story_role: null as string | null,
    match_disposition: null as string | null,
    confidence_bucket: null as string | null,
    match_path: null as string | null,
    age_fallback: null as boolean | null,
    boundary_outcome: null as string | null,
    policy_version: null as string | null,
    composition_mode: null as string | null,
    fallback_reason: null as string | null,
    attempt_bucket: null as string | null,
    latency_bucket: null as string | null,
    passage_ordinal: null as number | null,
    feedback_verdict: null as string | null,
    alternate_outcome: null as string | null,
    reopen_age_bucket: null as string | null,
    deletion_id: null as string | null,
    deletion_scope: null as string | null,
    ok: null as boolean | null,
    error_domain: null as string | null,
    error_class: null as string | null,
    status_bucket: null as string | null,
  };

  switch (record.event) {
    case "landing_cta_clicked": dimensions.surface = record.surface; break;
    case "intake_started": dimensions.viewport_bucket = record.viewportBucket; break;
    case "auth_established": dimensions.auth_method = record.authMethod; break;
    case "rate_limited":
      dimensions.rate_operation = record.operation;
      dimensions.limit_scope = record.limitScope;
      break;
    case "match_completed":
      dimensions.recipe_id = record.recipeId;
      dimensions.story_role = record.storyRole;
      dimensions.match_disposition = record.disposition;
      dimensions.confidence_bucket = record.confidenceBucket;
      dimensions.match_path = record.matchPath;
      dimensions.age_fallback = record.ageFallback;
      dimensions.boundary_outcome = record.boundaryOutcome;
      break;
    case "clarification_shown": dimensions.policy_version = record.policyVersion; break;
    case "artifact_created":
      dimensions.recipe_id = record.recipeId;
      dimensions.story_role = record.storyRole;
      dimensions.composition_mode = record.compositionMode;
      dimensions.fallback_reason = record.fallbackReason;
      dimensions.attempt_bucket = record.attemptBucket;
      break;
    case "first_content_shown":
      dimensions.story_role = record.storyRole;
      dimensions.latency_bucket = record.latencyBucket;
      break;
    case "passage_acknowledged":
      dimensions.story_role = record.storyRole;
      dimensions.passage_ordinal = record.passageOrdinal;
      break;
    case "passage_presented":
      dimensions.story_role = record.storyRole;
      dimensions.passage_ordinal = record.passageOrdinal;
      dimensions.latency_bucket = record.latencyBucket;
      break;
    case "story_completed":
    case "source_opened":
    case "story_saved":
      dimensions.story_role = record.storyRole;
      break;
    case "feedback_submitted":
      dimensions.story_role = record.storyRole;
      dimensions.feedback_verdict = record.verdict;
      break;
    case "alternate_resolved": dimensions.alternate_outcome = record.outcome; break;
    case "saved_story_reopened":
      dimensions.story_role = record.storyRole;
      dimensions.reopen_age_bucket = record.ageBucket;
      break;
    case "deletion_requested":
      dimensions.deletion_id = record.deletionId;
      dimensions.deletion_scope = record.scope;
      break;
    case "deletion_completed":
      dimensions.deletion_id = record.deletionId;
      dimensions.deletion_scope = record.scope;
      dimensions.latency_bucket = record.latencyBucket;
      break;
    case "flow_failed":
      dimensions.error_domain = record.domain;
      dimensions.error_class = record.errorClass;
      dimensions.status_bucket = record.statusBucket;
      dimensions.latency_bucket = record.latencyBucket;
      break;
    case "intake_submitted":
    case "crisis_intercepted":
    case "alternate_requested":
      break;
  }

  return {
    event_id: record.eventId,
    schema_version: record.schemaVersion,
    flow_id: record.flowId,
    event_name: record.event,
    ...dimensions,
  };
}

export function toGenerationAttemptRow(
  record: Readonly<GenerationAttemptRecord>,
) {
  return {
    attempt_id: record.attemptId,
    schema_version: record.schemaVersion,
    operation: record.operation,
    recipe_id: record.recipeId,
    provider: record.provider,
    outcome: record.outcome,
    attempt: record.attempt,
    latency_bucket: record.latencyBucket,
    status_bucket: record.statusBucket,
    error_class: record.errorClass,
    fallback_reason: record.fallbackReason,
    validation_outcome: record.validationOutcome,
    cost_micros: record.costMicros,
  };
}

function toCaptureProductEventArgs(row: ProductEventRow) {
  return {
    p_event_id: row.event_id,
    p_schema_version: row.schema_version,
    p_flow_id: row.flow_id,
    p_event_name: row.event_name,
    p_surface: row.surface,
    p_viewport_bucket: row.viewport_bucket,
    p_auth_method: row.auth_method,
    p_rate_operation: row.rate_operation,
    p_limit_scope: row.limit_scope,
    p_recipe_id: row.recipe_id,
    p_story_role: row.story_role,
    p_match_disposition: row.match_disposition,
    p_confidence_bucket: row.confidence_bucket,
    p_match_path: row.match_path,
    p_age_fallback: row.age_fallback,
    p_boundary_outcome: row.boundary_outcome,
    p_policy_version: row.policy_version,
    p_composition_mode: row.composition_mode,
    p_fallback_reason: row.fallback_reason,
    p_attempt_bucket: row.attempt_bucket,
    p_latency_bucket: row.latency_bucket,
    p_passage_ordinal: row.passage_ordinal,
    p_feedback_verdict: row.feedback_verdict,
    p_alternate_outcome: row.alternate_outcome,
    p_reopen_age_bucket: row.reopen_age_bucket,
    p_deletion_id: row.deletion_id,
    p_deletion_scope: row.deletion_scope,
    p_ok: row.ok,
    p_error_domain: row.error_domain,
    p_error_class: row.error_class,
    p_status_bucket: row.status_bucket,
  };
}

function parseClaimedProductEvent(
  value: unknown,
  expectedLeaseId: TelemetryOutboxLeaseId,
): Readonly<ClaimedProductEvent> {
  const row = asRecord(value, "product event outbox row");
  const eventId = parseTelemetryEventId(row.event_id);
  if (row.schema_version !== PRODUCT_EVENT_SCHEMA_VERSION) {
    throw new Error("product event outbox schema version is invalid");
  }
  const flowId =
    row.flow_id === null
      ? null
      : parseTelemetryFlowIdForRetirement(row.flow_id);
  const event = parseProductEvent(productEventFromRow(row));
  const unlinkable = (UNLINKABLE_PRODUCT_EVENTS as readonly string[]).includes(
    event.event,
  );
  if (unlinkable !== (flowId === null)) {
    throw new Error("product event outbox flow linkage is invalid");
  }
  const occurredAt = requiredTimestamp(row.occurred_at, "occurred_at");
  const expiresAt = requiredTimestamp(row.expires_at, "expires_at");
  if (
    Date.parse(expiresAt) <= Date.parse(occurredAt) ||
    Date.parse(expiresAt) - Date.parse(occurredAt) > 30 * 86_400_000
  ) {
    throw new Error("product event outbox retention window is invalid");
  }
  const attemptCount = row.attempt_count;
  if (
    !Number.isInteger(attemptCount) ||
    (attemptCount as number) < 1 ||
    (attemptCount as number) > 20
  ) {
    throw new Error("product event outbox attempt count is invalid");
  }
  const leaseId = parseTelemetryOutboxLeaseId(row.lease_id);
  if (leaseId !== expectedLeaseId) {
    throw new Error("product event outbox returned a different lease");
  }
  return Object.freeze({
    ...event,
    eventId,
    schemaVersion: PRODUCT_EVENT_SCHEMA_VERSION,
    flowId,
    occurredAt,
    expiresAt,
    attemptCount: attemptCount as number,
    leaseId,
  }) as Readonly<ClaimedProductEvent>;
}

function productEventFromRow(row: Record<string, unknown>): ProductEvent {
  switch (requiredString(row.event_name, "event_name")) {
    case "landing_cta_clicked":
      return {
        event: "landing_cta_clicked",
        surface: requiredString(row.surface, "surface") as "home_primary",
      };
    case "intake_started":
      return {
        event: "intake_started",
        viewportBucket: requiredString(
          row.viewport_bucket,
          "viewport_bucket",
        ) as "small" | "large",
      };
    case "intake_submitted":
      return { event: "intake_submitted" };
    case "auth_established":
      return {
        event: "auth_established",
        authMethod: requiredString(row.auth_method, "auth_method") as
          | "anonymous"
          | "email_link"
          | "password",
      };
    case "crisis_intercepted":
      return { event: "crisis_intercepted" };
    case "rate_limited":
      return {
        event: "rate_limited",
        operation: requiredString(row.rate_operation, "rate_operation") as
          | "intake"
          | "feedback"
          | "alternate_story"
          | "historical_concern"
          | "auth",
        limitScope: requiredString(row.limit_scope, "limit_scope") as
          | "user"
          | "ip",
      };
    case "match_completed":
      return {
        event: "match_completed",
        recipeId: requiredString(row.recipe_id, "recipe_id") as Extract<
          ProductEvent,
          { event: "match_completed" }
        >["recipeId"],
        storyRole: storyRole(row.story_role),
        disposition: requiredString(
          row.match_disposition,
          "match_disposition",
        ) as Extract<
          ProductEvent,
          { event: "match_completed" }
        >["disposition"],
        confidenceBucket: requiredString(
          row.confidence_bucket,
          "confidence_bucket",
        ) as Extract<
          ProductEvent,
          { event: "match_completed" }
        >["confidenceBucket"],
        matchPath: requiredString(row.match_path, "match_path") as Extract<
          ProductEvent,
          { event: "match_completed" }
        >["matchPath"],
        ageFallback: requiredBoolean(row.age_fallback, "age_fallback"),
        boundaryOutcome: requiredString(
          row.boundary_outcome,
          "boundary_outcome",
        ) as Extract<
          ProductEvent,
          { event: "match_completed" }
        >["boundaryOutcome"],
      };
    case "clarification_shown":
      return {
        event: "clarification_shown",
        policyVersion: requiredString(
          row.policy_version,
          "policy_version",
        ) as Extract<
          ProductEvent,
          { event: "clarification_shown" }
        >["policyVersion"],
      };
    case "artifact_created":
      return {
        event: "artifact_created",
        recipeId: requiredString(row.recipe_id, "recipe_id") as Extract<
          ProductEvent,
          { event: "artifact_created" }
        >["recipeId"],
        storyRole: storyRole(row.story_role),
        compositionMode: requiredString(
          row.composition_mode,
          "composition_mode",
        ) as Extract<
          ProductEvent,
          { event: "artifact_created" }
        >["compositionMode"],
        fallbackReason: requiredString(
          row.fallback_reason,
          "fallback_reason",
        ) as Extract<
          ProductEvent,
          { event: "artifact_created" }
        >["fallbackReason"],
        attemptBucket: requiredString(
          row.attempt_bucket,
          "attempt_bucket",
        ) as Extract<
          ProductEvent,
          { event: "artifact_created" }
        >["attemptBucket"],
      };
    case "first_content_shown":
      return roleLatencyEvent("first_content_shown", row);
    case "passage_acknowledged":
      return {
        event: "passage_acknowledged",
        storyRole: storyRole(row.story_role),
        passageOrdinal: requiredInteger(
          row.passage_ordinal,
          "passage_ordinal",
        ),
      };
    case "passage_presented":
      return {
        event: "passage_presented",
        storyRole: storyRole(row.story_role),
        passageOrdinal: requiredInteger(
          row.passage_ordinal,
          "passage_ordinal",
        ),
        latencyBucket: latencyBucket(row.latency_bucket),
      };
    case "story_completed":
    case "source_opened":
    case "story_saved": {
      const event = row.event_name as
        | "story_completed"
        | "source_opened"
        | "story_saved";
      return { event, storyRole: storyRole(row.story_role) };
    }
    case "feedback_submitted":
      return {
        event: "feedback_submitted",
        storyRole: storyRole(row.story_role),
        verdict: requiredString(row.feedback_verdict, "feedback_verdict") as
          | "felt_close"
          | "not_close",
      };
    case "alternate_requested":
      return { event: "alternate_requested" };
    case "alternate_resolved":
      return {
        event: "alternate_resolved",
        outcome: requiredString(
          row.alternate_outcome,
          "alternate_outcome",
        ) as Extract<
          ProductEvent,
          { event: "alternate_resolved" }
        >["outcome"],
      };
    case "saved_story_reopened":
      return {
        event: "saved_story_reopened",
        storyRole: storyRole(row.story_role),
        ageBucket: requiredString(
          row.reopen_age_bucket,
          "reopen_age_bucket",
        ) as "lt7d" | "7to30d",
      };
    case "deletion_requested":
      return {
        event: "deletion_requested",
        deletionId: requiredString(
          row.deletion_id,
          "deletion_id",
        ) as Extract<
          ProductEvent,
          { event: "deletion_requested" }
        >["deletionId"],
        scope: deletionScope(row.deletion_scope),
      };
    case "deletion_completed":
      return {
        event: "deletion_completed",
        deletionId: requiredString(
          row.deletion_id,
          "deletion_id",
        ) as Extract<
          ProductEvent,
          { event: "deletion_completed" }
        >["deletionId"],
        scope: deletionScope(row.deletion_scope),
        latencyBucket: latencyBucket(row.latency_bucket),
      };
    case "flow_failed":
      return {
        event: "flow_failed",
        domain: requiredString(row.error_domain, "error_domain") as Extract<
          ProductEvent,
          { event: "flow_failed" }
        >["domain"],
        errorClass: requiredString(
          row.error_class,
          "error_class",
        ) as Extract<
          ProductEvent,
          { event: "flow_failed" }
        >["errorClass"],
        statusBucket: requiredString(
          row.status_bucket,
          "status_bucket",
        ) as Extract<
          ProductEvent,
          { event: "flow_failed" }
        >["statusBucket"],
        latencyBucket: latencyBucket(row.latency_bucket),
      };
    default:
      throw new Error("product event outbox event name is invalid");
  }
}

function roleLatencyEvent(
  event: "first_content_shown",
  row: Record<string, unknown>,
): Extract<ProductEvent, { event: "first_content_shown" }> {
  return {
    event,
    storyRole: storyRole(row.story_role),
    latencyBucket: latencyBucket(row.latency_bucket),
  };
}

function storyRole(value: unknown): "initial" | "alternate" {
  return requiredString(value, "story_role") as "initial" | "alternate";
}

function latencyBucket(
  value: unknown,
): Extract<ProductEvent, { event: "first_content_shown" }>["latencyBucket"] {
  return requiredString(value, "latency_bucket") as Extract<
    ProductEvent,
    { event: "first_content_shown" }
  >["latencyBucket"];
}

function deletionScope(value: unknown): "story" | "account" {
  return requiredString(value, "deletion_scope") as "story" | "account";
}

function requiredString(value: unknown, column: string): string {
  if (typeof value !== "string") {
    throw new Error(`product event outbox ${column} is invalid`);
  }
  return value;
}

function requiredBoolean(value: unknown, column: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`product event outbox ${column} is invalid`);
  }
  return value;
}

function requiredInteger(value: unknown, column: string): number {
  if (!Number.isInteger(value)) {
    throw new Error(`product event outbox ${column} is invalid`);
  }
  return value as number;
}

function requiredTimestamp(value: unknown, column: string): string {
  const timestamp = requiredString(value, column);
  if (!Number.isFinite(Date.parse(timestamp))) {
    throw new Error(`product event outbox ${column} is invalid`);
  }
  return timestamp;
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} is invalid`);
  }
  return value as Record<string, unknown>;
}

function parseClaimLimit(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new Error("telemetry outbox claim limit must be between 1 and 100");
  }
  return value;
}

function parseOutboxErrorClass(
  value: unknown,
): Exclude<TelemetryErrorClass, "none"> {
  if (
    typeof value !== "string" ||
    value === "none" ||
    !(TELEMETRY_ERROR_CLASSES as readonly string[]).includes(value)
  ) {
    throw new Error("telemetry outbox error class is not approved");
  }
  return value as Exclude<TelemetryErrorClass, "none">;
}

function projectRow<T extends ProductEventRow | GenerationAttemptRow>(
  source: Record<string, unknown>,
  shape: T,
): T {
  return Object.fromEntries(
    Object.keys(shape).map((key) => [key, source[key]]),
  ) as T;
}
