import "server-only";
import {
  DEFAULT_EMBEDDING_BASE_URL,
  DEFAULT_EMBEDDING_DIM,
  DEFAULT_EMBEDDING_MAX_RETRIES,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_EMBEDDING_RETRY_BASE_MS,
  DEFAULT_EMBEDDING_TIMEOUT_MS,
} from "./embedding-recipe-constants";
import { productionStoryRecipeExecutionPlan } from "./story-recipe";
import type { ExternalProviderExchangeId } from "./derived-output-retention";
import { fetchExternalProvider } from "./provider-exchange";

// Real embedder: Gemini gemini-embedding-001 via the Generative Language REST API, called with
// plain `fetch` (no SDK), mirroring lib/llm-real.ts. Asymmetric encoding is REQUIRED:
// RETRIEVAL_DOCUMENT at seed time, RETRIEVAL_QUERY at match time (the encoder learned different
// prefixes per role). Outputs are L2-normalized AFTER truncation — 1536 < the native 3072 breaks
// unit norm. Local/seed/eval behavior is env-driven; served production derives
// model and dimension from its selected immutable story recipe.
//
// REQUEST SHAPE — the probe (scripts/check-embeddings.ts) is the arbiter, run BEFORE any seed.
// Raw REST :embedContent / :batchEmbedContents take `taskType` and `outputDimensionality` as
// TOP-LEVEL fields. (The `config` / `embedContentConfig` object seen in docs is a GenAI-SDK wrapper
// that maps down to these same top-level REST fields; we call REST directly, so they go top-level.)
// If the probe ever returns the native 3072 dims, outputDimensionality was not honored → the body
// shape changed; fix it in ONE place here (embedQueryReal / embedDocumentsReal bodies).
//
// Privacy floor (same as lib/llm-real.ts): raw provider errors are discarded and converted to a
// class-level EmbeddingError — the original (which can carry the document/query text) never logged.

// Gemini batchEmbedContents caps requests per call; chunk to stay safely under it.
const BATCH_LIMIT = 100;
const DEFAULT_RATE_LIMIT_RETRY_MS = 10000;

type EmbeddingErrorClass =
  | "no_key"
  | "http"
  | "timeout"
  | "network"
  | "parse"
  | "bad_dim";

export class EmbeddingError extends Error {
  constructor(
    readonly errorClass: EmbeddingErrorClass,
    message: string,
  ) {
    super(message);
    this.name = "EmbeddingError";
  }
}

function baseUrl(): string {
  const configured =
    process.env.EMBEDDING_BASE_URL?.trim() ?? process.env.GEMINI_BASE_URL?.trim();
  if (!configured) return DEFAULT_EMBEDDING_BASE_URL;
  return configured.replace(/\/+$/, "") || DEFAULT_EMBEDDING_BASE_URL;
}
function apiKey(): string | undefined {
  return [process.env.GEMINI_API_KEY, process.env.EMBEDDING_API_KEY]
    .map((key) => key?.trim())
    .find((key): key is string => Boolean(key));
}
function modelName(): string {
  const production = productionStoryRecipeExecutionPlan();
  if (production?.embedding) return production.embedding.model;
  return process.env.EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
}
export function geminiDim(): number {
  const production = productionStoryRecipeExecutionPlan();
  if (production?.embedding) return production.embedding.dimension;
  const raw = process.env.EMBEDDING_DIM;
  if (raw === undefined || raw.trim() === "") return DEFAULT_EMBEDDING_DIM;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.floor(parsed)
    : DEFAULT_EMBEDDING_DIM;
}
// Canonical, dim-stamped model id (…@d1536) — the cache/recipe key. A dim change → new id → the
// stale-vector gate (model_id mismatch) invalidates old rows automatically.
export function geminiModelId(): string {
  return `${modelName()}@d${geminiDim()}`;
}
function timeoutMs(): number {
  const raw = process.env.EMBEDDING_TIMEOUT_MS;
  if (raw === undefined || raw.trim() === "") return DEFAULT_EMBEDDING_TIMEOUT_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_EMBEDDING_TIMEOUT_MS;
}
function maxRetries(): number {
  const raw = process.env.EMBEDDING_MAX_RETRIES;
  if (raw === undefined || raw.trim() === "") return DEFAULT_EMBEDDING_MAX_RETRIES;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.floor(parsed)
    : DEFAULT_EMBEDDING_MAX_RETRIES;
}
function retryBaseMs(): number {
  const raw = process.env.EMBEDDING_RETRY_BASE_MS;
  if (raw === undefined || raw.trim() === "") return DEFAULT_EMBEDDING_RETRY_BASE_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_EMBEDDING_RETRY_BASE_MS;
}

