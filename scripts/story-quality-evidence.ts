import "./_smoke-bootstrap";
import { createHmac } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  type WriteFileOptions,
} from "node:fs";
import { resolve } from "node:path";
import {
  validateStoredStoryArtifact,
  validateStoryArtifact,
  storyArtifactContentHash,
} from "../lib/story-artifact";
import {
  STORY_ARTIFACT_SCHEMA_VERSION,
  type StoryArtifact,
} from "../lib/story-artifact-types";
import {
  parseStoryBoundaries,
  type StoryBoundaries,
} from "../lib/story-boundaries";
import {
  createResonanceBrief,
} from "../lib/resonance-brief";
import {
  storySpecContainsDisclosure,
  validateStorySpec,
} from "../lib/story-spec";
import type { StorySpec } from "../lib/story-spec-types";
import {
  canonicalJson,
  currentDeploymentId,
  currentGitCommit,
  gitInputTreeSha256,
  loadRecipeRegistry,
  sha256File,
  sha256Text,
} from "./recipe-evidence";

export const STORY_QUALITY_HARNESS_VERSION =
  "story-quality-harness-v1-2026-07";
export const STORY_QUALITY_POLICY_PATH = resolve(
  process.cwd(),
  "config/story-quality-policy.json",
);
export const STORY_QUALITY_PROTOCOL_PATH = resolve(
  process.cwd(),
  "roadmap/story_quality_benchmark.md",
);
export const STORY_QUALITY_HISTORY_DIR = resolve(
  process.cwd(),
  "evals/story-quality/history",
);

const HASH = /^[0-9a-f]{64}$/;
const OPAQUE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/;
const COMMITMENT =
  /^hmac-sha256:story-quality-case-v1:[0-9a-f]{64}$/;
const SCORE_BUCKETS = [
  "1",
  "1.5",
  "2",
  "2.5",
  "3",
  "3.5",
  "4",
  "4.5",
  "5",
] as const;
const STORY_QUALITY_PACKET_SCHEMA_VERSION =
  "story-quality-review-packet-v1";
const STORY_QUALITY_BENCHMARK_SCHEMA_VERSION =
  "story-quality-benchmark-v1";
const STORY_QUALITY_EVIDENCE_SCHEMA_VERSION =
  "story-quality-evidence-v1";
const STORY_QUALITY_POLICY_SCHEMA_VERSION =
  "story-quality-policy-v1";
const STORY_QUALITY_PROTOCOL_VERSION =
  "story-quality-protocol-v1-2026-07";

export const RUBRIC_DIMENSIONS = [
  "match_closeness",
  "factual_support",
  "tone",
  "non_diagnostic_language",
  "non_overclaiming",
  "narrative_coherence",
  "bridge_quality",
  "desire_to_continue",
] as const;

export const CRITICAL_FAILURE_CATEGORIES = [
  "unsupported_person",
  "unsupported_place",
  "unsupported_organization",
  "unsupported_date",
  "unsupported_amount",
  "unsupported_quote",
  "unsupported_work",
  "unsupported_causal_claim",
  "unsupported_sensory_detail",
  "chronology_error",
  "source_misrepresentation",
  "forbidden_or_disputed_quote",
  "disallowed_interpretation",
  "diagnosis",
  "false_promise",
  "trauma_equivalence",
  "harmful_advice",
  "privacy_echo",
  "boundary_violation",
  "sensitive_field_persisted",
  "critical_safety_failure",
] as const;

export type RubricDimension = (typeof RUBRIC_DIMENSIONS)[number];
export type CriticalFailureCategory =
  (typeof CRITICAL_FAILURE_CATEGORIES)[number];
export type StoryQualityStatus = "incomplete" | "fail" | "pass";
export type StoryQualityErrorCode =
  | "policy_invalid"
  | "packet_invalid"
  | "binding_invalid"
  | "content_invalid"
  | "privacy_invalid"
  | "provenance_invalid"
  | "evidence_invalid"
  | "write_failed";

export class StoryQualityError extends Error {
  readonly code: StoryQualityErrorCode;

  constructor(code: StoryQualityErrorCode) {
    super(code);
    this.name = "StoryQualityError";
    this.code = code;
  }
}

export type StoryQualityPolicy = Readonly<{
  schemaVersion: typeof STORY_QUALITY_POLICY_SCHEMA_VERSION;
  policyVersion: string;
  protocolVersion: typeof STORY_QUALITY_PROTOCOL_VERSION;
  evidenceSchemaVersion: typeof STORY_QUALITY_EVIDENCE_SCHEMA_VERSION;
  packetSchemaVersion: typeof STORY_QUALITY_PACKET_SCHEMA_VERSION;
  benchmarkSchemaVersion: typeof STORY_QUALITY_BENCHMARK_SCHEMA_VERSION;
  requiredReleaseSplit: "blind_holdout";
  minimums: Readonly<{
    targetAudienceSessions: number;
    feedbackResponses: number;
    expertReviewsPerArtifact: number;
    targetReaderReviewsPerArtifact: number;
    feltCloseRate: number;
    completionRate: number;
    firstPassValidationRate: number;
    meanRubricScore: number;
    acceptableRubricScore: number;
    acceptableRubricRate: number;
  }>;
  maximums: Readonly<{
    canonicalFallbackRate: number;
    criticalFailureArtifacts: number;
    meanRubricRegression: number;
    completionRateRegression: number;
    feltCloseRateRegression: number;
  }>;
  rubricDimensions: readonly RubricDimension[];
  criticalFailureCategories: readonly CriticalFailureCategory[];
}>;

export type StoryQualityBenchmarkCase = Readonly<{
  caseId: string;
  inputCommitment: string;
  split: "development" | "validation" | "blind_holdout";
  cohortCellId: string;
  consented: boolean;
  deidentified: boolean;
  disclosure: string;
  boundaries: StoryBoundaries | null;
}>;

export type StoryQualityExpertReview = Readonly<{
  reviewId: string;
  reviewerId: string;
  trained: boolean;
  blindToRecipe: boolean;
  blindToOtherReviews: boolean;
  fullArtifactReviewed: boolean;
  artifactContentHash: string;
  scores: Readonly<{
    factual_support: number;
    tone: number;
    non_diagnostic_language: number;
    non_overclaiming: number;
    narrative_coherence: number;
    bridge_quality: number;
  }>;
  criticalFailures: readonly CriticalFailureCategory[];
}>;

export type StoryQualityTargetReaderReview = Readonly<{
  reviewId: string;
  reviewerId: string;
  targetAudienceEligible: boolean;
  blindToRecipe: boolean;
  blindToOtherReviews: boolean;
  fullArtifactReviewed: boolean;
  artifactContentHash: string;
  scores: Readonly<{
    match_closeness: number;
    desire_to_continue: number;
  }>;
  criticalFailures: readonly CriticalFailureCategory[];
}>;

export type StoryQualityObservation = Readonly<{
  caseId: string;
  artifactDocumentSha256: string;
  storySpecDocumentSha256: string;
  artifact: StoryArtifact;
  storySpec: StorySpec;
  outcome: Readonly<{
    compositionOutcome:
      | "first_pass_validated"
      | "retry_validated"
      | "canonical_fallback";
    finalBridgeCompleted: boolean;
    feedbackVerdict: "close" | "not_close" | "no_response";
  }>;
  expertReviews: readonly StoryQualityExpertReview[];
  targetReaderReviews: readonly StoryQualityTargetReaderReview[];
}>;

export type StoryQualityArm = Readonly<{
  armId: string;
  role: "baseline" | "candidate" | "challenger";
  personalizationAttempted: boolean;
  recipeId: string;
  recipeManifestSha256: string;
  observations: readonly StoryQualityObservation[];
}>;

export type StoryQualityPacket = Readonly<{
  schemaVersion: typeof STORY_QUALITY_PACKET_SCHEMA_VERSION;
  benchmark: Readonly<{
    schemaVersion: typeof STORY_QUALITY_BENCHMARK_SCHEMA_VERSION;
    benchmarkVersion: string;
    visibility: "synthetic" | "protected_holdout";
    frozenAt: string;
    holdoutSealedAt: string | null;
    consentProtocolVersion: string;
    deduplicationReportSha256: string;
    manifestSha256: string;
    cases: readonly StoryQualityBenchmarkCase[];
    cohortTargets: readonly Readonly<{
      cohortCellId: string;
      minimumSessions: number;
    }>[];
  }>;
  run: Readonly<{
    runId: string;
    purpose:
      | "contract_test"
      | "development"
      | "validation"
      | "release_candidate";
    analysisPlanSha256: string;
    candidateArmId: string;
    candidateFrozenAt: string;
    holdoutOpenedAt: string | null;
    startedAt: string;
    completedAt: string;
    normalProviderConditions: boolean;
  }>;
  arms: readonly StoryQualityArm[];
}>;

type QualityRecipeManifest = Readonly<{
  recipeId: string;
  manifestSha256: string;
  storyComposerMode: string;
  hybridStoryComposerEnabled: boolean;
  composerVersion: string;
  validatorVersion: string;
  storySpecSchemaVersion: string;
  boundaryPolicyVersion: string;
  resonanceBriefVersion: string;
  [key: string]: unknown;
}>;

export type QualityRecipeRegistry = Readonly<{
  recipes: readonly QualityRecipeManifest[];
}>;

type RateMetric = Readonly<{
  numerator: number;
  denominator: number;
  rate: number | null;
  threshold: number;
  passed: boolean;
  comparison: "at_least" | "at_most";
}>;

type DimensionMetric = Readonly<{
  histogram: Readonly<Record<(typeof SCORE_BUCKETS)[number], number>>;
  reviewedCases: number;
  mean: number | null;
  acceptableCases: number;
  acceptableRate: number | null;
  meanThreshold: number;
  acceptableScoreThreshold: number;
  acceptableRateThreshold: number;
  passed: boolean;
}>;

export type StoryQualityArmEvidence = Readonly<{
  role: StoryQualityArm["role"];
  recipeId: string;
  recipeManifestSha256: string;
  personalizationAttempted: boolean;
  sample: Readonly<{
    sessions: number;
    feedbackResponses: number;
    expertReviews: number;
    targetReaderReviews: number;
    criticalFailureArtifacts: number;
  }>;
  dimensions: Readonly<Record<RubricDimension, DimensionMetric>>;
  outcomes: Readonly<{
    feltClose: RateMetric;
    completion: RateMetric;
    firstPassValidation: RateMetric;
    canonicalFallback: RateMetric | null;
  }>;
  criticalFailures: Readonly<Record<CriticalFailureCategory, number>>;
  checks: Readonly<{
    consent: boolean;
    cohortRepresentation: boolean;
    reviewCoverage: boolean;
    reviewerIndependence: boolean;
    sessionMinimum: boolean;
    feedbackMinimum: boolean;
    rubricFloors: boolean;
    outcomeFloors: boolean;
    criticalFailures: boolean;
  }>;
  status: StoryQualityStatus;
}>;

export type StoryQualityEvidence = Readonly<{
  schemaVersion: typeof STORY_QUALITY_EVIDENCE_SCHEMA_VERSION;
  harnessVersion: typeof STORY_QUALITY_HARNESS_VERSION;
  evidenceId: string;
  status: StoryQualityStatus;
  policy: Readonly<{
    policyVersion: string;
    policySha256: string;
    protocolVersion: string;
    protocolSha256: string;
  }>;
  benchmark: Readonly<{
    benchmarkVersion: string;
    visibility: StoryQualityPacket["benchmark"]["visibility"];
    split: StoryQualityBenchmarkCase["split"];
    caseCount: number;
    cohortCellCount: number;
    packetAttestationSha256: string;
  }>;
  candidate: Readonly<{
    recipeId: string;
    recipeManifestSha256: string;
  }>;
  arms: readonly StoryQualityArmEvidence[];
  comparison: Readonly<{
    baselineRecipeId: string;
    candidateRecipeId: string;
    meanRubricRegressionWithinLimit: boolean;
    completionRegressionWithinLimit: boolean;
    feltCloseRegressionWithinLimit: boolean;
    passed: boolean;
  }>;
  checks: Readonly<{
    protectedHoldout: boolean;
    holdoutChronology: boolean;
    pairedCaseSet: boolean;
    normalProviderConditions: boolean;
    provenance: boolean;
    candidateAbsoluteGate: boolean;
    candidateNonInferiority: boolean;
    noCriticalFailures: boolean;
    reviewerIndependence: boolean;
  }>;
  failureReasons: readonly (
    | "critical_failure"
    | "rubric_floor"
    | "felt_close_rate"
    | "completion_rate"
    | "first_pass_rate"
    | "fallback_rate"
    | "baseline_regression"
  )[];
  incompleteReasons: readonly (
    | "synthetic_or_non_holdout"
    | "holdout_chronology"
    | "sample_size"
    | "feedback_coverage"
    | "consent"
    | "cohort_representation"
    | "review_coverage"
    | "reviewer_independence"
    | "provider_conditions"
    | "provenance"
  )[];
  provenance: Readonly<{
    gitCommit: string | null;
    deploymentId: string | null;
    runId: string;
    inputTreeSha256: string | null;
    completedAt: string;
  }>;
  promotionAuthorized: false;
}>;

