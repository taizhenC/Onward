import type { Confidence, Framing } from "./types";

export const MATCH_RECOVERY_POLICY_VERSION = "match-recovery-v1-2026-07";

export const MATCH_CLARIFICATION_OPTIONS = [
  {
    id: "rejection",
    label: "Being rejected or unseen",
    description: "A closed door, dismissal, or work that is not recognized.",
    searchPhrase: "rejected dismissed ignored unseen not recognized",
  },
  {
    id: "isolation",
    label: "Being alone or outside",
    description: "Not belonging, losing connection, or carrying this alone.",
    searchPhrase: "alone lonely isolated outsider do not belong",
  },
  {
    id: "blocked_agency",
    label: "Feeling stuck or powerless",
    description: "Wanting change while choices or control feel limited.",
    searchPhrase: "stuck trapped blocked powerless no control",
  },
  {
    id: "shame",
    label: "What this says about me",
    description: "Shame, worth, failure, or not feeling good enough.",
    searchPhrase: "ashamed shame worthless failure not good enough",
  },
  {
    id: "uncertainty",
    label: "Not knowing what comes next",
    description: "An unclear direction, identity, or next step.",
    searchPhrase: "uncertain unsure identity next step which direction",
  },
  {
    id: "loss",
    label: "Living with a loss or ending",
    description: "Grief, separation, or something important being gone.",
    searchPhrase: "loss grief ending separation something is gone",
  },
] as const;

export type MatchClarification =
  (typeof MATCH_CLARIFICATION_OPTIONS)[number]["id"];

export type MatchDisposition =
  | "close_match"
  | "adjacent_match"
  | "clarification_needed"
  | "no_close_match";

export function parseMatchClarification(
  value: unknown,
): { value: MatchClarification | undefined } | { error: string } {
  if (value === undefined) return { value: undefined };
  if (
    typeof value !== "string" ||
    !MATCH_CLARIFICATION_OPTIONS.some((option) => option.id === value)
  ) {
    return { error: "Match clarification is invalid." };
  }
  return { value: value as MatchClarification };
}

export function clarificationSearchPhrase(
  clarification: MatchClarification,
): string {
  return MATCH_CLARIFICATION_OPTIONS.find(
    (option) => option.id === clarification,
  )!.searchPhrase;
}

export function withMatchClarification(
  feeling: string,
  clarification: MatchClarification | undefined,
): string {
  if (!clarification) return feeling;
  return `${feeling}\n\nClarification (controlled choice): ${clarificationSearchPhrase(clarification)}`;
}

export function decideMatchDisposition(input: {
  confidence: Confidence;
  framing: Framing;
  ageFallback: boolean;
  clarificationProvided: boolean;
  acceptAdjacent: boolean;
}): MatchDisposition {
  if (
    input.confidence === "high" &&
    input.framing === "definitive" &&
    !input.ageFallback
  ) {
    return "close_match";
  }
  if (input.confidence === "high" || input.acceptAdjacent) {
    return "adjacent_match";
  }
  if (!input.clarificationProvided) return "clarification_needed";
  if (input.confidence === "medium") return "adjacent_match";
  return "no_close_match";
}
