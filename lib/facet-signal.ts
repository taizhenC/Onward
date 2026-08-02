import "server-only";
import { FACET_TYPES, type FacetType } from "./types";

export const FACET_SIGNAL_SCHEMA_VERSION = "facet-signal-v1-2026-07";
export const FACET_PROJECTION_SCHEMA_VERSION =
  "facet-query-template-catalog-v1-2026-07";

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

declare const VALIDATED_FACET_SIGNAL: unique symbol;
const VALIDATED_FACET_SIGNALS = new WeakSet<object>();

export type ValidatedFacetSignal = Readonly<{
  confidence: number;
  /**
   * Informational classification metadata only. Retrieval authority comes from
   * the validated per-lane importance, anchors, and closed-template queries.
   */
  dominantMode: FacetType | "unclear";
  facetImportance: Readonly<Record<FacetType, number>>;
  anchors: Readonly<Record<FacetType, readonly string[]>>;
  facetQueries: Readonly<Record<FacetType, FacetQuery | null>>;
  readonly [VALIDATED_FACET_SIGNAL]: true;
}>;

export type FacetProjectionTemplate = Readonly<{
  templateId: string;
  text: string;
}>;

export type FacetProjectionTemplateIdCatalog = Readonly<
  Record<FacetType, readonly string[]>
>;

/**
 * The tagger selects from these exact server-owned sentences; it does not
 * author retrieval prose. This makes "no invented event/name/diagnosis" a
 * closed vocabulary guarantee instead of an incomplete natural-language
 * blacklist. Adding or changing a sentence requires a projection schema bump
 * and projection-only shadow evaluation.
 */
export const FACET_PROJECTION_TEMPLATE_CATALOG: Readonly<
  Record<FacetType, readonly FacetProjectionTemplate[]>
> = deepFreeze({
  emotional_core: [
    {
      templateId: "pressure_overwhelming",
      text: "Someone felt overwhelmed by pressure they could not resolve.",
    },
    {
      templateId: "effort_unrecognized",
      text: "Someone felt rejected after effort failed to bring recognition.",
    },
    {
      templateId: "belonging_isolated",
      text: "Someone felt isolated from belonging and recognition.",
    },
    {
      templateId: "setback_shame",
      text: "Someone carried shame after a painful setback.",
    },
    {
      templateId: "next_step_uncertain",
      text: "Someone felt uncertain about what came next.",
    },
    {
      templateId: "effort_exhausted",
      text: "Someone felt exhausted after effort lasted too long.",
    },
    {
      templateId: "identity_between",
      text: "Someone felt caught between an old identity and an unclear future.",
    },
    {
      templateId: "important_loss",
      text: "Someone carried grief after an important loss.",
    },
    {
      templateId: "effort_unseen",
      text: "Someone felt unseen despite sustained effort.",
    },
    {
      templateId: "failure_doubt",
      text: "Someone feared another failure would confirm their doubt.",
    },
  ],
  decision_shape: [
    {
      templateId: "continue_or_stop",
      text: "They faced whether to continue or step away.",
    },
    {
      templateId: "remain_or_restart",
      text: "They faced whether to remain or begin again.",
    },
    {
      templateId: "safety_or_uncertainty",
      text: "They faced a choice between safety and a less certain path.",
    },
    {
      templateId: "retry_or_withdraw",
      text: "They faced whether another attempt was worth the risk.",
    },
    {
      templateId: "all_choices_costly",
      text: "They faced how to act when every available choice felt costly.",
    },
    {
      templateId: "others_or_self_direction",
      text: "They faced whether to follow others' expectations or their own direction.",
    },
    {
      templateId: "persist_or_release",
      text: "They faced whether persistence still served what mattered.",
    },
    {
      templateId: "no_safe_answer",
      text: "They faced a choice without a clearly safe answer.",
    },
  ],
  trigger_event: [
    {
      templateId: "setback_changed_possibility",
      text: "A setback changed what seemed possible next.",
    },
    {
      templateId: "effort_rejected",
      text: "An effort ended in rejection after hope had gathered around it.",
    },
    {
      templateId: "stability_lost",
      text: "A familiar source of stability was lost.",
    },
    {
      templateId: "path_closed",
      text: "An expected path stopped feeling available.",
    },
    {
      templateId: "public_setback",
      text: "Something public went wrong while others seemed to move forward.",
    },
    {
      templateId: "effort_without_result",
      text: "A long effort failed to produce the hoped-for result.",
    },
    {
      templateId: "connection_changed",
      text: "An important connection stopped offering the same belonging.",
    },
    {
      templateId: "direction_disrupted",
      text: "A sudden change disrupted the direction they had trusted.",
    },
  ],
  agency_state: [
    {
      templateId: "unable_to_move",
      text: "They felt unable to move even while wanting change.",
    },
    {
      templateId: "trying_with_doubt",
      text: "They kept trying while doubt weakened their sense of control.",
    },
    {
      templateId: "pressure_trapped",
      text: "They felt trapped between pressure and an uncertain next step.",
    },
    {
      templateId: "control_slipping",
      text: "They remained present while their sense of control was slipping.",
    },
    {
      templateId: "attempt_might_not_matter",
      text: "They felt unable to trust that another attempt would matter.",
    },
    {
      templateId: "moves_felt_unsafe",
      text: "They held back because each available move felt unsafe.",
    },
    {
      templateId: "effort_might_not_help",
      text: "They kept going without feeling sure that effort could help.",
    },
    {
      templateId: "unable_to_choose",
      text: "They wanted change while feeling unable to choose a direction.",
    },
  ],
});

