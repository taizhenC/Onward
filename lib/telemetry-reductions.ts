import {
  parseGenerationAttempt,
  parseProductEvent,
} from "./telemetry-schema";
import type {
  GenerationAttempt,
  GenerationOperation,
  LatencyBucket,
  ProductEvent,
  StatusBucket,
  TelemetryArtifactFallbackReason,
  TelemetryErrorClass,
  TelemetryProvider,
  ValidationOutcome,
} from "./telemetry-types";

export function latencyBucketForMs(durationMs: unknown): LatencyBucket {
  if (
    typeof durationMs !== "number" ||
    !Number.isFinite(durationMs) ||
    durationMs < 0 ||
    durationMs > 3_600_000
  ) {
    throw new Error("telemetry duration must be between 0 and 3600000ms");
  }
  if (durationMs < 250) return "lt250ms";
  if (durationMs <= 500) return "250to500ms";
  if (durationMs < 1_000) return "500ms_to1s";
  if (durationMs < 3_000) return "1to3s";
  if (durationMs < 6_000) return "3to6s";
  if (durationMs <= 8_000) return "6to8s";
  if (durationMs <= 15_000) return "8to15s";
  return "gt15s";
}

export function reduceFlowFailure(input: {
  domain:
    | "auth"
    | "database"
    | "matching"
    | "composition"
    | "reader"
    | "feedback"
    | "alternate"
    | "deletion";
  error: unknown;
  durationMs: unknown;
}): Readonly<Extract<ProductEvent, { event: "flow_failed" }>> {
  const reduced = reduceError(input.error);
  return parseProductEvent({
    event: "flow_failed",
    domain: input.domain,
    errorClass: reduced.errorClass,
    statusBucket: reduced.statusBucket,
    latencyBucket: latencyBucketForMs(input.durationMs),
  }) as Readonly<Extract<ProductEvent, { event: "flow_failed" }>>;
}

export function reduceGenerationAttempt(input: {
  operation: GenerationOperation;
  recipeId: GenerationAttempt["recipeId"];
  provider: TelemetryProvider;
  outcome: GenerationAttempt["outcome"];
  attempt: GenerationAttempt["attempt"];
  durationMs: unknown;
  error?: unknown;
  fallbackReason?: TelemetryArtifactFallbackReason;
  validationOutcome: ValidationOutcome;
  costMicros: unknown;
}): Readonly<GenerationAttempt> {
  const reduced =
    input.outcome === "success"
      ? { errorClass: "none" as const, statusBucket: "ok" as const }
      : input.outcome === "fallback" &&
          input.fallbackReason === "canonical_only"
        ? {
            errorClass: "none" as const,
            statusBucket: "not_applicable" as const,
          }
      : reduceError(input.error);
  return parseGenerationAttempt({
    operation: input.operation,
    recipeId: input.recipeId,
    provider: input.provider,
    outcome: input.outcome,
    attempt: input.attempt,
    latencyBucket: latencyBucketForMs(input.durationMs),
    statusBucket: reduced.statusBucket,
    errorClass: reduced.errorClass,
    fallbackReason:
      input.outcome === "fallback" ? input.fallbackReason : "none",
    validationOutcome: input.validationOutcome,
    costMicros: input.costMicros,
  });
}

function reduceError(error: unknown): {
  errorClass: Exclude<TelemetryErrorClass, "none">;
  statusBucket: Exclude<StatusBucket, "ok">;
} {
  const status = safeNumberProperty(error, "status");
  const knownClass = safeStringProperty(error, "errorClass");
  const name = safeStringProperty(error, "name");

  if (name === "AbortError" || knownClass === "timeout") {
    return { errorClass: "timeout", statusBucket: "timeout" };
  }
  if (status === 429 || knownClass === "rate_limited") {
    return { errorClass: "rate_limited", statusBucket: "rate_limited" };
  }
  if (status === 401 || status === 403 || knownClass === "unauthorized") {
    return { errorClass: "unauthorized", statusBucket: "unauthorized" };
  }
  if (knownClass === "network") {
    return { errorClass: "network", statusBucket: "network" };
  }
  if (knownClass === "no_key" || knownClass === "not_configured") {
    return { errorClass: "not_configured", statusBucket: "not_applicable" };
  }
  if (knownClass === "parse" || knownClass === "bad_dim") {
    return { errorClass: "invalid_output", statusBucket: "upstream" };
  }
  if (knownClass === "invalid_output") {
    return { errorClass: "invalid_output", statusBucket: "upstream" };
  }
  if (knownClass === "validation_rejected") {
    return { errorClass: "validation_rejected", statusBucket: "invalid_request" };
  }
  if (knownClass === "database") {
    return { errorClass: "database", statusBucket: "not_applicable" };
  }
  if (knownClass === "conflict") {
    return { errorClass: "conflict", statusBucket: "invalid_request" };
  }
  if (knownClass === "upstream" || knownClass === "http") {
    return {
      errorClass: "upstream",
      statusBucket:
        status !== null && status >= 400 && status < 500
          ? "invalid_request"
          : "upstream",
    };
  }
  if (status !== null && status >= 400 && status < 500) {
    return { errorClass: "upstream", statusBucket: "invalid_request" };
  }
  if (status !== null && status >= 500) {
    return { errorClass: "upstream", statusBucket: "upstream" };
  }
  return { errorClass: "unknown", statusBucket: "not_applicable" };
}

function safeStringProperty(value: unknown, key: string): string | null {
  try {
    if (value === null || typeof value !== "object") return null;
    const candidate = (value as Record<string, unknown>)[key];
    return typeof candidate === "string" ? candidate : null;
  } catch {
    return null;
  }
}

function safeNumberProperty(value: unknown, key: string): number | null {
  try {
    if (value === null || typeof value !== "object") return null;
    const candidate = (value as Record<string, unknown>)[key];
    return typeof candidate === "number" && Number.isInteger(candidate)
      ? candidate
      : null;
  } catch {
    return null;
  }
}
