import type { BeatRole } from "./types";

export const STORY_SPEC_SCHEMA_VERSION = "story-spec-v1-2026-07";

export type StorySpecStatus = "draft" | "review" | "published" | "retired";
export type FactConfidence = "documented" | "probable" | "disputed";
export type QuoteStatus =
  | "verbatim"
  | "paraphrase"
  | "disputed"
  | "forbidden"
  | "unverified";
export type PersonalizationZone =
  | "none"
  | "emphasis"
  | "transition"
  | "reader_bridge";

export type ContentFlag =
  | "death_or_grief"
  | "suicide_loss"
  | "abuse_or_violence"
  | "addiction"
  | "serious_illness"
  | "discrimination"
  | "pregnancy_or_parenthood"
  | "other_reviewed_flag";

export type SourceRecord = {
  sourceId: string;
  citation: string;
  locator?: string;
  url?: string;
};

export type SourceRef = {
  sourceId: string;
  locator?: string;
  scope: "exact" | "bounded" | "broad";
};

export type FactAtom = {
  factId: string;
  statement: string;
  sourceRefs: SourceRef[];
  eventOrder: number;
  confidence: FactConfidence;
  claimKind: "event" | "causal" | "sensory" | "context";
  subjectAgeMin?: number;
  subjectAgeMax?: number;
  dateStart?: string;
  dateEnd?: string;
  allowedParaphrases?: string[];
};

export type AllowedEntity = {
  entityId: string;
  kind: "person" | "place" | "organization" | "work" | "date" | "amount";
  value: string;
  aliases: string[];
};

export type QuoteRecord = {
  quoteId: string;
  text: string;
  status: QuoteStatus;
  speaker?: string;
  sourceRefs: SourceRef[];
};

export type InterpretationRule = {
  interpretationId: string;
  statement: string;
  supportingFactIds: string[];
  allowed: boolean;
};

export type StoryBeatSpec = {
  role: BeatRole;
  canonicalText: string;
  requiredFactIds: string[];
  optionalFactIds: string[];
  entityIds: string[];
  quoteIds: string[];
  sentenceEvidence: Array<{
    sentenceIndex: number;
    factIds: string[];
    interpretationIds: string[];
  }>;
  personalizationZones: PersonalizationZone[];
  sourceNote?: string;
};

export type StorySpecReview = {
  researcherId?: string;
  historicalReviewerId?: string;
  toneReviewerId?: string;
  reviewedAt?: string;
  contentProfileReviewed?: boolean;
};

export type StorySpec = {
  storySpecId: string;
  schemaVersion: string;
  figureKey: string;
  stageId: string;
  version: number;
  status: StorySpecStatus;
  episode: {
    ageMin: number;
    ageMax: number;
    startDate?: string;
    endDate?: string;
    throughLine: string;
  };
  contentProfile: {
    intensity: "gentle" | "moderate" | "direct";
    flags: ContentFlag[];
    contentNote: string;
  };
  facts: FactAtom[];
  entities: AllowedEntity[];
  quotes: QuoteRecord[];
  arc: StoryBeatSpec[];
  interpretations: InterpretationRule[];
  dramatizationLimits: string[];
  avoidRules: string[];
  sources: SourceRecord[];
  review: StorySpecReview;
};

export type StorySpecValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};
