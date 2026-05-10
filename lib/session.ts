import "server-only";
import { randomBytes } from "node:crypto";
import type { Framing, Session } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __onwardSessions: Map<string, Session> | undefined;
}

const sessions: Map<string, Session> =
  globalThis.__onwardSessions ?? (globalThis.__onwardSessions = new Map());

export type CreateSessionInput = {
  figureKey: string;
  stageId: string;
  framing: Framing;
  age: number;
  feeling: string;
};

export function createSession(input: CreateSessionInput): string {
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
  return sessions.get(sessionId) ?? null;
}

export function updateSession(
  sessionId: string,
  patch: Partial<Pick<Session, "nextBeatIndex" | "choices">>,
): Session | null {
  const existing = sessions.get(sessionId);
  if (!existing) return null;
  const next: Session = {
    ...existing,
    ...(patch.nextBeatIndex !== undefined
      ? { nextBeatIndex: patch.nextBeatIndex }
      : {}),
    ...(patch.choices !== undefined ? { choices: patch.choices } : {}),
  };
  sessions.set(sessionId, next);
  return next;
}

export function _sessionMapSize(): number {
  return sessions.size;
}
