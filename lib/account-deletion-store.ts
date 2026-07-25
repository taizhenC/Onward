import "server-only";
import { persistenceMode } from "./persistence";
import { deleteMemoryAccount } from "./account-deletion-store-memory";
import {
  deleteSupabaseAccount,
  type AccountStoreDeletionResult,
} from "./account-deletion-store-supabase";

export type { AccountStoreDeletionResult };

export function deleteAccountAtStore(
  userId: string,
): Promise<AccountStoreDeletionResult> {
  return persistenceMode() === "supabase"
    ? deleteSupabaseAccount(userId)
    : deleteMemoryAccount(userId);
}
