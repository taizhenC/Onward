import "server-only";
import { isDeepStrictEqual } from "node:util";
import { getSupabase } from "./db";
import type { TelemetryWriteResult } from "./telemetry-store-memory";
import type {
  GenerationAttemptRecord,
  ProductEventRecord,
  TelemetryFlowId,
} from "./telemetry-types";

type ProductEventRow = ReturnType<typeof toProductEventRow>;
type GenerationAttemptRow = ReturnType<typeof toGenerationAttemptRow>;

export async function appendSupabaseProductEvent(
  record: Readonly<ProductEventRecord>,
): Promise<TelemetryWriteResult> {
  const row = toProductEventRow(record);
  const inserted = await getSupabase().from("product_events").insert(row);
  if (!inserted.error) return "created";
  if (inserted.error.code !== "23505") {
    throw new Error("product event could not be stored");
  }
  const existing = await getSupabase()
    .from("product_events")
    .select("*")
    .eq("event_id", record.eventId)
    .maybeSingle();
  if (existing.error || !existing.data) {
    throw new Error("product event idempotency could not be verified");
  }
  return isDeepStrictEqual(projectRow(existing.data, row), row)
    ? "duplicate"
    : "conflict";
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

export async function deleteSupabaseProductEventsForFlow(
  flowId: TelemetryFlowId,
): Promise<number> {
  const result = await getSupabase()
    .from("product_events")
    .delete({ count: "exact" })
    .eq("flow_id", flowId);
  if (result.error) throw new Error("product events could not be deleted");
  return result.count ?? 0;
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

function projectRow<T extends ProductEventRow | GenerationAttemptRow>(
  source: Record<string, unknown>,
  shape: T,
): T {
  return Object.fromEntries(
    Object.keys(shape).map((key) => [key, source[key]]),
  ) as T;
}