export type StoryQualityEvaluationOptions = Readonly<{
  hmacSecret: string | Uint8Array;
  policy?: StoryQualityPolicy;
  registry?: QualityRecipeRegistry;
  provenance?: Readonly<{
    gitCommit: string | null;
    deploymentId: string | null;
    inputTreeSha256: string | null;
  }>;
  protocolPath?: string;
}>;

export function loadStoryQualityPolicy(
  path = STORY_QUALITY_POLICY_PATH,
): StoryQualityPolicy {
  try {
    return parseStoryQualityPolicy(
      JSON.parse(readFileSync(path, "utf8")) as unknown,
    );
  } catch (error) {
    if (error instanceof StoryQualityError) throw error;
    throw new StoryQualityError("policy_invalid");
  }
}

export function parseStoryQualityPolicy(
  value: unknown,
): StoryQualityPolicy {
  try {
    const policy = record(value);
    exactKeys(policy, [
      "schemaVersion",
      "policyVersion",
      "protocolVersion",
      "evidenceSchemaVersion",
      "packetSchemaVersion",
      "benchmarkSchemaVersion",
      "requiredReleaseSplit",
      "minimums",
      "maximums",
      "rubricDimensions",
      "criticalFailureCategories",
    ]);
    assert(policy.schemaVersion === STORY_QUALITY_POLICY_SCHEMA_VERSION);
    assert(id(policy.policyVersion));
    assert(policy.protocolVersion === STORY_QUALITY_PROTOCOL_VERSION);
    assert(
      policy.evidenceSchemaVersion ===
        STORY_QUALITY_EVIDENCE_SCHEMA_VERSION,
    );
    assert(
      policy.packetSchemaVersion === STORY_QUALITY_PACKET_SCHEMA_VERSION,
    );
    assert(
      policy.benchmarkSchemaVersion ===
        STORY_QUALITY_BENCHMARK_SCHEMA_VERSION,
    );
    assert(policy.requiredReleaseSplit === "blind_holdout");

    const minimums = record(policy.minimums);
    exactKeys(minimums, [
      "targetAudienceSessions",
      "feedbackResponses",
      "expertReviewsPerArtifact",
      "targetReaderReviewsPerArtifact",
      "feltCloseRate",
      "completionRate",
      "firstPassValidationRate",
      "meanRubricScore",
      "acceptableRubricScore",
      "acceptableRubricRate",
    ]);
    const parsedMinimums = {
      targetAudienceSessions: positiveInteger(
        minimums.targetAudienceSessions,
      ),
      feedbackResponses: positiveInteger(minimums.feedbackResponses),
      expertReviewsPerArtifact: positiveInteger(
        minimums.expertReviewsPerArtifact,
      ),
      targetReaderReviewsPerArtifact: positiveInteger(
        minimums.targetReaderReviewsPerArtifact,
      ),
      feltCloseRate: ratio(minimums.feltCloseRate),
      completionRate: ratio(minimums.completionRate),
      firstPassValidationRate: ratio(
        minimums.firstPassValidationRate,
      ),
      meanRubricScore: boundedNumber(minimums.meanRubricScore, 1, 5),
      acceptableRubricScore: boundedInteger(
        minimums.acceptableRubricScore,
        1,
        5,
      ),
      acceptableRubricRate: ratio(minimums.acceptableRubricRate),
    };
    assert(
      parsedMinimums.feedbackResponses <=
        parsedMinimums.targetAudienceSessions,
    );
    assert(
      parsedMinimums.targetAudienceSessions >= 150 &&
        parsedMinimums.feedbackResponses >= 75 &&
        parsedMinimums.expertReviewsPerArtifact >= 2 &&
        parsedMinimums.targetReaderReviewsPerArtifact >= 1 &&
        parsedMinimums.feltCloseRate >= 0.7 &&
        parsedMinimums.completionRate >= 0.6 &&
        parsedMinimums.firstPassValidationRate >= 0.95 &&
        parsedMinimums.meanRubricScore >= 3.5 &&
        parsedMinimums.acceptableRubricScore >= 3 &&
        parsedMinimums.acceptableRubricRate >= 0.8,
    );

    const maximums = record(policy.maximums);
    exactKeys(maximums, [
      "canonicalFallbackRate",
      "criticalFailureArtifacts",
      "meanRubricRegression",
      "completionRateRegression",
      "feltCloseRateRegression",
    ]);
    const parsedMaximums = {
      canonicalFallbackRate: ratio(maximums.canonicalFallbackRate),
      criticalFailureArtifacts: nonNegativeInteger(
        maximums.criticalFailureArtifacts,
      ),
      meanRubricRegression: boundedNumber(
        maximums.meanRubricRegression,
        0,
        4,
      ),
      completionRateRegression: ratio(
        maximums.completionRateRegression,
      ),
      feltCloseRateRegression: ratio(
        maximums.feltCloseRateRegression,
      ),
    };
    assert(
      parsedMaximums.canonicalFallbackRate <= 0.05 &&
        parsedMaximums.criticalFailureArtifacts === 0 &&
        parsedMaximums.meanRubricRegression <= 0.15 &&
        parsedMaximums.completionRateRegression <= 0.05 &&
        parsedMaximums.feltCloseRateRegression <= 0.05,
    );

    const dimensions = exactEnumArray(
      policy.rubricDimensions,
      RUBRIC_DIMENSIONS,
    );
    const critical = exactEnumArray(
      policy.criticalFailureCategories,
      CRITICAL_FAILURE_CATEGORIES,
    );
    return deepFreeze({
      schemaVersion: STORY_QUALITY_POLICY_SCHEMA_VERSION,
      policyVersion: policy.policyVersion as string,
      protocolVersion: STORY_QUALITY_PROTOCOL_VERSION,
      evidenceSchemaVersion: STORY_QUALITY_EVIDENCE_SCHEMA_VERSION,
      packetSchemaVersion: STORY_QUALITY_PACKET_SCHEMA_VERSION,
      benchmarkSchemaVersion: STORY_QUALITY_BENCHMARK_SCHEMA_VERSION,
      requiredReleaseSplit: "blind_holdout",
      minimums: parsedMinimums,
      maximums: parsedMaximums,
      rubricDimensions: dimensions,
      criticalFailureCategories: critical,
    });
  } catch {
    throw new StoryQualityError("policy_invalid");
  }
}

export function parseStoryQualityPacket(
  value: unknown,
  policy = loadStoryQualityPolicy(),
): StoryQualityPacket {
  try {
    const input = record(value);
    exactKeys(input, ["schemaVersion", "benchmark", "run", "arms"]);
    assert(input.schemaVersion === policy.packetSchemaVersion);
    const benchmark = parseBenchmark(input.benchmark, policy);
    const run = parseRun(input.run);
    const arms = array(input.arms).map(parseArm).sort(by("armId"));
    assert(arms.length >= 2);
    unique(arms.map((arm) => arm.armId));
    unique(arms.map((arm) => arm.recipeId));
    assert(arms.filter((arm) => arm.role === "baseline").length === 1);
    assert(arms.filter((arm) => arm.role === "candidate").length === 1);
    assert(arms.some((arm) => arm.armId === run.candidateArmId));
    assert(
      arms.find((arm) => arm.armId === run.candidateArmId)?.role ===
        "candidate",
    );
    return deepFreeze({
      schemaVersion: STORY_QUALITY_PACKET_SCHEMA_VERSION,
      benchmark,
      run,
      arms,
    });
  } catch (error) {
    if (error instanceof StoryQualityError) throw error;
    throw new StoryQualityError("packet_invalid");
  }
}

export function storyQualityInputCommitment(
  disclosure: string,
  secret: string | Uint8Array,
): string {
  if (
    typeof disclosure !== "string" ||
    disclosure.length < 1 ||
    disclosure.length > 20_000 ||
    secretByteLength(secret) < 32
  ) {
    throw new StoryQualityError("privacy_invalid");
  }
  const digest = createHmac("sha256", secret)
    .update("story-quality-case-v1\u0000", "utf8")
    .update(disclosure.normalize("NFC"), "utf8")
    .digest("hex");
  return `hmac-sha256:story-quality-case-v1:${digest}`;
}

export function storyQualityPolicySha256(
  policy: StoryQualityPolicy,
): string {
  return sha256Text(canonicalJson(policy));
}

export function storyQualityBenchmarkManifestSha256(
  benchmark: Omit<
    StoryQualityPacket["benchmark"],
    "manifestSha256"
  >,
): string {
  const payload = {
    schemaVersion: benchmark.schemaVersion,
    benchmarkVersion: benchmark.benchmarkVersion,
    visibility: benchmark.visibility,
    frozenAt: benchmark.frozenAt,
    holdoutSealedAt: benchmark.holdoutSealedAt,
    consentProtocolVersion: benchmark.consentProtocolVersion,
    deduplicationReportSha256: benchmark.deduplicationReportSha256,
    cases: benchmark.cases.map(
      ({
        disclosure: _disclosure,
        boundaries: _boundaries,
        ...entry
      }) => {
        void _disclosure;
        void _boundaries;
        return entry;
      },
    ),
    cohortTargets: benchmark.cohortTargets,
  };
  return sha256Text(canonicalJson(payload));
}

export function evaluateStoryQualityPacket(
  input: unknown,
  options: StoryQualityEvaluationOptions,
): StoryQualityEvidence {
  try {
    return evaluateStoryQualityPacketUnsafe(input, options);
  } catch (error) {
    if (error instanceof StoryQualityError) throw error;
    throw new StoryQualityError("packet_invalid");
  }
}