/**
 * The only projection-catalog surface permitted in an LLM request. Keeping
 * this derived catalog separate makes it difficult for provider code to leak
 * or delegate authorship of the server-owned retrieval sentences above.
 */
export const FACET_PROJECTION_TEMPLATE_ID_CATALOG: FacetProjectionTemplateIdCatalog =
  deepFreeze(buildFacetProjectionTemplateIdCatalog());

const TOP_LEVEL_KEYS =
  "anchors,confidence,dominantMode,facetImportance,facetQueries";
const QUERY_KEYS = "anchors,templateId";
const FACET_KEYS = [...FACET_TYPES].sort().join(",");
const ANCHOR_STOPWORDS = new Set([
  "a",
  "again",
  "am",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "being",
  "but",
  "by",
  "can",
  "could",
  "completely",
  "did",
  "do",
  "does",
  "everything",
  "even",
  "ever",
  "feel",
  "feels",
  "felt",
  "for",
  "from",
  "had",
  "has",
  "have",
  "he",
  "her",
  "hers",
  "him",
  "his",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "just",
  "may",
  "me",
  "might",
  "mine",
  "much",
  "must",
  "my",
  "myself",
  "never",
  "not",
  "now",
  "of",
  "on",
  "or",
  "our",
  "ours",
  "ourselves",
  "she",
  "shall",
  "should",
  "so",
  "someone",
  "somebody",
  "something",
  "still",
  "than",
  "that",
  "the",
  "their",
  "theirs",
  "them",
  "then",
  "they",
  "this",
  "thing",
  "things",
  "to",
  "totally",
  "too",
  "us",
  "very",
  "was",
  "we",
  "were",
  "will",
  "with",
  "without",
  "would",
  "really",
  "you",
  "your",
  "yours",
  "yourself",
  "yourselves",
]);

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
): ValidatedFacetSignal | null {
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
      facetType,
      rawFeeling,
      anchors[facetType],
    );
  }

  const reconstructed = {
    confidence,
    dominantMode: parsed.dominantMode as FacetType | "unclear",
    facetImportance,
    anchors,
    facetQueries,
  };
  const frozen = deepFreeze(reconstructed);
  VALIDATED_FACET_SIGNALS.add(frozen);
  return frozen as unknown as ValidatedFacetSignal;
}

/**
 * Keeps fallback behavior explicit and byte-preserving. Shape never calls this
 * helper: its query remains the raw feeling by architectural contract.
 */
export function resolveFacetQueryText(
  rawFeeling: string,
  signal: ValidatedFacetSignal | null,
  facetType: FacetType,
): string {
  if (!signal || !VALIDATED_FACET_SIGNALS.has(signal)) return rawFeeling;
  return signal.facetQueries[facetType]?.text ?? rawFeeling;
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
  facetType: FacetType,
  rawFeeling: string,
  signalAnchors: readonly string[],
): FacetQuery | null {
  if (value === null) return null;
  if (
    !isExactRecord(value, QUERY_KEYS) ||
    typeof value.templateId !== "string"
  ) {
    return null;
  }
  const template = FACET_PROJECTION_TEMPLATE_CATALOG[facetType].find(
    (candidate) => candidate.templateId === value.templateId,
  );
  if (!template) return null;
  const anchors = parseAnchorList(value.anchors, rawFeeling);
  if (
    !anchors ||
    anchors.length === 0 ||
    anchors.some((anchor) => !signalAnchors.includes(anchor))
  ) {
    return null;
  }
  return { text: template.text, anchors };
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
      anchors.includes(anchor) ||
      !hasMeaningfulAnchorContent(anchor)
    ) {
      return null;
    }
    anchors.push(anchor);
  }
  return anchors;
}

function hasMeaningfulAnchorContent(anchor: string): boolean {
  const tokens = anchor.toLocaleLowerCase("en").match(/[\p{L}\p{N}]+/gu) ?? [];
  const alphanumericLength = Array.from(tokens.join("")).length;
  return (
    alphanumericLength >= 3 &&
    tokens.some(
      (token) =>
        Array.from(token).length >= 3 &&
        /\p{L}/u.test(token) &&
        !ANCHOR_STOPWORDS.has(token),
    )
  );
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

function buildFacetProjectionTemplateIdCatalog(): Record<
  FacetType,
  readonly string[]
> {
  const result = {} as Record<FacetType, readonly string[]>;
  for (const facetType of FACET_TYPES) {
    result[facetType] = FACET_PROJECTION_TEMPLATE_CATALOG[facetType].map(
      ({ templateId }) => templateId,
    );
  }
  return result;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
