import {
  parseMatchClarification,
  type MatchClarification,
} from "./match-recovery";
import {
  parseStoryBoundaries,
  type StoryBoundaries,
} from "./story-boundaries";
import { STORY_REQUEST_CONTEXT_VERSION } from "./alternate-story-types";

// A closed, private projection retained only on the original session. JSON null
// means the reader selected no value; a SQL/null Session field means the exact
// historical context is unavailable and alternates must fail closed.
export type StoryRequestContext = {
  schemaVersion: typeof STORY_REQUEST_CONTEXT_VERSION;
  boundaries: StoryBoundaries | null;
  clarification: MatchClarification | null;
  acceptedAdjacent: boolean;
};

export function createStoryRequestContext(input: {
  boundaries: StoryBoundaries | undefined;
  clarification: MatchClarification | undefined;
  acceptedAdjacent?: boolean;
}): StoryRequestContext {
  return {
    schemaVersion: STORY_REQUEST_CONTEXT_VERSION,
    boundaries: input.boundaries
      ? {
          maxIntensity: input.boundaries.maxIntensity,
          excludedFlags: [...input.boundaries.excludedFlags].sort(),
        }
      : null,
    clarification: input.clarification ?? null,
    acceptedAdjacent: input.acceptedAdjacent === true,
  };
}

export function parseStoryRequestContext(
  value: unknown,
): StoryRequestContext | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate).sort().join(",");
  const current =
    keys === "acceptedAdjacent,boundaries,clarification,schemaVersion" &&
    candidate.schemaVersion === STORY_REQUEST_CONTEXT_VERSION &&
    typeof candidate.acceptedAdjacent === "boolean";
  const legacy =
    keys === "boundaries,clarification,schemaVersion" &&
    candidate.schemaVersion === LEGACY_STORY_REQUEST_CONTEXT_VERSION;
  if (!current && !legacy) {
    return null;
  }

  let boundaries: StoryBoundaries | null = null;
  if (candidate.boundaries !== null) {
    const parsed = parseStoryBoundaries(candidate.boundaries);
    if ("error" in parsed || !parsed.value) return null;
    boundaries = {
      maxIntensity: parsed.value.maxIntensity,
      excludedFlags: [...parsed.value.excludedFlags].sort(),
    };
  }

  let clarification: MatchClarification | null = null;
  if (candidate.clarification !== null) {
    const parsed = parseMatchClarification(candidate.clarification);
    if ("error" in parsed || !parsed.value) return null;
    clarification = parsed.value;
  }

  return {
    schemaVersion: STORY_REQUEST_CONTEXT_VERSION,
    boundaries,
    clarification,
    acceptedAdjacent: current ? candidate.acceptedAdjacent === true : false,
  };
}

const LEGACY_STORY_REQUEST_CONTEXT_VERSION =
  "story-request-context-v1-2026-07";
