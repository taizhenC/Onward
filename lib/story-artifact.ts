import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { chunkBeatText } from "./chunks";
import { validateStorySpec } from "./story-spec";
import {
  STORY_ARTIFACT_SCHEMA_VERSION,
  HYBRID_STORY_ARTIFACT_SCHEMA_VERSION,
  RESONANCE_STORY_ARTIFACT_SCHEMA_VERSION,
  BOUNDARY_STORY_ARTIFACT_SCHEMA_VERSION,
  LEGACY_STORY_ARTIFACT_SCHEMA_VERSION,
  LEGACY_STORY_ARTIFACT_VALIDATOR_VERSION,
  MAX_STORY_PASSAGES,
  STORY_ARTIFACT_VALIDATOR_VERSION,
  STORY_COMPOSER_VERSION,
  type ArtifactValidationFailure,
  type StoryArtifact,
  type StoryArtifactValidation,
} from "./story-artifact-types";
import { CONTENT_FLAGS, type StorySpec } from "./story-spec-types";
import {
  buildStoryTransparency,
  validateStoredStoryTransparency,
  validateStoryTransparency,
} from "./story-transparency";
import {
  STORY_BOUNDARY_POLICY_VERSION,
  storyProfileAllowed,
  type StoryBoundaries,
} from "./story-boundaries";
import {
  RESONANCE_BRIEF_VERSION,
  containsResonanceEcho,
  validateResonanceBrief,
  type ResonanceBrief,
} from "./resonance-brief";
import {
  HYBRID_PLAN_SCHEMA_VERSION,
  HYBRID_TEMPLATE_POLICY_VERSION,
  isBridgeTemplateId,
  isHybridTemplateId,
  isTransitionTemplateId,
  renderHybridBeatText,
  renderHybridTemplate,
  type HybridCompositionPlan,
} from "./hybrid-composition";
import {
  STORY_PROMPT_VERSION_V1,
  STORY_PROMPT_VERSION_V2,
} from "./llm-recipe-constants";
import { isSafeStoredEyebrow } from "./opening-copy";
import {
  isUniversalOpeningCopy,
  isUniversalPreface,
  validatePersonalizedOpeningCopy,
} from "./preface-plan";
import { getStoryRecipeById } from "./story-recipe-runtime";
import type {
  ClientFigureOutline,
  FigureStageRow,
  Framing,
  MatchRecipe,
  OpeningCopy,
} from "./types";

const EXPECTED_ROLES = [
  "scene",
  "dark_moment",
  "response",
  "struggle",
  "turning_point",
  "became",
  "bridge",
] as const;

export type ComposeCanonicalArtifactInput = {
  storySpec: StorySpec;
  stage: FigureStageRow;
  matchRecipe: MatchRecipe;
  openingCopy: OpeningCopy;
  framing: Framing;
  resonanceBrief: ResonanceBrief;
  boundaries?: StoryBoundaries;
  fallbackReason?: StoryArtifact["composition"]["fallbackReason"];
  attemptCount?: number;
  allowDraftSpec?: boolean;
  now?: Date;
};

export class StoryCompositionError extends Error {
  constructor(readonly reasons: ArtifactValidationFailure[]) {
    super(`story artifact rejected: ${reasons.join(",")}`);
    this.name = "StoryCompositionError";
  }
}

export type StoredStoryArtifactEnvelope = Readonly<{
  artifactId: string;
  schemaVersion: string;
  contentHash: string;
}>;

