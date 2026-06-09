import "server-only";
import {
  STUB_DIM,
  STUB_MODEL_ID,
  embedDocumentsStub,
  embedQueryStub,
} from "./embeddings-stub";
import {
  embedDocumentsReal,
  embedQueryReal,
  geminiDim,
  geminiModelId,
} from "./embeddings-real";

// The single embeddings boundary — mirrors lib/llm.ts. Everything outside lib/ imports from here,
// never from embeddings-stub / embeddings-real directly (CLAUDE.md: the provider is invisible
// outside lib/).
//
// Provider is resolved lazily on first use (NOT at module load) and memoized — a script that sets
// EMBEDDING_PROVIDER before its first call always wins, regardless of ESM import hoisting. Each
// process is single-provider by construction (smoke/memory → stub, seed/eval → gemini).

export { EmbeddingError } from "./embeddings-real";

let provider: "stub" | "gemini" | undefined;

function resolveProvider(): "stub" | "gemini" {
  if (provider === undefined) {
    provider = process.env.EMBEDDING_PROVIDER === "gemini" ? "gemini" : "stub";
  }
  return provider;
}

// True when no real embedder is configured. matching uses this to decide FacetsRAG availability
// without a zero-vector ever entering retrieval; the seeder uses it to refuse persisting stubs.
export function isEmbeddingStub(): boolean {
  return resolveProvider() === "stub";
}

// Canonical model id written into embedding rows + the match recipe. For gemini it folds in the
// output dimension (…@d1536) so a dim change invalidates the cache via the model_id gate.
export function embeddingModelId(): string {
  return resolveProvider() === "gemini" ? geminiModelId() : STUB_MODEL_ID;
}

export function embeddingDim(): number {
  return resolveProvider() === "gemini" ? geminiDim() : STUB_DIM;
}

// Documents (shape sentences, facet texts) embedded at SEED time → RETRIEVAL_DOCUMENT.
export function embedDocuments(texts: string[]): Promise<number[][]> {
  return resolveProvider() === "gemini"
    ? embedDocumentsReal(texts)
    : embedDocumentsStub(texts);
}

// The user feeling (later: facet-query projections) embedded at MATCH time → RETRIEVAL_QUERY.
export function embedQuery(text: string): Promise<number[]> {
  return resolveProvider() === "gemini"
    ? embedQueryReal(text)
    : embedQueryStub(text);
}
