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
  DEFAULT_PREFACE_LINES,
  NEUTRAL_EYEBROW,
  sanitizeEyebrow,
  toEyebrowSurface,
  type EyebrowPromptSurface,
  type OpeningCopyInput,
} from "./opening-copy";
import { containsResonanceEcho } from "./resonance-brief";
import {
  HybridPlanProviderError,
  type HybridPlanRequest,
} from "./hybrid-composition";
import {
  DEFAULT_PROSE_MODEL_ID,
  DEFAULT_PROSE_TIMEOUT_MS,
  DEFAULT_LLM_BASE_URL,
  DEFAULT_RERANK_MODEL_ID,
  DEFAULT_RERANK_REASONING_EFFORT,
  DEFAULT_RERANK_TEMPERATURE,
  DEFAULT_RERANK_TIMEOUT_MS,
  DEFAULT_STORY_TEMPERATURE,
} from "./llm-recipe-constants";
import { productionStoryRecipeExecutionPlan } from "./story-recipe";
import {
  EYEBROW_SYSTEM_PROMPT,
  HYBRID_PLAN_SYSTEM_PROMPT,
  RERANK_PROMPT_CONTRACT,
  RERANK_SYSTEM_PROMPT,
  STORY_PROMPT_CONTRACT,
  buildEyebrowUserPrompt,
  buildHybridPlanUserPrompt,
  buildRerankUserPrompt,
} from "./llm-prompts";

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

function baseUrl(): string {
  const configured =
    process.env.LLM_BASE_URL?.trim() ??
    process.env.CEREBRAS_BASE_URL?.trim() ??
    process.env.GROQ_BASE_URL?.trim();
  if (!configured) return DEFAULT_LLM_BASE_URL;
  return configured.replace(/\/+$/, "") || DEFAULT_LLM_BASE_URL;
}
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

  const body: Record<string, unknown> = {
    model: model(),
    temperature: temperature(),
    response_format: { type: RERANK_PROMPT_CONTRACT.responseFormat },
    messages: [
      { role: "system", content: RERANK_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  };
  const effort = reasoningEffort();
  if (effort) body.reasoning_effort = effort;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
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

// ── Opening copy (eyebrow) ───────────────────────────────────────────────────────────
// Prose generation, not rerank: routed to the Llama prose model. Unlike pickFigureReal,
// this NEVER throws — any failure (no key, timeout, HTTP error, bad output) degrades to the
// neutral fallback via sanitizeEyebrow, because copy must never block the story.

export async function writeOpeningCopyReal(
  input: OpeningCopyInput,
): Promise<OpeningCopy> {
  const surface = toEyebrowSurface(input);
  const raw = await generateEyebrowLine(surface);
  // sanitizeEyebrow turns null / blank / preamble / too-long / name-leak into the neutral
  // fallback, so this always returns a usable line.
  const eyebrow = sanitizeEyebrow(raw, surface.displayName);
  return {
    eyebrow: containsResonanceEcho(eyebrow, input.resonanceBrief)
      ? NEUTRAL_EYEBROW
      : eyebrow,
    // Preface per-brief personalization is deferred. Until it lands, real mode serves the
    // same hand-authored universal lines as the stub (which will become the failure fallback
    // for the eventual generated preface, mirroring the eyebrow's neutral fallback).
    prefaceLines: DEFAULT_PREFACE_LINES,
  };
}

// Returns the raw model line, or null on any failure. Never throws, and never logs the
// prompt, derived brief, or raw error (privacy floor).
async function generateEyebrowLine(
  surface: EyebrowPromptSurface,
): Promise<string | null> {
  const key = apiKey();
  if (!key) return null;

  const body = {
    model: proseModel(),
    temperature: proseTemperature(),
    messages: [
      { role: "system", content: EYEBROW_SYSTEM_PROMPT },
      { role: "user", content: buildEyebrowUserPrompt(surface) },
    ],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), proseTimeoutMs());

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
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
    return envelope.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

// ── Hybrid composition plan ──────────────────────────────────────────────────
// The model chooses only from server-supplied roles and template IDs. It never
// authors story prose, facts, entities, dates, quotes, or reader-derived text.

export async function requestHybridPlanReal(
  input: HybridPlanRequest,
): Promise<unknown> {
  const key = apiKey();
  if (!key) {
    throw new HybridPlanProviderError(
      "provider_error",
      "hybrid plan provider key is not configured",
    );
  }
  const body = {
    model: proseModel(),
    temperature: STORY_PROMPT_CONTRACT.hybridPlan.temperature,
    response_format: {
      type: STORY_PROMPT_CONTRACT.hybridPlan.responseFormat,
    },
    messages: [
      { role: "system", content: HYBRID_PLAN_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildHybridPlanUserPrompt(input),
      },
    ],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), proseTimeoutMs());
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
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
