import "./_smoke-bootstrap";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { handleIntake, type IntakeContext } from "../lib/intake";
import {
  MATCH_CLARIFICATION_OPTIONS,
  MATCH_RECOVERY_POLICY_VERSION,
  decideMatchDisposition,
  parseMatchClarification,
  withMatchClarification,
} from "../lib/match-recovery";
import { createResonanceBrief } from "../lib/resonance-brief";
import { _sessionCount, getOwnedSession } from "../lib/session";
import {
  _storyArtifactCount,
  getOwnedStoryArtifact,
} from "../lib/story-artifacts";
import { _matchRecoveryFlowCount } from "../lib/match-recovery-flow";
import { MATCH_LIMITS } from "../lib/rate-limit";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";
process.env.HYBRID_STORY_COMPOSER_ENABLED = "true";

const AMBIGUOUS_DISCLOSURE =
  "A peculiar cobalt fog has changed the texture of every ordinary day.";

async function main(): Promise<void> {
  const failures: string[] = [];
  checkDecisionPolicy(failures);
  checkInputContract(failures);
  checkRecoveryMigration(failures);
  await checkClarificationAndNoCloseFlow(failures);
  await checkClarificationImprovesMatch(failures);
  await checkFinalTokenCannotRematch(failures);
  await checkInvalidAndCrisisPrecedence(failures);
  checkReaderFramingSurface(failures);

  console.log("Onward match-recovery validator");
  console.log("===============================");
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`${failures.length} match-recovery contract failure(s).`);
    process.exit(1);
  }
  console.log("PASS closed clarification and deterministic disposition matrix");
  console.log("PASS weak initial and unresolved matches persist nothing");
  console.log("PASS one closed clarification improves retrieval without storing its search phrase");
  console.log("PASS accepted adjacent story is explicitly partial and replayable");
  console.log("PASS recovery credits are single-use, owner-bound, and rate-limit safe");
  console.log("PASS reader preface exposes the partial-parallel limitation");
}

async function checkFinalTokenCannotRematch(
  failures: string[],
): Promise<void> {
  const ctx: IntakeContext = {
    userId: "match-recovery-final-purpose",
    ipHash: "match-recovery-final-purpose-ip",
  };
  const before = await _sessionCount();
  const initial = await handleIntake(
    { age: 34, feeling: AMBIGUOUS_DISCLOSURE },
    ctx,
  );
  if (!("clarificationNeeded" in initial)) {
    failures.push("final-purpose fixture did not enter clarification");
    return;
  }
  const noClose = await handleIntake(
    {
      age: 34,
      feeling: AMBIGUOUS_DISCLOSURE,
      clarification: "uncertainty",
      recoveryToken: initial.recoveryToken,
    },
    ctx,
  );
  if (!("noCloseMatch" in noClose)) {
    failures.push("final-purpose fixture did not enter no-close-match");
    return;
  }
  const rematch = await handleIntake(
    {
      age: 34,
      feeling: AMBIGUOUS_DISCLOSURE,
      clarification: "rejection",
      recoveryToken: noClose.recoveryToken,
    },
    ctx,
  );
  const replayAsAcceptance = await handleIntake(
    {
      age: 34,
      feeling: AMBIGUOUS_DISCLOSURE,
      clarification: "uncertainty",
      acceptAdjacent: true,
      recoveryToken: noClose.recoveryToken,
    },
    ctx,
  );
  if (
    !("error" in rematch) ||
    !("error" in replayAsAcceptance) ||
    (await _sessionCount()) !== before
  ) {
    failures.push("final adjacent token allowed rematching, replay, or persistence");
  }
}

function checkRecoveryMigration(failures: string[]): void {
  const migration = readFileSync(
    fileURLToPath(
      new URL(
        "../supabase/migrations/0006_match_recovery_flows.sql",
        import.meta.url,
      ),
    ),
    "utf8",
  ).toLowerCase();
  const required = [
    "create table match_recovery_flows",
    "references auth.users (id) on delete cascade",
    "purpose text not null check (purpose in ('clarification', 'adjacent_acceptance'))",
    "create or replace function consume_match_recovery_flow",
    "and consumed_at is null",
    "and expires_at > now()",
    "revoke update, delete on table match_recovery_flows from service_role",
    "onward-match-recovery-cleanup",
  ];
  if (required.some((clause) => !migration.includes(clause))) {
    failures.push("recovery migration is missing atomicity, ownership, or cleanup controls");
  }
  if (/\n\s*(?:feeling|clarification|boundaries|candidate_id)\s+/.test(migration)) {
    failures.push("recovery-flow table defines a sensitive semantic column");
  }
}

