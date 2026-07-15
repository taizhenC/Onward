import { latencyBucketForMs } from "./telemetry-latency";
import type { LatencyBucket } from "./telemetry-types";

const MAX_VISIBILITY_DURATION_MS = 3_600_000;
const FIRST_CONTENT_NAVIGATION_WINDOW_MS = 30_000;

type PendingFirstContentTiming = {
  startedAt: number;
  sessionId: string | null;
  boundAt: number | null;
};

// App Router navigation preserves this module instance, while reloads and new
// tabs intentionally do not. The accepted response binds its already-known
// session only in ephemeral memory so an abandoned navigation cannot donate a
// timestamp to some other saved story.
let pendingFirstContentTiming: PendingFirstContentTiming | null = null;

export function monotonicEpochMs(): number | null {
  try {
    const origin = performance.timeOrigin;
    const elapsed = performance.now();
    const value = origin + elapsed;
    return Number.isFinite(value) && value >= 0 ? value : null;
  } catch {
    return null;
  }
}

export function markFirstContentRequestStarted(): void {
  const startedAt = monotonicEpochMs();
  pendingFirstContentTiming =
    startedAt === null
      ? null
      : { startedAt, sessionId: null, boundAt: null };
}

export function bindFirstContentStory(sessionId: string): void {
  if (!pendingFirstContentTiming || !sessionId) return;
  const boundAt = monotonicEpochMs();
  if (boundAt === null) {
    pendingFirstContentTiming = null;
    return;
  }
  pendingFirstContentTiming = {
    ...pendingFirstContentTiming,
    sessionId,
    boundAt,
  };
}

export function clearFirstContentRequestStarted(): void {
  pendingFirstContentTiming = null;
}

export function consumeFirstContentLatencyBucket(
  sessionId: string,
): LatencyBucket | null {
  const timing = pendingFirstContentTiming;
  if (!timing) return null;
  pendingFirstContentTiming = null;
  if (timing.sessionId !== sessionId) return null;
  const endedAt = monotonicEpochMs();
  if (
    endedAt === null ||
    timing.boundAt === null ||
    endedAt - timing.boundAt < 0 ||
    endedAt - timing.boundAt > FIRST_CONTENT_NAVIGATION_WINDOW_MS
  ) {
    return null;
  }
  return elapsedLatencyBucket(timing.startedAt, endedAt);
}

export function elapsedLatencyBucket(
  startedAt: number,
  endedAt: number | null = monotonicEpochMs(),
): LatencyBucket | null {
  if (
    endedAt === null ||
    !Number.isFinite(startedAt) ||
    startedAt < 0
  ) {
    return null;
  }
  const duration = endedAt - startedAt;
  if (
    !Number.isFinite(duration) ||
    duration < 0 ||
    duration > MAX_VISIBILITY_DURATION_MS
  ) {
    return null;
  }
  try {
    return latencyBucketForMs(duration);
  } catch {
    return null;
  }
}

export function sendFirstContentShown(
  sessionId: string,
  latencyBucket: LatencyBucket,
): Promise<void> {
  return sendVisibility("/api/telemetry/first-content", {
    sessionId,
    latencyBucket,
  });
}

export function sendPassagePresented(input: {
  sessionId: string;
  beatIndex: number;
  chunkIndex: number;
  latencyBucket: LatencyBucket;
}): Promise<void> {
  return sendVisibility("/api/telemetry/passage-presented", input);
}

export function sendSourceOpened(sessionId: string): Promise<void> {
  return sendVisibility("/api/telemetry/source-opened", { sessionId });
}

async function sendVisibility(
  path: string,
  body: Readonly<Record<string, string | number>>,
): Promise<void> {
  const request = () =>
    fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      credentials: "same-origin",
      keepalive: true,
    });
  try {
    const response = await request();
    if (response.ok || response.status < 500) return;
    await request();
  } catch {
    try {
      await request();
    } catch {
      // Visibility telemetry never changes story behavior.
    }
  }
}
