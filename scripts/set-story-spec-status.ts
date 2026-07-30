import "./_smoke-bootstrap";
import { loadEnvLocal } from "./_load-env";
import { getSupabase } from "../lib/db";
import {
  parseStorySpecDocument,
  validateStorySpec,
} from "../lib/story-spec";

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

    const stored = parseStorySpecDocument(result.data.spec);
    if (!stored || stored.status !== "review") {
      throw new Error("StorySpec document shape or status is invalid");
    }
    const candidate = { ...stored, status: "published" as const };
    const validation = validateStorySpec(candidate, { forPublish: true });
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
