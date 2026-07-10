import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { chunkBeatText } from "./chunks";
import { containsDisclosureEcho } from "./story-privacy";
import { validateStorySpec } from "./story-spec";
import {
  STORY_ARTIFACT_SCHEMA_VERSION,
  STORY_ARTIFACT_VALIDATOR_VERSION,
  STORY_COMPOSER_VERSION,
  type ArtifactValidationFailure,
  type StoryArtifact,
  type StoryArtifactValidation,
} from "./story-artifact-types";
import { CONTENT_FLAGS, type StorySpec } from "./story-spec-types";
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
  disclosure: string;
  fallbackReason?: StoryArtifact["composition"]["fallbackReason"];
  allowDraftSpec?: boolean;
  now?: Date;
};

export class StoryCompositionError extends Error {
  constructor(readonly reasons: ArtifactValidationFailure[]) {
    super(`story artifact rejected: ${reasons.join(",")}`);
    this.name = "StoryCompositionError";
  }
}

// Canonical composition is the guaranteed fallback path. It freezes the full
// reader payload now; no provider or mutable content row is needed during read.
export function composeCanonicalStoryArtifact({
  storySpec,
  stage,
  matchRecipe,
  openingCopy,
  framing,
  disclosure,
  fallbackReason = "canonical_only",
  allowDraftSpec = false,
  now = new Date(),
}: ComposeCanonicalArtifactInput): StoryArtifact {
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
    contentProfile: structuredClone(storySpec.contentProfile),
    openingCopy: structuredClone(openingCopy),
    framing,
    recipe: {
      match: structuredClone(matchRecipe),
      composerVersion: STORY_COMPOSER_VERSION,
      validatorVersion: STORY_ARTIFACT_VALIDATOR_VERSION,
    },
    composition: {
      mode: "canonical_fallback",
      fallbackReason,
    },
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
    contentHash: artifactContentHash(artifactWithoutHash),
  };
  const validation = validateStoryArtifact(artifact, storySpec, disclosure);
  if (!validation.valid) throw new StoryCompositionError(validation.failureReasons);
  return deepFreeze(artifact);
}

export function validateStoryArtifact(
  artifact: StoryArtifact,
  storySpec: StorySpec,
  disclosure: string,
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

  validateOpeningCopy(artifact.openingCopy, disclosure, failures);

  artifact.beats.forEach((beat, index) => {
    const specBeat = storySpec.arc[index];
    if (!specBeat || beat.role !== EXPECTED_ROLES[index] || beat.role !== specBeat.role) {
      failures.add("role_order_invalid");
      return;
    }
    if (!beat.text.trim() || beat.chunks.length === 0) failures.add("empty_passage");
    if (normalizeText(beat.chunks.join(" ")) !== normalizeText(beat.text)) {
      failures.add("chunk_mismatch");
    }
    if (beat.text !== specBeat.canonicalText) failures.add("canonical_copy_mismatch");
    if (!sameSet(beat.factIds, [...specBeat.requiredFactIds, ...specBeat.optionalFactIds])) {
      failures.add("evidence_mismatch");
    }
    if (!sameSet(beat.entityIds, specBeat.entityIds)) failures.add("entity_mismatch");
    if (!sameSet(beat.quoteIds, specBeat.quoteIds)) failures.add("quote_mismatch");
    if (/\{feeling\}|You wrote:/i.test(beat.text)) failures.add("forbidden_placeholder");
    if (containsDisclosureEcho(beat.text, disclosure)) failures.add("disclosure_echo");
  });

  if (artifact.contentHash !== artifactContentHash(artifact)) {
    failures.add("content_hash_mismatch");
  }

  return { valid: failures.size === 0, failureReasons: [...failures] };
}

// Database JSON is untrusted at the TypeScript boundary. Replay needs no model
// or mutable StorySpec lookup, but it does re-check structure and the content
// hash before any stored prose reaches a route.
export function validateStoredStoryArtifact(value: unknown): StoryArtifact | null {
  if (!isRecord(value)) return null;
  const candidate = value as Partial<StoryArtifact>;
  if (
    candidate.schemaVersion !== STORY_ARTIFACT_SCHEMA_VERSION ||
    typeof candidate.artifactId !== "string" ||
    typeof candidate.storySpecId !== "string" ||
    typeof candidate.storySpecVersion !== "number" ||
    typeof candidate.storySpecSchemaVersion !== "string" ||
    typeof candidate.figureKey !== "string" ||
    typeof candidate.stageId !== "string" ||
    !isRecord(candidate.figure) ||
    !isRecord(candidate.openingCopy) ||
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
  const openingFailures = new Set<ArtifactValidationFailure>();
  validateOpeningCopy(artifact.openingCopy, "", openingFailures);
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
    !isRecord(artifact.recipe.match) ||
    typeof artifact.recipe.match.recipeId !== "string" ||
    artifact.recipe.composerVersion !== STORY_COMPOSER_VERSION ||
    artifact.recipe.validatorVersion !== STORY_ARTIFACT_VALIDATOR_VERSION ||
    !["canonical_fallback", "hybrid"].includes(artifact.composition.mode) ||
    (artifact.composition.fallbackReason !== undefined &&
      ![
        "canonical_only",
        "provider_timeout",
        "provider_error",
        "provider_output_invalid",
        "validator_rejected",
      ].includes(artifact.composition.fallbackReason)) ||
    !Array.isArray(artifact.validation.failureReasons) ||
    artifact.validation.failureReasons.length > 0 ||
    !isIsoTimestamp(artifact.validation.validatedAt) ||
    !isIsoTimestamp(artifact.createdAt) ||
    !/^[0-9a-f]{64}$/.test(artifact.contentHash)
  ) {
    return null;
  }
  for (const [index, beat] of artifact.beats.entries()) {
    if (
      !isRecord(beat) ||
      beat.role !== EXPECTED_ROLES[index] ||
      beat.kind !== (beat.role === "bridge" ? "bridge" : "narrative") ||
      typeof beat.text !== "string" ||
      !beat.text.trim() ||
      !Array.isArray(beat.chunks) ||
      beat.chunks.length === 0 ||
      beat.chunks.some((chunk) => typeof chunk !== "string") ||
      !isStringArray(beat.factIds) ||
      !isStringArray(beat.entityIds) ||
      !isStringArray(beat.quoteIds) ||
      /\{feeling\}|You wrote:/i.test(beat.text) ||
      normalizeText(beat.chunks.join(" ")) !== normalizeText(beat.text)
    ) {
      return null;
    }
  }
  if (artifact.contentHash !== artifactContentHash(artifact)) return null;
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

function artifactContentHash(
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
  disclosure: string,
  failures: Set<ArtifactValidationFailure>,
): void {
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
    prefaceLines.length === 0 ||
    lines.some((line) => !line.trim())
  ) {
    failures.add("opening_copy_invalid");
  }
  if (
    lines.some(
      (line) =>
        /\{feeling\}|You wrote:/i.test(line) || containsDisclosureEcho(line, disclosure),
    )
  ) {
    failures.add("disclosure_echo");
  }
  if (
    lines.some((line) =>
      /\b(?:you (?:will|must|should|need to)|everything will|guarantee|diagnos(?:e|is)|clinically|cure[ds]?)\b/i.test(
        line,
      ),
    )
  ) {
    failures.add("tone_invalid");
  }
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
  return value !== null && typeof value === "object";
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
