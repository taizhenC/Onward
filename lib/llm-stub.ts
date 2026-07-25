import "server-only";
import type { BeatBlueprint, OpeningCopy, Pick, PickInput } from "./types";
import { pickByKeywordHybrid } from "./keyword-match";
import { PARTIAL_FRAMING_THRESHOLD } from "./match-config";
import {
  curatedEyebrow,
  DEFAULT_PREFACE_LINES,
  type OpeningCopyInput,
} from "./opening-copy";
import { sanitizeLegacyDisclosurePlaceholder } from "./story-privacy";
import {
  HYBRID_PLAN_SCHEMA_VERSION,
  type HybridPlanRequest,
} from "./hybrid-composition";

export type StreamBeatInput = {
  beat: BeatBlueprint;
  textOverride?: string;
};

// Yields the beat text word-by-word as a real ReadableStream, but with NO
// artificial pacing — reveal speed is now owned by the client (StoryBeat), which
// animates the buffer locally and lets the reader click to skip to the full
// passage. The prose is deterministic DB text, so the old server-side delay was
// purely cosmetic; moving it client-side is what makes "show everything" possible.
export async function* streamBeat({
  beat,
  textOverride,
}: StreamBeatInput): AsyncIterable<string> {
  // Old database rows may still contain the Phase-0 `{feeling}` line. Sanitize
  // it at the final prose boundary so an un-reseeded deployment cannot render a
  // literal placeholder or restore verbatim intake interpolation.
  const text = sanitizeLegacyDisclosurePlaceholder(textOverride ?? beat.text);

  for (const chunk of toWordChunks(text)) {
    yield chunk;
  }
}

function toWordChunks(text: string): string[] {
  return text.match(/\s*\S+\s*/g) ?? [];
}

// Stub reranker: delegates to the shared keyword-hybrid scorer. Confidence mirrors
// Phase 0 framing — a clear keyword hit reads as confident, no hit reads as "partial".
// resonance/gap are empty (the stub has no narrative reasoning). The real reranker in
// lib/llm-real.ts replaces this when LLM_PROVIDER=real.
export async function pickFigureStub(input: PickInput): Promise<Pick> {
  const { stage, keywordScore } = pickByKeywordHybrid(
    { age: input.age, feeling: input.feeling },
    input.candidates,
  );

  return {
    figureKey: stage.figureKey,
    stageId: stage.stageId,
    resonance: "",
    gap: "",
    confidence: keywordScore >= PARTIAL_FRAMING_THRESHOLD ? "high" : "low",
  };
}

// The stub preserves the same provider-neutral contract while making no
// classification attempt. Raw feeling is never copied, logged, or persisted.
export async function tagAndExpandStub(
  input: Readonly<{ feeling: string }>,
): Promise<null> {
  void input;
  return null;
}

// Stub opening copy: the hand-authored per-stage eyebrow (curatedEyebrow falls back to
// the neutral line for any uncurated stage) plus the universal hand-authored preface. The
// real generator in lib/llm-real.ts tailors the eyebrow from a bounded brief when
// LLM_PROVIDER=real; preface personalization is deferred in both modes.
export async function writeOpeningCopyStub(
  input: OpeningCopyInput,
): Promise<OpeningCopy> {
  return {
    eyebrow: curatedEyebrow(input.stage.figureKey, input.stage.stageId),
    prefaceLines: DEFAULT_PREFACE_LINES,
  };
}

export async function requestHybridPlanStub(
  input: HybridPlanRequest,
): Promise<unknown> {
  const transitionRole = input.allowedTransitionRoles.includes("turning_point")
    ? "turning_point"
    : input.allowedTransitionRoles[0];
  return {
    schemaVersion: HYBRID_PLAN_SCHEMA_VERSION,
    transitionRole,
    transitionTemplateId: input.allowedTransitionTemplateIds[0],
    bridgeTemplateId: input.allowedBridgeTemplateIds[0],
  };
}
