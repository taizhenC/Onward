import { MATCH_RECOVERY_POLICY_VERSION } from "./match-recovery";
import { SELECTABLE_STORY_RECIPE_IDS } from "./story-recipe-runtime";

export const PRODUCT_EVENT_SCHEMA_VERSION = "product-event-v1-2026-07";
export const GENERATION_ATTEMPT_SCHEMA_VERSION =
  "generation-attempt-v1-2026-07";
export const PRODUCT_EVENT_RETENTION_DAYS = 30;
export const TELEMETRY_FLOW_RETENTION_DAYS = 30;
export const GENERATION_ATTEMPT_RETENTION_DAYS = 14;

export const APPROVED_TELEMETRY_RECIPE_IDS = SELECTABLE_STORY_RECIPE_IDS;
export type ApprovedTelemetryRecipeId =
  (typeof APPROVED_TELEMETRY_RECIPE_IDS)[number];

export const STORY_ROLES = ["initial", "alternate"] as const;
export type StoryRole = (typeof STORY_ROLES)[number];

export const LATENCY_BUCKETS = [
  "lt250ms",
  "250to500ms",
  "500ms_to1s",
  "1to3s",
  "3to6s",
  "6to8s",
  "8to15s",
  "gt15s",
] as const;
export type LatencyBucket = (typeof LATENCY_BUCKETS)[number];

export const STATUS_BUCKETS = [
  "ok",
  "invalid_request",
  "unauthorized",
  "rate_limited",
  "upstream",
  "timeout",
  "network",
  "not_applicable",
] as const;
export type StatusBucket = (typeof STATUS_BUCKETS)[number];

export const TELEMETRY_ERROR_CLASSES = [
  "none",
  "not_configured",
  "timeout",
  "rate_limited",
  "unauthorized",
  "network",
  "upstream",
  "invalid_output",
  "validation_rejected",
  "database",
  "conflict",
  "unknown",
] as const;
export type TelemetryErrorClass =
  (typeof TELEMETRY_ERROR_CLASSES)[number];

export const ARTIFACT_FALLBACK_REASONS = [
  "none",
  "canonical_only",
  "provider_timeout",
  "provider_error",
  "provider_output_invalid",
  "validator_rejected",
] as const;
export type TelemetryArtifactFallbackReason =
  (typeof ARTIFACT_FALLBACK_REASONS)[number];

declare const telemetryFlowIdBrand: unique symbol;
declare const telemetryEventIdBrand: unique symbol;
declare const telemetryOccurrenceIdBrand: unique symbol;
declare const telemetryOutboxLeaseIdBrand: unique symbol;
declare const generationAttemptIdBrand: unique symbol;
declare const deletionCorrelationIdBrand: unique symbol;
export type TelemetryFlowId = string & {
  readonly [telemetryFlowIdBrand]: "TelemetryFlowId";
};
export type TelemetryEventId = string & {
  readonly [telemetryEventIdBrand]: "TelemetryEventId";
};
export type TelemetryOccurrenceId = string & {
  readonly [telemetryOccurrenceIdBrand]: "TelemetryOccurrenceId";
};
export type TelemetryOutboxLeaseId = string & {
  readonly [telemetryOutboxLeaseIdBrand]: "TelemetryOutboxLeaseId";
};
export type GenerationAttemptId = string & {
  readonly [generationAttemptIdBrand]: "GenerationAttemptId";
};
export type DeletionCorrelationId = string & {
  readonly [deletionCorrelationIdBrand]: "DeletionCorrelationId";
};

export type ProductEvent =
  | {
      event: "landing_cta_clicked";
      surface: "home_primary";
    }
  | {
      event: "intake_started";
      viewportBucket: "small" | "large";
    }
  | { event: "intake_submitted" }
  | {
      event: "auth_established";
      authMethod: "anonymous" | "email_link" | "password";
    }
  | { event: "crisis_intercepted" }
  | {
      event: "rate_limited";
      operation:
        | "intake"
        | "feedback"
        | "alternate_story"
        | "historical_concern"
        | "auth";
      limitScope: "user" | "ip";
    }
  | {
      event: "match_completed";
      recipeId: ApprovedTelemetryRecipeId;
      storyRole: StoryRole;
      disposition:
        | "close"
        | "adjacent"
        | "clarification_required"
        | "no_close_match";
      confidenceBucket: "high" | "medium" | "low" | "not_applicable";
      matchPath: "rerank" | "keyword_fallback" | "not_run";
      ageFallback: boolean;
      boundaryOutcome: "not_set" | "passed" | "no_eligible";
    }
  | {
      event: "clarification_shown";
      policyVersion: typeof MATCH_RECOVERY_POLICY_VERSION;
    }
  | {
      event: "artifact_created";
      recipeId: ApprovedTelemetryRecipeId;
      storyRole: StoryRole;
      compositionMode: "hybrid" | "canonical_fallback";
      fallbackReason: TelemetryArtifactFallbackReason;
      attemptBucket: "not_attempted" | "first" | "retry" | "exhausted";
    }
  | {
      event: "first_content_shown";
      storyRole: StoryRole;
      latencyBucket: LatencyBucket;
    }
  | {
      event: "passage_acknowledged";
      storyRole: StoryRole;
      passageOrdinal: number;
    }
  | {
      event: "passage_presented";
      storyRole: StoryRole;
      passageOrdinal: number;
      latencyBucket: LatencyBucket;
    }
  | {
      event: "story_completed";
      storyRole: StoryRole;
    }
  | {
      event: "source_opened";
      storyRole: StoryRole;
    }
  | {
      event: "feedback_submitted";
      storyRole: StoryRole;
      verdict: "felt_close" | "not_close";
    }
  | { event: "alternate_requested" }
  | {
      event: "alternate_resolved";
      outcome: "ready" | "unavailable" | "expired" | "exhausted" | "failed";
    }
  | {
      event: "story_saved";
      storyRole: StoryRole;
    }
  | {
      event: "saved_story_reopened";
      storyRole: StoryRole;
      ageBucket: "lt7d" | "7to30d";
    }
  | {
      event: "deletion_requested";
      deletionId: DeletionCorrelationId;
      scope: "story" | "account";
    }
  | {
      event: "deletion_completed";
      deletionId: DeletionCorrelationId;
      scope: "story" | "account";
      latencyBucket: LatencyBucket;
    }
  | {
      event: "flow_failed";
      domain:
        | "auth"
        | "database"
        | "matching"
        | "composition"
        | "reader"
        | "feedback"
        | "alternate"
        | "deletion";
      errorClass: Exclude<TelemetryErrorClass, "none">;
      statusBucket: Exclude<StatusBucket, "ok">;
      latencyBucket: LatencyBucket;
    };

