import "./_smoke-bootstrap";
import { loadEnvLocal } from "./_load-env";
import { getSupabase } from "../lib/db";
import { validateStorySpec } from "../lib/story-spec";
import type { StorySpec } from "../lib/story-spec-types";

type Action = "publish" | "retire";

async function main(): Promise<void> {
  loadEnvLocal();
  const [action, storySpecId] = process.argv.slice(2) as [Action | undefined, string | undefined];
  if ((action !== "publish" && action !== "retire") || !storySpecId) {
    throw new Error("usage: npm run story-spec:status -- <publish|retire> <storySpecId>");
  }

  const supabase = getSupabase();
  if (action === "publish") {
    const result = await supabase
      .from("story_specs")
      .select("spec,status")
      .eq("story_spec_id", storySpecId)
      .single();
    if (result.error) throw new Error(`read StorySpec failed: ${result.error.message}`);
    if (result.data.status !== "review") throw new Error("StorySpec must be in review state");

    const candidate = { ...(result.data.spec as StorySpec), status: "published" as const };
    let validation;
    try {
      validation = validateStorySpec(candidate, { forPublish: true });
    } catch {
      throw new Error("StorySpec document shape is invalid");
    }
    if (!validation.valid) throw new Error(validation.errors.join("; "));

    const promoted = await supabase.rpc("promote_story_spec", {
      p_story_spec_id: storySpecId,
    });
    if (promoted.error) throw new Error(`publish failed: ${promoted.error.message}`);
  } else {
    const retired = await supabase.rpc("retire_story_spec", {
      p_story_spec_id: storySpecId,
    });
    if (retired.error) throw new Error(`retire failed: ${retired.error.message}`);
  }

  console.log(`${storySpecId}: ${action} complete`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
