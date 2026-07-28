import "server-only";
import { assertRetentionSink } from "./derived-output-retention";
import { persistenceMode } from "./persistence";
import { getMemoryOwnerStorySaveState } from "./owner-story-save-store-memory";
import { getSupabaseOwnerStorySaveState } from "./owner-story-save-store-supabase";
import type {
  OwnerStorySavePresentation,
  OwnerStorySaveState,
} from "./owner-story-save-types";

export type VerifiedOwnerLifecycle = Readonly<{
  userId: string;
  isAnonymous: boolean;
}>;

export async function getOwnerStorySavePresentation(
  owner: VerifiedOwnerLifecycle,
): Promise<OwnerStorySavePresentation> {
  assertRetentionSink("owner.save_state", "request_memory");
  let state: OwnerStorySaveState | null;
  try {
    state =
      persistenceMode() === "supabase"
        ? await getSupabaseOwnerStorySaveState(owner.userId)
        : getMemoryOwnerStorySaveState(owner.userId);
  } catch {
    return present({ status: "unavailable", reason: "read_error" });
  }

  if (owner.isAnonymous) {
    return state
      ? present({ status: "unavailable", reason: "integrity_conflict" })
      : present({ status: "temporary" });
  }
  if (!state) {
    return present({ status: "unavailable", reason: "integrity_conflict" });
  }
  return present({
    status: "saved",
    evidence:
      state.evidenceKind === "legacy_permanent_observed"
        ? "legacy"
        : "current",
  });
}

// Anonymous owners always create under the bounded guest lifecycle. A
// permanent owner may create only when the durable account Save evidence is
// readable and coherent; otherwise a new story would outlive the guest window
// without an informed Save transition.
export async function canOwnerCreateStory(
  owner: VerifiedOwnerLifecycle,
): Promise<boolean> {
  if (owner.isAnonymous) return true;
  return (await getOwnerStorySavePresentation(owner)).status === "saved";
}

function present(
  presentation: OwnerStorySavePresentation,
): OwnerStorySavePresentation {
  assertRetentionSink("owner.save_state", "owner_response");
  return Object.freeze(presentation);
}
