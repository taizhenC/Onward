import "server-only";

// The single auth boundary for request-scoped server code. Mirrors the PERSISTENCE
// switch in lib/session.ts: memory mode (default — offline dev, smoke) never touches
// Supabase and gets a fixed local user; supabase mode reads the @supabase/ssr cookie
// session and VALIDATES it with the Auth server (always getUser(), never getSession():
// getSession() trusts the unverified cookie JWT and must not gate ownership).
//
// The Supabase server client is loaded with a dynamic import so this module stays
// importable from plain-node scripts (tsx smoke/check-db) — next/headers only enters
// the module graph when the supabase branch actually runs inside a request.

export const LOCAL_DEV_USER_ID = "local-dev";

// Authenticated user id, or null when there is no (valid) auth session. Callers map
// null to 401 (creation paths) or 404 (session-scoped reads, via getOwnedSession).
export async function getAuthUserId(): Promise<string | null> {
  if (process.env.PERSISTENCE !== "supabase") return LOCAL_DEV_USER_ID;

  const { createSupabaseServer } = await import("./supabase/server");
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}
