export type AlternateStoryRequest = { sessionId: string; token: string };
export type AlternateCapabilityRequest = { sessionId: string };

export type AlternateStoryRequestParseResult =
  | AlternateStoryRequest
  | { error: string };

export function parseAlternateStoryRequest(
  value: unknown,
): AlternateStoryRequestParseResult {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Alternate story body must be an object." };
  }
  const candidate = value as Record<string, unknown>;
  if (Object.keys(candidate).sort().join(",") !== "sessionId,token") {
    return { error: "Alternate story request contains unsupported fields." };
  }
  if (
    typeof candidate.sessionId !== "string" ||
    !/^[0-9a-f]{32}$/.test(candidate.sessionId)
  ) {
    return { error: "Story session is invalid." };
  }
  if (
    typeof candidate.token !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(candidate.token)
  ) {
    return { error: "Alternate story key is invalid." };
  }
  return { sessionId: candidate.sessionId, token: candidate.token };
}


export function parseAlternateCapabilityRequest(
  value: unknown,
): AlternateCapabilityRequest | { error: string } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Alternate capability body must be an object." };
  }
  const candidate = value as Record<string, unknown>;
  if (Object.keys(candidate).join(",") !== "sessionId") {
    return { error: "Alternate capability request contains unsupported fields." };
  }
  if (
    typeof candidate.sessionId !== "string" ||
    !/^[0-9a-f]{32}$/.test(candidate.sessionId)
  ) {
    return { error: "Story session is invalid." };
  }
  return { sessionId: candidate.sessionId };
}
