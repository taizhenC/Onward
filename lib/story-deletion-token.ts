import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { persistenceMode } from "./persistence";
import { readStrongSecret } from "./secret-config";

const TOKEN_VERSION = "story-delete-v1";
const TOKEN_TTL_SECONDS = 10 * 60;
const TOKEN_CLOCK_SKEW_SECONDS = 60;
const TOKEN_PATTERN = /^sdt_([0-9a-z]{1,10})_([0-9a-f]{32})_([A-Za-z0-9_-]{43})$/;

export type StoryDeletionTokenDisposition = "valid" | "expired" | "invalid";

declare global {
  var __onwardStoryDeletionSecret: Buffer | undefined;
}

const EPHEMERAL_SECRET =
  globalThis.__onwardStoryDeletionSecret ??
  (globalThis.__onwardStoryDeletionSecret = randomBytes(32));

export function issueStoryDeletionToken(
  userId: string,
  sessionId: string,
  now = new Date(),
): string {
  requireBinding(userId, sessionId);
  const expiresAt = Math.floor(now.getTime() / 1000) + TOKEN_TTL_SECONDS;
  const expiry = expiresAt.toString(36);
  const nonce = randomBytes(16).toString("hex");
  const signature = sign(userId, sessionId, expiry, nonce);
  return `sdt_${expiry}_${nonce}_${signature}`;
}

export function verifyStoryDeletionToken(
  token: unknown,
  userId: string,
  sessionId: string,
  now = new Date(),
): boolean {
  return storyDeletionTokenDisposition(token, userId, sessionId, now) === "valid";
}

export function storyDeletionTokenDisposition(
  token: unknown,
  userId: string,
  sessionId: string,
  now = new Date(),
): StoryDeletionTokenDisposition {
  if (typeof token !== "string") return "invalid";
  try {
    requireBinding(userId, sessionId);
  } catch {
    return "invalid";
  }
  const match = TOKEN_PATTERN.exec(token);
  if (!match) return "invalid";
  const expiresAt = Number.parseInt(match[1], 36);
  const nowSeconds = Math.floor(now.getTime() / 1000);
  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt > nowSeconds + TOKEN_TTL_SECONDS + TOKEN_CLOCK_SKEW_SECONDS
  ) {
    return "invalid";
  }
  const expected = sign(userId, sessionId, match[1], match[2]);
  const actualBytes = Buffer.from(match[3]);
  const expectedBytes = Buffer.from(expected);
  const signatureValid =
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes);
  if (!signatureValid) return "invalid";
  if (expiresAt < nowSeconds - TOKEN_CLOCK_SKEW_SECONDS) return "expired";
  return "valid";
}

function sign(
  userId: string,
  sessionId: string,
  expiry: string,
  nonce: string,
): string {
  return createHmac("sha256", storyDeletionSecret())
    .update(`${TOKEN_VERSION}:${userId}:${sessionId}:${expiry}:${nonce}`)
    .digest("base64url");
}

function requireBinding(userId: string, sessionId: string): void {
  if (userId.length === 0 || !/^[0-9a-f]{32}$/.test(sessionId)) {
    throw new Error("story deletion token binding is invalid");
  }
}

function storyDeletionSecret(): string | Buffer {
  const configured = readStrongSecret([
    "STORY_DELETION_TOKEN_SECRET",
    "IP_HASH_SALT",
  ]);
  if (configured) return configured;
  if (persistenceMode() === "supabase" || process.env.NODE_ENV === "production") {
    throw new Error("STORY_DELETION_TOKEN_SECRET or IP_HASH_SALT is required");
  }
  return EPHEMERAL_SECRET;
}
