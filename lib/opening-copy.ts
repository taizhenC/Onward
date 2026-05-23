import "server-only";
import type { FigureStageRow } from "./types";

// Neutral fallback eyebrow. Returned by the stub, and by the real generator whenever
// the LLM call fails or its output fails the runtime guard below. Generation is
// best-effort: a degraded line must never block the story from loading.
export const NEUTRAL_EYEBROW = "A life under a similar pressure";

// A quiet chapter-eyebrow is a few words; anything sentence-length is the model
// ignoring instructions, so we fall back rather than show it.
const EYEBROW_MAX_LENGTH = 72;

const FIGURE_NAME_STOP_WORDS = new Set([
  "and",
  "for",
  "from",
  "great",
  "the",
  "with",
]);

// Public input to writeOpeningCopy. The full stage is accepted but immediately
// narrowed to the prompt surface below, so beats / sources / biography never reach
// the copy prompt.
export type OpeningCopyInput = {
  feeling: string;
  stage: FigureStageRow;
};

// The ONLY fields that may reach the eyebrow prompt. displayName is validation-only
// (used to reject figure-name leaks), never prompt material.
export type EyebrowPromptSurface = {
  feeling: string;
  throughLine: string;
  displayName: string;
};

export function toEyebrowSurface(input: OpeningCopyInput): EyebrowPromptSurface {
  return {
    feeling: input.feeling,
    throughLine: input.stage.shapeSentences[0] ?? "",
    displayName: input.stage.displayName,
  };
}

// Runtime guard: validation is a property of the code, not a hope. A usable eyebrow
// is exactly one trimmed, non-empty, under-cap line that does not name the figure.
// Anything else (null, blank, preamble/multi-line, too long, name leak) returns the
// neutral fallback.
export function sanitizeEyebrow(raw: string | null, displayName: string): string {
  if (!raw) return NEUTRAL_EYEBROW;

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  // A well-formed response is a single line. More than one means the model added
  // preamble or explanation; don't guess which line is real.
  if (lines.length !== 1) return NEUTRAL_EYEBROW;

  const unquoted = lines[0]
    .replace(/^["'\u201c\u201d\u2018\u2019]+|["'\u201c\u201d\u2018\u2019]+$/g, "")
    .trim();
  if (unquoted.length === 0 || unquoted.length > EYEBROW_MAX_LENGTH) {
    return NEUTRAL_EYEBROW;
  }
  if (namesFigure(unquoted, displayName)) return NEUTRAL_EYEBROW;

  return unquoted;
}

// Reject meaningful whole-word tokens from the figure's display name, so the eyebrow
// can't spoil the anonymous-until-bridge reveal. Common particles and epithets are
// ignored to avoid false positives for names like "The Buddha" or "Catherine the
// Great".
function namesFigure(line: string, displayName: string): boolean {
  const haystack = line.toLowerCase();
  const tokens = displayName
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(
      (token) => token.length >= 3 && !FIGURE_NAME_STOP_WORDS.has(token),
    );
  return tokens.some((token) =>
    new RegExp(`\\b${escapeRegExp(token)}\\b`).test(haystack),
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
