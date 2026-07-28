import "server-only";
import {
  LEGACY_OWNER_STORY_SAVE_POLICY_VERSION,
  OWNER_STORY_SAVE_POLICY_VERSION,
  OWNER_STORY_SAVE_RETENTION_POLICY_VERSION,
  type OwnerStorySaveEvidenceKind,
  type OwnerStorySaveState,
} from "./owner-story-save-types";

declare global {
  var __onwardOwnerStorySaveStates:
    | Map<string, OwnerStorySaveState>
    | undefined;
}

const saveStates =
  globalThis.__onwardOwnerStorySaveStates ??
  (globalThis.__onwardOwnerStorySaveStates = new Map());

export function getMemoryOwnerStorySaveState(
  userId: string,
): OwnerStorySaveState | null {
  const state = saveStates.get(userId);
  return state ? deepFreeze(structuredClone(state)) : null;
}

// Memory mode has no managed Auth trigger. Tests call this narrow seam at the
// same logical boundary so the adapter can prove first-evidence-wins behavior
// without letting application code write Save State.
export function _recordMemoryOwnerStorySaveTransitionForTests(input: {
  userId: string;
  evidenceKind: Exclude<
    OwnerStorySaveEvidenceKind,
    "legacy_permanent_observed"
  >;
  occurredAt: number;
}): OwnerStorySaveState {
  const existing = saveStates.get(input.userId);
  if (existing) return deepFreeze(structuredClone(existing));
  if (
    input.userId.length === 0 ||
    !Number.isSafeInteger(input.occurredAt) ||
    input.occurredAt < 0
  ) {
    throw new Error("memory owner story save transition is invalid");
  }
  const state: OwnerStorySaveState = deepFreeze({
    userId: input.userId,
    savedAt: input.occurredAt,
    observedAt: input.occurredAt,
    evidenceKind: input.evidenceKind,
    savePolicyVersion: OWNER_STORY_SAVE_POLICY_VERSION,
    retention: {
      policyVersion: OWNER_STORY_SAVE_RETENTION_POLICY_VERSION,
      retentionClass: "owned_story" as const,
    },
  });
  saveStates.set(input.userId, state);
  return deepFreeze(structuredClone(state));
}

export function _recordLegacyMemoryOwnerStorySaveForTests(input: {
  userId: string;
  observedAt: number;
}): OwnerStorySaveState {
  const existing = saveStates.get(input.userId);
  if (existing) return deepFreeze(structuredClone(existing));
  if (
    input.userId.length === 0 ||
    !Number.isSafeInteger(input.observedAt) ||
    input.observedAt < 0
  ) {
    throw new Error("memory legacy owner story save observation is invalid");
  }
  const state: OwnerStorySaveState = deepFreeze({
    userId: input.userId,
    savedAt: null,
    observedAt: input.observedAt,
    evidenceKind: "legacy_permanent_observed" as const,
    savePolicyVersion: LEGACY_OWNER_STORY_SAVE_POLICY_VERSION,
    retention: {
      policyVersion: OWNER_STORY_SAVE_RETENTION_POLICY_VERSION,
      retentionClass: "owned_story" as const,
    },
  });
  saveStates.set(input.userId, state);
  return deepFreeze(structuredClone(state));
}

export function deleteMemoryOwnerStorySaveStateForUser(userId: string): void {
  saveStates.delete(userId);
}

export function _clearMemoryOwnerStorySaveStatesForTests(): void {
  saveStates.clear();
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
