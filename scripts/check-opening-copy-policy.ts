import "./_smoke-bootstrap";
import { createHash } from "node:crypto";
import { consumeDerivedOutput } from "../lib/derived-output-retention";
import { FIGURE_STAGES } from "../lib/figures-data";
import { requestHybridPlan, writeOpeningCopy } from "../lib/llm";
import {
  HybridPlanProviderError,
  buildHybridPlanRequest,
} from "../lib/hybrid-composition";
import {
  STORY_PROMPT_VERSION,
  STORY_PROMPT_VERSION_V1,
  SUPPORTED_STORY_PROMPT_RELEASES,
} from "../lib/llm-recipe-constants";
import {
  EYEBROW_SYSTEM_PROMPT,
  buildEyebrowUserPrompt,
} from "../lib/llm-prompts";
import {
  OpeningCopyPolicyError,
  SUPPORTED_OPENING_COPY_POLICIES,
  openingCopyPolicyForStoryPromptVersion,
} from "../lib/opening-copy-policy";
import {
  DEFAULT_PREFACE_LINES,
  NEUTRAL_EYEBROW,
  curatedEyebrow,
  toEyebrowProviderSurface,
  toEyebrowSurface,
} from "../lib/opening-copy";
import { createResonanceBrief } from "../lib/resonance-brief";
import { buildDraftStorySpec } from "../lib/story-spec";
import {
  PRIMARY_STORY_RECIPE,
  getStoryRecipeById,
  storyRecipeExecutionPlan,
} from "../lib/story-recipe";

const PRIVATE_DISCLOSURE =
  'After Priya moved me from Boston in 2024, my "cobalt compass" stopped pointing anywhere and I felt rejected.';
const LEGACY_REQUEST_SHA256 =
  "2f1a4d8ef48b9bfe74dad4be9088fa88341c3d184f6342853f4c94c9563da4f1";
const LEGACY_NEUTRAL_EYEBROW = "A life under a similar pressure";
const LEGACY_BUTLER_EYEBROW = "Years of work no one had asked for";
const LEGACY_PREFACE_LINES = [
  "That hurts.",
  "You do not have to solve everything right now.",
  "Here is someone who stood in a similar kind of weight.",
  "Let's start with their story.",
] as const;

async function main(): Promise<void> {
  const stage = FIGURE_STAGES.find(
    (candidate) => candidate.figureKey === "butler",
  );
  if (!stage) throw new Error("opening-copy fixture stage is missing");
  const input = {
    resonanceBrief: createResonanceBrief(PRIVATE_DISCLOSURE),
    stage,
  };
  const policy = openingCopyPolicyForStoryPromptVersion(STORY_PROMPT_VERSION);

  assertPolicyRegistry(policy);
  assertUnknownVersionsFailClosed();
  await assertUnknownExecutionFailsBeforeProvider(input);
  assertV1MappingIsCompatible(policy, input);
  assertRecipePlansCarryPromptIdentity();
  await assertProviderRequestBytes(input);

  console.log(
    `Opening-copy policy check passed (prompt=${policy.storyPromptVersion}).`,
  );
}

