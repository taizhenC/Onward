import "./_smoke-bootstrap";
import { spawnSync } from "node:child_process";
import {
  generateKeyPairSync,
  sign as signMessage,
  type KeyObject,
} from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FIGURE_STAGES } from "../lib/figures-data";
import {
  HYBRID_BRIDGE_TEMPLATE_IDS,
  HYBRID_PLAN_SCHEMA_VERSION,
  HYBRID_TRANSITION_TEMPLATE_IDS,
} from "../lib/hybrid-composition";
import {
  RESONANCE_BRIEF_VERSION,
  createResonanceBrief,
} from "../lib/resonance-brief";
import {
  DEFAULT_PREFACE_LINES,
  NEUTRAL_EYEBROW,
  toEyebrowProviderSurface,
  toEyebrowSurface,
} from "../lib/opening-copy";
import {
  buildPrefacePlanRequest,
  firstCompatiblePrefacePlan,
  renderPersonalizedOpeningCopy,
} from "../lib/preface-plan";
import {
  STORY_PROMPT_VERSION_V1,
  STORY_PROMPT_VERSION_V2,
} from "../lib/llm-recipe-constants";
import { MATCH_RECOVERY_POLICY_VERSION } from "../lib/match-recovery";
import { crisisRegexVersion } from "../lib/safety";
import { STORY_BOUNDARY_POLICY_VERSION } from "../lib/story-boundaries";
import {
  composeCanonicalStoryArtifact,
  composeHybridStoryArtifact,
  storyArtifactContentHash,
} from "../lib/story-artifact";
import {
  HYBRID_STORY_ARTIFACT_SCHEMA_VERSION,
  STORY_ARTIFACT_VALIDATOR_VERSION,
  STORY_COMPOSER_VERSION,
  type StoryArtifact,
} from "../lib/story-artifact-types";
import {
  STORY_SPEC_SCHEMA_VERSION,
  type StoryBeatSpec,
  type StorySpec,
} from "../lib/story-spec-types";
import type { MatchRecipe } from "../lib/types";
import {
  canonicalJson,
  sha256File,
  sha256Text,
} from "./recipe-evidence";
import {
  isValidAddedHistoryEvidence,
  storyQualityEvidenceHistoryPath,
} from "./check-story-quality-immutability";
import {
  CRITICAL_FAILURE_CATEGORIES,
  RUBRIC_DIMENSIONS,
  StoryQualityError,
  STORY_QUALITY_PROTOCOL_PATH,
  evaluateStoryQualityPacket,
  loadStoryQualityPolicy,
  parseStoryQualityEvidence,
  parseStoryQualityPacket,
  parseStoryQualityPolicy,
  storyQualityBenchmarkManifestSha256,
  storyQualityCustodianKeyId,
  storyQualityCustodianSigningMessage,
  storyQualityEvidenceId,
  storyQualityInputCommitment,
  storyQualityPolicySha256,
  storyQualityReviewAssignmentSha256,
  storyQualityReviewMaterialSha256,
  writeStoryQualityEvidence,
  type QualityRecipeRegistry,
  type StoryQualityArm,
  type StoryQualityCustodianAttestation,
  type StoryQualityEvidence,
  type StoryQualityObservation,
  type StoryQualityPacket,
  type StoryQualityReviewAssignment,
} from "./story-quality-evidence";

const HMAC_SECRET =
  "onward-story-quality-contract-secret-2026-07-32-bytes";
const COMPLETE_PROVENANCE = {
  gitCommit: "a".repeat(40),
  deploymentId: "quality-contract-deployment",
  inputTreeSha256: "b".repeat(64),
} as const;
const FIXED_NOW = new Date("2026-07-05T01:00:00.000Z");
const GENERATION_DEPLOYMENT_VERSION =
  "quality-generation-deployment-v1";
const DATASET_VERSION = "quality-dataset-v1";
const DATASET_SHA256 = sha256Text("quality protected dataset");

type Mutable<T> = {
  -readonly [Key in keyof T]: T[Key] extends readonly (infer Entry)[]
    ? Mutable<Entry>[]
    : T[Key] extends object
      ? Mutable<T[Key]>
      : T[Key];
};

type SyntheticRecipeManifest = {
  recipeId: string;
  manifestSha256: string;
  retrievalMode: "keyword" | "facetsrag";
  matchConfigVersion: string;
  librarySnapshotSha256: string;
  datasetVersion: string;
  llmProvider: "real";
  rerankModelId: string;
  proseModelId: string;
  embeddingModelId: string | null;
  rerankPromptVersion: string;
  storyPromptVersion: string;
  rerankTemperature: number;
  rerankReasoningEffort: string;
  rerankTopK: number;
  storyTemperature: number;
  storyComposerMode: "canonical" | "hybrid";
  hybridStoryComposerEnabled: boolean;
  composerVersion: string;
  validatorVersion: string;
  storySpecSchemaVersion: string;
  boundaryPolicyVersion: string;
  resonanceBriefVersion: string;
};

type PacketOptions = {
  count?: number;
  visibility?: "synthetic" | "protected_holdout";
  purpose?: StoryQualityPacket["run"]["purpose"];
  candidateScore?: number;
  candidateComposition?:
    | "hybrid"
    | "canonical_fallback"
    | "opening"
    | "opening_fallback";
  candidateRecipe?: SyntheticRecipeManifest;
  candidatePersonalizationAttempted?: boolean;
  disclosure?: string;
};

type ReviewBindingContext = {
  benchmarkVersion: string;
  benchmarkManifestSha256: string;
  runId: string;
  analysisPlanSha256: string;
  caseInputCommitment: string;
  armId: string;
  recipeManifestSha256: string;
  policyVersion: string;
  policySha256: string;
  protocolVersion: string;
  protocolSha256: string;
};

const baselineRecipe = createRecipe("quality-baseline-v1", false);
const candidateRecipe = createRecipe("quality-candidate-v1", true);
const openingRecipe = createRecipe(
  "quality-opening-v2",
  false,
  STORY_PROMPT_VERSION_V2,
);
const unsupportedOpeningHybridRecipe = createRecipe(
  "quality-opening-hybrid-unsupported",
  true,
  STORY_PROMPT_VERSION_V2,
);
const registry: QualityRecipeRegistry = {
  datasets: [
    {
      version: DATASET_VERSION,
      sha256: DATASET_SHA256,
      visibility: "protected_holdout",
    },
  ],
  recipes: [baselineRecipe, candidateRecipe],
};
const openingRegistry: QualityRecipeRegistry = {
  ...registry,
  recipes: [baselineRecipe, openingRecipe],
};
const unsupportedOpeningHybridRegistry: QualityRecipeRegistry = {
  ...registry,
  recipes: [baselineRecipe, unsupportedOpeningHybridRecipe],
};

let assertionCount = 0;
const failures: string[] = [];

function main(): void {
  const policy = loadStoryQualityPolicy();
  check(
    policy.schemaVersion === "story-quality-policy-v1" &&
      Object.isFrozen(policy) &&
      RUBRIC_DIMENSIONS.length === 8 &&
      CRITICAL_FAILURE_CATEGORIES.length === 21,
    "the immutable release policy did not load",
  );

  const smallPacket = buildPacket();
  check(
    smallPacket.arms.every((arm) =>
      arm.observations.every((observation) =>
        [
          ...observation.expertReviews,
          ...observation.targetReaderReviews,
        ].every(
          (review) =>
            Object.isFrozen(review.assignment) &&
            review.assignment.assignmentSha256 ===
              storyQualityReviewAssignmentSha256(
                review.assignment,
              ),
        ),
      ),
    ),
    "review assignments were not exact, frozen, and hash-bound",
  );
  const parsedPacket = parseStoryQualityPacket(smallPacket, policy);
  check(
    parsedPacket.benchmark.cases.length === 1 &&
      parsedPacket.arms.length === 2,
    "the valid synthetic review packet did not parse",
  );
  const smallEvidence = evaluate(smallPacket);
  check(
    smallEvidence.status === "incomplete" &&
      smallEvidence.incompleteReasons.includes(
        "synthetic_or_non_holdout",
      ),
    "synthetic evidence was able to become promotion-complete",
  );
  const roundTrip = parseStoryQualityEvidence(
    JSON.parse(JSON.stringify(smallEvidence)) as unknown,
  );
  check(
    canonicalJson(roundTrip) === canonicalJson(smallEvidence),
    "aggregate evidence did not round-trip through its closed parser",
  );

  checkExactSchemas(smallPacket, smallEvidence);
  checkCommitmentAndPrivacy(smallPacket);
  checkContentBindings(smallPacket);
  checkOpeningPersonalizationModes();
  checkCoverageAndQualityGates(smallPacket, smallEvidence);
  checkPolicyAndEvidenceTamper(policy, smallEvidence);
  checkSafeAggregate(smallPacket, smallEvidence);
  checkHistoryAdmission(smallEvidence);
  checkExclusiveWriter(smallEvidence);
  checkRunnerOutput();
  checkReleaseScale(policy);

  if (failures.length > 0) {
    failures.forEach((failure) => console.error(`FAIL ${failure}`));
    console.error(
      `Story-quality benchmark contract failed (${failures.length}/${assertionCount}).`,
    );
    process.exit(1);
  }
  console.log(
    `Story-quality benchmark contract: PASS (${assertionCount} assertions)`,
  );
}

