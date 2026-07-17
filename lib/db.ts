import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

if (typeof window !== "undefined") {
  throw new Error("lib/db.ts must not be imported on the client");
}

// Lazy, memoized Supabase client on globalThis — survives Next dev hot-reload
// (module-level state is wiped on file save; globalThis is not).
//
// Resolved on FIRST USE, not at import: lib/session.ts and lib/figures.ts import
// their supabase-backed modules unconditionally (provider-switch pattern), so this
// module is loaded even in PERSISTENCE=memory mode, where the Supabase env may be
// absent. Creating the client lazily means a memory-mode process never trips on
// missing keys — only an actual supabase path does.
//
// The service-role key bypasses RLS and must stay server-only: never NEXT_PUBLIC_,
// never shipped to the browser. The browser talks to the API routes; the routes
// talk to Supabase. This is the single createClient chokepoint.

declare global {
  var __onwardSupabase: SupabaseClient | undefined;
}

export function getSupabase(): SupabaseClient {
  if (globalThis.__onwardSupabase) return globalThis.__onwardSupabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
        "(required when PERSISTENCE=supabase).",
    );
  }

  const client = createClient(url, serviceRoleKey, {
    // Server-side service-role client: no user auth session to persist or refresh.
    auth: { persistSession: false, autoRefreshToken: false },
  });
  globalThis.__onwardSupabase = client;
  return client;
}