function checkDecisionPolicy(failures: string[]): void {
  const cases = [
    {
      name: "high close",
      input: {
        confidence: "high" as const,
        framing: "definitive" as const,
        ageFallback: false,
        clarificationProvided: false,
        acceptAdjacent: false,
      },
      expected: "close_match",
    },
    {
      name: "high age-adjacent",
      input: {
        confidence: "high" as const,
        framing: "partial" as const,
        ageFallback: true,
        clarificationProvided: false,
        acceptAdjacent: false,
      },
      expected: "adjacent_match",
    },
    {
      name: "medium asks once",
      input: {
        confidence: "medium" as const,
        framing: "partial" as const,
        ageFallback: false,
        clarificationProvided: false,
        acceptAdjacent: false,
      },
      expected: "clarification_needed",
    },
    {
      name: "medium after answer",
      input: {
        confidence: "medium" as const,
        framing: "partial" as const,
        ageFallback: false,
        clarificationProvided: true,
        acceptAdjacent: false,
      },
      expected: "adjacent_match",
    },
    {
      name: "low after answer",
      input: {
        confidence: "low" as const,
        framing: "partial" as const,
        ageFallback: false,
        clarificationProvided: true,
        acceptAdjacent: false,
      },
      expected: "no_close_match",
    },
    {
      name: "explicit adjacent acceptance",
      input: {
        confidence: "low" as const,
        framing: "partial" as const,
        ageFallback: false,
        clarificationProvided: false,
        acceptAdjacent: true,
      },
      expected: "adjacent_match",
    },
  ] as const;
  for (const testCase of cases) {
    if (decideMatchDisposition(testCase.input) !== testCase.expected) {
      failures.push(`${testCase.name} disposition was incorrect`);
    }
  }
}

function checkInputContract(failures: string[]): void {
  if (
    MATCH_CLARIFICATION_OPTIONS.length !== 6 ||
    new Set(MATCH_CLARIFICATION_OPTIONS.map((option) => option.id)).size !== 6 ||
    !MATCH_CLARIFICATION_OPTIONS.every(
      (option) => option.label && option.description && option.searchPhrase,
    )
  ) {
    failures.push("clarification option catalog is incomplete or duplicated");
  }
  if (
    "error" in parseMatchClarification("rejection") ||
    !("error" in parseMatchClarification("diagnosis")) ||
    !("error" in parseMatchClarification(null))
  ) {
    failures.push("clarification parser did not enforce its closed enum");
  }
  const effective = withMatchClarification(
    AMBIGUOUS_DISCLOSURE,
    "blocked_agency",
  );
  if (
    !effective.startsWith(AMBIGUOUS_DISCLOSURE) ||
    !effective.includes("controlled choice") ||
    !effective.includes("stuck trapped blocked")
  ) {
    failures.push("controlled clarification was not projected into matching");
  }
  const overridden = createResonanceBrief(
    "I have been tired for a long time.",
    undefined,
    "rejection",
  );
  if (
    overridden.primaryPressure !== "rejection" ||
    JSON.stringify(overridden).includes("controlled-clarification")
  ) {
    failures.push("clarification did not override the brief through hashed provenance");
  }
}