function evaluateStoryQualityPacketUnsafe(
  input: unknown,
  options: StoryQualityEvaluationOptions,
): StoryQualityEvidence {
  const policy = options.policy ?? loadStoryQualityPolicy();
  const packet = parseStoryQualityPacket(input, policy);
  const registry =
    options.registry ??
    (loadRecipeRegistry() as unknown as QualityRecipeRegistry);
  const recipes = new Map(
    registry.recipes.map((recipe) => [recipe.recipeId, recipe]),
  );
  assertBinding(recipes.size === registry.recipes.length);
  const selectedSplit = splitForPurpose(packet.run.purpose);
  const benchmarkCases = packet.benchmark.cases.filter(
    (entry) => entry.split === selectedSplit,
  );
  assertBinding(benchmarkCases.length > 0);
  const caseIds = benchmarkCases.map((entry) => entry.caseId).sort();
  const caseById = new Map(
    benchmarkCases.map((entry) => [entry.caseId, entry]),
  );
  for (const benchmarkCase of benchmarkCases) {
    assertPrivacy(
      benchmarkCase.inputCommitment ===
        storyQualityInputCommitment(
          benchmarkCase.disclosure,
          options.hmacSecret,
        ),
    );
  }
  unique(packet.benchmark.cases.map((entry) => entry.inputCommitment));
  const artifactIds: string[] = [];
  const artifactDocuments: string[] = [];
  const reviewIds: string[] = [];
  for (const arm of packet.arms) {
    for (const observation of arm.observations) {
      artifactIds.push(observation.artifact.artifactId);
      artifactDocuments.push(observation.artifactDocumentSha256);
      reviewIds.push(
        ...observation.expertReviews.map((entry) => entry.reviewId),
        ...observation.targetReaderReviews.map((entry) => entry.reviewId),
      );
    }
  }
  unique(artifactIds);
  unique(artifactDocuments);
  unique(reviewIds);

  const armEvidence: StoryQualityArmEvidence[] = [];
  for (const arm of packet.arms) {
    assertBinding(
      canonicalJson(
        arm.observations.map((entry) => entry.caseId).sort(),
      ) === canonicalJson(caseIds),
    );
    const recipe = recipes.get(arm.recipeId);
    assertBinding(recipe !== undefined);
    assertBinding(recipe?.manifestSha256 === arm.recipeManifestSha256);
    assertBinding(
      recipeManifestDigest(recipe!) === recipe!.manifestSha256,
    );
    assertBinding(
      arm.personalizationAttempted ===
        recipe!.hybridStoryComposerEnabled,
    );
    for (const observation of arm.observations) {
      const benchmarkCase = caseById.get(observation.caseId);
      assertBinding(benchmarkCase !== undefined);
      validateObservationContent(observation, benchmarkCase!, arm, recipe!);
    }
    armEvidence.push(
      buildArmEvidence(
        arm,
        benchmarkCases,
        packet.benchmark.cohortTargets,
        policy,
      ),
    );
  }

  const baselineArm = packet.arms.find((arm) => arm.role === "baseline")!;
  const candidateArm = packet.arms.find(
    (arm) => arm.armId === packet.run.candidateArmId,
  )!;
  const baselineEvidence = armEvidence.find(
    (entry) => entry.recipeId === baselineArm.recipeId,
  )!;
  const candidateEvidence = armEvidence.find(
    (entry) => entry.recipeId === candidateArm.recipeId,
  )!;
  const comparison = compareArms(
    baselineEvidence,
    candidateEvidence,
    policy,
  );
  const crossArmReviewerIndependence =
    hasCrossArmReviewerIndependence(packet.arms);

  const protectedHoldout =
    packet.run.purpose === "release_candidate" &&
    packet.benchmark.visibility === "protected_holdout" &&
    selectedSplit === policy.requiredReleaseSplit;
  const holdoutChronology = validHoldoutChronology(packet);
  const provenance = options.provenance ?? {
    gitCommit: currentGitCommit(),
    deploymentId: currentDeploymentId(),
    inputTreeSha256: gitInputTreeSha256(),
  };
  const provenanceComplete =
    fullCommit(provenance.gitCommit) &&
    provenance.deploymentId !== null &&
    deploymentId(provenance.deploymentId) &&
    hash(provenance.inputTreeSha256);
  const noCriticalFailures = armEvidence.every(
    (entry) =>
      entry.sample.criticalFailureArtifacts <=
      policy.maximums.criticalFailureArtifacts,
  );
  const candidateAbsoluteGate =
    candidateEvidence.checks.sessionMinimum &&
    candidateEvidence.checks.feedbackMinimum &&
    candidateEvidence.checks.consent &&
    candidateEvidence.checks.cohortRepresentation &&
    candidateEvidence.checks.reviewCoverage &&
    candidateEvidence.checks.reviewerIndependence &&
    candidateEvidence.checks.rubricFloors &&
    candidateEvidence.checks.outcomeFloors &&
    candidateEvidence.checks.criticalFailures;
  const pairedCoverage = [baselineEvidence, candidateEvidence].every(
    (entry) =>
      entry.checks.sessionMinimum &&
      entry.checks.feedbackMinimum &&
      entry.checks.consent &&
      entry.checks.cohortRepresentation &&
      entry.checks.reviewCoverage &&
      entry.checks.reviewerIndependence,
  );
  const coverageComplete =
    protectedHoldout &&
    holdoutChronology &&
    packet.run.normalProviderConditions &&
    provenanceComplete &&
    pairedCoverage &&
    crossArmReviewerIndependence;
  const failureReasons = collectFailureReasons(
    candidateEvidence,
    comparison.passed,
    noCriticalFailures,
  );
  const incompleteReasons = collectIncompleteReasons({
    protectedHoldout,
    holdoutChronology,
    providerConditions: packet.run.normalProviderConditions,
    provenanceComplete,
    candidate: candidateEvidence,
    baseline: baselineEvidence,
    crossArmReviewerIndependence,
  });
  const status: StoryQualityStatus = !noCriticalFailures
    ? "fail"
    : !coverageComplete
      ? "incomplete"
      : candidateAbsoluteGate && comparison.passed
        ? "pass"
        : "fail";

  const protocolPath = options.protocolPath ?? STORY_QUALITY_PROTOCOL_PATH;
  let protocolSha256: string;
  try {
    protocolSha256 = sha256File(protocolPath);
  } catch {
    throw new StoryQualityError("provenance_invalid");
  }
  const policySha256 = storyQualityPolicySha256(policy);
  const candidate = {
    recipeId: candidateArm.recipeId,
    recipeManifestSha256: candidateArm.recipeManifestSha256,
  };
  const candidateRecord = {
    schemaVersion: STORY_QUALITY_EVIDENCE_SCHEMA_VERSION,
    harnessVersion: STORY_QUALITY_HARNESS_VERSION,
    evidenceId: "",
    status,
    policy: {
      policyVersion: policy.policyVersion,
      policySha256,
      protocolVersion: policy.protocolVersion,
      protocolSha256,
    },
    benchmark: {
      benchmarkVersion: packet.benchmark.benchmarkVersion,
      visibility: packet.benchmark.visibility,
      split: selectedSplit,
      caseCount: benchmarkCases.length,
      cohortCellCount: packet.benchmark.cohortTargets.length,
      packetAttestationSha256: sha256Text(canonicalJson(packet)),
    },
    candidate,
    arms: armEvidence,
    comparison,
    checks: {
      protectedHoldout,
      holdoutChronology,
      pairedCaseSet: true,
      normalProviderConditions: packet.run.normalProviderConditions,
      provenance: provenanceComplete,
      candidateAbsoluteGate,
      candidateNonInferiority: comparison.passed,
      noCriticalFailures,
      reviewerIndependence: crossArmReviewerIndependence,
    },
    failureReasons,
    incompleteReasons,
    provenance: {
      ...provenance,
      runId: packet.run.runId,
      completedAt: packet.run.completedAt,
    },
    promotionAuthorized: false as const,
  } satisfies StoryQualityEvidence;
  const evidence = {
    ...candidateRecord,
    evidenceId: storyQualityEvidenceId(candidateRecord),
  };
  assertSafeEvidence(evidence);
  return deepFreeze(evidence);
}

export function storyQualityEvidenceId(
  evidence: Omit<StoryQualityEvidence, "evidenceId"> | StoryQualityEvidence,
): string {
  const payload = {
    ...(evidence as StoryQualityEvidence),
  } as Record<string, unknown>;
  delete payload.evidenceId;
  return `sqe_${sha256Text(canonicalJson(payload))}`;
}

export function parseStoryQualityEvidence(
  value: unknown,
  policy = loadStoryQualityPolicy(),
  protocolPath = STORY_QUALITY_PROTOCOL_PATH,
): StoryQualityEvidence {
  try {
    const evidence = record(value);
    exactKeys(evidence, [
      "schemaVersion",
      "harnessVersion",
      "evidenceId",
      "status",
      "policy",
      "benchmark",
      "candidate",
      "arms",
      "comparison",
      "checks",
      "failureReasons",
      "incompleteReasons",
      "provenance",
      "promotionAuthorized",
    ]);
    assert(
      evidence.schemaVersion === STORY_QUALITY_EVIDENCE_SCHEMA_VERSION,
      "evidence_invalid",
    );
    assert(
      evidence.harnessVersion === STORY_QUALITY_HARNESS_VERSION,
      "evidence_invalid",
    );
    assert(
      typeof evidence.evidenceId === "string" &&
        /^sqe_[0-9a-f]{64}$/.test(evidence.evidenceId),
      "evidence_invalid",
    );
    assertQualityStatus(evidence.status);

    const policyBinding = record(evidence.policy);
    exactKeys(policyBinding, [
      "policyVersion",
      "policySha256",
      "protocolVersion",
      "protocolSha256",
    ]);
    assert(
      policyBinding.policyVersion === policy.policyVersion &&
        policyBinding.policySha256 ===
          storyQualityPolicySha256(policy) &&
        policyBinding.protocolVersion === policy.protocolVersion &&
        policyBinding.protocolSha256 === sha256File(protocolPath),
      "evidence_invalid",
    );

    const benchmark = record(evidence.benchmark);
    exactKeys(benchmark, [
      "benchmarkVersion",
      "visibility",
      "split",
      "caseCount",
      "cohortCellCount",
      "packetAttestationSha256",
    ]);
    assert(
      id(benchmark.benchmarkVersion) &&
        (benchmark.visibility === "synthetic" ||
          benchmark.visibility === "protected_holdout") &&
        (benchmark.split === "development" ||
          benchmark.split === "validation" ||
          benchmark.split === "blind_holdout") &&
        positiveInteger(benchmark.caseCount) > 0 &&
        positiveInteger(benchmark.cohortCellCount) > 0 &&
        hash(benchmark.packetAttestationSha256),
      "evidence_invalid",
    );

    const candidate = record(evidence.candidate);
    exactKeys(candidate, ["recipeId", "recipeManifestSha256"]);
    assert(
      id(candidate.recipeId) && hash(candidate.recipeManifestSha256),
      "evidence_invalid",
    );
    const arms = array(evidence.arms).map((entry) =>
      parseArmEvidence(entry, policy),
    );
    assert(arms.length >= 2, "evidence_invalid");
    unique(arms.map((entry) => entry.recipeId));
    const baseline = arms.find((entry) => entry.role === "baseline");
    const candidateArm = arms.find((entry) => entry.role === "candidate");
    assert(
      baseline !== undefined &&
        candidateArm !== undefined &&
        arms.filter((entry) => entry.role === "baseline").length === 1 &&
        arms.filter((entry) => entry.role === "candidate").length === 1 &&
        candidateArm.recipeId === candidate.recipeId &&
        candidateArm.recipeManifestSha256 ===
          candidate.recipeManifestSha256,
      "evidence_invalid",
    );

    const comparisonRecord = record(evidence.comparison);
    exactKeys(comparisonRecord, [
      "baselineRecipeId",
      "candidateRecipeId",
      "meanRubricRegressionWithinLimit",
      "completionRegressionWithinLimit",
      "feltCloseRegressionWithinLimit",
      "passed",
    ]);
    const comparison = compareArms(baseline, candidateArm, policy);
    assert(
      canonicalJson(comparisonRecord) === canonicalJson(comparison),
      "evidence_invalid",
    );

    const checksRecord = record(evidence.checks);
    exactKeys(checksRecord, [
      "protectedHoldout",
      "holdoutChronology",
      "pairedCaseSet",
      "normalProviderConditions",
      "provenance",
      "candidateAbsoluteGate",
      "candidateNonInferiority",
      "noCriticalFailures",
      "reviewerIndependence",
    ]);
    const checks = parseBooleanRecord(checksRecord);
    const protectedHoldout =
      benchmark.visibility === "protected_holdout" &&
      benchmark.split === policy.requiredReleaseSplit;
    const noCriticalFailures = arms.every(
      (entry) =>
        entry.sample.criticalFailureArtifacts <=
        policy.maximums.criticalFailureArtifacts,
    );
    const candidateAbsoluteGate =
      candidateArm.checks.sessionMinimum &&
      candidateArm.checks.feedbackMinimum &&
      candidateArm.checks.consent &&
      candidateArm.checks.cohortRepresentation &&
      candidateArm.checks.reviewCoverage &&
      candidateArm.checks.reviewerIndependence &&
      candidateArm.checks.rubricFloors &&
      candidateArm.checks.outcomeFloors &&
      candidateArm.checks.criticalFailures;
    assert(
      checks.protectedHoldout === protectedHoldout &&
        checks.pairedCaseSet === true &&
        checks.candidateAbsoluteGate === candidateAbsoluteGate &&
        checks.candidateNonInferiority === comparison.passed &&
        checks.noCriticalFailures === noCriticalFailures,
      "evidence_invalid",
    );

    const failureReasons = parseFailureReasons(evidence.failureReasons);
    assert(
      canonicalJson(failureReasons) ===
        canonicalJson(
          collectFailureReasons(
            candidateArm,
            comparison.passed,
            noCriticalFailures,
          ),
        ),
      "evidence_invalid",
    );
    const incompleteReasons = parseIncompleteReasons(
      evidence.incompleteReasons,
    );
    const expectedIncomplete = collectIncompleteReasons({
      protectedHoldout,
      holdoutChronology: checks.holdoutChronology,
      providerConditions: checks.normalProviderConditions,
      provenanceComplete: checks.provenance,
      candidate: candidateArm,
      baseline,
      crossArmReviewerIndependence: checks.reviewerIndependence,
    });
    assert(
      canonicalJson(incompleteReasons) ===
        canonicalJson(expectedIncomplete),
      "evidence_invalid",
    );

    const provenanceRecord = record(evidence.provenance);
    exactKeys(provenanceRecord, [
      "gitCommit",
      "deploymentId",
      "runId",
      "inputTreeSha256",
      "completedAt",
    ]);
    assert(
      (provenanceRecord.gitCommit === null ||
        fullCommit(provenanceRecord.gitCommit)) &&
        (provenanceRecord.deploymentId === null ||
          deploymentId(provenanceRecord.deploymentId)) &&
        id(provenanceRecord.runId) &&
        (provenanceRecord.inputTreeSha256 === null ||
          hash(provenanceRecord.inputTreeSha256)) &&
        timestamp(provenanceRecord.completedAt),
      "evidence_invalid",
    );
    const provenanceComplete =
      fullCommit(provenanceRecord.gitCommit) &&
      deploymentId(provenanceRecord.deploymentId) &&
      hash(provenanceRecord.inputTreeSha256);
    assert(
      checks.provenance === provenanceComplete,
      "evidence_invalid",
    );
    const coverageComplete =
      protectedHoldout &&
      checks.holdoutChronology &&
      checks.pairedCaseSet &&
      checks.normalProviderConditions &&
      provenanceComplete &&
      checks.reviewerIndependence &&
      [baseline, candidateArm].every(
        (entry) =>
          entry.checks.sessionMinimum &&
          entry.checks.feedbackMinimum &&
          entry.checks.consent &&
          entry.checks.cohortRepresentation &&
          entry.checks.reviewCoverage &&
          entry.checks.reviewerIndependence,
      );
    const expectedStatus: StoryQualityStatus = !noCriticalFailures
      ? "fail"
      : !coverageComplete
        ? "incomplete"
        : candidateAbsoluteGate && comparison.passed
          ? "pass"
          : "fail";
    assert(
      evidence.status === expectedStatus &&
        evidence.promotionAuthorized === false,
      "evidence_invalid",
    );

    const parsed = evidence as unknown as StoryQualityEvidence;
    assert(
      parsed.evidenceId === storyQualityEvidenceId(parsed),
      "evidence_invalid",
    );
    assertSafeEvidence(parsed);
    return deepFreeze(parsed);
  } catch (error) {
    if (
      error instanceof StoryQualityError &&
      error.code === "evidence_invalid"
    ) {
      throw error;
    }
    throw new StoryQualityError("evidence_invalid");
  }
}

