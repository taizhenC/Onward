import "server-only";
import { telemetryFlowBindingEnabled } from "./telemetry-flow-lifecycle";
import { resolveOwnedTelemetryFlowForKnownSession } from "./telemetry-flow-binding";
import {
  firstContentShownEvent,
  passagePresentedEvent,
  recordLinkedProductEventBestEffort,
  sourceOpenedEvent,
} from "./telemetry-producers";
import type { StoryPassageLayout } from "./story-progress";
import type { LatencyBucket, StoryRole } from "./telemetry-types";
import type { Session } from "./types";

export async function recordFirstContentShownTelemetry(input: {
  session: Session;
  userId: string;
  latencyBucket: LatencyBucket;
}): Promise<void> {
  await recordVisibility(input, (storyRole) =>
    firstContentShownEvent(storyRole, input.latencyBucket),
  );
}

export async function recordPassagePresentedTelemetry(input: {
  session: Session;
  userId: string;
  layout: StoryPassageLayout;
  latencyBucket: LatencyBucket;
}): Promise<void> {
  await recordVisibility(input, (storyRole) =>
    passagePresentedEvent(
      storyRole,
      input.layout.passageOrdinal,
      input.latencyBucket,
    ),
  );
}

export async function recordSourceOpenedTelemetry(input: {
  session: Session;
  userId: string;
}): Promise<void> {
  await recordVisibility(input, sourceOpenedEvent);
}

async function recordVisibility(
  input: { session: Session; userId: string },
  eventForRole: (
    storyRole: StoryRole,
  ) => Parameters<typeof recordLinkedProductEventBestEffort>[0],
): Promise<void> {
  if (!telemetryFlowBindingEnabled()) return;
  try {
    const binding = await resolveOwnedTelemetryFlowForKnownSession(
      input.session,
      input.userId,
    );
    if (!binding) return;
    const storyRole: StoryRole =
      input.session.alternateOfSessionId === null ? "initial" : "alternate";
    await recordLinkedProductEventBestEffort(
      eventForRole(storyRole),
      binding.flowId,
    );
  } catch {
    // A visibility measurement is never allowed to interrupt reading.
  }
}