// Canonical composition is the guaranteed fallback path. It freezes the full
// reader payload now; no provider or mutable content row is needed during read.
export function composeCanonicalStoryArtifact({
  storySpec,
  stage,
  matchRecipe,
  openingCopy,
  framing,
  resonanceBrief,
  boundaries,
  fallbackReason = "canonical_only",
  attemptCount = 0,
  allowDraftSpec = false,
  now = new Date(),
}: ComposeCanonicalArtifactInput): StoryArtifact {
  if (!validateResonanceBrief(resonanceBrief)) {
    throw new StoryCompositionError(["resonance_brief_invalid"]);
  }
  const specValidation = validateStorySpec(storySpec, {
    forPublish: !allowDraftSpec,
  });
  if (!specValidation.valid) throw new StoryCompositionError(["story_spec_invalid"]);

  const timestamp = now.toISOString();
  const artifactWithoutHash: Omit<StoryArtifact, "contentHash"> = {
    artifactId: randomBytes(16).toString("hex"),
    schemaVersion: STORY_ARTIFACT_SCHEMA_VERSION,
    storySpecId: storySpec.storySpecId,
    storySpecVersion: storySpec.version,
    storySpecSchemaVersion: storySpec.schemaVersion,
    figureKey: storySpec.figureKey,
    stageId: storySpec.stageId,
    figure: {
      displayName: stage.displayName,
      birthYear: stage.birthYear,
      deathYear: stage.deathYear,
      ageMin: storySpec.episode.ageMin,
      ageMax: storySpec.episode.ageMax,
    },
    contentProfile: {
      ...structuredClone(storySpec.contentProfile),
      reviewed:
        storySpec.status === "published" &&
        storySpec.review.contentProfileReviewed === true,
    },
    openingCopy: structuredClone(openingCopy),
    framing,
    recipe: {
      match: structuredClone(matchRecipe),
      composerVersion: STORY_COMPOSER_VERSION,
      validatorVersion: STORY_ARTIFACT_VALIDATOR_VERSION,
      boundaryPolicyVersion: STORY_BOUNDARY_POLICY_VERSION,
      resonanceBriefVersion: resonanceBrief.version,
      hybridTemplatePolicyVersion: HYBRID_TEMPLATE_POLICY_VERSION,
    },
    composition: {
      mode: "canonical_fallback",
      fallbackReason,
      attemptCount,
    },
    transparency: buildStoryTransparency(storySpec, resonanceBrief, framing),
    beats: storySpec.arc.map((beat) => ({
      role: beat.role,
      kind: beat.role === "bridge" ? "bridge" : "narrative",
      text: beat.canonicalText,
      chunks: chunkBeatText({
        role: beat.role,
        kind: beat.role === "bridge" ? "bridge" : "narrative",
        text: beat.canonicalText,
      }),
      factIds: unique([...beat.requiredFactIds, ...beat.optionalFactIds]),
      entityIds: unique(beat.entityIds),
      quoteIds: unique(beat.quoteIds),
    })),
    validation: {
      status: "validated",
      failureReasons: [],
      validatedAt: timestamp,
    },
    createdAt: timestamp,
  };
  const artifact: StoryArtifact = {
    ...artifactWithoutHash,
    contentHash: storyArtifactContentHash(artifactWithoutHash),
  };
  const validation = validateStoryArtifact(
    artifact,
    storySpec,
    resonanceBrief,
    boundaries,
  );
  if (!validation.valid) throw new StoryCompositionError(validation.failureReasons);
  return deepFreeze(artifact);
}

export type ComposeHybridArtifactInput = Omit<
  ComposeCanonicalArtifactInput,
  "fallbackReason" | "attemptCount"
> & {
  plan: HybridCompositionPlan;
  attemptCount: 1 | 2;
};

export function composeHybridStoryArtifact({
  plan,
  attemptCount,
  ...input
}: ComposeHybridArtifactInput): StoryArtifact {
  if (plan.schemaVersion !== HYBRID_PLAN_SCHEMA_VERSION) {
    throw new StoryCompositionError(["personalization_invalid"]);
  }
  const canonical = composeCanonicalStoryArtifact({
    ...input,
    fallbackReason: "canonical_only",
    attemptCount: 0,
  });
  const artifact = structuredClone(canonical);
  artifact.composition = {
    mode: "hybrid",
    attemptCount,
    planVersion: HYBRID_PLAN_SCHEMA_VERSION,
  };
  artifact.beats = artifact.beats.map((beat) => {
    const templateId =
      beat.role === plan.transitionRole
        ? plan.transitionTemplateId
        : beat.role === "bridge"
          ? plan.bridgeTemplateId
          : null;
    if (!templateId) return beat;
    const text = renderHybridBeatText(beat.text, templateId, input.resonanceBrief);
    return {
      ...beat,
      text,
      chunks: chunkBeatText({ role: beat.role, kind: beat.kind, text }),
      personalization: {
        templateId,
        policyVersion: HYBRID_TEMPLATE_POLICY_VERSION,
      },
    };
  });
  artifact.transparency = buildStoryTransparency(
    input.storySpec,
    input.resonanceBrief,
    input.framing,
    plan.transitionRole,
  );
  artifact.contentHash = storyArtifactContentHash(artifact);
  const validation = validateStoryArtifact(
    artifact,
    input.storySpec,
    input.resonanceBrief,
    input.boundaries,
  );
  if (!validation.valid) throw new StoryCompositionError(validation.failureReasons);
  return deepFreeze(artifact);
}

