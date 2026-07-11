import "server-only";
import { randomBytes } from "node:crypto";
import { getSupabase } from "./db";
import type { HistoricalConcernReason } from "./story-transparency-types";

export type SupabaseHistoricalConcernInput = {
  userId: string;
  sessionId: string;
  artifactId: string;
  factId: string;
  reason: HistoricalConcernReason;
};

export async function submitSupabaseHistoricalConcern(
  input: SupabaseHistoricalConcernInput,
): Promise<void> {
  const { data, error } = await getSupabase().rpc(
    "submit_historical_concern",
    {
      p_report_id: randomBytes(16).toString("hex"),
      p_user_id: input.userId,
      p_session_id: input.sessionId,
      p_artifact_id: input.artifactId,
      p_fact_id: input.factId,
      p_reason: input.reason,
    },
  );
  if (error) {
    throw new Error(`historical concern insert failed: ${error.message}`);
  }
  if (typeof data !== "string" || !/^[0-9a-f]{32}$/.test(data)) {
    throw new Error("historical concern target was rejected");
  }
}
