import "server-only";
import { prepareProductEventCapture } from "./telemetry";
import { resolveOwnedTelemetryFlowForKnownSession } from "./telemetry-flow-binding";
import { telemetryFlowBindingEnabled } from "./telemetry-flow-lifecycle";
import { alternateRequestedEvent } from "./telemetry-producers";
import type { ProductEventCapture } from "./telemetry-types";
import type { Session } from "./types";

export type AlternateRequestedTelemetryCapture = Readonly<
  Extract<ProductEventCapture, { event: "alternate_requested" }>
>;

// The capability is already owner/session/artifact bound before this helper is
// called. Only the persisted root session may select the linked flow; neither
// the browser capability nor any alternate-generation input enters telemetry.
export async function prepareAlternateRequestedTelemetry(input: {
  session: Session;
  userId: string;
}): Promise<AlternateRequestedTelemetryCapture | null> {
  if (!telemetryFlowBindingEnabled()) return null;
  if (
    input.session.userId !== input.userId ||
    input.session.alternateOfSessionId !== null
  ) {
    return null;
  }
  const binding = await resolveOwnedTelemetryFlowForKnownSession(
    input.session,
    input.userId,
  );
  if (!binding) return null;
  return prepareProductEventCapture({
    flowId: binding.flowId,
    event: alternateRequestedEvent(),
  });
}
