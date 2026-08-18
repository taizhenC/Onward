import "server-only";
import type { PickInput } from "./types";
import type { OpeningCopyInput } from "./opening-copy";
import {
  pickFigureStub,
  tagAndExpandStub,
  writeOpeningCopyStub,
} from "./llm-stub";
import { requestHybridPlanStub } from "./llm-stub";
import {
  pickFigureReal,
  proseModelId,
  rerankModelId,
  tagAndExpandReal,
  writeOpeningCopyReal,
  requestHybridPlanReal,
} from "./llm-real";
import {
  RERANK_PROMPT_VERSION,
  STORY_PROMPT_VERSION,
  storyPromptContractFor,
} from "./llm-recipe-constants";
import {
  HybridPlanProviderError,
  type HybridPlanRequest,
} from "./hybrid-composition";
import { productionStoryRecipeExecutionPlan } from "./story-recipe";
import {
  classifyDerivedOutput,
  type DerivedOutput,
} from "./derived-output-retention";
import {
  OpeningCopyPolicyError,
  openingCopyPolicyForStoryPromptVersion,
} from "./opening-copy-policy";

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
  DEFAULT_FACET_TAGGER_MODEL_ID,
  DEFAULT_FACET_TAGGER_INPUT_MAX_BYTES,
  DEFAULT_FACET_TAGGER_REASONING_EFFORT,
  DEFAULT_FACET_TAGGER_RESPONSE_MAX_BYTES,
  DEFAULT_FACET_TAGGER_TEMPERATURE,
  DEFAULT_FACET_TAGGER_TIMEOUT_MS,
  DEFAULT_PROSE_MODEL_ID,
  DEFAULT_RERANK_MODEL_ID,
  DEFAULT_RERANK_REASONING_EFFORT,
  DEFAULT_RERANK_TEMPERATURE,
  DEFAULT_STORY_TEMPERATURE,
  FACET_TAGGER_PROMPT_VERSION,
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

export type TagAndExpandInput = Readonly<{ feeling: string }>;

/**
 * Provider-neutral facet classification boundary. Consumed by exactly one
 * reviewed call site — the env-gated FacetsRAG retrieval slice in
 * lib/matching.ts (default off) — and the architecture checker pins that
 * allowlist. Served production stays dormant: NODE_ENV=production forces the
 * stub (null) here regardless of the consumer's gate.
 */
export function tagAndExpand(
  input: TagAndExpandInput,
): ReturnType<typeof tagAndExpandReal> {
  if (process.env.NODE_ENV === "production") {
    return tagAndExpandStub(input);
  }
  return resolveProvider() === "real"
    ? tagAndExpandReal(input)
    : tagAndExpandStub(input);
}

// Opening-copy generation is best-effort after a supported recipe identity is
// selected. Provider and output failures degrade to a safe fallback; an unknown
// or production-unselected prompt identity fails closed before provider use.
export async function writeOpeningCopy(
  input: OpeningCopyInput,
  storyPromptVersion: string,
): Promise<DerivedOutput<"opening_copy_candidate">> {
  const policy = openingCopyPolicyForStoryPromptVersion(storyPromptVersion);
  if (!storyPromptVersionIsExecutable(storyPromptVersion)) {
    throw new OpeningCopyPolicyError();
  }
  const copy =
    resolveProvider() === "real"
      ? await writeOpeningCopyReal(input, policy)
      : await writeOpeningCopyStub(input, policy);
  return classifyDerivedOutput("opening_copy_candidate", copy);
}

export async function requestHybridPlan(
  input: HybridPlanRequest,
  storyPromptVersion: string,
): Promise<DerivedOutput<"composition_plan_candidate">> {
  const contract = storyPromptContractFor(storyPromptVersion);
  if (!contract || !storyPromptVersionIsExecutable(storyPromptVersion)) {
    throw new HybridPlanProviderError(
      "provider_error",
      "Story prompt policy is unavailable.",
    );
  }
  const candidate =
    resolveProvider() === "real"
      ? await requestHybridPlanReal(input, contract)
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
    storyPromptVersion: resolveStoryPromptVersion(),
  };
}

function resolveStoryPromptVersion(): string {
  return (
    productionStoryRecipeExecutionPlan()?.storyPromptVersion ??
    STORY_PROMPT_VERSION
  );
}

function storyPromptVersionIsExecutable(storyPromptVersion: string): boolean {
  const production = productionStoryRecipeExecutionPlan();
  return (
    production === null ||
    production.storyPromptVersion === storyPromptVersion
  );
}
