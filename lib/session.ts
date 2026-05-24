import "server-only";
import { randomBytes } from "node:crypto";
import type { Framing, OpeningCopy, Session } from "./types";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "./opening-copy";

declare global {
  // eslint-disable-next-line no-var
  var __onwardSessions: Map<string, Session> | undefined;
}

const sessions: Map<string, Session> =
  globalThis.__onwardSessions ?? (globalThis.__onwardSessions = new Map());

const PHASE0_SESSION_TTL_MS = 60 * 60 * 1000;

export type CreateSessionInput = {
  figureKey: string;
  stageId: string;
  framing: Framing;
  openingCopy: OpeningCopy;
  age: number;
  feeling: string;
};

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

export function createSession(input: CreateSessionInput): string {
  pruneExpiredSessions();
  const sessionId = randomBytes(16).toString("hex");
  const session: Session = {
    sessionId,
    figureKey: input.figureKey,
    stageId: input.stageId,
    framing: input.framing,
    openingCopy: input.openingCopy,
    age: input.age,
    feeling: input.feeling,
    nextBeatIndex: 0,
    nextChunkIndex: 0,
    createdAt: Date.now(),
  };
  sessions.set(sessionId, session);
  return sessionId;
}

export function getSession(sessionId: string): Session | null {
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
    openingCopy !== session.openingCopy
  ) {
    const migrated: Session = {
      ...session,
      nextChunkIndex:
        legacySession.nextChunkIndex === undefined
          ? 0
          : legacySession.nextChunkIndex,
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
function migrateOpeningCopy(openingCopy: OpeningCopy | undefined): OpeningCopy {
  if (openingCopy === undefined) {
    return { eyebrow: NEUTRAL_EYEBROW, prefaceLines: DEFAULT_PREFACE_LINES };
  }
  if (openingCopy.prefaceLines === undefined) {
    return { ...openingCopy, prefaceLines: DEFAULT_PREFACE_LINES };
  }
  return openingCopy;
}

export function updateSession(
  sessionId: string,
  patch: Partial<Pick<Session, "nextBeatIndex" | "nextChunkIndex">>,
): Session | null {
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
  };
  sessions.set(sessionId, next);
  return next;
}

export function _sessionMapSize(): number {
  pruneExpiredSessions();
  return sessions.size;
}