export function writeStoryQualityEvidence(
  evidence: StoryQualityEvidence,
  root = STORY_QUALITY_HISTORY_DIR,
): string {
  try {
    const parsed = parseStoryQualityEvidence(evidence);
    const directory = resolve(
      root,
      parsed.benchmark.benchmarkVersion,
      parsed.candidate.recipeId,
    );
    mkdirSync(directory, { recursive: true });
    const path = resolve(directory, `${parsed.evidenceId}.json`);
    const options: WriteFileOptions = { encoding: "utf8", flag: "wx" };
    writeFileSync(path, `${JSON.stringify(parsed, null, 2)}\n`, options);
    return path;
  } catch (error) {
    if (error instanceof StoryQualityError) throw error;
    throw new StoryQualityError("write_failed");
  }
}

function parseBenchmark(
  value: unknown,
  policy: StoryQualityPolicy,
): StoryQualityPacket["benchmark"] {
  const benchmark = record(value);
  exactKeys(benchmark, [
    "schemaVersion",
    "benchmarkVersion",
    "visibility",
    "frozenAt",
    "holdoutSealedAt",
    "consentProtocolVersion",
    "deduplicationReportSha256",
    "manifestSha256",
    "cases",
    "cohortTargets",
  ]);
  assert(benchmark.schemaVersion === policy.benchmarkSchemaVersion);
  assert(id(benchmark.benchmarkVersion));
  assert(
    benchmark.visibility === "synthetic" ||
      benchmark.visibility === "protected_holdout",
  );
  assert(timestamp(benchmark.frozenAt));
  assert(
    benchmark.holdoutSealedAt === null ||
      timestamp(benchmark.holdoutSealedAt),
  );
  assert(id(benchmark.consentProtocolVersion));
  assert(hash(benchmark.deduplicationReportSha256));
  assert(hash(benchmark.manifestSha256));
  const cases = array(benchmark.cases).map(parseBenchmarkCase).sort(by("caseId"));
  assert(cases.length > 0 && cases.length <= 10_000);
  unique(cases.map((entry) => entry.caseId));
  const cohortTargets = array(benchmark.cohortTargets)
    .map((entry) => {
      const target = record(entry);
      exactKeys(target, ["cohortCellId", "minimumSessions"]);
      assert(id(target.cohortCellId));
      return {
        cohortCellId: target.cohortCellId as string,
        minimumSessions: positiveInteger(target.minimumSessions),
      };
    })
    .sort(by("cohortCellId"));
  assert(cohortTargets.length > 0);
  unique(cohortTargets.map((entry) => entry.cohortCellId));
  const knownCells = new Set(
    cohortTargets.map((entry) => entry.cohortCellId),
  );
  assert(cases.every((entry) => knownCells.has(entry.cohortCellId)));
  const manifestPayload: Omit<
    StoryQualityPacket["benchmark"],
    "manifestSha256"
  > = {
    schemaVersion: STORY_QUALITY_BENCHMARK_SCHEMA_VERSION,
    benchmarkVersion: benchmark.benchmarkVersion as string,
    visibility: benchmark.visibility as
      | "synthetic"
      | "protected_holdout",
    frozenAt: benchmark.frozenAt as string,
    holdoutSealedAt: benchmark.holdoutSealedAt as string | null,
    consentProtocolVersion: benchmark.consentProtocolVersion as string,
    deduplicationReportSha256:
      benchmark.deduplicationReportSha256 as string,
    cases,
    cohortTargets,
  };
  assert(
    benchmark.manifestSha256 ===
      storyQualityBenchmarkManifestSha256(manifestPayload),
  );
  return {
    ...manifestPayload,
    manifestSha256: benchmark.manifestSha256 as string,
    cases,
    cohortTargets,
  } as StoryQualityPacket["benchmark"];
}

function parseBenchmarkCase(value: unknown): StoryQualityBenchmarkCase {
  const entry = record(value);
  exactKeys(entry, [
    "caseId",
    "inputCommitment",
    "split",
    "cohortCellId",
    "consented",
    "deidentified",
    "disclosure",
    "boundaries",
  ]);
  assert(id(entry.caseId));
  assert(
    typeof entry.inputCommitment === "string" &&
      COMMITMENT.test(entry.inputCommitment),
  );
  assert(
    entry.split === "development" ||
      entry.split === "validation" ||
      entry.split === "blind_holdout",
  );
  assert(id(entry.cohortCellId));
  assert(typeof entry.consented === "boolean");
  assert(typeof entry.deidentified === "boolean");
  assert(
    typeof entry.disclosure === "string" &&
      entry.disclosure.length > 0 &&
      entry.disclosure.length <= 20_000,
  );
  const parsedBoundaries =
    entry.boundaries === null
      ? null
      : parseStoryBoundaries(entry.boundaries);
  assert(
    parsedBoundaries === null ||
      !("error" in parsedBoundaries),
  );
  return {
    caseId: entry.caseId as string,
    inputCommitment: entry.inputCommitment,
    split: entry.split,
    cohortCellId: entry.cohortCellId as string,
    consented: entry.consented,
    deidentified: entry.deidentified,
    disclosure: entry.disclosure.normalize("NFC"),
    boundaries:
      parsedBoundaries === null
        ? null
        : (parsedBoundaries.value ?? null),
  };
}

function parseRun(value: unknown): StoryQualityPacket["run"] {
  const run = record(value);
  exactKeys(run, [
    "runId",
    "purpose",
    "analysisPlanSha256",
    "candidateArmId",
    "candidateFrozenAt",
    "holdoutOpenedAt",
    "startedAt",
    "completedAt",
    "normalProviderConditions",
  ]);
  assert(id(run.runId));
  assert(
    run.purpose === "contract_test" ||
      run.purpose === "development" ||
      run.purpose === "validation" ||
      run.purpose === "release_candidate",
  );
  assert(hash(run.analysisPlanSha256));
  assert(id(run.candidateArmId));
  assert(timestamp(run.candidateFrozenAt));
  assert(run.holdoutOpenedAt === null || timestamp(run.holdoutOpenedAt));
  assert(timestamp(run.startedAt));
  assert(timestamp(run.completedAt));
  assert(
    Date.parse(run.startedAt) <= Date.parse(run.completedAt),
  );
  assert(typeof run.normalProviderConditions === "boolean");
  return run as StoryQualityPacket["run"];
}

function parseArm(value: unknown): StoryQualityArm {
  const arm = record(value);
  exactKeys(arm, [
    "armId",
    "role",
    "personalizationAttempted",
    "recipeId",
    "recipeManifestSha256",
    "observations",
  ]);
  assert(id(arm.armId));
  assert(
    arm.role === "baseline" ||
      arm.role === "candidate" ||
      arm.role === "challenger",
  );
  assert(typeof arm.personalizationAttempted === "boolean");
  assert(id(arm.recipeId));
  assert(hash(arm.recipeManifestSha256));
  const observations = array(arm.observations)
    .map(parseObservation)
    .sort(by("caseId"));
  assert(observations.length > 0);
  unique(observations.map((entry) => entry.caseId));
  return {
    armId: arm.armId as string,
    role: arm.role,
    personalizationAttempted: arm.personalizationAttempted,
    recipeId: arm.recipeId as string,
    recipeManifestSha256: arm.recipeManifestSha256 as string,
    observations,
  };
}

function parseObservation(value: unknown): StoryQualityObservation {
  const observation = record(value);
  exactKeys(observation, [
    "caseId",
    "artifactDocumentSha256",
    "storySpecDocumentSha256",
    "artifact",
    "storySpec",
    "outcome",
    "expertReviews",
    "targetReaderReviews",
  ]);
  assert(id(observation.caseId));
  assert(hash(observation.artifactDocumentSha256));
  assert(hash(observation.storySpecDocumentSha256));
  assertExactStoryArtifactShape(observation.artifact);
  assertExactStorySpecShape(observation.storySpec);
  const outcome = record(observation.outcome);
  exactKeys(outcome, [
    "compositionOutcome",
    "finalBridgeCompleted",
    "feedbackVerdict",
  ]);
  assert(
    outcome.compositionOutcome === "first_pass_validated" ||
      outcome.compositionOutcome === "retry_validated" ||
      outcome.compositionOutcome === "canonical_fallback",
  );
  assert(typeof outcome.finalBridgeCompleted === "boolean");
  assert(
    outcome.feedbackVerdict === "close" ||
      outcome.feedbackVerdict === "not_close" ||
      outcome.feedbackVerdict === "no_response",
  );
  const expertReviews = array(observation.expertReviews)
    .map(parseExpertReview)
    .sort(by("reviewId"));
  const targetReaderReviews = array(observation.targetReaderReviews)
    .map(parseTargetReaderReview)
    .sort(by("reviewId"));
  unique([
    ...expertReviews.map((entry) => entry.reviewId),
    ...targetReaderReviews.map((entry) => entry.reviewId),
  ]);
  return {
    caseId: observation.caseId as string,
    artifactDocumentSha256:
      observation.artifactDocumentSha256 as string,
    storySpecDocumentSha256:
      observation.storySpecDocumentSha256 as string,
    artifact: observation.artifact as StoryArtifact,
    storySpec: observation.storySpec as StorySpec,
    outcome: outcome as StoryQualityObservation["outcome"],
    expertReviews,
    targetReaderReviews,
  };
}

