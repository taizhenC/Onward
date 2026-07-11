import type { BeatKind, BeatRole, Framing, MatchRecipe, OpeningCopy } from "./types";
import type { ContentFlag } from "./story-spec-types";

export const STORY_ARTIFACT_SCHEMA_VERSION = "story-artifact-v3-2026-07";
export const BOUNDARY_STORY_ARTIFACT_SCHEMA_VERSION = "story-artifact-v2-2026-07";
export const LEGACY_STORY_ARTIFACT_SCHEMA_VERSION = "story-artifact-v1-2026-07";
export const STORY_COMPOSER_VERSION = "canonical-composer-v1-2026-07";
export const STORY_ARTIFACT_VALIDATOR_VERSION = "artifact-validator-v1-2026-07";

export type ArtifactValidationFailure =
  | "schema_invalid"
  | "story_spec_invalid"
  | "resonance_brief_invalid"
  | "recipe_invalid"
  | "identity_mismatch"
  | "role_order_invalid"
  | "empty_passage"
  | "chunk_mismatch"
  | "evidence_mismatch"
  | "entity_mismatch"
  | "quote_mismatch"
  | "canonical_copy_mismatch"
  | "disclosure_echo"
  | "forbidden_placeholder"
  | "opening_copy_invalid"
  | "tone_invalid"
  | "content_profile_mismatch"
  | "boundary_violation"
  | "content_hash_mismatch";

export type ArtifactFallbackReason =
  | "canonical_only"
  | "provider_timeout"
  | "provider_error"
  | "provider_output_invalid"
  | "validator_rejected";

export type StoryArtifactBeat = {
  role: BeatRole;
  kind: BeatKind;
  text: string;
  chunks: string[];
  factIds: string[];
  entityIds: string[];
  quoteIds: string[];
};

export type StoryArtifact = {
  artifactId: string;
  schemaVersion: string;
  storySpecId: string;
  storySpecVersion: number;
  storySpecSchemaVersion: string;
  figureKey: string;
  stageId: string;
  figure: {
    displayName: string;
    birthYear?: number;
    deathYear?: number;
    ageMin: number;
    ageMax: number;
  };
  contentProfile: {
    intensity: "gentle" | "moderate" | "direct";
    flags: ContentFlag[];
    contentNote: string;
    reviewed?: boolean;
  };
  openingCopy: OpeningCopy;
  framing: Framing;
  recipe: {
    match: MatchRecipe;
    composerVersion: string;
    validatorVersion: string;
    boundaryPolicyVersion?: string;
    resonanceBriefVersion?: string;
  };
  composition: {
    mode: "canonical_fallback" | "hybrid";
    fallbackReason?: ArtifactFallbackReason;
  };
  beats: StoryArtifactBeat[];
  validation: {
    status: "validated";
    failureReasons: ArtifactValidationFailure[];
    validatedAt: string;
  };
  createdAt: string;
  contentHash: string;
};

export type StoryArtifactValidation = {
  valid: boolean;
  failureReasons: ArtifactValidationFailure[];
};
