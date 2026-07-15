import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { Session } from "./types";
import type { StoryArtifact } from "./story-artifact-types";
import {
  ALTERNATE_STORY_CAPABILITY_TTL_MINUTES,
  ALTERNATE_STORY_CLAIM_LEASE_MINUTES,
  ALTERNATE_STORY_POLICY_VERSION,
  ALTERNATE_STORY_RETRY_COOLDOWN_MS,
  type AlternateStoryOffer,
} from "./alternate-story-types";
import {
  claimMemoryAlternateStoryFlow,
  completeMemoryAlternateStoryExpired,
  completeMemoryAlternateStoryReady,
  completeMemoryAlternateStoryUnavailable,
  issueMemoryAlternateStoryFlow,
  listMemoryAlternateStoryFlows,
  releaseMemoryAlternateStoryFlow,
  type AlternateFlowClaimResult,
} from "./alternate-story-store-memory";
import {
  claimSupabaseAlternateStoryFlow,
  completeSupabaseAlternateStoryExpired,
  completeSupabaseAlternateStoryReady,
  completeSupabaseAlternateStoryUnavailable,
  issueSupabaseAlternateStoryFlow,
  releaseSupabaseAlternateStoryFlow,
} from "./alternate-story-store-supabase";
import { createMemoryAlternateSession } from "./session-store-memory";
import { persistenceMode } from "./persistence";
import { readStrongSecret } from "./secret-config";
import {
  prepareAlternateReadyTelemetry,
  prepareAlternateRequestedTelemetry,
  prepareAlternateResolvedTelemetry,
} from "./alternate-story-telemetry";
import type { TelemetryFlowId } from "./telemetry-types";

declare global {
  var __onwardAlternateStorySecret: Buffer | undefined;
}

const EPHEMERAL_FALLBACK_SECRET =
  globalThis.__onwardAlternateStorySecret ??
  (globalThis.__onwardAlternateStorySecret = randomBytes(32));

export type ClaimedAlternateStoryFlow = {
  sourceSessionId: string;
  leaseId: string;
  telemetryFlowId: TelemetryFlowId | null;
};

export type AlternateStoryClaim =
  | ({ status: "claimed" } & ClaimedAlternateStoryFlow)
  | Exclude<AlternateFlowClaimResult, { status: "claimed" }>;

export async function issueAlternateStoryCapability(input: {
  userId: string;
  session: Session;
  artifact: StoryArtifact;
}): Promise<AlternateStoryOffer> {
  const { userId, session, artifact } = input;
  if (
    session.userId !== userId ||
    session.alternateOfSessionId !== null ||
    session.storyArtifactId !== artifact.artifactId ||
    session.figureKey !== artifact.figureKey ||
    session.stageId !== artifact.stageId ||
    session.nextBeatIndex < artifact.beats.length
  ) {
    return { status: "not_offered" };
  }
  if (session.disclosureExpiresAt <= Date.now()) return { status: "expired" };
  if (session.feeling === null || session.storyRequestContext === null) {
    return { status: "not_offered" };
  }
  const allowCreate =
    process.env.STORY_CREATION_ENABLED?.trim().toLowerCase() !== "false";

  const token = deriveToken(userId, session.sessionId, artifact.artifactId);
  const tokenHash = hashToken(token);
  const issueResult =
    persistenceMode() === "supabase"
      ? await issueSupabaseAlternateStoryFlow({
          userId,
          sourceSessionId: session.sessionId,
          sourceArtifactId: artifact.artifactId,
          tokenHash,
          policyVersion: ALTERNATE_STORY_POLICY_VERSION,
          allowCreate,
        })
      : issueMemoryAlternateStoryFlow({
          userId,
          sourceSessionId: session.sessionId,
          sourceArtifactId: artifact.artifactId,
          tokenHash,
          policyVersion: ALTERNATE_STORY_POLICY_VERSION,
          allowCreate,
          expiresAt: Math.min(
            session.disclosureExpiresAt,
            Date.now() + ALTERNATE_STORY_CAPABILITY_TTL_MINUTES * 60_000,
          ),
          contextExpiresAt: session.disclosureExpiresAt,
        });

  if (issueResult.status === "ready") return issueResult;
  if (issueResult.status === "unavailable") return issueResult;
  if (issueResult.status === "preparing") return issueResult;
  if (issueResult.status === "expired") return issueResult;
  if (issueResult.status === "exhausted") return issueResult;
  if (issueResult.status !== "available") {
    return allowCreate
      ? { status: "not_offered" }
      : {
          status: "temporarily_unavailable",
          retryAfterMs: ALTERNATE_STORY_RETRY_COOLDOWN_MS,
        };
  }
  if (!allowCreate) {
    return {
      status: "temporarily_unavailable",
      retryAfterMs: ALTERNATE_STORY_RETRY_COOLDOWN_MS,
    };
  }
  return {
    status: "available",
    token,
    expiresAt: new Date(issueResult.expiresAt).toISOString(),
  };
}

