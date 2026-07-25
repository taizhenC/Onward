import "server-only";
import { deleteOwnedSession } from "./session";
import { latencyBucketForMs } from "./telemetry-latency";
import {
  createDeletionCorrelationId,
  createDeletionCorrelationIdForRequest,
  recordProductEvent,
} from "./telemetry";
import type { ProductEvent } from "./telemetry-types";

export type StoryDeletionResult = "deleted" | "not_found";

export function isStorySessionId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{32}$/.test(value);
}

export async function deleteOwnedStory(input: {
  sessionId: string;
  userId: string | null;
  deletionRequestSeed?: string;
}, dependencies: StoryDeletionDependencies = {}): Promise<StoryDeletionResult> {
  const deleteSession = dependencies.deleteSession ?? deleteOwnedSession;
  const recordEvent =
    dependencies.recordEvent ??
    ((event: ProductEvent) => recordProductEvent({ event, flowId: null }));
  const now = dependencies.now ?? Date.now;
  const startedAt = now();
  if (!input.userId || !isStorySessionId(input.sessionId)) return "not_found";

  const result = await deleteSession(input.sessionId, input.userId);
  if (result !== "deleted" && result !== "not_found") {
    throw new Error("story deletion returned an invalid result");
  }
  if (result === "not_found") return result;
  const deletionLatencyBucket = latencyBucketForMs(
    Math.min(Math.max(now() - startedAt, 0), 3_600_000),
  );

  // Observation begins only after the owner-scoped store confirms the privacy
  // mutation. ID setup and provider calls remain entirely best-effort: missing
  // telemetry configuration or a hung store cannot retain the story.
  const telemetry = startDeletionTelemetry(
    input.deletionRequestSeed,
    recordEvent,
  );

  if (telemetry) {
    const completion = telemetry.request.then(() =>
      recordDeletionEventBestEffort(
        {
          event: "deletion_completed",
          deletionId: telemetry.deletionId,
          scope: "story",
          latencyBucket: deletionLatencyBucket,
        },
        recordEvent,
      ),
    );
    // Give fast stores a small delivery opportunity. The hard deadline bounds
    // response delay after content is already gone; the write may be omitted.
    await settleWithin(completion, TELEMETRY_SETTLE_BUDGET_MS);
  }
  return "deleted";
}

type StoryDeletionDependencies = {
  deleteSession?: typeof deleteOwnedSession;
  recordEvent?: (event: ProductEvent) => Promise<unknown>;
  now?: () => number;
};

function startDeletionTelemetry(
  seed: string | undefined,
  recordEvent: NonNullable<StoryDeletionDependencies["recordEvent"]>,
): {
  deletionId: ReturnType<typeof createDeletionCorrelationId>;
  request: Promise<void>;
} | null {
  try {
    const deletionId = seed
      ? createDeletionCorrelationIdForRequest(seed)
      : createDeletionCorrelationId();
    return {
      deletionId,
      request: recordDeletionEventBestEffort(
        { event: "deletion_requested", deletionId, scope: "story" },
        recordEvent,
      ),
    };
  } catch {
    return null;
  }
}

async function recordDeletionEventBestEffort(
  event: ProductEvent,
  recordEvent: NonNullable<StoryDeletionDependencies["recordEvent"]>,
): Promise<void> {
  try {
    await recordEvent(event);
  } catch {
    // Privacy deletion owns availability. Observation can be incomplete.
  }
}

async function settleWithin(
  promise: Promise<void>,
  budgetMs: number,
): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    promise,
    new Promise<void>((resolve) => {
      timeout = setTimeout(resolve, budgetMs);
    }),
  ]);
  if (timeout) clearTimeout(timeout);
}

const TELEMETRY_SETTLE_BUDGET_MS = 100;
