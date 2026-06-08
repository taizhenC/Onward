import "./_smoke-bootstrap";
import { isDeepStrictEqual } from "node:util";
import { loadEnvLocal } from "./_load-env";
import { FIGURE_STAGES } from "../lib/figures-data";
import { _resetFigureCache, listAll } from "../lib/figures";
import { getSupabase } from "../lib/db";
import { handleIntake } from "../lib/intake";
import { _sessionCount } from "../lib/session";
import type { FigureStageRow } from "../lib/types";

// Supabase-mode acceptance check. Run AFTER `npm run seed`, as a SEPARATE process so the
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
    if (dbStages.length !== FIGURE_STAGES.length) {
      return {
        name,
        ok: false,
        detail: `served ${dbStages.length} stage(s), authored ${FIGURE_STAGES.length}`,
      };
    }
    const dbSorted = sortByKey(dbStages);
    const authoredSorted = sortByKey(FIGURE_STAGES);
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

// Gate 3 — a crisis intake writes no session row (handleIntake returns before createSession).
async function checkCrisisPersistsNothing(): Promise<Step> {
  const name = "crisis persists nothing";
  try {
    const before = await _sessionCount();
    const result = await handleIntake({
      age: 22,
      feeling: "I want to kill myself",
    });
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
