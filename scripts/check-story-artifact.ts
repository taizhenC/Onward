import "./_smoke-bootstrap";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FIGURE_STAGES } from "../lib/figures-data";
import {
  composeCanonicalStoryArtifact,
  StoryCompositionError,
  storyArtifactContentHash,
  validateStoredStoryArtifact,
  validateStoryArtifact,
  type StoredStoryArtifactEnvelope,
} from "../lib/story-artifact";
import {
  HYBRID_STORY_ARTIFACT_SCHEMA_VERSION,
  LEGACY_STORY_ARTIFACT_VALIDATOR_VERSION,
  RESONANCE_STORY_ARTIFACT_SCHEMA_VERSION,
  BOUNDARY_STORY_ARTIFACT_SCHEMA_VERSION,
  LEGACY_STORY_ARTIFACT_SCHEMA_VERSION,
} from "../lib/story-artifact-types";
import { buildDraftStorySpec } from "../lib/story-spec";
import {
  RESONANCE_BRIEF_VERSION,
  createResonanceBrief,
} from "../lib/resonance-brief";
import { STORY_PROMPT_VERSION_V1 } from "../lib/llm-recipe-constants";
import {
  DEFAULT_PREFACE_LINES,
  NEUTRAL_EYEBROW,
} from "../lib/opening-copy";
import type { MatchRecipe } from "../lib/types";

const disclosure =
  "My private cobalt compass stopped pointing anywhere after the thing I cannot describe.";
const resonanceBrief = createResonanceBrief(disclosure);

const recipe: MatchRecipe = {
  recipeId: "artifact-contract-test-recipe",
  matchConfigVersion: "test",
  crisisRegexVersion: "test",
  llmProvider: "stub",
  rerankModelId: "stub",
  proseModelId: "stub",
  embeddingModelId: "stub",
  retrievalMode: "keyword",
  storyPromptVersion: STORY_PROMPT_VERSION_V1,
};

