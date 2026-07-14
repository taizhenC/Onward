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

// Real reranker: GPT-OSS 120B via Cerebras' OpenAI-compatible REST endpoint.
//
// Implementation note: this calls the endpoint with plain `fetch` rather than the
// `openai` SDK. The call is a single non-streaming JSON completion, and an explicit
// AbortController (plan #6) gives clean timeout-vs-api_error classification without a
// dependency. If streaming prose lands later it can move to the SDK then.
//
// Everything provider-specific is env-configurable (plan #10), never a baked constant.
// `npm run health` validates the model id / reasoning_effort / JSON-mode at runtime.

const DEFAULT_BASE_URL = "https://api.cerebras.ai/v1";
const DEFAULT_MODEL = "gpt-oss-120b";
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_TIMEOUT_MS = 15000;

function baseUrl(): string {
  const configured =
    process.env.LLM_BASE_URL?.trim() ??
    process.env.CEREBRAS_BASE_URL?.trim() ??
    process.env.GROQ_BASE_URL?.trim();
  if (!configured) return DEFAULT_BASE_URL;
  return configured.replace(/\/+$/, "") || DEFAULT_BASE_URL;
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
  return process.env.LLM_MODEL_RERANK ?? DEFAULT_MODEL;
}
function temperature(): number {
  return numberEnv("LLM_RERANK_TEMPERATURE", DEFAULT_TEMPERATURE);
}
function reasoningEffort(): string {
  // Empty string disables the param (in case an endpoint rejects it).
  return process.env.LLM_RERANK_REASONING_EFFORT ?? "low";
}
function timeoutMs(): number {
  const value = numberEnv("LLM_RERANK_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);
  return value > 0 ? value : DEFAULT_TIMEOUT_MS;
}
function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// Prose model for opening copy. Some Cerebras accounts expose only GPT-OSS;
// override LLM_MODEL_PROSE when a dedicated prose model is available on the account.
const DEFAULT_PROSE_MODEL = "gpt-oss-120b";
const DEFAULT_PROSE_TEMPERATURE = 0.3;
const DEFAULT_PROSE_TIMEOUT_MS = 8000;

function proseModel(): string {
  return process.env.LLM_MODEL_PROSE ?? DEFAULT_PROSE_MODEL;
}
function proseTemperature(): number {
  return numberEnv("LLM_PROSE_TEMPERATURE", DEFAULT_PROSE_TEMPERATURE);
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

const SYSTEM_PROMPT = [
  "You are matching a person's emotional disclosure to a curated set of real historical figures.",
  "Each candidate is one episode from a figure's life at a particular age, described by biographical facts.",
  "Choose the ONE candidate whose specific struggle at a similar age best mirrors the emotional shape of what the person wrote.",
  "",
  "Rules:",
  "- Bias against figures whose stories are widely taught in school (Lincoln, Van Gogh, Einstein, etc.). When fit is comparable, prefer the less-famous figure — recognizability adds nothing if the resonance is shallow.",
  "- Weigh emotional shape first. Treat a large gap between the person's age and a candidate's age range as part of what the match does NOT cover, not as a disqualifier.",
  "- Distinguish being trapped in a life or role imposed by others from losing, wrecking, or restarting a career path one chose. When both are possible, prefer the candidate whose trigger matches the person's stated trap.",
  "- Distinguish being trapped in a private life role imposed by family or convention from being denied public credit or recognition for work one actually did.",
  "- Before deciding, hold two things in mind: the strongest reason the match resonates with the person's specific words, and the strongest gap (what their words carry that this figure's struggle does not). Then commit. Do not refuse to choose.",
  "- If no candidate genuinely matches the person's situation, still choose the closest candidate, but set confidence to \"low\"; do not inflate a weak or merely adjacent fit.",
  "- Choose only from the provided candidates, using their exact figure_key and stage_id.",
  "",
  'Respond with a single JSON object and nothing else, with keys: figure_key (string), stage_id (string), resonance (one sentence), gap (one sentence), confidence (one of "low", "medium", "high").',
].join("\n");

function buildUserPrompt(
  age: number,
  feeling: string,
  candidates: RerankCandidate[],
): string {
  const lines = candidates.map(
    (c) =>
      `- figure_key: ${c.figureKey} | stage_id: ${c.stageId} | name: ${c.displayName} | age_range: ${c.ageMin}-${c.ageMax}\n  biographical_facts: ${c.biographicalFacts}`,
  );

  return [
    `The person is ${age} years old. They wrote:`,
    '"""',
    feeling,
    '"""',
    "",
    "Candidates:",
    ...lines,
    "",
    "Choose the best match and respond with the JSON object.",
  ].join("\n");
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

  const userPrompt = buildUserPrompt(
    input.age,
    input.feeling,
    input.candidates.map(toRerankCandidate),
  );

  const body: Record<string, unknown> = {
    model: model(),
    temperature: temperature(),
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
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

const EYEBROW_SYSTEM_PROMPT = [
  "You write one quiet line for the top of a page in a small, gentle book.",
  "A privacy-safe emotional shape has been derived from what someone shared. A real life story has been chosen to sit beside theirs, but its subject is not named here.",
  "Write a single short line that gestures at that pressure — like a chapter eyebrow, not a full sentence.",
  "",
  "Rules:",
  "- No diagnosis. No advice. No reassurance and no promises.",
  "- Do not name any person, place, or year. Do not claim the two lives match exactly.",
  "- Under ten words. Plain and calm. No quotation marks.",
  "- No preamble and no explanation. Output ONLY the line itself.",
].join("\n");

function buildEyebrowPrompt(surface: EyebrowPromptSurface): string {
  return [
    "A privacy boundary reduced the reader's disclosure to these governed fields:",
    `Primary pressure: ${surface.resonance.primaryPressure}`,
    `Emotional shape: ${surface.resonance.emotionalCore}`,
    `Situation shape: ${surface.resonance.situationShape}`,
    `Desired distance: ${surface.resonance.desiredDistance}`,
    "",
    "The chosen life carries this emotional through-line (do not quote it, do not name its subject):",
    surface.throughLine,
    "",
    "Write the one-line eyebrow now.",
  ].join("\n");
}

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
      { role: "user", content: buildEyebrowPrompt(surface) },
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
