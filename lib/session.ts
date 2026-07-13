import "server-only";
import type {
  AcknowledgeSessionPositionInput,
  AcknowledgeSessionPositionResult,
  CreateSessionInput,
  Session,
  SessionPatch,
  SessionStore,
} from "./types";
import { memorySessionStore } from "./session-store-memory";
import { supabaseSessionStore } from "./session-store-supabase";
import { persistenceMode } from "./persistence";

// The single session-storage boundary. Everything outside lib/ imports from here — never
// from the store modules directly (mirrors the lib/llm.ts provider switch).
//
// PERSISTENCE=memory (default) keeps local dev + smoke hermetic and DB-free; PERSISTENCE=
// supabase turns on durable storage (survives restart, works on serverless). Resolved lazily
// on first use and memoized, so a script that sets PERSISTENCE before its first session call
// always wins regardless of import hoisting. Each process is single-provider by construction
// (smoke pins memory; the Next app + check-db read .env.local).

export type { CreateSessionInput } from "./types";

let store: SessionStore | undefined;

function resolveStore(): SessionStore {
  if (store === undefined) {
    store =
      persistenceMode() === "supabase"
        ? supabaseSessionStore
        : memorySessionStore;
  }
  return store;
}

export function createSession(input: CreateSessionInput): Promise<string> {
  return resolveStore().createSession(input);
}

// Owner-blind read. For scripts and internal plumbing only — request-scoped code
// (pages, API routes) must use getOwnedSession so a foreign session 404s.
export function getSession(sessionId: string): Promise<Session | null> {
  return resolveStore().getSession(sessionId);
}

// The ownership chokepoint (404-over-500 invariant): absent user, unknown id, and
// FOREIGN session are deliberately indistinguishable — all return null, which every
// caller already maps to its 404 branch. No position/existence oracle for sessions
// you don't own.
export async function getOwnedSession(
  sessionId: string,
  userId: string | null,
): Promise<Session | null> {
  if (!userId) return null;
  const session = await resolveStore().getSession(sessionId);
  return session && session.userId === userId ? session : null;
}

// Own-sessions listing for /stories (created-desc). Inherently scoped — callers pass
// the authenticated user id only.
export function listSessionsByUser(userId: string): Promise<Session[]> {
  return resolveStore().listSessionsByUser(userId);
}

export function updateSession(
  sessionId: string,
  patch: SessionPatch,
): Promise<Session | null> {
  return resolveStore().updateSession(sessionId, patch);
}

export function acknowledgeOwnedSessionPosition(
  input: AcknowledgeSessionPositionInput,
): Promise<AcknowledgeSessionPositionResult> {
  return resolveStore().acknowledgePosition(input);
}

export function _sessionCount(): Promise<number> {
  return resolveStore()._sessionCount();
}
