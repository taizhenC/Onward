import "server-only";
import type {
  Confidence,
  FigureStageRow,
  OpeningCopy,
  Pick,
  PickInput,
  RerankFailureReason,
} from "./types";
import {
  toEyebrowSurface,
  toEyebrowProviderSurface,
  type EyebrowProviderSurface,
  type OpeningCopyInput,
} from "./opening-copy";
import type { OpeningCopyPolicy } from "./opening-copy-policy";
import {
  FACET_PROJECTION_TEMPLATE_ID_CATALOG,
  parseFacetSignalJson,
  type ValidatedFacetSignal,
} from "./facet-signal";
import {
  HybridPlanProviderError,
  type HybridPlanRequest,
} from "./hybrid-composition";
import {
  DEFAULT_PROSE_MODEL_ID,
  DEFAULT_PROSE_TIMEOUT_MS,
  DEFAULT_FACET_TAGGER_INPUT_MAX_BYTES,
  DEFAULT_FACET_TAGGER_MODEL_ID,
  DEFAULT_FACET_TAGGER_REASONING_EFFORT,
  DEFAULT_FACET_TAGGER_RESPONSE_MAX_BYTES,
  DEFAULT_FACET_TAGGER_TEMPERATURE,
  DEFAULT_FACET_TAGGER_TIMEOUT_MS,
  DEFAULT_RERANK_MODEL_ID,
  DEFAULT_RERANK_REASONING_EFFORT,
  DEFAULT_RERANK_TEMPERATURE,
  DEFAULT_RERANK_TIMEOUT_MS,
  DEFAULT_STORY_TEMPERATURE,
} from "./llm-recipe-constants";
import { productionStoryRecipeExecutionPlan } from "./story-recipe";
import {
  FACET_TAGGER_PROMPT_CONTRACT,
  RERANK_PROMPT_CONTRACT,
  RERANK_SYSTEM_PROMPT,
  buildFacetTaggerUserPrompt,
  buildHybridPlanUserPrompt,
  buildRerankUserPrompt,
  type StoryPromptContract,
} from "./llm-prompts";
import {
  buildCerebrasFacetTaggerRequestBody,
  buildCerebrasHybridPlanRequestBody,
  buildCerebrasOpeningCopyRequestBody,
  buildCerebrasRerankRequestBody,
  fetchExternalProvider,
} from "./provider-exchange";

// Real reranker: GPT-OSS 120B via Cerebras' OpenAI-compatible REST endpoint.
//
// Implementation note: this calls the endpoint with plain `fetch` rather than the
// `openai` SDK. The call is a single non-streaming JSON completion, and an explicit
// AbortController (plan #6) gives clean timeout-vs-api_error classification without a
// dependency. If streaming prose lands later it can move to the SDK then.
//
// Local/eval runs are env-configurable. Served production takes every non-secret
// model/tuning choice from the selected immutable story recipe; only credentials
// and the pinned infrastructure posture remain deployment configuration.
// `npm run health` validates model / reasoning_effort / JSON mode at runtime.

