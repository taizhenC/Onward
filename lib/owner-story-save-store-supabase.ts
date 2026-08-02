import "server-only";
import { getSupabase } from "./db";
import {
  parseOwnerStorySaveState,
  type OwnerStorySaveState,
  type PersistedOwnerStorySaveRow,
} from "./owner-story-save-types";

export async function getSupabaseOwnerStorySaveState(
  userId: string,
): Promise<OwnerStorySaveState | null> {
  const { data, error } = await getSupabase()
    .from("owner_story_save_states")
    .select(
      "user_id,saved_at,observed_at,evidence_kind,save_policy_version,retention_policy_version,retention_class",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("owner story save state could not be read");
  if (!data) return null;
  return parseOwnerStorySaveState(
    data as unknown as PersistedOwnerStorySaveRow,
    userId,
  );
}
