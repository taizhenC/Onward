import "server-only";
import { randomBytes } from "node:crypto";
import { getSupabase } from "./db";
import type { StoryArtifact } from "./story-artifact-types";
import type {
  AlternateFlowClaimResult,
  AlternateFlowIssueResult,
} from "./alternate-story-store-memory";
import type { AlternateRequestedTelemetryCapture } from "./alternate-story-telemetry";
import { telemetryFlowBindingEnabled } from "./telemetry-flow-lifecycle";

export async function issueSupabaseAlternateStoryFlow(input: {
  userId: string;
  sourceSessionId: string;
  sourceArtifactId: string;
  tokenHash: string;
  policyVersion: string;
  allowCreate: boolean;
}): Promise<AlternateFlowIssueResult> {
  const { data, error } = await getSupabase().rpc(
    "issue_alternate_story_flow",
    {
      p_user_id: input.userId,
      p_source_session_id: input.sourceSessionId,
      p_source_artifact_id: input.sourceArtifactId,
      p_token_hash: input.tokenHash,
      p_policy_version: input.policyVersion,
      p_allow_create: input.allowCreate,
    },
  );
  if (error) throw new Error("alternate story flow could not be issued");
  return parseIssueResult(data);
}

export async function claimSupabaseAlternateStoryFlow(input: {
  userId: string;
  sourceSessionId: string;
  sourceArtifactId: string;
  tokenHash: string;
  policyVersion: string;
  leaseId: string;
  telemetry: AlternateRequestedTelemetryCapture | null;
}): Promise<AlternateFlowClaimResult> {
  const telemetryEnabled = telemetryFlowBindingEnabled();
  if (!telemetryEnabled && input.telemetry !== null) {
    throw new Error("disabled alternate telemetry received a capture");
  }
  const { data, error } = telemetryEnabled
    ? await getSupabase().rpc("claim_alternate_story_flow_v2", {
        p_user_id: input.userId,
        p_source_session_id: input.sourceSessionId,
        p_source_artifact_id: input.sourceArtifactId,
        p_token_hash: input.tokenHash,
        p_policy_version: input.policyVersion,
        p_lease_id: input.leaseId,
        p_telemetry_flow_id: input.telemetry?.flowId ?? null,
        p_alternate_requested_event_id: input.telemetry?.eventId ?? null,
        p_telemetry_schema_version: input.telemetry?.schemaVersion ?? null,
      })
    : await getSupabase().rpc("claim_alternate_story_flow", {
        p_user_id: input.userId,
        p_source_session_id: input.sourceSessionId,
        p_source_artifact_id: input.sourceArtifactId,
        p_token_hash: input.tokenHash,
        p_policy_version: input.policyVersion,
        p_lease_id: input.leaseId,
      });
  if (error) throw new Error("alternate story flow could not be claimed");
  return parseClaimResult(data);
}

export async function releaseSupabaseAlternateStoryFlow(input: {
  userId: string;
  sourceSessionId: string;
  leaseId: string;
}): Promise<void> {
  const { error } = await getSupabase().rpc("release_alternate_story_claim", {
    p_user_id: input.userId,
    p_source_session_id: input.sourceSessionId,
    p_lease_id: input.leaseId,
  });
  if (error) throw new Error("alternate story claim could not be released");
}

export async function completeSupabaseAlternateStoryUnavailable(input: {
  userId: string;
  sourceSessionId: string;
  leaseId: string;
}): Promise<boolean> {
  const { data, error } = await getSupabase().rpc(
    "complete_alternate_story_unavailable",
    {
      p_user_id: input.userId,
      p_source_session_id: input.sourceSessionId,
      p_lease_id: input.leaseId,
    },
  );
  if (error) throw new Error("alternate story outcome could not be stored");
  return data === true;
}

export async function completeSupabaseAlternateStoryReady(input: {
  userId: string;
  sourceSessionId: string;
  leaseId: string;
  artifact: StoryArtifact;
}): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const sessionId = randomBytes(16).toString("hex");
    const { data, error } = await getSupabase().rpc(
      "complete_alternate_story_session",
      {
        p_user_id: input.userId,
        p_source_session_id: input.sourceSessionId,
        p_lease_id: input.leaseId,
        p_session_id: sessionId,
        p_artifact: input.artifact,
      },
    );
    if (error) throw new Error("alternate story session could not be stored");
    const result = asRecord(data);
    if (result?.status === "ready" && typeof result.sessionId === "string") {
      return result.sessionId;
    }
    if (result?.status !== "collision") {
      throw new Error("alternate story completion was rejected");
    }
  }
  throw new Error("alternate story session ID allocation failed");
}

function parseIssueResult(value: unknown): AlternateFlowIssueResult {
  const result = asRecord(value);
  if (result?.status === "available" && typeof result.expiresAt === "string") {
    const expiresAt = Date.parse(result.expiresAt);
    if (!Number.isNaN(expiresAt)) return { status: "available", expiresAt };
  }
  if (result?.status === "ready" && typeof result.sessionId === "string") {
    return { status: "ready", sessionId: result.sessionId };
  }
  if (
    result?.status === "preparing" &&
    typeof result.retryAfterMs === "number"
  ) {
    return { status: "preparing", retryAfterMs: result.retryAfterMs };
  }
  if (result?.status === "unavailable") return { status: "unavailable" };
  if (result?.status === "expired") return { status: "expired" };
  if (result?.status === "exhausted") return { status: "exhausted" };
  if (result?.status === "not_found") return { status: "not_found" };
  throw new Error("alternate story issue returned an invalid disposition");
}

function parseClaimResult(value: unknown): AlternateFlowClaimResult {
  const result = asRecord(value);
  if (result?.status === "ready" && typeof result.sessionId === "string") {
    return { status: "ready", sessionId: result.sessionId };
  }
  if (
    (result?.status === "preparing" || result?.status === "cooldown") &&
    typeof result.retryAfterMs === "number"
  ) {
    return { status: result.status, retryAfterMs: result.retryAfterMs };
  }
  if (result?.status === "claimed") return { status: "claimed" };
  if (result?.status === "unavailable") return { status: "unavailable" };
  if (result?.status === "expired") return { status: "expired" };
  if (result?.status === "exhausted") return { status: "exhausted" };
  if (result?.status === "not_found") return { status: "not_found" };
  throw new Error("alternate story claim returned an invalid disposition");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
