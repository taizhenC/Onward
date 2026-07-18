import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { persistenceMode } from "./persistence";
import { readStrongSecret } from "./secret-config";

const TOKEN_TTL_SECONDS = 10 * 60;
const TOKEN_CLOCK_SKEW_SECONDS = 60;
const TOKEN_PATTERN = /^(adt|art|arc)_([0-9a-z]{1,10})_([0-9a-f]{32})_([A-Za-z0-9_-]{43})$/;
const SUCCESS_RECEIPT_TTL_SECONDS = 2 * 60;
const SUCCESS_RECEIPT_CLOCK_SKEW_SECONDS = 15;
const SUCCESS_RECEIPT_PATTERN =
  /^ads_([0-9a-z]{1,10})_([0-9a-f]{32})_([A-Za-z0-9_-]{43})$/;

export const ACCOUNT_REAUTH_CONTINUATION_COOKIE =
  "onward_account_delete_reauth";
export const ACCOUNT_DELETION_SUCCESS_COOKIE =
  "onward_account_delete_success";

export type AccountActionTokenDisposition = "valid" | "expired" | "invalid";

type TokenPurpose = "delete" | "reauth-request" | "reauth-continuation";

declare global {
  var __onwardAccountDeletionSecret: Buffer | undefined;
}

const EPHEMERAL_SECRET =
  globalThis.__onwardAccountDeletionSecret ??
  (globalThis.__onwardAccountDeletionSecret = randomBytes(32));

export function issueAccountDeletionToken(
  userId: string,
  now = new Date(),
): string {
  return issueToken("delete", userId, now);
}

export function accountDeletionTokenDisposition(
  token: unknown,
  userId: string,
  now = new Date(),
): AccountActionTokenDisposition {
  return tokenDisposition("delete", token, userId, now);
}

export function issueAccountReauthRequestToken(
  userId: string,
  now = new Date(),
): string {
  return issueToken("reauth-request", userId, now);
}

export function accountReauthRequestTokenDisposition(
  token: unknown,
  userId: string,
  now = new Date(),
): AccountActionTokenDisposition {
  return tokenDisposition("reauth-request", token, userId, now);
}

export function issueAccountReauthContinuationToken(
  userId: string,
  now = new Date(),
): string {
  return issueToken("reauth-continuation", userId, now);
}

export function accountReauthContinuationTokenDisposition(
  token: unknown,
  userId: string,
  now = new Date(),
): AccountActionTokenDisposition {
  return tokenDisposition("reauth-continuation", token, userId, now);
}

// Account-ID-free proof that the immediately preceding mutation reached the
// desired deleted state. Middleware clears this HttpOnly cookie in the response
// serving its first valid page view, so a bookmarked public URL cannot claim a
// deletion occurred.
export function issueAccountDeletionSuccessReceipt(now = new Date()): string {
  const expiresAt =
    Math.floor(now.getTime() / 1000) + SUCCESS_RECEIPT_TTL_SECONDS;
  const expiry = expiresAt.toString(36);
  const nonce = randomBytes(16).toString("hex");
  const signature = signSuccessReceipt(expiry, nonce);
  return `ads_${expiry}_${nonce}_${signature}`;
}

export function accountDeletionSuccessReceiptDisposition(
  token: unknown,
  now = new Date(),
): AccountActionTokenDisposition {
  if (typeof token !== "string") return "invalid";
  const match = SUCCESS_RECEIPT_PATTERN.exec(token);
  if (!match) return "invalid";
  const expiresAt = Number.parseInt(match[1], 36);
  const nowSeconds = Math.floor(now.getTime() / 1000);
  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt >
      nowSeconds +
        SUCCESS_RECEIPT_TTL_SECONDS +
        SUCCESS_RECEIPT_CLOCK_SKEW_SECONDS
  ) {
    return "invalid";
  }
  const expected = signSuccessReceipt(match[1], match[2]);
  const actualBytes = Buffer.from(match[3]);
  const expectedBytes = Buffer.from(expected);
  if (
    actualBytes.length !== expectedBytes.length ||
    !timingSafeEqual(actualBytes, expectedBytes)
  ) {
    return "invalid";
  }
  return expiresAt < nowSeconds - SUCCESS_RECEIPT_CLOCK_SKEW_SECONDS
    ? "expired"
    : "valid";
}

function issueToken(
  purpose: TokenPurpose,
  userId: string,
  now: Date,
): string {
  requireUserId(userId);
  const expiresAt = Math.floor(now.getTime() / 1000) + TOKEN_TTL_SECONDS;
  const expiry = expiresAt.toString(36);
  const nonce = randomBytes(16).toString("hex");
  const prefix = tokenPrefix(purpose);
  const signature = sign(purpose, userId, expiry, nonce);
  return `${prefix}_${expiry}_${nonce}_${signature}`;
}

function tokenDisposition(
  purpose: TokenPurpose,
  token: unknown,
  userId: string,
  now: Date,
): AccountActionTokenDisposition {
  if (typeof token !== "string") return "invalid";
  try {
    requireUserId(userId);
  } catch {
    return "invalid";
  }
  const match = TOKEN_PATTERN.exec(token);
  if (!match || match[1] !== tokenPrefix(purpose)) return "invalid";
  const expiresAt = Number.parseInt(match[2], 36);
  const nowSeconds = Math.floor(now.getTime() / 1000);
  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt > nowSeconds + TOKEN_TTL_SECONDS + TOKEN_CLOCK_SKEW_SECONDS
  ) {
    return "invalid";
  }
  const expected = sign(purpose, userId, match[2], match[3]);
  const actualBytes = Buffer.from(match[4]);
  const expectedBytes = Buffer.from(expected);
  if (
    actualBytes.length !== expectedBytes.length ||
    !timingSafeEqual(actualBytes, expectedBytes)
  ) {
    return "invalid";
  }
  if (expiresAt < nowSeconds - TOKEN_CLOCK_SKEW_SECONDS) return "expired";
  return "valid";
}

function sign(
  purpose: TokenPurpose,
  userId: string,
  expiry: string,
  nonce: string,
): string {
  return createHmac("sha256", accountDeletionSecret())
    .update(`account-action-v1:${purpose}:${userId}:${expiry}:${nonce}`)
    .digest("base64url");
}

function signSuccessReceipt(expiry: string, nonce: string): string {
  return createHmac("sha256", accountDeletionSecret())
    .update(`account-deletion-success-v1:${expiry}:${nonce}`)
    .digest("base64url");
}

function tokenPrefix(purpose: TokenPurpose): "adt" | "art" | "arc" {
  if (purpose === "delete") return "adt";
  return purpose === "reauth-request" ? "art" : "arc";
}

function requireUserId(userId: string): void {
  if (!/^[A-Za-z0-9-]{1,128}$/.test(userId)) {
    throw new Error("account action token binding is invalid");
  }
}

function accountDeletionSecret(): string | Buffer {
  const configured = readStrongSecret([
    "ACCOUNT_DELETION_TOKEN_SECRET",
    "STORY_DELETION_TOKEN_SECRET",
    "IP_HASH_SALT",
  ]);
  if (configured) return configured;
  if (persistenceMode() === "supabase" || process.env.NODE_ENV === "production") {
    throw new Error(
      "ACCOUNT_DELETION_TOKEN_SECRET, STORY_DELETION_TOKEN_SECRET, or IP_HASH_SALT is required",
    );
  }
  return EPHEMERAL_SECRET;
}
