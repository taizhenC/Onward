import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Server-side Supabase AUTH client (anon key + the request's cookies). One factory
// serves both contexts:
//   - route handlers: cookieStore.set works, so /auth/confirm can persist the session;
//   - server components: cookie writes throw (Next 15 forbids them during render) —
//     swallowed below; middleware.ts is what persists refreshed tokens.
// Uses only the getAll/setAll cookie API: @supabase/ssr chunks large sessions into
// `sb-…-auth-token.0/.1` cookies, and per-cookie get/set is not chunk-safe.
//
// This client is for AUTH ONLY (getUser, verifyOtp). Data access goes through
// lib/db.ts (service role) — never through this client.
export async function createSupabaseServer() {
  const cookieStore = await cookies(); // Next 15: cookies() is async

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server-component render: cookie writes are forbidden here. Safe to
            // swallow — middleware persists refreshed tokens on the next request.
          }
        },
      },
    },
  );
}
