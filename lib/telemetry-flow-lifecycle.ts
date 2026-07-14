import "server-only";
import { getSupabase } from "./db";
import { persistenceMode } from "./persistence";
import {
  claimMemoryTelemetryFlowOwner,
  getOwnedMemoryTelemetryFlowByFlow,
  registerMemoryTelemetryFlow,
  revokeMemoryTelemetryFlow,
} from "./telemetry-flow-binding-memory";
import {
  parseTelemetryFlowId,
  parseTelemetryFlowIdForRetirement,
  telemetryFlowExpiresAt,
} from "./telemetry-id";
import type { TelemetryFlowId } from "./telemetry-types";

export type TelemetryFlowActivationResult =
  | "active"
  | "conflict"
  | "revoked"
  | "expired";

export function telemetryFlowBindingEnabled(): boolean {
  return (
    process.env.TELEMETRY_FLOW_BINDING_ENABLED?.trim().toLowerCase() !== "false"
  );
}

export async function registerTelemetryFlow(
  value: TelemetryFlowId,
): Promise<"registered" | "revoked" | "expired"> {
  let flowId: TelemetryFlowId;
  try {
    flowId = parseTelemetryFlowId(value);
  } catch (error) {
    if (error instanceof Error && error.message.includes("expired")) {
      return "expired";
    }
    throw error;
  }
  if (persistenceMode() === "memory") {
    const result = registerMemoryTelemetryFlow(flowId);
    return result === "revoked" ? "revoked" : "registered";
  }
  const { data, error } = await getSupabase().rpc(
    "register_telemetry_flow_v1",
    {
      p_flow_id: flowId,
      p_expires_at: telemetryFlowExpiresAt(flowId).toISOString(),
    },
  );
  if (error) throw new Error("telemetry flow registration failed");
  if (data === "created" || data === "duplicate") return "registered";
  if (data === "revoked" || data === "expired") return data;
  throw new Error("telemetry flow registration returned an invalid result");
}

export async function activateTelemetryFlowForOwner(
  value: TelemetryFlowId,
  userId: string,
): Promise<TelemetryFlowActivationResult> {
  let flowId: TelemetryFlowId;
  try {
    flowId = parseTelemetryFlowId(value);
  } catch (error) {
    if (error instanceof Error && error.message.includes("expired")) {
      return "expired";
    }
    throw error;
  }

  const registration = await registerTelemetryFlow(flowId);
  if (registration !== "registered") return registration;

  if (persistenceMode() === "memory") {
    const claimed = claimMemoryTelemetryFlowOwner({ flowId, userId });
    if (claimed === "claimed" || claimed === "existing") return "active";
    if (claimed === "revoked") return "revoked";
    if (claimed === "conflict") return "conflict";
    throw new Error("telemetry flow disappeared before owner claim");
  }

  const { data: claim, error: claimError } = await getSupabase().rpc(
    "claim_telemetry_flow_owner_v1",
    { p_flow_id: flowId, p_user_id: userId },
  );
  if (claimError) throw new Error("telemetry flow owner claim failed");
  if (claim === "claimed" || claim === "duplicate") return "active";
  if (claim === "collision") return "conflict";
  if (claim === "revoked" || claim === "expired") return claim;
  if (claim === "not_found") {
    throw new Error("telemetry flow disappeared before owner claim");
  }
  throw new Error("telemetry flow owner claim returned an invalid result");
}

export async function resolveOwnedTelemetryRootForFlow(
  value: TelemetryFlowId,
  userId: string,
): Promise<string | null> {
  const flowId = parseTelemetryFlowId(value);
  if (persistenceMode() === "memory") {
    return getOwnedMemoryTelemetryFlowByFlow(flowId, userId)?.rootSessionId ?? null;
  }
  const { data, error } = await getSupabase().rpc(
    "resolve_owned_telemetry_root_v1",
    { p_user_id: userId, p_flow_id: flowId },
  );
  if (error) throw new Error("telemetry root lookup failed");
  if (data === null) return null;
  if (typeof data !== "string" || !/^[0-9a-f]{32}$/.test(data)) {
    throw new Error("telemetry root lookup returned an invalid session ID");
  }
  return data;
}

export async function revokeTelemetryFlow(
  value: TelemetryFlowId,
  userId: string | null,
): Promise<"revoked" | "duplicate" | "not_found" | "conflict"> {
  const flowId = parseTelemetryFlowIdForRetirement(value);
  if (persistenceMode() === "memory") {
    return revokeMemoryTelemetryFlow(flowId, userId);
  }
  const { data, error } = await getSupabase().rpc("revoke_telemetry_flow_v1", {
    p_flow_id: flowId,
    p_user_id: userId,
  });
  if (error) throw new Error("telemetry flow revocation failed");
  if (data === "collision") return "conflict";
  if (data === "revoked" || data === "duplicate" || data === "not_found") {
    return data;
  }
  throw new Error("telemetry flow revocation returned an invalid result");
}
