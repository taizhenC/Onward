"use client";

import { useEffect, useState } from "react";

type Props = {
  sessionId: string;
  beatIndex: number;
  onComplete: () => void;
  isFinal: boolean;
};

export function StoryBeat({ sessionId, beatIndex, onComplete, isFinal }: Props) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText("");
    setDone(false);
    setError(null);

    const controller = new AbortController();
    let cancelled = false;

    async function run() {
      let response: Response;
      try {
        response = await fetch("/api/beat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId, beatIndex }),
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
        if (!cancelled) setDone(true);
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
  }, [sessionId, beatIndex]);

  return (
    <div className="space-y-8">
      <p className="whitespace-pre-wrap">{text}</p>
      {error ? (
        <p className="font-ui text-sm text-[var(--color-accent)]">{error}</p>
      ) : null}
      {done && !isFinal ? (
        <button
          type="button"
          onClick={onComplete}
          className="font-ui text-sm uppercase tracking-wider border border-[var(--color-ink-soft)] px-5 py-2 hover:border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] transition-colors"
        >
          Continue
        </button>
      ) : null}
      {done && isFinal ? (
        <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)] pt-4">
          The journey ends here.
        </p>
      ) : null}
    </div>
  );
}
