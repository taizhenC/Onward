export type BeatRole =
  | "scene"
  | "dark_moment"
  | "response"
  | "struggle"
  | "turning_point"
  | "became"
  | "bridge";

export type BeatKind = "narrative" | "bridge";

export type BeatBlueprint =
  | { kind: "narrative"; role: BeatRole; text: string; sourceNotes?: string }
  | { kind: "bridge"; role: BeatRole; text: string; sourceNotes?: string };

export type FigureRow = {
  figureKey: string;
  displayName: string;
  birthYear?: number;
  deathYear?: number;
};

export type Facets = {
  emotionalCore: string;
  decisionShape: string;
  triggerEvent: string;
  agencyState: string;
};

export type FigureStageRow = FigureRow & {
  stageId: string;
  stageLabel: string;
  ageMin: number;
  ageMax: number;
  shapeSentences: string[];
  facets: Facets;
  biographicalFacts: string;
  themes: string[];
  antiThemes: string[];
  beats: BeatBlueprint[];
  sources: string[];
};

export type Framing = "definitive" | "partial";

export type Confidence = "low" | "medium" | "high";

// The reranker's per-candidate verdict. resonance/gap/confidence are server-only and
// never cross to the client; the client sees only the generated openingCopy (eyebrow).
export type Pick = {
  figureKey: string;
  stageId: string;
  resonance: string;
  gap: string;
  confidence: Confidence;
};

export type PickInput = {
  age: number;
  feeling: string;
  candidates: FigureStageRow[];
};

// Why a rerank attempt fell back to the keyword-hybrid scorer. Server-only; surfaced
// in eval debug, never in API responses or production traces. `invalid_pick` = the
// model returned valid JSON naming a figure that wasn't in the candidate pool.
export type RerankFailureReason =
  | "parse_error"
  | "api_error"
  | "timeout"
  | "invalid_pick";

export type StoryAdvance = "chunk" | "beat" | "end";

// LLM-generated opening copy, stored on the session at intake and shown to the user.
//   - eyebrow: the line above the (still anonymous) figure; replaced the framing label.
//   - prefaceLines: the comfort card shown before any figure name or prose on first visit.
// Both are derived from the user's feeling → sensitive: fine to show the user, never logged.
// Phase 1A: eyebrow is real-generated in real mode; prefaceLines is hand-authored in both
// modes (real per-feeling personalization deferred — see lib/opening-copy.ts).
export type OpeningCopy = {
  eyebrow: string;
  prefaceLines: readonly string[];
};

export type Session = {
  sessionId: string;
  figureKey: string;
  stageId: string;
  framing: Framing;
  openingCopy: OpeningCopy;
  age: number;
  feeling: string;
  nextBeatIndex: number;
  nextChunkIndex: number;
  createdAt: number;
};

export type MatchResponse =
  | { crisis: true; resources: string[] }
  | { error: string }
  | { sessionId: string };

export type ClientBeat =
  | { kind: "narrative"; role: BeatRole }
  | { kind: "bridge"; role: BeatRole };

export type ClientFigureOutline = {
  figureKey: string;
  displayName: string;
  birthYear?: number;
  deathYear?: number;
  ageMin: number;
  ageMax: number;
  beats: ClientBeat[];
};
