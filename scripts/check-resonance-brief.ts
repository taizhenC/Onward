import "./_smoke-bootstrap";
import { FIGURE_STAGES } from "../lib/figures-data";
import { NEUTRAL_EYEBROW, toEyebrowSurface } from "../lib/opening-copy";
import { writeOpeningCopyReal } from "../lib/llm-real";
import {
  PRIMARY_PRESSURES,
  RESONANCE_BRIEF_SENSITIVITY,
  RESONANCE_BRIEF_VERSION,
  containsResonanceEcho,
  createResonanceBrief,
  toResonancePromptSurface,
  validateResonanceBrief,
  type PrimaryPressure,
  type ResonanceBrief,
} from "../lib/resonance-brief";

const PRIVATE_DISCLOSURE =
  'After Priya moved me from Boston in 2024, my "cobalt compass" stopped pointing anywhere and I felt rejected.';

async function main(): Promise<void> {
  const failures: string[] = [];
  checkClassification(failures);
  checkClosedContract(failures);
  checkFingerprintGuard(failures);
  await checkProviderBoundary(failures);

  console.log("Onward ResonanceBrief validator");
  console.log("================================");
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`${failures.length} ResonanceBrief contract failure(s).`);
    process.exit(1);
  }
  console.log(`PASS ${PRIMARY_PRESSURES.length}/9 closed primary-pressure projections`);
  console.log("PASS strict, deeply frozen sensitive-derived contract");
  console.log("PASS HMAC echo and named-detail guard without raw-text retention");
  console.log("PASS prose provider receives only the bounded prompt projection");
}

function checkClassification(failures: string[]): void {
  const fixtures: Array<[PrimaryPressure, string]> = [
    ["loss", "I am grieving after someone close to me died."],
    ["rejection", "I was rejected again and feel overlooked."],
    ["isolation", "I am lonely and feel like an outsider."],
    ["identity", "This feels like the wrong life and I do not know myself."],
    ["blocked_agency", "I feel trapped, powerless, and cannot leave."],
    ["shame", "I am ashamed and keep thinking I am not good enough."],
    ["uncertainty", "I am uncertain and do not know what comes next."],
    ["exhaustion", "I am exhausted, drained, and burned out."],
    ["other", "Everything has become unusually difficult to carry."],
  ];
  for (const [expected, disclosure] of fixtures) {
    const brief = createResonanceBrief(disclosure);
    if (brief.primaryPressure !== expected) {
      failures.push(`${expected} classified as ${brief.primaryPressure}`);
    }
  }

  if (
    createResonanceBrief("I am exhausted by this.", {
      maxIntensity: "gentle",
      excludedFlags: [],
    }).desiredDistance !== "gentle" ||
    createResonanceBrief("I am exhausted by this.", {
      maxIntensity: "direct",
      excludedFlags: [],
    }).desiredDistance !== "direct" ||
    createResonanceBrief("I am exhausted by this.", {
      maxIntensity: "moderate",
      excludedFlags: [],
    }).desiredDistance !== "unspecified"
  ) {
    failures.push("story-boundary intensity did not map to bounded desired distance");
  }
}

function checkClosedContract(failures: string[]): void {
  const brief = createResonanceBrief(PRIVATE_DISCLOSURE);
  // Elide the keyed HMAC digests before scanning for retained text. "2024" is
  // four hex characters, so a random digest contains it in ~1.6% of processes
  // (the key is ephemeral per process) and would trip a false privacy alarm.
  // Only exactly-64-char hex runs are elided, and validateResonanceBrief below
  // proves every digest field has that shape — so no retained disclosure can
  // hide in the elided span.
  const serialized = JSON.stringify(brief).replace(/[0-9a-f]{64}/gi, "<digest>");
  const forbiddenRawValues = [
    PRIVATE_DISCLOSURE,
    "Priya",
    "Boston",
    "2024",
    "cobalt compass",
  ];
  if (forbiddenRawValues.some((value) => serialized.toLowerCase().includes(value.toLowerCase()))) {
    failures.push("brief retained raw disclosure or a named detail");
  }
  if (
    brief.version !== RESONANCE_BRIEF_VERSION ||
    brief.sensitivity !== RESONANCE_BRIEF_SENSITIVITY ||
    !validateResonanceBrief(brief) ||
    !Object.isFrozen(brief) ||
    !Object.isFrozen(brief.anchors) ||
    !Object.isFrozen(brief.anchors[0]) ||
    !Object.isFrozen(brief.forbiddenEchoHashes)
  ) {
    failures.push("brief version, sensitivity, validation, or deep freezing failed");
  }

  const promptSurface = toResonancePromptSurface(brief);
  const promptJson = JSON.stringify(promptSurface);
  if (
    "anchors" in promptSurface ||
    "forbiddenEchoHashes" in promptSurface ||
    "sensitivity" in promptSurface ||
    brief.forbiddenEchoHashes.some((hash) => promptJson.includes(hash))
  ) {
    failures.push("prompt projection exposed provenance or echo fingerprints");
  }

  const malformed = structuredClone(brief) as ResonanceBrief;
  (malformed as { primaryPressure: string }).primaryPressure = "diagnosis";
  if (validateResonanceBrief(malformed)) {
    failures.push("validator accepted an open-ended or diagnostic pressure");
  }
  const extraField = {
    ...structuredClone(brief),
    rawDisclosure: PRIVATE_DISCLOSURE,
  };
  if (validateResonanceBrief(extraField)) {
    failures.push("validator accepted an undeclared field on the sensitive contract");
  }
  if (!validateResonanceBrief(createResonanceBrief(".........."))) {
    failures.push("punctuation-only but length-valid intake broke brief construction");
  }
}

