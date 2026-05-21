import "server-only";
import type { FigureStageRow } from "./types";
import { ageDistance } from "./figures";
import { STUB_KEYWORD_MAP } from "./match-config";

// The keyword-hybrid scorer: keyword/theme overlap (the meaning signal) minus a soft
// age penalty (a feasibility guardrail, never the primary signal). Extracted out of
// lib/matching.ts into its own module so BOTH consumers can share it without an import
// cycle (matching → llm → llm-stub → keyword-match would loop back into matching):
//   1. lib/llm-stub.ts  — the stub `pickFigure`.
//   2. lib/matching.ts  — the degraded fallback when the real reranker fails.
// Age alone never decides a match here; that would discard the user's feeling.

export type KeywordPick = {
  stage: FigureStageRow;
  keywordScore: number;
  agePenalty: number;
  totalScore: number;
};

const AGE_SOFT_PENALTY_PER_YEAR = 0.1;
const KEYWORD_MATCHERS = Object.entries(STUB_KEYWORD_MAP).map(
  ([keyword, themes]) => ({
    regex: new RegExp(keywordPattern(keyword), "i"),
    themes,
  }),
);

export function pickByKeywordHybrid(
  input: { age: number; feeling: string },
  pool: FigureStageRow[],
): KeywordPick {
  if (pool.length === 0) {
    throw new Error("pickByKeywordHybrid requires a non-empty candidate pool.");
  }

  const scored = pool.map((stage) => scoreStage(stage, input));
  scored.sort(compareScoredStages);
  return scored[0];
}

function scoreStage(
  stage: FigureStageRow,
  input: { age: number; feeling: string },
): KeywordPick {
  const keywordScore = scoreKeywords(stage, input.feeling);
  const agePenalty = ageDistance(stage, input.age) * AGE_SOFT_PENALTY_PER_YEAR;

  return {
    stage,
    keywordScore,
    agePenalty,
    totalScore: keywordScore - agePenalty,
  };
}

function scoreKeywords(stage: FigureStageRow, feeling: string): number {
  const normalizedFeeling = feeling.toLowerCase();
  let score = 0;

  for (const { regex, themes } of KEYWORD_MATCHERS) {
    if (!regex.test(normalizedFeeling)) continue;
    for (const theme of themes) {
      if (stage.themes.includes(theme)) score += 1;
    }
  }

  return score;
}

function keywordPattern(keyword: string): string {
  const escapedKeyword = escapeRegExp(keyword.toLowerCase());
  return keyword.includes(" ")
    ? `(?<![a-z0-9])${escapedKeyword}(?![a-z0-9])`
    : `\\b${escapedKeyword}\\b`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compareScoredStages(a: KeywordPick, b: KeywordPick): number {
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
  if (b.keywordScore !== a.keywordScore) return b.keywordScore - a.keywordScore;
  if (a.agePenalty !== b.agePenalty) return a.agePenalty - b.agePenalty;
  return a.stage.figureKey.localeCompare(b.stage.figureKey);
}
