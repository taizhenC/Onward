import "server-only";
import { FACET_TYPES, type FacetType } from "./types";

export const FACET_SIGNAL_SCHEMA_VERSION = "facet-signal-v1-2026-07";
export const FACET_PROJECTION_SCHEMA_VERSION =
  "facet-query-projection-v1-2026-07";

export const FACET_SIGNAL_MIN_CONFIDENCE = 0.55;
export const FACET_SIGNAL_IMPORTANT_LANE_THRESHOLD = 0.3;
export const FACET_SIGNAL_MIN_IMPORTANT_LANES = 2;
export const FACET_SIGNAL_MAX_OUTPUT_BYTES = 16_384;
export const FACET_SIGNAL_MAX_ANCHORS_PER_LANE = 4;
export const FACET_SIGNAL_MAX_ANCHOR_CHARACTERS = 160;
export const FACET_PROJECTION_MAX_WORDS = 32;

export type FacetQuery = Readonly<{
  text: string;
  anchors: readonly string[];
}>;

export type FacetSignal = Readonly<{
  confidence: number;
  dominantMode: FacetType | "unclear";
  facetImportance: Readonly<Record<FacetType, number>>;
  anchors: Readonly<Record<FacetType, readonly string[]>>;
  facetQueries: Readonly<Record<FacetType, FacetQuery | null>>;
}>;

const TOP_LEVEL_KEYS =
  "anchors,confidence,dominantMode,facetImportance,facetQueries";
const QUERY_KEYS = "anchors,text";
const FACET_KEYS = [...FACET_TYPES].sort().join(",");

// These checks are intentionally conservative. A rejected signal is equivalent
// to today's raw-query/static-weight behavior; accepting invented detail would
// silently bias retrieval. Changes to these lists require a projection schema
// version bump and shadow-eval evidence.
const NEUTRAL_SUBJECT_PATTERN =
  /^(?:Someone|They|A person|The person|An individual|He|She)\b/u;
const PAST_TENSE_PATTERN =
  /\b(?:was|were|had|felt|found|faced|became|began|could|struggled|seemed|lost|left|kept|held|made|went|saw|knew|wanted|needed|tried|chose|turned|stood|stayed|carried|[a-z]+ed)\b/iu;
const PRESENT_OR_FUTURE_PATTERN =
  /\b(?:am|is|are|has|have|does|do|can|will|shall|going to|feels|wants|needs|faces|seems|struggles|tries|chooses)\b/iu;
const FIRST_PERSON_PATTERN =
  /\b(?:I|me|my|mine|myself|we|us|our|ours|ourselves)\b/iu;
const DIAGNOSIS_PATTERN =
  /\b(?:adhd|anxiety|anxious|bipolar|depress(?:ed|ion|ive)?|diagnos(?:ed|is)|disorder|ocd|panic attack|ptsd|suicid(?:al|e)|trauma(?:tic)?|triggered)\b/iu;
const URL_EMAIL_OR_HANDLE_PATTERN =
  /(?:https?:\/\/|www\.|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|(?:^|\s)@[a-z0-9_]{2,})/iu;
const QUOTATION_MARK_PATTERN = /["“”«»‹›]/u;
const TITLE_CASE_TOKEN_PATTERN = /\b\p{Lu}[\p{Ll}\p{M}'’-]{2,}\b/u;
const CONCRETE_EVENT_PATTERN =
  /\b(?:draft notice|funeral|hospital|prison|war|battle|divorc(?:e|ed)|marri(?:age|ed)|father|mother|husband|wife|son|daughter|brother|sister|died|death|fired|laid off|graduat(?:ed|ion)|college|university)\b/giu;

/**
 * Parses untrusted tagger output into the only signal shape retrieval may use.
 *
 * Signal-level violations return null. Projection-level violations degrade only
 * that lane to null. The function never repairs output, retries, or logs values:
 * the raw feeling, anchors, and projections are sensitive derived data.
 */
export function parseFacetSignalJson(
  rawOutput: string,
  rawFeeling: string,
): FacetSignal | null {
  if (
    typeof rawOutput !== "string" ||
    Buffer.byteLength(rawOutput, "utf8") > FACET_SIGNAL_MAX_OUTPUT_BYTES
  ) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawOutput);
  } catch {
    return null;
  }
  if (!isExactRecord(parsed, TOP_LEVEL_KEYS)) return null;

  const confidence = parsed.confidence;
  if (
    !isUnitNumber(confidence) ||
    confidence < FACET_SIGNAL_MIN_CONFIDENCE
  ) {
    return null;
  }
  if (
    parsed.dominantMode !== "unclear" &&
    !FACET_TYPES.includes(parsed.dominantMode as FacetType)
  ) {
    return null;
  }

  const facetImportance = parseFacetImportance(parsed.facetImportance);
  const anchors = parseFacetAnchors(parsed.anchors, rawFeeling);
  if (!facetImportance || !anchors) return null;

  const importantFacets = FACET_TYPES.filter(
    (facetType) =>
      facetImportance[facetType] >= FACET_SIGNAL_IMPORTANT_LANE_THRESHOLD,
  );
  if (
    importantFacets.length < FACET_SIGNAL_MIN_IMPORTANT_LANES ||
    importantFacets.some((facetType) => anchors[facetType].length === 0)
  ) {
    return null;
  }

  if (!isExactFacetRecord(parsed.facetQueries)) return null;
  const facetQueries = {} as Record<FacetType, FacetQuery | null>;
  for (const facetType of FACET_TYPES) {
    facetQueries[facetType] = parseFacetQuery(
      parsed.facetQueries[facetType],
      rawFeeling,
      anchors[facetType],
    );
  }

  return deepFreeze({
    confidence,
    dominantMode: parsed.dominantMode as FacetType | "unclear",
    facetImportance,
    anchors,
    facetQueries,
  });
}

