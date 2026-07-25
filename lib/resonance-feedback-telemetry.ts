import "server-only";
import type { ResonanceFeedbackVerdict } from "./resonance-feedback-types";
import { prepareProductEventCapture } from "./telemetry";
import { resolveOwnedTelemetryFlowForKnownSession } from "./telemetry-flow-binding";
import { telemetryFlowBindingEnabled } from "./telemetry-flow-lifecycle";
import { feedbackSubmittedEvent } from "./telemetry-producers";
import type { ProductEventCapture, StoryRole } from "./telemetry-types";
import type { Session } from "./types";

export type ResonanceFeedbackTelemetryCapture = Readonly<
  Extract<ProductEventCapture, { event: "feedback_submitted" }>
>;

// The request body supplies only the closed domain verdict. Ownership, root
// flow, and initial/alternate role all come from the already-owned persisted
// session. The memory store and SQL RPC independently verify these dimensions
// before making feedback and telemetry durable together.
export async function prepareResonanceFeedbackTelemetry(input: {
  session: Session;
  userId: string;
  verdict: ResonanceFeedbackVerdict;
}): Promise<ResonanceFeedbackTelemetryCapture | null> {
  if (!telemetryFlowBindingEnabled()) return null;
  const binding = await resolveOwnedTelemetryFlowForKnownSession(
    input.session,
    input.userId,
  );
  if (!binding) return null;

  const storyRole: StoryRole =
    input.session.alternateOfSessionId === null ? "initial" : "alternate";
  return prepareProductEventCapture({
    flowId: binding.flowId,
    event: feedbackSubmittedEvent(storyRole, input.verdict),
  });
}