async function assertUnknownExecutionFailsBeforeProvider(
  input: Parameters<typeof toEyebrowSurface>[0],
): Promise<void> {
  const unknownVersion = "opening-copy-prompt-v2-2099-01";
  const originalFetch = globalThis.fetch;
  let providerCalled = false;
  globalThis.fetch = (async () => {
    providerCalled = true;
    throw new Error("provider must not be called");
  }) as typeof fetch;
  try {
    await expectClosedExecutionError(
      () => writeOpeningCopy(input, unknownVersion),
      OpeningCopyPolicyError,
    );
    await expectClosedExecutionError(
      () =>
        requestHybridPlan(
          buildHybridPlanRequest(
            buildDraftStorySpec(input.stage),
            input.resonanceBrief,
          ),
          unknownVersion,
        ),
      HybridPlanProviderError,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
  if (providerCalled) {
    throw new Error("unknown prompt identity reached a provider");
  }
}

async function expectClosedExecutionError(
  run: () => Promise<unknown>,
  expected:
    | typeof OpeningCopyPolicyError
    | typeof HybridPlanProviderError,
): Promise<void> {
  try {
    await run();
    throw new Error("unknown story prompt executed");
  } catch (error) {
    if (!(error instanceof expected)) throw error;
    if (
      error.message !== "Opening-copy policy is unavailable." &&
      error.message !== "Story prompt policy is unavailable."
    ) {
      throw new Error("unknown story prompt leaked an open error");
    }
  }
}

function assertPolicyRegistry(
  policy: ReturnType<typeof openingCopyPolicyForStoryPromptVersion>,
): void {
  if (
    STORY_PROMPT_VERSION !== STORY_PROMPT_VERSION_V1 ||
    policy.storyPromptVersion !== STORY_PROMPT_VERSION_V1 ||
    !Object.isFrozen(policy) ||
    !Object.isFrozen(SUPPORTED_OPENING_COPY_POLICIES) ||
    SUPPORTED_OPENING_COPY_POLICIES.length !==
      SUPPORTED_STORY_PROMPT_RELEASES.length
  ) {
    throw new Error("v1 opening-copy policy identity is not closed and frozen");
  }
  if (
    NEUTRAL_EYEBROW !== LEGACY_NEUTRAL_EYEBROW ||
    curatedEyebrow("butler", "1974-1975-pre-patternmaster") !==
      LEGACY_BUTLER_EYEBROW ||
    JSON.stringify(DEFAULT_PREFACE_LINES) !==
      JSON.stringify(LEGACY_PREFACE_LINES)
  ) {
    throw new Error("released v1 displayed copy changed");
  }
  for (const release of SUPPORTED_STORY_PROMPT_RELEASES) {
    if (
      openingCopyPolicyForStoryPromptVersion(release.version)
        .storyPromptVersion !== release.version
    ) {
      throw new Error("an executable story prompt has no opening-copy policy");
    }
  }
}

function assertUnknownVersionsFailClosed(): void {
  for (const version of [
    "",
    "opening-copy-prompt-v2-2099-01",
    STORY_PROMPT_VERSION.toUpperCase(),
    ` ${STORY_PROMPT_VERSION}`,
    `${STORY_PROMPT_VERSION} `,
  ]) {
    try {
      openingCopyPolicyForStoryPromptVersion(version);
      throw new Error(`unsupported story prompt resolved: ${version}`);
    } catch (error) {
      if (!(error instanceof OpeningCopyPolicyError)) throw error;
      if (
        error.code !== "unsupported_story_prompt_version" ||
        error.message !== "Opening-copy policy is unavailable." ||
        (version.length > 0 && error.message.includes(version))
      ) {
        throw new Error("unsupported prompt identity did not fail closed");
      }
    }
  }
}

function assertV1MappingIsCompatible(
  policy: ReturnType<typeof openingCopyPolicyForStoryPromptVersion>,
  input: Parameters<typeof toEyebrowSurface>[0],
): void {
  const preparationSurface = toEyebrowSurface(input);
  const providerSurface = toEyebrowProviderSurface(preparationSurface);
  const prompts = policy.providerPrompts(providerSurface);
  if (
    prompts.systemPrompt !== EYEBROW_SYSTEM_PROMPT ||
    prompts.userPrompt !== buildEyebrowUserPrompt(providerSurface) ||
    "displayName" in providerSurface ||
    !Object.isFrozen(providerSurface.resonance) ||
    !Object.isFrozen(prompts)
  ) {
    throw new Error("v1 policy changed the released eyebrow prompt");
  }

  const safeCandidate = "A closed door after a long effort";
  assertOpeningCopy(
    policy.fromRealCandidate(safeCandidate, input),
    safeCandidate,
    "safe provider candidate",
  );
  for (const [name, candidate] of [
    ["null", null],
    ["blank", "   "],
    ["multiline", "One line\nA second line"],
    ["figure name", input.stage.displayName],
    ["disclosure echo", "Priya"],
    ["overlong", "x".repeat(73)],
  ] as const) {
    assertOpeningCopy(
      policy.fromRealCandidate(candidate, input),
      LEGACY_NEUTRAL_EYEBROW,
      name,
    );
  }
  assertOpeningCopy(
    policy.fromStub(input),
    LEGACY_BUTLER_EYEBROW,
    "stub candidate",
  );
}

function assertOpeningCopy(
  copy: Readonly<{ eyebrow: string; prefaceLines: readonly string[] }>,
  expectedEyebrow: string,
  fixture: string,
): void {
  if (
    copy.eyebrow !== expectedEyebrow ||
    JSON.stringify(copy.prefaceLines) !== JSON.stringify(LEGACY_PREFACE_LINES)
  ) {
    throw new Error(`${fixture} changed the v1 opening-copy output`);
  }
}

function assertRecipePlansCarryPromptIdentity(): void {
  const challenger = getStoryRecipeById(
    "facetsrag-rerank-figure-library-50-2026-07-02",
  );
  if (!challenger) throw new Error("opening-copy challenger fixture is missing");
  const plans = [
    storyRecipeExecutionPlan(PRIMARY_STORY_RECIPE),
    storyRecipeExecutionPlan(challenger),
  ];
  if (
    plans.some(
      (plan) =>
        plan.storyPromptVersion !== STORY_PROMPT_VERSION ||
        plan.rerankPromptVersion !== PRIMARY_STORY_RECIPE.rerankPromptVersion,
    )
  ) {
    throw new Error("recipe execution plan dropped immutable prompt identity");
  }
}

async function assertProviderRequestBytes(
  input: Parameters<typeof toEyebrowSurface>[0],
): Promise<void> {
  const previous = captureEnvironment([
    "LLM_API_KEY",
    "LLM_BASE_URL",
    "LLM_PROVIDER",
    "LLM_MODEL_PROSE",
    "LLM_PROSE_TEMPERATURE",
  ]);
  const originalFetch = globalThis.fetch;
  let capturedBody = "";
  process.env.LLM_API_KEY = "opening-policy-contract-key";
  process.env.LLM_BASE_URL = "https://provider.invalid/v1";
  process.env.LLM_PROVIDER = "real";
  process.env.LLM_MODEL_PROSE = "gpt-oss-120b";
  process.env.LLM_PROSE_TEMPERATURE = "0.3";
  globalThis.fetch = (async (_request: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = typeof init?.body === "string" ? init.body : "";
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: "A closed door after a long effort" } }],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const result = consumeDerivedOutput(
      await writeOpeningCopy(input, STORY_PROMPT_VERSION),
      "provider_health_check",
    );
    assertOpeningCopy(
      result,
      "A closed door after a long effort",
      "provider request",
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvironment(previous);
  }

  const surface = toEyebrowProviderSurface(toEyebrowSurface(input));
  const expectedBody = JSON.stringify({
    model: "gpt-oss-120b",
    temperature: 0.3,
    messages: [
      { role: "system", content: EYEBROW_SYSTEM_PROMPT },
      { role: "user", content: buildEyebrowUserPrompt(surface) },
    ],
  });
  const actualSha256 = createHash("sha256").update(capturedBody).digest("hex");
  if (
    capturedBody !== expectedBody ||
    actualSha256 !== LEGACY_REQUEST_SHA256 ||
    capturedBody.includes(PRIVATE_DISCLOSURE) ||
    capturedBody.includes("Priya") ||
    capturedBody.includes("Boston") ||
    capturedBody.includes("2024") ||
    capturedBody.includes(input.stage.displayName) ||
    input.resonanceBrief.forbiddenEchoHashes.some((hash) =>
      capturedBody.includes(hash),
    )
  ) {
    throw new Error(
      `opening-copy provider bytes changed (sha256=${actualSha256})`,
    );
  }
}

function captureEnvironment(
  keys: readonly string[],
): ReadonlyMap<string, string | undefined> {
  return new Map(keys.map((key) => [key, process.env[key]]));
}

function restoreEnvironment(
  values: ReadonlyMap<string, string | undefined>,
): void {
  for (const [key, value] of values) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

void main();
