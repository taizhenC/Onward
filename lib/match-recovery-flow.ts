import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { getSupabase } from "./db";
import type { StoryBoundaries } from "./story-boundaries";
import { persistenceMode } from "./persistence";
import { readStrongSecret } from "./secret-config";
import type { TelemetryFlowId } from "./telemetry-types";
import type { ProductEvent } from "./telemetry-types";
import { parseTelemetryFlowId } from "./telemetry-id";
import {
  prepareProductEventCapture,
  recordProductEvent,
  reconcileMemoryMatchEventFirstWriteWins,
} from "./telemetry";

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

export type MatchRecoveryTelemetry = {
  flowId: TelemetryFlowId;
  matchEvent: Extract<ProductEvent, { event: "match_completed" }>;
  clarificationEvent?: Extract<
    ProductEvent,
    { event: "clarification_shown" }
  >;
};

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
  telemetry?: MatchRecoveryTelemetry,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const inputHash = hashIdentity(identity);
  const expiresAt = Date.now() + MATCH_RECOVERY_FLOW_TTL_MINUTES * 60_000;

  const captures = telemetry
    ? recoveryTelemetryCaptures(identity, purpose, telemetry)
    : null;

  if (persistenceMode() === "supabase") {
    if (captures) {
      const { data, error } = await getSupabase().rpc(
        "issue_match_recovery_flow_v2",
        {
          p_token_hash: tokenHash,
          p_user_id: userId,
          p_input_hash: inputHash,
          p_purpose: purpose,
          p_expires_at: new Date(expiresAt).toISOString(),
          p_telemetry_flow_id: telemetry!.flowId,
          p_match_event_id: captures.match.eventId,
          p_clarification_event_id:
            captures.clarification?.eventId ?? null,
          p_schema_version: captures.match.schemaVersion,
          p_recipe_id: telemetry!.matchEvent.recipeId,
          p_confidence_bucket: telemetry!.matchEvent.confidenceBucket,
          p_match_path: telemetry!.matchEvent.matchPath,
          p_age_fallback: telemetry!.matchEvent.ageFallback,
          p_boundary_outcome: telemetry!.matchEvent.boundaryOutcome,
        },
      );
      if (error || data !== "created") {
        throw new Error("match recovery flow could not be issued");
      }
    } else {
      const { error } = await getSupabase().from("match_recovery_flows").insert({
        token_hash: tokenHash,
        user_id: userId,
        input_hash: inputHash,
        purpose,
        expires_at: new Date(expiresAt).toISOString(),
      });
      if (error) throw new Error("match recovery flow could not be issued");
    }
  } else {
    pruneMemoryFlows();
    memoryFlows.set(tokenHash, {
      userId,
      inputHash,
      purpose,
      expiresAt,
      consumedAt: null,
    });
    if (telemetry) {
      try {
        const matchResult = await reconcileMemoryMatchEventFirstWriteWins({
          event: telemetry.matchEvent,
          flowId: telemetry.flowId,
        });
        if (matchResult === "conflict") {
          throw new Error("match recovery telemetry conflicted");
        }
        if (telemetry.clarificationEvent) {
          const clarificationResult = await recordProductEvent({
            event: telemetry.clarificationEvent,
            flowId: telemetry.flowId,
          });
          if (clarificationResult === "conflict") {
            throw new Error("match recovery telemetry conflicted");
          }
        }
      } catch (error) {
        memoryFlows.delete(tokenHash);
        throw error;
      }
    }
  }
  return token;
}

function recoveryTelemetryCaptures(
  identity: MatchRecoveryIdentity,
  purpose: MatchRecoveryPurpose,
  telemetry: MatchRecoveryTelemetry,
) {
  if (
    identity.telemetryFlowId === null ||
    identity.telemetryFlowId !== telemetry.flowId ||
    telemetry.matchEvent.storyRole !== "initial" ||
    (purpose === "clarification" &&
      (telemetry.matchEvent.disposition !== "clarification_required" ||
        telemetry.clarificationEvent === undefined)) ||
    (purpose === "adjacent_acceptance" &&
      (telemetry.matchEvent.disposition !== "no_close_match" ||
        telemetry.clarificationEvent !== undefined))
  ) {
    throw new Error("match recovery telemetry identity is invalid");
  }
  const match = prepareProductEventCapture({
    event: telemetry.matchEvent,
    flowId: telemetry.flowId,
  });
  const clarification = telemetry.clarificationEvent
    ? prepareProductEventCapture({
        event: telemetry.clarificationEvent,
        flowId: telemetry.flowId,
      })
    : null;
  return { match, clarification };
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