export async function claimAlternateStoryFlow(input: {
  userId: string;
  session: Session;
  artifact: StoryArtifact;
  token: string;
}): Promise<AlternateStoryClaim> {
  const expected = deriveToken(
    input.userId,
    input.session.sessionId,
    input.artifact.artifactId,
  );
  if (!safeTokenEqual(input.token, expected)) return { status: "not_found" };
  const telemetry = await prepareAlternateRequestedTelemetry({
    userId: input.userId,
    session: input.session,
  });
  const resolutionTelemetry = prepareAlternateResolvedTelemetry(
    telemetry?.flowId ?? null,
    "exhausted",
  );
  const tokenHash = hashToken(input.token);
  const leaseId = randomBytes(16).toString("hex");
  const leaseExpiresAt =
    Date.now() + ALTERNATE_STORY_CLAIM_LEASE_MINUTES * 60_000;
  const result =
    persistenceMode() === "supabase"
      ? await claimSupabaseAlternateStoryFlow({
          userId: input.userId,
          sourceSessionId: input.session.sessionId,
          sourceArtifactId: input.artifact.artifactId,
          tokenHash,
          policyVersion: ALTERNATE_STORY_POLICY_VERSION,
          leaseId,
          telemetry,
          resolutionTelemetry,
        })
      : claimMemoryAlternateStoryFlow({
          userId: input.userId,
          sourceSessionId: input.session.sessionId,
          sourceArtifactId: input.artifact.artifactId,
          tokenHash,
          policyVersion: ALTERNATE_STORY_POLICY_VERSION,
          leaseId,
          leaseExpiresAt,
          telemetry,
          resolutionTelemetry,
        });
  return result.status === "claimed"
    ? {
        status: "claimed",
        sourceSessionId: input.session.sessionId,
        leaseId,
        telemetryFlowId: telemetry?.flowId ?? null,
      }
    : result;
}

export function isAlternateStoryTokenValid(input: {
  userId: string;
  sourceSessionId: string;
  sourceArtifactId: string;
  token: string;
}): boolean {
  return safeTokenEqual(
    input.token,
    deriveToken(input.userId, input.sourceSessionId, input.sourceArtifactId),
  );
}

export async function releaseAlternateStoryFlow(
  userId: string,
  claim: ClaimedAlternateStoryFlow,
): Promise<void> {
  const telemetry = prepareAlternateResolvedTelemetry(
    claim.telemetryFlowId,
    "failed",
  );
  if (persistenceMode() === "supabase") {
    await releaseSupabaseAlternateStoryFlow({
      userId,
      sourceSessionId: claim.sourceSessionId,
      leaseId: claim.leaseId,
      telemetry,
    });
  } else {
    releaseMemoryAlternateStoryFlow({
      userId,
      sourceSessionId: claim.sourceSessionId,
      leaseId: claim.leaseId,
      telemetry,
    });
  }
}

