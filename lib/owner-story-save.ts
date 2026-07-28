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
    return present({ status: "unavailable" });
  }

  if (owner.isAnonymous) {
    return state
      ? present({ status: "unavailable" })
      : present({ status: "temporary" });
  }
  if (!state) return present({ status: "unavailable" });
  return present({
    status: "saved",
    evidence:
      state.evidenceKind === "legacy_permanent_observed"
        ? "legacy"
        : "current",
  });
}

function present(
  presentation: OwnerStorySavePresentation,
): OwnerStorySavePresentation {
  assertRetentionSink("owner.save_state", "owner_response");
  return Object.freeze(presentation);
}
