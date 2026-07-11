import {
  HISTORICAL_CONCERN_REASONS,
  type HistoricalConcernReason,
} from "./story-transparency-types";

export type HistoricalConcernRequest = {
  sessionId: string;
  factId: string;
  reason: HistoricalConcernReason;
};

export function parseHistoricalConcernRequest(
  value: unknown,
): HistoricalConcernRequest | { error: string } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Historical concern body must be an object." };
  }
  const body = value as Record<string, unknown>;
  if (Object.keys(body).sort().join(",") !== "factId,reason,sessionId") {
    return { error: "Historical concern fields are invalid." };
  }
  if (typeof body.sessionId !== "string" || !/^[0-9a-f]{32}$/.test(body.sessionId)) {
    return { error: "Session ID is invalid." };
  }
  if (
    typeof body.factId !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/.test(body.factId)
  ) {
    return { error: "Fact ID is invalid." };
  }
  if (
    typeof body.reason !== "string" ||
    !HISTORICAL_CONCERN_REASONS.includes(
      body.reason as HistoricalConcernReason,
    )
  ) {
    return { error: "Historical concern reason is invalid." };
  }
  return body as HistoricalConcernRequest;
}
