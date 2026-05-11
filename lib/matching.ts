import "server-only";
import type { FigureStageRow, Framing } from "./types";
import { ageDistance, listAll, listByAge } from "./figures";
import {
  PARTIAL_FRAMING_THRESHOLD,
  STUB_KEYWORD_MAP,
} from "./match-config";

export type MatchInput = {
  age: number;
  feeling: string;
};

export type MatchResult = {
  figureKey: string;
  stageId: string;
  framing: Framing;
};

type ScoredStage = {
  stage: FigureStageRow;
  keywordScore: number;
  agePenalty: number;
  totalScore: number;
};

const AGE_SOFT_PENALTY_PER_YEAR = 0.1;

export function match(input: MatchInput): MatchResult {
  const candidates = listByAge(input.age);
  const fallbackToAll = candidates.length === 0;
  const pool = fallbackToAll ? listAll() : candidates;

  if (pool.length === 0) {
    throw new Error("No figure stages are available to match against.");
  }

  const scored = pool.map((stage) => scoreStage(stage, input));
  scored.sort(compareScoredStages);

  const top = scored[0];
  const framing: Framing =
    fallbackToAll || top.keywordScore < PARTIAL_FRAMING_THRESHOLD
      ? "partial"
      : "definitive";

  return {
    figureKey: top.stage.figureKey,
    stageId: top.stage.stageId,
    framing,
  };
}

function scoreStage(stage: FigureStageRow, input: MatchInput): ScoredStage {
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

  for (const [keyword, themes] of Object.entries(STUB_KEYWORD_MAP)) {
    if (!normalizedFeeling.includes(keyword)) continue;
    score += themes.filter((theme) => stage.themes.includes(theme)).length;
  }

  return score;
}

function compareScoredStages(a: ScoredStage, b: ScoredStage): number {
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
  if (b.keywordScore !== a.keywordScore) return b.keywordScore - a.keywordScore;
  if (a.agePenalty !== b.agePenalty) return a.agePenalty - b.agePenalty;
  return a.stage.figureKey.localeCompare(b.stage.figureKey);
}
