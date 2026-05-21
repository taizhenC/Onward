import "server-only";
import type {
  Confidence,
  FigureStageRow,
  Pick,
  PickInput,
  RerankFailureReason,
} from "./types";

// Real reranker: GPT-OSS 120B via Groq's OpenAI-compatible REST endpoint.
//
// Implementation note: this calls the endpoint with plain `fetch` rather than the
// `openai` SDK. The call is a single non-streaming JSON completion, and an explicit
// AbortController (plan #6) gives clean timeout-vs-api_error classification without a
// dependency. If streaming prose lands later it can move to the SDK then.
//
// Everything provider-specific is env-configurable (plan #10), never a baked constant.
// `npm run health` validates the model id / reasoning_effort / JSON-mode at runtime.

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const DEFAULT_TIMEOUT_MS = 8000;

function baseUrl(): string {
  return process.env.GROQ_BASE_URL ?? DEFAULT_BASE_URL;
}
function model(): string {
  return process.env.LLM_MODEL_RERANK ?? DEFAULT_MODEL;
}
function temperature(): number {
  return Number(process.env.LLM_RERANK_TEMPERATURE ?? "0");
}
function reasoningEffort(): string {
  // Empty string disables the param (in case an endpoint rejects it).
  return process.env.LLM_RERANK_REASONING_EFFORT ?? "low";
}
function timeoutMs(): number {
  return Number(process.env.LLM_RERANK_TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS));
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
  constructor(
    readonly reason: Exclude<RerankFailureReason, "invalid_pick">,
    message: string,
  ) {
    super(message);
    this.name = "RerankError";
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
  "- Before deciding, hold two things in mind: the strongest reason the match resonates with the person's specific words, and the strongest gap (what their words carry that this figure's struggle does not). Then commit. Do not refuse to choose.",
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
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new RerankError("api_error", "GROQ_API_KEY is not set.");
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
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    // Discard the raw error (it can carry the prompt/feeling) — never log it.
    if (controller.signal.aborted) {
      throw new RerankError("timeout", `rerank timed out after ${timeoutMs()}ms`);
    }
    throw new RerankError("api_error", "rerank request failed");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new RerankError("api_error", `rerank HTTP ${response.status}`);
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
