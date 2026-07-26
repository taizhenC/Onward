import "server-only";
import type { PickInput } from "./types";
import type { OpeningCopyInput } from "./opening-copy";
import { pickFigureStub, writeOpeningCopyStub } from "./llm-stub";
import { requestHybridPlanStub } from "./llm-stub";
import {
  pickFigureReal,
  proseModelId,
  rerankModelId,
  writeOpeningCopyReal,
  requestHybridPlanReal,
} from "./llm-real";
import {
  RERANK_PROMPT_VERSION,
  STORY_PROMPT_VERSION,
} from "./llm-recipe-constants";
import type { HybridPlanRequest } from "./hybrid-composition";
import { productionStoryRecipeExecutionPlan } from "./story-recipe";
import {
  classifyDerivedOutput,
  type DerivedOutput,
} from "./derived-output-retention";

// The single LLM boundary. Everything outside lib/ imports from here — never from
// llm-stub / llm-real directly (CLAUDE.md: the provider is invisible outside lib/).

// streamBeat is always the stub in Phase 1A (real prose generation is a later axis),
// but it is re-exported HERE so callers (e.g. the beat route) hold the boundary even
// while it delegates to the stub.
export { streamBeat } from "./llm-stub";
export type { StreamBeatInput } from "./llm-stub";

// The boundary's error contract: callers (lib/matching.ts) catch this to drive the
// keyword-hybrid fallback without importing lib/llm-real directly.
export { RerankError, toRerankCandidate } from "./llm-real";
export type { RerankCandidate } from "./llm-real";
export {
  DEFAULT_PROSE_MODEL_ID,
  DEFAULT_RERANK_MODEL_ID,
  DEFAULT_RERANK_REASONING_EFFORT,
  DEFAULT_RERANK_TEMPERATURE,
  DEFAULT_STORY_TEMPERATURE,
  RERANK_PROMPT_VERSION,
  STORY_PROMPT_VERSION,
} from "./llm-recipe-constants";

// Local/eval provider selection is resolved lazily and memoized. Served production
// bypasses that environment switch and uses its immutable manifest, so changing
// one selector cannot accidentally leave a stale provider behind.
let provider: "stub" | "real" | undefined;

function resolveProvider(): "stub" | "real" {
  const production = productionStoryRecipeExecutionPlan();
  if (production) return production.llmProvider;
  if (provider === undefined) {
    provider = process.env.LLM_PROVIDER === "real" ? "real" : "stub";
  }
  return provider;
}

export async function pickFigure(
  input: PickInput,
): Promise<DerivedOutput<"rerank_response">> {
  const pick =
    resolveProvider() === "real"
      ? await pickFigureReal(input)
      : await pickFigureStub(input);
  return classifyDerivedOutput("rerank_response", pick);
}

// Opening copy (eyebrow) generation. Prose, so the real path uses the Llama prose model,
// not the GPT-OSS reranker. Best-effort by contract — the real implementation never throws;
// it degrades to a neutral fallback rather than blocking the story.
export async function writeOpeningCopy(
  input: OpeningCopyInput,
): Promise<DerivedOutput<"opening_copy">> {
  const copy =
    resolveProvider() === "real"
      ? await writeOpeningCopyReal(input)
      : await writeOpeningCopyStub(input);
  return classifyDerivedOutput("opening_copy", copy);
}

export async function requestHybridPlan(
  input: HybridPlanRequest,
): Promise<DerivedOutput<"composition_plan_candidate">> {
  const candidate =
    resolveProvider() === "real"
      ? await requestHybridPlanReal(input)
      : await requestHybridPlanStub(input);
  return classifyDerivedOutput("composition_plan_candidate", candidate);
}

// The LLM half of a session's match recipe (frozen at intake for replay): provider + the
// resolved rerank/prose model ids. lib/intake.ts adds matchConfigVersion + crisisRegexVersion.
export function activeRecipe(): {
  llmProvider: "stub" | "real";
  rerankModelId: string;
  proseModelId: string;
  rerankPromptVersion: string;
  storyPromptVersion: string;
} {
  return {
    llmProvider: resolveProvider(),
    rerankModelId: rerankModelId(),
    proseModelId: proseModelId(),
    rerankPromptVersion: RERANK_PROMPT_VERSION,
    storyPromptVersion: STORY_PROMPT_VERSION,
  };
}
