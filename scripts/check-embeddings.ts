import "./_smoke-bootstrap";
import { loadEnvLocal } from "./_load-env";
import { listAll } from "../lib/figures";
import { FACET_TYPES } from "../lib/types";
import {
  EmbeddingError,
  embedQuery,
  embeddingDim,
  embeddingModelId,
  isEmbeddingStub,
} from "../lib/embeddings";
import { loadEmbeddingCache } from "../lib/embeddings-cache";

// Embedding health + cache verification. Two purposes, one command:
//   1. LIVE PROBE — embed a synthetic sentence and confirm the request body shape is right (dim ==
//      expected). Run this BEFORE seeding; if it returns the native 3072 dims, outputDimensionality
//      wasn't honored and the body shape in lib/embeddings-real.ts needs fixing (cheap to catch
//      now, expensive after a 140-vector seed).
//   2. CACHE STATE — load the embedding cache and assert every row is valid (model_id + content_hash
//      gates) and the count matches what the loaded stages require (Σ shapeSentences + 4·stages).
//      Derived from stages, never hard-coded.
//
// Before seeding: probe OK, cache reports "no embeddings yet" → exit 0. After seeding: probe OK +
// cache full + 0 rejected → exit 0. Stale/missing rows → exit 1.
//
// Privacy floor: the probe sentence is synthetic; never print vectors or response bodies.

type Step = { name: string; ok: boolean; detail: string };

async function main(): Promise<void> {
  console.log("Onward embedding check");
  console.log("======================");
  console.log("");

  const env = loadEnvLocal();
  console.log(
    env.found
      ? `Loaded ${env.loaded} var(s) from .env.local`
      : "No .env.local found; using shell environment",
  );

  if (isEmbeddingStub()) {
    console.log("");
    console.log(
      "EMBEDDING_PROVIDER is stub (or unset) — FacetsRAG retrieval is disabled and there is " +
        "nothing to probe or cache. Set EMBEDDING_PROVIDER=gemini and GEMINI_API_KEY to enable it.",
    );
    process.exit(0);
  }

  console.log(`Embedding model: ${embeddingModelId()} (expected dim ${embeddingDim()})`);
  console.log("");

  const probe = await probeEmbedder();
  printStep(1, probe);
  if (!probe.ok) {
    console.log("");
    console.log("Fix the embedder before seeding.");
    process.exit(1);
  }

  const cache = await checkCache();
  printStep(2, cache);
  console.log("");
  process.exit(cache.ok ? 0 : 1);
}

async function probeEmbedder(): Promise<Step> {
  const name = "Gemini embedder reachable + outputDimensionality honored";
  const start = performance.now();
  try {
    const vector = await embedQuery(
      "A short neutral probe sentence used only to health-check the embedder.",
    );
    const ms = Math.round(performance.now() - start);
    const expected = embeddingDim();
    if (vector.length !== expected) {
      return {
        name,
        ok: false,
        detail: `returned dim ${vector.length}, expected ${expected} — outputDimensionality not honored; fix the request body in lib/embeddings-real.ts (${ms}ms)`,
      };
    }
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    return {
      name,
      ok: true,
      detail: `dim ${vector.length}, L2 norm ${norm.toFixed(4)} (${ms}ms)`,
    };
  } catch (error) {
    const ms = Math.round(performance.now() - start);
    const cls = error instanceof EmbeddingError ? error.errorClass : "unknown";
    return { name, ok: false, detail: `embed failed: ${cls} (${ms}ms)` };
  }
}

async function checkCache(): Promise<Step> {
  const name = "Embedding cache loads with all hashes valid";
  const stages = await listAll();
  const expectedShape = stages.reduce(
    (sum, stage) => sum + stage.shapeSentences.length,
    0,
  );
  const expectedFacet = stages.length * FACET_TYPES.length;

  const cache = await loadEmbeddingCache();

  if (cache.byStage.size === 0) {
    return {
      name,
      ok: true,
      detail: `no embeddings cached yet for ${cache.modelId} — run \`npm run seed-embeddings\` (expecting ${expectedShape} shape + ${expectedFacet} facet = ${expectedShape + expectedFacet})`,
    };
  }

  const { shapeValid, facetValid, rejected } = cache.stats;
  const problems: string[] = [];
  if (shapeValid !== expectedShape) {
    problems.push(`shape ${shapeValid}/${expectedShape}`);
  }
  if (facetValid !== expectedFacet) {
    problems.push(`facet ${facetValid}/${expectedFacet}`);
  }
  if (rejected > 0) problems.push(`${rejected} stale/invalid row(s) rejected`);
  if (cache.completeStageCount !== stages.length) {
    problems.push(`${cache.completeStageCount}/${stages.length} stages complete`);
  }

  const detail =
    `model ${cache.modelId}: ${shapeValid} shape + ${facetValid} facet valid, ` +
    `${cache.completeStageCount}/${stages.length} stages complete, ${rejected} rejected`;

  return problems.length === 0
    ? { name, ok: true, detail }
    : {
        name,
        ok: false,
        detail: `${detail} — ${problems.join("; ")}. Re-run \`npm run seed-embeddings\` (text edited or model changed?)`,
      };
}

function printStep(index: number, step: Step): void {
  console.log(`[${index}] ${step.ok ? "OK  " : "FAIL"}  ${step.name}`);
  console.log(`     ${step.detail}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
