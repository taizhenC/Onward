import "server-only";
import { randomBytes } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type {
  AcknowledgeSessionPositionInput,
  AcknowledgeSessionPositionResult,
  CreateSessionInput,
  OpeningCopy,
  Session,
  SessionPatch,
  SessionStore,
} from "./types";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "./opening-copy";
import { LOCAL_DEV_USER_ID } from "./auth";
import {
  deleteMemoryStoryArtifact,
  getOwnedMemoryStoryArtifactSync,
  putMemoryStoryArtifact,
} from "./story-artifact-store-memory";
import { deleteMemoryResonanceFeedbackForSession } from "./resonance-feedback-store-memory";
import { FEELING_RETENTION_DAYS } from "./match-config";
import {
  deleteMemoryAlternateStoryFlow,
  markMemoryAlternateResultDeleted,
} from "./alternate-story-store-memory";
import { ALTERNATE_STORY_POLICY_VERSION } from "./alternate-story-types";
import { storyProfileAllowed } from "./story-boundaries";
import type { StoryArtifact } from "./story-artifact-types";
import { TelemetryFlowConflictError } from "./telemetry-flow-errors";
import {
  bindMemoryTelemetryFlow,
  deleteMemoryTelemetryFlowBindingForRoot,
  getMemoryTelemetryFlowBindingByFlow,
} from "./telemetry-flow-binding-memory";

// In-process session store (PERSISTENCE=memory, the default). State lives on globalThis so
// it survives Next dev hot-reload; a full process restart still clears it — which is exactly
// what the Supabase store fixes. A short dev TTL bounds memory growth. Keeps local dev and
// the smoke test hermetic and DB-free.

declare global {
  var __onwardSessions: Map<string, Session> | undefined;
}

const sessions: Map<string, Session> =
  globalThis.__onwardSessions ?? (globalThis.__onwardSessions = new Map());

const PHASE0_SESSION_TTL_MS = 60 * 60 * 1000;
const MAX_SESSION_ID_ATTEMPTS = 5;

function isExpired(session: Session, now = Date.now()): boolean {
  return now - session.createdAt > PHASE0_SESSION_TTL_MS;
}

function pruneExpiredSessions(now = Date.now()): void {
  for (const [sessionId, session] of sessions) {
    if (isExpired(session, now)) {
      deleteMemorySessionCascade(sessionId);
    }
  }
}

function allocateSessionId(): string {
  for (let attempt = 0; attempt < MAX_SESSION_ID_ATTEMPTS; attempt += 1) {
    const candidate = randomBytes(16).toString("hex");
    if (!sessions.has(candidate)) return candidate;
  }
  throw new Error("could not allocate a unique session ID");
}

async function createSession(input: CreateSessionInput): Promise<string> {
  pruneExpiredSessions();
  const existingBinding = input.telemetryFlowId
    ? getMemoryTelemetryFlowBindingByFlow(input.telemetryFlowId)
    : null;
  if (existingBinding) {
    if (existingBinding.userId !== input.userId) {
      throw new TelemetryFlowConflictError(
        "telemetry flow is already owned by another session",
      );
    }
    const existing = sessions.get(existingBinding.rootSessionId);
    if (
      existing &&
      !isExpired(existing) &&
      existing.alternateOfSessionId === null
    ) {
      expireSensitiveContext(existing);
      if (
        existing.userId === input.userId &&
        existing.framing === input.framing &&
        existing.age === input.age &&
        existing.feeling === input.feeling &&
        isDeepStrictEqual(
          existing.storyRequestContext,
          input.storyRequestContext,
        )
      ) {
        return existing.sessionId;
      }
      // A response-loss retry may reuse the root only for the exact disclosure
      // and safety context that created it. Edited text or tighter boundaries
      // must never surface the prior story under a new request.
      throw new TelemetryFlowConflictError(
        "telemetry flow retry identity conflicted",
      );
    }
    if (existing) deleteMemorySessionCascade(existing.sessionId);
    else deleteMemoryTelemetryFlowBindingForRoot(existingBinding.rootSessionId);
  }

  const sessionId = allocateSessionId();
  const now = Date.now();
  const session: Session = {
    sessionId,
    userId: input.userId,
    figureKey: input.figureKey,
    stageId: input.stageId,
    storyArtifactId: input.artifact.artifactId,
    framing: input.framing,
    openingCopy: input.artifact.openingCopy,
    age: input.age,
    feeling: input.feeling,
    storyRequestContext: structuredClone(input.storyRequestContext),
    disclosureExpiresAt:
      now + FEELING_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    alternateOfSessionId: null,
    matchRecipe: input.matchRecipe,
    nextBeatIndex: 0,
    nextChunkIndex: 0,
    createdAt: now,
    updatedAt: now,
  };
  putMemoryStoryArtifact(sessionId, input.userId, input.artifact);
  try {
    sessions.set(sessionId, session);
    if (input.telemetryFlowId) {
      const binding = bindMemoryTelemetryFlow({
        flowId: input.telemetryFlowId,
        userId: input.userId,
        rootSessionId: sessionId,
      });
      if (binding !== "created" && binding !== "existing") {
        throw new TelemetryFlowConflictError(
          `telemetry flow binding failed: ${binding}`,
        );
      }
    }
  } catch (error) {
    sessions.delete(sessionId);
    deleteMemoryStoryArtifact(input.artifact.artifactId);
    throw error;
  }
  return sessionId;
}