function parseExpertReview(value: unknown): StoryQualityExpertReview {
  const review = record(value);
  exactKeys(review, [
    "reviewId",
    "reviewerId",
    "trained",
    "blindToRecipe",
    "blindToOtherReviews",
    "fullArtifactReviewed",
    "artifactContentHash",
    "scores",
    "criticalFailures",
  ]);
  assert(id(review.reviewId) && id(review.reviewerId));
  assert(typeof review.trained === "boolean");
  assert(typeof review.blindToRecipe === "boolean");
  assert(typeof review.blindToOtherReviews === "boolean");
  assert(typeof review.fullArtifactReviewed === "boolean");
  assert(hash(review.artifactContentHash));
  const scores = record(review.scores);
  exactKeys(scores, [
    "factual_support",
    "tone",
    "non_diagnostic_language",
    "non_overclaiming",
    "narrative_coherence",
    "bridge_quality",
  ]);
  const parsedScores = {
    factual_support: rubricScore(scores.factual_support),
    tone: rubricScore(scores.tone),
    non_diagnostic_language: rubricScore(
      scores.non_diagnostic_language,
    ),
    non_overclaiming: rubricScore(scores.non_overclaiming),
    narrative_coherence: rubricScore(scores.narrative_coherence),
    bridge_quality: rubricScore(scores.bridge_quality),
  };
  const criticalFailures = parseCriticalFailures(review.criticalFailures);
  assertReviewConsistency(parsedScores, criticalFailures);
  return {
    reviewId: review.reviewId as string,
    reviewerId: review.reviewerId as string,
    trained: review.trained,
    blindToRecipe: review.blindToRecipe,
    blindToOtherReviews: review.blindToOtherReviews,
    fullArtifactReviewed: review.fullArtifactReviewed,
    artifactContentHash: review.artifactContentHash as string,
    scores: parsedScores,
    criticalFailures,
  };
}

function parseTargetReaderReview(
  value: unknown,
): StoryQualityTargetReaderReview {
  const review = record(value);
  exactKeys(review, [
    "reviewId",
    "reviewerId",
    "targetAudienceEligible",
    "blindToRecipe",
    "blindToOtherReviews",
    "fullArtifactReviewed",
    "artifactContentHash",
    "scores",
    "criticalFailures",
  ]);
  assert(id(review.reviewId) && id(review.reviewerId));
  assert(typeof review.targetAudienceEligible === "boolean");
  assert(typeof review.blindToRecipe === "boolean");
  assert(typeof review.blindToOtherReviews === "boolean");
  assert(typeof review.fullArtifactReviewed === "boolean");
  assert(hash(review.artifactContentHash));
  const scores = record(review.scores);
  exactKeys(scores, ["match_closeness", "desire_to_continue"]);
  const parsedScores = {
    match_closeness: rubricScore(scores.match_closeness),
    desire_to_continue: rubricScore(scores.desire_to_continue),
  };
  return {
    reviewId: review.reviewId as string,
    reviewerId: review.reviewerId as string,
    targetAudienceEligible: review.targetAudienceEligible,
    blindToRecipe: review.blindToRecipe,
    blindToOtherReviews: review.blindToOtherReviews,
    fullArtifactReviewed: review.fullArtifactReviewed,
    artifactContentHash: review.artifactContentHash as string,
    scores: parsedScores,
    criticalFailures: parseCriticalFailures(review.criticalFailures),
  };
}

function validateObservationContent(
  observation: StoryQualityObservation,
  benchmarkCase: StoryQualityBenchmarkCase,
  arm: StoryQualityArm,
  recipe: QualityRecipeManifest,
): void {
  try {
    const artifact = observation.artifact;
    const spec = observation.storySpec;
    assertContent(artifact.schemaVersion === STORY_ARTIFACT_SCHEMA_VERSION);
    assertContent(spec.status === "published");
    assertContent(
      observation.artifactDocumentSha256 ===
        sha256Text(canonicalJson(artifact)),
    );
    assertContent(
      observation.storySpecDocumentSha256 ===
        sha256Text(canonicalJson(spec)),
    );
    assertContent(
      artifact.contentHash === storyArtifactContentHash(artifact),
    );
    assertContent(validateStoredStoryArtifact(artifact) !== null);
    const specValidation = validateStorySpec(spec, { forPublish: true });
    assertContent(specValidation.valid);
    assertContent(
      artifact.storySpecId === spec.storySpecId &&
        artifact.storySpecVersion === spec.version &&
        artifact.storySpecSchemaVersion === spec.schemaVersion,
    );
    assertContent(
      artifact.recipe.match.recipeId === arm.recipeId &&
        artifact.recipe.match.recipeManifestHash ===
          arm.recipeManifestSha256,
    );
    assertBinding(artifactMatchMirrorsRecipe(artifact, recipe));
    assertContent(
      recipe.storySpecSchemaVersion === spec.schemaVersion &&
        recipe.composerVersion === artifact.recipe.composerVersion &&
        recipe.validatorVersion === artifact.recipe.validatorVersion &&
        recipe.boundaryPolicyVersion ===
          artifact.recipe.boundaryPolicyVersion &&
        recipe.resonanceBriefVersion ===
          artifact.recipe.resonanceBriefVersion,
    );
    const brief = createResonanceBrief(
      benchmarkCase.disclosure,
      benchmarkCase.boundaries ?? undefined,
    );
    const artifactValidation = validateStoryArtifact(
      artifact,
      spec,
      brief,
      benchmarkCase.boundaries ?? undefined,
    );
    assertContent(artifactValidation.valid);
    assertPrivacy(
      !storySpecContainsDisclosure(spec, benchmarkCase.disclosure),
    );
    assertPrivacy(
      !containsProtectedDisclosureEcho(
        canonicalJson(artifact),
        benchmarkCase.disclosure,
      ),
    );
    const artifactHash = artifact.contentHash;
    for (const review of [
      ...observation.expertReviews,
      ...observation.targetReaderReviews,
    ]) {
      assertBinding(review.artifactContentHash === artifactHash);
    }
    if (arm.personalizationAttempted) {
      if (observation.outcome.compositionOutcome === "canonical_fallback") {
        assertBinding(artifact.composition.mode === "canonical_fallback");
        assertBinding(
          artifact.composition.fallbackReason !== "canonical_only",
        );
      } else {
        assertBinding(artifact.composition.mode === "hybrid");
        assertBinding(
          observation.outcome.compositionOutcome ===
            (artifact.composition.attemptCount === 1
              ? "first_pass_validated"
              : "retry_validated"),
        );
      }
    } else {
      assertBinding(
        observation.outcome.compositionOutcome ===
          "first_pass_validated",
      );
      assertBinding(
        artifact.composition.mode === "canonical_fallback" &&
          artifact.composition.fallbackReason === "canonical_only",
      );
    }
  } catch (error) {
    if (error instanceof StoryQualityError) throw error;
    throw new StoryQualityError("content_invalid");
  }
}

function buildArmEvidence(
  arm: StoryQualityArm,
  benchmarkCases: readonly StoryQualityBenchmarkCase[],
  cohortTargets: StoryQualityPacket["benchmark"]["cohortTargets"],
  policy: StoryQualityPolicy,
): StoryQualityArmEvidence {
  const caseById = new Map(
    benchmarkCases.map((entry) => [entry.caseId, entry]),
  );
  const criticalCounts = Object.fromEntries(
    CRITICAL_FAILURE_CATEGORIES.map((category) => [category, 0]),
  ) as Record<CriticalFailureCategory, number>;
  const criticalArtifacts = new Set<string>();
  const reviewerCounts = {
    expert: 0,
    target: 0,
  };
  const dimensionCaseScores = Object.fromEntries(
    RUBRIC_DIMENSIONS.map((dimension) => [dimension, [] as number[]]),
  ) as Record<RubricDimension, number[]>;
  let reviewCoverage = true;
  let reviewerIndependence = true;
  let consent = true;
  let completed = 0;
  let feedbackResponses = 0;
  let feltClose = 0;
  let firstPass = 0;
  let fallbacks = 0;

  for (const observation of arm.observations) {
    const benchmarkCase = caseById.get(observation.caseId)!;
    consent &&=
      benchmarkCase.consented && benchmarkCase.deidentified;
    if (observation.outcome.finalBridgeCompleted) completed += 1;
    if (observation.outcome.feedbackVerdict !== "no_response") {
      feedbackResponses += 1;
      if (observation.outcome.feedbackVerdict === "close") feltClose += 1;
    }
    if (
      observation.outcome.compositionOutcome ===
      "first_pass_validated"
    ) {
      firstPass += 1;
    }
    if (
      observation.outcome.compositionOutcome === "canonical_fallback"
    ) {
      fallbacks += 1;
    }
    reviewerCounts.expert += observation.expertReviews.length;
    reviewerCounts.target += observation.targetReaderReviews.length;
    reviewCoverage &&=
      observation.expertReviews.length >=
        policy.minimums.expertReviewsPerArtifact &&
      observation.targetReaderReviews.length >=
        policy.minimums.targetReaderReviewsPerArtifact;
    const reviewerIds = [
      ...observation.expertReviews.map((entry) => entry.reviewerId),
      ...observation.targetReaderReviews.map((entry) => entry.reviewerId),
    ];
    reviewerIndependence &&=
      new Set(reviewerIds).size === reviewerIds.length &&
      observation.expertReviews.every(
        (entry) =>
          entry.trained &&
          entry.blindToRecipe &&
          entry.blindToOtherReviews &&
          entry.fullArtifactReviewed,
      ) &&
      observation.targetReaderReviews.every(
        (entry) =>
          entry.targetAudienceEligible &&
          entry.blindToRecipe &&
          entry.blindToOtherReviews &&
          entry.fullArtifactReviewed,
      );
    const scoreGroups: Record<RubricDimension, number[]> = {
      match_closeness: observation.targetReaderReviews.map(
        (entry) => entry.scores.match_closeness,
      ),
      factual_support: observation.expertReviews.map(
        (entry) => entry.scores.factual_support,
      ),
      tone: observation.expertReviews.map((entry) => entry.scores.tone),
      non_diagnostic_language: observation.expertReviews.map(
        (entry) => entry.scores.non_diagnostic_language,
      ),
      non_overclaiming: observation.expertReviews.map(
        (entry) => entry.scores.non_overclaiming,
      ),
      narrative_coherence: observation.expertReviews.map(
        (entry) => entry.scores.narrative_coherence,
      ),
      bridge_quality: observation.expertReviews.map(
        (entry) => entry.scores.bridge_quality,
      ),
      desire_to_continue: observation.targetReaderReviews.map(
        (entry) => entry.scores.desire_to_continue,
      ),
    };
    for (const dimension of RUBRIC_DIMENSIONS) {
      if (scoreGroups[dimension].length > 0) {
        dimensionCaseScores[dimension].push(
          median(scoreGroups[dimension]),
        );
      }
    }
    const observationFailures = new Set<CriticalFailureCategory>();
    for (const review of [
      ...observation.expertReviews,
      ...observation.targetReaderReviews,
    ]) {
      for (const category of review.criticalFailures) {
        criticalCounts[category] += 1;
        observationFailures.add(category);
      }
    }
    if (observationFailures.size > 0) {
      criticalArtifacts.add(observation.caseId);
    }
  }

  const dimensions = Object.fromEntries(
    RUBRIC_DIMENSIONS.map((dimension) => [
      dimension,
      buildDimensionMetric(dimensionCaseScores[dimension], policy),
    ]),
  ) as Record<RubricDimension, DimensionMetric>;
  const sessions = arm.observations.length;
  const outcomes = {
    feltClose: rateMetric(
      feltClose,
      feedbackResponses,
      policy.minimums.feltCloseRate,
      "at_least",
    ),
    completion: rateMetric(
      completed,
      sessions,
      policy.minimums.completionRate,
      "at_least",
    ),
    firstPassValidation: rateMetric(
      firstPass,
      sessions,
      policy.minimums.firstPassValidationRate,
      "at_least",
    ),
    canonicalFallback: arm.personalizationAttempted
      ? rateMetric(
          fallbacks,
          sessions,
          policy.maximums.canonicalFallbackRate,
          "at_most",
        )
      : null,
  };
  const cellCounts = new Map<string, number>();
  for (const benchmarkCase of benchmarkCases) {
    cellCounts.set(
      benchmarkCase.cohortCellId,
      (cellCounts.get(benchmarkCase.cohortCellId) ?? 0) + 1,
    );
  }
  const cohortRepresentation =
    benchmarkCases.length === sessions &&
    cohortTargets.every(
      (target) =>
        (cellCounts.get(target.cohortCellId) ?? 0) >=
        target.minimumSessions,
    );
  const checks = {
    consent,
    cohortRepresentation,
    reviewCoverage,
    reviewerIndependence,
    sessionMinimum:
      sessions >= policy.minimums.targetAudienceSessions,
    feedbackMinimum:
      feedbackResponses >= policy.minimums.feedbackResponses,
    rubricFloors: RUBRIC_DIMENSIONS.every(
      (dimension) => dimensions[dimension].passed,
    ),
    outcomeFloors:
      outcomes.feltClose.passed &&
      outcomes.completion.passed &&
      outcomes.firstPassValidation.passed &&
      (outcomes.canonicalFallback?.passed ?? true),
    criticalFailures:
      criticalArtifacts.size <=
      policy.maximums.criticalFailureArtifacts,
  };
  const coverage =
    checks.consent &&
    checks.cohortRepresentation &&
    checks.reviewCoverage &&
    checks.reviewerIndependence &&
    checks.sessionMinimum &&
    checks.feedbackMinimum;
  const status: StoryQualityStatus = !checks.criticalFailures
    ? "fail"
    : !coverage
      ? "incomplete"
      : checks.rubricFloors && checks.outcomeFloors
        ? "pass"
        : "fail";
  return {
    role: arm.role,
    recipeId: arm.recipeId,
    recipeManifestSha256: arm.recipeManifestSha256,
    personalizationAttempted: arm.personalizationAttempted,
    sample: {
      sessions,
      feedbackResponses,
      expertReviews: reviewerCounts.expert,
      targetReaderReviews: reviewerCounts.target,
      criticalFailureArtifacts: criticalArtifacts.size,
    },
    dimensions,
    outcomes,
    criticalFailures: criticalCounts,
    checks,
    status,
  };
}

