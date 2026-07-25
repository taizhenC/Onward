import "server-only";
import { getSupabase } from "./db";

export type AccountStoreDeletionResult = "deleted" | "not_found";

export async function deleteSupabaseAccount(
  userId: string,
): Promise<AccountStoreDeletionResult> {
  const first = await callAccountDeletion(userId);
  if (!first.error) {
    if (first.data === true) return "deleted";
    if (first.data === false) return "not_found";
    throw new Error("deleteSupabaseAccount returned an invalid disposition");
  }

  // One exact idempotent replay resolves the common response-loss case without
  // depending on a second service. A false replay means the first call (or a
  // concurrent duplicate) already established the requested state.
  const replay = await callAccountDeletion(userId);
  if (!replay.error) {
    if (replay.data === true || replay.data === false) return "deleted";
    throw new Error("deleteSupabaseAccount replay returned an invalid disposition");
  }

  // The transaction may have committed even if its HTTP response was lost.
  // Reconcile against the authoritative Auth record: absent means the requested
  // privacy state holds; present means no success may be claimed.
  const lookup = await getSupabase().auth.admin.getUserById(userId);
  if (!lookup.error && lookup.data.user) {
    throw new Error("deleteSupabaseAccount failed before deleting the user");
  }
  if (isMissingAuthUser(lookup.error)) return "deleted";
  throw new Error("deleteSupabaseAccount result could not be confirmed");
}

function callAccountDeletion(userId: string) {
  return getSupabase().rpc("delete_owned_account_v1", {
    p_user_id: userId,
  });
}

function isMissingAuthUser(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const candidate = error as { status?: unknown; code?: unknown };
  return (
    candidate.status === 404 ||
    candidate.code === "user_not_found" ||
    candidate.code === "not_found"
  );
}