function checkFingerprintGuard(failures: string[]): void {
  const brief = createResonanceBrief(PRIVATE_DISCLOSURE);
  const copiedWindow = "my cobalt compass stopped pointing anywhere and i";
  const unsafe = [PRIVATE_DISCLOSURE, copiedWindow, "Priya", "Boston", "2024"];
  for (const candidate of unsafe) {
    if (!containsResonanceEcho(candidate, brief)) {
      failures.push(`fingerprint guard missed protected text: ${candidate}`);
    }
  }
  if (containsResonanceEcho("A closed door after a long effort", brief)) {
    failures.push("fingerprint guard rejected unrelated bounded copy");
  }
  const sentenceStarter = createResonanceBrief("This feels unusually difficult.");
  if (containsResonanceEcho("This story may sit beside you.", sentenceStarter)) {
    failures.push("ordinary capitalized sentence starter was treated as a named detail");
  }
  const unicodeDisclosure = "J'ai quitté Montréal et je ne sais plus où aller.";
  if (
    !containsResonanceEcho(
      unicodeDisclosure,
      createResonanceBrief(unicodeDisclosure),
    )
  ) {
    failures.push("Unicode disclosure echo was not fingerprinted");
  }
}

async function checkProviderBoundary(failures: string[]): Promise<void> {
  const stage = FIGURE_STAGES.find((candidate) => candidate.figureKey === "butler");
  if (!stage) {
    failures.push("provider-boundary fixture stage is missing");
    return;
  }
  const brief = createResonanceBrief(PRIVATE_DISCLOSURE);
  const surface = toEyebrowSurface({ resonanceBrief: brief, stage });
  const surfaceJson = JSON.stringify(surface);
  if (
    surfaceJson.includes("Priya") ||
    surfaceJson.includes("Boston") ||
    surfaceJson.includes("2024") ||
    brief.forbiddenEchoHashes.some((hash) => surfaceJson.includes(hash))
  ) {
    failures.push("eyebrow surface retained raw details or echo hashes");
  }

  const originalFetch = globalThis.fetch;
  const previousKey = process.env.LLM_API_KEY;
  const previousBaseUrl = process.env.LLM_BASE_URL;
  let modelOutput = "A closed door after a long effort";
  const capturedBodies: string[] = [];
  process.env.LLM_API_KEY = "resonance-contract-key";
  process.env.LLM_BASE_URL = "https://provider.invalid/v1";
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBodies.push(typeof init?.body === "string" ? init.body : "");
    return new Response(
      JSON.stringify({ choices: [{ message: { content: modelOutput } }] }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const safe = await writeOpeningCopyReal({ resonanceBrief: brief, stage });
    modelOutput = "Priya";
    const echo = await writeOpeningCopyReal({ resonanceBrief: brief, stage });
    const providerPayload = capturedBodies.join("\n");
    if (safe.eyebrow !== "A closed door after a long effort") {
      failures.push("safe bounded provider output did not pass the eyebrow guard");
    }
    if (echo.eyebrow !== NEUTRAL_EYEBROW) {
      failures.push("named-detail provider output did not fall back safely");
    }
    if (
      capturedBodies.length !== 2 ||
      providerPayload.includes(PRIVATE_DISCLOSURE) ||
      providerPayload.includes("Priya") ||
      providerPayload.includes("Boston") ||
      providerPayload.includes("2024") ||
      brief.forbiddenEchoHashes.some((hash) => providerPayload.includes(hash))
    ) {
      failures.push("prose provider request exposed raw intake, named details, or fingerprints");
    }
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv("LLM_API_KEY", previousKey);
    restoreEnv("LLM_BASE_URL", previousBaseUrl);
  }
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

void main();
