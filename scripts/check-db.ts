import "./_smoke-bootstrap";
import { isDeepStrictEqual } from "node:util";
import { loadEnvLocal } from "./_load-env";
import { FIGURE_STAGES } from "../lib/figures-data";
import { _resetFigureCache, listAll } from "../lib/figures";
import { getSupabase } from "../lib/db";
import { handleIntake } from "../lib/intake";
import { _sessionCount } from "../lib/session";
import type { FigureStageRow } from "../lib/types";
import {
  listPublishedStorySpecKeys,
  storySpecStageKey,
} from "../lib/story-spec-repository";

// Supabase-mode release check. Run after migrations, seeding, and publishing the launch
// subset, as a SEPARATE process so the
// load-once figure cache reflects current DB state. Pins PERSISTENCE=supabase so it exercises
// the real DB paths (figure serving + session store); LLM stays stub (the crisis probe returns
// before any match/LLM call, so no LLM provider key is needed).
process.env.PERSISTENCE = "supabase";
process.env.LLM_PROVIDER = "stub";

type Step = { name: string; ok: boolean; detail: string };

async function tableCount(table: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`count(${table}) failed: ${error.message}`);
  return count ?? 0;
}

// Gate 1 — the library is seeded.
async function checkSeeded(): Promise<Step> {
  const name = "library seeded (figures + figure_stages)";
  try {
    const figures = await tableCount("figures");
    const stages = await tableCount("figure_stages");
    const expectedFigures = new Set(FIGURE_STAGES.map((s) => s.figureKey)).size;
    const ok = figures >= expectedFigures && stages >= FIGURE_STAGES.length;
    return {
      name,
      ok,
      detail: ok
        ? `figures=${figures}, figure_stages=${stages}`
        : `figures=${figures} (expected ≥${expectedFigures}), figure_stages=${stages} (expected ≥${FIGURE_STAGES.length}) — run \`npm run seed\``,
    };
  } catch (error) {
    return { name, ok: false, detail: message(error) };
  }
}

// Gate 2 — figures served from the DB are byte-identical to the authored library.
async function checkServingParity(): Promise<Step> {
  const name = "figures served from DB == authored library";
  try {
    _resetFigureCache(); // separate process from seed, but reset anyway so the cache can't lie.
    const dbStages = await listAll();
    const statusResult = await getSupabase()
      .from("figure_stages")
      .select("figure_key,stage_id")
      .eq("status", "published");
    if (statusResult.error) throw new Error(statusResult.error.message);
    const publishedKeys = new Set(
      (statusResult.data ?? []).map((row) =>
        storySpecStageKey(row.figure_key, row.stage_id),
      ),
    );
    const expectedStages = FIGURE_STAGES.filter((stage) =>
      publishedKeys.has(storySpecStageKey(stage.figureKey, stage.stageId)),
    );
    if (dbStages.length !== expectedStages.length) {
      return {
        name,
        ok: false,
        detail: `served ${dbStages.length} stage(s), expected ${expectedStages.length} published authored stage(s)`,
      };
    }
    const dbSorted = sortByKey(dbStages);
    const authoredSorted = sortByKey(expectedStages);
    for (let i = 0; i < authoredSorted.length; i += 1) {
      if (!isDeepStrictEqual(dbSorted[i], authoredSorted[i])) {
        return {
          name,
          ok: false,
          detail: `mismatch at ${authoredSorted[i].figureKey}/${authoredSorted[i].stageId} — check seed mapping / jsonb fidelity`,
        };
      }
    }
    return { name, ok: true, detail: `${dbStages.length} stage(s) deep-equal the const` };
  } catch (error) {
    return { name, ok: false, detail: message(error) };
  }
}

async function checkPublishedStorySpecs(): Promise<Step> {
  const name = "public stages have valid published StorySpecs";
  try {
    const keys = await listPublishedStorySpecKeys();
    const served = await listAll();
    const servedKeys = new Set(
      served.map((stage) => storySpecStageKey(stage.figureKey, stage.stageId)),
    );
    const missing = [...keys].filter((key) => !servedKeys.has(key));
    const ok = keys.size > 0 && missing.length === 0;
    return {
      name,
      ok,
      detail: ok
        ? `${keys.size} valid published StorySpec(s) eligible for matching`
        : keys.size === 0
          ? "no valid published StorySpecs; review and publish the launch subset"
          : `${missing.length} published StorySpec stage(s) are disabled/missing`,
    };
  } catch (error) {
    return { name, ok: false, detail: message(error) };
  }
}

async function checkArtifactSchema(): Promise<Step> {
  const name = "StoryArtifact schema installed";
  try {
    const artifacts = await tableCount("story_artifacts");
    const sessions = await getSupabase()
      .from("sessions")
      .select("story_artifact_id")
      .limit(1);
    if (sessions.error) throw new Error(sessions.error.message);
    return {
      name,
      ok: true,
      detail: `story_artifacts reachable (${artifacts} row(s)); session pointer present`,
    };
  } catch (error) {
    return { name, ok: false, detail: `${message(error)} — apply migration 0005` };
  }
}

async function checkMatchRecoverySchema(): Promise<Step> {
  const name = "single-use match recovery schema installed";
  try {
    const flows = await tableCount("match_recovery_flows");
    const probe = await getSupabase().rpc("consume_match_recovery_flow", {
      p_token_hash: "0".repeat(64),
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_input_hash: "0".repeat(64),
    });
    if (probe.error) throw new Error(probe.error.message);
    const ok = probe.data === null;
    return {
      name,
      ok,
      detail: ok
        ? `table/RPC reachable (${flows} active or recently consumed row(s))`
        : "consume RPC accepted a nonexistent recovery flow",
    };
  } catch (error) {
    return { name, ok: false, detail: `${message(error)} 鈥?apply migration 0006` };
  }
}

