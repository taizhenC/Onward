import "server-only";
import { getSupabase } from "./db";
import { persistenceMode } from "./persistence";
import { getOwnedSession } from "./session";
import { getOwnedMemoryTelemetryFlowBindingByRoot } from "./telemetry-flow-binding-memory";
import { authenticateTelemetryFlowId } from "./telemetry-id";
import type { TelemetryFlowId } from "./telemetry-types";
import type { Session } from "./types";

export type OwnedTelemetryFlowBinding = Readonly<{
  flowId: TelemetryFlowId;
  rootSessionId: string;
}>;

// Server-only ownership boundary for future authoritative instrumentation.
// An alternate resolves through its initial session, so every story in one
// reader journey shares exactly one opaque flow without exposing the mapping
// to a page or client component.
export async function resolveOwnedTelemetryFlowForSession(
  sessionId: string,
  userId: string | null,
): Promise<OwnedTelemetryFlowBinding | null> {
  const session = await getOwnedSession(sessionId, userId);
  if (!session || !userId) return null;
  return resolveOwnedTelemetryFlowForKnownSession(session, userId);
}

// The reader route has already crossed getOwnedSession and loaded the owned
// artifact. Reuse that projection so one Continue does not repeat a session
// read merely to discover the immutable root ID.
export async function resolveOwnedTelemetryFlowForKnownSession(
  session: Session,
  userId: string,
): Promise<OwnedTelemetryFlowBinding | null> {
  if (session.userId !== userId) return null;
  const rootSessionId = session.alternateOfSessionId ?? session.sessionId;

  if (persistenceMode() === "memory") {
    const binding = getOwnedMemoryTelemetryFlowBindingByRoot(
      rootSessionId,
      userId,
    );
    return binding
      ? Object.freeze({ flowId: binding.flowId, rootSessionId })
      : null;
  }

  const { data, error } = await getSupabase().rpc(
    "resolve_owned_telemetry_flow_v1",
    {
      p_user_id: userId,
      p_root_session_id: rootSessionId,
    },
  );
  if (error) throw new Error("telemetry flow lookup failed");
  if (data === null) return null;

  try {
    return Object.freeze({
      flowId: authenticateTelemetryFlowId(data),
      rootSessionId,
    });
  } catch {
    throw new Error("telemetry flow lookup returned an invalid identifier");
  }
}
