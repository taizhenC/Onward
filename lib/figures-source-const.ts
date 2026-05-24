import "server-only";
import type { FigureStageRow } from "./types";
import { FIGURE_STAGES } from "./figures-data";

// PERSISTENCE=memory figure source: the authored const, async-wrapped to share the boundary's
// signature with the DB source.
export async function loadConstStages(): Promise<FigureStageRow[]> {
  return FIGURE_STAGES;
}
