import "server-only";
import type { FigureStageRow } from "./types";
import { PREFACE_FALLBACK_LINES } from "./preface-plan-contract";
import {
  toResonancePromptSurface,
  type ResonanceBrief,
  type ResonancePromptSurface,
} from "./resonance-brief";

// Neutral fallback eyebrow. Returned by the stub for any uncurated stage, and by the
// real generator whenever the LLM call fails or its output fails the runtime guard
// below. Generation is best-effort: a degraded line must never block the story.
export const NEUTRAL_EYEBROW = "A life under a similar pressure";

// Hand-authored eyebrows, one per stage, keyed by `${figureKey}:${stageId}`. The stub
// (lib/llm-stub.ts) serves these verbatim, so a dev or friend-test run with no provider
// key still shows a line tuned to the matched episode instead of the flat neutral one.
// The real generator (lib/llm-real.ts) ignores this map — it tailors per user feeling and
// deliberately keeps NEUTRAL_EYEBROW as its failure fallback so `npm run health` can still
// tell a dead prose call apart from a real one. Each line obeys the same constraints
// sanitizeEyebrow enforces below: one short fragment, under the length cap, naming no
// person, place, or year (the figure is anonymous until the bridge beat).
const CURATED_EYEBROWS: Record<string, string> = {
  "douglass:1838-1841-nyc-to-nantucket": "Beginning again with no name to stand on",
  "butler:1974-1975-pre-patternmaster": "Years of work no one had asked for",
  "lee:1929-1931-harvard-pivot": "A life spent inside someone else's plan",
};

// The stub's eyebrow for a stage: the curated line when one exists, else the neutral
// fallback. Keyed by stage (not figure) so v2 multi-stage figures can carry one line per
// episode without a signature change.
export function curatedEyebrow(figureKey: string, stageId: string): string {
  return CURATED_EYEBROWS[`${figureKey}:${stageId}`] ?? NEUTRAL_EYEBROW;
}

// Hand-authored universal preface: the comfort card shown before any figure name or story
// prose on first visit. Served by BOTH providers in Phase 1A — the stub has no model, and
// the real generator's per-brief personalization is deferred (lib/llm-real.ts returns
// these lines today and will keep them as its fallback once generation lands). Tone bar
// (CLAUDE.md): comfort without false promises, no dismissive "don't worry" language.
export const DEFAULT_PREFACE_LINES: readonly string[] =
  PREFACE_FALLBACK_LINES;

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
  resonanceBrief: ResonanceBrief;
  stage: FigureStageRow;
};

// The ONLY fields that may reach the eyebrow prompt. The raw disclosure, anchor
// provenance, and echo fingerprints are absent. displayName is validation-only
// (used to reject figure-name leaks), never prompt material.
export type EyebrowPromptSurface = {
  resonance: ResonancePromptSurface;
  throughLine: string;
  displayName: string;
};

// The exact provider-visible projection. Keep the display name on the preparation
// surface for output validation, but remove it from the runtime object handed to a
// prompt policy so a future policy cannot accidentally serialize it.
export type EyebrowProviderSurface = Readonly<
  Pick<EyebrowPromptSurface, "resonance" | "throughLine">
>;

export function toEyebrowSurface(input: OpeningCopyInput): EyebrowPromptSurface {
  return {
    resonance: toResonancePromptSurface(input.resonanceBrief),
    throughLine: input.stage.shapeSentences[0] ?? "",
    displayName: input.stage.displayName,
  };
}

export function toEyebrowProviderSurface(
  surface: EyebrowPromptSurface,
): EyebrowProviderSurface {
  return Object.freeze({
    resonance: Object.freeze({ ...surface.resonance }),
    throughLine: surface.throughLine,
  });
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