function checkExactSchemas(
  packet: StoryQualityPacket,
  evidence: StoryQualityEvidence,
): void {
  const unknownPacket = mutableClone(packet);
  addUnknownKey(unknownPacket, "unexpectedPacketField");
  expectQualityError(
    "packet_invalid",
    () => parseStoryQualityPacket(unknownPacket),
    "packet schema accepted an unknown key",
  );

  const unknownArtifact = mutableClone(packet);
  addUnknownKey(
    candidateObservation(unknownArtifact).artifact,
    "unexpectedArtifactField",
  );
  expectQualityError(
    "packet_invalid",
    () => parseStoryQualityPacket(unknownArtifact),
    "artifact schema accepted an unknown key",
  );

  const unknownSpec = mutableClone(packet);
  addUnknownKey(
    candidateObservation(unknownSpec).storySpec,
    "unexpectedSpecField",
  );
  expectQualityError(
    "packet_invalid",
    () => parseStoryQualityPacket(unknownSpec),
    "StorySpec schema accepted an unknown key",
  );

  const unknownReview = mutableClone(packet);
  addUnknownKey(
    candidateObservation(unknownReview).expertReviews[0],
    "unexpectedReviewField",
  );
  expectQualityError(
    "packet_invalid",
    () => parseStoryQualityPacket(unknownReview),
    "review schema accepted an unknown key",
  );

  const unknownOutcome = mutableClone(packet);
  addUnknownKey(
    candidateObservation(unknownOutcome).outcome,
    "unexpectedOutcomeField",
  );
  expectQualityError(
    "packet_invalid",
    () => parseStoryQualityPacket(unknownOutcome),
    "outcome schema accepted an unknown key",
  );

  const unknownTransparency = mutableClone(packet);
  addUnknownKey(
    (
      candidateObservation(unknownTransparency).artifact
        .transparency as unknown as {
        rationale: Record<string, unknown>;
      }
    ).rationale,
    "unexpectedRationaleField",
  );
  expectQualityError(
    "packet_invalid",
    () => parseStoryQualityPacket(unknownTransparency),
    "nested artifact transparency accepted an unknown key",
  );

  const unknownFact = mutableClone(packet);
  addUnknownKey(
    candidateObservation(unknownFact).storySpec.facts[0],
    "unexpectedFactField",
  );
  expectQualityError(
    "packet_invalid",
    () => parseStoryQualityPacket(unknownFact),
    "nested StorySpec fact accepted an unknown key",
  );

  const unknownScores = mutableClone(packet);
  addUnknownKey(
    candidateObservation(unknownScores).expertReviews[0].scores,
    "unexpectedScoreField",
  );
  expectQualityError(
    "packet_invalid",
    () => parseStoryQualityPacket(unknownScores),
    "nested review scores accepted an unknown key",
  );

  const unknownEvidence = mutableClone(evidence);
  addUnknownKey(unknownEvidence, "unexpectedEvidenceField");
  expectQualityError(
    "evidence_invalid",
    () => parseStoryQualityEvidence(unknownEvidence),
    "evidence schema accepted an unknown key",
  );
}

function checkCommitmentAndPrivacy(packet: StoryQualityPacket): void {
  expectQualityError(
    "privacy_invalid",
    () => storyQualityInputCommitment("private words", "too-short"),
    "a short HMAC secret was accepted",
  );

  const commitmentTamper = mutableClone(packet);
  commitmentTamper.benchmark.cases[0].inputCommitment = `hmac-sha256:story-quality-case-v1:${"0".repeat(64)}`;
  refreshBenchmarkManifest(commitmentTamper);
  expectQualityError(
    "privacy_invalid",
    () => evaluate(commitmentTamper),
    "a tampered disclosure commitment was accepted",
  );

  const boundaryTamper = mutableClone(packet);
  (
    boundaryTamper.benchmark.cases[0]! as unknown as Record<
      string,
      unknown
    >
  ).boundaries = {
    maxIntensity: "gentle",
    excludedFlags: [],
  };
  expectQualityError(
    "packet_invalid",
    () => evaluate(boundaryTamper),
    "a post-freeze boundary change was not caught by the manifest",
  );

  const disclosure = packet.benchmark.cases[0].disclosure;
  const words = disclosure.split(/\s+/);
  const echoCases = [
    ["direct", disclosure],
    ["seven-word", words.slice(0, 7).join(" ")],
    ["late", words.slice(-7).join(" ")],
  ] as const;
  for (const [name, echo] of echoCases) {
    const echoPacket = mutableClone(packet);
    const observation = candidateObservation(echoPacket);
    observation.artifact.figure.displayName = echo;
    sealArtifact(observation);
    expectQualityError(
      "privacy_invalid",
      () => evaluate(echoPacket),
      `${name} disclosure echo was accepted`,
    );
  }

  const shortStorySpecEcho = buildPacket({
    disclosure: "No invented dialogue",
  });
  expectQualityError(
    "privacy_invalid",
    () => evaluate(shortStorySpecEcho),
    "a full StorySpec short-disclosure echo was accepted",
  );

  const sensitiveShortEcho = mutableClone(
    buildPacket({ disclosure: "suicidal!!" }),
  );
  candidateObservation(
    sensitiveShortEcho,
  ).storySpec.episode.throughLine = "suicidal";
  sealStorySpec(candidateObservation(sensitiveShortEcho));
  expectQualityError(
    "privacy_invalid",
    () => evaluate(sensitiveShortEcho),
    "a sensitive short disclosure echo was accepted",
  );

  const confusableEcho = mutableClone(packet);
  candidateObservation(
    confusableEcho,
  ).storySpec.episode.throughLine = words
    .slice(0, 7)
    .join(" ")
    .replaceAll("e", "е")
    .replaceAll("o", "о");
  sealStorySpec(candidateObservation(confusableEcho));
  expectQualityError(
    "privacy_invalid",
    () => evaluate(confusableEcho),
    "a Unicode-confusable StorySpec disclosure echo was accepted",
  );

  const crossCaseEcho = mutableClone(buildPacket({ count: 2 }));
  candidateObservation(
    crossCaseEcho,
    0,
  ).storySpec.episode.throughLine =
    crossCaseEcho.benchmark.cases[1].disclosure;
  sealStorySpec(candidateObservation(crossCaseEcho, 0));
  expectQualityError(
    "privacy_invalid",
    () => evaluate(crossCaseEcho),
    "one benchmark case could echo another case's disclosure",
  );

  for (const identifier of ["benchmarkVersion", "runId"] as const) {
    const identifierEcho = mutableClone(
      buildPacket({ disclosure: "private-token-2026" }),
    );
    if (identifier === "benchmarkVersion") {
      identifierEcho.benchmark.benchmarkVersion =
        "private-token-2026";
    } else {
      identifierEcho.run.runId = "private-token-2026";
    }
    refreshBenchmarkManifest(identifierEcho);
    expectQualityError(
      "privacy_invalid",
      () => evaluate(identifierEcho),
      `a disclosure escaped through public ${identifier}`,
    );
  }

  const duplicateInput = mutableClone(buildPacket({ count: 2 }));
  duplicateInput.benchmark.cases[1].disclosure =
    duplicateInput.benchmark.cases[0].disclosure;
  duplicateInput.benchmark.cases[1].inputCommitment =
    duplicateInput.benchmark.cases[0].inputCommitment;
  refreshBenchmarkManifest(duplicateInput);
  expectQualityError(
    "packet_invalid",
    () => evaluate(duplicateInput),
    "the same protected input was admitted twice",
  );
}

