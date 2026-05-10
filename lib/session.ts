import "server-only";
import { randomBytes } from "node:crypto";
import type { Framing, Session } from "./types";

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
    age: input.age,
    feeling: input.feeling,
    nextBeatIndex: 0,
    choices: {},
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
  return session;
}

export function updateSession(
  sessionId: string,
  patch: Partial<Pick<Session, "nextBeatIndex" | "choices">>,
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
    ...(patch.choices !== undefined
      ? { choices: { ...existing.choices, ...patch.choices } }
      : {}),
  };
  sessions.set(sessionId, next);
  return next;
}

export function _sessionMapSize(): number {
  pruneExpiredSessions();
  return sessions.size;
}