function buildDimensionMetric(
  scores: readonly number[],
  policy: StoryQualityPolicy,
): DimensionMetric {
  const histogram = Object.fromEntries(
    SCORE_BUCKETS.map((bucket) => [bucket, 0]),
  ) as Record<(typeof SCORE_BUCKETS)[number], number>;
  for (const score of scores) {
    histogram[scoreBucket(score)] += 1;
  }
  const mean =
    scores.length === 0
      ? null
      : scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const acceptableCases = scores.filter(
    (score) => score >= policy.minimums.acceptableRubricScore,
  ).length;
  const acceptableRate =
    scores.length === 0 ? null : acceptableCases / scores.length;
  return {
    histogram,
    reviewedCases: scores.length,
    mean,
    acceptableCases,
    acceptableRate,
    meanThreshold: policy.minimums.meanRubricScore,
    acceptableScoreThreshold: policy.minimums.acceptableRubricScore,
    acceptableRateThreshold: policy.minimums.acceptableRubricRate,
    passed:
      mean !== null &&
      acceptableRate !== null &&
      mean >= policy.minimums.meanRubricScore &&
      acceptableRate >= policy.minimums.acceptableRubricRate,
  };
}

function compareArms(
  baseline: StoryQualityArmEvidence,
  candidate: StoryQualityArmEvidence,
  policy: StoryQualityPolicy,
): StoryQualityEvidence["comparison"] {
  const meanRubricRegressionWithinLimit = RUBRIC_DIMENSIONS.every(
    (dimension) => {
      const left = baseline.dimensions[dimension].mean;
      const right = candidate.dimensions[dimension].mean;
      return (
        left !== null &&
        right !== null &&
        right >= left - policy.maximums.meanRubricRegression
      );
    },
  );
  const completionRegressionWithinLimit = rateRegressionWithinLimit(
    baseline.outcomes.completion,
    candidate.outcomes.completion,
    policy.maximums.completionRateRegression,
  );
  const feltCloseRegressionWithinLimit = rateRegressionWithinLimit(
    baseline.outcomes.feltClose,
    candidate.outcomes.feltClose,
    policy.maximums.feltCloseRateRegression,
  );
  return {
    baselineRecipeId: baseline.recipeId,
    candidateRecipeId: candidate.recipeId,
    meanRubricRegressionWithinLimit,
    completionRegressionWithinLimit,
    feltCloseRegressionWithinLimit,
    passed:
      meanRubricRegressionWithinLimit &&
      completionRegressionWithinLimit &&
      feltCloseRegressionWithinLimit,
  };
}

function collectFailureReasons(
  candidate: StoryQualityArmEvidence,
  comparisonPassed: boolean,
  noCriticalFailures: boolean,
): StoryQualityEvidence["failureReasons"] {
  const reasons: StoryQualityEvidence["failureReasons"][number][] = [];
  if (!noCriticalFailures) reasons.push("critical_failure");
  if (!candidate.checks.rubricFloors) reasons.push("rubric_floor");
  if (!candidate.outcomes.feltClose.passed) reasons.push("felt_close_rate");
  if (!candidate.outcomes.completion.passed) reasons.push("completion_rate");
  if (!candidate.outcomes.firstPassValidation.passed) {
    reasons.push("first_pass_rate");
  }
  if (candidate.outcomes.canonicalFallback?.passed === false) {
    reasons.push("fallback_rate");
  }
  if (!comparisonPassed) reasons.push("baseline_regression");
  return reasons;
}

function collectIncompleteReasons(input: {
  protectedHoldout: boolean;
  holdoutChronology: boolean;
  providerConditions: boolean;
  provenanceComplete: boolean;
  candidate: StoryQualityArmEvidence;
  baseline: StoryQualityArmEvidence;
  crossArmReviewerIndependence: boolean;
}): StoryQualityEvidence["incompleteReasons"] {
  const reasons: StoryQualityEvidence["incompleteReasons"][number][] = [];
  if (!input.protectedHoldout) reasons.push("synthetic_or_non_holdout");
  if (!input.holdoutChronology) reasons.push("holdout_chronology");
  if (
    !input.candidate.checks.sessionMinimum ||
    !input.baseline.checks.sessionMinimum
  ) {
    reasons.push("sample_size");
  }
  if (
    !input.candidate.checks.feedbackMinimum ||
    !input.baseline.checks.feedbackMinimum
  ) {
    reasons.push("feedback_coverage");
  }
  if (
    !input.candidate.checks.consent ||
    !input.baseline.checks.consent
  ) {
    reasons.push("consent");
  }
  if (
    !input.candidate.checks.cohortRepresentation ||
    !input.baseline.checks.cohortRepresentation
  ) {
    reasons.push("cohort_representation");
  }
  if (
    !input.candidate.checks.reviewCoverage ||
    !input.baseline.checks.reviewCoverage
  ) {
    reasons.push("review_coverage");
  }
  if (
    !input.candidate.checks.reviewerIndependence ||
    !input.baseline.checks.reviewerIndependence ||
    !input.crossArmReviewerIndependence
  ) {
    reasons.push("reviewer_independence");
  }
  if (!input.providerConditions) reasons.push("provider_conditions");
  if (!input.provenanceComplete) reasons.push("provenance");
  return reasons;
}

function validHoldoutChronology(packet: StoryQualityPacket): boolean {
  if (packet.run.purpose !== "release_candidate") return false;
  const sealed = packet.benchmark.holdoutSealedAt;
  const opened = packet.run.holdoutOpenedAt;
  if (sealed === null || opened === null) return false;
  const frozenAt = Date.parse(packet.benchmark.frozenAt);
  const sealedAt = Date.parse(sealed);
  const candidateAt = Date.parse(packet.run.candidateFrozenAt);
  const openedAt = Date.parse(opened);
  const startedAt = Date.parse(packet.run.startedAt);
  const completedAt = Date.parse(packet.run.completedAt);
  return (
    frozenAt <= sealedAt &&
    sealedAt <= candidateAt &&
    candidateAt <= openedAt &&
    openedAt <= startedAt &&
    startedAt <= completedAt
  );
}

function hasCrossArmReviewerIndependence(
  arms: readonly StoryQualityArm[],
): boolean {
  const assignments = new Map<string, string>();
  for (const arm of arms) {
    for (const observation of arm.observations) {
      for (const reviewerId of [
        ...observation.expertReviews.map((entry) => entry.reviewerId),
        ...observation.targetReaderReviews.map(
          (entry) => entry.reviewerId,
        ),
      ]) {
        const key = `${observation.caseId}\u0000${reviewerId}`;
        const priorArm = assignments.get(key);
        if (priorArm !== undefined && priorArm !== arm.armId) return false;
        assignments.set(key, arm.armId);
      }
    }
  }
  return true;
}

function splitForPurpose(
  purpose: StoryQualityPacket["run"]["purpose"],
): StoryQualityBenchmarkCase["split"] {
  if (purpose === "release_candidate") return "blind_holdout";
  if (purpose === "validation") return "validation";
  return "development";
}

function assertExactStoryArtifactShape(value: unknown): void {
  const artifact = record(value);
  exactKeys(artifact, [
    "artifactId",
    "schemaVersion",
    "storySpecId",
    "storySpecVersion",
    "storySpecSchemaVersion",
    "figureKey",
    "stageId",
    "figure",
    "contentProfile",
    "openingCopy",
    "framing",
    "recipe",
    "composition",
    "transparency",
    "beats",
    "validation",
    "createdAt",
    "contentHash",
  ]);
  const figure = record(artifact.figure);
  exactOptionalKeys(
    figure,
    ["displayName", "ageMin", "ageMax"],
    ["birthYear", "deathYear"],
  );
  exactKeys(record(artifact.contentProfile), [
    "intensity",
    "flags",
    "contentNote",
    "reviewed",
  ]);
  exactKeys(record(artifact.openingCopy), ["eyebrow", "prefaceLines"]);
  const recipe = record(artifact.recipe);
  exactKeys(recipe, [
    "match",
    "composerVersion",
    "validatorVersion",
    "boundaryPolicyVersion",
    "resonanceBriefVersion",
    "hybridTemplatePolicyVersion",
  ]);
  exactOptionalKeys(
    record(recipe.match),
    [
      "recipeId",
      "recipeManifestHash",
      "datasetVersion",
      "deploymentVersion",
      "matchConfigVersion",
      "librarySnapshotSha256",
      "crisisRegexVersion",
      "llmProvider",
      "rerankModelId",
      "proseModelId",
      "embeddingModelId",
      "retrievalMode",
      "rerankPromptVersion",
      "storyPromptVersion",
      "rerankTemperature",
      "rerankReasoningEffort",
      "rerankTopK",
      "storyTemperature",
      "storyComposerMode",
      "hybridStoryComposerEnabled",
      "composerVersion",
      "validatorVersion",
      "storySpecSchemaVersion",
      "boundaryPolicyVersion",
      "resonanceBriefVersion",
      "matchRecoveryPolicyVersion",
    ],
    ["alternateStoryPolicyVersion"],
  );
  const composition = record(artifact.composition);
  if (composition.mode === "hybrid") {
    exactKeys(composition, ["mode", "attemptCount", "planVersion"]);
  } else {
    exactKeys(composition, ["mode", "fallbackReason", "attemptCount"]);
  }
  assertExactTransparencyShape(artifact.transparency);
  for (const beatValue of array(artifact.beats)) {
    const beat = record(beatValue);
    exactOptionalKeys(
      beat,
      ["role", "kind", "text", "chunks", "factIds", "entityIds", "quoteIds"],
      ["personalization"],
    );
    if ("personalization" in beat) {
      exactKeys(record(beat.personalization), [
        "templateId",
        "policyVersion",
      ]);
    }
  }
  exactKeys(record(artifact.validation), [
    "status",
    "failureReasons",
    "validatedAt",
  ]);
}

