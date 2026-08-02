import "server-only";

export const textStreamHeaders = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
};

export function jsonError(message: string, status: number): Response {
  return Response.json(
    { error: message },
    { status, headers: { "cache-control": "no-store" } },
  );
}

export function streamText(
  chunks: AsyncIterable<string>,
  onComplete?: () => void,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        onComplete?.();
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