function checkContentBindings(packet: StoryQualityPacket): void {
  const artifactBinding = mutableClone(packet);
  const artifactObservation = candidateObservation(artifactBinding);
  artifactObservation.artifact.storySpecId =
    "quality-spec-different-identity";
  sealArtifact(artifactObservation);
  expectQualityError(
    "content_invalid",
    () => evaluate(artifactBinding),
    "artifact-to-StorySpec identity tamper was accepted",
  );

  const specBinding = mutableClone(packet);
  const specObservation = candidateObservation(specBinding);
  specObservation.storySpec.storySpecId =
    "quality-spec-different-identity";
  sealStorySpec(specObservation);
  expectQualityError(
    "content_invalid",
    () => evaluate(specBinding),
    "StorySpec-to-artifact identity tamper was accepted",
  );

  const documentHash = mutableClone(packet);
  candidateObservation(documentHash).artifactDocumentSha256 =
    "0".repeat(64);
  expectQualityError(
    "content_invalid",
    () => evaluate(documentHash),
    "artifact document hash tamper was accepted",
  );

  const recipeBinding = mutableClone(packet);
  candidateArm(recipeBinding).recipeManifestSha256 = "0".repeat(64);
  expectQualityError(
    "binding_invalid",
    () => evaluate(recipeBinding),
    "arm-to-registry recipe binding tamper was accepted",
  );

  const recipeAxis = mutableClone(packet);
  const recipeAxisObservation = candidateObservation(recipeAxis);
  recipeAxisObservation.artifact.recipe.match.rerankTopK =
    (recipeAxisObservation.artifact.recipe.match.rerankTopK ?? 0) + 1;
  sealArtifact(recipeAxisObservation);
  expectQualityError(
    "binding_invalid",
    () => evaluate(recipeAxis),
    "an artifact recipe axis diverged from its registered manifest",
  );

  const draftSpec = mutableClone(packet);
  const draftObservation = candidateObservation(draftSpec);
  draftObservation.storySpec.status = "draft";
  sealStorySpec(draftObservation);
  expectQualityError(
    "content_invalid",
    () => evaluate(draftSpec),
    "a draft StorySpec entered benchmark evidence",
  );

  const legacyArtifact = mutableClone(packet);
  const legacyObservation = candidateObservation(legacyArtifact);
  legacyObservation.artifact.schemaVersion =
    HYBRID_STORY_ARTIFACT_SCHEMA_VERSION;
  sealArtifact(legacyObservation);
  expectQualityError(
    "content_invalid",
    () => evaluate(legacyArtifact),
    "a legacy artifact entered benchmark evidence",
  );
}

function checkOpeningPersonalizationModes(): void {
  const personalizedPacket = buildPacket({
    candidateRecipe: openingRecipe,
    candidateComposition: "opening",
  });
  const personalizedEvidence = evaluate(
    personalizedPacket,
    undefined,
    openingRegistry,
  );
  const personalizedArm = candidateEvidence(personalizedEvidence);
  check(
    personalizedArm.personalizationAttempted &&
      personalizedArm.outcomes.firstPassValidation.numerator === 1 &&
      personalizedArm.outcomes.canonicalFallback?.numerator === 0 &&
      personalizedArm.outcomes.canonicalFallback.denominator === 1,
    "a valid preface-only candidate was not measured as first-pass personalization",
  );

  const fallbackPacket = buildPacket({
    candidateRecipe: openingRecipe,
    candidateComposition: "opening_fallback",
  });
  const fallbackEvidence = evaluate(
    fallbackPacket,
    undefined,
    openingRegistry,
  );
  check(
    candidateEvidence(fallbackEvidence).outcomes.canonicalFallback
      ?.numerator === 1 &&
      candidateEvidence(fallbackEvidence).outcomes
        .firstPassValidation.numerator === 0,
    "a universal v2 opening was not measured as a personalization fallback",
  );

  const falseFlag = mutableClone(personalizedPacket);
  candidateArm(falseFlag).personalizationAttempted = false;
  expectQualityError(
    "binding_invalid",
    () => evaluate(falseFlag, undefined, openingRegistry),
    "a v2 opening arm suppressed its personalization-attempt flag",
  );

  const mismatchedOutcome = mutableClone(personalizedPacket);
  candidateObservation(
    mismatchedOutcome,
  ).outcome.compositionOutcome = "canonical_fallback";
  expectQualityError(
    "binding_invalid",
    () => evaluate(mismatchedOutcome, undefined, openingRegistry),
    "a personalized v2 opening claimed the fallback outcome",
  );

  const unsupportedHybrid = buildPacket({
    candidateRecipe: unsupportedOpeningHybridRecipe,
    candidateComposition: "hybrid",
  });
  expectQualityError(
    "binding_invalid",
    () =>
      evaluate(
        unsupportedHybrid,
        undefined,
        unsupportedOpeningHybridRegistry,
      ),
    "the unsupported v2-opening plus hybrid-composer combination was admitted",
  );
}

function checkCoverageAndQualityGates(
  packet: StoryQualityPacket,
  evidence: StoryQualityEvidence,
): void {
  check(
    evidence.arms.find((arm) => arm.role === "baseline")?.outcomes
      .canonicalFallback === null,
    "canonical baseline fallback was not represented as N/A",
  );

  const duplicateReviewers = mutableClone(packet);
  const duplicateObservation = candidateObservation(duplicateReviewers);
  setReviewerId(
    duplicateObservation.expertReviews[1],
    duplicateObservation.expertReviews[0].reviewerId,
  );
  const duplicateEvidence = evaluate(duplicateReviewers);
  check(
    duplicateEvidence.status === "incomplete" &&
      !candidateEvidence(duplicateEvidence).checks.reviewerIndependence &&
      duplicateEvidence.incompleteReasons.includes(
        "reviewer_independence",
      ),
    "duplicate reviewers did not make evidence incomplete",
  );

  const unblinded = mutableClone(packet);
  candidateObservation(unblinded).targetReaderReviews[0].blindToRecipe =
    false;
  const unblindedEvidence = evaluate(unblinded);
  check(
    unblindedEvidence.status === "incomplete" &&
      !candidateEvidence(unblindedEvidence).checks
        .reviewerIndependence,
    "missing reviewer blinding did not make evidence incomplete",
  );

  const crossArmReviewer = mutableClone(packet);
  setReviewerId(
    candidateObservation(crossArmReviewer).expertReviews[0],
    baselineObservation(crossArmReviewer).expertReviews[0].reviewerId,
  );
  const crossArmReviewerEvidence = evaluate(crossArmReviewer);
  check(
    crossArmReviewerEvidence.status === "incomplete" &&
      !crossArmReviewerEvidence.checks.reviewerIndependence &&
      crossArmReviewerEvidence.incompleteReasons.includes(
        "reviewer_independence",
      ),
    "the same reviewer could score the same case across recipe arms",
  );

  const missingReviews = mutableClone(packet);
  const missingReviewObservation = candidateObservation(missingReviews);
  missingReviewObservation.expertReviews.splice(1);
  missingReviewObservation.targetReaderReviews.splice(0);
  const missingReviewEvidence = evaluate(missingReviews);
  check(
    missingReviewEvidence.status === "incomplete" &&
      !candidateEvidence(missingReviewEvidence).checks.reviewCoverage &&
      missingReviewEvidence.incompleteReasons.includes("review_coverage"),
    "missing reviews did not make evidence incomplete",
  );

  const insufficientCoverage = mutableClone(packet);
  for (const arm of insufficientCoverage.arms) {
    arm.observations[0].outcome.feedbackVerdict = "no_response";
  }
  const insufficientEvidence = evaluate(insufficientCoverage);
  check(
    insufficientEvidence.status === "incomplete" &&
      insufficientEvidence.incompleteReasons.includes("sample_size") &&
      insufficientEvidence.incompleteReasons.includes(
        "feedback_coverage",
      ),
    "insufficient sample or feedback coverage was not incomplete",
  );

  const withdrawnConsent = mutableClone(packet);
  withdrawnConsent.benchmark.cases[0].consented = false;
  refreshBenchmarkManifest(withdrawnConsent);
  const withdrawnEvidence = evaluate(withdrawnConsent);
  check(
    withdrawnEvidence.status === "incomplete" &&
      withdrawnEvidence.incompleteReasons.includes("consent") &&
      withdrawnEvidence.arms.every((arm) => !arm.checks.consent),
    "withdrawn consent did not make every paired arm incomplete",
  );

  const inconsistentDiagnosis = mutableClone(packet);
  candidateObservation(
    inconsistentDiagnosis,
  ).expertReviews[0].scores.non_diagnostic_language = 1;
  expectQualityError(
    "packet_invalid",
    () => parseStoryQualityPacket(inconsistentDiagnosis),
    "a diagnosis-level score was accepted without a diagnosis flag",
  );

  const inconsistentFacts = mutableClone(packet);
  candidateObservation(
    inconsistentFacts,
  ).expertReviews[0].scores.factual_support = 1;
  expectQualityError(
    "packet_invalid",
    () => parseStoryQualityPacket(inconsistentFacts),
    "a failed factual-support score was accepted without a factual flag",
  );

  const critical = mutableClone(packet);
  candidateObservation(critical).expertReviews[0].criticalFailures = [
    "unsupported_person",
  ];
  const criticalEvidence = evaluate(critical);
  check(
    criticalEvidence.status === "fail" &&
      criticalEvidence.failureReasons.includes("critical_failure") &&
      !criticalEvidence.checks.noCriticalFailures,
    "a critical flag did not force failure despite high scores",
  );

  const weakRubric = mutableClone(packet);
  setObservationScores(candidateObservation(weakRubric), 2);
  const weakRubricEvidence = evaluate(weakRubric);
  check(
    !candidateEvidence(weakRubricEvidence).checks.rubricFloors &&
      weakRubricEvidence.failureReasons.includes("rubric_floor"),
    "weak rubric scores passed the absolute quality gate",
  );

  const weakOutcome = mutableClone(packet);
  const weakOutcomeObservation = candidateObservation(weakOutcome);
  weakOutcomeObservation.outcome.finalBridgeCompleted = false;
  weakOutcomeObservation.outcome.feedbackVerdict = "not_close";
  const weakOutcomeEvidence = evaluate(weakOutcome);
  check(
    !candidateEvidence(weakOutcomeEvidence).checks.outcomeFloors &&
      weakOutcomeEvidence.failureReasons.includes("felt_close_rate") &&
      weakOutcomeEvidence.failureReasons.includes("completion_rate"),
    "weak reader outcomes passed the absolute outcome gate",
  );

  const fallbackPacket = buildPacket({
    candidateComposition: "canonical_fallback",
  });
  const fallbackEvidence = evaluate(fallbackPacket);
  check(
    candidateEvidence(fallbackEvidence).outcomes.canonicalFallback
      ?.passed === false &&
      fallbackEvidence.failureReasons.includes("fallback_rate"),
    "excessive personalized-arm fallback passed its gate",
  );

  const regressionPacket = buildPacket({ candidateScore: 4 });
  const regressionEvidence = evaluate(regressionPacket);
  check(
    candidateEvidence(regressionEvidence).checks.rubricFloors &&
      !regressionEvidence.comparison.passed &&
      regressionEvidence.failureReasons.includes("baseline_regression"),
    "an absolute-pass but materially regressed candidate passed non-inferiority",
  );
}