function assertExactTransparencyShape(value: unknown): void {
  const transparency = record(value);
  exactKeys(transparency, [
    "schemaVersion",
    "storySpec",
    "rationale",
    "provenance",
    "sources",
    "facts",
    "quotes",
    "beats",
  ]);
  exactKeys(record(transparency.storySpec), [
    "storySpecId",
    "version",
    "schemaVersion",
  ]);
  exactKeys(record(transparency.rationale), [
    "policyVersion",
    "resonance",
    "gap",
  ]);
  exactOptionalKeys(
    record(transparency.provenance),
    ["status"],
    ["reviewedAt"],
  );
  for (const sourceValue of array(transparency.sources)) {
    exactOptionalKeys(
      record(sourceValue),
      ["sourceId", "citation"],
      ["locator", "url"],
    );
  }
  for (const factValue of array(transparency.facts)) {
    const fact = record(factValue);
    exactKeys(fact, [
      "factId",
      "statement",
      "confidence",
      "claimKind",
      "sourceRefs",
    ]);
    array(fact.sourceRefs).forEach(assertExactSourceRefShape);
  }
  for (const quoteValue of array(transparency.quotes)) {
    const quote = record(quoteValue);
    exactOptionalKeys(
      quote,
      ["quoteId", "text", "status", "sourceRefs"],
      ["speaker"],
    );
    array(quote.sourceRefs).forEach(assertExactSourceRefShape);
  }
  for (const beatValue of array(transparency.beats)) {
    exactKeys(record(beatValue), [
      "role",
      "evidenceClass",
      "hasPersonalizedTransition",
      "factIds",
      "quoteIds",
    ]);
  }
}

function assertExactStorySpecShape(value: unknown): void {
  const spec = record(value);
  exactKeys(spec, [
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
  ]);
  exactOptionalKeys(
    record(spec.episode),
    ["ageMin", "ageMax", "throughLine"],
    ["startDate", "endDate"],
  );
  exactKeys(record(spec.contentProfile), [
    "intensity",
    "flags",
    "contentNote",
  ]);
  for (const factValue of array(spec.facts)) {
    const fact = record(factValue);
    exactOptionalKeys(
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
    );
    array(fact.sourceRefs).forEach(assertExactSourceRefShape);
  }
  for (const entityValue of array(spec.entities)) {
    exactKeys(record(entityValue), [
      "entityId",
      "kind",
      "value",
      "aliases",
    ]);
  }
  for (const quoteValue of array(spec.quotes)) {
    const quote = record(quoteValue);
    exactOptionalKeys(
      quote,
      ["quoteId", "text", "status", "sourceRefs"],
      ["speaker"],
    );
    array(quote.sourceRefs).forEach(assertExactSourceRefShape);
  }
  for (const beatValue of array(spec.arc)) {
    const beat = record(beatValue);
    exactOptionalKeys(
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
    );
    for (const mappingValue of array(beat.sentenceEvidence)) {
      exactKeys(record(mappingValue), [
        "sentenceIndex",
        "factIds",
        "interpretationIds",
      ]);
    }
  }
  for (const interpretationValue of array(spec.interpretations)) {
    exactKeys(record(interpretationValue), [
      "interpretationId",
      "statement",
      "supportingFactIds",
      "allowed",
    ]);
  }
  for (const sourceValue of array(spec.sources)) {
    exactOptionalKeys(
      record(sourceValue),
      ["sourceId", "citation"],
      ["locator", "url"],
    );
  }
  exactKeys(record(spec.review), [
    "researcherId",
    "historicalReviewerId",
    "toneReviewerId",
    "reviewedAt",
    "contentProfileReviewed",
  ]);
}

function assertExactSourceRefShape(value: unknown): void {
  exactOptionalKeys(
    record(value),
    ["sourceId", "scope"],
    ["locator"],
  );
}

function containsProtectedDisclosureEcho(
  serializedArtifact: string,
  disclosure: string,
): boolean {
  const artifact = normalizedTokens(serializedArtifact);
  const source = normalizedTokens(disclosure);
  if (source.length === 0 || artifact.length === 0) return false;
  const artifactText = ` ${artifact.join(" ")} `;
  const windowSize = 7;
  for (
    let index = 0;
    index <= source.length - windowSize;
    index += 1
  ) {
    const phrase = ` ${source.slice(index, index + windowSize).join(" ")} `;
    if (artifactText.includes(phrase)) return true;
  }
  const artifactTokens = new Set(artifact);
  return source.some(
    (token) =>
      token.length >= 12 &&
      !/^\d+$/.test(token) &&
      artifactTokens.has(token),
  );
}

function normalizedTokens(value: string): string[] {
  return value
    .normalize("NFKC")
    .replace(/[\u200b-\u200f\u2060\ufeff]/g, "")
    .toLocaleLowerCase("en-US")
    .match(/[\p{L}\p{N}@._+-]+/gu) ?? [];
}

function assertSafeEvidence(evidence: StoryQualityEvidence): void {
  try {
    const serialized = canonicalJson(evidence);
    const forbiddenKeys = [
      "caseId",
      "reviewerId",
      "reviewId",
      "artifactId",
      "artifactContentHash",
      "artifactDocumentSha256",
      "storySpecId",
      "storySpecDocumentSha256",
      "inputCommitment",
      "disclosure",
      "feeling",
      "notes",
      "prompt",
      "response",
      "stack",
      "exception",
      "metadata",
    ];
    for (const key of forbiddenKeys) {
      assert(!serialized.includes(JSON.stringify(key)));
    }
    assert(
      evidence.evidenceId === storyQualityEvidenceId(evidence),
    );
    assert(evidence.promotionAuthorized === false);
  } catch {
    throw new StoryQualityError("evidence_invalid");
  }
}

function parseCriticalFailures(
  value: unknown,
): CriticalFailureCategory[] {
  const entries = array(value);
  assert(
    entries.every(
      (entry) =>
        typeof entry === "string" &&
        CRITICAL_FAILURE_CATEGORIES.includes(
          entry as CriticalFailureCategory,
        ),
    ),
  );
  unique(entries as string[]);
  const parsed = entries as CriticalFailureCategory[];
  return [...parsed].sort();
}

function assertReviewConsistency(
  scores: StoryQualityExpertReview["scores"],
  failures: readonly CriticalFailureCategory[],
): void {
  const failureSet = new Set(failures);
  if (scores.non_diagnostic_language === 1) {
    assert(failureSet.has("diagnosis"));
  }
  if (scores.factual_support === 1) {
    assert(
      [...failureSet].some(
        (entry) =>
          entry.startsWith("unsupported_") ||
          [
            "chronology_error",
            "source_misrepresentation",
            "forbidden_or_disputed_quote",
            "disallowed_interpretation",
          ].includes(entry),
      ),
    );
  }
}

function parseArmEvidence(
  value: unknown,
  policy: StoryQualityPolicy,
): StoryQualityArmEvidence {
  const arm = record(value);
  exactKeys(arm, [
    "role",
    "recipeId",
    "recipeManifestSha256",
    "personalizationAttempted",
    "sample",
    "dimensions",
    "outcomes",
    "criticalFailures",
    "checks",
    "status",
  ]);
  assert(
    arm.role === "baseline" ||
      arm.role === "candidate" ||
      arm.role === "challenger",
    "evidence_invalid",
  );
  assert(
    id(arm.recipeId) &&
      hash(arm.recipeManifestSha256) &&
      typeof arm.personalizationAttempted === "boolean",
    "evidence_invalid",
  );
  const sample = record(arm.sample);
  exactKeys(sample, [
    "sessions",
    "feedbackResponses",
    "expertReviews",
    "targetReaderReviews",
    "criticalFailureArtifacts",
  ]);
  const parsedSample = {
    sessions: nonNegativeInteger(sample.sessions),
    feedbackResponses: nonNegativeInteger(sample.feedbackResponses),
    expertReviews: nonNegativeInteger(sample.expertReviews),
    targetReaderReviews: nonNegativeInteger(sample.targetReaderReviews),
    criticalFailureArtifacts: nonNegativeInteger(
      sample.criticalFailureArtifacts,
    ),
  };
  assert(
    parsedSample.feedbackResponses <= parsedSample.sessions &&
      parsedSample.criticalFailureArtifacts <= parsedSample.sessions,
    "evidence_invalid",
  );
  const dimensionRecord = record(arm.dimensions);
  exactKeys(dimensionRecord, RUBRIC_DIMENSIONS);
  const dimensions = Object.fromEntries(
    RUBRIC_DIMENSIONS.map((dimension) => [
      dimension,
      parseDimensionEvidence(dimensionRecord[dimension], policy),
    ]),
  ) as Record<RubricDimension, DimensionMetric>;
  assert(
    RUBRIC_DIMENSIONS.every(
      (dimension) =>
        dimensions[dimension].reviewedCases === parsedSample.sessions,
    ),
    "evidence_invalid",
  );
  const outcomesRecord = record(arm.outcomes);
  exactKeys(outcomesRecord, [
    "feltClose",
    "completion",
    "firstPassValidation",
    "canonicalFallback",
  ]);
  const outcomes = {
    feltClose: parseRateEvidence(
      outcomesRecord.feltClose,
      policy.minimums.feltCloseRate,
      "at_least",
    ),
    completion: parseRateEvidence(
      outcomesRecord.completion,
      policy.minimums.completionRate,
      "at_least",
    ),
    firstPassValidation: parseRateEvidence(
      outcomesRecord.firstPassValidation,
      policy.minimums.firstPassValidationRate,
      "at_least",
    ),
    canonicalFallback:
      outcomesRecord.canonicalFallback === null
        ? null
        : parseRateEvidence(
            outcomesRecord.canonicalFallback,
            policy.maximums.canonicalFallbackRate,
            "at_most",
          ),
  };
  assert(
    outcomes.completion.denominator === parsedSample.sessions &&
      outcomes.firstPassValidation.denominator ===
        parsedSample.sessions &&
      outcomes.feltClose.denominator ===
        parsedSample.feedbackResponses &&
      ((arm.personalizationAttempted === false &&
        outcomes.canonicalFallback === null) ||
        (arm.personalizationAttempted === true &&
          outcomes.canonicalFallback?.denominator ===
            parsedSample.sessions)),
    "evidence_invalid",
  );
  const criticalRecord = record(arm.criticalFailures);
  exactKeys(criticalRecord, CRITICAL_FAILURE_CATEGORIES);
  const criticalFailures = Object.fromEntries(
    CRITICAL_FAILURE_CATEGORIES.map((category) => [
      category,
      nonNegativeInteger(criticalRecord[category]),
    ]),
  ) as Record<CriticalFailureCategory, number>;
  const criticalOccurrences = Object.values(criticalFailures).reduce(
    (sum, count) => sum + count,
    0,
  );
  assert(
    (parsedSample.criticalFailureArtifacts === 0) ===
      (criticalOccurrences === 0),
    "evidence_invalid",
  );
  const checksRecord = record(arm.checks);
  exactKeys(checksRecord, [
    "consent",
    "cohortRepresentation",
    "reviewCoverage",
    "reviewerIndependence",
    "sessionMinimum",
    "feedbackMinimum",
    "rubricFloors",
    "outcomeFloors",
    "criticalFailures",
  ]);
  const checks = parseBooleanRecord(checksRecord);
  const recomputedChecks = {
    consent: checks.consent,
    cohortRepresentation: checks.cohortRepresentation,
    reviewCoverage: checks.reviewCoverage,
    reviewerIndependence: checks.reviewerIndependence,
    sessionMinimum:
      parsedSample.sessions >= policy.minimums.targetAudienceSessions,
    feedbackMinimum:
      parsedSample.feedbackResponses >= policy.minimums.feedbackResponses,
    rubricFloors: RUBRIC_DIMENSIONS.every(
      (dimension) => dimensions[dimension].passed,
    ),
    outcomeFloors:
      outcomes.feltClose.passed &&
      outcomes.completion.passed &&
      outcomes.firstPassValidation.passed &&
      (outcomes.canonicalFallback?.passed ?? true),
    criticalFailures:
      parsedSample.criticalFailureArtifacts <=
      policy.maximums.criticalFailureArtifacts,
  };
  assert(
    canonicalJson(checks) === canonicalJson(recomputedChecks),
    "evidence_invalid",
  );
  assertQualityStatus(arm.status);
  const coverage =
    recomputedChecks.consent &&
    recomputedChecks.cohortRepresentation &&
    recomputedChecks.reviewCoverage &&
    recomputedChecks.reviewerIndependence &&
    recomputedChecks.sessionMinimum &&
    recomputedChecks.feedbackMinimum;
  const expectedStatus: StoryQualityStatus =
    !recomputedChecks.criticalFailures
      ? "fail"
      : !coverage
        ? "incomplete"
        : recomputedChecks.rubricFloors &&
            recomputedChecks.outcomeFloors
          ? "pass"
          : "fail";
  assert(arm.status === expectedStatus, "evidence_invalid");
  return {
    role: arm.role,
    recipeId: arm.recipeId as string,
    recipeManifestSha256: arm.recipeManifestSha256 as string,
    personalizationAttempted: arm.personalizationAttempted,
    sample: parsedSample,
    dimensions,
    outcomes,
    criticalFailures,
    checks: recomputedChecks,
    status: arm.status,
  };
}

