import "server-only";
import { createHash } from "node:crypto";
import type { FacetType, FigureStageRow } from "./types";
import { FACET_TYPES, facetText } from "./types";
import { getSupabase } from "./db";
import { listAll } from "./figures";
import { embeddingModelId, isEmbeddingStub } from "./embeddings";

// In-memory embedding cache. The library is small and slowly-changing, so all VALID embedding rows
// are loaded ONCE into a globalThis cache (survives Next hot-reload) and cosine is computed in JS —
// no per-request DB query, no pgvector. Mirrors lib/figures-source-db.ts's load-once pattern.
//
// Stale-vector gate enforced HERE, in the JS loader (replaces partial HNSW): a row is admitted only
// when model_id == the active embedder (filtered in the query) AND content_hash == sha256(current
// figure_stages source text) (checked here against listAll()). Rows that fail either gate — after an
// embedder swap, a dim change, or a text edit without re-embed — never enter retrieval.

export type StageVectors = {
  // Valid shape-sentence vectors for the stage (order irrelevant — the shape lane takes a max).
  shape: number[][];
  // Valid facet vectors by snake_case FacetType. Partial until every facet is seeded.
  facets: Partial<Record<FacetType, number[]>>;
};

export type EmbeddingCache = {
  modelId: string; // the active embedder these vectors were admitted for
  byStage: Map<string, StageVectors>; // key = `${figureKey}/${stageId}`
  // Stages with the FULL set valid (every shape sentence + all 4 facets) — the health signal
  // check-embeddings asserts; matching treats any non-empty byStage as "available".
  completeStageCount: number;
  stats: { shapeValid: number; facetValid: number; rejected: number };
};

export function stageCacheKey(figureKey: string, stageId: string): string {
  return `${figureKey}/${stageId}`;
}

// The one hashing function — seed (scripts/seed-embeddings.ts) and this loader MUST agree, or every
// freshly-seeded row would read back as stale.
export function contentHash(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

declare global {
  var __onwardEmbeddingCache: EmbeddingCache | undefined;
  var __onwardEmbeddingCachePromise: Promise<EmbeddingCache> | undefined;
}

type ShapeRow = {
  figure_key: string;
  stage_id: string;
  shape_index: number;
  content_hash: string;
  embedding: number[];
};
type FacetRow = {
  figure_key: string;
  stage_id: string;
  facet_type: string;
  content_hash: string;
  embedding: number[];
};

export async function loadEmbeddingCache(): Promise<EmbeddingCache> {
  if (globalThis.__onwardEmbeddingCache) return globalThis.__onwardEmbeddingCache;
  if (globalThis.__onwardEmbeddingCachePromise) {
    return globalThis.__onwardEmbeddingCachePromise;
  }

  const pending = buildCache().finally(() => {
    globalThis.__onwardEmbeddingCachePromise = undefined;
  });
  // Observe the shared promise so a dropped caller cannot surface as an unhandled rejection.
  pending.catch(() => {});
  globalThis.__onwardEmbeddingCachePromise = pending;
  return pending;
}

export function resetEmbeddingCache(): void {
  globalThis.__onwardEmbeddingCache = undefined;
  globalThis.__onwardEmbeddingCachePromise = undefined;
}

async function buildCache(): Promise<EmbeddingCache> {
  const modelId = embeddingModelId();

  // Stub embedder → no real vectors exist (the seeder refuses to persist stubs). Return an empty
  // cache WITHOUT touching Supabase, so smoke / memory mode stays key-free.
  if (isEmbeddingStub()) {
    const empty: EmbeddingCache = {
      modelId,
      byStage: new Map(),
      completeStageCount: 0,
      stats: { shapeValid: 0, facetValid: 0, rejected: 0 },
    };
    globalThis.__onwardEmbeddingCache = empty;
    return empty;
  }

  const stages = await listAll();
  const stageByKey = new Map<string, FigureStageRow>(
    stages.map((stage) => [stageCacheKey(stage.figureKey, stage.stageId), stage]),
  );

  const supabase = getSupabase();
  const [shapeRes, facetRes] = await Promise.all([
    supabase
      .from("figure_shape_embeddings")
      .select("figure_key, stage_id, shape_index, content_hash, embedding")
      .eq("model_id", modelId),
    supabase
      .from("figure_facet_embeddings")
      .select("figure_key, stage_id, facet_type, content_hash, embedding")
      .eq("model_id", modelId),
  ]);
  if (shapeRes.error) {
    throw new Error(`loadEmbeddingCache (shape) failed: ${shapeRes.error.message}`);
  }
  if (facetRes.error) {
    throw new Error(`loadEmbeddingCache (facet) failed: ${facetRes.error.message}`);
  }

  const byStage = new Map<string, StageVectors>();
  const stats = { shapeValid: 0, facetValid: 0, rejected: 0 };
  const ensure = (key: string): StageVectors => {
    let vectors = byStage.get(key);
    if (!vectors) {
      vectors = { shape: [], facets: {} };
      byStage.set(key, vectors);
    }
    return vectors;
  };

  for (const row of (shapeRes.data ?? []) as ShapeRow[]) {
    const key = stageCacheKey(row.figure_key, row.stage_id);
    const stage = stageByKey.get(key);
    const sentence = stage?.shapeSentences[row.shape_index];
    if (
      !stage ||
      sentence === undefined ||
      contentHash(sentence) !== row.content_hash ||
      !isVector(row.embedding)
    ) {
      stats.rejected += 1;
      continue;
    }
    ensure(key).shape.push(row.embedding);
    stats.shapeValid += 1;
  }

  for (const row of (facetRes.data ?? []) as FacetRow[]) {
    const key = stageCacheKey(row.figure_key, row.stage_id);
    const stage = stageByKey.get(key);
    const facetType = row.facet_type as FacetType;
    if (!stage || !FACET_TYPES.includes(facetType)) {
      stats.rejected += 1;
      continue;
    }
    if (
      contentHash(facetText(stage.facets, facetType)) !== row.content_hash ||
      !isVector(row.embedding)
    ) {
      stats.rejected += 1;
      continue;
    }
    ensure(key).facets[facetType] = row.embedding;
    stats.facetValid += 1;
  }

  let completeStageCount = 0;
  for (const [key, vectors] of byStage) {
    const stage = stageByKey.get(key);
    if (!stage) continue;
    const shapeComplete = vectors.shape.length === stage.shapeSentences.length;
    const facetsComplete = FACET_TYPES.every((t) => vectors.facets[t] !== undefined);
    if (shapeComplete && facetsComplete) completeStageCount += 1;
  }

  const cache: EmbeddingCache = { modelId, byStage, completeStageCount, stats };
  globalThis.__onwardEmbeddingCache = cache;
  return cache;
}

function isVector(value: unknown): value is number[] {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === "number";
}
