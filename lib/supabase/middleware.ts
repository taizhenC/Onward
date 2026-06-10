import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Auth-token refresh for every request. This module runs in the EDGE runtime via the
// root middleware.ts — it must import nothing beyond @supabase/ssr and next/server
// (no lib/db.ts, lib/session.ts, lib/rate-limit.ts: those pull node:crypto and the
// service-role env into the edge bundle).
//
// Why middleware is mandatory, not a nicety: server components cannot write cookies,
// so a token refresh that happens during a /story render can't persist the rotated
// refresh token — with token rotation that eventually invalidates the session. This
// is the one place the refreshed cookies reliably reach the browser.
export async function refreshAuthSession(
  request: NextRequest,
): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next(); // memory/offline dev: no-op

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Write-through BOTH sides: the mutated request (so the downstream handler
        // in this same navigation sees fresh tokens) and a recreated response (so
        // the browser persists them). Dropping either silently signs users out.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // This call IS the refresh — it must run immediately after client creation.
  // No gating, no redirects here; pages and routes 404/401 themselves.
  await supabase.auth.getUser();

  return response;
}