export function validateStoryArtifact(
  artifact: StoryArtifact,
  storySpec: StorySpec,
  resonanceBrief: ResonanceBrief,
  boundaries?: StoryBoundaries,
): StoryArtifactValidation {
  const failures = new Set<ArtifactValidationFailure>();

  if (artifact.schemaVersion !== STORY_ARTIFACT_SCHEMA_VERSION) failures.add("schema_invalid");
  if (
    artifact.storySpecId !== storySpec.storySpecId ||
    artifact.storySpecVersion !== storySpec.version ||
    artifact.storySpecSchemaVersion !== storySpec.schemaVersion ||
    artifact.figureKey !== storySpec.figureKey ||
    artifact.stageId !== storySpec.stageId
  ) {
    failures.add("identity_mismatch");
  }
  if (artifact.beats.length !== EXPECTED_ROLES.length) failures.add("role_order_invalid");
  if (
    artifact.recipe.composerVersion !== STORY_COMPOSER_VERSION ||
    artifact.recipe.validatorVersion !== STORY_ARTIFACT_VALIDATOR_VERSION ||
    artifact.recipe.boundaryPolicyVersion !== STORY_BOUNDARY_POLICY_VERSION ||
    artifact.recipe.resonanceBriefVersion !== resonanceBrief.version ||
    artifact.recipe.hybridTemplatePolicyVersion !==
      HYBRID_TEMPLATE_POLICY_VERSION
  ) {
    failures.add("recipe_invalid");
  }
  const attemptCount = artifact.composition.attemptCount;
  if (
    !Number.isInteger(attemptCount) ||
    (attemptCount ?? -1) < 0 ||
    (attemptCount ?? 3) > 2 ||
    (artifact.composition.mode === "hybrid" &&
      (artifact.composition.planVersion !== HYBRID_PLAN_SCHEMA_VERSION ||
        artifact.composition.fallbackReason !== undefined ||
        attemptCount === 0)) ||
    (artifact.composition.mode === "canonical_fallback" &&
      (artifact.composition.planVersion !== undefined ||
        artifact.composition.fallbackReason === undefined))
  ) {
    failures.add("composition_invalid");
  }

  if (!validateResonanceBrief(resonanceBrief)) {
    failures.add("resonance_brief_invalid");
  }
  validateOpeningCopy(
    artifact.openingCopy,
    resonanceBrief,
    artifact.recipe.match.storyPromptVersion,
    artifact.figure.displayName,
    failures,
  );
  const expectedProfileReviewed =
    storySpec.status === "published" &&
    storySpec.review.contentProfileReviewed === true;
  if (
    artifact.contentProfile.intensity !== storySpec.contentProfile.intensity ||
    artifact.contentProfile.contentNote !== storySpec.contentProfile.contentNote ||
    artifact.contentProfile.reviewed !== expectedProfileReviewed ||
    !sameSet(artifact.contentProfile.flags, storySpec.contentProfile.flags)
  ) {
    failures.add("content_profile_mismatch");
  }
  // The StorySpec remains authoritative during composition. Checking both
  // surfaces prevents a caller from laundering an ineligible profile by
  // changing only the artifact metadata before validation.
  if (
    !storyProfileAllowed(storySpec.contentProfile, boundaries) ||
    !storyProfileAllowed(artifact.contentProfile, boundaries)
  ) {
    failures.add("boundary_violation");
  }

  let transitionPersonalizationCount = 0;
  let bridgePersonalizationCount = 0;
  let passageCount = 0;
  artifact.beats.forEach((beat, index) => {
    const specBeat = storySpec.arc[index];
    if (!specBeat || beat.role !== EXPECTED_ROLES[index] || beat.role !== specBeat.role) {
      failures.add("role_order_invalid");
      return;
    }
    passageCount += beat.chunks.length;
    if (
      !beat.text.trim() ||
      beat.chunks.length === 0 ||
      beat.chunks.some((chunk) => !chunk.trim())
    ) {
      failures.add("empty_passage");
    }
    if (normalizeText(beat.chunks.join(" ")) !== normalizeText(beat.text)) {
      failures.add("chunk_mismatch");
    }
    let expectedText = specBeat.canonicalText;
    if (beat.personalization) {
      const validPolicy =
        beat.personalization.policyVersion === HYBRID_TEMPLATE_POLICY_VERSION;
      if (beat.role === "bridge") {
        bridgePersonalizationCount += 1;
        if (
          !validPolicy ||
          !isBridgeTemplateId(beat.personalization.templateId) ||
          !specBeat.personalizationZones.includes("reader_bridge")
        ) {
          failures.add("personalization_invalid");
        }
      } else {
        transitionPersonalizationCount += 1;
        if (
          !validPolicy ||
          !isTransitionTemplateId(beat.personalization.templateId) ||
          (!specBeat.personalizationZones.includes("transition") &&
            !specBeat.personalizationZones.includes("emphasis"))
        ) {
          failures.add("personalization_invalid");
        }
      }
      if (isHybridTemplateId(beat.personalization.templateId)) {
        expectedText = renderHybridBeatText(
          specBeat.canonicalText,
          beat.personalization.templateId,
          resonanceBrief,
        );
      }
    }
    if (beat.text !== expectedText) failures.add("canonical_copy_mismatch");
    if (!sameSet(beat.factIds, [...specBeat.requiredFactIds, ...specBeat.optionalFactIds])) {
      failures.add("evidence_mismatch");
    }
    if (!sameSet(beat.entityIds, specBeat.entityIds)) failures.add("entity_mismatch");
    if (!sameSet(beat.quoteIds, specBeat.quoteIds)) failures.add("quote_mismatch");
    if (/\{feeling\}|You wrote:/i.test(beat.text)) failures.add("forbidden_placeholder");
    if (containsResonanceEcho(beat.text, resonanceBrief)) {
      failures.add("disclosure_echo");
    }
    if (
      beat.personalization &&
      isHybridTemplateId(beat.personalization.templateId) &&
      containsToneViolation(
        renderHybridTemplate(beat.personalization.templateId, resonanceBrief),
      )
    ) {
      failures.add("tone_invalid");
    }
  });
  if (passageCount > MAX_STORY_PASSAGES) {
    failures.add("passage_limit_exceeded");
  }

  if (
    (artifact.composition.mode === "hybrid" &&
      (transitionPersonalizationCount !== 1 || bridgePersonalizationCount !== 1)) ||
    (artifact.composition.mode === "canonical_fallback" &&
      (transitionPersonalizationCount !== 0 || bridgePersonalizationCount !== 0))
  ) {
    failures.add("personalization_invalid");
  }

  const personalizedTransitionRoles = artifact.beats
    .filter((beat) => beat.role !== "bridge" && beat.personalization !== undefined)
    .map((beat) => beat.role);
  const personalizedTransitionRole =
    artifact.composition.mode === "hybrid" &&
    personalizedTransitionRoles.length === 1
      ? personalizedTransitionRoles[0]
      : undefined;
  if (
    !validateStoryTransparency(
      artifact.transparency,
      storySpec,
      resonanceBrief,
      artifact.framing,
      personalizedTransitionRole,
    )
  ) {
    failures.add("transparency_invalid");
  }

  if (artifact.contentHash !== storyArtifactContentHash(artifact)) {
    failures.add("content_hash_mismatch");
  }

  return { valid: failures.size === 0, failureReasons: [...failures] };
}

