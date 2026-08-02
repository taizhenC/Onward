import "server-only";
import type { BeatBlueprint, OpeningCopy, Pick, PickInput } from "./types";
import { pickByKeywordHybrid } from "./keyword-match";
import { PARTIAL_FRAMING_THRESHOLD } from "./match-config";
import type { OpeningCopyInput } from "./opening-copy";
import type { OpeningCopyPolicy } from "./opening-copy-policy";
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

// Stub opening copy delegates to the selected policy so historical prompt
// releases stay deterministic without provider-specific branching here.
export async function writeOpeningCopyStub(
  input: OpeningCopyInput,
  policy: OpeningCopyPolicy,
): Promise<OpeningCopy> {
  return policy.fromStub(input);
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
