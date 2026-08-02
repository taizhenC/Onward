import "./_smoke-bootstrap";
import { loadEnvLocal } from "./_load-env";
import { FIGURE_STAGES } from "../lib/figures-data";
import { getSupabase } from "../lib/db";
import { buildDraftStorySpec, validateStorySpec } from "../lib/story-spec";

async function main(): Promise<void> {
  const env = loadEnvLocal();
  console.log(
    env.found
      ? `Loaded ${env.loaded} var(s) from .env.local`
      : "No .env.local found; using shell environment",
  );

  const drafts = FIGURE_STAGES.map(buildDraftStorySpec);
  for (const draft of drafts) {
    const validation = validateStorySpec(draft, { forPublish: false });
    if (!validation.valid) {
      throw new Error(`${draft.storySpecId}: ${validation.errors.join("; ")}`);
    }
  }

  const supabase = getSupabase();
  const rows = drafts.map((draft) => ({
    story_spec_id: draft.storySpecId,
    figure_key: draft.figureKey,
    stage_id: draft.stageId,
    version: draft.version,
    schema_version: draft.schemaVersion,
    status: draft.status,
    spec: draft,
  }));

  // Insert only missing rows. An existing draft may become review/published
  // immediately after this statement, so conflict updates are intentionally
  // disabled instead of relying on a stale read of its lifecycle state.
  const insertResult = await supabase
    .from("story_specs")
    .upsert(rows, {
      onConflict: "story_spec_id",
      ignoreDuplicates: true,
    });
  if (insertResult.error) {
    throw new Error(`insert missing story_specs failed: ${insertResult.error.message}`);
  }

  let refreshedDrafts = 0;
  for (const row of rows) {
    // The status predicate is the authoring CAS. The update omits row status,
    // so it can neither demote a reviewed row nor race a terminal transition.
    const refreshResult = await supabase
      .from("story_specs")
      .update({
        figure_key: row.figure_key,
        stage_id: row.stage_id,
        version: row.version,
        schema_version: row.schema_version,
        spec: row.spec,
      })
      .eq("story_spec_id", row.story_spec_id)
      .eq("status", "draft")
      .select("story_spec_id");
    if (refreshResult.error) {
      throw new Error(
        `refresh draft StorySpec ${row.story_spec_id} failed: ${refreshResult.error.message}`,
      );
    }
    refreshedDrafts += refreshResult.data?.length ?? 0;
  }

  console.log(`Seeded/refreshed ${refreshedDrafts} draft StorySpec(s).`);
  console.log(
    `Protected ${rows.length - refreshedDrafts} review/published/retired StorySpec(s).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
