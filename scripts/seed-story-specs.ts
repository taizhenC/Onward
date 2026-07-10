import "./_smoke-bootstrap";
import { loadEnvLocal } from "./_load-env";
import { FIGURE_STAGES } from "../lib/figures-data";
import { getSupabase } from "../lib/db";
import { buildDraftStorySpec, validateStorySpec } from "../lib/story-spec";

type ExistingSpec = { story_spec_id: string; status: string };

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
  const existingResult = await supabase
    .from("story_specs")
    .select("story_spec_id,status")
    .in(
      "story_spec_id",
      drafts.map((draft) => draft.storySpecId),
    );
  if (existingResult.error) {
    throw new Error(`read story_specs failed: ${existingResult.error.message}`);
  }

  const existing = new Map(
    ((existingResult.data ?? []) as ExistingSpec[]).map((row) => [row.story_spec_id, row.status]),
  );
  const protectedIds = drafts
    .filter((draft) => {
      const status = existing.get(draft.storySpecId);
      return status !== undefined && status !== "draft";
    })
    .map((draft) => draft.storySpecId);
  const protectedSet = new Set(protectedIds);
  const rows = drafts
    .filter((draft) => !protectedSet.has(draft.storySpecId))
    .map((draft) => ({
      story_spec_id: draft.storySpecId,
      figure_key: draft.figureKey,
      stage_id: draft.stageId,
      version: draft.version,
      schema_version: draft.schemaVersion,
      status: draft.status,
      spec: draft,
    }));

  if (rows.length > 0) {
    const result = await supabase
      .from("story_specs")
      .upsert(rows, { onConflict: "story_spec_id" });
    if (result.error) throw new Error(`seed story_specs failed: ${result.error.message}`);
  }

  console.log(`Seeded/refreshed ${rows.length} draft StorySpec(s).`);
  if (protectedIds.length > 0) {
    console.log(`Protected ${protectedIds.length} review/published/retired StorySpec(s).`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
