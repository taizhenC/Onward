import "server-only";
import { randomBytes } from "node:crypto";
import type {
  CreateSessionInput,
  MatchRecipe,
  OpeningCopy,
  Session,
  SessionPatch,
  SessionStore,
} from "./types";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "./opening-copy";
import { getSupabase } from "./db";

// Durable session store (PERSISTENCE=supabase). Survives restarts and works across
// serverless instances. getSupabase() is called inside the methods, never at import, so this
// module loads harmlessly in memory mode (the provider switch imports it unconditionally).

const TABLE = "sessions";
const MAX_SESSION_ID_INSERT_ATTEMPTS = 5;

type SessionRow = {
  session_id: string;
  figure_key: string;
  stage_id: string;
  framing: string;
  opening_copy: unknown;
  age: number;
  feeling: string | null;
  match_recipe: unknown;
  next_beat_index: number;
  next_chunk_index: number;
  created_at: string;
};

async function createSession(input: CreateSessionInput): Promise<string> {
  for (let attempt = 0; attempt < MAX_SESSION_ID_INSERT_ATTEMPTS; attempt += 1) {
    const sessionId = randomBytes(16).toString("hex");
    const { error } = await getSupabase().from(TABLE).insert({
      session_id: sessionId,
      figure_key: input.figureKey,
      stage_id: input.stageId,
      framing: input.framing,
      opening_copy: input.openingCopy,
      age: input.age,
      feeling: input.feeling,
      match_recipe: input.matchRecipe,
      next_beat_index: 0,
      next_chunk_index: 0,
    });
    if (!error) return sessionId;
    if (!isUniqueConstraintViolation(error)) {
      throw new Error(`createSession insert failed: ${error.message}`);
    }
  }

  throw new Error(
    `createSession insert failed: session_id collided ${MAX_SESSION_ID_INSERT_ATTEMPTS} times`,
  );
}

async function getSession(sessionId: string): Promise<Session | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error) throw new Error(`getSession select failed: ${error.message}`);
  return data ? rowToSession(data as SessionRow) : null;
}

async function updateSession(
  sessionId: string,
  patch: SessionPatch,
): Promise<Session | null> {
  const update: Record<string, number> = {};
  if (patch.nextBeatIndex !== undefined) update.next_beat_index = patch.nextBeatIndex;
  if (patch.nextChunkIndex !== undefined) update.next_chunk_index = patch.nextChunkIndex;
  if (Object.keys(update).length === 0) return getSession(sessionId);

  const { data, error } = await getSupabase()
    .from(TABLE)
    .update(update)
    .eq("session_id", sessionId)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(`updateSession failed: ${error.message}`);
  return data ? rowToSession(data as SessionRow) : null;
}

async function sessionCount(): Promise<number> {
  const { count, error } = await getSupabase()
    .from(TABLE)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`_sessionCount failed: ${error.message}`);
  return count ?? 0;
}

function rowToSession(row: SessionRow): Session {
  return {
    sessionId: row.session_id,
    figureKey: row.figure_key,
    stageId: row.stage_id,
    framing: row.framing === "definitive" ? "definitive" : "partial",
    openingCopy: normalizeOpeningCopy(row.opening_copy),
    age: row.age,
    // feeling is nullable (a future retention job NULLs it). A NULLed session is months old
    // and not mid-story; reconstruct as "" rather than widen Session.feeling to string|null.
    feeling: row.feeling ?? "",
    matchRecipe: row.match_recipe as MatchRecipe,
    nextBeatIndex: row.next_beat_index,
    nextChunkIndex: row.next_chunk_index,
    // Session.createdAt stays a number — map timestamptz back so the ISO string never leaks
    // into TTL/component code that assumes a number.
    createdAt: Date.parse(row.created_at),
  };
}

// Defensive prefaceLines/eyebrow backfill, mirroring the memory store's migrateOpeningCopy —
// a fresh DB has none, but a row written before prefaceLines existed would otherwise crash
// PrefaceCard.map.
function normalizeOpeningCopy(value: unknown): OpeningCopy {
  const copy = (value ?? {}) as Partial<OpeningCopy>;
  return {
    eyebrow: typeof copy.eyebrow === "string" ? copy.eyebrow : NEUTRAL_EYEBROW,
    prefaceLines: Array.isArray(copy.prefaceLines)
      ? copy.prefaceLines
      : DEFAULT_PREFACE_LINES,
  };
}

function isUniqueConstraintViolation(error: { code?: string }): boolean {
  return error.code === "23505";
}

export const supabaseSessionStore: SessionStore = {
  createSession,
  getSession,
  updateSession,
  _sessionCount: sessionCount,
};
