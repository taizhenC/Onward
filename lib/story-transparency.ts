import "server-only";
import { isDeepStrictEqual } from "node:util";
import { containsResonanceEcho, type PrimaryPressure, type ResonanceBrief } from "./resonance-brief";
import type { StorySpec, SourceRef } from "./story-spec-types";
import {
  MATCH_RATIONALE_POLICY_VERSION,
  STORY_EVIDENCE_CLASSES,
  STORY_TRANSPARENCY_SCHEMA_VERSION,
  type StoryEvidenceClass,
  type StoryTransparency,
} from "./story-transparency-types";
import type { BeatRole, Framing } from "./types";

const EXPECTED_ROLES: readonly BeatRole[] = [
  "scene",
  "dark_moment",
  "response",
  "struggle",
  "turning_point",
  "became",
  "bridge",
];

const RESONANCE_COPY: Record<PrimaryPressure, string> = {
  loss: "This story may share a pattern of rebuilding after something important changed what felt stable.",
  rejection: "This story may share a pattern of continuing after effort or identity was not recognized.",
  isolation: "This story may share a pattern of carrying a difficult stretch without enough connection.",
  identity: "This story may share a pattern of living between an old identity and a new one not yet clear.",
  blocked_agency: "This story may share a pattern of wanting movement while the available choices feel constrained.",
  shame: "This story may share a pattern of keeping a setback from becoming a verdict on the whole self.",
  uncertainty: "This story may share a pattern of moving while no direction feels fully trustworthy yet.",
  exhaustion: "This story may share a pattern of continuing after energy and hope have thinned.",
  other: "This story may share a human pattern that is difficult to reduce to a simple category.",
};

const GAP_COPY: Record<Framing, string> = {
  definitive:
    "The connection is a human pattern, not an equivalence: the circumstances, stakes, choices, and outcome are different.",
  partial:
    "This is an adjacent parallel, not an equivalence: the circumstances, stakes, choices, and outcome are different.",
};

const FACT_CONFIDENCES = ["documented", "probable", "disputed"] as const;
const CLAIM_KINDS = ["event", "causal", "sensory", "context"] as const;
const QUOTE_STATUSES = [
  "verbatim",
  "paraphrase",
  "disputed",
  "forbidden",
  "unverified",
] as const;
const SOURCE_SCOPES = ["exact", "bounded", "broad"] as const;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/;

export function buildStoryTransparency(
  storySpec: StorySpec,
  resonanceBrief: ResonanceBrief,
  framing: Framing,
  personalizedTransitionRole?: BeatRole,
): StoryTransparency {
  const usedFactIds = unique(
    storySpec.arc.flatMap((beat) => [
      ...beat.requiredFactIds,
      ...beat.optionalFactIds,
    ]),
  );
  const usedQuoteIds = unique(storySpec.arc.flatMap((beat) => beat.quoteIds));
  const factSet = new Set(usedFactIds);
  const quoteSet = new Set(usedQuoteIds);
  const factsById = new Map(storySpec.facts.map((fact) => [fact.factId, fact]));
  const reviewed = storySpec.status === "published";

  return deepFreeze({
    schemaVersion: STORY_TRANSPARENCY_SCHEMA_VERSION,
    storySpec: {
      storySpecId: storySpec.storySpecId,
      version: storySpec.version,
      schemaVersion: storySpec.schemaVersion,
    },
    rationale: {
      policyVersion: MATCH_RATIONALE_POLICY_VERSION,
      resonance: RESONANCE_COPY[resonanceBrief.primaryPressure],
      gap: GAP_COPY[framing],
    },
    provenance: reviewed
      ? {
          status: "editorially_reviewed",
          reviewedAt: storySpec.review.reviewedAt,
        }
      : { status: "review_draft" },
    sources: storySpec.sources.map((source) => ({ ...source })),
    facts: storySpec.facts
      .filter((fact) => factSet.has(fact.factId))
      .map((fact) => ({
        factId: fact.factId,
        statement: fact.statement,
        confidence: fact.confidence,
        claimKind: fact.claimKind,
        sourceRefs: structuredClone(fact.sourceRefs),
      })),
    quotes: storySpec.quotes
      .filter((quote) => quoteSet.has(quote.quoteId))
      .map((quote) => ({
        quoteId: quote.quoteId,
        text: quote.text,
        status: quote.status,
        ...(quote.speaker ? { speaker: quote.speaker } : {}),
        sourceRefs: structuredClone(quote.sourceRefs),
      })),
    beats: storySpec.arc.map((beat) => ({
      role: beat.role,
      evidenceClass: evidenceClassForBeat(beat, reviewed, factsById),
      hasPersonalizedTransition:
        beat.role !== "bridge" && beat.role === personalizedTransitionRole,
      factIds: unique([...beat.requiredFactIds, ...beat.optionalFactIds]),
      quoteIds: unique(beat.quoteIds),
    })),
  });
}