// Database JSON is untrusted at the TypeScript boundary. Replay needs no model
// or mutable StorySpec lookup, but it does re-check structure and the content
// hash before any stored prose reaches a route. Legacy schemas additionally
// require the immutable row envelope; an artifact cannot grant itself legacy
// compatibility by rewriting its own schema and recomputing its own hash.
export function validateStoredStoryArtifact(
  value: unknown,
  envelope?: StoredStoryArtifactEnvelope,
): StoryArtifact | null {
  if (!isRecord(value)) return null;
  const candidate = value as Partial<StoryArtifact>;
  if (
    (candidate.schemaVersion !== STORY_ARTIFACT_SCHEMA_VERSION &&
      candidate.schemaVersion !== HYBRID_STORY_ARTIFACT_SCHEMA_VERSION &&
      candidate.schemaVersion !== RESONANCE_STORY_ARTIFACT_SCHEMA_VERSION &&
      candidate.schemaVersion !== BOUNDARY_STORY_ARTIFACT_SCHEMA_VERSION &&
      candidate.schemaVersion !== LEGACY_STORY_ARTIFACT_SCHEMA_VERSION) ||
    typeof candidate.artifactId !== "string" ||
    typeof candidate.storySpecId !== "string" ||
    typeof candidate.storySpecVersion !== "number" ||
    typeof candidate.storySpecSchemaVersion !== "string" ||
    typeof candidate.figureKey !== "string" ||
    typeof candidate.stageId !== "string" ||
    !isRecord(candidate.figure) ||
    !isRecord(candidate.openingCopy) ||
    !hasExactKeys(candidate.openingCopy, ["eyebrow", "prefaceLines"]) ||
    typeof candidate.openingCopy.eyebrow !== "string" ||
    !Array.isArray(candidate.openingCopy.prefaceLines) ||
    (candidate.framing !== "definitive" && candidate.framing !== "partial") ||
    !isRecord(candidate.contentProfile) ||
    !isRecord(candidate.recipe) ||
    !isRecord(candidate.composition) ||
    !Array.isArray(candidate.beats) ||
    candidate.beats.length !== EXPECTED_ROLES.length ||
    !isRecord(candidate.validation) ||
    candidate.validation.status !== "validated" ||
    typeof candidate.contentHash !== "string"
  ) {
    return null;
  }
  const artifact = candidate as StoryArtifact;
  const legacySchema =
    artifact.schemaVersion !== STORY_ARTIFACT_SCHEMA_VERSION;
  if (
    (legacySchema && envelope === undefined) ||
    (envelope !== undefined &&
      (!validStoredArtifactEnvelope(envelope) ||
        envelope.artifactId !== artifact.artifactId ||
        envelope.schemaVersion !== artifact.schemaVersion ||
        envelope.contentHash !== artifact.contentHash))
  ) {
    return null;
  }
  const boundaryAwareSchema =
    artifact.schemaVersion === STORY_ARTIFACT_SCHEMA_VERSION ||
    artifact.schemaVersion === HYBRID_STORY_ARTIFACT_SCHEMA_VERSION ||
    artifact.schemaVersion === RESONANCE_STORY_ARTIFACT_SCHEMA_VERSION ||
    artifact.schemaVersion === BOUNDARY_STORY_ARTIFACT_SCHEMA_VERSION;
  const resonanceAwareSchema =
    artifact.schemaVersion === STORY_ARTIFACT_SCHEMA_VERSION ||
    artifact.schemaVersion === HYBRID_STORY_ARTIFACT_SCHEMA_VERSION ||
    artifact.schemaVersion === RESONANCE_STORY_ARTIFACT_SCHEMA_VERSION;
  const hybridAwareSchema =
    artifact.schemaVersion === STORY_ARTIFACT_SCHEMA_VERSION ||
    artifact.schemaVersion === HYBRID_STORY_ARTIFACT_SCHEMA_VERSION;
  const transparencyAwareSchema =
    artifact.schemaVersion === STORY_ARTIFACT_SCHEMA_VERSION;
  const openingFailures = new Set<ArtifactValidationFailure>();
  const storedStoryPromptVersion =
    isRecord(artifact.recipe.match) &&
    typeof artifact.recipe.match.storyPromptVersion === "string"
      ? artifact.recipe.match.storyPromptVersion
      : undefined;
  const storedDisplayName =
    typeof artifact.figure.displayName === "string"
      ? artifact.figure.displayName
      : "";
  const registeredRecipe =
    isRecord(artifact.recipe.match) &&
    typeof artifact.recipe.match.recipeId === "string"
      ? getStoryRecipeById(artifact.recipe.match.recipeId)
      : null;
  if (
    registeredRecipe !== null &&
    ((storedStoryPromptVersion !== undefined &&
      storedStoryPromptVersion !== registeredRecipe.storyPromptVersion) ||
      (artifact.recipe.match.recipeManifestHash !== undefined &&
        artifact.recipe.match.recipeManifestHash !==
          registeredRecipe.manifestSha256))
  ) {
    return null;
  }
  validateOpeningCopy(
    artifact.openingCopy,
    null,
    storedStoryPromptVersion,
    storedDisplayName,
    openingFailures,
    legacySchema && envelope !== undefined,
  );
  if (
    openingFailures.size > 0 ||
    typeof artifact.figure.displayName !== "string" ||
    typeof artifact.figure.ageMin !== "number" ||
    typeof artifact.figure.ageMax !== "number" ||
    artifact.figure.ageMin > artifact.figure.ageMax ||
    !["gentle", "moderate", "direct"].includes(artifact.contentProfile.intensity) ||
    !Array.isArray(artifact.contentProfile.flags) ||
    !artifact.contentProfile.flags.every(
      (flag) =>
        typeof flag === "string" &&
        CONTENT_FLAGS.includes(flag as (typeof CONTENT_FLAGS)[number]),
    ) ||
    typeof artifact.contentProfile.contentNote !== "string" ||
    (boundaryAwareSchema &&
      typeof artifact.contentProfile.reviewed !== "boolean") ||
    !isRecord(artifact.recipe.match) ||
    typeof artifact.recipe.match.recipeId !== "string" ||
    artifact.recipe.composerVersion !== STORY_COMPOSER_VERSION ||
    ![
      STORY_ARTIFACT_VALIDATOR_VERSION,
      LEGACY_STORY_ARTIFACT_VALIDATOR_VERSION,
    ].includes(artifact.recipe.validatorVersion) ||
    (boundaryAwareSchema &&
      artifact.recipe.boundaryPolicyVersion !== STORY_BOUNDARY_POLICY_VERSION) ||
    (resonanceAwareSchema &&
      artifact.recipe.resonanceBriefVersion !== RESONANCE_BRIEF_VERSION) ||
    (hybridAwareSchema &&
      artifact.recipe.hybridTemplatePolicyVersion !==
        HYBRID_TEMPLATE_POLICY_VERSION) ||
    !["canonical_fallback", "hybrid"].includes(artifact.composition.mode) ||
    (artifact.composition.fallbackReason !== undefined &&
      ![
        "canonical_only",
        "provider_timeout",
        "provider_error",
        "provider_output_invalid",
        "validator_rejected",
      ].includes(artifact.composition.fallbackReason)) ||
    (hybridAwareSchema &&
      (!Number.isInteger(artifact.composition.attemptCount) ||
        (artifact.composition.attemptCount ?? -1) < 0 ||
        (artifact.composition.attemptCount ?? 3) > 2 ||
        (artifact.composition.mode === "hybrid" &&
          (artifact.composition.planVersion !== HYBRID_PLAN_SCHEMA_VERSION ||
            artifact.composition.fallbackReason !== undefined ||
            artifact.composition.attemptCount === 0)) ||
        (artifact.composition.mode === "canonical_fallback" &&
          (artifact.composition.planVersion !== undefined ||
            artifact.composition.fallbackReason === undefined)))) ||
    !Array.isArray(artifact.validation.failureReasons) ||
    artifact.validation.failureReasons.length > 0 ||
    !isIsoTimestamp(artifact.validation.validatedAt) ||
    !isIsoTimestamp(artifact.createdAt) ||
    !/^[0-9a-f]{64}$/.test(artifact.contentHash)
  ) {
    return null;
  }
  if (
    transparencyAwareSchema
      ? !validateStoredStoryTransparency(artifact.transparency) ||
        artifact.transparency.storySpec.storySpecId !== artifact.storySpecId ||
        artifact.transparency.storySpec.version !== artifact.storySpecVersion ||
        artifact.transparency.storySpec.schemaVersion !== artifact.storySpecSchemaVersion
      : artifact.transparency !== undefined
  ) {
    return null;
  }
  let storedTransitionPersonalizationCount = 0;
  let storedBridgePersonalizationCount = 0;
  let storedPassageCount = 0;
  for (const [index, beat] of artifact.beats.entries()) {
    if (
      !isRecord(beat) ||
      beat.role !== EXPECTED_ROLES[index] ||
      beat.kind !== (beat.role === "bridge" ? "bridge" : "narrative") ||
      typeof beat.text !== "string" ||
      !beat.text.trim() ||
      !Array.isArray(beat.chunks) ||
      beat.chunks.length === 0 ||
      beat.chunks.some(
        (chunk) => typeof chunk !== "string" || !chunk.trim(),
      ) ||
      !isStringArray(beat.factIds) ||
      !isStringArray(beat.entityIds) ||
      !isStringArray(beat.quoteIds) ||
      /\{feeling\}|You wrote:/i.test(beat.text) ||
      normalizeText(beat.chunks.join(" ")) !== normalizeText(beat.text)
    ) {
      return null;
    }
    storedPassageCount += beat.chunks.length;
    if (storedPassageCount > MAX_STORY_PASSAGES) return null;
    if (!hybridAwareSchema && beat.personalization !== undefined) return null;
    if (beat.personalization !== undefined) {
      if (
        !isRecord(beat.personalization) ||
        Object.keys(beat.personalization).sort().join(",") !==
          "policyVersion,templateId" ||
        typeof beat.personalization.templateId !== "string" ||
        !isHybridTemplateId(beat.personalization.templateId) ||
        (beat.role === "bridge" &&
          !isBridgeTemplateId(beat.personalization.templateId)) ||
        (beat.role !== "bridge" &&
          !isTransitionTemplateId(beat.personalization.templateId)) ||
        beat.personalization.policyVersion !== HYBRID_TEMPLATE_POLICY_VERSION
      ) {
        return null;
      }
      if (beat.role === "bridge") storedBridgePersonalizationCount += 1;
      else storedTransitionPersonalizationCount += 1;
    }
  }
  if (transparencyAwareSchema) {
    for (const [index, beat] of artifact.beats.entries()) {
      const transparencyBeat = artifact.transparency?.beats[index];
      if (
        !transparencyBeat ||
        transparencyBeat.role !== beat.role ||
        !sameSet(transparencyBeat.factIds, beat.factIds) ||
        !sameSet(transparencyBeat.quoteIds, beat.quoteIds) ||
        transparencyBeat.hasPersonalizedTransition !==
          (beat.role !== "bridge" && beat.personalization !== undefined)
      ) {
        return null;
      }
    }
  }
  if (
    hybridAwareSchema &&
    ((artifact.composition.mode === "hybrid" &&
      (storedTransitionPersonalizationCount !== 1 ||
        storedBridgePersonalizationCount !== 1)) ||
      (artifact.composition.mode === "canonical_fallback" &&
        (storedTransitionPersonalizationCount !== 0 ||
          storedBridgePersonalizationCount !== 0)))
  ) {
    return null;
  }
  if (artifact.contentHash !== storyArtifactContentHash(artifact)) return null;
  return deepFreeze(artifact);
}