function apiKey(): string | undefined {
  return [
    process.env.LLM_API_KEY,
    process.env.CEREBRAS_API_KEY,
    process.env.GROQ_API_KEY,
  ]
    .map((key) => key?.trim())
    .find((key): key is string => Boolean(key));
}
function model(): string {
  const production = productionStoryRecipeExecutionPlan();
  if (production) return production.rerankModelId;
  return process.env.LLM_MODEL_RERANK ?? DEFAULT_RERANK_MODEL_ID;
}
function temperature(): number {
  const production = productionStoryRecipeExecutionPlan();
  if (production) return production.rerankTemperature;
  return numberEnv("LLM_RERANK_TEMPERATURE", DEFAULT_RERANK_TEMPERATURE);
}
function reasoningEffort(): string {
  const production = productionStoryRecipeExecutionPlan();
  if (production) return production.rerankReasoningEffort;
  // Empty string disables the param (in case an endpoint rejects it).
  return (
    process.env.LLM_RERANK_REASONING_EFFORT ??
    DEFAULT_RERANK_REASONING_EFFORT
  );
}
function timeoutMs(): number {
  const value = numberEnv("LLM_RERANK_TIMEOUT_MS", DEFAULT_RERANK_TIMEOUT_MS);
  return value > 0 ? value : DEFAULT_RERANK_TIMEOUT_MS;
}
function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// Prose model for opening copy. Some Cerebras accounts expose only GPT-OSS;
// override LLM_MODEL_PROSE when a dedicated prose model is available on the account.
function proseModel(): string {
  const production = productionStoryRecipeExecutionPlan();
  if (production) return production.proseModelId;
  return process.env.LLM_MODEL_PROSE ?? DEFAULT_PROSE_MODEL_ID;
}
function proseTemperature(): number {
  const production = productionStoryRecipeExecutionPlan();
  if (production) return production.storyTemperature;
  return numberEnv("LLM_PROSE_TEMPERATURE", DEFAULT_STORY_TEMPERATURE);
}
function proseTimeoutMs(): number {
  const value = numberEnv("LLM_PROSE_TIMEOUT_MS", DEFAULT_PROSE_TIMEOUT_MS);
  return value > 0 ? value : DEFAULT_PROSE_TIMEOUT_MS;
}

// Resolved model ids for the match recipe (frozen on the session at intake, surfaced via
// lib/llm.ts#activeRecipe). Same env resolution the real calls use, so the recipe records the
// ids that WOULD run even when LLM_PROVIDER=stub.
export function rerankModelId(): string {
  return model();
}
export function proseModelId(): string {
  return proseModel();
}

// Anti-echo chokepoint (plan #8): the ONLY way a candidate is serialized into the
// prompt. `biographicalFacts` is the rerank surface; shapeSentences, facets, themes,
// and beat text must NEVER reach the reranker. Never spread a FigureStageRow here.
export type RerankCandidate = {
  figureKey: string;
  stageId: string;
  displayName: string;
  ageMin: number;
  ageMax: number;
  biographicalFacts: string;
};

export function toRerankCandidate(stage: FigureStageRow): RerankCandidate {
  return {
    figureKey: stage.figureKey,
    stageId: stage.stageId,
    displayName: stage.displayName,
    ageMin: stage.ageMin,
    ageMax: stage.ageMax,
    biographicalFacts: stage.biographicalFacts,
  };
}

// API-side failures only. `invalid_pick` (model named an out-of-pool figure) is
// detected by the caller (lib/matching.ts), which holds the candidate pool.
export class RerankError extends Error {
  readonly status?: number;

  constructor(
    readonly reason: Exclude<RerankFailureReason, "invalid_pick">,
    message: string,
    options?: { status?: number },
  ) {
    super(message);
    this.name = "RerankError";
    this.status = options?.status;
  }
}

export async function pickFigureReal(input: PickInput): Promise<Pick> {
  const key = apiKey();
  if (!key) {
    throw new RerankError(
      "api_error",
      "CEREBRAS_API_KEY or LLM_API_KEY is not set.",
    );
  }
  if (input.candidates.length === 0) {
    throw new RerankError("api_error", "pickFigureReal called with no candidates.");
  }

  const userPrompt = buildRerankUserPrompt(
    input.age,
    input.feeling,
    input.candidates.map(toRerankCandidate),
  );

  const effort = reasoningEffort();
  const body = buildCerebrasRerankRequestBody({
    model: model(),
    temperature: temperature(),
    systemPrompt: RERANK_SYSTEM_PROMPT,
    userPrompt,
    responseFormat: RERANK_PROMPT_CONTRACT.responseFormat,
    ...(effort ? { reasoningEffort: effort } : {}),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());

  let response: Response;
  try {
    response = await fetchExternalProvider(
      "cerebras.rerank",
      "/chat/completions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body,
        signal: controller.signal,
      },
    );
  } catch {
    // Discard the raw error (it can carry the prompt/feeling) — never log it.
    if (controller.signal.aborted) {
      throw new RerankError("timeout", `rerank timed out after ${timeoutMs()}ms`);
    }
    throw new RerankError("api_error", "rerank request failed");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new RerankError("api_error", `rerank HTTP ${response.status}`, {
      status: response.status,
    });
  }

  let content: string;
  try {
    const envelope = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    content = envelope.choices?.[0]?.message?.content ?? "";
  } catch {
    throw new RerankError("api_error", "rerank response envelope was not valid JSON");
  }

  return parsePick(content);
}

