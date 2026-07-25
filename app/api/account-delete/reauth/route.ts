import { cookies } from "next/headers";
import {
  accountDeletionAuthenticationStatus,
  getAccountAuthContext,
} from "@/lib/auth";
import {
  ACCOUNT_REAUTH_CONTINUATION_COOKIE,
  accountReauthRequestTokenDisposition,
  issueAccountReauthContinuationToken,
} from "@/lib/account-deletion-token";
import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_BODY_LENGTH = 2_048;

export async function POST(request: Request): Promise<Response> {
  if (!isTrustedMutationRequest(request)) return textResponse("Forbidden.", 403);
  const encoded = await readFormBody(request);
  if (encoded === null) return textResponse("Invalid request.", 400);
  const form = new URLSearchParams(encoded);
  const entries = [...form.entries()];
  const keys = entries.map(([key]) => key).sort().join(",");
  if (
    entries.length !== 2 ||
    keys !== "csrfToken,intent" ||
    form.get("intent") !== "reauthenticate_account_deletion"
  ) {
    return textResponse("Invalid request.", 400);
  }

  let context: Awaited<ReturnType<typeof getAccountAuthContext>>;
  try {
    context = await getAccountAuthContext();
  } catch {
    return redirectResponse(new URL("/signin", request.url));
  }
  if (!context) return redirectResponse(new URL("/signin", request.url));
  const status = accountDeletionAuthenticationStatus(context);
  if (status === "guest" || status === "fresh") {
    return redirectResponse(new URL("/account/delete", request.url));
  }
  if (status === "unavailable" || !context.email) {
    return redirectResponse(new URL("/account/delete?error=auth", request.url));
  }

  const csrfToken = form.get("csrfToken");
  let disposition: ReturnType<typeof accountReauthRequestTokenDisposition>;
  try {
    disposition = accountReauthRequestTokenDisposition(
      csrfToken,
      context.userId,
    );
  } catch {
    return redirectResponse(new URL("/account/delete?error=auth", request.url));
  }
  if (disposition === "expired") {
    return redirectResponse(
      new URL("/account/delete?error=reauth_expired", request.url),
    );
  }
  if (disposition !== "valid") return textResponse("Forbidden.", 403);

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email: context.email,
    options: { shouldCreateUser: false },
  });
  if (error) {
    const reason =
      error.code === "over_email_send_rate_limit"
        ? "reauth_rate"
        : "reauth_send";
    return redirectResponse(
      new URL(`/account/delete?error=${reason}`, request.url),
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(
    ACCOUNT_REAUTH_CONTINUATION_COOKIE,
    issueAccountReauthContinuationToken(context.userId),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      path: "/auth/confirm",
    },
  );
  return redirectResponse(new URL("/account/delete?reauth=sent", request.url));
}

async function readFormBody(request: Request): Promise<string | null> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
  if (contentType !== "application/x-www-form-urlencoded") return null;
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_LENGTH) {
    return null;
  }
  try {
    const encoded = await request.text();
    return encoded.length > 0 && encoded.length <= MAX_BODY_LENGTH
      ? encoded
      : null;
  } catch {
    return null;
  }
}

function isTrustedMutationRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return false;
  }
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function redirectResponse(location: URL): Response {
  return new Response(null, {
    status: 303,
    headers: { location: location.toString(), "cache-control": "no-store" },
  });
}

function textResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
