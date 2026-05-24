import "server-only";
import type { OpeningCopy, Pick, PickInput } from "./types";
import type { OpeningCopyInput } from "./opening-copy";
import { pickFigureStub, writeOpeningCopyStub } from "./llm-stub";
import {
  pickFigureReal,
  proseModelId,
  rerankModelId,
  writeOpeningCopyReal,
} from "./llm-real";

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

// Provider is resolved lazily on first use (NOT at module load) and memoized. A script
// that sets process.env.LLM_PROVIDER before its first match call therefore always wins,
// regardless of ESM import hoisting. Each process is single-provider by construction
// (smoke → stub, eval/health → real, the Next app → .env.local), so memoization is safe.
let provider: "stub" | "real" | undefined;

function resolveProvider(): "stub" | "real" {
  if (provider === undefined) {
    provider = process.env.LLM_PROVIDER === "real" ? "real" : "stub";
  }
  return provider;
}

export function pickFigure(input: PickInput): Promise<Pick> {
  return resolveProvider() === "real"
    ? pickFigureReal(input)
    : pickFigureStub(input);
}

// Opening copy (eyebrow) generation. Prose, so the real path uses the Llama prose model,
// not the GPT-OSS reranker. Best-effort by contract — the real implementation never throws;
// it degrades to a neutral fallback rather than blocking the story.
export function writeOpeningCopy(input: OpeningCopyInput): Promise<OpeningCopy> {
  return resolveProvider() === "real"
    ? writeOpeningCopyReal(input)
    : writeOpeningCopyStub(input);
}

// The LLM half of a session's match recipe (frozen at intake for replay): provider + the
// resolved rerank/prose model ids. lib/intake.ts adds matchConfigVersion + crisisRegexVersion.
export function activeRecipe(): {
  llmProvider: "stub" | "real";
  rerankModelId: string;
  proseModelId: string;
} {
  return {
    llmProvider: resolveProvider(),
    rerankModelId: rerankModelId(),
    proseModelId: proseModelId(),
  };
}
