import "server-only";
import { prepareProductEventCapture } from "./telemetry";
import { telemetryFlowBindingEnabled } from "./telemetry-flow-lifecycle";
import { resolveOwnedTelemetryFlowForKnownSession } from "./telemetry-flow-binding";
import {
  passageAcknowledgedEvent,
  storyCompletedEvent,
} from "./telemetry-producers";
import type { StoryPassageLayout } from "./story-progress";
import type { Session, StoryProgressTelemetryCapture } from "./types";
import type { StoryRole } from "./telemetry-types";

export async function prepareStoryProgressTelemetry(input: {
  session: Session;
  userId: string;
  layout: StoryPassageLayout;
}): Promise<StoryProgressTelemetryCapture | null> {
  if (!telemetryFlowBindingEnabled()) return null;
  const binding = await resolveOwnedTelemetryFlowForKnownSession(
    input.session,
    input.userId,
  );
  if (!binding) return null;

  const storyRole: StoryRole =
    input.session.alternateOfSessionId === null ? "initial" : "alternate";
  const passage = prepareProductEventCapture({
    flowId: binding.flowId,
    event: passageAcknowledgedEvent(
      storyRole,
      input.layout.passageOrdinal,
    ),
  });
  const completion =
    input.layout.next === "end"
      ? prepareProductEventCapture({
          flowId: binding.flowId,
          event: storyCompletedEvent(storyRole),
        })
      : null;
  return Object.freeze({ passage, completion });
}