export function createMemoryAlternateSession(input: {
  userId: string;
  sourceSessionId: string;
  sourceArtifactId: string;
  artifact: StoryArtifact;
}): string {
  pruneExpiredSessions();
  const source = sessions.get(input.sourceSessionId);
  if (!source || source.userId !== input.userId) {
    throw new Error("alternate source not found");
  }
  expireSensitiveContext(source);
  const existing = [...sessions.values()].find(
    (session) => session.alternateOfSessionId === source.sessionId,
  );
  if (existing) return existing.sessionId;
  const sourceArtifact = getOwnedMemoryStoryArtifactSync(
    input.sourceArtifactId,
    input.userId,
    input.sourceSessionId,
  );
  const boundaries = source.storyRequestContext?.boundaries ?? undefined;
  if (
    source.alternateOfSessionId !== null ||
    source.storyArtifactId !== input.sourceArtifactId ||
    source.feeling === null ||
    source.storyRequestContext === null ||
    source.disclosureExpiresAt <= Date.now() ||
    !sourceArtifact ||
    source.nextBeatIndex < sourceArtifact.beats.length ||
    (source.figureKey === input.artifact.figureKey &&
      source.stageId === input.artifact.stageId) ||
    input.artifact.framing !== "partial" ||
    input.artifact.recipe.match.alternateStoryPolicyVersion !==
      ALTERNATE_STORY_POLICY_VERSION ||
    !storyProfileAllowed(input.artifact.contentProfile, boundaries)
  ) {
    throw new Error("alternate session invariants failed");
  }

  const sessionId = allocateSessionId();
  const now = Date.now();
  const session: Session = {
    sessionId,
    userId: source.userId,
    figureKey: input.artifact.figureKey,
    stageId: input.artifact.stageId,
    storyArtifactId: input.artifact.artifactId,
    framing: "partial",
    openingCopy: input.artifact.openingCopy,
    age: null,
    feeling: null,
    storyRequestContext: null,
    disclosureExpiresAt: source.disclosureExpiresAt,
    alternateOfSessionId: source.sessionId,
    matchRecipe: input.artifact.recipe.match,
    nextBeatIndex: 0,
    nextChunkIndex: 0,
    createdAt: now,
    updatedAt: now,
  };
  putMemoryStoryArtifact(sessionId, input.userId, input.artifact);
  try {
    sessions.set(sessionId, session);
  } catch (error) {
    deleteMemoryStoryArtifact(input.artifact.artifactId);
    throw error;
  }
  return sessionId;
}

async function getSession(sessionId: string): Promise<Session | null> {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (isExpired(session)) {
    deleteMemorySessionCascade(sessionId);
    return null;
  }
  expireSensitiveContext(session);
  // Hot-reload safety for in-memory sessions created before these fields existed.
  const openingCopy = migrateOpeningCopy(session.openingCopy);
  const legacySession = session as unknown as {
    nextChunkIndex?: number;
    userId?: string;
    updatedAt?: number;
    storyArtifactId?: string | null;
    storyRequestContext?: Session["storyRequestContext"];
    disclosureExpiresAt?: number;
    alternateOfSessionId?: string | null;
  };
  if (
    legacySession.nextChunkIndex === undefined ||
    legacySession.userId === undefined ||
    legacySession.updatedAt === undefined ||
    legacySession.storyArtifactId === undefined ||
    legacySession.storyRequestContext === undefined ||
    legacySession.disclosureExpiresAt === undefined ||
    legacySession.alternateOfSessionId === undefined ||
    openingCopy !== session.openingCopy
  ) {
    const migrated: Session = {
      ...session,
      nextChunkIndex:
        legacySession.nextChunkIndex === undefined
          ? 0
          : legacySession.nextChunkIndex,
      userId: legacySession.userId ?? LOCAL_DEV_USER_ID,
      updatedAt: legacySession.updatedAt ?? session.createdAt,
      storyArtifactId: legacySession.storyArtifactId ?? null,
      // Legacy hot-reload rows did not capture exact boundaries/clarification.
      storyRequestContext: legacySession.storyRequestContext ?? null,
      disclosureExpiresAt:
        legacySession.disclosureExpiresAt ??
        session.createdAt + FEELING_RETENTION_DAYS * 24 * 60 * 60 * 1000,
      alternateOfSessionId: legacySession.alternateOfSessionId ?? null,
      openingCopy,
    };
    sessions.set(sessionId, migrated);
    return migrated;
  }
  return session;
}

