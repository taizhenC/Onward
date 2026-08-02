import "./_smoke-bootstrap";
import { loadEnvLocal } from "./_load-env";
import { getSupabase } from "../lib/db";
import { inspectPublishedStorySpecs } from "../lib/story-spec-repository";

async function main(): Promise<void> {
  const env = loadEnvLocal();
  console.log(
    env.found
      ? `Loaded ${env.loaded} var(s) from .env.local`
      : "No .env.local found; using shell environment",
  );

  const inspection = await inspectPublishedStorySpecs();
  const stages = await getSupabase()
    .from("figure_stages")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");
  if (stages.error) {
    throw new Error(
      `count published figure stages failed: ${stages.error.message}`,
    );
  }

  console.log("Onward StorySpec cutover");
  console.log("========================");
  console.log(
    `Published StorySpecs: ${inspection.rawPublishedRowCount} ` +
      `(${inspection.catalog.size} current-contract, ` +
      `${inspection.quarantinedRowCount} quarantined)`,
  );
  console.log(
    `Published stage projections to demote: ${stages.count ?? 0}`,
  );

  if (inspection.rawPublishedRowCount !== 0) {
    throw new Error(
      "cutover blocked: retire every published StorySpec before applying migration 0023",
    );
  }
  console.log(
    "PASS no pre-closure StorySpec publication can cross the evidence-contract cutover",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
