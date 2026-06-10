import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Email-link landing for all three flows (the dashboard templates all point here in
// token_hash form — PKCE ?code= links only redeem in the originating browser):
//   - anonymous → permanent upgrade ("Confirm email change"): type=email_change
//   - magic-link sign-in / first-time signup:                  type=email
// verifyOtp writes the auth cookies via the route-handler cookie store.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next") ?? "/stories";
  // Same-origin paths only — no open redirect.
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/stories";

  if (tokenHash && type) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) redirect(next);
  }

  // Expired, already used, or malformed link — /signin explains and offers a new one.
  redirect("/signin?error=link");
}
