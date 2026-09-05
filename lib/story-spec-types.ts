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
// Sentence treatments. `historical_claim` sentences carry documented facts or
// reviewed interpretations. `dramatized_texture` sentences render a documented
// moment in scene (a room, a gesture, a thought) and must add no person, place,
// date, amount, quotation, event, or causal link beyond the facts they are
// grounded on; the afterword lists them as lines we wrote. `reader_bridge` and
// `reader_permission` are the bridge's reader-directed copy: the two fixed
// distance sentences, and one or two bounded permission lines.
// The two story-first treatments were added on 2026-09-03 as a backward-
// compatible extension of story-spec-v1: every v1 document stays valid and
// means the same thing. See docs/design/2026-09-story-first.md.
export type SentenceTreatment =
  | "historical_claim"
  | "dramatized_texture"
  | "reader_bridge"
  | "reader_permission";

export const CONTENT_FLAGS = [
  "death_or_grief",
  "suicide_loss",
  "abuse_or_violence",
  "addiction",
  "serious_illness",
  "discrimination",
  "pregnancy_or_parenthood",
  "other_reviewed_flag",
] as const;

export type ContentFlag = (typeof CONTENT_FLAGS)[number];

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
    treatment: SentenceTreatment;
    factIds: string[];
    interpretationIds: string[];
    quoteIds: string[];
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
