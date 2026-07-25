import type { LatencyBucket } from "./telemetry-types";

// Browser-safe closed reduction shared by client visibility producers and the
// server telemetry boundary. Raw durations never cross the visibility routes.
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
