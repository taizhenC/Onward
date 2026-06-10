import "server-only";
import { randomBytes } from "node:crypto";
import type {
  CreateSessionInput,
  OpeningCopy,
  Session,
  SessionPatch,
  SessionStore,
} from "./types";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "./opening-copy";
import { LOCAL_DEV_USER_ID } from "./auth";

// In-process session store (PERSISTENCE=memory, the default). State lives on globalThis so
// it survives Next dev hot-reload; a full process restart still clears it — which is exactly
// what the Supabase store fixes. A short dev TTL bounds memory growth. Keeps local dev and
// the smoke test hermetic and DB-free.

declare global {
  // eslint-disable-next-line no-var
  var __onwardSessions: Map<string, Session> | undefined;
}

const sessions: Map<string, Session> =
  globalThis.__onwardSessions ?? (globalThis.__onwardSessions = new Map());

const PHASE0_SESSION_TTL_MS = 60 * 60 * 1000;

function isExpired(session: Session, now = Date.now()): boolean {
  return now - session.createdAt > PHASE0_SESSION_TTL_MS;
}

function pruneExpiredSessions(now = Date.now()): void {
  for (const [sessionId, session] of sessions) {
    if (isExpired(session, now)) {
      sessions.delete(sessionId);
    }
  }
}

async function createSession(input: CreateSessionInput): Promise<string> {
  pruneExpiredSessions();
  const sessionId = randomBytes(16).toString("hex");
  const now = Date.now();
  const session: Session = {
    sessionId,
    userId: input.userId,
    figureKey: input.figureKey,
    stageId: input.stageId,
    framing: input.framing,
    openingCopy: input.openingCopy,
    age: input.age,
    feeling: input.feeling,
    matchRecipe: input.matchRecipe,
    nextBeatIndex: 0,
    nextChunkIndex: 0,
    createdAt: now,
    updatedAt: now,
  };
  sessions.set(sessionId, session);
  return sessionId;
}

async function getSession(sessionId: string): Promise<Session | null> {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (isExpired(session)) {
    sessions.delete(sessionId);
    return null;
  }
  // Hot-reload safety for in-memory sessions created before these fields existed.
  const openingCopy = migrateOpeningCopy(session.openingCopy);
  const legacySession = session as any;
  if (
    legacySession.nextChunkIndex === undefined ||
    legacySession.userId === undefined ||
    legacySession.updatedAt === undefined ||
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
function migrateOpeningCopy(openingCopy: any): OpeningCopy {
  if (openingCopy === undefined) {
    return { eyebrow: NEUTRAL_EYEBROW, prefaceLines: DEFAULT_PREFACE_LINES };
  }
  if (openingCopy.prefaceLines === undefined) {
    return { ...openingCopy, prefaceLines: DEFAULT_PREFACE_LINES };
  }
  return openingCopy;
}

async function updateSession(
  sessionId: string,
  patch: SessionPatch,
): Promise<Session | null> {
  const existing = sessions.get(sessionId);
  if (!existing) return null;
  if (isExpired(existing)) {
    sessions.delete(sessionId);
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
  listSessionsByUser,
  _sessionCount: sessionCount,
};