export type ProductEventRecord = ProductEvent & {
  eventId: TelemetryEventId;
  schemaVersion: typeof PRODUCT_EVENT_SCHEMA_VERSION;
  flowId: TelemetryFlowId | null;
  occurredAt: string;
  expiresAt: string;
};

export const PRODUCT_EVENT_OUTBOX_STATUSES = [
  "pending",
  "leased",
  "delivered",
  "exhausted",
] as const;
export type ProductEventOutboxStatus =
  (typeof PRODUCT_EVENT_OUTBOX_STATUSES)[number];
export type TelemetryOutboxAckResult =
  | "acknowledged"
  | "duplicate"
  | "exhausted"
  | "stale"
  | "not_found";
export type TelemetryOutboxNackResult =
  | "released"
  | "exhausted"
  | "delivered"
  | "stale"
  | "not_found";

export type ProductEventCapture<
  Event extends ProductEvent = ProductEvent,
> = Event & {
  eventId: TelemetryEventId;
  schemaVersion: typeof PRODUCT_EVENT_SCHEMA_VERSION;
  flowId: TelemetryFlowId | null;
};

export type ProductEventOutboxPointer = {
  eventId: TelemetryEventId;
  status: ProductEventOutboxStatus;
  attemptCount: number;
  nextAttemptAt: string;
  leaseId: TelemetryOutboxLeaseId | null;
  leaseExpiresAt: string | null;
  lastErrorClass: Exclude<TelemetryErrorClass, "none"> | null;
};

export type ClaimedProductEvent = ProductEventRecord & {
  attemptCount: number;
  leaseId: TelemetryOutboxLeaseId;
};

export const PRODUCT_EVENT_NAMES = [
  "landing_cta_clicked",
  "intake_started",
  "intake_submitted",
  "auth_established",
  "crisis_intercepted",
  "rate_limited",
  "match_completed",
  "clarification_shown",
  "artifact_created",
  "first_content_shown",
  "passage_presented",
  "passage_acknowledged",
  "story_completed",
  "source_opened",
  "feedback_submitted",
  "alternate_requested",
  "alternate_resolved",
  "story_saved",
  "saved_story_reopened",
  "deletion_requested",
  "deletion_completed",
  "flow_failed",
] as const satisfies readonly ProductEvent["event"][];

export const UNLINKABLE_PRODUCT_EVENTS = [
  "crisis_intercepted",
  "rate_limited",
  "deletion_requested",
  "deletion_completed",
] as const satisfies readonly ProductEvent["event"][];

export const GENERATION_OPERATIONS = [
  "catalog",
  "embedding",
  "rerank",
  "compose",
  "validate",
  "persist",
] as const;
export type GenerationOperation = (typeof GENERATION_OPERATIONS)[number];

export const TELEMETRY_PROVIDERS = [
  "internal",
  "cerebras",
  "gemini",
  "supabase",
] as const;
export type TelemetryProvider = (typeof TELEMETRY_PROVIDERS)[number];

export const VALIDATION_OUTCOMES = [
  "not_run",
  "passed",
  "schema_rejected",
  "evidence_rejected",
  "privacy_rejected",
  "tone_rejected",
  "boundary_rejected",
  "other_rejected",
] as const;
export type ValidationOutcome = (typeof VALIDATION_OUTCOMES)[number];

export type GenerationAttempt = {
  operation: GenerationOperation;
  recipeId: ApprovedTelemetryRecipeId;
  provider: TelemetryProvider;
  outcome: "success" | "fallback" | "failure";
  attempt: "first" | "retry";
  latencyBucket: LatencyBucket;
  statusBucket: StatusBucket;
  errorClass: TelemetryErrorClass;
  fallbackReason: TelemetryArtifactFallbackReason;
  validationOutcome: ValidationOutcome;
  costMicros: number;
};

export type GenerationAttemptRecord = GenerationAttempt & {
  attemptId: GenerationAttemptId;
  schemaVersion: typeof GENERATION_ATTEMPT_SCHEMA_VERSION;
  occurredAt: string;
  expiresAt: string;
};