export function toClientArtifactOutline(artifact: StoryArtifact): ClientFigureOutline {
  return {
    figureKey: artifact.figureKey,
    displayName: artifact.figure.displayName,
    birthYear: artifact.figure.birthYear,
    deathYear: artifact.figure.deathYear,
    ageMin: artifact.figure.ageMin,
    ageMax: artifact.figure.ageMax,
    beats: artifact.beats.map((beat) => ({ kind: beat.kind, role: beat.role })),
  };
}

export function storyArtifactContentHash(
  artifact: Omit<StoryArtifact, "contentHash"> | StoryArtifact,
): string {
  const contentSurface = {
    schemaVersion: artifact.schemaVersion,
    storySpecId: artifact.storySpecId,
    storySpecVersion: artifact.storySpecVersion,
    storySpecSchemaVersion: artifact.storySpecSchemaVersion,
    figureKey: artifact.figureKey,
    stageId: artifact.stageId,
    figure: artifact.figure,
    contentProfile: artifact.contentProfile,
    openingCopy: artifact.openingCopy,
    framing: artifact.framing,
    recipe: artifact.recipe,
    composition: artifact.composition,
    transparency: artifact.transparency,
    beats: artifact.beats,
  };
  // Postgres jsonb does not preserve object-key order. Canonical serialization
  // keeps the integrity hash stable across database round trips.
  return createHash("sha256")
    .update(JSON.stringify(sortJsonKeys(contentSurface)))
    .digest("hex");
}