function checkPolicyAndEvidenceTamper(
  policy: ReturnType<typeof loadStoryQualityPolicy>,
  evidence: StoryQualityEvidence,
): void {
  const weakMinimum = mutableClone(policy);
  weakMinimum.minimums.targetAudienceSessions = 149;
  expectQualityError(
    "policy_invalid",
    () => parseStoryQualityPolicy(weakMinimum),
    "policy minimums were weakened",
  );

  const weakMaximum = mutableClone(policy);
  weakMaximum.maximums.canonicalFallbackRate = 0.06;
  expectQualityError(
    "policy_invalid",
    () => parseStoryQualityPolicy(weakMaximum),
    "policy maximums were weakened",
  );

  const nonFiniteMinimum = mutableClone(policy);
  nonFiniteMinimum.minimums.targetAudienceSessions = Number.NaN;
  expectQualityError(
    "policy_invalid",
    () => parseStoryQualityPolicy(nonFiniteMinimum),
    "a non-finite policy threshold was accepted",
  );

  const embeddedThreshold = mutableClone(evidence);
  candidateEvidence(embeddedThreshold).dimensions.tone.meanThreshold = 3;
  refreshEvidenceId(embeddedThreshold);
  expectQualityError(
    "evidence_invalid",
    () => parseStoryQualityEvidence(embeddedThreshold),
    "aggregate evidence weakened a policy-bound threshold",
  );

  const statusTamper = mutableClone(evidence);
  statusTamper.status = "pass";
  refreshEvidenceId(statusTamper);
  expectQualityError(
    "evidence_invalid",
    () => parseStoryQualityEvidence(statusTamper),
    "aggregate status tamper was accepted",
  );

  const arithmeticTamper = mutableClone(evidence);
  candidateEvidence(arithmeticTamper).sample.sessions += 1;
  refreshEvidenceId(arithmeticTamper);
  expectQualityError(
    "evidence_invalid",
    () => parseStoryQualityEvidence(arithmeticTamper),
    "aggregate arithmetic tamper was accepted",
  );

  const idTamper = mutableClone(evidence);
  idTamper.evidenceId = `sqe_${"0".repeat(64)}`;
  expectQualityError(
    "evidence_invalid",
    () => parseStoryQualityEvidence(idTamper),
    "aggregate evidence ID tamper was accepted",
  );

  const promotionTamper = mutableClone(evidence);
  promotionTamper.promotionAuthorized = true as false;
  refreshEvidenceId(promotionTamper);
  expectQualityError(
    "evidence_invalid",
    () => parseStoryQualityEvidence(promotionTamper),
    "aggregate evidence authorized its own promotion",
  );
}

function checkSafeAggregate(
  packet: StoryQualityPacket,
  evidence: StoryQualityEvidence,
): void {
  const observation = candidateObservation(mutableClone(packet));
  const serialized = canonicalJson(evidence);
  const forbiddenKeys = [
    "caseId",
    "reviewerId",
    "reviewId",
    "assignmentId",
    "assignmentSha256",
    "presentationId",
    "artifactId",
    "artifactContentHash",
    "storySpecId",
    "disclosure",
  ];
  const forbiddenValues = [
    packet.benchmark.cases[0].caseId,
    packet.benchmark.cases[0].disclosure,
    observation.artifact.artifactId,
    observation.storySpec.storySpecId,
    observation.expertReviews[0].reviewerId,
    observation.storySpec.arc[0].canonicalText,
  ];
  check(
    forbiddenKeys.every(
      (key) => !serialized.includes(JSON.stringify(key)),
    ) &&
      forbiddenValues.every((value) => !serialized.includes(value)),
    "aggregate evidence retained case, reviewer, artifact, spec, disclosure, or prose data",
  );
}

function checkHistoryAdmission(evidence: StoryQualityEvidence): void {
  const path = storyQualityEvidenceHistoryPath(evidence);
  const serialized = JSON.stringify(evidence);
  check(
    isValidAddedHistoryEvidence(path, serialized),
    "valid non-pass evidence was rejected from append-only history",
  );
  check(
    !isValidAddedHistoryEvidence(
      "evals/story-quality/history/misleading.json",
      serialized,
    ),
    "evidence was admitted at a non-content-addressed history path",
  );
  check(
    !isValidAddedHistoryEvidence(
      path,
      JSON.stringify({
        schemaVersion: evidence.schemaVersion,
        disclosure: "private material",
      }),
    ),
    "raw private material was admitted as story-quality history",
  );
}

