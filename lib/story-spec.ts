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
import {
  READER_PERMISSION_MAX_SENTENCES,
  isReaderBridgeSentence,
  readerPermissionRejection,
} from "./reader-bridge-copy";
import {
  containsWholeWord,
  extractDirectQuotes,
  splitCanonicalSentences,
} from "./story-sentences";
import {
  hasUniqueStorySourceRefs,
  isBoundedTransparencyText,
  isSafeTransparencyId,
  isSafeTransparencySourceUrl,
  isStoryReviewDate,
  STORY_CLAIM_KINDS,
  STORY_FACT_CONFIDENCES,
  STORY_QUOTE_STATUSES,
  STORY_SOURCE_SCOPES,
  STORY_TRANSPARENCY_LIMITS,
} from "./story-transparency-policy";
export { parseStorySpecDocument } from "./story-spec-document";

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
      "Scene detail, gestures, weather, and interior life may be written only as dramatized texture: each such sentence is grounded in a mapped fact and adds no person, place, date, amount, quotation, event, or causal link.",
      "No invented dialogue or quotation.",
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
  const quotesById = new Map(
    spec.quotes.map((quote) => [quote.quoteId, quote]),
  );
  const interpretationIds = new Set(
    spec.interpretations.map((interpretation) => interpretation.interpretationId),
  );
  const interpretationsById = new Map(
    spec.interpretations.map((interpretation) => [
      interpretation.interpretationId,
      interpretation,
    ]),
  );
  // Proper-noun surfaces of the allowlisted entities. Dramatized texture and
  // reader copy may never carry them, and beats before the bridge should not
  // name the subject (anonymity is the reveal's whole payload).
  const properNoun = (value: string) => /^[A-Z]/.test(value.trim());
  const personNames = spec.entities
    .filter((entity) => entity.kind === "person")
    .flatMap((entity) => [entity.value, ...entity.aliases])
    .filter(properNoun);
  const namedEntityValues = spec.entities
    .filter((entity) =>
      ["person", "place", "organization", "work"].includes(entity.kind),
    )
    .flatMap((entity) => [entity.value, ...entity.aliases])
    .filter(properNoun);
  let readerPermissionCount = 0;

  if (spec.schemaVersion !== STORY_SPEC_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${STORY_SPEC_SCHEMA_VERSION}`);
  }
  if (!spec.storySpecId || !spec.figureKey || !spec.stageId) {
    errors.push("storySpecId, figureKey, and stageId are required");
  }
  if (!isSafeTransparencyId(spec.storySpecId)) {
    errors.push("storySpecId must use the bounded public identifier format");
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
  if (interpretationIds.size !== spec.interpretations.length) {
    errors.push("interpretation IDs must be unique");
  }
  if (spec.sources.length === 0 || spec.facts.length === 0) {
    errors.push("at least one source and fact are required");
  }
  if (
    spec.sources.length > STORY_TRANSPARENCY_LIMITS.sources ||
    spec.facts.length > STORY_TRANSPARENCY_LIMITS.facts ||
    spec.quotes.length > STORY_TRANSPARENCY_LIMITS.quotes
  ) {
    errors.push("source, fact, or quote count exceeds the public projection limit");
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
    if (!isSafeTransparencyId(source.sourceId)) {
      errors.push("source IDs must use the bounded public identifier format");
    }
    if (
      !isBoundedTransparencyText(
        source.citation,
        1,
        STORY_TRANSPARENCY_LIMITS.citation,
      ) ||
      hasUnsafeControl(source.citation)
    ) {
      errors.push(`${source.sourceId} citation is empty or unsafe`);
    }
    if (source.locator !== undefined && !isSafeLocator(source.locator)) {
      errors.push(`${source.sourceId} locator is invalid`);
    }
    if (
      source.url !== undefined &&
      !isSafeTransparencySourceUrl(source.url)
    ) {
      errors.push(`${source.sourceId} URL must be a credential-free HTTPS URL`);
    }
  });

  for (const [index, fact] of spec.facts.entries()) {
    if (!isSafeTransparencyId(fact.factId)) {
      errors.push(`${fact.factId} must use the bounded public identifier format`);
    }
    if (
      !isBoundedTransparencyText(
        fact.statement,
        1,
        STORY_TRANSPARENCY_LIMITS.factStatement,
      ) ||
      fact.sourceRefs.length === 0
    ) {
      errors.push(
        `${fact.factId} statement must be non-empty and within the public limit, with a source reference`,
      );
    }
    if (
      fact.sourceRefs.length > STORY_TRANSPARENCY_LIMITS.sourceRefs ||
      !hasUniqueStorySourceRefs(fact.sourceRefs)
    ) {
      errors.push(`${fact.factId} source references must be bounded and unique`);
    }
    if (
      !STORY_FACT_CONFIDENCES.includes(fact.confidence) ||
      !STORY_CLAIM_KINDS.includes(fact.claimKind)
    ) {
      errors.push(`${fact.factId} confidence or claim kind is invalid`);
    }
    for (const ref of fact.sourceRefs) {
      if (!STORY_SOURCE_SCOPES.includes(ref.scope)) {
        errors.push(`${fact.factId} source scope is invalid`);
      }
      if (!sourceIds.has(ref.sourceId)) {
        errors.push(`${fact.factId} references unknown source ${ref.sourceId}`);
      }
      if (options.forPublish && ref.scope === "broad") {
        errors.push(`${fact.factId} needs an exact or bounded source locator`);
      }
      if (options.forPublish && ref.scope !== "broad" && !ref.locator?.trim()) {
        errors.push(`${fact.factId} source reference needs a locator`);
      }
      if (ref.locator !== undefined && !isSafeLocator(ref.locator)) {
        errors.push(`${fact.factId} source locator is invalid`);
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
    const requiredFactIds = new Set(beat.requiredFactIds);
    const optionalFactIds = new Set(beat.optionalFactIds);
    const declaredFactIds = new Set([
      ...beat.requiredFactIds,
      ...beat.optionalFactIds,
    ]);
    const usedFactIds = new Set<string>();
    const declaredQuoteIds = new Set(beat.quoteIds);
    const usedQuoteIds = new Set<string>();
    if (requiredFactIds.size !== beat.requiredFactIds.length) {
      errors.push(`arc[${index}] required facts must be unique`);
    }
    if (optionalFactIds.size !== beat.optionalFactIds.length) {
      errors.push(`arc[${index}] optional facts must be unique`);
    }
    if (
      beat.requiredFactIds.some((factId) => optionalFactIds.has(factId))
    ) {
      errors.push(`arc[${index}] required and optional facts must be disjoint`);
    }
    if (declaredQuoteIds.size !== beat.quoteIds.length) {
      errors.push(`arc[${index}] quote links must be unique`);
    }
    for (const factId of declaredFactIds) {
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
    const sentences = splitCanonicalSentences(beat.canonicalText);
    const sentenceCount = sentences.length;
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
      const sentence = sentences[mapping.sentenceIndex];
      if (mapping.treatment === "reader_bridge") {
        if (beat.role !== "bridge") {
          errors.push(
            `arc[${index}] reader-bridge treatment is only legal on the bridge`,
          );
        }
        if (
          mapping.factIds.length > 0 ||
          mapping.interpretationIds.length > 0 ||
          mapping.quoteIds.length > 0
        ) {
          errors.push(
            `arc[${index}] reader-bridge treatment cannot reference historical evidence`,
          );
        }
        if (sentence !== undefined && !isReaderBridgeSentence(sentence)) {
          errors.push(
            `arc[${index}] reader-bridge treatment must use reviewed reader copy`,
          );
        }
      } else if (mapping.treatment === "reader_permission") {
        readerPermissionCount += 1;
        if (beat.role !== "bridge") {
          errors.push(
            `arc[${index}] reader-permission treatment is only legal on the bridge`,
          );
        }
        if (
          mapping.factIds.length > 0 ||
          mapping.interpretationIds.length > 0 ||
          mapping.quoteIds.length > 0
        ) {
          errors.push(
            `arc[${index}] reader-permission treatment cannot reference historical evidence`,
          );
        }
        if (sentence !== undefined) {
          const rejection = readerPermissionRejection(sentence, personNames);
          if (rejection) {
            errors.push(
              `arc[${index}] reader-permission sentence is not bounded reader copy (${rejection})`,
            );
          }
        }
      } else if (mapping.treatment === "dramatized_texture") {
        if (beat.role === "bridge") {
          errors.push(`arc[${index}] dramatized texture is not legal on the bridge`);
        }
        if (mapping.factIds.length === 0) {
          errors.push(
            `arc[${index}] dramatized texture must be grounded in at least one fact`,
          );
        }
        if (mapping.quoteIds.length > 0) {
          errors.push(`arc[${index}] dramatized texture cannot carry a quotation`);
        }
        if (sentence !== undefined) {
          if (
            /["\u201c\u201d]/.test(sentence) ||
            extractDirectQuotes(sentence).length > 0
          ) {
            errors.push(
              `arc[${index}] dramatized texture cannot contain quotation marks`,
            );
          }
          if (/\d/.test(sentence)) {
            errors.push(`arc[${index}] dramatized texture cannot carry digits`);
          }
          if (
            namedEntityValues.some((value) => containsWholeWord(sentence, value))
          ) {
            errors.push(
              `arc[${index}] dramatized texture cannot name an allowlisted entity`,
            );
          }
        }
      } else if (
        mapping.factIds.length === 0 &&
        mapping.interpretationIds.length === 0
      ) {
        errors.push(`arc[${index}] historical sentence evidence cannot be empty`);
      }
      if (new Set(mapping.factIds).size !== mapping.factIds.length) {
        errors.push(`arc[${index}] sentence fact links must be unique`);
      }
      if (
        new Set(mapping.interpretationIds).size !==
        mapping.interpretationIds.length
      ) {
        errors.push(`arc[${index}] sentence interpretation links must be unique`);
      }
      if (new Set(mapping.quoteIds).size !== mapping.quoteIds.length) {
        errors.push(`arc[${index}] sentence quote links must be unique`);
      }
      for (const factId of mapping.factIds) {
        usedFactIds.add(factId);
        if (!factIds.has(factId)) {
          errors.push(`arc[${index}] sentence references unknown fact ${factId}`);
        }
      }
      for (const interpretationId of mapping.interpretationIds) {
        const interpretation = interpretationsById.get(interpretationId);
        if (!interpretation) {
          errors.push(
            `arc[${index}] sentence references unknown interpretation ${interpretationId}`,
          );
          continue;
        }
        if (!interpretation.allowed) {
          errors.push(
            `arc[${index}] sentence references disallowed interpretation ${interpretationId}`,
          );
        }
        if (interpretation.supportingFactIds.length === 0) {
          errors.push(
            `arc[${index}] mapped interpretation ${interpretationId} needs supporting facts`,
          );
        }
        for (const factId of interpretation.supportingFactIds) {
          usedFactIds.add(factId);
        }
      }
      for (const quoteId of mapping.quoteIds) {
        usedQuoteIds.add(quoteId);
        if (!quoteIds.has(quoteId)) {
          errors.push(`arc[${index}] sentence references unknown quote ${quoteId}`);
        }
      }
    }
    if (options.forPublish) {
      for (const factId of usedFactIds) {
        if (!declaredFactIds.has(factId)) {
          errors.push(
            `arc[${index}] sentence evidence uses undeclared fact ${factId}`,
          );
        }
      }
      for (const factId of declaredFactIds) {
        if (!usedFactIds.has(factId)) {
          errors.push(
            `arc[${index}] declares fact ${factId} without sentence evidence`,
          );
        }
      }
      for (const quoteId of usedQuoteIds) {
        if (!declaredQuoteIds.has(quoteId)) {
          errors.push(
            `arc[${index}] sentence evidence uses undeclared quote ${quoteId}`,
          );
        }
      }
      for (const quoteId of declaredQuoteIds) {
        if (!usedQuoteIds.has(quoteId)) {
          errors.push(
            `arc[${index}] declares quote ${quoteId} without sentence evidence`,
          );
        }
      }
      for (const mapping of beat.sentenceEvidence) {
        const sentence = sentences[mapping.sentenceIndex];
        if (sentence === undefined) continue;
        const directQuotes = extractDirectQuotes(sentence);
        for (const quoteId of mapping.quoteIds) {
          const quote = quotesById.get(quoteId);
          if (
            quote?.status === "verbatim" &&
            !directQuotes.includes(quote.text)
          ) {
            errors.push(
              `arc[${index}] mapped verbatim quote ${quoteId} does not appear in its sentence`,
            );
          }
        }
      }
      for (const [sentenceIndex, sentence] of sentences.entries()) {
        const mapping = beat.sentenceEvidence.find(
          (candidate) => candidate.sentenceIndex === sentenceIndex,
        );
        for (const directQuote of extractDirectQuotes(sentence)) {
          const approved = spec.quotes.find(
            (quote) =>
              quote.status === "verbatim" && quote.text === directQuote,
          );
          if (!approved) {
            errors.push(`arc[${index}] contains unsupported direct quote`);
          } else if (!mapping?.quoteIds.includes(approved.quoteId)) {
            errors.push(
              `arc[${index}] direct quote is not linked in its sentence evidence`,
            );
          }
        }
      }
      if (mappedSentenceIndexes.size !== sentenceCount) {
        errors.push(
          `arc[${index}] requires sentence-level evidence or reader-bridge classification before publish`,
        );
      }
      if (
        beat.role !== "bridge" &&
        !beat.sentenceEvidence.some(
          (mapping) => mapping.treatment === "historical_claim",
        )
      ) {
        errors.push(
          `arc[${index}] needs at least one documented sentence before publish`,
        );
      }
    }
    if (
      options.forPublish &&
      beat.sentenceEvidence.some(
        (mapping) =>
          mapping.treatment === "historical_claim" ||
          mapping.treatment === "dramatized_texture",
      ) &&
      beat.requiredFactIds.length === 0
    ) {
      errors.push(`arc[${index}] requires at least one supporting fact before publish`);
    }
    if (
      beat.role !== "bridge" &&
      (personNames.some((name) => containsWholeWord(beat.canonicalText, name)) ||
        /(?<![A-Za-z0-9])(?:1[0-9]|20)\d{2}(?![A-Za-z0-9])/.test(
          beat.canonicalText,
        ))
    ) {
      warnings.push(
        `arc[${index}] names the subject or a year before the bridge reveal`,
      );
    }
  });
  if (readerPermissionCount > READER_PERMISSION_MAX_SENTENCES) {
    errors.push(
      `bridge carries more than ${READER_PERMISSION_MAX_SENTENCES} reader-permission sentences`,
    );
  }

  for (const quote of spec.quotes) {
    if (!isSafeTransparencyId(quote.quoteId)) {
      errors.push(`${quote.quoteId} must use the bounded public identifier format`);
    }
    if (
      !isBoundedTransparencyText(
        quote.text,
        1,
        STORY_TRANSPARENCY_LIMITS.quoteText,
      ) ||
      quote.sourceRefs.length === 0
    ) {
      errors.push(
        `${quote.quoteId} text must be non-empty and within the public limit, with source references`,
      );
    }
    if (
      quote.speaker !== undefined &&
      !isBoundedTransparencyText(
        quote.speaker,
        1,
        STORY_TRANSPARENCY_LIMITS.quoteSpeaker,
      )
    ) {
      errors.push(`${quote.quoteId} speaker is empty or exceeds the public limit`);
    }
    if (
      quote.sourceRefs.length > STORY_TRANSPARENCY_LIMITS.sourceRefs ||
      !hasUniqueStorySourceRefs(quote.sourceRefs)
    ) {
      errors.push(`${quote.quoteId} source references must be bounded and unique`);
    }
    if (!STORY_QUOTE_STATUSES.includes(quote.status)) {
      errors.push(`${quote.quoteId} status is invalid`);
    }
    for (const ref of quote.sourceRefs) {
      if (!STORY_SOURCE_SCOPES.includes(ref.scope)) {
        errors.push(`${quote.quoteId} source scope is invalid`);
      }
      if (!sourceIds.has(ref.sourceId)) {
        errors.push(`${quote.quoteId} references unknown source ${ref.sourceId}`);
      }
      if (options.forPublish && ref.scope === "broad") {
        errors.push(`${quote.quoteId} needs an exact or bounded source locator`);
      }
      if (options.forPublish && ref.scope !== "broad" && !ref.locator?.trim()) {
        errors.push(`${quote.quoteId} source reference needs a locator`);
      }
      if (ref.locator !== undefined && !isSafeLocator(ref.locator)) {
        errors.push(`${quote.quoteId} source locator is invalid`);
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
    if (!interpretation.statement.trim()) {
      errors.push(`${interpretation.interpretationId} statement is empty`);
    }
    if (
      new Set(interpretation.supportingFactIds).size !==
      interpretation.supportingFactIds.length
    ) {
      errors.push(
        `${interpretation.interpretationId} supporting facts must be unique`,
      );
    }
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
    if (spec.review.reviewedAt && !isStoryReviewDate(spec.review.reviewedAt)) {
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

function isSafeLocator(value: string): boolean {
  return (
    value.trim().length > 0 &&
    value.length <= STORY_TRANSPARENCY_LIMITS.locator &&
    !hasUnsafeControl(value)
  );
}

function hasUnsafeControl(value: string): boolean {
  return /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
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

// Keeps the privacy utility in the StorySpec module graph so later artifact
// validation cannot accidentally omit the disclosure check.
export function storySpecContainsDisclosure(
  spec: StorySpec,
  disclosure: string,
): boolean {
  return spec.arc.some((beat) => containsDisclosureEcho(beat.canonicalText, disclosure));
}
