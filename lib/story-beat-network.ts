import type { StoryAdvance } from "@/lib/types";

export type BeatRequestPhase = "delivery" | "acknowledgement";

export type BeatFailureKind =
  | "notfound"
  | "conflict"
  | "connection"
  | "transient"
  | "generic";

export type BeatRequestFailure = Readonly<{
  ok: false;
  kind: BeatFailureKind;
}>;

export type BeatAcknowledgementResult =
  | Readonly<{ ok: true; next: StoryAdvance }>
  | BeatRequestFailure;

export type BeatFailureRecovery = "restart" | "reload" | "retry";

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export function beatFailureFromStatus(status: number): BeatFailureKind {
  if (status === 404) return "notfound";
  if (status === 409) return "conflict";
  if (status >= 500) return "transient";
  return "generic";
}

export function beatFailureRecovery(
  kind: BeatFailureKind,
): BeatFailureRecovery {
  if (kind === "notfound") return "restart";
  if (kind === "conflict") return "reload";
  return "retry";
}

export function parseStoryAdvance(
  value: unknown,
): StoryAdvance | null {
  if (value === "chunk" || value === "beat" || value === "end") {
    return value;
  }
  return null;
}

type AcknowledgeStoryPassageInput = Readonly<{
  sessionId: string;
  beatIndex: number;
  chunkIndex: number;
  signal?: AbortSignal;
}>;

export async function acknowledgeStoryPassage(
  {
    sessionId,
    beatIndex,
    chunkIndex,
    signal,
  }: AcknowledgeStoryPassageInput,
  fetcher: FetchLike = fetch,
): Promise<BeatAcknowledgementResult> {
  let response: Response;
  try {
    response = await fetcher("/api/beat/ack", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, beatIndex, chunkIndex }),
      signal,
    });
  } catch {
    return { ok: false, kind: "connection" };
  }

  if (!response.ok) {
    return { ok: false, kind: beatFailureFromStatus(response.status) };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, kind: "generic" };
  }

  if (body !== null && typeof body === "object" && "next" in body) {
    const next = parseStoryAdvance((body as { next: unknown }).next);
    if (next) return { ok: true, next };
  }

  return { ok: false, kind: "generic" };
}
