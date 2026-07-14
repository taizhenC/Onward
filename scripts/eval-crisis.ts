import "./_smoke-bootstrap";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { classifyCrisis, CRISIS_RESOURCES, crisisRegexVersion } from "../lib/safety";

type Expectation = "critical_positive" | "context_review" | "negative";
type CrisisCase = { id: string; text: string; expect: Expectation };
type CrisisCorpus = { version: string; cases: CrisisCase[] };

async function main(): Promise<void> {
  const path = resolve(process.cwd(), "evals/crisis.json");
  const corpus = JSON.parse(await readFile(path, "utf8")) as CrisisCorpus;
  validateCorpus(corpus);

  let criticalTotal = 0;
  let criticalDetected = 0;
  const criticalMisses: string[] = [];
  const overTriggers: string[] = [];

  for (const testCase of corpus.cases) {
    const detected = classifyCrisis(testCase.text).crisisDetected;
    if (testCase.expect === "critical_positive") {
      criticalTotal += 1;
      if (detected) criticalDetected += 1;
      else criticalMisses.push(testCase.id);
    } else if (detected) {
      overTriggers.push(testCase.id);
    }
  }

  validateResources();

  console.log("Onward crisis safety regression");
  console.log("================================");
  console.log(`corpus=${corpus.version}`);
  console.log(`regex=${crisisRegexVersion}`);
  console.log(`critical=${criticalDetected}/${criticalTotal}`);
  console.log(`context/negative triggers=${overTriggers.length}`);
  if (overTriggers.length > 0) {
    console.log(`review-only ids=${overTriggers.join(",")}`);
  }
  console.log(`resources=${CRISIS_RESOURCES.length}`);

  if (criticalMisses.length > 0) {
    console.error(`CRITICAL FALSE NEGATIVES: ${criticalMisses.join(",")}`);
    process.exit(1);
  }
  console.log("Safety gate passed: zero critical false negatives.");
}

function validateCorpus(corpus: CrisisCorpus): void {
  if (!corpus.version || !Array.isArray(corpus.cases) || corpus.cases.length === 0) {
    throw new Error("Crisis corpus is empty or invalid.");
  }
  const ids = new Set<string>();
  for (const testCase of corpus.cases) {
    if (!testCase.id || !testCase.text || !testCase.expect) {
      throw new Error("Every crisis case requires id, text, and expect.");
    }
    if (ids.has(testCase.id)) throw new Error(`Duplicate crisis case id: ${testCase.id}`);
    ids.add(testCase.id);
  }
}

function validateResources(): void {
  const ids = new Set<string>();
  for (const resource of CRISIS_RESOURCES) {
    if (ids.has(resource.id)) throw new Error(`Duplicate crisis resource: ${resource.id}`);
    ids.add(resource.id);
    if (
      !resource.region.trim() ||
      !resource.label.trim() ||
      !resource.action.trim() ||
      !resource.href.startsWith("https://")
    ) {
      throw new Error(`Invalid crisis resource: ${resource.id}`);
    }
  }
}

void main();