function checkExclusiveWriter(evidence: StoryQualityEvidence): void {
  const root = mkdtempSync(join(tmpdir(), "onward-story-quality-"));
  try {
    const firstPath = writeStoryQualityEvidence(evidence, root);
    check(
      firstPath.endsWith(`${evidence.evidenceId}.json`),
      "exclusive evidence writer returned an unexpected path",
    );
    expectQualityError(
      "write_failed",
      () => writeStoryQualityEvidence(evidence, root),
      "exclusive evidence writer overwrote immutable evidence",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function checkRunnerOutput(): void {
  const root = mkdtempSync(join(tmpdir(), "onward-quality-runner-"));
  const sentinel = "private-disclosure-must-not-appear";
  const packetPath = join(root, `${sentinel}.json`);
  try {
    writeFileSync(packetPath, `{${sentinel}`, "utf8");
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        join(process.cwd(), "scripts/eval-story-quality.ts"),
        packetPath,
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          STORY_QUALITY_RESEARCH_HMAC_KEY: HMAC_SECRET,
        },
        windowsHide: true,
      },
    );
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    check(
      result.status === 1 &&
        output.includes('"code":"packet_read_failed"') &&
        !output.includes(packetPath) &&
        !output.includes(sentinel) &&
        !output.includes("SyntaxError") &&
        !output.includes(" at "),
      "the controlled runner leaked a protected path, content, or exception",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function checkReleaseScale(
  policy: ReturnType<typeof loadStoryQualityPolicy>,
): void {
  const releasePacket = buildPacket({
    count: policy.minimums.targetAudienceSessions,
    visibility: "protected_holdout",
    purpose: "release_candidate",
  });
  const unsignedEvidence = evaluate(releasePacket);
  check(
    unsignedEvidence.status === "incomplete" &&
      unsignedEvidence.checks.protectedHoldout &&
      unsignedEvidence.checks.holdoutChronology &&
      unsignedEvidence.checks.contentChronology &&
      unsignedEvidence.checks.candidateAbsoluteGate &&
      unsignedEvidence.checks.candidateNonInferiority &&
      !unsignedEvidence.checks.custodianAttestation &&
      unsignedEvidence.incompleteReasons.length === 1 &&
      unsignedEvidence.incompleteReasons[0] ===
        "custodian_attestation",
    "a perfect self-labeled protected packet passed without external custodian trust",
  );

  const custodian = createCustodian();
  const signedPacket = mutableClone(releasePacket);
  signedPacket.run.custodianAttestation = signCustodianAttestation({
    privateKey: custodian.privateKey,
    publicKeyPem: custodian.publicKeyPem,
    signedAt: "2026-07-06T00:00:01.000Z",
    packetSha256:
      unsignedEvidence.benchmark.packetAttestationSha256,
    resultSha256:
      unsignedEvidence.attestation.resultAttestationSha256,
    policy,
  });
  const custodianTrust = {
    publicKeyPem: custodian.publicKeyPem,
  };
  const untrustedProofEvidence = evaluate(signedPacket);
  check(
    untrustedProofEvidence.status === "incomplete" &&
      !untrustedProofEvidence.checks.custodianAttestation &&
      untrustedProofEvidence.attestation.custodian === null,
    "an unverified custodian proof escaped into public evidence",
  );
  const injectedUntrustedProof = mutableClone(unsignedEvidence);
  injectedUntrustedProof.attestation.custodian =
    signedPacket.run.custodianAttestation;
  refreshEvidenceId(injectedUntrustedProof);
  expectQualityError(
    "evidence_invalid",
    () => parseStoryQualityEvidence(injectedUntrustedProof),
    "aggregate evidence retained a custodian proof without external trust",
  );

  const signedEvidence = evaluate(signedPacket, custodianTrust);
  check(
    signedEvidence.status === "pass" &&
      signedEvidence.checks.custodianAttestation &&
      signedEvidence.incompleteReasons.length === 0 &&
      signedEvidence.attestation.custodian?.keyId ===
        custodian.keyId &&
      signedEvidence.promotionAuthorized === false,
    "trusted custodian signing did not complete the protected release gate",
  );
  const trustedRoundTrip = parseStoryQualityEvidence(
    JSON.parse(JSON.stringify(signedEvidence)) as unknown,
    { custodianTrust },
  );
  check(
    canonicalJson(trustedRoundTrip) === canonicalJson(signedEvidence),
    "trusted signed release evidence did not round-trip",
  );

  expectQualityError(
    "evidence_invalid",
    () => parseStoryQualityEvidence(signedEvidence),
    "signed release evidence trusted its embedded key without external trust",
  );

  const wrongCustodian = createCustodian();
  expectQualityError(
    "evidence_invalid",
    () =>
      parseStoryQualityEvidence(signedEvidence, {
        custodianTrust: {
          publicKeyPem: wrongCustodian.publicKeyPem,
        },
      }),
    "signed release evidence accepted the wrong external key",
  );

  const resultTamper = mutableClone(signedEvidence);
  (
    resultTamper.attestation
      .custodian as Mutable<StoryQualityCustodianAttestation>
  ).resultSha256 = "0".repeat(64);
  refreshEvidenceId(resultTamper);
  expectQualityError(
    "evidence_invalid",
    () =>
      parseStoryQualityEvidence(resultTamper, {
        custodianTrust,
      }),
    "signed release evidence accepted a tampered result binding",
  );

  const earlySignature = mutableClone(signedEvidence);
  earlySignature.attestation.custodian =
    signCustodianAttestation({
      privateKey: custodian.privateKey,
      publicKeyPem: custodian.publicKeyPem,
      signedAt: "2026-07-05T23:59:59.000Z",
      packetSha256:
        signedEvidence.benchmark.packetAttestationSha256,
      resultSha256:
        signedEvidence.attestation.resultAttestationSha256,
      policy,
    });
  refreshEvidenceId(earlySignature);
  expectQualityError(
    "evidence_invalid",
    () =>
      parseStoryQualityEvidence(earlySignature, {
        custodianTrust,
      }),
    "a custodian signature made before run completion was accepted",
  );

  const chronologyPacket = buildPacket({
    visibility: "protected_holdout",
    purpose: "release_candidate",
  });
  const chronologyTamper = mutableClone(chronologyPacket);
  candidateObservation(
    chronologyTamper,
  ).expertReviews[0].submittedAt =
    "2026-07-05T01:30:00.000Z";
  const chronologyEvidence = evaluate(chronologyTamper);
  check(
    !chronologyEvidence.checks.contentChronology &&
      chronologyEvidence.incompleteReasons.includes(
        "content_chronology",
      ),
    "review assignment/submission chronology did not fail closed",
  );

  const syntheticAtScale = mutableClone(releasePacket);
  syntheticAtScale.benchmark.visibility = "synthetic";
  refreshBenchmarkManifest(syntheticAtScale);
  const syntheticUnsigned = evaluate(
    syntheticAtScale,
    custodianTrust,
  );
  syntheticAtScale.run.custodianAttestation =
    signCustodianAttestation({
      privateKey: custodian.privateKey,
      publicKeyPem: custodian.publicKeyPem,
      signedAt: "2026-07-06T00:00:02.000Z",
      packetSha256:
        syntheticUnsigned.benchmark.packetAttestationSha256,
      resultSha256:
        syntheticUnsigned.attestation.resultAttestationSha256,
      policy,
    });
  const syntheticEvidence = evaluate(
    syntheticAtScale,
    custodianTrust,
  );
  check(
    syntheticEvidence.status === "incomplete" &&
      !syntheticEvidence.checks.protectedHoldout &&
      syntheticEvidence.checks.custodianAttestation &&
      syntheticEvidence.incompleteReasons.includes(
        "synthetic_or_non_holdout",
      ),
    "a trusted, fully covered 150-case synthetic run became promotion-complete",
  );
}

function createCustodian(): {
  privateKey: KeyObject;
  publicKeyPem: string;
  keyId: string;
} {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey
    .export({ type: "spki", format: "pem" })
    .toString();
  return {
    privateKey,
    publicKeyPem,
    keyId: storyQualityCustodianKeyId(publicKeyPem),
  };
}

function signCustodianAttestation(input: {
  privateKey: KeyObject;
  publicKeyPem: string;
  signedAt: string;
  packetSha256: string;
  resultSha256: string;
  policy: ReturnType<typeof loadStoryQualityPolicy>;
}): StoryQualityCustodianAttestation {
  const keyId = storyQualityCustodianKeyId(input.publicKeyPem);
  const message = storyQualityCustodianSigningMessage({
    keyId,
    signedAt: input.signedAt,
    packetSha256: input.packetSha256,
    resultSha256: input.resultSha256,
    policy: input.policy,
    protocolSha256: sha256File(STORY_QUALITY_PROTOCOL_PATH),
  });
  return {
    schemaVersion: "story-quality-custodian-attestation-v1",
    algorithm: "Ed25519",
    keyId,
    signedAt: input.signedAt,
    packetSha256: input.packetSha256,
    resultSha256: input.resultSha256,
    signature: signMessage(
      null,
      Buffer.from(message, "utf8"),
      input.privateKey,
    ).toString("base64url"),
  };
}

function buildPacket(options: PacketOptions = {}): StoryQualityPacket {
  const count = options.count ?? 1;
  const visibility = options.visibility ?? "synthetic";
  const purpose = options.purpose ?? "contract_test";
  const selectedCandidateRecipe =
    options.candidateRecipe ?? candidateRecipe;
  const policy = loadStoryQualityPolicy();
  const policySha256 = storyQualityPolicySha256(policy);
  const protocolSha256 = sha256File(
    STORY_QUALITY_PROTOCOL_PATH,
  );
  const runId = `quality-run-${count}-v1`;
  const analysisPlanSha256 = sha256Text(
    "frozen quality analysis plan",
  );
  const split =
    purpose === "release_candidate"
      ? "blind_holdout"
      : purpose === "validation"
        ? "validation"
        : "development";
  const cases = Array.from({ length: count }, (_, index) => {
    const disclosure = options.disclosure ?? disclosureFor(index);
    return {
      caseId: `quality-case-${String(index + 1).padStart(3, "0")}`,
      inputCommitment: storyQualityInputCommitment(
        disclosure,
        HMAC_SECRET,
      ),
      split,
      cohortCellId: "target-readers",
      consented: true,
      deidentified: true,
      disclosure,
      boundaries: null,
    } as const;
  });
  const benchmarkWithoutManifest = {
    schemaVersion: "story-quality-benchmark-v1" as const,
    benchmarkVersion: `quality-benchmark-${count}-v1`,
    visibility,
    frozenAt: "2026-07-01T00:00:00.000Z",
    holdoutSealedAt:
      purpose === "release_candidate"
        ? "2026-07-02T00:00:00.000Z"
        : null,
    consentProtocolVersion: "quality-consent-v1",
    deduplicationReportSha256: sha256Text(
      `quality-deduplication-report-${count}`,
    ),
    cases,
    cohortTargets: [
      {
        cohortCellId: "target-readers",
        minimumSessions: count,
      },
    ],
  };
  const benchmark = {
    ...benchmarkWithoutManifest,
    manifestSha256: storyQualityBenchmarkManifestSha256(
      benchmarkWithoutManifest,
    ),
  };
  const baselineObservations: StoryQualityObservation[] = [];
  const candidateObservations: StoryQualityObservation[] = [];
  for (let index = 0; index < count; index += 1) {
    const caseId = cases[index].caseId;
    const disclosure = cases[index].disclosure;
    baselineObservations.push(
      createObservation({
        arm: "baseline",
        armId: "baseline-arm",
        caseId,
        index,
        disclosure,
        recipe: baselineRecipe,
        score: 5,
        composition: "canonical_fallback",
        generationDeploymentVersion:
          GENERATION_DEPLOYMENT_VERSION,
        reviewBinding: {
          benchmarkVersion: benchmark.benchmarkVersion,
          benchmarkManifestSha256: benchmark.manifestSha256,
          runId,
          analysisPlanSha256,
          caseInputCommitment: cases[index].inputCommitment,
          armId: "baseline-arm",
          recipeManifestSha256: baselineRecipe.manifestSha256,
          policyVersion: policy.policyVersion,
          policySha256,
          protocolVersion: policy.protocolVersion,
          protocolSha256,
        },
      }),
    );
    candidateObservations.push(
      createObservation({
        arm: "candidate",
        armId: "candidate-arm",
        caseId,
        index,
        disclosure,
        recipe: selectedCandidateRecipe,
        score: options.candidateScore ?? 5,
        composition: options.candidateComposition ?? "hybrid",
        generationDeploymentVersion:
          GENERATION_DEPLOYMENT_VERSION,
        reviewBinding: {
          benchmarkVersion: benchmark.benchmarkVersion,
          benchmarkManifestSha256: benchmark.manifestSha256,
          runId,
          analysisPlanSha256,
          caseInputCommitment: cases[index].inputCommitment,
          armId: "candidate-arm",
          recipeManifestSha256:
            selectedCandidateRecipe.manifestSha256,
          policyVersion: policy.policyVersion,
          policySha256,
          protocolVersion: policy.protocolVersion,
          protocolSha256,
        },
      }),
    );
  }
  return {
    schemaVersion: "story-quality-review-packet-v1",
    benchmark,
    run: {
      runId,
      purpose,
      analysisPlanSha256,
      candidateArmId: "candidate-arm",
      candidateFrozenAt: "2026-07-03T00:00:00.000Z",
      holdoutOpenedAt:
        purpose === "release_candidate"
          ? "2026-07-04T00:00:00.000Z"
          : null,
      startedAt: "2026-07-05T00:00:00.000Z",
      completedAt: "2026-07-06T00:00:00.000Z",
      normalProviderConditions: true,
      custodianAttestation: null,
    },
    arms: [
      {
        armId: "baseline-arm",
        role: "baseline",
        personalizationAttempted: false,
        recipeId: baselineRecipe.recipeId,
        recipeManifestSha256: baselineRecipe.manifestSha256,
        generationDeploymentVersion:
          GENERATION_DEPLOYMENT_VERSION,
        observations: baselineObservations,
      },
      {
        armId: "candidate-arm",
        role: "candidate",
        personalizationAttempted:
          options.candidatePersonalizationAttempted ?? true,
        recipeId: selectedCandidateRecipe.recipeId,
        recipeManifestSha256:
          selectedCandidateRecipe.manifestSha256,
        generationDeploymentVersion:
          GENERATION_DEPLOYMENT_VERSION,
        observations: candidateObservations,
      },
    ],
  };
}

function createObservation(input: {
  arm: "baseline" | "candidate";
  armId: string;
  caseId: string;
  index: number;
  disclosure: string;
  recipe: SyntheticRecipeManifest;
  score: number;
  composition:
    | "hybrid"
    | "canonical_fallback"
    | "opening"
    | "opening_fallback";
  generationDeploymentVersion: string;
  reviewBinding: ReviewBindingContext;
}): StoryQualityObservation {
  const stage = FIGURE_STAGES[0];
  const storySpec = publishedStorySpec();
  const resonanceBrief = createResonanceBrief(input.disclosure);
  const matchRecipe = createMatchRecipe(
    input.recipe,
    input.generationDeploymentVersion,
  );
  let openingCopy = {
    eyebrow: NEUTRAL_EYEBROW,
    prefaceLines: DEFAULT_PREFACE_LINES,
  };
  if (input.composition === "opening") {
    const planRequest = buildPrefacePlanRequest(
      toEyebrowProviderSurface(
        toEyebrowSurface({ resonanceBrief, stage }),
      ),
    );
    const renderedOpening = renderPersonalizedOpeningCopy(
      firstCompatiblePrefacePlan(planRequest),
      resonanceBrief,
    );
    if (!renderedOpening) {
      throw new Error("opening personalization fixture did not render");
    }
    openingCopy = renderedOpening;
  }
  const common = {
    storySpec,
    stage,
    matchRecipe,
    openingCopy,
    framing: "partial" as const,
    resonanceBrief,
    now: FIXED_NOW,
  };
  let artifact: StoryArtifact;
  let compositionOutcome:
    | "first_pass_validated"
    | "canonical_fallback";
  if (input.arm === "candidate" && input.composition === "hybrid") {
    artifact = composeHybridStoryArtifact({
      ...common,
      plan: {
        schemaVersion: HYBRID_PLAN_SCHEMA_VERSION,
        transitionRole: "struggle",
        transitionTemplateId: HYBRID_TRANSITION_TEMPLATE_IDS[0],
        bridgeTemplateId: HYBRID_BRIDGE_TEMPLATE_IDS[0],
      },
      attemptCount: 1,
    });
    compositionOutcome = "first_pass_validated";
  } else if (
    input.arm === "candidate" &&
    (input.composition === "opening" ||
      input.composition === "opening_fallback")
  ) {
    artifact = composeCanonicalStoryArtifact({
      ...common,
      fallbackReason: "canonical_only",
      attemptCount: 0,
    });
    compositionOutcome =
      input.composition === "opening"
        ? "first_pass_validated"
        : "canonical_fallback";
  } else {
    const personalizedFallback = input.arm === "candidate";
    artifact = composeCanonicalStoryArtifact({
      ...common,
      fallbackReason: personalizedFallback
        ? "provider_error"
        : "canonical_only",
      attemptCount: personalizedFallback ? 2 : 0,
    });
    compositionOutcome = personalizedFallback
      ? "canonical_fallback"
      : "first_pass_validated";
  }
  const reviewerPrefix = `${input.arm}-${String(input.index + 1).padStart(3, "0")}`;
  const artifactDocumentSha256 = sha256Text(canonicalJson(artifact));
  const storySpecDocumentSha256 = sha256Text(
    canonicalJson(storySpec),
  );
  const assignmentInput = {
    artifact,
    storySpec,
    artifactDocumentSha256,
    storySpecDocumentSha256,
    caseId: input.caseId,
    binding: input.reviewBinding,
  };
  return {
    caseId: input.caseId,
    artifactDocumentSha256,
    storySpecDocumentSha256,
    artifact,
    storySpec,
    outcome: {
      compositionOutcome,
      finalBridgeCompleted: true,
      feedbackVerdict: "close",
    },
    expertReviews: [
      expertReview(
        `${reviewerPrefix}-expert-review-a`,
        `${reviewerPrefix}-expert-a`,
        createReviewAssignment({
          ...assignmentInput,
          reviewerId: `${reviewerPrefix}-expert-a`,
          reviewerRole: "expert",
          slot: "a",
        }),
        input.score,
      ),
      expertReview(
        `${reviewerPrefix}-expert-review-b`,
        `${reviewerPrefix}-expert-b`,
        createReviewAssignment({
          ...assignmentInput,
          reviewerId: `${reviewerPrefix}-expert-b`,
          reviewerRole: "expert",
          slot: "b",
        }),
        input.score,
      ),
    ],
    targetReaderReviews: [
      targetReview(
        `${reviewerPrefix}-reader-review`,
        `${reviewerPrefix}-reader`,
        createReviewAssignment({
          ...assignmentInput,
          reviewerId: `${reviewerPrefix}-reader`,
          reviewerRole: "target_reader",
          slot: "reader",
        }),
        input.score,
      ),
    ],
  };
}

function expertReview(
  reviewId: string,
  reviewerId: string,
  assignment: StoryQualityReviewAssignment,
  score: number,
): StoryQualityObservation["expertReviews"][number] {
  return {
    reviewId,
    reviewerId,
    submittedAt: "2026-07-05T03:00:00.000Z",
    assignment,
    trained: true,
    blindToRecipe: true,
    blindToOtherReviews: true,
    fullArtifactReviewed: true,
    scores: {
      factual_support: score,
      tone: score,
      non_diagnostic_language: score,
      non_overclaiming: score,
      narrative_coherence: score,
      bridge_quality: score,
    },
    criticalFailures: [],
  };
}

function targetReview(
  reviewId: string,
  reviewerId: string,
  assignment: StoryQualityReviewAssignment,
  score: number,
): StoryQualityObservation["targetReaderReviews"][number] {
  return {
    reviewId,
    reviewerId,
    submittedAt: "2026-07-05T03:00:00.000Z",
    assignment,
    targetAudienceEligible: true,
    blindToRecipe: true,
    blindToOtherReviews: true,
    fullArtifactReviewed: true,
    scores: {
      match_closeness: score,
      desire_to_continue: score,
    },
    criticalFailures: [],
  };
}

function createReviewAssignment(input: {
  reviewerId: string;
  reviewerRole: "expert" | "target_reader";
  slot: string;
  artifact: StoryArtifact;
  storySpec: StorySpec;
  artifactDocumentSha256: string;
  storySpecDocumentSha256: string;
  caseId: string;
  binding: ReviewBindingContext;
}): StoryQualityReviewAssignment {
  const assignmentWithoutHash: Omit<
    StoryQualityReviewAssignment,
    "assignmentSha256"
  > = {
    assignmentId: `${input.reviewerId}-assignment`,
    assignedAt: "2026-07-05T02:00:00.000Z",
    reviewerId: input.reviewerId,
    reviewerRole: input.reviewerRole,
    benchmarkVersion: input.binding.benchmarkVersion,
    benchmarkManifestSha256:
      input.binding.benchmarkManifestSha256,
    runId: input.binding.runId,
    analysisPlanSha256: input.binding.analysisPlanSha256,
    caseId: input.caseId,
    caseInputCommitment: input.binding.caseInputCommitment,
    armId: input.binding.armId,
    presentationId: `${input.binding.armId}-${input.caseId}-${input.slot}`,
    recipeManifestSha256:
      input.binding.recipeManifestSha256,
    artifactId: input.artifact.artifactId,
    artifactContentHash: input.artifact.contentHash,
    artifactDocumentSha256: input.artifactDocumentSha256,
    storySpecId: input.storySpec.storySpecId,
    storySpecVersion: input.storySpec.version,
    storySpecSchemaVersion: input.storySpec.schemaVersion,
    storySpecDocumentSha256: input.storySpecDocumentSha256,
    reviewMaterialSha256: storyQualityReviewMaterialSha256({
      artifact: input.artifact,
      storySpec: input.storySpec,
    }),
    policyVersion: input.binding.policyVersion,
    policySha256: input.binding.policySha256,
    protocolVersion: input.binding.protocolVersion,
    protocolSha256: input.binding.protocolSha256,
  };
  return Object.freeze({
    ...assignmentWithoutHash,
    assignmentSha256: storyQualityReviewAssignmentSha256(
      assignmentWithoutHash,
    ),
  });
}

function createRecipe(
  recipeId: string,
  hybridStoryComposerEnabled: boolean,
  storyPromptVersion: string = STORY_PROMPT_VERSION_V1,
): SyntheticRecipeManifest {
  const identity = {
    recipeId,
    retrievalMode: "keyword" as const,
    matchConfigVersion: "quality-match-config-v1",
    librarySnapshotSha256: sha256Text("quality-library-snapshot"),
    datasetVersion: DATASET_VERSION,
    llmProvider: "real" as const,
    rerankModelId: "synthetic-reranker",
    proseModelId: "synthetic-prose",
    embeddingModelId: null,
    rerankPromptVersion: "quality-rerank-prompt-v1",
    storyPromptVersion,
    rerankTemperature: 0,
    rerankReasoningEffort: "low",
    rerankTopK: 6,
    storyTemperature: 0,
    storyComposerMode: "canonical" as const,
    hybridStoryComposerEnabled,
    composerVersion: STORY_COMPOSER_VERSION,
    validatorVersion: STORY_ARTIFACT_VALIDATOR_VERSION,
    storySpecSchemaVersion: STORY_SPEC_SCHEMA_VERSION,
    boundaryPolicyVersion: STORY_BOUNDARY_POLICY_VERSION,
    resonanceBriefVersion: RESONANCE_BRIEF_VERSION,
  };
  return {
    ...identity,
    manifestSha256: sha256Text(canonicalJson(identity)),
  };
}

function createMatchRecipe(
  recipe: SyntheticRecipeManifest,
  generationDeploymentVersion: string,
): MatchRecipe {
  return {
    recipeId: recipe.recipeId,
    recipeManifestHash: recipe.manifestSha256,
    datasetVersion: recipe.datasetVersion,
    deploymentVersion: generationDeploymentVersion,
    matchConfigVersion: recipe.matchConfigVersion,
    librarySnapshotSha256: recipe.librarySnapshotSha256,
    crisisRegexVersion,
    llmProvider: recipe.llmProvider,
    rerankModelId: recipe.rerankModelId,
    proseModelId: recipe.proseModelId,
    embeddingModelId: recipe.embeddingModelId,
    retrievalMode: recipe.retrievalMode,
    rerankPromptVersion: recipe.rerankPromptVersion,
    storyPromptVersion: recipe.storyPromptVersion,
    rerankTemperature: recipe.rerankTemperature,
    rerankReasoningEffort: recipe.rerankReasoningEffort,
    rerankTopK: recipe.rerankTopK,
    storyTemperature: recipe.storyTemperature,
    storyComposerMode: "canonical",
    hybridStoryComposerEnabled: recipe.hybridStoryComposerEnabled,
    composerVersion: recipe.composerVersion,
    validatorVersion: recipe.validatorVersion,
    storySpecSchemaVersion: recipe.storySpecSchemaVersion,
    boundaryPolicyVersion: recipe.boundaryPolicyVersion,
    resonanceBriefVersion: recipe.resonanceBriefVersion,
    matchRecoveryPolicyVersion: MATCH_RECOVERY_POLICY_VERSION,
  } as unknown as MatchRecipe;
}

function publishedStorySpec(): StorySpec {
  const roles: StoryBeatSpec["role"][] = [
    "scene",
    "dark_moment",
    "response",
    "struggle",
    "turning_point",
    "became",
    "bridge",
  ];
  const texts = [
    "In 2001, the subject began a documented project.",
    "The first attempt ended in 2002.",
    'The record preserves the words "We began again."',
    "Work continued for three years, which the archive describes as a deliberate return.",
    "In 2005, a second route opened, though one account disputes its timing.",
    "The project was published in 2006.",
    "A life can remain distinct and still offer company.",
  ];
  const factIds = [
    "fact-1",
    "fact-2",
    "fact-3",
    "fact-4",
    "fact-5",
    "fact-6",
  ];
  const arc: StoryBeatSpec[] = roles.map((role, index) => {
    const isBridge = role === "bridge";
    const factId = isBridge ? undefined : factIds[index];
    const quoteIds =
      role === "response"
        ? ["quote-verbatim"]
        : role === "struggle"
          ? ["quote-paraphrase"]
          : role === "turning_point"
            ? ["quote-disputed"]
            : [];
    return {
      role,
      canonicalText: texts[index],
      requiredFactIds: factId ? [factId] : [],
      optionalFactIds: [],
      entityIds: ["entity-subject"],
      quoteIds,
      sentenceEvidence: factId
        ? [
            {
              sentenceIndex: 0,
              factIds: [factId],
              interpretationIds:
                role === "struggle"
                  ? ["interpretation-return"]
                  : [],
            },
          ]
        : [],
      personalizationZones: isBridge
        ? ["reader_bridge"]
        : role === "scene" || role === "became"
          ? ["none"]
          : ["emphasis", "transition"],
    };
  });
  const stage = FIGURE_STAGES[0];
  return {
    storySpecId:
      "douglass:1838-1841-nyc-to-nantucket:quality-contract-v1",
    schemaVersion: STORY_SPEC_SCHEMA_VERSION,
    figureKey: stage.figureKey,
    stageId: stage.stageId,
    version: 1,
    status: "published",
    episode: {
      ageMin: stage.ageMin,
      ageMax: stage.ageMax,
      startDate: "2001-01-01",
      endDate: "2006-12-31",
      throughLine:
        "A documented project was restarted after an early failure.",
    },
    contentProfile: {
      intensity: "gentle",
      flags: [],
      contentNote: "Includes a professional setback.",
    },
    sources: [
      {
        sourceId: "source-archive",
        citation: "Example Archive. Project papers, 2001-2006.",
        locator: "Collection 4",
        url: "https://example.org/archive/project-papers",
      },
      {
        sourceId: "source-history",
        citation: "Historian, A. A History of the Project (2020).",
        locator: "Chapter 3",
        url: "https://example.org/history/project",
      },
    ],
    facts: factIds.map((factId, index) => ({
      factId,
      statement: texts[index],
      sourceRefs: [
        {
          sourceId: index < 3 ? "source-archive" : "source-history",
          locator:
            index < 3 ? `Folder ${index + 1}` : `pp. ${40 + index}`,
          scope: "exact",
        },
      ],
      eventOrder: index + 1,
      confidence: index === 4 ? "disputed" : "documented",
      claimKind: index === 3 ? "context" : "event",
    })),
    entities: [
      {
        entityId: "entity-subject",
        kind: "person",
        value: stage.displayName,
        aliases: ["the subject"],
      },
    ],
    quotes: [
      {
        quoteId: "quote-verbatim",
        text: "We began again.",
        status: "verbatim",
        speaker: "Project record",
        sourceRefs: [
          {
            sourceId: "source-archive",
            locator: "Folder 3, leaf 2",
            scope: "exact",
          },
        ],
      },
      {
        quoteId: "quote-paraphrase",
        text: "The work was a deliberate return.",
        status: "paraphrase",
        sourceRefs: [
          {
            sourceId: "source-history",
            locator: "p. 43",
            scope: "bounded",
          },
        ],
      },
      {
        quoteId: "quote-disputed",
        text: "The second route opened in 2005.",
        status: "disputed",
        sourceRefs: [
          {
            sourceId: "source-history",
            locator: "pp. 44-45",
            scope: "bounded",
          },
        ],
      },
    ],
    arc,
    interpretations: [
      {
        interpretationId: "interpretation-return",
        statement:
          "The continuation can be read as a deliberate return.",
        supportingFactIds: ["fact-4"],
        allowed: true,
      },
    ],
    dramatizationLimits: [
      "No invented dialogue or interior monologue.",
    ],
    avoidRules: ["Do not add unsupported historical claims."],
    review: {
      researcherId: "researcher-quality",
      historicalReviewerId: "historian-quality",
      toneReviewerId: "tone-quality",
      reviewedAt: "2026-07-02T12:00:00.000Z",
      contentProfileReviewed: true,
    },
  };
}

function evaluate(
  packet: unknown,
  custodianTrust?: Readonly<{ publicKeyPem: string }>,
  recipeRegistry: QualityRecipeRegistry = registry,
): StoryQualityEvidence {
  return evaluateStoryQualityPacket(packet, {
    hmacSecret: HMAC_SECRET,
    registry: recipeRegistry,
    provenance: COMPLETE_PROVENANCE,
    custodianTrust,
  });
}

function disclosureFor(index: number): string {
  return `I felt left out when my work was turned down and I do not know how to begin again case ${String(index + 1).padStart(3, "0")}.`;
}

function setObservationScores(
  observation: Mutable<StoryQualityObservation>,
  score: number,
): void {
  for (const review of observation.expertReviews) {
    review.scores.factual_support = score;
    review.scores.tone = score;
    review.scores.non_diagnostic_language = score;
    review.scores.non_overclaiming = score;
    review.scores.narrative_coherence = score;
    review.scores.bridge_quality = score;
  }
  for (const review of observation.targetReaderReviews) {
    review.scores.match_closeness = score;
    review.scores.desire_to_continue = score;
  }
}

function candidateArm(
  packet: Mutable<StoryQualityPacket>,
): Mutable<StoryQualityArm> {
  const arm = packet.arms.find((entry) => entry.role === "candidate");
  if (!arm) throw new Error("candidate fixture missing");
  return arm;
}

function candidateObservation(
  packet: Mutable<StoryQualityPacket>,
  index = 0,
): Mutable<StoryQualityObservation> {
  const observation = candidateArm(packet).observations[index];
  if (!observation) throw new Error("candidate observation missing");
  return observation;
}

function baselineObservation(
  packet: Mutable<StoryQualityPacket>,
): Mutable<StoryQualityObservation> {
  return packet.arms.find((arm) => arm.role === "baseline")!
    .observations[0];
}

function candidateEvidence(
  evidence: Mutable<StoryQualityEvidence> | StoryQualityEvidence,
): Mutable<StoryQualityEvidence>["arms"][number] {
  const arm = evidence.arms.find((entry) => entry.role === "candidate");
  if (!arm) throw new Error("candidate evidence missing");
  return arm as Mutable<StoryQualityEvidence>["arms"][number];
}

function sealArtifact(
  observation: Mutable<StoryQualityObservation>,
): void {
  observation.artifact.contentHash = storyArtifactContentHash(
    observation.artifact,
  );
  observation.artifactDocumentSha256 = sha256Text(
    canonicalJson(observation.artifact),
  );
  refreshReviewAssignments(observation);
}

function sealStorySpec(
  observation: Mutable<StoryQualityObservation>,
): void {
  observation.storySpecDocumentSha256 = sha256Text(
    canonicalJson(observation.storySpec),
  );
  refreshReviewAssignments(observation);
}

function refreshBenchmarkManifest(
  packet: Mutable<StoryQualityPacket>,
): void {
  const { manifestSha256: _ignored, ...payload } = packet.benchmark;
  void _ignored;
  packet.benchmark.manifestSha256 =
    storyQualityBenchmarkManifestSha256(payload);
  const cases = new Map(
    packet.benchmark.cases.map((entry) => [entry.caseId, entry]),
  );
  for (const arm of packet.arms) {
    for (const observation of arm.observations) {
      const benchmarkCase = cases.get(observation.caseId);
      if (!benchmarkCase) throw new Error("benchmark case missing");
      for (const review of [
        ...observation.expertReviews,
        ...observation.targetReaderReviews,
      ]) {
        review.assignment.benchmarkVersion =
          packet.benchmark.benchmarkVersion;
        review.assignment.benchmarkManifestSha256 =
          packet.benchmark.manifestSha256;
        review.assignment.runId = packet.run.runId;
        review.assignment.analysisPlanSha256 =
          packet.run.analysisPlanSha256;
        review.assignment.caseInputCommitment =
          benchmarkCase.inputCommitment;
        refreshAssignmentHash(review.assignment);
      }
    }
  }
}

function refreshReviewAssignments(
  observation: Mutable<StoryQualityObservation>,
): void {
  const reviewMaterialSha256 = storyQualityReviewMaterialSha256({
    artifact: observation.artifact,
    storySpec: observation.storySpec,
  });
  for (const review of [
    ...observation.expertReviews,
    ...observation.targetReaderReviews,
  ]) {
    review.assignment.artifactId = observation.artifact.artifactId;
    review.assignment.artifactContentHash =
      observation.artifact.contentHash;
    review.assignment.artifactDocumentSha256 =
      observation.artifactDocumentSha256;
    review.assignment.storySpecId = observation.storySpec.storySpecId;
    review.assignment.storySpecVersion = observation.storySpec.version;
    review.assignment.storySpecSchemaVersion =
      observation.storySpec.schemaVersion;
    review.assignment.storySpecDocumentSha256 =
      observation.storySpecDocumentSha256;
    review.assignment.reviewMaterialSha256 = reviewMaterialSha256;
    refreshAssignmentHash(review.assignment);
  }
}

function refreshAssignmentHash(
  assignment: Mutable<StoryQualityReviewAssignment>,
): void {
  assignment.assignmentSha256 =
    storyQualityReviewAssignmentSha256(
      assignment as StoryQualityReviewAssignment,
    );
}

function setReviewerId(
  review:
    | Mutable<StoryQualityObservation>["expertReviews"][number]
    | Mutable<StoryQualityObservation>["targetReaderReviews"][number],
  reviewerId: string,
): void {
  review.reviewerId = reviewerId;
  review.assignment.reviewerId = reviewerId;
  refreshAssignmentHash(review.assignment);
}

function refreshEvidenceId(
  evidence: Mutable<StoryQualityEvidence>,
): void {
  evidence.evidenceId = storyQualityEvidenceId(
    evidence as StoryQualityEvidence,
  );
}

function mutableClone<T>(value: T): Mutable<T> {
  return structuredClone(value) as Mutable<T>;
}

function addUnknownKey(value: unknown, key: string): void {
  (value as Record<string, unknown>)[key] = true;
}

function check(condition: unknown, message: string): void {
  assertionCount += 1;
  if (!condition) failures.push(message);
}

function expectQualityError(
  expectedCode: StoryQualityError["code"],
  operation: () => unknown,
  message: string,
): void {
  assertionCount += 1;
  try {
    operation();
    failures.push(message);
  } catch (error: unknown) {
    if (
      !(error instanceof StoryQualityError) ||
      error.code !== expectedCode ||
      error.message !== expectedCode
    ) {
      const actualCode =
        error instanceof StoryQualityError
          ? error.code
          : "non_story_quality_error";
      failures.push(
        `${message} (expected ${expectedCode}, received ${actualCode})`,
      );
    }
  }
}

main();
