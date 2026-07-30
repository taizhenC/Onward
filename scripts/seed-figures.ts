import "./_smoke-bootstrap";
import { loadEnvLocal } from "./_load-env";
import { FIGURE_STAGES } from "../lib/figures-data";
import { getSupabase } from "../lib/db";

// Bulk seeder: writes the authored library (lib/figures-data.ts) into Supabase so the DB-backed
// figure source (PERSISTENCE=supabase) and future pgvector/editorial work have data. Idempotent,
// while leaving the publication lifecycle under the database-owned transition functions.
// The future per-draft editorial seeder (scripts/seed-figure.ts in CLAUDE.md) is a separate tool
// that uses draft→promote.
//
// This is a write tool: it always targets Supabase via lib/db.ts directly (not the figures
// boundary), so PERSISTENCE is irrelevant here. It does need the Supabase env in .env.local.

async function main(): Promise<void> {
  const env = loadEnvLocal();
  console.log(
    env.found
      ? `Loaded ${env.loaded} var(s) from .env.local`
      : "No .env.local found; using shell environment",
  );

  const supabase = getSupabase();

  // figures: thin identity, deduped by key (v1 has one stage per figure, but dedup anyway).
  const figuresByKey = new Map<
    string,
    { key: string; display_name: string; birth_year: number | null; death_year: number | null }
  >();
  for (const stage of FIGURE_STAGES) {
    figuresByKey.set(stage.figureKey, {
      key: stage.figureKey,
      display_name: stage.displayName,
      birth_year: stage.birthYear ?? null,
      death_year: stage.deathYear ?? null,
    });
  }
  const figureRows = [...figuresByKey.values()];

  // figure_stages: scalars/arrays mapped to snake_case; facets/beats written as jsonb verbatim.
  const stageRows = FIGURE_STAGES.map((stage) => ({
    identity: {
      figure_key: stage.figureKey,
      stage_id: stage.stageId,
    },
    content: {
      stage_label: stage.stageLabel,
      age_min: stage.ageMin,
      age_max: stage.ageMax,
      shape_sentences: stage.shapeSentences,
      facets: stage.facets,
      biographical_facts: stage.biographicalFacts,
      themes: stage.themes,
      anti_themes: stage.antiThemes,
      beats: stage.beats,
      sources: stage.sources,
    },
  }));

  // figures first (FK parent), then stages.
  const figuresResult = await supabase
    .from("figures")
    .upsert(figureRows, { onConflict: "key" });
  if (figuresResult.error) {
    throw new Error(`seed figures failed: ${figuresResult.error.message}`);
  }

  // Create absent stages as drafts without touching rows another actor already
  // created or promoted. This removes the read-then-upsert race that could write
  // a stale lifecycle status over a concurrent publication transition.
  const insertStagesResult = await supabase
    .from("figure_stages")
    .upsert(
      stageRows.map(({ identity, content }) => ({
        ...identity,
        ...content,
        status: "draft",
      })),
      {
        onConflict: "figure_key,stage_id",
        ignoreDuplicates: true,
      },
    );
  if (insertStagesResult.error) {
    throw new Error(`insert missing figure_stages failed: ${insertStagesResult.error.message}`);
  }

  // Refresh authored content separately. `content` intentionally cannot carry
  // status, so reseeding an existing stage cannot publish, retire, or demote it.
  for (const { identity, content } of stageRows) {
    const updateStageResult = await supabase
      .from("figure_stages")
      .update(content)
      .eq("figure_key", identity.figure_key)
      .eq("stage_id", identity.stage_id);
    if (updateStageResult.error) {
      throw new Error(
        `refresh figure_stage ${identity.figure_key}/${identity.stage_id} failed: ` +
          updateStageResult.error.message,
      );
    }
  }

  console.log(
    `Seeded ${figureRows.length} figure(s) and ${stageRows.length} stage(s) into Supabase.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
