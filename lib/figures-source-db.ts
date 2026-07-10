import "server-only";
import type { BeatBlueprint, Facets, FigureStageRow } from "./types";
import { getSupabase } from "./db";

// PERSISTENCE=supabase figure source. The library is small and slowly-changing, so all
// published stages are loaded ONCE into a globalThis cache (survives hot-reload) and served
// from memory — no per-request query on the hot path. A process restart, or _resetFigureCache()
// via lib/figures.ts, refreshes it.
//
// Two simple queries + a JS merge (rather than a PostgREST embedded join) keep the read
// predictable. facets/beats are jsonb written verbatim by the seed, so they come back as the
// exact camelCase objects; only scalar/array columns need snake->camel mapping.

declare global {
  var __onwardFigureCache: FigureStageRow[] | undefined;
  var __onwardFigureCachePromise: Promise<FigureStageRow[]> | undefined;
}

type FigureDbRow = {
  key: string;
  display_name: string;
  birth_year: number | null;
  death_year: number | null;
};

type FigureStageDbRow = {
  figure_key: string;
  stage_id: string;
  stage_label: string;
  age_min: number;
  age_max: number;
  shape_sentences: string[];
  facets: Facets;
  biographical_facts: string;
  themes: string[];
  anti_themes: string[];
  beats: BeatBlueprint[];
  sources: string[];
  status: string;
};

export async function loadDbStages(): Promise<FigureStageRow[]> {
  if (globalThis.__onwardFigureCache) return globalThis.__onwardFigureCache;
  if (globalThis.__onwardFigureCachePromise) {
    return globalThis.__onwardFigureCachePromise;
  }

  const pendingLoad = (async () => {
    const supabase = getSupabase();
    const [stagesRes, figuresRes] = await Promise.all([
      supabase.from("figure_stages").select("*").eq("status", "published"),
      supabase.from("figures").select("*"),
    ]);
    if (stagesRes.error) {
      throw new Error(
        `loadDbStages (figure_stages) failed: ${stagesRes.error.message}`,
      );
    }
    if (figuresRes.error) {
      throw new Error(`loadDbStages (figures) failed: ${figuresRes.error.message}`);
    }

    const figuresByKey = new Map<string, FigureDbRow>();
    for (const figure of (figuresRes.data ?? []) as FigureDbRow[]) {
      figuresByKey.set(figure.key, figure);
    }

    const stages = ((stagesRes.data ?? []) as FigureStageDbRow[]).map((row) =>
      rowToStage(row, figuresByKey.get(row.figure_key)),
    );
    globalThis.__onwardFigureCache = stages;
    return stages;
  })()
    .finally(() => {
      globalThis.__onwardFigureCachePromise = undefined;
    });

  // The shared promise still rejects to callers, but the global reference is
  // explicitly observed so a dropped caller cannot surface as an unhandled rejection.
  pendingLoad.catch(() => {});
  globalThis.__onwardFigureCachePromise = pendingLoad;

  return globalThis.__onwardFigureCachePromise;
}

export function resetDbFigureCache(): void {
  globalThis.__onwardFigureCache = undefined;
  globalThis.__onwardFigureCachePromise = undefined;
}

function rowToStage(
  row: FigureStageDbRow,
  figure: FigureDbRow | undefined,
): FigureStageRow {
  return {
    figureKey: row.figure_key,
    displayName: figure?.display_name ?? row.figure_key,
    // birthYear/deathYear are optional; set only when present so a figure without them
    // round-trips identically to the authored const.
    ...(figure?.birth_year != null ? { birthYear: figure.birth_year } : {}),
    ...(figure?.death_year != null ? { deathYear: figure.death_year } : {}),
    stageId: row.stage_id,
    stageLabel: row.stage_label,
    ageMin: row.age_min,
    ageMax: row.age_max,
    shapeSentences: row.shape_sentences,
    facets: row.facets,
    biographicalFacts: row.biographical_facts,
    themes: row.themes,
    antiThemes: row.anti_themes,
    beats: row.beats,
    sources: row.sources,
  };
}
