import "./_smoke-bootstrap";
import { loadEnvLocal } from "./_load-env";
import { FIGURE_STAGES } from "../lib/figures-data";
import { pickFigure, RerankError, writeOpeningCopy } from "../lib/llm";
import { NEUTRAL_EYEBROW } from "../lib/opening-copy";

// Real-mode provider health check. Run BEFORE a full eval or real-mode intake smoke so a
// broken Cerebras config (bad key, wrong model id, JSON mode unsupported) surfaces in seconds,
// not mid-run.
//
// Standalone by design: loads no gold set, writes no run dumps. Three probes:
//   1. GET /models — auth + reachability + the configured rerank AND prose model ids
//      are actually offered.
//   2. one minimal pickFigure — rerank model + reasoning_effort + JSON mode end-to-end.
//   3. one writeOpeningCopy — the prose eyebrow path end-to-end. That path never
//      throws (it degrades to a neutral fallback), so a neutral result is the only
//      failure signal available here — we treat it as a failed probe.
//
// Privacy floor (same as lib/llm-real.ts): never print prompt/response bodies,
// resonance/gap, or raw provider errors. The probe feeling is synthetic, not a user
// disclosure, but the discipline stays consistent.

// Pin the provider to real. getLLM() resolves lazily on the first pickFigure call, so
// setting this at module-eval time (after hoisted imports, before main) is sufficient —
// the same pattern scripts/smoke.ts uses to pin stub.
process.env.LLM_PROVIDER = "real";

// Mirror lib/llm-real.ts's env resolution + defaults so the /models probe checks the
// SAME model id that pickFigureReal will call. Keep these in sync with lib/llm-real.ts.
const DEFAULT_BASE_URL = "https://api.cerebras.ai/v1";
const DEFAULT_MODEL = "gpt-oss-120b";
const DEFAULT_PROSE_MODEL = "gpt-oss-120b";
const HEALTH_TIMEOUT_MS = 8000;

function baseUrl(): string {
  const configured =
    process.env.LLM_BASE_URL?.trim() ??
    process.env.CEREBRAS_BASE_URL?.trim() ??
    process.env.GROQ_BASE_URL?.trim();
  if (!configured) return DEFAULT_BASE_URL;
  return configured.replace(/\/+$/, "") || DEFAULT_BASE_URL;
}
function apiKey(): string | undefined {
  return (
    process.env.LLM_API_KEY ??
    process.env.CEREBRAS_API_KEY ??
    process.env.GROQ_API_KEY
  );
}
function model(): string {
  return process.env.LLM_MODEL_RERANK ?? DEFAULT_MODEL;
}
function proseModel(): string {
  return process.env.LLM_MODEL_PROSE ?? DEFAULT_PROSE_MODEL;
}

type Step = { name: string; ok: boolean; detail: string };

