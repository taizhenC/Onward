import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { getSupabase } from "./db";
import type { StoryBoundaries } from "./story-boundaries";
import { persistenceMode } from "./persistence";
import { readStrongSecret } from "./secret-config";
import type { TelemetryFlowId } from "./telemetry-types";
import { parseTelemetryFlowId } from "./telemetry-id";

export const MATCH_RECOVERY_FLOW_TTL_MINUTES = 10;

export type MatchRecoveryIdentity = {
  age: number;
  feeling: string;
  telemetryFlowId: TelemetryFlowId | null;
  boundaries?: StoryBoundaries;
};

export type MatchRecoveryPurpose =
  | "clarification"
  | "adjacent_acceptance";

type MemoryRecoveryFlow = {
  userId: string;
  inputHash: string;
  purpose: MatchRecoveryPurpose;
  expiresAt: number;
  consumedAt: number | null;
};

declare global {
  var __onwardMatchRecoveryFlows:
    | Map<string, MemoryRecoveryFlow>
    | undefined;
  var __onwardMatchRecoverySecret: Buffer | undefined;
}

const memoryFlows =
  globalThis.__onwardMatchRecoveryFlows ??
  (globalThis.__onwardMatchRecoveryFlows = new Map());
const EPHEMERAL_FALLBACK_SECRET =
  globalThis.__onwardMatchRecoverySecret ??
  (globalThis.__onwardMatchRecoverySecret = randomBytes(32));

export function parseMatchRecoveryToken(
  value: unknown,
): { value: string | undefined } | { error: string } {
  if (value === undefined) return { value: undefined };
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(value)) {
    return { error: "Match recovery token is invalid." };
  }
  return { value };
}

export async function issueMatchRecoveryToken(
  userId: string,
  identity: MatchRecoveryIdentity,
  purpose: MatchRecoveryPurpose,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const inputHash = hashIdentity(identity);
  const expiresAt = Date.now() + MATCH_RECOVERY_FLOW_TTL_MINUTES * 60_000;

  if (persistenceMode() === "supabase") {
    const { error } = await getSupabase().from("match_recovery_flows").insert({
      token_hash: tokenHash,
      user_id: userId,
      input_hash: inputHash,
      purpose,
      expires_at: new Date(expiresAt).toISOString(),
    });
    if (error) throw new Error("match recovery flow could not be issued");
  } else {
    pruneMemoryFlows();
    memoryFlows.set(tokenHash, {
      userId,
      inputHash,
      purpose,
      expiresAt,
      consumedAt: null,
    });
  }
  return token;
}

export async function consumeMatchRecoveryToken(
  token: string,
  userId: string,
  identity: MatchRecoveryIdentity,
): Promise<MatchRecoveryPurpose | null> {
  const tokenHash = hashToken(token);
  const inputHash = hashIdentity(identity);
  const now = Date.now();

  if (persistenceMode() === "supabase") {
    const { data, error } = await getSupabase().rpc(
      "consume_match_recovery_flow",
      {
        p_token_hash: tokenHash,
        p_user_id: userId,
        p_input_hash: inputHash,
      },
    );
    return !error && (data === "clarification" || data === "adjacent_acceptance")
      ? data
      : null;
  }

  pruneMemoryFlows(now);
  const flow = memoryFlows.get(tokenHash);
  if (
    !flow ||
    flow.userId !== userId ||
    flow.inputHash !== inputHash ||
    flow.consumedAt !== null ||
    flow.expiresAt <= now
  ) {
    return null;
  }
  flow.consumedAt = now;
  return flow.purpose;
}

export async function _matchRecoveryFlowCount(): Promise<number> {
  if (persistenceMode() === "supabase") {
    const { count, error } = await getSupabase()
      .from("match_recovery_flows")
      .select("*", { count: "exact", head: true });
    if (error) throw new Error("match recovery flow count failed");
    return count ?? 0;
  }
  pruneMemoryFlows();
  return memoryFlows.size;
}

function hashIdentity(identity: MatchRecoveryIdentity): string {
  const canonical = JSON.stringify({
    age: identity.age,
    feeling: identity.feeling,
    telemetryFlowId:
      identity.telemetryFlowId === null
        ? null
        : parseTelemetryFlowId(identity.telemetryFlowId),
    boundaries: identity.boundaries
      ? {
          maxIntensity: identity.boundaries.maxIntensity,
          excludedFlags: [...identity.boundaries.excludedFlags].sort(),
        }
      : null,
  });
  return createHmac("sha256", recoverySecret())
    .update(`match-recovery:${canonical}`)
    .digest("hex");
}

function recoverySecret(): string | Buffer {
  const configured = readStrongSecret([
    "MATCH_RECOVERY_TOKEN_SECRET",
    "IP_HASH_SALT",
  ]);
  if (configured) return configured;
  if (persistenceMode() === "supabase" || process.env.NODE_ENV === "production") {
    throw new Error(
      "MATCH_RECOVERY_TOKEN_SECRET or IP_HASH_SALT is required for production recovery flows",
    );
  }
  return EPHEMERAL_FALLBACK_SECRET;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function pruneMemoryFlows(now = Date.now()): void {
  for (const [tokenHash, flow] of memoryFlows) {
    if (flow.expiresAt <= now) memoryFlows.delete(tokenHash);
  }
}
