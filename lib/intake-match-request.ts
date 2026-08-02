import type { MatchClarification } from "./match-recovery";
import type { StoryBoundaries } from "./story-boundaries";

export type IntakeMatchRequest = Readonly<{
  age: number;
  feeling: string;
  boundaries?: StoryBoundaries;
  clarification?: MatchClarification;
  acceptAdjacent?: true;
  recoveryToken?: string;
}>;

type IntakeMatchRequestInput = Readonly<{
  age: number;
  feeling: string;
  boundaries: StoryBoundaries | undefined;
  clarification: MatchClarification | null;
  acceptAdjacent: boolean;
  recoveryToken: string | null;
}>;

export function buildIntakeMatchRequest(
  input: IntakeMatchRequestInput,
): IntakeMatchRequest {
  return {
    age: input.age,
    feeling: input.feeling,
    ...(input.boundaries
      ? {
          boundaries: {
            maxIntensity: input.boundaries.maxIntensity,
            excludedFlags: [...input.boundaries.excludedFlags],
          },
        }
      : {}),
    ...(input.clarification ? { clarification: input.clarification } : {}),
    ...(input.acceptAdjacent ? { acceptAdjacent: true as const } : {}),
    ...(input.recoveryToken ? { recoveryToken: input.recoveryToken } : {}),
  };
}