export function validateStoryTransparency(
  value: unknown,
  storySpec: StorySpec,
  resonanceBrief: ResonanceBrief,
  framing: Framing,
  personalizedTransitionRole?: BeatRole,
): value is StoryTransparency {
  if (!validateStoredStoryTransparency(value)) return false;
  const expected = buildStoryTransparency(
    storySpec,
    resonanceBrief,
    framing,
    personalizedTransitionRole,
  );
  if (!isDeepStrictEqual(value, expected)) return false;
  return !containsResonanceEcho(value.rationale.resonance, resonanceBrief) &&
    !containsResonanceEcho(value.rationale.gap, resonanceBrief);
}

export function validateStoredStoryTransparency(
  value: unknown,
): value is StoryTransparency {
  if (!isRecord(value) || !hasExactKeys(value, [
    "beats",
    "facts",
    "provenance",
    "quotes",
    "rationale",
    "schemaVersion",
    "sources",
    "storySpec",
  ])) return false;
  if (value.schemaVersion !== STORY_TRANSPARENCY_SCHEMA_VERSION) return false;
  if (
    !isRecord(value.storySpec) ||
    !hasExactKeys(value.storySpec, ["schemaVersion", "storySpecId", "version"]) ||
    !isSafeId(value.storySpec.storySpecId) ||
    !isBoundedText(value.storySpec.schemaVersion, 1, 128) ||
    !Number.isInteger(value.storySpec.version) ||
    (value.storySpec.version as number) < 1
  ) return false;
  if (!isRecord(value.rationale) || !hasExactKeys(value.rationale, [
    "gap",
    "policyVersion",
    "resonance",
  ])) return false;
  if (
    value.rationale.policyVersion !== MATCH_RATIONALE_POLICY_VERSION ||
    !Object.values(RESONANCE_COPY).includes(value.rationale.resonance as string) ||
    !Object.values(GAP_COPY).includes(value.rationale.gap as string)
  ) return false;

  if (!isRecord(value.provenance)) return false;
  const reviewed = value.provenance.status === "editorially_reviewed";
  if (
    value.provenance.status !== "editorially_reviewed" &&
    value.provenance.status !== "review_draft"
  ) return false;
  if (
    reviewed
      ? !hasExactKeys(value.provenance, ["reviewedAt", "status"]) ||
        !isReviewDate(value.provenance.reviewedAt)
      : !hasExactKeys(value.provenance, ["status"])
  ) return false;

  if (
    !Array.isArray(value.sources) || value.sources.length === 0 || value.sources.length > 100 ||
    !Array.isArray(value.facts) || value.facts.length > 500 ||
    !Array.isArray(value.quotes) || value.quotes.length > 100 ||
    !Array.isArray(value.beats) || value.beats.length !== EXPECTED_ROLES.length
  ) return false;

  const sourceIds = new Set<string>();
  for (const source of value.sources) {
    if (!isRecord(source)) return false;
    const allowedKeys = source.locator === undefined
      ? source.url === undefined
        ? ["citation", "sourceId"]
        : ["citation", "sourceId", "url"]
      : source.url === undefined
        ? ["citation", "locator", "sourceId"]
        : ["citation", "locator", "sourceId", "url"];
    if (
      !hasExactKeys(source, allowedKeys) ||
      !isSafeId(source.sourceId) ||
      !isBoundedText(source.citation, 1, 2_000) ||
      (source.locator !== undefined && !isBoundedText(source.locator, 1, 500)) ||
      (source.url !== undefined && !isSafeSourceUrl(source.url)) ||
      sourceIds.has(source.sourceId)
    ) return false;
    sourceIds.add(source.sourceId);
  }

  const factIds = new Set<string>();
  const factConfidences = new Map<string, unknown>();
  for (const fact of value.facts) {
    if (
      !isRecord(fact) ||
      !hasExactKeys(fact, ["claimKind", "confidence", "factId", "sourceRefs", "statement"]) ||
      !isSafeId(fact.factId) ||
      !isBoundedText(fact.statement, 1, 4_000) ||
      !FACT_CONFIDENCES.includes(fact.confidence as (typeof FACT_CONFIDENCES)[number]) ||
      !CLAIM_KINDS.includes(fact.claimKind as (typeof CLAIM_KINDS)[number]) ||
      !validateSourceRefs(fact.sourceRefs, sourceIds, reviewed) ||
      factIds.has(fact.factId)
    ) return false;
    factIds.add(fact.factId);
    factConfidences.set(fact.factId, fact.confidence);
  }

  const quoteIds = new Set<string>();
  for (const quote of value.quotes) {
    if (!isRecord(quote)) return false;
    const allowedKeys = quote.speaker === undefined
      ? ["quoteId", "sourceRefs", "status", "text"]
      : ["quoteId", "sourceRefs", "speaker", "status", "text"];
    if (
      !hasExactKeys(quote, allowedKeys) ||
      !isSafeId(quote.quoteId) ||
      !isBoundedText(quote.text, 1, 4_000) ||
      (quote.speaker !== undefined && !isBoundedText(quote.speaker, 1, 500)) ||
      !QUOTE_STATUSES.includes(quote.status as (typeof QUOTE_STATUSES)[number]) ||
      (reviewed && (quote.status === "forbidden" || quote.status === "unverified")) ||
      !validateSourceRefs(quote.sourceRefs, sourceIds, reviewed) ||
      quoteIds.has(quote.quoteId)
    ) return false;
    quoteIds.add(quote.quoteId);
  }

  const referencedFactIds = new Set<string>();
  const referencedQuoteIds = new Set<string>();
  for (const [index, beat] of value.beats.entries()) {
    if (
      !isRecord(beat) ||
      !hasExactKeys(beat, [
        "evidenceClass",
        "factIds",
        "hasPersonalizedTransition",
        "quoteIds",
        "role",
      ]) ||
      beat.role !== EXPECTED_ROLES[index] ||
      !STORY_EVIDENCE_CLASSES.includes(
        beat.evidenceClass as StoryEvidenceClass,
      ) ||
      !isUniqueIdArray(beat.factIds, factIds) ||
      !isUniqueIdArray(beat.quoteIds, quoteIds) ||
      typeof beat.hasPersonalizedTransition !== "boolean" ||
      (beat.role === "bridge" && beat.hasPersonalizedTransition) ||
      (beat.role === "bridge" && beat.evidenceClass !== "reader_bridge") ||
      (beat.role !== "bridge" && beat.evidenceClass === "reader_bridge") ||
      (reviewed && beat.role !== "bridge" &&
        (beat.evidenceClass === "review_pending" || beat.factIds.length === 0)) ||
      (reviewed &&
        (beat.evidenceClass as string).startsWith("documented") &&
        beat.factIds.some(
          (factId) => factConfidences.get(factId) !== "documented",
        )) ||
      (reviewed &&
        (beat.evidenceClass as string).startsWith("qualified") &&
        beat.factIds.every(
          (factId) => factConfidences.get(factId) === "documented",
        ))
    ) return false;
    for (const id of beat.factIds) referencedFactIds.add(id);
    for (const id of beat.quoteIds) referencedQuoteIds.add(id);
  }
  return sameSet(referencedFactIds, factIds) && sameSet(referencedQuoteIds, quoteIds);
}

