import "server-only";
import type { FigureStageRow } from "./types";
import {
  STORY_SPEC_SCHEMA_VERSION,
  CONTENT_FLAGS,
  type AllowedEntity,
  type ContentFlag,
  type FactAtom,
  type QuoteRecord,
  type SourceRecord,
  type StoryBeatSpec,
  type StorySpec,
  type StorySpecValidation,
} from "./story-spec-types";
import { containsDisclosureEcho } from "./story-privacy";

const EXPECTED_ROLES = [
  "scene",
  "dark_moment",
  "response",
  "struggle",
  "turning_point",
  "became",
  "bridge",
] as const;

// Converts the existing curated stage into a structurally complete REVIEW DRAFT.
// It never self-publishes: source-to-claim mapping, quotes, content flags, and
// reviewers require human confirmation before the publish validator can pass.
export function buildDraftStorySpec(stage: FigureStageRow): StorySpec {
  const sources = buildSources(stage);
  const facts = buildFactAtoms(stage, sources);
  const sourceRefs = sources.map((source) => ({
    sourceId: source.sourceId,
    scope: "broad" as const,
  }));
  const flags = inferDraftContentFlags(stage);

  return {
    storySpecId: `${stage.figureKey}:${stage.stageId}:v1`,
    schemaVersion: STORY_SPEC_SCHEMA_VERSION,
    figureKey: stage.figureKey,
    stageId: stage.stageId,
    version: 1,
    status: "draft",
    episode: {
      ageMin: stage.ageMin,
      ageMax: stage.ageMax,
      throughLine: stage.shapeSentences[0] ?? "",
    },
    contentProfile: {
      intensity: "moderate",
      flags,
      contentNote: flags.length > 0 ? draftContentNote(flags) : "",
    },
    facts,
    entities: buildDraftEntities(stage),
    quotes: buildDraftQuotes(stage.biographicalFacts, sourceRefs),
    arc: stage.beats.map(
      (beat): StoryBeatSpec => ({
        role: beat.role,
        canonicalText: beat.text,
        // Empty on purpose. Editorial review links the beat to the smallest
        // supporting fact set; publish validation rejects this draft state.
        requiredFactIds: [],
        optionalFactIds: [],
        entityIds: ["entity-subject"],
        quoteIds: [],
        sentenceEvidence: [],
        personalizationZones:
          beat.role === "bridge"
            ? ["reader_bridge"]
            : beat.role === "scene" || beat.role === "became"
              ? ["none"]
              : ["emphasis", "transition"],
        sourceNote: beat.sourceNotes,
      }),
    ),
    interpretations: stage.beats
      .filter((beat) => Boolean(beat.sourceNotes))
      .map((beat, index) => ({
        interpretationId: `interpretation-${pad(index + 1)}`,
        statement: beat.sourceNotes ?? "",
        supportingFactIds: [],
        allowed: false,
      })),
    dramatizationLimits: [
      "No invented interior monologue or private thoughts.",
      "No invented dialogue, gestures, weather, room detail, or sensory texture.",
      "No unsupported causal link between hardship, choice, and later outcome.",
    ],
    avoidRules: [
      "Do not invent people, places, dates, dialogue, gestures, weather, or causality.",
      "Do not quote or paraphrase the reader's disclosure.",
      "Do not promise that the reader will succeed or that suffering creates greatness.",
    ],
    sources,
    review: {},
  };
}

