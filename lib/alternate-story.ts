import "server-only";
import { getOwnedSession } from "./session";
import { getOwnedStoryArtifact } from "./story-artifacts";
import { matchForIntake } from "./matching";
import { storySpecStageKey } from "./story-spec-repository";
import {
  loadEligibleStoryCatalog,
  prepareStory,
  type StoryCatalogResult,
} from "./story-generation";
import {
  claimAlternateStoryFlow,
  completeAlternateStoryReady,
  completeAlternateStoryUnavailable,
  isAlternateStoryTokenValid,
  issueAlternateStoryCapability,
  releaseAlternateStoryFlow,
  type ClaimedAlternateStoryFlow,
} from "./alternate-story-flow";
import type { AlternateStoryRequest } from "./alternate-story-request";
import type { IntakeMatchResult } from "./matching";
import type { PreparedStory } from "./story-generation";

export type CreateAlternateStoryResult =
  | { status: "ready"; sessionId: string }
  | { status: "unavailable" }
  | { status: "preparing"; retryAfterMs: number }
  | { status: "expired" }
  | { status: "exhausted" }
  | { status: "invalid_state" }
  | { status: "not_found" }
  | { status: "temporarily_unavailable" };

export type AlternateStoryDependencies = {
  loadCatalog?: typeof loadEligibleStoryCatalog;
  match?: typeof matchForIntake;
  prepare?: typeof prepareStory;
};

export async function createAlternateStory(
  request: AlternateStoryRequest,
  userId: string | null,
  dependencies: AlternateStoryDependencies = {},
): Promise<CreateAlternateStoryResult> {
  const session = await getOwnedSession(request.sessionId, userId);
  if (!userId || !session?.storyArtifactId) return { status: "not_found" };
  const sourceArtifact = await getOwnedStoryArtifact(
    session.storyArtifactId,
    userId,
    session.sessionId,
  );
  if (!sourceArtifact) return { status: "not_found" };
  if (session.nextBeatIndex < sourceArtifact.beats.length) {
    return { status: "invalid_state" };
  }
  if (session.disclosureExpiresAt <= Date.now()) return { status: "expired" };
  if (
    session.alternateOfSessionId !== null ||
    session.age === null ||
    session.storyRequestContext === null ||
    session.feeling === null
  ) {
    return { status: "not_found" };
  }
  if (
    !isAlternateStoryTokenValid({
      userId,
      sourceSessionId: session.sessionId,
      sourceArtifactId: sourceArtifact.artifactId,
      token: request.token,
    })
  ) {
    return { status: "not_found" };
  }
  if (process.env.STORY_CREATION_ENABLED?.trim().toLowerCase() === "false") {
    try {
      const current = await issueAlternateStoryCapability({
        userId,
        session,
        artifact: sourceArtifact,
      });
      if (current.status === "ready") return current;
    } catch {
      // The kill-switch response stays storage-agnostic.
    }
    return { status: "temporarily_unavailable" };
  }

  let claimResult;
  try {
    claimResult = await claimAlternateStoryFlow({
      userId,
      session,
      artifact: sourceArtifact,
      token: request.token,
    });
  } catch {
    return { status: "temporarily_unavailable" };
  }
  if (claimResult.status !== "claimed") {
    if (claimResult.status === "ready") {
      return { status: "ready", sessionId: claimResult.sessionId };
    }
    if (
      claimResult.status === "preparing" ||
      claimResult.status === "cooldown"
    ) {
      return {
        status: "preparing",
        retryAfterMs: claimResult.retryAfterMs,
      };
    }
    return { status: claimResult.status };
  }
  const claim: ClaimedAlternateStoryFlow = claimResult;
  const boundaries = session.storyRequestContext.boundaries ?? undefined;
  const clarification = session.storyRequestContext.clarification ?? undefined;
  const loadCatalog = dependencies.loadCatalog ?? loadEligibleStoryCatalog;
  const match = dependencies.match ?? matchForIntake;
  const prepare = dependencies.prepare ?? prepareStory;

  let catalogResult: StoryCatalogResult;
  try {
    catalogResult = await loadCatalog({
      boundaries,
      excludedStageKeys: new Set([
        storySpecStageKey(session.figureKey, session.stageId),
      ]),
    });
  } catch {
    await releaseQuietly(userId, claim);
    return { status: "temporarily_unavailable" };
  }
  if (catalogResult.status === "unavailable") {
    await releaseQuietly(userId, claim);
    return { status: "temporarily_unavailable" };
  }
  if (session.disclosureExpiresAt <= Date.now()) {
    await releaseQuietly(userId, claim);
    return { status: "expired" };
  }
  if (catalogResult.status === "no_eligible") {
    return finishUnavailable(userId, claim);
  }

  let matchResult: IntakeMatchResult;
  try {
    matchResult = await match({
      age: session.age,
      feeling: session.feeling,
      eligibleStageKeys: new Set(catalogResult.catalog.keys()),
      clarification,
    });
  } catch {
    await releaseQuietly(userId, claim);
    return { status: "temporarily_unavailable" };
  }
  if (session.disclosureExpiresAt <= Date.now()) {
    await releaseQuietly(userId, claim);
    return { status: "expired" };
  }
  // A degraded provider/reranker path is operationally retryable. It must not
  // be recorded as evidence that the library has no suitable alternative.
  if (matchResult.chosenBy === "keyword_fallback") {
    await releaseQuietly(userId, claim);
    return { status: "temporarily_unavailable" };
  }
  if (matchResult.confidence === "low") {
    return finishUnavailable(userId, claim);
  }
  let prepared: PreparedStory | null;
  try {
    prepared = await prepare({
      age: session.age,
      feeling: session.feeling,
      boundaries,
      clarification,
      match: matchResult,
      catalog: catalogResult.catalog,
      framing: "partial",
      mode: "alternate",
    });
  } catch {
    await releaseQuietly(userId, claim);
    return { status: "temporarily_unavailable" };
  }
  if (
    !prepared ||
    prepared.framing !== "partial" ||
    (prepared.figureKey === session.figureKey &&
      prepared.stageId === session.stageId)
  ) {
    await releaseQuietly(userId, claim);
    return { status: "temporarily_unavailable" };
  }

  try {
    const resultSessionId = await completeAlternateStoryReady({
      userId,
      claim,
      sourceArtifactId: sourceArtifact.artifactId,
      artifact: prepared.artifact,
    });
    return { status: "ready", sessionId: resultSessionId };
  } catch {
    await releaseQuietly(userId, claim);
    return { status: "temporarily_unavailable" };
  }
}

async function finishUnavailable(
  userId: string,
  claim: ClaimedAlternateStoryFlow,
): Promise<CreateAlternateStoryResult> {
  try {
    return (await completeAlternateStoryUnavailable(userId, claim))
      ? { status: "unavailable" }
      : { status: "temporarily_unavailable" };
  } catch {
    await releaseQuietly(userId, claim);
    return { status: "temporarily_unavailable" };
  }
}

async function releaseQuietly(
  userId: string,
  claim: ClaimedAlternateStoryFlow,
): Promise<void> {
  try {
    await releaseAlternateStoryFlow(userId, claim);
  } catch {
    // The lease self-expires. Never reflect storage detail or loop here.
  }
}
