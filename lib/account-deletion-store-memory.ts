import "server-only";
import { deleteMemoryMatchRecoveryFlowsForUser } from "./match-recovery-flow";
import { deleteMemoryOwnerStorySaveStateForUser } from "./owner-story-save-store-memory";
import { deleteMemoryRateLimitsForUser } from "./rate-limit";
import { deleteMemorySessionsForUser } from "./session-store-memory";
import { deleteMemoryTelemetryFlowsForUser } from "./telemetry-flow-binding-memory";

export async function deleteMemoryAccount(
  userId: string,
): Promise<"deleted"> {
  // Revoke owner-claimed but not-yet-bound flows before session cascades handle
  // bound roots. Every helper is intentionally narrow; shared editorial reports
  // and unlinkable operational records do not carry an account owner.
  deleteMemoryTelemetryFlowsForUser(userId);
  deleteMemoryOwnerStorySaveStateForUser(userId);
  deleteMemorySessionsForUser(userId);
  deleteMemoryMatchRecoveryFlowsForUser(userId);
  deleteMemoryRateLimitsForUser(userId);
  return "deleted";
}