async function checkClarificationAndNoCloseFlow(
  failures: string[],
): Promise<void> {
  const ctx: IntakeContext = {
    userId: "match-recovery-ambiguous",
    ipHash: "match-recovery-ambiguous-ip",
  };
  const beforeSessions = await _sessionCount();
  const beforeArtifacts = await _storyArtifactCount();

  const initial = await handleIntake(
    { age: 34, feeling: AMBIGUOUS_DISCLOSURE },
    ctx,
  );
  if (
    !("clarificationNeeded" in initial) ||
    initial.policyVersion !== MATCH_RECOVERY_POLICY_VERSION ||
    !/^[A-Za-z0-9_-]{43}$/.test(initial.recoveryToken)
  ) {
    failures.push("weak initial match did not ask the single clarification");
  }
  const firstToken =
    "clarificationNeeded" in initial ? initial.recoveryToken : undefined;
  if (
    (await _sessionCount()) !== beforeSessions ||
    (await _storyArtifactCount()) !== beforeArtifacts
  ) {
    failures.push("clarification-needed state persisted a session or artifact");
  }

  const unresolved = await handleIntake(
    {
      age: 34,
      feeling: AMBIGUOUS_DISCLOSURE,
      clarification: "uncertainty",
      recoveryToken: firstToken,
    },
    ctx,
  );
  if (
    !("noCloseMatch" in unresolved) ||
    unresolved.policyVersion !== MATCH_RECOVERY_POLICY_VERSION ||
    !/^[A-Za-z0-9_-]{43}$/.test(unresolved.recoveryToken) ||
    unresolved.recoveryToken === firstToken ||
    "clarificationNeeded" in unresolved
  ) {
    failures.push("unresolved clarification did not stop at no-close-match");
  }
  if (
    (await _sessionCount()) !== beforeSessions ||
    (await _storyArtifactCount()) !== beforeArtifacts
  ) {
    failures.push("no-close-match state persisted a session or artifact");
  }
  const secondToken =
    "noCloseMatch" in unresolved ? unresolved.recoveryToken : undefined;

  const replay = await handleIntake(
    {
      age: 34,
      feeling: AMBIGUOUS_DISCLOSURE,
      clarification: "uncertainty",
      recoveryToken: firstToken,
    },
    ctx,
  );
  const foreign = await handleIntake(
    {
      age: 34,
      feeling: AMBIGUOUS_DISCLOSURE,
      clarification: "uncertainty",
      acceptAdjacent: true,
      recoveryToken: secondToken,
    },
    { userId: "match-recovery-foreign", ipHash: "match-recovery-foreign-ip" },
  );
  if (!("error" in replay) || !("error" in foreign)) {
    failures.push("single-use recovery token replay or foreign use was accepted");
  }

  const accepted = await handleIntake(
    {
      age: 34,
      feeling: AMBIGUOUS_DISCLOSURE,
      clarification: "uncertainty",
      acceptAdjacent: true,
      recoveryToken: secondToken,
    },
    ctx,
  );
  if (!("sessionId" in accepted)) {
    failures.push("explicit adjacent acceptance did not create a story");
    return;
  }
  const session = await getOwnedSession(accepted.sessionId, ctx.userId);
  const artifact = session?.storyArtifactId
    ? await getOwnedStoryArtifact(
        session.storyArtifactId,
        ctx.userId,
        accepted.sessionId,
      )
    : null;
  const serialized = JSON.stringify({ session, artifact });
  const storedFlows = [
    ...(globalThis.__onwardMatchRecoveryFlows?.values() ?? []),
  ];
  const storedFlowJson = JSON.stringify(storedFlows);
  if (
    !session ||
    !artifact ||
    session.framing !== "partial" ||
    artifact.framing !== "partial" ||
    session.feeling !== AMBIGUOUS_DISCLOSURE ||
    session.matchRecipe.matchRecoveryPolicyVersion !==
      MATCH_RECOVERY_POLICY_VERSION ||
    session.storyRequestContext?.clarification !== "uncertainty" ||
    serialized.includes("controlled choice") ||
    serialized.includes("uncertain unsure identity next step which direction") ||
    serialized.includes('"acceptAdjacent"') ||
    (firstToken !== undefined && serialized.includes(firstToken)) ||
    (secondToken !== undefined && serialized.includes(secondToken)) ||
    (await _matchRecoveryFlowCount()) < 2 ||
    storedFlowJson.includes(AMBIGUOUS_DISCLOSURE) ||
    storedFlowJson.includes("uncertainty") ||
    storedFlows.some(
      (flow) =>
        Object.keys(flow).sort().join(",") !==
          "consumedAt,expiresAt,inputHash,purpose,userId" ||
        !/^[0-9a-f]{64}$/.test(flow.inputHash),
    )
  ) {
    failures.push(
      `accepted adjacent story contract failed (session=${Boolean(session)}, artifact=${Boolean(artifact)}, sessionFraming=${session?.framing}, artifactFraming=${artifact?.framing}, rawExact=${session?.feeling === AMBIGUOUS_DISCLOSURE}, policy=${session?.matchRecipe.matchRecoveryPolicyVersion}, controlled=${serialized.includes("controlled choice")}, searchPhrase=${serialized.includes("uncertain unsure identity next step which direction")}, clarification=${session?.storyRequestContext?.clarification}, acceptKey=${serialized.includes('"acceptAdjacent"')})`,
    );
  }

  const ordinaryInput = {
    age: 28,
    feeling: "I keep getting rejected and do not know whether to keep trying.",
  };
  for (let index = 0; index < MATCH_LIMITS.userPerHour - 1; index += 1) {
    const ordinary = await handleIntake(ordinaryInput, ctx);
    if (!("sessionId" in ordinary)) {
      failures.push(`recovery credit incorrectly consumed ordinary rate slot ${index + 2}`);
      break;
    }
  }
  const overBudget = await handleIntake(ordinaryInput, ctx);
  if (!("rateLimited" in overBudget)) {
    failures.push("recovery chain bypassed or over-consumed the bounded hourly budget");
  }
}

