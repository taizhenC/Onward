import "server-only";
import type { BeatBlueprint, OpeningCopy, Pick, PickInput, Session } from "./types";
import { pickByKeywordHybrid } from "./keyword-match";
import { PARTIAL_FRAMING_THRESHOLD } from "./match-config";
import {
  curatedEyebrow,
  DEFAULT_PREFACE_LINES,
  type OpeningCopyInput,
} from "./opening-copy";

const WORD_DELAY_MS = 40;

export type StreamBeatInput = {
  session: Session;
  beat: BeatBlueprint;
  textOverride?: string;
};

export async function* streamBeat({
  session,
  beat,
  textOverride,
}: StreamBeatInput): AsyncIterable<string> {
  const rawText = textOverride ?? beat.text;
  const text =
    beat.kind === "bridge"
      ? rawText.replaceAll("{feeling}", session.feeling)
      : rawText;

  for (const chunk of toWordChunks(text)) {
    await sleep(WORD_DELAY_MS);
    yield chunk;
  }
}

function toWordChunks(text: string): string[] {
  return text.match(/\s*\S+\s*/g) ?? [];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

// Stub opening copy: the hand-authored per-stage eyebrow (curatedEyebrow falls back to
// the neutral line for any uncurated stage) plus the universal hand-authored preface. The
// real generator in lib/llm-real.ts tailors the eyebrow per user feeling when
// LLM_PROVIDER=real; preface personalization is deferred in both modes.
export async function writeOpeningCopyStub(
  input: OpeningCopyInput,
): Promise<OpeningCopy> {
  return {
    eyebrow: curatedEyebrow(input.stage.figureKey, input.stage.stageId),
    prefaceLines: DEFAULT_PREFACE_LINES,
  };
}