/**
 * Keeps fallback behavior explicit and byte-preserving. Shape never calls this
 * helper: its query remains the raw feeling by architectural contract.
 */
export function resolveFacetQueryText(
  rawFeeling: string,
  signal: FacetSignal | null,
  facetType: FacetType,
): string {
  return signal?.facetQueries[facetType]?.text ?? rawFeeling;
}

function parseFacetImportance(
  value: unknown,
): Record<FacetType, number> | null {
  if (!isExactFacetRecord(value)) return null;
  const result = {} as Record<FacetType, number>;
  for (const facetType of FACET_TYPES) {
    const importance = value[facetType];
    if (!isUnitNumber(importance)) return null;
    result[facetType] = importance;
  }
  return result;
}

function parseFacetAnchors(
  value: unknown,
  rawFeeling: string,
): Record<FacetType, string[]> | null {
  if (!isExactFacetRecord(value)) return null;
  const result = {} as Record<FacetType, string[]>;
  for (const facetType of FACET_TYPES) {
    const anchors = parseAnchorList(value[facetType], rawFeeling);
    if (!anchors) return null;
    result[facetType] = anchors;
  }
  return result;
}

function parseFacetQuery(
  value: unknown,
  rawFeeling: string,
  signalAnchors: readonly string[],
): FacetQuery | null {
  if (value === null) return null;
  if (!isExactRecord(value, QUERY_KEYS) || !isValidProjectionText(value.text)) {
    return null;
  }
  const anchors = parseAnchorList(value.anchors, rawFeeling);
  if (
    !anchors ||
    anchors.length === 0 ||
    anchors.some((anchor) => !signalAnchors.includes(anchor))
  ) {
    return null;
  }
  if (containsUnsubstantiatedConcreteDetail(value.text, rawFeeling)) {
    return null;
  }
  return { text: value.text, anchors };
}

function parseAnchorList(value: unknown, rawFeeling: string): string[] | null {
  if (
    !Array.isArray(value) ||
    value.length > FACET_SIGNAL_MAX_ANCHORS_PER_LANE
  ) {
    return null;
  }
  const anchors: string[] = [];
  for (const anchor of value) {
    if (
      typeof anchor !== "string" ||
      anchor.length === 0 ||
      anchor.length > FACET_SIGNAL_MAX_ANCHOR_CHARACTERS ||
      anchor.trim() !== anchor ||
      !rawFeeling.includes(anchor) ||
      anchors.includes(anchor)
    ) {
      return null;
    }
    anchors.push(anchor);
  }
  return anchors;
}

function isValidProjectionText(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    /[\r\n]/u.test(value) ||
    !value.endsWith(".") ||
    (value.match(/[.!?]/gu) ?? []).length !== 1 ||
    !NEUTRAL_SUBJECT_PATTERN.test(value) ||
    !PAST_TENSE_PATTERN.test(value) ||
    PRESENT_OR_FUTURE_PATTERN.test(value) ||
    FIRST_PERSON_PATTERN.test(value) ||
    /\b\d{4}\b/u.test(value) ||
    URL_EMAIL_OR_HANDLE_PATTERN.test(value) ||
    QUOTATION_MARK_PATTERN.test(value) ||
    DIAGNOSIS_PATTERN.test(value)
  ) {
    return false;
  }
  const words =
    value.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) ?? [];
  if (words.length === 0 || words.length > FACET_PROJECTION_MAX_WORDS) {
    return false;
  }

  const neutralSubject = value.match(NEUTRAL_SUBJECT_PATTERN)?.[0];
  if (!neutralSubject) return false;
  const predicate = value.slice(neutralSubject.length);
  return !TITLE_CASE_TOKEN_PATTERN.test(predicate);
}

function containsUnsubstantiatedConcreteDetail(
  projection: string,
  rawFeeling: string,
): boolean {
  for (const match of projection.matchAll(CONCRETE_EVENT_PATTERN)) {
    const detail = match[0];
    if (detail && !rawFeeling.toLocaleLowerCase("en").includes(detail.toLocaleLowerCase("en"))) {
      return true;
    }
  }
  return false;
}

function isUnitNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

function isExactFacetRecord(
  value: unknown,
): value is Record<FacetType, unknown> {
  return isExactRecord(value, FACET_KEYS);
}

function isExactRecord(
  value: unknown,
  sortedKeys: string,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).sort().join(",") ===
      sortedKeys
  );
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