function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonKeys);
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const child = (value as Record<string, unknown>)[key];
      if (child !== undefined) sorted[key] = sortJsonKeys(child);
    }
    return sorted;
  }
  return value;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function validateOpeningCopy(
  openingCopy: OpeningCopy,
  resonanceBrief: ResonanceBrief | null,
  storyPromptVersion: string | undefined,
  displayName: string,
  failures: Set<ArtifactValidationFailure>,
  allowLegacyUnversioned = false,
): void {
  if (
    !isRecord(openingCopy) ||
    !hasExactKeys(openingCopy, ["eyebrow", "prefaceLines"])
  ) {
    failures.add("opening_copy_invalid");
  }
  const eyebrow =
    typeof openingCopy.eyebrow === "string" ? openingCopy.eyebrow : "";
  const prefaceLines = Array.isArray(openingCopy.prefaceLines)
    ? openingCopy.prefaceLines
    : [];
  const rawLines: unknown[] = [openingCopy.eyebrow, ...prefaceLines];
  const lines = rawLines.filter((line): line is string => typeof line === "string");
  if (
    lines.length !== rawLines.length ||
    !eyebrow.trim() ||
    eyebrow.includes("\n") ||
    eyebrow.trim().split(/\s+/).length > 10 ||
    !isSafeStoredEyebrow(eyebrow, displayName) ||
    prefaceLines.length === 0 ||
    lines.some((line) => !line.trim())
  ) {
    failures.add("opening_copy_invalid");
  }
  let trustedUniversalPreface = false;
  if (storyPromptVersion === STORY_PROMPT_VERSION_V1) {
    trustedUniversalPreface = isUniversalPreface(prefaceLines);
    if (!trustedUniversalPreface) failures.add("opening_copy_invalid");
  } else if (storyPromptVersion === STORY_PROMPT_VERSION_V2) {
    trustedUniversalPreface = isUniversalOpeningCopy(openingCopy);
    if (
      !validatePersonalizedOpeningCopy(openingCopy, resonanceBrief)
    ) {
      failures.add("opening_copy_invalid");
    }
  } else if (
    storyPromptVersion !== undefined ||
    !allowLegacyUnversioned
  ) {
    failures.add("opening_copy_invalid");
  }
  const resonanceEchoLines = trustedUniversalPreface
    ? [eyebrow]
    : lines;
  if (
    resonanceEchoLines.some(
      (line) =>
        /\{feeling\}|You wrote:/i.test(line) ||
        (resonanceBrief !== null && containsResonanceEcho(line, resonanceBrief)),
    )
  ) {
    failures.add("disclosure_echo");
  }
  if (
    lines.some(containsToneViolation)
  ) {
    failures.add("tone_invalid");
  }
}

function validStoredArtifactEnvelope(
  envelope: StoredStoryArtifactEnvelope,
): boolean {
  return (
    typeof envelope.artifactId === "string" &&
    envelope.artifactId.length > 0 &&
    typeof envelope.schemaVersion === "string" &&
    envelope.schemaVersion.length > 0 &&
    /^[0-9a-f]{64}$/.test(envelope.contentHash)
  );
}

function containsToneViolation(value: string): boolean {
  return /\b(?:you (?:will|must|should|need to)|everything will|guarantee|diagnos(?:e|is)|clinically|cure[ds]?|your life is (?:the same as|exactly like)|because (?:they|this person) did it,? you)\b/i.test(
    value,
  );
}

function sameSet(left: string[], right: string[]): boolean {
  const a = [...new Set(left)].sort();
  const b = [...new Set(right)].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return (
    Object.keys(value).sort().join(",") === [...expected].sort().join(",")
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}
