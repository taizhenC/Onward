import "./_smoke-bootstrap";
import { loadEnvLocal } from "./_load-env";
import { FIGURE_STAGES } from "../lib/figures-data";
import type { FacetType } from "../lib/types";
import { FACET_TYPES, facetText } from "../lib/types";
import { getSupabase } from "../lib/db";
import {
  embedDocuments,
  embeddingDim,
  embeddingModelId,
  isEmbeddingStub,
} from "../lib/embeddings";
import { contentHash } from "../lib/embeddings-cache";

// Seeds per-text embeddings for the FacetsRAG retrieval. For each authored stage it embeds the
// shape sentences + 4 facet texts (RETRIEVAL_DOCUMENT, L2-normalized) and upserts them into
// figure_shape_embeddings / figure_facet_embeddings, keyed by (…, model_id) with content_hash so
// the loader's stale-vector gate can validate them. Idempotent (upsert on the pks).
//
// REFUSES EMBEDDING_PROVIDER=stub (zero vectors must never masquerade as a real cache) — set
// EMBEDDING_PROVIDER=gemini + GEMINI_API_KEY. Override with --allow-stub only if you really mean it.
//
// Embeds the const (lib/figures-data.ts), the same source seed-figures.ts wrote to figure_stages,
// so content_hash matches what the cache recomputes from the DB rows.

const UPSERT_CHUNK = 25; // keep each row batch's JSON body small (vectors are large)

type Item =
  | { kind: "shape"; figureKey: string; stageId: string; shapeIndex: number; text: string }
  | { kind: "facet"; figureKey: string; stageId: string; facetType: FacetType; text: string };

type ShapeRow = {
  figure_key: string;
  stage_id: string;
  shape_index: number;
  model_id: string;
  dimension: number;
  input_type: string;
  content_hash: string;
  embedding: number[];
};
type FacetRow = {
  figure_key: string;
  stage_id: string;
  facet_type: string;
  model_id: string;
  dimension: number;
  input_type: string;
  content_hash: string;
  facet_text: string;
  embedding: number[];
};

async function main(): Promise<void> {
  const env = loadEnvLocal();
  console.log(
    env.found
      ? `Loaded ${env.loaded} var(s) from .env.local`
      : "No .env.local found; using shell environment",
  );

  const allowStub = process.argv.includes("--allow-stub");
  if (isEmbeddingStub() && !allowStub) {
    console.error(
      "EMBEDDING_PROVIDER is stub (or unset). Refusing to seed zero vectors — set " +
        "EMBEDDING_PROVIDER=gemini and GEMINI_API_KEY first. (Override with --allow-stub only " +
        "if you truly intend to.)",
    );
    process.exit(1);
  }

  const modelId = embeddingModelId();
  const dimension = embeddingDim();
  console.log(`Embedding model: ${modelId} (dim ${dimension})`);

  // Flatten every text to embed, with provenance, so we issue one embedDocuments call (it chunks
  // under the provider's batch limit internally) and map results back by index.
  const items: Item[] = [];
  for (const stage of FIGURE_STAGES) {
    stage.shapeSentences.forEach((text, shapeIndex) => {
      items.push({
        kind: "shape",
        figureKey: stage.figureKey,
        stageId: stage.stageId,
        shapeIndex,
        text,
      });
    });
    for (const facetType of FACET_TYPES) {
      items.push({
        kind: "facet",
        figureKey: stage.figureKey,
        stageId: stage.stageId,
        facetType,
        text: facetText(stage.facets, facetType),
      });
    }
  }

  console.log(
    `Embedding ${items.length} texts across ${FIGURE_STAGES.length} stage(s)…`,
  );
  const vectors = await embedDocuments(items.map((item) => item.text));
  if (vectors.length !== items.length) {
    throw new Error(
      `embedDocuments returned ${vectors.length} vectors for ${items.length} texts`,
    );
  }

  const shapeRows: ShapeRow[] = [];
  const facetRows: FacetRow[] = [];
  items.forEach((item, index) => {
    const embedding = vectors[index];
    if (item.kind === "shape") {
      shapeRows.push({
        figure_key: item.figureKey,
        stage_id: item.stageId,
        shape_index: item.shapeIndex,
        model_id: modelId,
        dimension,
        input_type: "RETRIEVAL_DOCUMENT",
        content_hash: contentHash(item.text),
        embedding,
      });
    } else {
      facetRows.push({
        figure_key: item.figureKey,
        stage_id: item.stageId,
        facet_type: item.facetType,
        model_id: modelId,
        dimension,
        input_type: "RETRIEVAL_DOCUMENT",
        content_hash: contentHash(item.text),
        facet_text: item.text,
        embedding,
      });
    }
  });

  const supabase = getSupabase();
  await upsertChunked(
    "figure_shape_embeddings",
    shapeRows,
    "figure_key,stage_id,shape_index,model_id",
  );
  await upsertChunked(
    "figure_facet_embeddings",
    facetRows,
    "figure_key,stage_id,facet_type,model_id",
  );

  console.log(
    `Seeded ${shapeRows.length} shape + ${facetRows.length} facet embeddings ` +
      `(${shapeRows.length + facetRows.length} vectors) for model ${modelId}.`,
  );
  console.log("Run `npm run check-embeddings` to verify the cache loads and all hashes are valid.");

  async function upsertChunked(
    table: string,
    rows: Array<ShapeRow | FacetRow>,
    onConflict: string,
  ): Promise<void> {
    for (let start = 0; start < rows.length; start += UPSERT_CHUNK) {
      const chunk = rows.slice(start, start + UPSERT_CHUNK);
      const result = await supabase.from(table).upsert(chunk, { onConflict });
      if (result.error) {
        throw new Error(`seed ${table} failed: ${result.error.message}`);
      }
    }
  }
}

main().catch((error) => {
  // Class-level message only — never the prompt/text bodies or raw provider error.
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