async function checkHistoricalConcernSchema(): Promise<Step> {
  const name = "privacy-safe historical concern queue installed";
  try {
    const reports = await tableCount("historical_concern_reports");
    const probe = await getSupabase().rpc("submit_historical_concern", {
      p_report_id: "0".repeat(32),
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_session_id: "0".repeat(32),
      p_artifact_id: "0".repeat(32),
      p_fact_id: "fact-probe",
      p_reason: "incorrect_fact",
    });
    if (probe.error) throw new Error(probe.error.message);
    const ok = probe.data === null;
    return {
      name,
      ok,
      detail: ok
        ? `queue/RPC reachable (${reports} bounded report row(s))`
        : "submission RPC accepted a nonexistent owned artifact",
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: `${message(error)} — apply migration 0007`,
    };
  }
}

async function checkStoryFeedbackSchema(): Promise<Step> {
  const name = "bounded story feedback schema installed";
  try {
    const feedback = await tableCount("story_feedback");
    const probe = await getSupabase().rpc("submit_story_feedback", {
      p_feedback_id: "0".repeat(32),
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_session_id: "0".repeat(32),
      p_artifact_id: "0".repeat(32),
      p_policy_version: "resonance-feedback-v1-2026-07",
      p_verdict: "felt_close",
      p_reason: null,
    });
    if (probe.error) throw new Error(probe.error.message);
    const ok = probe.data === "not_found";
    return {
      name,
      ok,
      detail: ok
        ? `table/RPC reachable (${feedback} bounded row(s))`
        : "feedback RPC accepted a nonexistent owned story",
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: `${message(error)} — apply migration 0008`,
    };
  }
}

async function checkAlternateStorySchema(): Promise<Step> {
  const name = "one-use alternate story schema installed";
  try {
    const flows = await tableCount("alternate_story_flows");
    const sessions = await getSupabase()
      .from("sessions")
      .select(
        "story_request_context,disclosure_expires_at,alternate_of_session_id",
      )
      .limit(1);
    if (sessions.error) throw new Error(sessions.error.message);
    const probe = await getSupabase().rpc("issue_alternate_story_flow", {
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_source_session_id: "0".repeat(32),
      p_source_artifact_id: "0".repeat(32),
      p_token_hash: "0".repeat(64),
      p_policy_version: "alternate-story-v1-2026-07",
      p_allow_create: false,
    });
    if (probe.error) throw new Error(probe.error.message);
    const data = probe.data as { status?: unknown } | null;
    const ok = data?.status === "not_found";
    return {
      name,
      ok,
      detail: ok
        ? `context columns and flow RPC reachable (${flows} bounded row(s))`
        : "alternate issue RPC accepted a nonexistent owned story",
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: `${message(error)} - apply migration 0009`,
    };
  }
}

// Gate 3 — a crisis intake writes no session row (handleIntake returns before createSession).
// The fixed ctx is safe in supabase mode: crisis short-circuits before the rate limiter and
// the store, so this non-uuid user id never reaches Postgres.
async function checkCrisisPersistsNothing(): Promise<Step> {
  const name = "crisis persists nothing";
  try {
    const before = await _sessionCount();
    const result = await handleIntake(
      {
        age: 22,
        feeling: "I want to kill myself",
      },
      { userId: "check-db", ipHash: "check-db" },
    );
    const after = await _sessionCount();

    const isCrisis = "crisis" in result && result.crisis === true;
    const ok = isCrisis && after === before;
    return {
      name,
      ok,
      detail: ok
        ? `crisis response, sessions unchanged (${after})`
        : `isCrisis=${isCrisis}, sessions ${before}→${after} (must be equal)`,
    };
  } catch (error) {
    return { name, ok: false, detail: message(error) };
  }
}

function sortByKey(stages: FigureStageRow[]): FigureStageRow[] {
  return [...stages].sort((a, b) =>
    `${a.figureKey}:${a.stageId}`.localeCompare(`${b.figureKey}:${b.stageId}`),
  );
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function main(): Promise<void> {
  console.log("Onward Supabase check (PERSISTENCE=supabase)");
  console.log("============================================");
  console.log("");

  const env = loadEnvLocal();
  console.log(
    env.found
      ? `Loaded ${env.loaded} var(s) from .env.local`
      : "No .env.local found; using shell environment",
  );

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("");
    console.log("FAIL  Supabase env missing (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).");
    process.exit(1);
  }

  const steps = [
    await checkSeeded(),
    await checkServingParity(),
    await checkPublishedStorySpecs(),
    await checkArtifactSchema(),
    await checkMatchRecoverySchema(),
    await checkHistoricalConcernSchema(),
    await checkStoryFeedbackSchema(),
    await checkAlternateStorySchema(),
    await checkCrisisPersistsNothing(),
  ];

  console.log("");
  let failed = 0;
  steps.forEach((step, index) => {
    const tag = step.ok ? "OK  " : "FAIL";
    console.log(`[${index + 1}/${steps.length}] ${tag}  ${step.name}`);
    console.log(`         ${step.detail}`);
    if (!step.ok) failed += 1;
  });

  console.log("");
  if (failed === 0) {
    console.log("Supabase foundation healthy. Sessions persist; figures served from DB.");
    process.exit(0);
  }
  console.log(`${failed} check(s) failed. Fix the above before relying on PERSISTENCE=supabase.`);
  process.exit(1);
}

main().catch((error) => {
  console.error(message(error));
  process.exit(1);
});
