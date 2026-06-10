import type { NextRequest } from "next/server";
import { refreshAuthSession } from "@/lib/supabase/middleware";

// Edge-bundle hygiene: this file may import ONLY lib/supabase/middleware.ts (see the
// import rules documented there).
export async function middleware(request: NextRequest) {
  return refreshAuthSession(request);
}

export const config = {
  // Everything except static assets — /api/* included deliberately, so API calls
  // also refresh tokens.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
