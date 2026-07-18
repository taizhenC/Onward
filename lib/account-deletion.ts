import "server-only";
import {
  deleteAccountAtStore,
  type AccountStoreDeletionResult,
} from "./account-deletion-store";
import { latencyBucketForMs } from "./telemetry-latency";
import {
  createDeletionCorrelationId,
  createDeletionCorrelationIdForRequest,
  recordProductEvent,
} from "./telemetry";
import type { ProductEvent } from "./telemetry-types";

export type AccountDeletionResult = AccountStoreDeletionResult;

export async function deleteOwnedAccount(
  input: { userId: string | null; deletionRequestSeed?: string },
  dependencies: AccountDeletionDependencies = {},
): Promise<AccountDeletionResult> {
  if (!input.userId) return "not_found";
  const deleteAccount = dependencies.deleteAccount ?? deleteAccountAtStore;
  const recordEvent =
    dependencies.recordEvent ??
    ((event: ProductEvent) => recordProductEvent({ event, flowId: null }));
  const now = dependencies.now ?? Date.now;
  const startedAt = now();
  const result = await deleteAccount(input.userId);
  if (result !== "deleted" && result !== "not_found") {
    throw new Error("account deletion returned an invalid result");
  }
  if (result === "not_found") return result;

  const latencyBucket = latencyBucketForMs(
    Math.min(Math.max(now() - startedAt, 0), 3_600_000),
  );
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
          scope: "account",
          latencyBucket,
        },
        recordEvent,
      ),
    );
    await settleWithin(completion, TELEMETRY_SETTLE_BUDGET_MS);
  }
  return "deleted";
}

type AccountDeletionDependencies = {
  deleteAccount?: (userId: string) => Promise<AccountStoreDeletionResult>;
  recordEvent?: (event: ProductEvent) => Promise<unknown>;
  now?: () => number;
};

function startDeletionTelemetry(
  seed: string | undefined,
  recordEvent: NonNullable<AccountDeletionDependencies["recordEvent"]>,
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
        { event: "deletion_requested", deletionId, scope: "account" },
        recordEvent,
      ),
    };
  } catch {
    return null;
  }
}

async function recordDeletionEventBestEffort(
  event: ProductEvent,
  recordEvent: NonNullable<AccountDeletionDependencies["recordEvent"]>,
): Promise<void> {
  try {
    await recordEvent(event);
  } catch {
    // Account deletion owns availability. Observation can be incomplete.
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
