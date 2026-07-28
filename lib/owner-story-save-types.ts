export const OWNER_STORY_SAVE_POLICY_VERSION =
  "durable-account-save-v1-2026-07";
export const LEGACY_OWNER_STORY_SAVE_POLICY_VERSION =
  "legacy-pre-durable-save-v0";
export const OWNER_STORY_SAVE_RETENTION_POLICY_VERSION =
  "derived-output-retention-v1-2026-07";

export const OWNER_STORY_SAVE_EVIDENCE_KINDS = Object.freeze([
  "anonymous_upgrade",
  "legacy_permanent_observed",
] as const);

export type OwnerStorySaveEvidenceKind =
  (typeof OWNER_STORY_SAVE_EVIDENCE_KINDS)[number];

export type OwnerStorySaveState = Readonly<{
  userId: string;
  savedAt: number | null;
  observedAt: number;
  evidenceKind: OwnerStorySaveEvidenceKind;
  savePolicyVersion:
    | typeof OWNER_STORY_SAVE_POLICY_VERSION
    | typeof LEGACY_OWNER_STORY_SAVE_POLICY_VERSION;
  retention: Readonly<{
    policyVersion: typeof OWNER_STORY_SAVE_RETENTION_POLICY_VERSION;
    retentionClass: "owned_story";
  }>;
}>;

export type OwnerStorySavePresentation =
  | Readonly<{ status: "temporary" }>
  | Readonly<{
      status: "saved";
      evidence: "current" | "legacy";
    }>
  | Readonly<{ status: "unavailable" }>;

export type PersistedOwnerStorySaveRow = Readonly<{
  user_id: unknown;
  saved_at: unknown;
  observed_at: unknown;
  evidence_kind: unknown;
  save_policy_version: unknown;
  retention_policy_version: unknown;
  retention_class: unknown;
}>;

export function parseOwnerStorySaveState(
  value: unknown,
  expectedUserId: string,
): OwnerStorySaveState {
  if (
    !isExactRecord(
      value,
      [
        "evidence_kind",
        "observed_at",
        "retention_class",
        "retention_policy_version",
        "save_policy_version",
        "saved_at",
        "user_id",
      ],
    ) ||
    value.user_id !== expectedUserId ||
    typeof value.observed_at !== "string"
  ) {
    throw new Error("owner story save state is invalid");
  }

  const observedAt = parseTimestamp(value.observed_at);
  const retention = parseCurrentRetention(value);
  const evidenceKind = value.evidence_kind;

  if (evidenceKind === "anonymous_upgrade") {
    if (
      typeof value.saved_at !== "string" ||
      value.save_policy_version !== OWNER_STORY_SAVE_POLICY_VERSION
    ) {
      throw new Error("current owner story save evidence is invalid");
    }
    const savedAt = parseTimestamp(value.saved_at);
    if (savedAt !== observedAt) {
      throw new Error("owner story save timestamps do not match");
    }
    return deepFreeze({
      userId: expectedUserId,
      savedAt,
      observedAt,
      evidenceKind,
      savePolicyVersion: OWNER_STORY_SAVE_POLICY_VERSION,
      retention,
    });
  }

  if (
    evidenceKind === "legacy_permanent_observed" &&
    value.saved_at === null &&
    value.save_policy_version === LEGACY_OWNER_STORY_SAVE_POLICY_VERSION
  ) {
    return deepFreeze({
      userId: expectedUserId,
      savedAt: null,
      observedAt,
      evidenceKind,
      savePolicyVersion: LEGACY_OWNER_STORY_SAVE_POLICY_VERSION,
      retention,
    });
  }

  throw new Error("owner story save evidence is invalid");
}

function parseCurrentRetention(value: Record<string, unknown>) {
  if (
    value.retention_policy_version !==
      OWNER_STORY_SAVE_RETENTION_POLICY_VERSION ||
    value.retention_class !== "owned_story"
  ) {
    throw new Error("owner story save retention label is invalid");
  }
  return Object.freeze({
    policyVersion: OWNER_STORY_SAVE_RETENTION_POLICY_VERSION,
    retentionClass: "owned_story",
  });
}

function parseTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new Error("owner story save timestamp is invalid");
  }
  return timestamp;
}

function isExactRecord(
  value: unknown,
  expectedKeys: readonly string[],
): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value).sort();
  return (
    keys.length === expectedKeys.length &&
    keys.every((key, index) => key === expectedKeys[index])
  );
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}
