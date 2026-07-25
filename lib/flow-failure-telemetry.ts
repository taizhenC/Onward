import "server-only";
import {
  createTelemetryOccurrenceId,
  recordProductEvent,
} from "./telemetry";
import { reduceFlowFailure } from "./telemetry-reductions";
import { telemetryFlowBindingEnabled } from "./telemetry-flow-lifecycle";
import type {
  ProductEvent,
  TelemetryFlowId,
  TelemetryOccurrenceId,
} from "./telemetry-types";

export type InitialStoryPreparationFailureCaptureResult =
  | "created"
  | "duplicate"
  | "unavailable"
  | "skipped";

type FailureWriteInput = {
  event: ProductEvent;
  flowId: TelemetryFlowId | null;
  occurrenceId?: TelemetryOccurrenceId;
};

export type InitialStoryPreparationFailureDependencies = {
  now?: () => number;
  issueOccurrenceId?: () => TelemetryOccurrenceId;
  write?: (
    input: FailureWriteInput,
  ) => Promise<"created" | "duplicate" | "conflict">;
};

export type InitialStoryPreparationFailureRecorder = Readonly<{
  capture(error: unknown): Promise<InitialStoryPreparationFailureCaptureResult>;
  captureContentConflict(): Promise<InitialStoryPreparationFailureCaptureResult>;
}>;

export const INITIAL_STORY_FAILURE_CAPTURE_BUDGET_MS = 1_000;
const CAPTURE_ATTEMPTS = 2;
const CAPTURE_ATTEMPT_BUDGET_MS =
  INITIAL_STORY_FAILURE_CAPTURE_BUDGET_MS / CAPTURE_ATTEMPTS;
const CAPTURE_TIMED_OUT = Symbol("capture_timed_out");

const PREPARATION_CONTENT_CONFLICT = Object.freeze({
  errorClass: "conflict" as const,
});

const SKIPPED_RECORDER: InitialStoryPreparationFailureRecorder = Object.freeze({
  async capture() {
    return "skipped" as const;
  },
  async captureContentConflict() {
    return "skipped" as const;
  },
});

// This is deliberately the only production owner of flow_failed today. It is
// created immediately before an eligible initial story's preparation attempt,
// fixes the domain to composition, and exposes no generic route-level emitter.
// A successful canonical fallback is still a prepared artifact and never calls
// either capture method.
export function beginInitialStoryPreparationFailureRecorder(
  flowId: TelemetryFlowId | null,
  dependencies: InitialStoryPreparationFailureDependencies = {},
): InitialStoryPreparationFailureRecorder {
  if (!flowId || !telemetryFlowBindingEnabled()) return SKIPPED_RECORDER;

  const now = dependencies.now ?? (() => performance.now());
  const issueOccurrenceId =
    dependencies.issueOccurrenceId ?? createTelemetryOccurrenceId;
  const write = dependencies.write ?? recordProductEvent;
  let occurrenceId: TelemetryOccurrenceId;
  let startedAt: number;
  try {
    // The token is server-minted once per preparation attempt. If the event
    // write has an ambiguous result, both capture tries below reuse it.
    occurrenceId = issueOccurrenceId();
    startedAt = now();
  } catch {
    return SKIPPED_RECORDER;
  }

  const capture = async (
    error: unknown,
  ): Promise<InitialStoryPreparationFailureCaptureResult> => {
    let event: Readonly<Extract<ProductEvent, { event: "flow_failed" }>>;
    try {
      event = reduceFlowFailure({
        domain: "composition",
        error,
        durationMs: now() - startedAt,
      });
    } catch {
      return "unavailable";
    }

    const input = { event, flowId, occurrenceId } as const;
    for (let attempt = 0; attempt < CAPTURE_ATTEMPTS; attempt += 1) {
      try {
        const result = await writeWithinBudget(write, input);
        if (result === CAPTURE_TIMED_OUT) continue;
        return result === "created" || result === "duplicate"
          ? result
          : "unavailable";
      } catch {
        // A transport failure can hide a committed event/outbox transaction.
        // Replay once with the exact same occurrence-derived event ID.
      }
    }
    return "unavailable";
  };

  return Object.freeze({
    capture,
    captureContentConflict: () => capture(PREPARATION_CONTENT_CONFLICT),
  });
}

async function writeWithinBudget(
  write: NonNullable<InitialStoryPreparationFailureDependencies["write"]>,
  input: FailureWriteInput,
): Promise<"created" | "duplicate" | "conflict" | typeof CAPTURE_TIMED_OUT> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      write(input),
      new Promise<typeof CAPTURE_TIMED_OUT>((resolveTimeout) => {
        timeout = setTimeout(
          () => resolveTimeout(CAPTURE_TIMED_OUT),
          CAPTURE_ATTEMPT_BUDGET_MS,
        );
      }),
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