async function checkClarificationImprovesMatch(
  failures: string[],
): Promise<void> {
  const ctx: IntakeContext = {
    userId: "match-recovery-improved",
    ipHash: "match-recovery-improved-ip",
  };
  const feeling =
    "I keep sending my work out and every door stays closed without explanation.";
  const result = await handleIntake(
    { age: 28, feeling, clarification: "rejection" },
    ctx,
  );
  if ("clarificationNeeded" in result) {
    failures.push("answered clarification triggered a second question");
    return;
  }
  if (!("sessionId" in result)) {
    failures.push("high-information rejection answer did not improve the stub match");
    return;
  }
  const session = await getOwnedSession(result.sessionId, ctx.userId);
  const artifact = session?.storyArtifactId
    ? await getOwnedStoryArtifact(
        session.storyArtifactId,
        ctx.userId,
        result.sessionId,
      )
    : null;
  if (
    !session ||
    !artifact ||
    session.feeling !== feeling ||
    session.storyRequestContext?.clarification !== "rejection" ||
    !artifact.beats.some((beat) => beat.text.includes("being refused or unseen")) ||
    JSON.stringify(session).includes("rejected dismissed ignored unseen")
  ) {
    failures.push(
      `clarification improvement contract failed (session=${Boolean(session)}, artifact=${Boolean(artifact)}, figure=${session?.figureKey}, rawExact=${session?.feeling === feeling}, pressure=${artifact?.beats.some((beat) => beat.text.includes("being refused or unseen"))}, searchPersisted=${JSON.stringify(session).includes("rejected dismissed ignored unseen")})`,
    );
  }
}

async function checkInvalidAndCrisisPrecedence(
  failures: string[],
): Promise<void> {
  const ctx: IntakeContext = {
    userId: "match-recovery-validation",
    ipHash: "match-recovery-validation-ip",
  };
  const before = await _sessionCount();
  const invalidClarification = await handleIntake(
    {
      age: 30,
      feeling: AMBIGUOUS_DISCLOSURE,
      clarification: "diagnosis",
    },
    ctx,
  );
  const invalidAcceptance = await handleIntake(
    {
      age: 30,
      feeling: AMBIGUOUS_DISCLOSURE,
      acceptAdjacent: "yes",
    },
    ctx,
  );
  const crisis = await handleIntake(
    {
      age: 30,
      feeling: "I want to kill myself",
      clarification: "diagnosis",
      acceptAdjacent: "yes",
    },
    ctx,
  );
  if (
    !("error" in invalidClarification) ||
    !("error" in invalidAcceptance) ||
    !("crisis" in crisis) ||
    (await _sessionCount()) !== before
  ) {
    failures.push("invalid recovery input or crisis precedence violated persistence rules");
  }
}

function checkReaderFramingSurface(failures: string[]): void {
  const preface = readFileSync(
    fileURLToPath(new URL("../components/PrefaceCard.tsx", import.meta.url)),
    "utf8",
  );
  const player = readFileSync(
    fileURLToPath(new URL("../components/StoryPlayer.tsx", import.meta.url)),
    "utf8",
  );
  if (
    !preface.includes('framing === "partial"') ||
    !preface.includes("A partial parallel") ||
    !preface.includes("This is not the same situation") ||
    !player.includes("framing={framing}")
  ) {
    failures.push("partial framing is not visibly projected before story playback");
  }
}

void main();
