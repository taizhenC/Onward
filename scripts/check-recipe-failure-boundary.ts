import { isDeepStrictEqual } from "node:util";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { handleMatchRequest } from "../app/api/match/handler";
import { CRISIS_RESOURCES } from "../lib/safety";

type DependencyLoader = NonNullable<Parameters<typeof handleMatchRequest>[1]>;

async function main(): Promise<void> {
  const originalKillSwitch = process.env.STORY_CREATION_ENABLED;
  try {
    assertStaticBoundaryIsMinimal();
    await assertCrisisBypassesBrokenRecipe("registry_invalid");
    await assertCrisisBypassesBrokenRecipe(
      "Prompt content has no immutable release identity.",
    );
    await assertKillSwitchBypassesBrokenRecipe();
    await assertMalformedJsonBypassesBrokenRecipe();
  } finally {
    if (originalKillSwitch === undefined) {
      delete process.env.STORY_CREATION_ENABLED;
    } else {
      process.env.STORY_CREATION_ENABLED = originalKillSwitch;
    }
  }
  console.log("Recipe failure boundary: PASS");
}

function assertStaticBoundaryIsMinimal(): void {
  const source = readFileSync(
    resolve(process.cwd(), "app/api/match/handler.ts"),
    "utf8",
  );
  const importedValues = [...source.matchAll(
    /^import(?!\s+type\b)[\s\S]*?\sfrom\s["']([^"']+)["'];/gm,
  )].map((match) => match[1]);
  assert(
    isDeepStrictEqual(importedValues, ["@/lib/api-utils", "@/lib/safety"]),
    "match boundary gained a recipe-dependent static import",
  );
}

async function assertCrisisBypassesBrokenRecipe(
  failureMessage: string,
): Promise<void> {
  delete process.env.STORY_CREATION_ENABLED;
  let loads = 0;
  const loader = failingLoader(failureMessage, () => {
    loads += 1;
  });
  const crisis = await handleMatchRequest(
    jsonRequest({ age: 24, feeling: "I want to kill myself" }),
    loader,
  );
  assert(crisis.status === 200, "crisis response must remain available");
  assert(loads === 0, "crisis response loaded the broken recipe graph");
  const payload = (await crisis.json()) as unknown;
  assert(
    isDeepStrictEqual(payload, { crisis: true, resources: CRISIS_RESOURCES }),
    "crisis response differs from the reviewed resource payload",
  );

  const ordinary = await handleMatchRequest(
    jsonRequest({ age: 24, feeling: "I feel stuck and far behind." }),
    loader,
  );
  assert(ordinary.status === 503, "broken recipe must stop ordinary stories");
  assert(Number(loads) === 1, "ordinary story did not test the broken dependency graph");
  assert(
    isDeepStrictEqual(await ordinary.json(), { temporarilyUnavailable: true }),
    "broken recipe leaked configuration details",
  );
  assert(
    ordinary.headers.get("cache-control") === "no-store" &&
      ordinary.headers.get("retry-after") === "900",
    "broken recipe response lost its safe retry headers",
  );
}

async function assertKillSwitchBypassesBrokenRecipe(): Promise<void> {
  process.env.STORY_CREATION_ENABLED = "false";
  let loads = 0;
  const response = await handleMatchRequest(
    jsonRequest({ age: 24, feeling: "I feel stuck." }),
    failingLoader("registry_invalid", () => {
      loads += 1;
    }),
  );
  assert(response.status === 503, "kill switch must stop ordinary stories");
  assert(loads === 0, "kill switch loaded the broken recipe graph");
}

async function assertMalformedJsonBypassesBrokenRecipe(): Promise<void> {
  delete process.env.STORY_CREATION_ENABLED;
  let loads = 0;
  const response = await handleMatchRequest(
    new Request("http://onward.test/api/match", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }),
    failingLoader("registry_invalid", () => {
      loads += 1;
    }),
  );
  assert(response.status === 400, "malformed JSON must remain a bad request");
  assert(loads === 0, "malformed JSON loaded the broken recipe graph");
}

function failingLoader(
  message: string,
  onLoad: () => void,
): DependencyLoader {
  return async () => {
    onLoad();
    throw new Error(message);
  };
}

function jsonRequest(body: unknown): Request {
  return new Request("http://onward.test/api/match", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Recipe failure boundary failed: ${message}`);
}

void main();
