// Stub embedder: zero vectors. The default (EMBEDDING_PROVIDER unset) and what smoke / memory mode
// use, so those paths need no GEMINI_API_KEY. A zero vector carries no signal — matching detects
// the stub via isEmbeddingStub() and takes the keyword path rather than embedding it. The seeder
// REFUSES to persist stub vectors, so zero vectors can never masquerade as a real cache.

export const STUB_MODEL_ID = "stub@v0";
export const STUB_DIM = 1536;

export function embedDocumentsStub(texts: string[]): Promise<number[][]> {
  return Promise.resolve(texts.map(() => zeroVector()));
}

export function embedQueryStub(_text: string): Promise<number[]> {
  return Promise.resolve(zeroVector());
}

function zeroVector(): number[] {
  return new Array<number>(STUB_DIM).fill(0);
}
