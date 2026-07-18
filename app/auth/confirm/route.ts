import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import {
  ACCOUNT_REAUTH_CONTINUATION_COOKIE,
  accountReauthContinuationTokenDisposition,
} from "@/lib/account-deletion-token";
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
  // Same-origin paths only — no open redirect. Blocks "//" AND "/\": browsers
  // normalize backslashes to slashes in URLs, so "/\example.com" would become a
  // protocol-relative redirect to example.com.
  const next = /^\/(?![/\\])/.test(rawNext) ? rawNext : "/stories";

  if (tokenHash && type) {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      const cookieStore = await cookies();
      const continuation = cookieStore.get(
        ACCOUNT_REAUTH_CONTINUATION_COOKIE,
      )?.value;
      cookieStore.set(ACCOUNT_REAUTH_CONTINUATION_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
        path: "/auth/confirm",
      });
      if (
        data.user &&
        accountReauthContinuationTokenDisposition(
          continuation,
          data.user.id,
        ) === "valid"
      ) {
        redirect("/account/delete");
      }
      redirect(next);
    }
  }

  // Expired, already used, or malformed link — /signin explains and offers a new one.
  redirect("/signin?error=link");
}