export function validateStorySpec(
  spec: StorySpec,
  options: { forPublish: boolean },
): StorySpecValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sourceIds = new Set(spec.sources.map((source) => source.sourceId));
  const factIds = new Set(spec.facts.map((fact) => fact.factId));
  const entityIds = new Set(spec.entities.map((entity) => entity.entityId));
  const quoteIds = new Set(spec.quotes.map((quote) => quote.quoteId));
  const interpretationIds = new Set(
    spec.interpretations.map((interpretation) => interpretation.interpretationId),
  );

  if (spec.schemaVersion !== STORY_SPEC_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${STORY_SPEC_SCHEMA_VERSION}`);
  }
  if (!spec.storySpecId || !spec.figureKey || !spec.stageId) {
    errors.push("storySpecId, figureKey, and stageId are required");
  }
  if (!Number.isInteger(spec.version) || spec.version < 1) {
    errors.push("version must be a positive integer");
  }
  if (spec.episode.ageMin > spec.episode.ageMax || !spec.episode.throughLine.trim()) {
    errors.push("episode age range and throughLine are invalid");
  }
  if (sourceIds.size !== spec.sources.length) errors.push("source IDs must be unique");
  if (factIds.size !== spec.facts.length) errors.push("fact IDs must be unique");
  if (entityIds.size !== spec.entities.length) errors.push("entity IDs must be unique");
  if (quoteIds.size !== spec.quotes.length) errors.push("quote IDs must be unique");
  if (spec.sources.length === 0 || spec.facts.length === 0) {
    errors.push("at least one source and fact are required");
  }
  if (
    !["gentle", "moderate", "direct"].includes(spec.contentProfile.intensity) ||
    !Array.isArray(spec.contentProfile.flags) ||
    spec.contentProfile.flags.some(
      (flag) => !CONTENT_FLAGS.includes(flag as (typeof CONTENT_FLAGS)[number]),
    ) ||
    new Set(spec.contentProfile.flags).size !== spec.contentProfile.flags.length ||
    typeof spec.contentProfile.contentNote !== "string"
  ) {
    errors.push("content profile intensity, flags, or note are invalid");
  }
  if (spec.dramatizationLimits.length === 0 || spec.avoidRules.length === 0) {
    errors.push("dramatizationLimits and avoidRules must be explicit");
  }

  spec.sources.forEach((source) => {
    if (!source.citation.trim()) errors.push(`${source.sourceId} citation is empty`);
  });

  for (const [index, fact] of spec.facts.entries()) {
    if (!fact.statement.trim() || fact.sourceRefs.length === 0) {
      errors.push(`${fact.factId} requires a statement and source reference`);
    }
    for (const ref of fact.sourceRefs) {
      if (!sourceIds.has(ref.sourceId)) {
        errors.push(`${fact.factId} references unknown source ${ref.sourceId}`);
      }
      if (options.forPublish && ref.scope === "broad") {
        errors.push(`${fact.factId} needs an exact or bounded source locator`);
      }
      if (options.forPublish && ref.scope !== "broad" && !ref.locator?.trim()) {
        errors.push(`${fact.factId} source reference needs a locator`);
      }
    }
    if (fact.eventOrder < 1 || !Number.isInteger(fact.eventOrder)) {
      errors.push(`${fact.factId} eventOrder must be a positive integer`);
    }
    if (index > 0 && fact.eventOrder < spec.facts[index - 1].eventOrder) {
      errors.push(`${fact.factId} creates an impossible event-order regression`);
    }
    if (
      fact.subjectAgeMin !== undefined &&
      fact.subjectAgeMax !== undefined &&
      fact.subjectAgeMin > fact.subjectAgeMax
    ) {
      errors.push(`${fact.factId} has an impossible subject-age range`);
    }
    if (fact.dateStart && fact.dateEnd && fact.dateStart > fact.dateEnd) {
      errors.push(`${fact.factId} has an impossible date range`);
    }
  }

  if (spec.arc.length !== EXPECTED_ROLES.length) {
    errors.push(`arc must contain ${EXPECTED_ROLES.length} beats`);
  }
  spec.arc.forEach((beat, index) => {
    if (beat.role !== EXPECTED_ROLES[index]) {
      errors.push(`arc[${index}] role=${beat.role}, expected ${EXPECTED_ROLES[index]}`);
    }
    if (!beat.canonicalText.trim()) errors.push(`arc[${index}] canonicalText is empty`);
    if (/\{feeling\}|You wrote:/i.test(beat.canonicalText)) {
      errors.push(`arc[${index}] contains a forbidden disclosure echo surface`);
    }
    for (const factId of [...beat.requiredFactIds, ...beat.optionalFactIds]) {
      if (!factIds.has(factId)) errors.push(`arc[${index}] references unknown fact ${factId}`);
    }
    for (const entityId of beat.entityIds) {
      if (!entityIds.has(entityId)) {
        errors.push(`arc[${index}] references unknown entity ${entityId}`);
      }
    }
    for (const quoteId of beat.quoteIds) {
      if (!quoteIds.has(quoteId)) errors.push(`arc[${index}] references unknown quote ${quoteId}`);
    }
    const sentenceCount = splitFactSentences(beat.canonicalText).length;
    const mappedSentenceIndexes = new Set<number>();
    for (const mapping of beat.sentenceEvidence) {
      if (
        !Number.isInteger(mapping.sentenceIndex) ||
        mapping.sentenceIndex < 0 ||
        mapping.sentenceIndex >= sentenceCount
      ) {
        errors.push(`arc[${index}] has an invalid sentence evidence index`);
      }
      if (mappedSentenceIndexes.has(mapping.sentenceIndex)) {
        errors.push(`arc[${index}] maps one sentence more than once`);
      }
      mappedSentenceIndexes.add(mapping.sentenceIndex);
      if (mapping.factIds.length === 0 && mapping.interpretationIds.length === 0) {
        errors.push(`arc[${index}] sentence evidence cannot be empty`);
      }
      for (const factId of mapping.factIds) {
        if (!factIds.has(factId)) {
          errors.push(`arc[${index}] sentence references unknown fact ${factId}`);
        }
      }
      for (const interpretationId of mapping.interpretationIds) {
        if (!interpretationIds.has(interpretationId)) {
          errors.push(
            `arc[${index}] sentence references unknown interpretation ${interpretationId}`,
          );
        }
      }
    }
    if (options.forPublish) {
      for (const directQuote of extractDirectQuotes(beat.canonicalText)) {
        const approved = spec.quotes.find(
          (quote) => quote.status === "verbatim" && quote.text === directQuote,
        );
        if (!approved) errors.push(`arc[${index}] contains unsupported direct quote`);
        else if (!beat.quoteIds.includes(approved.quoteId)) {
          errors.push(`arc[${index}] direct quote is not linked to its quote ID`);
        }
      }
      if (beat.role !== "bridge" && mappedSentenceIndexes.size !== sentenceCount) {
        errors.push(`arc[${index}] requires sentence-level evidence before publish`);
      }
    }
    if (options.forPublish && beat.role !== "bridge" && beat.requiredFactIds.length === 0) {
      errors.push(`arc[${index}] requires at least one supporting fact before publish`);
    }
  });

  for (const quote of spec.quotes) {
    if (!quote.text.trim() || quote.sourceRefs.length === 0) {
      errors.push(`${quote.quoteId} requires text and source references`);
    }
    for (const ref of quote.sourceRefs) {
      if (!sourceIds.has(ref.sourceId)) {
        errors.push(`${quote.quoteId} references unknown source ${ref.sourceId}`);
      }
      if (options.forPublish && ref.scope === "broad") {
        errors.push(`${quote.quoteId} needs an exact or bounded source locator`);
      }
      if (options.forPublish && ref.scope !== "broad" && !ref.locator?.trim()) {
        errors.push(`${quote.quoteId} source reference needs a locator`);
      }
    }
    if (options.forPublish && quote.status === "unverified") {
      errors.push(`${quote.quoteId} must be verified, paraphrased, disputed, or removed`);
    }
    if (
      quote.status === "forbidden" &&
      spec.arc.some((beat) => beat.canonicalText.includes(quote.text))
    ) {
      errors.push(`${quote.quoteId} is forbidden but appears in canonical copy`);
    }
    if (
      options.forPublish &&
      quote.status === "forbidden" &&
      spec.arc.some((beat) => beat.quoteIds.includes(quote.quoteId))
    ) {
      errors.push(`${quote.quoteId} is forbidden but linked from canonical copy`);
    }
  }

  for (const interpretation of spec.interpretations) {
    for (const factId of interpretation.supportingFactIds) {
      if (!factIds.has(factId)) {
        errors.push(`${interpretation.interpretationId} references unknown fact ${factId}`);
      }
    }
    if (options.forPublish && interpretation.allowed && interpretation.supportingFactIds.length === 0) {
      errors.push(`${interpretation.interpretationId} needs supporting facts`);
    }
  }

  if (options.forPublish) {
    if (spec.status !== "published") errors.push("publish validation requires status=published");
    if (
      !spec.review.researcherId ||
      !spec.review.historicalReviewerId ||
      !spec.review.toneReviewerId ||
      !spec.review.reviewedAt
    ) {
      errors.push("research, historical, tone, and review-date approvals are required");
    }
    if (!spec.review.contentProfileReviewed) {
      errors.push("content profile must be reviewed before publish");
    }
    if (
      typeof spec.contentProfile.contentNote !== "string" ||
      !spec.contentProfile.contentNote.trim()
    ) {
      errors.push("a reviewed, spoiler-light content note is required before publish");
    }
    if (
      spec.review.reviewedAt &&
      !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?Z)?$/.test(
        spec.review.reviewedAt,
      )
    ) {
      errors.push("reviewedAt must be an ISO date or UTC timestamp");
    }
  } else {
    if (spec.quotes.some((quote) => quote.status === "unverified")) {
      warnings.push("draft contains unverified quotes");
    }
    if (spec.arc.some((beat) => beat.role !== "bridge" && beat.requiredFactIds.length === 0)) {
      warnings.push("draft beats still need fact linkage");
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function buildSources(stage: FigureStageRow): SourceRecord[] {
  return stage.sources.map((citation, index) => ({
    sourceId: `source-${pad(index + 1)}`,
    citation,
  }));
}

function buildFactAtoms(stage: FigureStageRow, sources: SourceRecord[]): FactAtom[] {
  // Fresh ref objects per fact — editors narrow scope/locator claim by claim,
  // so facts must not share one mutable sourceRefs array.
  return splitFactSentences(stage.biographicalFacts).map((statement, index) => ({
    factId: `fact-${pad(index + 1)}`,
    statement,
    sourceRefs: sources.map((source) => ({
      sourceId: source.sourceId,
      scope: "broad" as const,
    })),
    eventOrder: index + 1,
    confidence: "documented",
    claimKind: "event",
  }));
}

function splitFactSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'\u201c\u2018])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function buildDraftEntities(stage: FigureStageRow): AllowedEntity[] {
  const entities: AllowedEntity[] = [
    {
      entityId: "entity-subject",
      kind: "person",
      value: stage.displayName,
      aliases: [stage.displayName.split(" ").at(-1) ?? stage.displayName],
    },
  ];
  if (stage.birthYear) {
    entities.push({
      entityId: "entity-birth-year",
      kind: "date",
      value: String(stage.birthYear),
      aliases: [],
    });
  }
  if (stage.deathYear) {
    entities.push({
      entityId: "entity-death-year",
      kind: "date",
      value: String(stage.deathYear),
      aliases: [],
    });
  }
  return entities;
}

function buildDraftQuotes(
  biography: string,
  sourceRefs: Array<{
    sourceId: string;
    scope: "exact" | "bounded" | "broad";
  }>,
): QuoteRecord[] {
  const matches = [
    ...biography.matchAll(/(?:\u201c([^\u201d]{4,})\u201d|"([^"\r\n]{4,})")/g),
  ];
  return matches.map((match, index) => ({
    quoteId: `quote-${pad(index + 1)}`,
    text: (match[1] ?? match[2]).trim(),
    status: "unverified",
    // Same rule as facts: each quote owns its refs so verifying one quote's
    // source cannot silently retag another's.
    sourceRefs: sourceRefs.map((ref) => ({ ...ref })),
  }));
}

function inferDraftContentFlags(stage: FigureStageRow): ContentFlag[] {
  const haystack = `${stage.themes.join(" ")} ${stage.biographicalFacts}`.toLowerCase();
  const flags = new Set<ContentFlag>();
  if (/grief|died|death|widow|orphan/.test(haystack)) flags.add("death_or_grief");
  if (/suicide|killed himself|killed herself/.test(haystack)) flags.add("suicide_loss");
  if (/slavery|abuse|violence|assault|torture/.test(haystack)) flags.add("abuse_or_violence");
  if (/addiction|alcoholic|opium|heroin|drinking/.test(haystack)) flags.add("addiction");
  if (/illness|cancer|lupus|disease|paraly|blind|fever/.test(haystack)) {
    flags.add("serious_illness");
  }
  if (/racism|segregat|slavery|because she was a woman|because he was black/.test(haystack)) {
    flags.add("discrimination");
  }
  if (/pregnan|gave birth|newborn|motherhood|fatherhood/.test(haystack)) {
    flags.add("pregnancy_or_parenthood");
  }
  return [...flags];
}

function draftContentNote(flags: ContentFlag[]): string {
  return `Draft content review required: ${flags.join(", ")}.`;
}

function pad(value: number): string {
  return String(value).padStart(3, "0");
}

function extractDirectQuotes(text: string): string[] {
  return [
    ...text.matchAll(/(?:\u201c([^\u201d]+)\u201d|"([^"\r\n]+)")/g),
  ].map((match) => (match[1] ?? match[2]).trim());
}

// Keeps the privacy utility in the StorySpec module graph so later artifact
// validation cannot accidentally omit the disclosure check.
export function storySpecContainsDisclosure(
  spec: StorySpec,
  disclosure: string,
): boolean {
  return spec.arc.some((beat) => containsDisclosureEcho(beat.canonicalText, disclosure));
}