function parseDimensionEvidence(
  value: unknown,
  policy: StoryQualityPolicy,
): DimensionMetric {
  const dimension = record(value);
  exactKeys(dimension, [
    "histogram",
    "reviewedCases",
    "mean",
    "acceptableCases",
    "acceptableRate",
    "meanThreshold",
    "acceptableScoreThreshold",
    "acceptableRateThreshold",
    "passed",
  ]);
  const histogramRecord = record(dimension.histogram);
  exactKeys(histogramRecord, SCORE_BUCKETS);
  const histogram = Object.fromEntries(
    SCORE_BUCKETS.map((bucket) => [
      bucket,
      nonNegativeInteger(histogramRecord[bucket]),
    ]),
  ) as Record<(typeof SCORE_BUCKETS)[number], number>;
  const reviewedCases = nonNegativeInteger(dimension.reviewedCases);
  assert(
    Object.values(histogram).reduce((sum, count) => sum + count, 0) ===
      reviewedCases,
    "evidence_invalid",
  );
  const weightedTotal = SCORE_BUCKETS.reduce(
    (sum, bucket) => sum + Number(bucket) * histogram[bucket],
    0,
  );
  const mean = reviewedCases === 0 ? null : weightedTotal / reviewedCases;
  const acceptableCases = SCORE_BUCKETS.filter(
    (bucket) => Number(bucket) >= policy.minimums.acceptableRubricScore,
  ).reduce((sum, bucket) => sum + histogram[bucket], 0);
  const acceptableRate =
    reviewedCases === 0 ? null : acceptableCases / reviewedCases;
  const passed =
    mean !== null &&
    acceptableRate !== null &&
    mean >= policy.minimums.meanRubricScore &&
    acceptableRate >= policy.minimums.acceptableRubricRate;
  assert(
    sameNullableNumber(dimension.mean, mean) &&
      dimension.acceptableCases === acceptableCases &&
      sameNullableNumber(dimension.acceptableRate, acceptableRate) &&
      dimension.meanThreshold === policy.minimums.meanRubricScore &&
      dimension.acceptableScoreThreshold ===
        policy.minimums.acceptableRubricScore &&
      dimension.acceptableRateThreshold ===
        policy.minimums.acceptableRubricRate &&
      dimension.passed === passed,
    "evidence_invalid",
  );
  return {
    histogram,
    reviewedCases,
    mean,
    acceptableCases,
    acceptableRate,
    meanThreshold: policy.minimums.meanRubricScore,
    acceptableScoreThreshold: policy.minimums.acceptableRubricScore,
    acceptableRateThreshold: policy.minimums.acceptableRubricRate,
    passed,
  };
}

function parseRateEvidence(
  value: unknown,
  threshold: number,
  comparison: RateMetric["comparison"],
): RateMetric {
  const metric = record(value);
  exactKeys(metric, [
    "numerator",
    "denominator",
    "rate",
    "threshold",
    "passed",
    "comparison",
  ]);
  const numerator = nonNegativeInteger(metric.numerator);
  const denominator = nonNegativeInteger(metric.denominator);
  assert(numerator <= denominator, "evidence_invalid");
  const expected = rateMetric(
    numerator,
    denominator,
    threshold,
    comparison,
  );
  assert(
    sameNullableNumber(metric.rate, expected.rate) &&
      metric.threshold === threshold &&
      metric.passed === expected.passed &&
      metric.comparison === comparison,
    "evidence_invalid",
  );
  return expected;
}

function parseBooleanRecord(
  value: Record<string, unknown>,
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const [key, entry] of Object.entries(value)) {
    assert(typeof entry === "boolean", "evidence_invalid");
    result[key] = entry;
  }
  return result;
}

function parseFailureReasons(
  value: unknown,
): StoryQualityEvidence["failureReasons"] {
  const allowed = [
    "critical_failure",
    "rubric_floor",
    "felt_close_rate",
    "completion_rate",
    "first_pass_rate",
    "fallback_rate",
    "baseline_regression",
  ] as const;
  return subsetEnumArray(value, allowed);
}

function parseIncompleteReasons(
  value: unknown,
): StoryQualityEvidence["incompleteReasons"] {
  const allowed = [
    "synthetic_or_non_holdout",
    "holdout_chronology",
    "sample_size",
    "feedback_coverage",
    "consent",
    "cohort_representation",
    "review_coverage",
    "reviewer_independence",
    "provider_conditions",
    "provenance",
  ] as const;
  return subsetEnumArray(value, allowed);
}

function subsetEnumArray<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number][] {
  const entries = array(value);
  assert(
    entries.every(
      (entry) =>
        typeof entry === "string" &&
        allowed.includes(entry as T[number]),
    ),
    "evidence_invalid",
  );
  unique(entries as string[]);
  return entries as T[number][];
}

function assertQualityStatus(
  value: unknown,
): asserts value is StoryQualityStatus {
  assert(
    value === "incomplete" || value === "fail" || value === "pass",
    "evidence_invalid",
  );
}

function sameNullableNumber(value: unknown, expected: number | null): boolean {
  if (expected === null) return value === null;
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Math.abs(value - expected) <= 1e-12
  );
}

function rateMetric(
  numerator: number,
  denominator: number,
  threshold: number,
  comparison: RateMetric["comparison"],
): RateMetric {
  const rate = denominator === 0 ? null : numerator / denominator;
  return {
    numerator,
    denominator,
    rate,
    threshold,
    passed:
      rate !== null &&
      (comparison === "at_least"
        ? rate >= threshold
        : rate <= threshold),
    comparison,
  };
}

function rateRegressionWithinLimit(
  baseline: RateMetric,
  candidate: RateMetric,
  limit: number,
): boolean {
  return (
    baseline.rate !== null &&
    candidate.rate !== null &&
    candidate.rate >= baseline.rate - limit
  );
}

function scoreBucket(
  value: number,
): (typeof SCORE_BUCKETS)[number] {
  const candidate = String(value) as (typeof SCORE_BUCKETS)[number];
  assert(SCORE_BUCKETS.includes(candidate));
  return candidate;
}

function median(values: readonly number[]): number {
  assert(values.length > 0);
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function recipeManifestDigest(recipe: QualityRecipeManifest): string {
  const payload = { ...recipe } as Record<string, unknown>;
  delete payload.manifestSha256;
  return sha256Text(canonicalJson(payload));
}

function artifactMatchMirrorsRecipe(
  artifact: StoryArtifact,
  recipe: QualityRecipeManifest,
): boolean {
  const match = artifact.recipe.match as unknown as Record<string, unknown>;
  const pairs = [
    ["recipeId", "recipeId"],
    ["recipeManifestHash", "manifestSha256"],
    ["datasetVersion", "datasetVersion"],
    ["matchConfigVersion", "matchConfigVersion"],
    ["librarySnapshotSha256", "librarySnapshotSha256"],
    ["llmProvider", "llmProvider"],
    ["rerankModelId", "rerankModelId"],
    ["proseModelId", "proseModelId"],
    ["embeddingModelId", "embeddingModelId"],
    ["retrievalMode", "retrievalMode"],
    ["rerankPromptVersion", "rerankPromptVersion"],
    ["storyPromptVersion", "storyPromptVersion"],
    ["rerankTemperature", "rerankTemperature"],
    ["rerankReasoningEffort", "rerankReasoningEffort"],
    ["rerankTopK", "rerankTopK"],
    ["storyTemperature", "storyTemperature"],
    ["storyComposerMode", "storyComposerMode"],
    ["hybridStoryComposerEnabled", "hybridStoryComposerEnabled"],
    ["composerVersion", "composerVersion"],
    ["validatorVersion", "validatorVersion"],
    ["storySpecSchemaVersion", "storySpecSchemaVersion"],
    ["boundaryPolicyVersion", "boundaryPolicyVersion"],
    ["resonanceBriefVersion", "resonanceBriefVersion"],
  ] as const;
  return pairs.every(
    ([matchKey, manifestKey]) =>
      canonicalJson(match[matchKey]) ===
      canonicalJson(recipe[manifestKey]),
  );
}

function secretByteLength(value: string | Uint8Array): number {
  return typeof value === "string"
    ? Buffer.byteLength(value, "utf8")
    : value.byteLength;
}

function exactEnumArray<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number][] {
  const entries = array(value);
  assert(entries.every((entry) => typeof entry === "string"));
  unique(entries as string[]);
  assert(
    canonicalJson([...(entries as string[])].sort()) ===
      canonicalJson([...allowed].sort()),
  );
  return entries as T[number][];
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): void {
  assert(
    Object.keys(value).sort().join("\u0000") ===
      [...keys].sort().join("\u0000"),
  );
}

function exactOptionalKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
): void {
  const actual = Object.keys(value);
  assert(required.every((key) => actual.includes(key)));
  assert(
    actual.every(
      (key) => required.includes(key) || optional.includes(key),
    ),
  );
}

function record(value: unknown): Record<string, unknown> {
  assert(
    value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) === Object.prototype,
  );
  return value as Record<string, unknown>;
}

function array(value: unknown): unknown[] {
  assert(Array.isArray(value));
  return value;
}

function unique(values: readonly string[]): void {
  assert(new Set(values).size === values.length);
}

function timestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function fullCommit(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
}

function hash(value: unknown): value is string {
  return typeof value === "string" && HASH.test(value);
}

function id(value: unknown): value is string {
  return typeof value === "string" && OPAQUE_ID.test(value);
}

function deploymentId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value)
  );
}

function positiveInteger(value: unknown): number {
  assert(
    typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value > 0,
  );
  return value;
}

function nonNegativeInteger(value: unknown): number {
  assert(
    typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value >= 0,
  );
  return value;
}

function boundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): number {
  assert(
    typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value >= minimum &&
      value <= maximum,
  );
  return value;
}

function boundedNumber(
  value: unknown,
  minimum: number,
  maximum: number,
): number {
  assert(
    typeof value === "number" &&
      Number.isFinite(value) &&
      value >= minimum &&
      value <= maximum,
  );
  return value;
}

function ratio(value: unknown): number {
  return boundedNumber(value, 0, 1);
}

function rubricScore(value: unknown): number {
  return boundedInteger(value, 1, 5);
}

function by<K extends string>(key: K) {
  return (
    left: Record<K, string>,
    right: Record<K, string>,
  ): number => left[key].localeCompare(right[key]);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((entry) =>
      deepFreeze(entry),
    );
    Object.freeze(value);
  }
  return value;
}

function assertBinding(
  condition: unknown,
): asserts condition {
  if (!condition) throw new StoryQualityError("binding_invalid");
}

function assertContent(
  condition: unknown,
): asserts condition {
  if (!condition) throw new StoryQualityError("content_invalid");
}

function assertPrivacy(
  condition: unknown,
): asserts condition {
  if (!condition) throw new StoryQualityError("privacy_invalid");
}

function assert(
  condition: unknown,
  code: StoryQualityErrorCode = "packet_invalid",
): asserts condition {
  if (!condition) throw new StoryQualityError(code);
}
