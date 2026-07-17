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
  "qualified_historical_evidence",
  "qualified_evidence_with_interpretation",
  "reader_bridge",
  "review_pending",
] as const;

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
