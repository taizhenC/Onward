import type { BeatRole } from "./types";
import type {
  FactConfidence,
  QuoteStatus,
  SourceRef,
} from "./story-spec-types";

export const STORY_TRANSPARENCY_SCHEMA_VERSION =
  "story-transparency-v1-2026-07";
export const MATCH_RATIONALE_POLICY_VERSION =
  "match-rationale-v1-2026-07";

export const STORY_EVIDENCE_CLASSES = [
  "documented_scene",
  "documented_with_interpretation",
  "documented_with_texture",
  "qualified_historical_evidence",
  "qualified_evidence_with_interpretation",
  "qualified_evidence_with_texture",
  "reader_bridge",
  "review_pending",
] as const;

export const STORY_TRANSPARENCY_TEXTURE_LIMITS = Object.freeze({
  sentencesPerBeat: 64,
  sentenceLength: 1_000,
});

export type StoryEvidenceClass = (typeof STORY_EVIDENCE_CLASSES)[number];

export type StoryTransparencySource = {
  sourceId: string;
  citation: string;
  locator?: string;
  url?: string;
};

export type StoryTransparencyFact = {
  factId: string;
  statement: string;
  confidence: FactConfidence;
  claimKind: "event" | "causal" | "sensory" | "context";
  sourceRefs: SourceRef[];
};

export type StoryTransparencyQuote = {
  quoteId: string;
  text: string;
  status: QuoteStatus;
  speaker?: string;
  sourceRefs: SourceRef[];
};

export type StoryTransparencyBeat = {
  role: BeatRole;
  evidenceClass: StoryEvidenceClass;
  hasPersonalizedTransition: boolean;
  factIds: string[];
  quoteIds: string[];
  // Present only when the passage carries dramatized texture: the exact
  // sentences we wrote as scene detail, so the afterword can list them. The
  // key is omitted (not empty) on passages without texture, which keeps every
  // pre-2026-09 stored artifact byte-identical under re-projection.
  dramatizedSentences?: string[];
};

export type StoryTransparency = {
  schemaVersion: typeof STORY_TRANSPARENCY_SCHEMA_VERSION;
  storySpec: {
    storySpecId: string;
    version: number;
    schemaVersion: string;
  };
  rationale: {
    policyVersion: typeof MATCH_RATIONALE_POLICY_VERSION;
    resonance: string;
    gap: string;
  };
  provenance: {
    status: "editorially_reviewed" | "review_draft";
    reviewedAt?: string;
  };
  sources: StoryTransparencySource[];
  facts: StoryTransparencyFact[];
  quotes: StoryTransparencyQuote[];
  beats: StoryTransparencyBeat[];
};

export const HISTORICAL_CONCERN_REASONS = [
  "incorrect_fact",
  "misleading_context",
  "source_problem",
  "quote_or_attribution",
  "date_or_sequence",
] as const;

export type HistoricalConcernReason =
  (typeof HISTORICAL_CONCERN_REASONS)[number];