export function isHistoricalConcernFact(
  transparency: StoryTransparency,
  factId: string,
): boolean {
  return transparency.facts.some((fact) => fact.factId === factId);
}

function evidenceClassForBeat(
  beat: StorySpec["arc"][number],
  reviewed: boolean,
  factsById: ReadonlyMap<string, StorySpec["facts"][number]>,
): StoryEvidenceClass {
  if (beat.role === "bridge") return "reader_bridge";
  if (!reviewed) return "review_pending";
  const hasInterpretation = beat.sentenceEvidence.some(
    (mapping) => mapping.interpretationIds.length > 0,
  );
  const hasQualifiedEvidence = [
    ...beat.requiredFactIds,
    ...beat.optionalFactIds,
  ].some((factId) => factsById.get(factId)?.confidence !== "documented");
  if (hasQualifiedEvidence) {
    return hasInterpretation
      ? "qualified_evidence_with_interpretation"
      : "qualified_historical_evidence";
  }
  return hasInterpretation
    ? "documented_with_interpretation"
    : "documented_scene";
}

function validateSourceRefs(
  value: unknown,
  sourceIds: ReadonlySet<string>,
  reviewed: boolean,
): value is SourceRef[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) return false;
  const seen = new Set<string>();
  for (const ref of value) {
    if (!isRecord(ref)) return false;
    const allowedKeys = ref.locator === undefined
      ? ["scope", "sourceId"]
      : ["locator", "scope", "sourceId"];
    if (
      !hasExactKeys(ref, allowedKeys) ||
      !isSafeId(ref.sourceId) ||
      !sourceIds.has(ref.sourceId) ||
      !SOURCE_SCOPES.includes(ref.scope as (typeof SOURCE_SCOPES)[number]) ||
      (ref.locator !== undefined && !isBoundedText(ref.locator, 1, 500)) ||
      (reviewed && (ref.scope === "broad" || !isBoundedText(ref.locator, 1, 500)))
    ) return false;
    const key = `${ref.sourceId}:${ref.scope}:${ref.locator ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

function isUniqueIdArray(
  value: unknown,
  allowed: ReadonlySet<string>,
): value is string[] {
  return Array.isArray(value) &&
    value.every((id) => typeof id === "string" && allowed.has(id)) &&
    new Set(value).size === value.length;
}

function isSafeSourceUrl(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length > 2_000 ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isSafeId(value: unknown): value is string {
  return typeof value === "string" && SAFE_ID.test(value);
}

function isBoundedText(
  value: unknown,
  min: number,
  max: number,
): value is string {
  return typeof value === "string" && value.trim().length >= min && value.length <= max;
}

function hasExactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  return Object.keys(value).sort().join(",") === [...expected].sort().join(",");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isReviewDate(value: unknown): value is string {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?Z)?$/.test(value) &&
    !Number.isNaN(Date.parse(value));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function sameSet(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
