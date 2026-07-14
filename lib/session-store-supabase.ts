import "server-only";
import { randomBytes } from "node:crypto";
import type {
  AcknowledgeSessionPositionInput,
  AcknowledgeSessionPositionResult,
  CreateSessionInput,
  MatchRecipe,
  OpeningCopy,
  Session,
  SessionStore,
} from "./types";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "./opening-copy";
import { getSupabase } from "./db";
import { parseStoryRequestContext } from "./story-request-context";
import { TelemetryFlowConflictError } from "./telemetry-flow-errors";

// Durable session store (PERSISTENCE=supabase). Survives restarts and works across
// serverless instances. getSupabase() is called inside the methods, never at import, so this
// module loads harmlessly in memory mode (the provider switch imports it unconditionally).

const TABLE = "sessions";
const MAX_SESSION_ID_INSERT_ATTEMPTS = 5;

type SessionRow = {
  session_id: string;
  user_id: string;
  figure_key: string;
  stage_id: string;
  story_artifact_id: string | null;
  framing: string;
  opening_copy: unknown;
  age: number | null;
  feeling: string | null;
  story_request_context: unknown | null;
  disclosure_expires_at: string;
  alternate_of_session_id: string | null;
  match_recipe: unknown;
  next_beat_index: number;
  next_chunk_index: number;
  created_at: string;
  updated_at: string;
};

async function createSession(input: CreateSessionInput): Promise<string> {
  for (let attempt = 0; attempt < MAX_SESSION_ID_INSERT_ATTEMPTS; attempt += 1) {
    const sessionId = randomBytes(16).toString("hex");
    const common = {
      p_session_id: sessionId,
      p_user_id: input.userId,
      p_figure_key: input.figureKey,
      p_stage_id: input.stageId,
      p_framing: input.framing,
      p_age: input.age,
      p_feeling: input.feeling,
      p_story_request_context: input.storyRequestContext,
      p_match_recipe: input.matchRecipe,
      p_artifact: input.artifact,
    };
    const { data, error } = input.telemetryFlowId
      ? await getSupabase().rpc("create_story_session_v3", {
          ...common,
          p_telemetry_flow_id: input.telemetryFlowId,
        })
      : await getSupabase().rpc("create_story_session_v2", common);
    if (error) {
      if (!input.telemetryFlowId && error.code === "23505") continue;
      throw new Error(`createSession insert failed: ${error.message}`);
    }

    if (!input.telemetryFlowId) return sessionId;

    const result = asRecord(data);
    if (result?.status === "conflict") {
      throw new TelemetryFlowConflictError();
    }
    if (
      (result?.status === "created" || result?.status === "existing") &&
      isSessionId(result.sessionId)
    ) {
      if (result.status === "created" && result.sessionId !== sessionId) {
        throw new Error("createSession returned an invalid created session");
      }
      return result.sessionId;
    }
    if (
      result?.status === "flow_not_found" ||
      result?.status === "unclaimed" ||
      result?.status === "revoked" ||
      result?.status === "expired"
    ) {
      throw new TelemetryFlowConflictError(
        `createSession flow failed: ${result.status}`,
      );
    }
    if (result?.status !== "collision") {
      throw new Error("createSession returned an invalid disposition");
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

// Atomic compare-and-set for reader progress. The expected-position predicates
// are part of the UPDATE, so concurrent tabs cannot both advance from the same
// passage. A follow-up owner-scoped read classifies idempotent retries without
// exposing whether a foreign session exists.
async function acknowledgePosition(
  input: AcknowledgeSessionPositionInput,
): Promise<AcknowledgeSessionPositionResult> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({
      next_beat_index: input.nextBeatIndex,
      next_chunk_index: input.nextChunkIndex,
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", input.sessionId)
    .eq("user_id", input.userId)
    .eq("next_beat_index", input.expectedBeatIndex)
    .eq("next_chunk_index", input.expectedChunkIndex)
    .select("session_id")
    .maybeSingle();

  if (error) throw new Error(`acknowledgePosition failed: ${error.message}`);
  if (data) return "advanced";

  const current = await getSession(input.sessionId);
  if (!current || current.userId !== input.userId) return "not_found";
  if (
    current.nextBeatIndex === input.nextBeatIndex &&
    current.nextChunkIndex === input.nextChunkIndex
  ) {
    return "already_advanced";
  }
  return "conflict";
}

async function listSessionsByUser(userId: string): Promise<Session[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`listSessionsByUser failed: ${error.message}`);
  return ((data ?? []) as SessionRow[]).map(rowToSession);
}

async function sessionCount(): Promise<number> {
  const { count, error } = await getSupabase()
    .from(TABLE)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`_sessionCount failed: ${error.message}`);
  return count ?? 0;
}

function rowToSession(row: SessionRow): Session {
  const storyRequestContext =
    row.story_request_context === null
      ? null
      : parseStoryRequestContext(row.story_request_context);
  // Optional recovery context fails closed without making the immutable story
  // unreadable when a row is malformed or uses an unsupported future version.
  return {
    sessionId: row.session_id,
    userId: row.user_id,
    figureKey: row.figure_key,
    stageId: row.stage_id,
    storyArtifactId: row.story_artifact_id,
    framing: row.framing === "definitive" ? "definitive" : "partial",
    openingCopy: normalizeOpeningCopy(row.opening_copy),
    age: row.age,
    feeling: row.feeling,
    storyRequestContext,
    disclosureExpiresAt: parseTimestamp(row.disclosure_expires_at),
    alternateOfSessionId: row.alternate_of_session_id,
    matchRecipe: row.match_recipe as MatchRecipe,
    nextBeatIndex: row.next_beat_index,
    nextChunkIndex: row.next_chunk_index,
    // Session timestamps stay numbers — map timestamptz back so the ISO string never leaks
    // into TTL/component code that assumes a number.
    createdAt: parseTimestamp(row.created_at),
    updatedAt: parseTimestamp(row.updated_at),
  };
}

function parseTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isSessionId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{32}$/.test(value);
}

export const supabaseSessionStore: SessionStore = {
  createSession,
  getSession,
  acknowledgePosition,
  listSessionsByUser,
  _sessionCount: sessionCount,
};
