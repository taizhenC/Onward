import { parseBeatPositionRequest, type BeatPosition } from "./story-progress";
import { LATENCY_BUCKETS, type LatencyBucket } from "./telemetry-types";

export type FirstContentShownRequest = Readonly<{
  sessionId: string;
  latencyBucket: LatencyBucket;
}>;

export type PassagePresentedRequest = Readonly<
  BeatPosition & { latencyBucket: LatencyBucket }
>;

export type SourceOpenedRequest = Readonly<{ sessionId: string }>;

export function parseFirstContentShownRequest(
  value: unknown,
): FirstContentShownRequest | null {
  if (!hasExactKeys(value, ["sessionId", "latencyBucket"])) return null;
  const sessionId = value.sessionId;
  const latencyBucket = value.latencyBucket;
  if (typeof sessionId !== "string" || sessionId.length === 0) return null;
  if (!isLatencyBucket(latencyBucket)) return null;
  return Object.freeze({ sessionId, latencyBucket });
}

export function parsePassagePresentedRequest(
  value: unknown,
): PassagePresentedRequest | null {
  if (
    !hasExactKeys(value, [
      "sessionId",
      "beatIndex",
      "chunkIndex",
      "latencyBucket",
    ])
  ) {
    return null;
  }
  const position = parseBeatPositionRequest(value);
  if ("error" in position || !isLatencyBucket(value.latencyBucket)) return null;
  return Object.freeze({ ...position, latencyBucket: value.latencyBucket });
}

export function parseSourceOpenedRequest(
  value: unknown,
): SourceOpenedRequest | null {
  if (!hasExactKeys(value, ["sessionId"])) return null;
  return typeof value.sessionId === "string" && value.sessionId.length > 0
    ? Object.freeze({ sessionId: value.sessionId })
    : null;
}

function isLatencyBucket(value: unknown): value is LatencyBucket {
  return (
    typeof value === "string" &&
    (LATENCY_BUCKETS as readonly string[]).includes(value)
  );
}

function hasExactKeys<T extends readonly string[]>(
  value: unknown,
  expected: T,
): value is Record<T[number], unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    keys.length === sortedExpected.length &&
    keys.every((key, index) => key === sortedExpected[index])
  );
}
