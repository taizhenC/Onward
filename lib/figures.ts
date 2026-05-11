import "server-only";
import type { ClientBeat, ClientFigureOutline, FigureStageRow } from "./types";
import { FIGURE_STAGES } from "./figures-data";
import { AGE_TOLERANCE_YEARS } from "./match-config";

if (typeof window !== "undefined") {
  throw new Error("lib/figures.ts must not be imported on the client");
}

export function listAll(): FigureStageRow[] {
  return FIGURE_STAGES;
}

// Wide age hard gate: range overlap with user_age plus AGE_TOLERANCE_YEARS on each side.
// Returns stages whose [ageMin, ageMax] is within ±tolerance of `age`.
export function listByAge(age: number): FigureStageRow[] {
  return FIGURE_STAGES.filter((stage) => ageDistance(stage, age) <= AGE_TOLERANCE_YEARS);
}

// Distance from `age` to the stage's age range. 0 if `age` is inside [ageMin, ageMax];
// positive otherwise. Used by both listByAge (hard gate) and matching's soft penalty.
export function ageDistance(stage: FigureStageRow, age: number): number {
  return Math.max(stage.ageMin - age, age - stage.ageMax, 0);
}

export function getByKey(figureKey: string, stageId: string): FigureStageRow | null {
  return (
    FIGURE_STAGES.find(
      (s) => s.figureKey === figureKey && s.stageId === stageId,
    ) ?? null
  );
}

// SINGLE CHOKEPOINT for stripping server-only fields before any outline crosses
// to the client. Anything not explicitly returned here stays on the server.
//
// Stripped: shapeSentences, facets, biographicalFacts, sources, stageLabel,
// per-beat text, per-beat sourceNotes, decisionContinuations[*].continuationText,
// decisionContinuations[*].realChoice.
//
// Kept: figureKey, displayName, birthYear, deathYear, arcVariant, ageMin, ageMax,
// per-beat kind+role, per-decision option labels (the client needs labels to render
// DecisionCards). Beat text streams via /api/beat — never crosses in the outline.
export function toClientOutline(stage: FigureStageRow): ClientFigureOutline {
  return {
    figureKey: stage.figureKey,
    displayName: stage.displayName,
    birthYear: stage.birthYear,
    deathYear: stage.deathYear,
    arcVariant: stage.arcVariant,
    ageMin: stage.ageMin,
    ageMax: stage.ageMax,
    beats: stage.beats.map((beat): ClientBeat => {
      switch (beat.kind) {
        case "decision":
          return {
            kind: "decision",
            role: beat.role,
            options: beat.decisionContinuations.map((c) => ({ label: c.label })),
          };
        case "narrative":
          return { kind: "narrative", role: beat.role };
        case "bridge":
          return { kind: "bridge", role: beat.role };
        default: {
          const exhaustive: never = beat;
          return exhaustive;
        }
      }
    }),
  };
}
