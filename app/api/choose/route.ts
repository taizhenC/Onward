import { jsonError } from "@/lib/api-utils";
import { getByKey } from "@/lib/figures";
import { getSession, updateSession } from "@/lib/session";

export const runtime = "nodejs";

type ChooseRequestBody = {
  sessionId?: unknown;
  beatIndex?: unknown;
  choice?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  let body: ChooseRequestBody;

  try {
    body = (await request.json()) as ChooseRequestBody;
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = parseChooseRequest(body);
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

  if (beat.kind !== "decision") {
    return jsonError("Beat is not a decision beat.", 400);
  }

  const revealBeat = stage.beats[parsed.beatIndex + 1];
  if (!revealBeat || revealBeat.role !== "reveal") {
    return jsonError("Decision beat is missing its reveal beat.", 500);
  }

  const continuation = beat.decisionContinuations.find(
    (candidate) => candidate.label === parsed.choice,
  );
  if (!continuation) {
    return jsonError("Choice does not match a decision option.", 400);
  }

  const updated = updateSession(parsed.sessionId, {
    choices: { [parsed.beatIndex]: parsed.choice },
    nextBeatIndex: parsed.beatIndex + 1,
  });
  if (!updated) return jsonError("Story session not found.", 404);

  return Response.json({ nextBeatIndex: parsed.beatIndex + 1 });
}

function parseChooseRequest(
  body: ChooseRequestBody,
): { sessionId: string; beatIndex: number; choice: string } | { error: string } {
  const sessionId = body.sessionId;
  const beatIndex = body.beatIndex;
  const choice = body.choice;

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

  if (typeof choice !== "string" || choice.length === 0) {
    return { error: "choice is required." };
  }

  return {
    sessionId,
    beatIndex,
    choice,
  };
}
