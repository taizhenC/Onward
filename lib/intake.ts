import "server-only";
import type { MatchResponse } from "./types";
import { CRISIS_RESOURCES, classifyCrisis } from "./safety";
import { createSession } from "./session";
import { match } from "./matching";

export type IntakeInput = {
  age: number;
  feeling: string;
};

export function handleIntake(input: IntakeInput): MatchResponse {
  const crisis = classifyCrisis(input.feeling);
  if (crisis.crisisDetected) {
    return { crisis: true, resources: CRISIS_RESOURCES };
  }

  const result = match(input);
  const sessionId = createSession({
    figureKey: result.figureKey,
    stageId: result.stageId,
    framing: result.framing,
    age: input.age,
    feeling: input.feeling,
  });

  return { sessionId };
}
