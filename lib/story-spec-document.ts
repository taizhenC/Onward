import {
  CONTENT_FLAGS,
  type StorySpec,
} from "./story-spec-types";

const STORY_SPEC_STATUSES = [
  "draft",
  "review",
  "published",
  "retired",
] as const;
const FACT_CONFIDENCES = ["documented", "probable", "disputed"] as const;
const FACT_CLAIM_KINDS = ["event", "causal", "sensory", "context"] as const;
const ENTITY_KINDS = [
  "person",
  "place",
  "organization",
  "work",
  "date",
  "amount",
] as const;
const QUOTE_STATUSES = [
  "verbatim",
  "paraphrase",
  "disputed",
  "forbidden",
  "unverified",
] as const;
const SOURCE_SCOPES = ["exact", "bounded", "broad"] as const;
const BEAT_ROLES = [
  "scene",
  "dark_moment",
  "response",
  "struggle",
  "turning_point",
  "became",
  "bridge",
] as const;
const PERSONALIZATION_ZONES = [
  "none",
  "emphasis",
  "transition",
  "reader_bridge",
] as const;
const INTENSITIES = ["gentle", "moderate", "direct"] as const;

const TOP_LEVEL_KEYS = [
  "storySpecId",
  "schemaVersion",
  "figureKey",
  "stageId",
  "version",
  "status",
  "episode",
  "contentProfile",
  "facts",
  "entities",
  "quotes",
  "arc",
  "interpretations",
  "dramatizationLimits",
  "avoidRules",
  "sources",
  "review",
] as const;

export function parseStorySpecDocument(value: unknown): StorySpec | null {
  if (!isRecord(value) || !hasExactKeys(value, TOP_LEVEL_KEYS)) return null;
  if (
    !isString(value.storySpecId) ||
    !isString(value.schemaVersion) ||
    !isString(value.figureKey) ||
    !isString(value.stageId) ||
    !isFiniteNumber(value.version) ||
    !isMember(value.status, STORY_SPEC_STATUSES) ||
    !isEpisode(value.episode) ||
    !isContentProfile(value.contentProfile) ||
    !isFactArray(value.facts) ||
    !isEntityArray(value.entities) ||
    !isQuoteArray(value.quotes) ||
    !isBeatArray(value.arc) ||
    !isInterpretationArray(value.interpretations) ||
    !isStringArray(value.dramatizationLimits) ||
    !isStringArray(value.avoidRules) ||
    !isSourceArray(value.sources) ||
    !isReview(value.review)
  ) {
    return null;
  }
  return value as StorySpec;
}

function isEpisode(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasExactOptionalKeys(
      value,
      ["ageMin", "ageMax", "throughLine"],
      ["startDate", "endDate"],
    ) &&
    isFiniteNumber(value.ageMin) &&
    isFiniteNumber(value.ageMax) &&
    isString(value.throughLine) &&
    isOptionalProperty(value, "startDate", isString) &&
    isOptionalProperty(value, "endDate", isString)
  );
}

function isContentProfile(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, ["intensity", "flags", "contentNote"]) &&
    isMember(value.intensity, INTENSITIES) &&
    Array.isArray(value.flags) &&
    value.flags.every((flag) => isMember(flag, CONTENT_FLAGS)) &&
    isString(value.contentNote)
  );
}

function isFactArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (fact) =>
        isRecord(fact) &&
        hasExactOptionalKeys(
          fact,
          [
            "factId",
            "statement",
            "sourceRefs",
            "eventOrder",
            "confidence",
            "claimKind",
          ],
          [
            "subjectAgeMin",
            "subjectAgeMax",
            "dateStart",
            "dateEnd",
            "allowedParaphrases",
          ],
        ) &&
        isString(fact.factId) &&
        isString(fact.statement) &&
        isSourceRefArray(fact.sourceRefs) &&
        isFiniteNumber(fact.eventOrder) &&
        isMember(fact.confidence, FACT_CONFIDENCES) &&
        isMember(fact.claimKind, FACT_CLAIM_KINDS) &&
        isOptionalProperty(fact, "subjectAgeMin", isFiniteNumber) &&
        isOptionalProperty(fact, "subjectAgeMax", isFiniteNumber) &&
        isOptionalProperty(fact, "dateStart", isString) &&
        isOptionalProperty(fact, "dateEnd", isString) &&
        isOptionalProperty(fact, "allowedParaphrases", isStringArray),
    )
  );
}

function isEntityArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (entity) =>
        isRecord(entity) &&
        hasExactKeys(entity, ["entityId", "kind", "value", "aliases"]) &&
        isString(entity.entityId) &&
        isMember(entity.kind, ENTITY_KINDS) &&
        isString(entity.value) &&
        isStringArray(entity.aliases),
    )
  );
}

function isQuoteArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (quote) =>
        isRecord(quote) &&
        hasExactOptionalKeys(
          quote,
          ["quoteId", "text", "status", "sourceRefs"],
          ["speaker"],
        ) &&
        isString(quote.quoteId) &&
        isString(quote.text) &&
        isMember(quote.status, QUOTE_STATUSES) &&
        isOptionalProperty(quote, "speaker", isString) &&
        isSourceRefArray(quote.sourceRefs),
    )
  );
}

function isBeatArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (beat) =>
        isRecord(beat) &&
        hasExactOptionalKeys(
          beat,
          [
            "role",
            "canonicalText",
            "requiredFactIds",
            "optionalFactIds",
            "entityIds",
            "quoteIds",
            "sentenceEvidence",
            "personalizationZones",
          ],
          ["sourceNote"],
        ) &&
        isMember(beat.role, BEAT_ROLES) &&
        isString(beat.canonicalText) &&
        isStringArray(beat.requiredFactIds) &&
        isStringArray(beat.optionalFactIds) &&
        isStringArray(beat.entityIds) &&
        isStringArray(beat.quoteIds) &&
        isSentenceEvidenceArray(beat.sentenceEvidence) &&
        Array.isArray(beat.personalizationZones) &&
        beat.personalizationZones.every((zone) =>
          isMember(zone, PERSONALIZATION_ZONES),
        ) &&
        isOptionalProperty(beat, "sourceNote", isString),
    )
  );
}

function isSentenceEvidenceArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (mapping) =>
        isRecord(mapping) &&
        hasExactKeys(mapping, [
          "sentenceIndex",
          "factIds",
          "interpretationIds",
        ]) &&
        isFiniteNumber(mapping.sentenceIndex) &&
        isStringArray(mapping.factIds) &&
        isStringArray(mapping.interpretationIds),
    )
  );
}

function isInterpretationArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (interpretation) =>
        isRecord(interpretation) &&
        hasExactKeys(interpretation, [
          "interpretationId",
          "statement",
          "supportingFactIds",
          "allowed",
        ]) &&
        isString(interpretation.interpretationId) &&
        isString(interpretation.statement) &&
        isStringArray(interpretation.supportingFactIds) &&
        typeof interpretation.allowed === "boolean",
    )
  );
}

function isSourceArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (source) =>
        isRecord(source) &&
        hasExactOptionalKeys(
          source,
          ["sourceId", "citation"],
          ["locator", "url"],
        ) &&
        isString(source.sourceId) &&
        isString(source.citation) &&
        isOptionalProperty(source, "locator", isString) &&
        isOptionalProperty(source, "url", isString),
    )
  );
}

function isSourceRefArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (ref) =>
        isRecord(ref) &&
        hasExactOptionalKeys(ref, ["sourceId", "scope"], ["locator"]) &&
        isString(ref.sourceId) &&
        isMember(ref.scope, SOURCE_SCOPES) &&
        isOptionalProperty(ref, "locator", isString),
    )
  );
}

function isReview(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasExactOptionalKeys(
      value,
      [],
      [
        "researcherId",
        "historicalReviewerId",
        "toneReviewerId",
        "reviewedAt",
        "contentProfileReviewed",
      ],
    ) &&
    isOptionalProperty(value, "researcherId", isString) &&
    isOptionalProperty(value, "historicalReviewerId", isString) &&
    isOptionalProperty(value, "toneReviewerId", isString) &&
    isOptionalProperty(value, "reviewedAt", isString) &&
    isOptionalProperty(
      value,
      "contentProfileReviewed",
      (candidate): candidate is boolean => typeof candidate === "boolean",
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isOptionalProperty(
  value: Record<string, unknown>,
  key: string,
  predicate: (candidate: unknown) => boolean,
): boolean {
  return (
    !Object.prototype.hasOwnProperty.call(value, key) ||
    predicate(value[key])
  );
}

function isMember<T extends readonly string[]>(
  value: unknown,
  allowed: T,
): value is T[number] {
  return typeof value === "string" && allowed.includes(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return sameKeys(Object.keys(value), expected);
}

function hasExactOptionalKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return (
    required.every((key) => keys.includes(key)) &&
    keys.every((key) => required.includes(key) || optional.includes(key))
  );
}

function sameKeys(left: readonly string[], right: readonly string[]): boolean {
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return (
    leftSorted.length === rightSorted.length &&
    leftSorted.every((key, index) => key === rightSorted[index])
  );
}