function parsePick(content: string): Pick {
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new RerankError("parse_error", "reranker did not return valid JSON");
  }
  if (raw === null || typeof raw !== "object") {
    throw new RerankError("parse_error", "reranker JSON was not an object");
  }

  const obj = raw as Record<string, unknown>;
  const figureKey = obj.figure_key;
  const stageId = obj.stage_id;
  if (typeof figureKey !== "string" || typeof stageId !== "string") {
    throw new RerankError("parse_error", "reranker JSON missing figure_key/stage_id");
  }

  return {
    figureKey,
    stageId,
    resonance: typeof obj.resonance === "string" ? obj.resonance : "",
    gap: typeof obj.gap === "string" ? obj.gap : "",
    confidence: coerceConfidence(obj.confidence),
  };
}

function coerceConfidence(value: unknown): Confidence {
  return value === "high" || value === "medium" || value === "low"
    ? value
    : "low";
}

// Best-effort, one-shot classification for shadow/eval callers. Every failure
// returns null without logging or retrying; production matching has no caller.
export async function tagAndExpandReal(
  input: Readonly<{ feeling: string }>,
): Promise<ValidatedFacetSignal | null> {
  if (
    typeof input.feeling !== "string" ||
    input.feeling.length === 0 ||
    Buffer.byteLength(input.feeling, "utf8") >
      DEFAULT_FACET_TAGGER_INPUT_MAX_BYTES
  ) {
    return null;
  }
  const key = apiKey();
  if (!key) return null;

  const body = buildCerebrasFacetTaggerRequestBody({
    model: DEFAULT_FACET_TAGGER_MODEL_ID,
    temperature: DEFAULT_FACET_TAGGER_TEMPERATURE,
    reasoningEffort: DEFAULT_FACET_TAGGER_REASONING_EFFORT,
    responseFormat: FACET_TAGGER_PROMPT_CONTRACT.responseFormat,
    systemPrompt: FACET_TAGGER_PROMPT_CONTRACT.system,
    userPrompt: buildFacetTaggerUserPrompt({
      feeling: input.feeling,
      projectionTemplateCatalog: FACET_PROJECTION_TEMPLATE_ID_CATALOG,
    }),
  });

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    DEFAULT_FACET_TAGGER_TIMEOUT_MS,
  );
  try {
    const response = await fetchExternalProvider(
      "cerebras.facet_tagger",
      "/chat/completions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body,
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      cancelFacetTaggerResponse(response, controller);
      return null;
    }

    const envelopeText = await readBoundedFacetTaggerEnvelope(
      response,
      controller,
    );
    if (envelopeText === null) return null;

    const envelope = JSON.parse(envelopeText) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = envelope.choices?.[0]?.message?.content;
    return typeof content === "string"
      ? parseFacetSignalJson(content, input.feeling)
      : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function readBoundedFacetTaggerEnvelope(
  response: Response,
  controller: AbortController,
): Promise<string | null> {
  const declaredLength = response.headers.get("content-length");
  if (
    declaredLength !== null &&
    (!/^\d+$/u.test(declaredLength) ||
      Number(declaredLength) > DEFAULT_FACET_TAGGER_RESPONSE_MAX_BYTES)
  ) {
    cancelFacetTaggerResponse(response, controller);
    return null;
  }
  if (!response.body) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const chunk = await readFacetTaggerChunk(reader, controller.signal);
      if (chunk === null) {
        void reader.cancel().catch(() => undefined);
        return null;
      }
      const { done, value } = chunk;
      if (done) break;
      if (value.byteLength === 0) continue;
      if (
        value.byteLength >
        DEFAULT_FACET_TAGGER_RESPONSE_MAX_BYTES - totalBytes
      ) {
        controller.abort();
        void reader.cancel().catch(() => undefined);
        return null;
      }
      totalBytes += value.byteLength;
      chunks.push(value);
    }

    const envelope = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      envelope.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(envelope);
  } catch {
    return null;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // An abort may win while a hostile body still has a pending read. The
      // controller and reader have already been canceled; never wait on it.
    }
  }
}

