import "server-only";
import {
  parseTelemetryFlowId,
  telemetryFlowExpiresAt,
} from "./telemetry-id";
import type { TelemetryFlowId } from "./telemetry-types";

export type MemoryTelemetryFlow = Readonly<{
  flowId: TelemetryFlowId;
  userId: string | null;
  rootSessionId: string | null;
  expiresAt: string;
}>;

declare global {
  var __onwardTelemetryFlows:
    | Map<TelemetryFlowId, MemoryTelemetryFlow>
    | undefined;
  var __onwardTelemetryFlowByRoot: Map<string, TelemetryFlowId> | undefined;
  var __onwardTelemetryFlowRevocations:
    | Map<TelemetryFlowId, string>
    | undefined;
}

const flows =
  globalThis.__onwardTelemetryFlows ??
  (globalThis.__onwardTelemetryFlows = new Map());
const flowByRoot =
  globalThis.__onwardTelemetryFlowByRoot ??
  (globalThis.__onwardTelemetryFlowByRoot = new Map());
const revocations =
  globalThis.__onwardTelemetryFlowRevocations ??
  (globalThis.__onwardTelemetryFlowRevocations = new Map());

export function registerMemoryTelemetryFlow(
  value: TelemetryFlowId,
  now = new Date(),
): "created" | "existing" | "revoked" {
  pruneMemoryTelemetryFlowState(now.getTime());
  const flowId = parseTelemetryFlowId(value, now);
  if (revocations.has(flowId)) return "revoked";
  if (flows.has(flowId)) return "existing";
  flows.set(
    flowId,
    Object.freeze({
      flowId,
      userId: null,
      rootSessionId: null,
      expiresAt: telemetryFlowExpiresAt(flowId).toISOString(),
    }),
  );
  return "created";
}

export function claimMemoryTelemetryFlowOwner(input: {
  flowId: TelemetryFlowId;
  userId: string;
  now?: Date;
}): "claimed" | "existing" | "conflict" | "not_found" | "revoked" {
  const now = input.now ?? new Date();
  pruneMemoryTelemetryFlowState(now.getTime());
  const flowId = parseTelemetryFlowId(input.flowId, now);
  if (revocations.has(flowId)) return "revoked";
  const flow = flows.get(flowId);
  if (!flow) return "not_found";
  if (flow.userId !== null) {
    return flow.userId === input.userId ? "existing" : "conflict";
  }
  flows.set(
    flowId,
    Object.freeze({ ...flow, userId: input.userId }),
  );
  return "claimed";
}

export function bindMemoryTelemetryFlowState(input: {
  flowId: TelemetryFlowId;
  userId: string;
  rootSessionId: string;
  now?: Date;
}): "bound" | "existing" | "conflict" | "not_found" | "revoked" {
  const now = input.now ?? new Date();
  pruneMemoryTelemetryFlowState(now.getTime());
  const flowId = parseTelemetryFlowId(input.flowId, now);
  if (revocations.has(flowId)) return "revoked";
  const flow = flows.get(flowId);
  if (!flow) return "not_found";
  const rootFlowId = flowByRoot.get(input.rootSessionId);
  if (flow.rootSessionId !== null || rootFlowId !== undefined) {
    return flow.userId === input.userId &&
      flow.rootSessionId === input.rootSessionId &&
      rootFlowId === flowId
      ? "existing"
      : "conflict";
  }
  if (flow.userId !== input.userId) return "conflict";
  flows.set(
    flowId,
    Object.freeze({ ...flow, rootSessionId: input.rootSessionId }),
  );
  flowByRoot.set(input.rootSessionId, flowId);
  return "bound";
}

export function getMemoryTelemetryFlowByFlow(
  flowId: TelemetryFlowId,
  now = Date.now(),
): MemoryTelemetryFlow | null {
  pruneMemoryTelemetryFlowState(now);
  return flows.get(flowId) ?? null;
}

export function getMemoryTelemetryFlowByRoot(
  rootSessionId: string,
  now = Date.now(),
): MemoryTelemetryFlow | null {
  pruneMemoryTelemetryFlowState(now);
  const flowId = flowByRoot.get(rootSessionId);
  return flowId ? flows.get(flowId) ?? null : null;
}

export function isActiveMemoryTelemetryFlow(
  flowId: TelemetryFlowId,
  now = Date.now(),
): boolean {
  pruneMemoryTelemetryFlowState(now);
  return flows.has(flowId) && !revocations.has(flowId);
}

export function revokeMemoryTelemetryFlowState(
  flowId: TelemetryFlowId,
  userId: string | null,
): "revoked" | "duplicate" | "not_found" | "conflict" {
  if (revocations.has(flowId)) return "duplicate";
  const flow = flows.get(flowId);
  if (!flow) return "not_found";
  if (flow.userId !== userId) return "conflict";
  forceRevokeMemoryTelemetryFlowState(flowId);
  return "revoked";
}

export function revokeMemoryTelemetryFlowForRootState(
  rootSessionId: string,
): TelemetryFlowId | null {
  const flowId = flowByRoot.get(rootSessionId);
  if (!flowId) return null;
  forceRevokeMemoryTelemetryFlowState(flowId);
  return flowId;
}

export function isMemoryTelemetryFlowRevoked(flowId: TelemetryFlowId): boolean {
  pruneMemoryTelemetryFlowState();
  return revocations.has(flowId);
}

export function pruneMemoryTelemetryFlowState(now = Date.now()): void {
  for (const [flowId, flow] of flows) {
    if (Date.parse(flow.expiresAt) <= now) {
      forceRevokeMemoryTelemetryFlowState(flowId);
    }
  }
  for (const [flowId, expiresAt] of revocations) {
    if (Date.parse(expiresAt) <= now) revocations.delete(flowId);
  }
}

function forceRevokeMemoryTelemetryFlowState(flowId: TelemetryFlowId): void {
  const flow = flows.get(flowId);
  if (!flow) return;
  if (flow.rootSessionId !== null) flowByRoot.delete(flow.rootSessionId);
  flows.delete(flowId);
  revocations.set(flowId, flow.expiresAt);
}
