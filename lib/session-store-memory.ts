import "server-only";
import { randomBytes } from "node:crypto";
import type {
  AcknowledgeSessionPositionInput,
  AcknowledgeSessionPositionResult,
  CreateSessionInput,
  OpeningCopy,
  Session,
  SessionStore,
} from "./types";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "./opening-copy";
import { LOCAL_DEV_USER_ID } from "./auth";
import {
  deleteMemoryStoryArtifact,
  putMemoryStoryArtifact,
} from "./story-artifact-store-memory";
import { deleteMemoryResonanceFeedbackForSession } from "./resonance-feedback-store-memory";

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
      if (session.storyArtifactId) deleteMemoryStoryArtifact(session.storyArtifactId);
      deleteMemoryResonanceFeedbackForSession(sessionId);
      sessions.delete(sessionId);
    }
  }
}

async function createSession(input: CreateSessionInput): Promise<string> {
  pruneExpiredSessions();
  let sessionId = "";
  for (let attempt = 0; attempt < MAX_SESSION_ID_ATTEMPTS; attempt += 1) {
    const candidate = randomBytes(16).toString("hex");
    if (!sessions.has(candidate)) {
      sessionId = candidate;
      break;
    }
  }
  if (!sessionId) throw new Error("could not allocate a unique session ID");
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
    matchRecipe: input.matchRecipe,
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
    if (session.storyArtifactId) deleteMemoryStoryArtifact(session.storyArtifactId);
    deleteMemoryResonanceFeedbackForSession(sessionId);
    sessions.delete(sessionId);
    return null;
  }
  // Hot-reload safety for in-memory sessions created before these fields existed.
  const openingCopy = migrateOpeningCopy(session.openingCopy);
  const legacySession = session as unknown as {
    nextChunkIndex?: number;
    userId?: string;
    updatedAt?: number;
    storyArtifactId?: string | null;
  };
  if (
    legacySession.nextChunkIndex === undefined ||
    legacySession.userId === undefined ||
    legacySession.updatedAt === undefined ||
    legacySession.storyArtifactId === undefined ||
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
      openingCopy,
    };
    sessions.set(sessionId, migrated);
    return migrated;
  }
  return session;
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

async function acknowledgePosition(
  input: AcknowledgeSessionPositionInput,
): Promise<AcknowledgeSessionPositionResult> {
  const existing = sessions.get(input.sessionId);
  if (!existing || isExpired(existing) || existing.userId !== input.userId) {
    if (existing && isExpired(existing)) {
      if (existing.storyArtifactId) deleteMemoryStoryArtifact(existing.storyArtifactId);
      deleteMemoryResonanceFeedbackForSession(input.sessionId);
      sessions.delete(input.sessionId);
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
  acknowledgePosition,
  listSessionsByUser,
  _sessionCount: sessionCount,
};
