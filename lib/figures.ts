import "server-only";
import type { ClientBeat, ClientFigureOutline, FigureStageRow } from "./types";
import { AGE_TOLERANCE_YEARS } from "./match-config";
import { loadConstStages } from "./figures-source-const";
import { loadDbStages, resetDbFigureCache } from "./figures-source-db";
import { persistenceMode } from "./persistence";

if (typeof window !== "undefined") {
  throw new Error("lib/figures.ts must not be imported on the client");
}

// Figure source switch (mirrors lib/session.ts): PERSISTENCE=memory serves the authored const,
// supabase serves the load-once DB cache. listAll/listByAge/getByKey are async (the DB source
// may need a fetch); ageDistance and toClientOutline stay sync — they're pure transforms.
function loadStages(): Promise<FigureStageRow[]> {
  return persistenceMode() === "supabase"
    ? loadDbStages()
    : loadConstStages();
}

export async function listAll(): Promise<FigureStageRow[]> {
  return loadStages();
}

// Wide age hard gate: range overlap with user_age plus AGE_TOLERANCE_YEARS on each side.
// Returns stages whose [ageMin, ageMax] is within ±tolerance of `age`.
export async function listByAge(age: number): Promise<FigureStageRow[]> {
  const stages = await loadStages();
  return stages.filter((stage) => ageDistance(stage, age) <= AGE_TOLERANCE_YEARS);
}

// Distance from `age` to the stage's age range. 0 if `age` is inside [ageMin, ageMax];
// positive otherwise. Used by both listByAge (hard gate) and matching's soft penalty. Pure.
export function ageDistance(stage: FigureStageRow, age: number): number {
  return Math.max(stage.ageMin - age, age - stage.ageMax, 0);
}

export async function getByKey(
  figureKey: string,
  stageId: string,
): Promise<FigureStageRow | null> {
  const stages = await loadStages();
  return (
    stages.find((s) => s.figureKey === figureKey && s.stageId === stageId) ?? null
  );
}

// SINGLE CHOKEPOINT for stripping server-only fields before any outline crosses
// to the client. Anything not explicitly returned here stays on the server. Pure and
// source-agnostic — strips identically whether the stage came from the const or the DB.
//
// Stripped: shapeSentences, facets, biographicalFacts, sources, stageLabel,
// per-beat text, per-beat sourceNotes.
//
// Kept: figureKey, displayName, birthYear, deathYear, ageMin, ageMax,
// per-beat kind+role. Beat text streams via /api/beat — never crosses in
// the outline.
export function toClientOutline(stage: FigureStageRow): ClientFigureOutline {
  return {
    figureKey: stage.figureKey,
    displayName: stage.displayName,
    birthYear: stage.birthYear,
    deathYear: stage.deathYear,
    ageMin: stage.ageMin,
    ageMax: stage.ageMax,
    beats: stage.beats.map((beat): ClientBeat => {
      switch (beat.kind) {
        case "narrative":
          return { kind: "narrative", role: beat.role };
        case "bridge":
          return { kind: "bridge", role: beat.role };
        default: {
          // Force new server-side beat kinds to be explicitly sanitized here.
          const exhaustive: never = beat;
          return exhaustive;
        }
      }
    }),
  };
}

// Test/ops helper: clear the DB figure cache so a process that re-seeds can reload (no-op for
// the const source). Used by scripts/check-db.ts before its parity read.
export function _resetFigureCache(): void {
  resetDbFigureCache();
}
