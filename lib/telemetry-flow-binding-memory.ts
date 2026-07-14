import "server-only";
import { deleteMemoryProductEventsForFlow } from "./telemetry-store-memory";
import {
  bindMemoryTelemetryFlowState,
  claimMemoryTelemetryFlowOwner,
  getMemoryTelemetryFlowByFlow,
  getMemoryTelemetryFlowByRoot,
  registerMemoryTelemetryFlow,
  revokeMemoryTelemetryFlowForRootState,
  revokeMemoryTelemetryFlowState,
  type MemoryTelemetryFlow,
} from "./telemetry-flow-state-memory";
import type { TelemetryFlowId } from "./telemetry-types";

export type MemoryTelemetryFlowBinding = Readonly<{
  flowId: TelemetryFlowId;
  userId: string;
  rootSessionId: string;
}>;

export { claimMemoryTelemetryFlowOwner, registerMemoryTelemetryFlow };

export function getMemoryTelemetryFlowBindingByFlow(
  flowId: TelemetryFlowId,
): MemoryTelemetryFlowBinding | null {
  return asBinding(getMemoryTelemetryFlowByFlow(flowId));
}

export function getOwnedMemoryTelemetryFlowByFlow(
  flowId: TelemetryFlowId,
  userId: string,
): MemoryTelemetryFlow | null {
  const flow = getMemoryTelemetryFlowByFlow(flowId);
  return flow?.userId === userId ? flow : null;
}

export function getOwnedMemoryTelemetryFlowBindingByRoot(
  rootSessionId: string,
  userId: string,
  now = Date.now(),
): MemoryTelemetryFlowBinding | null {
  const flow = getMemoryTelemetryFlowByRoot(rootSessionId, now);
  return flow?.userId === userId ? asBinding(flow) : null;
}

export function bindMemoryTelemetryFlow(input: {
  flowId: TelemetryFlowId;
  userId: string;
  rootSessionId: string;
}): "created" | "existing" | "conflict" | "not_found" | "revoked" {
  const result = bindMemoryTelemetryFlowState(input);
  return result === "bound" ? "created" : result;
}

export function revokeMemoryTelemetryFlow(
  flowId: TelemetryFlowId,
  userId: string | null,
): "revoked" | "duplicate" | "not_found" | "conflict" {
  const result = revokeMemoryTelemetryFlowState(flowId, userId);
  if (result === "revoked" || result === "duplicate") {
    deleteMemoryProductEventsForFlow(flowId);
  }
  return result;
}

// A root-session deletion owns the entire flow lifecycle. Alternate-session
// deletion deliberately leaves this root mapping intact.
export function deleteMemoryTelemetryFlowBindingForRoot(
  rootSessionId: string,
): void {
  const flowId = revokeMemoryTelemetryFlowForRootState(rootSessionId);
  if (flowId) deleteMemoryProductEventsForFlow(flowId);
}

function asBinding(
  flow: MemoryTelemetryFlow | null,
): MemoryTelemetryFlowBinding | null {
  return flow !== null && flow.userId !== null && flow.rootSessionId !== null
    ? Object.freeze({
        flowId: flow.flowId,
        userId: flow.userId,
        rootSessionId: flow.rootSessionId,
      })
    : null;
}
