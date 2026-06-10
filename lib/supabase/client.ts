import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Browser-side Supabase client — AUTH ENDPOINTS ONLY (signInAnonymously, updateUser,
// signInWithOtp, signOut). The data plane stays server-only behind the service-role
// key; RLS is default-deny with no policies, so this anon-key client can read no
// tables even if misused. (The amended CLAUDE.md rule: browser ↔ Supabase Auth only.)
//
// Returns null when the public env is absent (memory/offline dev) — callers skip
// auth entirely and the server falls back to LOCAL_DEV_USER_ID.
// createBrowserClient memoizes internally, so calling this per-render is fine.
export function getSupabaseBrowser(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
