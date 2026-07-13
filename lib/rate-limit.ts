import "server-only";
import { createHash } from "node:crypto";
import { getSupabase } from "./db";
import { persistenceMode } from "./persistence";
import { readStrongSecret } from "./secret-config";

// Match rate limiting (the only expensive route: 1 query embed + 2 Cerebras calls per
// /api/match). Two keys per request, four fixed-window counters:
//   - per-user (CLAUDE.md: 5/hour, 30/day) — the primary limit now that every request
//     carries an authenticated (possibly anonymous) user;
//   - per-IP backstop, looser — catches anonymous-identity minting (clearing cookies
//     to dodge the per-user limit) without punishing shared NATs too hard.
// Denied attempts also count: hammering while blocked earns no fresh budget.
//
// Supabase mode: one consume_rate_limit RPC (migration 0003) — durable across
// serverless instances. Memory mode: in-process counters (dev/smoke only).
// FAIL OPEN on RPC failure (recovery-asymmetry: degraded protection beats no match),
// and log nothing — provider errors are discarded, never emitted.

export const MATCH_LIMITS = {
  userPerHour: 5,
  userPerDay: 30,
  ipPerHour: 15,
  ipPerDay: 60,
} as const;

const HOUR_SECONDS = 3600;
const DAY_SECONDS = 86400;

// true = allowed to proceed to matching.
export async function consumeMatchRateLimit(
  userId: string,
  ipHash: string,
): Promise<boolean> {
  if (persistenceMode() === "memory") {
    return consumeInMemory(`u:${userId}`, `ip:${ipHash}`);
  }

  try {
    const { data, error } = await getSupabase().rpc("consume_rate_limit", {
      p_user_key: `u:${userId}`,
      p_ip_key: `ip:${ipHash}`,
      p_user_hour_max: MATCH_LIMITS.userPerHour,
      p_user_day_max: MATCH_LIMITS.userPerDay,
      p_ip_hour_max: MATCH_LIMITS.ipPerHour,
      p_ip_day_max: MATCH_LIMITS.ipPerDay,
    });
    if (error) return true; // fail open
    return data === true;
  } catch {
    return true; // fail open
  }
}

// Salted sha256 of the client IP. Raw IPs never leave this function — not stored,
// not logged; only the hash reaches the rate_limits table.
export function hashRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "local";
  return createHash("sha256").update(`${ipHashSalt()}:${ip}`).digest("hex");
}

function ipHashSalt(): string {
  const salt = readStrongSecret(["IP_HASH_SALT"]);
  if (salt) return salt;
  if (persistenceMode() === "supabase") {
    // Unsalted sha256 over the IPv4 space is reversible by enumeration — refuse to
    // run durable limiting without a salt (mirrors lib/db.ts's throw-on-first-use).
    throw new Error(
      "IP_HASH_SALT is required when PERSISTENCE=supabase. Generate one with: openssl rand -hex 32",
    );
  }
  return ""; // memory mode (dev/smoke): hash is process-local, salt is moot
}

// ── In-memory fixed-window counters (PERSISTENCE=memory only) ───────────────
// globalThis so dev hot-reload doesn't reset budgets mid-test. Same fixed-window
// semantics as the SQL function (epoch-aligned rather than calendar-aligned —
// irrelevant for dev).

declare global {
  var __onwardRateLimits:
    | Map<string, { count: number; expiresAt: number }>
    | undefined;
}

const counters: Map<string, { count: number; expiresAt: number }> =
  globalThis.__onwardRateLimits ?? (globalThis.__onwardRateLimits = new Map());

function consumeInMemory(userKey: string, ipKey: string): boolean {
  const now = Date.now();
  pruneExpired(now);
  // Bump all four before deciding — matches the SQL function (denied attempts count).
  const userHour = bump(userKey, HOUR_SECONDS, now);
  const userDay = bump(userKey, DAY_SECONDS, now);
  const ipHour = bump(ipKey, HOUR_SECONDS, now);
  const ipDay = bump(ipKey, DAY_SECONDS, now);
  return (
    userHour <= MATCH_LIMITS.userPerHour &&
    userDay <= MATCH_LIMITS.userPerDay &&
    ipHour <= MATCH_LIMITS.ipPerHour &&
    ipDay <= MATCH_LIMITS.ipPerDay
  );
}

function bump(bucketKey: string, windowSeconds: number, now: number): number {
  const windowMs = windowSeconds * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const key = `${bucketKey}:${windowSeconds}:${windowStart}`;
  const entry = counters.get(key);
  if (entry) {
    entry.count += 1;
    return entry.count;
  }
  counters.set(key, { count: 1, expiresAt: windowStart + windowMs });
  return 1;
}

function pruneExpired(now: number): void {
  if (counters.size < 256) return;
  for (const [key, entry] of counters) {
    if (entry.expiresAt <= now) counters.delete(key);
  }
}
