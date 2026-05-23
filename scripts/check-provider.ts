import "./_smoke-bootstrap";
import { loadEnvLocal } from "./_load-env";
import { listAll } from "../lib/figures";
import { pickFigure, RerankError } from "../lib/llm";

// Real-mode provider health check. Run BEFORE a full eval so a broken Groq config
// (bad key, wrong model id, JSON mode unsupported) surfaces in seconds, not mid-run.
//
// Standalone by design: loads no gold set, writes no run dumps. Two probes:
//   1. GET /models — auth + reachability + the configured model id is actually offered.
//   2. one minimal pickFigure — model id + reasoning_effort + JSON mode work end-to-end.
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
const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const HEALTH_TIMEOUT_MS = 8000;

function baseUrl(): string {
  const configured = process.env.GROQ_BASE_URL?.trim();
  if (!configured) return DEFAULT_BASE_URL;
  return configured.replace(/\/+$/, "") || DEFAULT_BASE_URL;
}
function model(): string {
  return process.env.LLM_MODEL_RERANK ?? DEFAULT_MODEL;
}

type Step = { name: string; ok: boolean; detail: string };

async function checkModelsEndpoint(apiKey: string): Promise<Step> {
  const name = "Groq /models reachable + configured model available";
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

  const wanted = model();
  if (!ids.includes(wanted)) {
    return {
      name,
      ok: false,
      detail: `model "${wanted}" not among ${ids.length} available models (${ms}ms)`,
    };
  }
  return {
    name,
    ok: true,
    detail: `model "${wanted}" available among ${ids.length} models (${ms}ms)`,
  };
}

async function checkPickFigure(): Promise<Step> {
  const name = "pickFigure end-to-end (auth + model + JSON mode)";
  const pool = listAll().slice(0, 2);
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log("");
    console.log("FAIL  GROQ_API_KEY is not set (.env.local or shell).");
    console.log("Set GROQ_API_KEY before running npm run eval.");
    process.exit(1);
  }

  const steps: Step[] = [];
  steps.push(await checkModelsEndpoint(apiKey));
  // Only probe the completion if the endpoint/model check passed — otherwise the failure
  // is already explained and a second timeout just adds noise.
  if (steps[0].ok) {
    steps.push(await checkPickFigure());
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
  if (failed === 0 && steps.length === 2) {
    console.log("Provider healthy. Safe to run npm run eval.");
    process.exit(0);
  }
  console.log("Provider health check failed. Fix the above before running the eval.");
  process.exit(1);
}

void main();