function expireSensitiveContext(session: Session, now = Date.now()): void {
  if (session.disclosureExpiresAt <= now) {
    session.feeling = null;
    session.storyRequestContext = null;
  }
}

// Backfill opening copy for sessions created before a field existed (first eyebrow, then
// prefaceLines). Returns the SAME reference when nothing is missing, so getSession can
// cheaply tell whether a migration write is needed.
function migrateOpeningCopy(openingCopy: unknown): OpeningCopy {
  if (
    openingCopy === null ||
    openingCopy === undefined ||
    typeof openingCopy !== "object"
  ) {
    return { eyebrow: NEUTRAL_EYEBROW, prefaceLines: DEFAULT_PREFACE_LINES };
  }

  const candidate = openingCopy as Partial<OpeningCopy>;
  if (
    typeof candidate.eyebrow === "string" &&
    Array.isArray(candidate.prefaceLines)
  ) {
    return openingCopy as OpeningCopy;
  }

  return {
    eyebrow:
      typeof candidate.eyebrow === "string"
        ? candidate.eyebrow
        : NEUTRAL_EYEBROW,
    prefaceLines: Array.isArray(candidate.prefaceLines)
      ? candidate.prefaceLines
      : DEFAULT_PREFACE_LINES,
  };
}

async function updateSession(
  sessionId: string,
  patch: SessionPatch,
): Promise<Session | null> {
  const existing = sessions.get(sessionId);
  if (!existing) return null;
  if (isExpired(existing)) {
    deleteMemorySessionCascade(sessionId);
    return null;
  }
  const next: Session = {
    ...existing,
    ...(patch.nextBeatIndex !== undefined
      ? { nextBeatIndex: patch.nextBeatIndex }
      : {}),
    ...(patch.nextChunkIndex !== undefined
      ? { nextChunkIndex: patch.nextChunkIndex }
      : {}),
    updatedAt: Date.now(),
  };
  sessions.set(sessionId, next);
  return next;
}

async function acknowledgePosition(
  input: AcknowledgeSessionPositionInput,
): Promise<AcknowledgeSessionPositionResult> {
  const existing = sessions.get(input.sessionId);
  if (!existing || isExpired(existing) || existing.userId !== input.userId) {
    if (existing && isExpired(existing)) {
      deleteMemorySessionCascade(input.sessionId);
    }
    return "not_found";
  }

  if (
    existing.nextBeatIndex === input.nextBeatIndex &&
    existing.nextChunkIndex === input.nextChunkIndex
  ) {
    return "already_advanced";
  }

  if (
    existing.nextBeatIndex !== input.expectedBeatIndex ||
    existing.nextChunkIndex !== input.expectedChunkIndex
  ) {
    return "conflict";
  }

  sessions.set(input.sessionId, {
    ...existing,
    nextBeatIndex: input.nextBeatIndex,
    nextChunkIndex: input.nextChunkIndex,
    updatedAt: Date.now(),
  });
  return "advanced";
}

function deleteMemorySessionCascade(sessionId: string): void {
  for (const child of [...sessions.values()]) {
    if (child.alternateOfSessionId === sessionId) {
      deleteMemorySessionCascade(child.sessionId);
    }
  }
  const session = sessions.get(sessionId);
  markMemoryAlternateResultDeleted(sessionId);
  if (session?.storyArtifactId) deleteMemoryStoryArtifact(session.storyArtifactId);
  deleteMemoryResonanceFeedbackForSession(sessionId);
  deleteMemoryAlternateStoryFlow(sessionId);
  if (session?.alternateOfSessionId === null) {
    deleteMemoryTelemetryFlowBindingForRoot(sessionId);
  }
  sessions.delete(sessionId);
}

async function listSessionsByUser(userId: string): Promise<Session[]> {
  pruneExpiredSessions();
  return [...sessions.values()]
    .filter((session) => session.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

async function sessionCount(): Promise<number> {
  pruneExpiredSessions();
  return sessions.size;
}

export const memorySessionStore: SessionStore = {
  createSession,
  getSession,
  updateSession,
  acknowledgePosition,
  listSessionsByUser,
  _sessionCount: sessionCount,
};
