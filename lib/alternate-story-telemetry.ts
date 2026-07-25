import "server-only";
import { prepareProductEventCapture } from "./telemetry";
import { resolveOwnedTelemetryFlowForKnownSession } from "./telemetry-flow-binding";
import { telemetryFlowBindingEnabled } from "./telemetry-flow-lifecycle";
import {
  alternateRequestedEvent,
  alternateResolvedEvent,
  artifactCreatedEvent,
} from "./telemetry-producers";
import type {
  ProductEventCapture,
  TelemetryFlowId,
} from "./telemetry-types";
import type { Session } from "./types";
import type { StoryArtifact } from "./story-artifact-types";

export type AlternateRequestedTelemetryCapture = Readonly<
  Extract<ProductEventCapture, { event: "alternate_requested" }>
>;
export type AlternateResolvedTelemetryCapture = Readonly<
  Extract<ProductEventCapture, { event: "alternate_resolved" }>
>;
export type AlternateArtifactTelemetryCapture = Readonly<
  Extract<ProductEventCapture, { event: "artifact_created" }>
>;
export type AlternateReadyTelemetry = Readonly<{
  artifact: AlternateArtifactTelemetryCapture;
  resolution: AlternateResolvedTelemetryCapture;
}>;

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

export function prepareAlternateResolvedTelemetry(
  flowId: TelemetryFlowId | null,
  outcome: AlternateResolvedTelemetryCapture["outcome"],
): AlternateResolvedTelemetryCapture | null {
  if (!telemetryFlowBindingEnabled() || flowId === null) return null;
  return prepareProductEventCapture({
    flowId,
    event: alternateResolvedEvent(outcome),
  });
}

export function prepareAlternateReadyTelemetry(
  flowId: TelemetryFlowId | null,
  artifact: StoryArtifact,
): AlternateReadyTelemetry | null {
  if (!telemetryFlowBindingEnabled() || flowId === null) return null;
  return Object.freeze({
    artifact: prepareProductEventCapture({
      flowId,
      event: artifactCreatedEvent(artifact, "alternate"),
    }),
    resolution: prepareProductEventCapture({
      flowId,
      event: alternateResolvedEvent("ready"),
    }),
  });
}