async function readFacetTaggerChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal,
): Promise<ReadableStreamReadResult<Uint8Array> | null> {
  if (signal.aborted) return null;

  let removeAbortListener: () => void = () => undefined;
  const aborted = new Promise<null>((resolve) => {
    const onAbort = () => resolve(null);
    signal.addEventListener("abort", onAbort, { once: true });
    removeAbortListener = () => signal.removeEventListener("abort", onAbort);
  });
  try {
    return await Promise.race([
      reader.read().catch(() => null),
      aborted,
    ]);
  } finally {
    removeAbortListener();
  }
}

function cancelFacetTaggerResponse(
  response: Response,
  controller: AbortController,
): void {
  controller.abort();
  if (response.body) void response.body.cancel().catch(() => undefined);
}

// ── Opening copy (eyebrow) ───────────────────────────────────────────────────────────
// Prose generation, not rerank. Unlike pickFigureReal, provider and parsing failures
// never block the story: the selected opening-copy policy owns validation and fallback.

export async function writeOpeningCopyReal(
  input: OpeningCopyInput,
  policy: OpeningCopyPolicy,
): Promise<OpeningCopy> {
  const surface = toEyebrowSurface(input);
  const raw = await generateOpeningCandidate(
    toEyebrowProviderSurface(surface),
    policy,
  );
  return policy.fromRealCandidate(raw, input);
}

// Returns the raw v1 line or parsed v2 plan, and null on any failure. It never
// logs the prompt, bounded brief, provider body, response, or raw error.
async function generateOpeningCandidate(
  surface: EyebrowProviderSurface,
  policy: OpeningCopyPolicy,
): Promise<unknown> {
  const key = apiKey();
  if (!key) return null;
  const prompts = policy.providerPrompts(surface);

  const body = buildCerebrasOpeningCopyRequestBody({
    model: proseModel(),
    temperature: proseTemperature(),
    systemPrompt: prompts.systemPrompt,
    userPrompt: prompts.userPrompt,
    ...(prompts.responseMode === "json_object"
      ? { responseFormat: prompts.responseMode }
      : {}),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), proseTimeoutMs());

  let response: Response;
  try {
    response = await fetchExternalProvider(
      "cerebras.opening_copy",
      "/chat/completions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body,
        signal: controller.signal,
      },
    );
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) return null;

  try {
    const envelope = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = envelope.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    if (prompts.responseMode === "line") return content;
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// ── Hybrid composition plan ──────────────────────────────────────────────────
// The model chooses only from server-supplied roles and template IDs. It never
// authors story prose, facts, entities, dates, quotes, or reader-derived text.

export async function requestHybridPlanReal(
  input: HybridPlanRequest,
  contract: StoryPromptContract,
): Promise<unknown> {
  const key = apiKey();
  if (!key) {
    throw new HybridPlanProviderError(
      "provider_error",
      "hybrid plan provider key is not configured",
    );
  }
  const body = buildCerebrasHybridPlanRequestBody({
    model: proseModel(),
    temperature: contract.hybridPlan.temperature,
    systemPrompt: contract.hybridPlan.system,
    userPrompt: buildHybridPlanUserPrompt(input, contract),
    responseFormat: contract.hybridPlan.responseFormat,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), proseTimeoutMs());
  let response: Response;
  try {
    response = await fetchExternalProvider(
      "cerebras.hybrid_plan",
      "/chat/completions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body,
        signal: controller.signal,
      },
    );
  } catch {
    if (controller.signal.aborted) {
      throw new HybridPlanProviderError(
        "provider_timeout",
        "hybrid plan provider timed out",
      );
    }
    throw new HybridPlanProviderError(
      "provider_error",
      "hybrid plan provider request failed",
    );
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    throw new HybridPlanProviderError(
      "provider_error",
      `hybrid plan provider returned HTTP ${response.status}`,
    );
  }
  try {
    const envelope = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = envelope.choices?.[0]?.message?.content;
    return typeof content === "string" ? JSON.parse(content) : null;
  } catch {
    return null;
  }
}