// One query embedding (match time). RETRIEVAL_QUERY.
export async function embedQueryReal(text: string): Promise<number[]> {
  const json = (await postJson(
    "gemini.query_embedding",
    `models/${modelName()}:embedContent`,
    {
      model: `models/${modelName()}`,
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: geminiDim(),
    },
  )) as { embedding?: { values?: number[] } };

  return normalizeOrThrow(json.embedding?.values);
}

// Many document embeddings (seed time). RETRIEVAL_DOCUMENT, chunked under BATCH_LIMIT, order
// preserved so the caller's texts[i] aligns with the returned vectors[i].
export async function embedDocumentsReal(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const out: number[][] = [];
  for (let start = 0; start < texts.length; start += BATCH_LIMIT) {
    const chunk = texts.slice(start, start + BATCH_LIMIT);
    const json = (await postJson(
      "gemini.document_embedding",
      `models/${modelName()}:batchEmbedContents`,
      {
        requests: chunk.map((text) => ({
          model: `models/${modelName()}`,
          content: { parts: [{ text }] },
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: geminiDim(),
        })),
      },
    )) as { embeddings?: Array<{ values?: number[] }> };

    const embeddings = json.embeddings ?? [];
    if (embeddings.length !== chunk.length) {
      throw new EmbeddingError(
        "parse",
        `batch returned ${embeddings.length} embeddings for ${chunk.length} inputs`,
      );
    }
    for (const entry of embeddings) out.push(normalizeOrThrow(entry.values));
  }
  return out;
}

async function postJson(
  exchangeId: ExternalProviderExchangeId,
  path: string,
  body: unknown,
): Promise<unknown> {
  const key = apiKey();
  if (!key) throw new EmbeddingError("no_key", "GEMINI_API_KEY is not set.");

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await postJsonOnce(exchangeId, path, body, key);
    } catch (error) {
      if (!isTransientEmbeddingError(error) || attempt >= maxRetries()) {
        throw error;
      }
      await sleep(retryDelayMs(error, attempt));
    }
  }
}

class EmbeddingHttpError extends EmbeddingError {
  constructor(
    readonly status: number,
    readonly retryAfterMs: number | undefined,
  ) {
    super("http", `embedding HTTP ${status}`);
    this.name = "EmbeddingHttpError";
  }
}

async function postJsonOnce(
  exchangeId: ExternalProviderExchangeId,
  path: string,
  body: unknown,
  key: string,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());

  let response: Response;
  try {
    response = await fetchExternalProvider(
      exchangeId,
      `${baseUrl()}/${path}`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );
  } catch {
    // Discard the raw error — it can carry the request body (document/query text).
    if (controller.signal.aborted) {
      throw new EmbeddingError(
        "timeout",
        `embedding request timed out after ${timeoutMs()}ms`,
      );
    }
    throw new EmbeddingError("network", "embedding request failed");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new EmbeddingHttpError(
      response.status,
      retryAfterMs(response.headers.get("retry-after")),
    );
  }
  try {
    return await response.json();
  } catch {
    throw new EmbeddingError("parse", "embedding response was not valid JSON");
  }
}

function shouldRetryHttp(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function isTransientEmbeddingError(error: unknown): boolean {
  return (
    (error instanceof EmbeddingHttpError && shouldRetryHttp(error.status)) ||
    (error instanceof EmbeddingError &&
      (error.errorClass === "network" || error.errorClass === "timeout"))
  );
}

function retryDelayMs(error: unknown, attempt: number): number {
  if (error instanceof EmbeddingHttpError) {
    if (error.retryAfterMs !== undefined) return error.retryAfterMs;
    if (error.status === 429) return DEFAULT_RATE_LIMIT_RETRY_MS;
  }
  return retryBaseMs() * 2 ** attempt;
}

function retryAfterMs(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const dateMs = Date.parse(value);
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeOrThrow(values: number[] | undefined): number[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new EmbeddingError("parse", "embedding response missing values");
  }
  const expected = geminiDim();
  if (values.length !== expected) {
    throw new EmbeddingError(
      "bad_dim",
      `embedding dim ${values.length} != expected ${expected} (outputDimensionality not honored?)`,
    );
  }
  return l2normalize(values);
}

function l2normalize(vector: number[]): number[] {
  let sumSquares = 0;
  for (const value of vector) sumSquares += value * value;
  const norm = Math.sqrt(sumSquares);
  if (norm === 0) return vector;
  return vector.map((value) => value / norm);
}
