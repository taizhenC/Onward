import { getByKey } from "@/lib/figures";
import { streamBeat } from "@/lib/llm-stub";
import { getSession, updateSession } from "@/lib/session";

export const runtime = "nodejs";

type BeatRequestBody = {
  sessionId?: unknown;
  beatIndex?: unknown;
};

const textHeaders = {
  "content-type": "text/plain; charset=utf-8",
};

export async function POST(request: Request): Promise<Response> {
  let body: BeatRequestBody;

  try {
    body = (await request.json()) as BeatRequestBody;
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = parseBeatRequest(body);
  if ("error" in parsed) return jsonError(parsed.error, 400);

  const session = getSession(parsed.sessionId);
  if (!session) return jsonError("Story session not found.", 404);

  if (session.nextBeatIndex !== parsed.beatIndex) {
    return jsonError("Beat index does not match the current session position.", 409);
  }

  const stage = getByKey(session.figureKey, session.stageId);
  if (!stage) return jsonError("Figure stage not found.", 404);

  const beat = stage.beats[parsed.beatIndex];
  if (!beat) return jsonError("Beat index is out of range.", 400);

  const advanceTo =
    beat.kind === "decision" ? undefined : parsed.beatIndex + 1;

  return new Response(
    streamText(streamBeat({ session, beat }), () => {
      if (advanceTo !== undefined) {
        updateSession(parsed.sessionId, { nextBeatIndex: advanceTo });
      }
    }),
    { headers: textHeaders },
  );
}

function parseBeatRequest(
  body: BeatRequestBody,
): { sessionId: string; beatIndex: number } | { error: string } {
  const sessionId = body.sessionId;
  const beatIndex = body.beatIndex;

  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return { error: "sessionId is required." };
  }

  if (
    typeof beatIndex !== "number" ||
    !Number.isInteger(beatIndex) ||
    beatIndex < 0
  ) {
    return { error: "beatIndex must be a non-negative integer." };
  }

  return { sessionId, beatIndex };
}

function streamText(
  chunks: AsyncIterable<string>,
  onComplete: () => void,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        onComplete();
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}
