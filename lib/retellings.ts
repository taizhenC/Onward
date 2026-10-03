import "server-only";
import type { Retelling } from "./retelling-types";
import berlin from "./retellings/berlin-i";
import carver from "./retellings/carver";
import christie from "./retellings/christie";
import coltrane from "./retellings/coltrane";
import lamarr from "./retellings/lamarr";
import lee from "./retellings/lee";
import lewis from "./retellings/lewis-e";
import lindgren from "./retellings/lindgren";
import mcclintock from "./retellings/mcclintock";
import owens from "./retellings/owens";
import poitier from "./retellings/poitier";
import rachmaninoff from "./retellings/rachmaninoff";
import rogers from "./retellings/rogers";
import rudolph from "./retellings/rudolph";
import rustin from "./retellings/rustin";
import wang from "./retellings/wang";

// A public fiction collection, not a replacement for FIGURE_STAGES. No matcher,
// provider, session or database belongs at this seam.
const stories: readonly Retelling[] = [berlin, carver, christie, coltrane, lamarr,
  lee, lewis, lindgren, mcclintock, owens, poitier, rachmaninoff, rogers, rudolph, rustin, wang];
const bySlug = new Map(stories.map(story => [story.slug, story]));
export type RetellingSummary = Pick<Retelling, "slug" | "figureName" | "title" | "summary" | "topics" | "contentNote">;

export function listRetellings(): RetellingSummary[] {
  return stories.map(({ slug, figureName, title, summary, topics, contentNote }) =>
    ({ slug, figureName, title, summary, topics, contentNote }));
}

export function getRetelling(slug: string): Retelling | null {
  return bySlug.get(slug) ?? null;
}

export function retellingsPaused(): boolean {
  return process.env.STORY_CREATION_ENABLED?.trim().toLowerCase() === "false";
}
