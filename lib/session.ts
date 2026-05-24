import "server-only";
import type {
  CreateSessionInput,
  Session,
  SessionPatch,
  SessionStore,
} from "./types";
import { memorySessionStore } from "./session-store-memory";
import { supabaseSessionStore } from "./session-store-supabase";

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
      process.env.PERSISTENCE === "supabase"
        ? supabaseSessionStore
        : memorySessionStore;
  }
  return store;
}

export function createSession(input: CreateSessionInput): Promise<string> {
  return resolveStore().createSession(input);
}

export function getSession(sessionId: string): Promise<Session | null> {
  return resolveStore().getSession(sessionId);
}

export function updateSession(
  sessionId: string,
  patch: SessionPatch,
): Promise<Session | null> {
  return resolveStore().updateSession(sessionId, patch);
}

export function _sessionCount(): Promise<number> {
  return resolveStore()._sessionCount();
}
