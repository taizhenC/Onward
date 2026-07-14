export const ALTERNATE_STORY_POLICY_VERSION =
  "alternate-story-v1-2026-07";
export const STORY_REQUEST_CONTEXT_VERSION =
  "story-request-context-v1-2026-07";
export const ALTERNATE_STORY_CAPABILITY_TTL_MINUTES = 60;
export const ALTERNATE_STORY_CLAIM_LEASE_MINUTES = 2;
export const ALTERNATE_STORY_MAX_ATTEMPTS = 2;
export const ALTERNATE_STORY_RETRY_COOLDOWN_MS = 15_000;

export type AlternateStoryCapability = {
  token: string;
  expiresAt: string;
};

export type AlternateStoryOffer =
  | { status: "not_offered" }
  | ({ status: "available" } & AlternateStoryCapability)
  | { status: "preparing"; retryAfterMs: number }
  | { status: "ready"; sessionId: string }
  | { status: "unavailable" }
  | { status: "expired" }
  | { status: "exhausted" }
  | { status: "temporarily_unavailable"; retryAfterMs: number };

export type AlternateStoryFlowStatus =
  | "available"
  | "preparing"
  | "ready"
  | "unavailable";

export type AlternateStoryResponse =
  | { sessionId: string }
  | { noAlternate: true }
  | { inProgress: true };
