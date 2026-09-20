// Editorial-only composition fixture. This does NOT validate installed matching
// or make Lee's proposed 1934 episode eligible for publication.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FIGURE_STAGES } from "../../../lib/figures-data";

async function main(): Promise<void> {
  const packet = dirname(fileURLToPath(import.meta.url));
  const index = JSON.parse(readFileSync(resolve(packet, "review-targets.json"), "utf8"));
  const lee = index.targets.find((target: { figureKey: string }) => target.figureKey === "lee");
  assert(lee?.integrationHold === true, "Lee's integration hold must remain visible");
  assert(!FIGURE_STAGES.some(stage => stage.figureKey === "lee" && stage.stageId === "1934-library-dedication"),
    "Installed catalog changed: re-evaluate this temporary proposal fixture");
  const original = FIGURE_STAGES.find(stage => stage.figureKey === "lee");
  assert(original, "Original figure metadata is required for the preview fixture");
  // Only this process sees the extra stage. No library file or database changes.
  FIGURE_STAGES.push({ ...original, stageId: "1934-library-dedication", ageMin: 56, ageMax: 56 });
  console.error("PROPOSAL FIXTURE ONLY: Lee remains on episode/integration hold; not an installed-catalog pass.");
  process.argv = [process.argv[0], "check-story-batch.ts", resolve(packet, "set-2"), "9", "--require-hashes"];
  await import("../../../scripts/check-story-batch");
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
