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

// The snake_case facet identifiers used at the DB / embedding boundary (figure_facet_embeddings
// .facet_type, the per-lane FacetsRAG keys). The rest of the app stays camelCase (Facets); this
// is the ONE mapper between the two spaces. Order is canonical — seeding and the cache iterate it.
export type FacetType =
  | "emotional_core"
  | "decision_shape"
  | "trigger_event"
  | "agency_state";

export const FACET_TYPES: readonly FacetType[] = [
  "emotional_core",
  "decision_shape",
  "trigger_event",
  "agency_state",
];

const FACET_TYPE_TO_KEY: Record<FacetType, keyof Facets> = {
  emotional_core: "emotionalCore",
  decision_shape: "decisionShape",
  trigger_event: "triggerEvent",
  agency_state: "agencyState",
};

// The single camel↔snake crossing: given a stage's Facets and a snake_case FacetType, return the
// authored facet text. Used by the seeder (what to embed) and the cache (what to hash-validate).
export function facetText(facets: Facets, type: FacetType): string {
  return facets[FACET_TYPE_TO_KEY[type]];
}

// How retrieval selects the rerank pool. `auto` = FacetsRAG when available else keyword fallback;
// `keyword` = force the keyword-hybrid prefilter; `facetsrag` = force FacetsRAG and FAIL if the
// embedder/cache is unavailable (so a "FacetsRAG eval" can never silently be a keyword run).
export type RetrievalMode = "auto" | "keyword" | "facetsrag";

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

export type CrisisResource = {
  id: string;
  region: string;
  label: string;
  action: string;
  href: string;
};

// LLM-generated opening copy, stored on the session at intake and shown to the user.
//   - eyebrow: the line above the (still anonymous) figure; replaced the framing label.
//   - prefaceLines: the comfort card shown before any figure name or prose on first visit.
// Both are derived from the ephemeral ResonanceBrief → sensitive: fine to show the user,
// never logged. The prose provider does not receive the raw disclosure. Preface lines remain
// hand-authored in both modes (per-brief preface generation is deferred).
export type OpeningCopy = {
  eyebrow: string;
  prefaceLines: readonly string[];
};

// Frozen at session creation for auditable replay (CLAUDE.md: sessions.match_recipe).
// proseModelId is included because the opening copy + preface are prose-model-generated and
// stored on the session at intake. embeddingModelId + retrievalMode were added with the FacetsRAG
// skeleton so replay reconstructs which embedder/retrieval path produced the match. Stored as
// jsonb, so new fields need no migration; tagger/projection fields slot in the same way later.
export type MatchRecipe = {
  recipeId: string;
  matchConfigVersion: string;
  crisisRegexVersion: string;
  llmProvider: string;
  rerankModelId: string;
  proseModelId: string;
  embeddingModelId: string;
  retrievalMode: RetrievalMode;
  // Optional only for replaying sessions created before the short-lived
  // ResonanceBrief boundary existed. Every new intake pins this version.
  resonanceBriefVersion?: string;
  matchRecoveryPolicyVersion?: string;
  alternateStoryPolicyVersion?: string;
};

export type Session = {
  sessionId: string;
  // Owner (Supabase auth user id; LOCAL_DEV_USER_ID in memory mode). Sessions are only
  // readable through lib/session.ts#getOwnedSession in request-scoped code — a foreign
  // session is indistinguishable from a missing one (404-over-500).
  userId: string;
  figureKey: string;
  stageId: string;
  // New sessions point to one immutable, owner-scoped artifact. Null exists
  // only for rows created before migration 0005 and follows the legacy path.
  storyArtifactId: string | null;
  framing: Framing;
  openingCopy: OpeningCopy;
  age: number | null;
  feeling: string | null;
  // SQL/null context identifies legacy, expired, and alternate rows. It must
  // never be interpreted as an affirmative selection of "no boundaries".
  storyRequestContext: import("./story-request-context").StoryRequestContext | null;
  disclosureExpiresAt: number;
  alternateOfSessionId: string | null;
  matchRecipe: MatchRecipe;
  nextBeatIndex: number;
  nextChunkIndex: number;
  createdAt: number;
  // Last progress write (ms). The activity signal for the anonymous-guest retention job
  // (migration 0003); bumped on every acknowledged position advance.
  updatedAt: number;
};

// Server-side session storage contract. Implemented by an in-memory store (default) and a
// Supabase store, switched on PERSISTENCE behind lib/session.ts — the provider-switch idiom
// the repo uses for LLM and embeddings. All methods are async so the two impls share one
// signature; the in-memory impl is trivially async.
export type CreateSessionInput = {
  userId: string;
  telemetryFlowId: import("./telemetry-types").TelemetryFlowId | null;
  telemetryFlowOwnerClaimed?: boolean;
  figureKey: string;
  stageId: string;
  framing: Framing;
  age: number;
  feeling: string;
  storyRequestContext: import("./story-request-context").StoryRequestContext;
  matchRecipe: MatchRecipe;
  artifact: import("./story-artifact-types").StoryArtifact;
};

export type AcknowledgeSessionPositionInput = {
  sessionId: string;
  userId: string;
  expectedBeatIndex: number;
  expectedChunkIndex: number;
  nextBeatIndex: number;
  nextChunkIndex: number;
};

export type AcknowledgeSessionPositionResult =
  | "advanced"
  | "already_advanced"
  | "conflict"
  | "not_found";

export interface SessionStore {
  createSession(input: CreateSessionInput): Promise<string>;
  getSession(sessionId: string): Promise<Session | null>;
  acknowledgePosition(
    input: AcknowledgeSessionPositionInput,
  ): Promise<AcknowledgeSessionPositionResult>;
  listSessionsByUser(userId: string): Promise<Session[]>;
  _sessionCount(): Promise<number>;
}

export type MatchResponse =
  | { crisis: true; resources: CrisisResource[] }
  | { temporarilyUnavailable: true }
  | { noEligibleStory: true }
  | { clarificationNeeded: true; policyVersion: string; recoveryToken: string }
  | { noCloseMatch: true; policyVersion: string; recoveryToken: string }
  | { rateLimited: true }
  | { flowConflict: true }
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