async function checkModelsEndpoint(apiKey: string): Promise<Step> {
  const name = "Cerebras /models reachable + configured models available";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  const start = performance.now();

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/models`, {
      headers: { authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
  } catch {
    const detail = controller.signal.aborted
      ? `timed out after ${HEALTH_TIMEOUT_MS}ms`
      : "request failed (network/DNS)";
    return { name, ok: false, detail };
  } finally {
    clearTimeout(timer);
  }

  const ms = Math.round(performance.now() - start);
  if (!response.ok) {
    return { name, ok: false, detail: `HTTP ${response.status} (${ms}ms)` };
  }

  let ids: string[] = [];
  try {
    const envelope = (await response.json()) as {
      data?: Array<{ id?: string }>;
    };
    ids = (envelope.data ?? [])
      .map((entry) => entry.id)
      .filter((id): id is string => typeof id === "string");
  } catch {
    return { name, ok: false, detail: `response was not valid JSON (${ms}ms)` };
  }

  const wanted = [model(), proseModel()];
  const missing = wanted.filter((id) => !ids.includes(id));
  if (missing.length > 0) {
    return {
      name,
      ok: false,
      detail: `model(s) ${missing
        .map((id) => `"${id}"`)
        .join(", ")} not among ${ids.length} available models (${ms}ms)`,
    };
  }
  return {
    name,
    ok: true,
    detail: `rerank "${model()}" + prose "${proseModel()}" available among ${ids.length} models (${ms}ms)`,
  };
}

async function checkPickFigure(): Promise<Step> {
  const name = "pickFigure end-to-end (auth + model + JSON mode)";
  const pool = FIGURE_STAGES.slice(0, 2);
  if (pool.length === 0) {
    return { name, ok: false, detail: "no figures in library to probe with" };
  }

  const start = performance.now();
  try {
    const pick = await pickFigure({
      age: 30,
      // Synthetic probe — NOT a real user disclosure.
      feeling:
        "I am running a health check to confirm the matching service responds.",
      candidates: pool,
    });
    const ms = Math.round(performance.now() - start);

    const inPool = pool.some(
      (s) => s.figureKey === pick.figureKey && s.stageId === pick.stageId,
    );
    if (!inPool) {
      return {
        name,
        ok: false,
        detail: `model returned an out-of-pool pick ${pick.figureKey}/${pick.stageId} (${ms}ms)`,
      };
    }

    // resonance/gap deliberately not printed (privacy floor). confidence is a coarse enum.
    return {
      name,
      ok: true,
      detail: `picked ${pick.figureKey}/${pick.stageId}, confidence=${pick.confidence} (${ms}ms)`,
    };
  } catch (error) {
    const ms = Math.round(performance.now() - start);
    const reason = error instanceof RerankError ? error.reason : "unknown";
    return { name, ok: false, detail: `rerank failed: ${reason} (${ms}ms)` };
  }
}

async function checkOpeningCopy(): Promise<Step> {
  const name = "writeOpeningCopy end-to-end (prose model + eyebrow guard)";
  const stages = FIGURE_STAGES;
  const stage =
    stages.find((candidate) => candidate.figureKey === "butler") ?? stages[0];
  if (!stage) {
    return { name, ok: false, detail: "no figures in library to probe with" };
  }

  const start = performance.now();
  try {
    const { eyebrow } = await writeOpeningCopy({
      // Synthetic probe — NOT a real user disclosure.
      feeling: "I keep working at something and it never seems to get better.",
      stage,
    });
    const ms = Math.round(performance.now() - start);

    // writeOpeningCopy never throws; on any failure (no key, timeout, HTTP error, bad
    // output, guard rejection) it returns the neutral fallback. So a neutral result is
    // the only failure signal available here — treat it as a failed probe.
    if (eyebrow === NEUTRAL_EYEBROW) {
      return {
        name,
        ok: false,
        detail: `returned the neutral fallback — the real prose call failed or its output was guard-rejected; re-run or check LLM_MODEL_PROSE (${ms}ms)`,
      };
    }

    // The eyebrow was generated from a synthetic probe, so printing it is safe and lets
    // the operator eyeball tone before the manual intake smoke.
    return { name, ok: true, detail: `generated eyebrow="${eyebrow}" (${ms}ms)` };
  } catch {
    const ms = Math.round(performance.now() - start);
    return {
      name,
      ok: false,
      detail: `writeOpeningCopy threw unexpectedly (it should degrade, not throw) (${ms}ms)`,
    };
  }
}

async function main(): Promise<void> {
  console.log("Onward provider health check (real mode)");
  console.log("========================================");
  console.log("");

  const env = loadEnvLocal();
  console.log(
    env.found
      ? `Loaded ${env.loaded} var(s) from .env.local`
      : "No .env.local found; using shell environment",
  );

  const key = apiKey();
  if (!key) {
    console.log("");
    console.log(
      "FAIL  CEREBRAS_API_KEY or LLM_API_KEY is not set (.env.local or shell).",
    );
    console.log("Set CEREBRAS_API_KEY before running npm run eval.");
    process.exit(1);
  }

  const steps: Step[] = [];
  steps.push(await checkModelsEndpoint(key));
  // Only probe the completions if the endpoint/model check passed — otherwise the failure
  // is already explained and further timeouts just add noise.
  if (steps[0].ok) {
    steps.push(await checkPickFigure());
    steps.push(await checkOpeningCopy());
  }

  console.log("");
  let failed = 0;
  steps.forEach((step, index) => {
    const tag = step.ok ? "OK  " : "FAIL";
    console.log(`[${index + 1}/${steps.length}] ${tag}  ${step.name}`);
    console.log(`         ${step.detail}`);
    if (!step.ok) failed += 1;
  });

  console.log("");
  if (failed === 0 && steps.length === 3) {
    console.log("Provider healthy. Safe to run npm run eval and real-mode intake smoke.");
    process.exit(0);
  }
  console.log("Provider health check failed. Fix the above before relying on real provider paths.");
  process.exit(1);
}

void main();