function main(): void {
  const failures: string[] = [];
  const artifactIds = new Set<string>();

  for (const stage of FIGURE_STAGES) {
    const spec = buildDraftStorySpec(stage);
    const label = `${stage.figureKey}/${stage.stageId}`;
    const artifact = composeCanonicalStoryArtifact({
      storySpec: spec,
      stage,
      matchRecipe: recipe,
      openingCopy: {
        eyebrow: NEUTRAL_EYEBROW,
        prefaceLines: DEFAULT_PREFACE_LINES,
      },
      framing: "partial",
      resonanceBrief,
      allowDraftSpec: true,
      now: new Date("2026-07-10T12:00:00.000Z"),
    });

    if (artifactIds.has(artifact.artifactId)) failures.push(`${label}: duplicate artifact ID`);
    artifactIds.add(artifact.artifactId);
    if (!validateStoredStoryArtifact(structuredClone(artifact))) {
      failures.push(`${label}: stored artifact integrity check failed`);
    }
    if (!validateStoredStoryArtifact(reverseObjectKeys(artifact))) {
      failures.push(`${label}: jsonb-style key reorder broke the content hash`);
    }
    if (stage === FIGURE_STAGES[0]) {
      const validatorV1Artifact = structuredClone(artifact);
      validatorV1Artifact.recipe.validatorVersion =
        LEGACY_STORY_ARTIFACT_VALIDATOR_VERSION;
      validatorV1Artifact.contentHash =
        storyArtifactContentHash(validatorV1Artifact);
      if (!validateStoredStoryArtifact(validatorV1Artifact)) {
        failures.push(`${label}: bounded validator-v1 artifact no longer replays`);
      }
    }
    if (
      artifact.transparency?.provenance.status !== "review_draft" ||
      artifact.transparency.storySpec.storySpecId !== spec.storySpecId ||
      artifact.transparency.storySpec.version !== spec.version ||
      artifact.transparency.sources.length !== spec.sources.length ||
      !Object.isFrozen(artifact.transparency) ||
      !Object.isFrozen(artifact.transparency.sources)
    ) {
      failures.push(`${label}: draft transparency was absent, misleading, or mutable`);
    }
    const hybridArtifact = structuredClone(artifact);
    hybridArtifact.schemaVersion = HYBRID_STORY_ARTIFACT_SCHEMA_VERSION;
    delete hybridArtifact.transparency;
    hybridArtifact.contentHash = storyArtifactContentHash(hybridArtifact);
    if (
      !validateStoredStoryArtifact(
        hybridArtifact,
        storedEnvelope(hybridArtifact),
      )
    ) {
      failures.push(`${label}: hybrid-era artifact schema no longer replays`);
    }
    const resonanceArtifact = structuredClone(hybridArtifact);
    resonanceArtifact.schemaVersion = RESONANCE_STORY_ARTIFACT_SCHEMA_VERSION;
    delete resonanceArtifact.recipe.hybridTemplatePolicyVersion;
    delete resonanceArtifact.composition.attemptCount;
    resonanceArtifact.contentHash = storyArtifactContentHash(resonanceArtifact);
    if (
      !validateStoredStoryArtifact(
        resonanceArtifact,
        storedEnvelope(resonanceArtifact),
      )
    ) {
      failures.push(`${label}: resonance-era artifact schema no longer replays`);
    }
    const boundaryArtifact = structuredClone(resonanceArtifact);
    boundaryArtifact.schemaVersion = BOUNDARY_STORY_ARTIFACT_SCHEMA_VERSION;
    delete boundaryArtifact.recipe.resonanceBriefVersion;
    boundaryArtifact.contentHash = storyArtifactContentHash(boundaryArtifact);
    if (
      !validateStoredStoryArtifact(
        boundaryArtifact,
        storedEnvelope(boundaryArtifact),
      )
    ) {
      failures.push(`${label}: boundary-era artifact schema no longer replays`);
    }
    const legacy = structuredClone(boundaryArtifact);
    legacy.schemaVersion = LEGACY_STORY_ARTIFACT_SCHEMA_VERSION;
    delete legacy.recipe.boundaryPolicyVersion;
    delete legacy.contentProfile.reviewed;
    legacy.contentHash = storyArtifactContentHash(legacy);
    if (
      !validateStoredStoryArtifact(legacy, storedEnvelope(legacy))
    ) {
      failures.push(`${label}: prior artifact schema no longer replays`);
    }
    if (JSON.stringify(artifact).includes(disclosure)) {
      failures.push(`${label}: raw disclosure entered artifact JSON`);
    }
    const serializedArtifact = JSON.stringify(artifact);
    if (
      artifact.recipe.resonanceBriefVersion !== RESONANCE_BRIEF_VERSION ||
      serializedArtifact.includes('"forbiddenEchoHashes"') ||
      serializedArtifact.includes('"sourceSpanHash"') ||
      serializedArtifact.includes('"emotionalCore"') ||
      serializedArtifact.includes('"situationShape"')
    ) {
      failures.push(`${label}: artifact omitted analyzer version or retained ephemeral brief data`);
    }
    if (artifact.beats.length !== 7 || artifact.beats.some((beat) => beat.chunks.length === 0)) {
      failures.push(`${label}: incomplete reader payload`);
    }

    const tampered = structuredClone(artifact);
    tampered.beats[0].text += " Tampered claim.";
    if (validateStoredStoryArtifact(tampered)) {
      failures.push(`${label}: content-hash tamper was accepted`);
    }
    const detailed = validateStoryArtifact(tampered, spec, resonanceBrief);
    if (
      detailed.valid ||
      !detailed.failureReasons.includes("canonical_copy_mismatch") ||
      !detailed.failureReasons.includes("content_hash_mismatch")
    ) {
      failures.push(`${label}: deterministic validation reasons were incomplete`);
    }
    const malformed = structuredClone(artifact) as unknown as {
      openingCopy: { eyebrow: string; prefaceLines: unknown[] };
    };
    malformed.openingCopy.prefaceLines = [42];
    if (validateStoredStoryArtifact(malformed)) {
      failures.push(`${label}: malformed opening-copy JSON was accepted`);
    }

    if (stage === FIGURE_STAGES[0]) {
      const oversized = structuredClone(artifact);
      for (const beat of oversized.beats) {
        beat.chunks = beat.text.match(/\S+/g) ?? [];
      }
      oversized.contentHash = storyArtifactContentHash(oversized);
      const oversizedValidation = validateStoryArtifact(
        oversized,
        spec,
        resonanceBrief,
      );
      if (
        oversizedValidation.valid ||
        !oversizedValidation.failureReasons.includes(
          "passage_limit_exceeded",
        ) ||
        oversizedValidation.failureReasons.includes("empty_passage") ||
        oversizedValidation.failureReasons.includes("chunk_mismatch") ||
        validateStoredStoryArtifact(oversized)
      ) {
        failures.push(
          `${label}: artifact exceeding the 64-passage telemetry ceiling was accepted`,
        );
      }
    }
  }

  const privacyFixture = FIGURE_STAGES[0];
  const privacySpec = buildDraftStorySpec(privacyFixture);
  try {
    composeCanonicalStoryArtifact({
      storySpec: privacySpec,
      stage: privacyFixture,
      matchRecipe: recipe,
      openingCopy: {
        eyebrow: disclosure,
        prefaceLines: ["This story is true."],
      },
      framing: "partial",
      resonanceBrief,
      allowDraftSpec: true,
    });
    failures.push("opening privacy: disclosure echo was accepted");
  } catch (error) {
    if (!(error instanceof StoryCompositionError) || !error.reasons.includes("disclosure_echo")) {
      failures.push("opening privacy: rejection did not use disclosure_echo enum");
    }
  }

  const migration = readFileSync(
    fileURLToPath(new URL("../supabase/migrations/0005_story_artifacts.sql", import.meta.url)),
    "utf8",
  );
  const requiredSql = [
    "create or replace function create_story_session",
    "for share",
    "story_artifacts_immutable",
    "sessions_artifact_pointer_immutable",
    "session_id text not null unique references sessions (session_id) on delete cascade",
    "deferrable initially deferred",
    "constraint sessions_story_artifact_fk",
    "revoke insert on table sessions from service_role",
    "p_artifact #> '{recipe,match}' is distinct from p_match_recipe",
    "revoke all on table story_artifacts from service_role",
  ];
  for (const requirement of requiredSql) {
    if (!migration.toLowerCase().includes(requirement.toLowerCase())) {
      failures.push(`migration contract missing: ${requirement}`);
    }
  }
  if (/grant\s+[^;]*insert[^;]*on\s+table\s+story_artifacts/i.test(migration)) {
    failures.push("migration allows direct StoryArtifact inserts outside atomic RPC");
  }
  const sessionInsert = migration.indexOf("insert into sessions");
  const artifactInsert = migration.indexOf("insert into story_artifacts");
  if (sessionInsert < 0 || artifactInsert < 0 || sessionInsert > artifactInsert) {
    failures.push("migration must contain session-first, artifact-second RPC inserts");
  }
  try {
    composeCanonicalStoryArtifact({
      storySpec: privacySpec,
      stage: privacyFixture,
      matchRecipe: recipe,
      openingCopy: {
        eyebrow: "Everything will be cured",
        prefaceLines: ["You should do what they did."],
      },
      framing: "partial",
      resonanceBrief,
      allowDraftSpec: true,
    });
    failures.push("opening tone: prescriptive promise was accepted");
  } catch (error) {
    if (!(error instanceof StoryCompositionError) || !error.reasons.includes("tone_invalid")) {
      failures.push("opening tone: rejection did not use tone_invalid enum");
    }
  }

  const playbackSource = readFileSync(
    fileURLToPath(new URL("../lib/story-playback.ts", import.meta.url)),
    "utf8",
  ).replace(/\s+/g, " ");
  const databaseFigureSource = readFileSync(
    fileURLToPath(new URL("../lib/figures-source-db.ts", import.meta.url)),
    "utf8",
  ).replace(/\s+/g, " ");
  const legacyLoaderStart = databaseFigureSource.indexOf(
    "export async function loadOwnedLegacyDbStage",
  );
  const legacyLoaderEnd = databaseFigureSource.indexOf(
    "export function resetDbFigureCache",
    legacyLoaderStart,
  );
  const legacyLoader =
    legacyLoaderStart >= 0 && legacyLoaderEnd > legacyLoaderStart
      ? databaseFigureSource.slice(legacyLoaderStart, legacyLoaderEnd)
      : "";
  if (
    !playbackSource.includes("getOwnedLegacyPlaybackStage({") ||
    !playbackSource.includes("sessionId: session.sessionId") ||
    !playbackSource.includes("userId: session.userId") ||
    !legacyLoader.includes('.eq("session_id", input.sessionId)') ||
    !legacyLoader.includes('.eq("user_id", input.userId)') ||
    !legacyLoader.includes('.is("story_artifact_id", null)') ||
    !legacyLoader.includes("ownedSession.figure_key !== input.figureKey") ||
    !legacyLoader.includes("ownedSession.stage_id !== input.stageId") ||
    legacyLoader.includes('.eq("status", "published")') ||
    !databaseFigureSource.includes(
      '.from("figure_stages").select("*").eq("status", "published")',
    )
  ) {
    failures.push(
      "legacy playback must owner-bind one pre-artifact session without reopening draft stages to matching",
    );
  }

  console.log("Onward StoryArtifact validator");
  console.log("==============================");
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`${failures.length} artifact contract failure(s).`);
    process.exit(1);
  }
  console.log(`PASS ${FIGURE_STAGES.length}/${FIGURE_STAGES.length} complete artifacts validated`);
  console.log(`PASS ${FIGURE_STAGES.length}/${FIGURE_STAGES.length} disclosure-exclusion checks`);
  console.log(`PASS ${FIGURE_STAGES.length}/${FIGURE_STAGES.length} tamper attempts rejected`);
  console.log("PASS generated opening privacy and tone rejections use closed reason enums");
  console.log("PASS static migration shape includes RPC-only immutable/bound persistence");
  console.log("PASS owned legacy playback remains readable outside the public draft catalog");
}

function storedEnvelope(
  artifact: Readonly<{
    artifactId: string;
    schemaVersion: string;
    contentHash: string;
  }>,
): StoredStoryArtifactEnvelope {
  return {
    artifactId: artifact.artifactId,
    schemaVersion: artifact.schemaVersion,
    contentHash: artifact.contentHash,
  };
}

function reverseObjectKeys<T>(value: T): T {
  if (Array.isArray(value)) return value.map(reverseObjectKeys) as T;
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value).reverse()) {
      result[key] = reverseObjectKeys((value as Record<string, unknown>)[key]);
    }
    return result as T;
  }
  return value;
}

main();
