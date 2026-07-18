import {
  accountDeletionAuthenticationStatus,
  clearAuthSessionAfterAccountDeletion,
  getAccountAuthContext,
} from "@/lib/auth";
import { deleteOwnedAccount } from "@/lib/account-deletion";
import {
  ACCOUNT_DELETION_SUCCESS_COOKIE,
  accountDeletionTokenDisposition,
  issueAccountDeletionSuccessReceipt,
} from "@/lib/account-deletion-token";

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
    (entries.length !== 2 && entries.length !== 3) ||
    (keys !== "csrfToken,intent" &&
      keys !== "csrfToken,intent,understood") ||
    form.get("intent") !== "delete_account"
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
  const authStatus = accountDeletionAuthenticationStatus(context);
  if (authStatus === "unavailable") {
    return redirectResponse(new URL("/account/delete?error=auth", request.url));
  }
  if (authStatus === "stale") {
    return redirectResponse(
      new URL("/account/delete?error=reauth", request.url),
    );
  }

  const csrfToken = form.get("csrfToken");
  let disposition: ReturnType<typeof accountDeletionTokenDisposition>;
  try {
    disposition = accountDeletionTokenDisposition(
      csrfToken,
      context.userId,
    );
  } catch {
    return textResponse("Deletion is temporarily unavailable.", 503);
  }
  if (disposition === "expired") {
    return redirectResponse(
      new URL("/account/delete?error=expired", request.url),
    );
  }
  if (disposition !== "valid") return textResponse("Forbidden.", 403);
  if (form.get("understood") !== "delete_account_and_stories") {
    return redirectResponse(
      new URL("/account/delete?error=understood", request.url),
    );
  }

  // Mint before mutation so an unexpected secret/configuration failure cannot
  // delete the account and then strand the owner without a truthful result.
  let successReceipt: string;
  try {
    successReceipt = issueAccountDeletionSuccessReceipt();
  } catch {
    return redirectResponse(
      new URL("/account/delete?error=temporary", request.url),
    );
  }

  try {
    // The authenticated owner is the only identity supplied to the mutation.
    // A concurrent/replayed not-found is the same desired privacy state.
    await deleteOwnedAccount({
      userId: context.userId,
      deletionRequestSeed: csrfToken ?? undefined,
    });
  } catch {
    return redirectResponse(
      new URL("/account/delete?error=temporary", request.url),
    );
  }
  await clearAuthSessionAfterAccountDeletion();
  const response = redirectResponse(new URL("/account-deleted", request.url));
  response.headers.append(
    "set-cookie",
    accountDeletionSuccessCookie(successReceipt),
  );
  return response;
}

function accountDeletionSuccessCookie(receipt: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ACCOUNT_DELETION_SUCCESS_COOKIE}=${receipt}; Max-Age=120; Path=/account-deleted; HttpOnly; SameSite=Lax${secure}`;
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