export async function completeAlternateStoryUnavailable(
  userId: string,
  claim: ClaimedAlternateStoryFlow,
): Promise<boolean> {
  const telemetry = prepareAlternateResolvedTelemetry(
    claim.telemetryFlowId,
    "unavailable",
  );
  return persistenceMode() === "supabase"
    ? completeSupabaseAlternateStoryUnavailable({
        userId,
        sourceSessionId: claim.sourceSessionId,
        leaseId: claim.leaseId,
        telemetry,
      })
    : completeMemoryAlternateStoryUnavailable({
        userId,
        sourceSessionId: claim.sourceSessionId,
        leaseId: claim.leaseId,
        telemetry,
      });
}

export async function completeAlternateStoryExpired(
  userId: string,
  claim: ClaimedAlternateStoryFlow,
): Promise<boolean> {
  const telemetry = prepareAlternateResolvedTelemetry(
    claim.telemetryFlowId,
    "expired",
  );
  return persistenceMode() === "supabase"
    ? completeSupabaseAlternateStoryExpired({
        userId,
        sourceSessionId: claim.sourceSessionId,
        leaseId: claim.leaseId,
        telemetry,
      })
    : completeMemoryAlternateStoryExpired({
        userId,
        sourceSessionId: claim.sourceSessionId,
        leaseId: claim.leaseId,
        telemetry,
      });
}

export async function completeAlternateStoryReady(input: {
  userId: string;
  claim: ClaimedAlternateStoryFlow;
  sourceArtifactId: string;
  artifact: StoryArtifact;
}): Promise<string> {
  const telemetry = prepareAlternateReadyTelemetry(
    input.claim.telemetryFlowId,
    input.artifact,
  );
  if (persistenceMode() === "supabase") {
    return completeSupabaseAlternateStoryReady({
      userId: input.userId,
      sourceSessionId: input.claim.sourceSessionId,
      leaseId: input.claim.leaseId,
      artifact: input.artifact,
      telemetry,
    });
  }
  const sessionId = completeMemoryAlternateStoryReady({
    userId: input.userId,
    sourceSessionId: input.claim.sourceSessionId,
    sourceArtifactId: input.sourceArtifactId,
    leaseId: input.claim.leaseId,
    artifact: input.artifact,
    telemetry,
    createSession: () =>
      createMemoryAlternateSession({
        userId: input.userId,
        sourceSessionId: input.claim.sourceSessionId,
        sourceArtifactId: input.sourceArtifactId,
        artifact: input.artifact,
      }),
  });
  if (!sessionId) {
    throw new Error("alternate story memory flow lost its claim");
  }
  return sessionId;
}

export function _listAlternateStoryFlows() {
  if (persistenceMode() === "supabase") {
    throw new Error("alternate story test projection is memory-only");
  }
  return listMemoryAlternateStoryFlows();
}

function deriveToken(
  userId: string,
  sourceSessionId: string,
  sourceArtifactId: string,
): string {
  return createHmac("sha256", alternateStorySecret())
    .update(
      `${ALTERNATE_STORY_POLICY_VERSION}:${userId}:${sourceSessionId}:${sourceArtifactId}`,
    )
    .digest("base64url");
}

function alternateStorySecret(): string | Buffer {
  const configured = readStrongSecret([
    "ALTERNATE_STORY_TOKEN_SECRET",
    "MATCH_RECOVERY_TOKEN_SECRET",
    "IP_HASH_SALT",
  ]);
  if (configured) return configured;
  if (persistenceMode() === "supabase" || process.env.NODE_ENV === "production") {
    throw new Error(
      "ALTERNATE_STORY_TOKEN_SECRET, MATCH_RECOVERY_TOKEN_SECRET, or IP_HASH_SALT is required",
    );
  }
  return EPHEMERAL_FALLBACK_SECRET;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeTokenEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
