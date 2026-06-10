"use client";

import { useEffect, useRef, useState } from "react";

import type { StoryAdvance } from "@/lib/types";

type Props = {
  sessionId: string;
  beatIndex: number;
  chunkIndex: number;
  onComplete: (next: StoryAdvance) => void;
  // Fired once when the ack resolves next === "end" (the in-flow story finish).
  // Separate channel from onComplete, whose contract excludes "end".
  onEnd?: () => void;
};

export function StoryBeat({
  sessionId,
  beatIndex,
  chunkIndex,
  onComplete,
  onEnd,
}: Props) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextStep, setNextStep] = useState<StoryAdvance | null>(null);

  // Ref so the streaming effect below doesn't list onEnd as a dependency — a parent
  // re-render handing in a fresh closure must not abort and restart the stream.
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    setText("");
    setDone(false);
    setError(null);
    setNextStep(null);

    const controller = new AbortController();
    let cancelled = false;

    async function run() {
      let response: Response;
      try {
        response = await fetch("/api/beat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId, beatIndex, chunkIndex }),
          signal: controller.signal,
        });
      } catch (caught) {
        if (cancelled || (caught as Error).name === "AbortError") return;
        setError("The connection dropped. Refresh to keep reading.");
        return;
      }

      if (!response.ok || !response.body) {
        if (!cancelled) setError("This beat could not be loaded.");
        return;
      }

      const headerNext = parseNextStep(response.headers.get("x-onward-next"));
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { value, done: streamDone } = await reader.read();
          if (cancelled) return;
          if (streamDone) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk.length > 0) {
            setText((previous) => previous + chunk);
          }
        }
        const lastChunk = decoder.decode();
        if (lastChunk.length > 0) {
          setText((previous) => previous + lastChunk);
        }
        const next = await acknowledgeBeat({
          sessionId,
          beatIndex,
          chunkIndex,
          fallbackNext: headerNext,
          signal: controller.signal,
        });
        if (cancelled) return;
        if (next === null) {
          setError("Progress could not be saved. Refresh to continue.");
          return;
        }
        if (!cancelled) {
          setNextStep(next);
          setDone(true);
          if (next === "end") onEndRef.current?.();
        }
      } catch (caught) {
        if (cancelled || (caught as Error).name === "AbortError") return;
        setError("The connection dropped mid-beat. Refresh to keep reading.");
      }
    }

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [sessionId, beatIndex, chunkIndex]);

  return (
    <div className="space-y-8">
      <p className="whitespace-pre-wrap">{text}</p>
      {error ? (
        <p className="font-ui text-sm text-[var(--color-accent)]">{error}</p>
      ) : null}
      {done && nextStep !== null && nextStep !== "end" ? (
        <button
          type="button"
          onClick={() => onComplete(nextStep)}
          className="font-ui text-sm uppercase tracking-wider border border-[var(--color-ink-soft)] px-5 py-2 hover:border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] transition-colors"
        >
          Continue
        </button>
      ) : null}
      {done && nextStep === "end" ? (
        <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)] pt-4">
          The journey ends here.
        </p>
      ) : null}
    </div>
  );
}

type AcknowledgeBeatInput = {
  sessionId: string;
  beatIndex: number;
  chunkIndex: number;
  fallbackNext: StoryAdvance;
  signal: AbortSignal;
};

async function acknowledgeBeat({
  sessionId,
  beatIndex,
  chunkIndex,
  fallbackNext,
  signal,
}: AcknowledgeBeatInput): Promise<StoryAdvance | null> {
  let response: Response;
  try {
    response = await fetch("/api/beat/ack", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, beatIndex, chunkIndex }),
      signal,
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return fallbackNext;
  }

  if (body !== null && typeof body === "object" && "next" in body) {
    return parseNextStep((body as { next: unknown }).next, fallbackNext);
  }

  return fallbackNext;
}

function parseNextStep(value: unknown, fallback: StoryAdvance = "end"): StoryAdvance {
  if (value === "chunk" || value === "beat" || value === "end") {
    return value;
  }
  return fallback;
}
