import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const REGISTRY_PATH = "config/story-recipes.json";
const IMMUTABLE_PATHS = [
  "evals/history",
  "evals/shadow",
  "config/recipe-decisions",
] as const;

type RecipeRegistry = {
  datasets?: Array<{ version?: unknown }>;
  promotions?: Array<{ recipeId?: unknown }>;
  recipes?: Array<{ recipeId?: unknown }>;
};

function fail(message: string): never {
  console.error(`Recipe immutability check failed: ${message}`);
  process.exit(1);
}

function git(args: string[]): string {
  try {
    return execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    fail("the requested base revision is unavailable");
  }
}

function parseRegistry(text: string, label: string): RecipeRegistry {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    fail(`${label} recipe registry is not valid JSON`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    fail(`${label} recipe registry is not an object`);
  }
  return parsed as RecipeRegistry;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function recipeMap(registry: RecipeRegistry, label: string): Map<string, unknown> {
  if (!Array.isArray(registry.recipes)) {
    fail(`${label} registry has no recipes array`);
  }
  const result = new Map<string, unknown>();
  for (const recipe of registry.recipes) {
    if (!recipe || typeof recipe.recipeId !== "string") {
      fail(`${label} registry contains a recipe without a recipeId`);
    }
    if (result.has(recipe.recipeId)) {
      fail(`${label} registry repeats recipe ${recipe.recipeId}`);
    }
    result.set(recipe.recipeId, recipe);
  }
  return result;
}

function datasetMap(registry: RecipeRegistry, label: string): Map<string, unknown> {
  if (!Array.isArray(registry.datasets)) {
    fail(`${label} registry has no datasets array`);
  }
  const result = new Map<string, unknown>();
  for (const dataset of registry.datasets) {
    if (!dataset || typeof dataset.version !== "string") {
      fail(`${label} registry contains a dataset without a version`);
    }
    if (result.has(dataset.version)) {
      fail(`${label} registry repeats dataset ${dataset.version}`);
    }
    result.set(dataset.version, dataset);
  }
  return result;
}

function promotionMap(
  registry: RecipeRegistry,
  label: string,
): Map<string, unknown> {
  if (!Array.isArray(registry.promotions)) {
    fail(`${label} registry has no promotions array`);
  }
  const result = new Map<string, unknown>();
  for (const promotion of registry.promotions) {
    if (!promotion || typeof promotion.recipeId !== "string") {
      fail(`${label} registry contains a promotion without a recipeId`);
    }
    if (result.has(promotion.recipeId)) {
      fail(`${label} registry repeats promotion ${promotion.recipeId}`);
    }
    result.set(promotion.recipeId, promotion);
  }
  return result;
}

function assertAppendOnlyFiles(base: string): void {
  const diff = git([
    "diff",
    "--name-status",
    "--find-renames",
    base,
    "HEAD",
    "--",
    ...IMMUTABLE_PATHS,
  ]);
  if (!diff) return;

  const violations = diff
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !line.startsWith("A\t"));
  if (violations.length > 0) {
    fail(
      `committed evidence and decisions are append-only; forbidden changes: ${violations.join(", ")}`,
    );
  }
}

function assertExistingRecipesUnchanged(base: string): void {
  let baseText: string;
  try {
    baseText = execFileSync("git", ["show", `${base}:${REGISTRY_PATH}`], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    // The registry's first landing has no prior entries to protect.
    return;
  }

  const previous = recipeMap(parseRegistry(baseText, "base"), "base");
  const baseRegistry = parseRegistry(baseText, "base");
  const currentRegistry = parseRegistry(
    readFileSync(REGISTRY_PATH, "utf8"),
    "current",
  );
  const current = recipeMap(currentRegistry, "current");
  for (const [recipeId, recipe] of previous) {
    const next = current.get(recipeId);
    if (!next) fail(`existing recipe ${recipeId} was removed`);
    if (canonical(recipe) !== canonical(next)) {
      fail(`existing recipe ${recipeId} was modified instead of versioned`);
    }
  }
  const previousDatasets = datasetMap(baseRegistry, "base");
  const currentDatasets = datasetMap(currentRegistry, "current");
  for (const [version, dataset] of previousDatasets) {
    const next = currentDatasets.get(version);
    if (!next) fail(`existing dataset ${version} was removed`);
    if (canonical(dataset) !== canonical(next)) {
      fail(`existing dataset ${version} was modified instead of versioned`);
    }
  }
  const previousPromotions = promotionMap(baseRegistry, "base");
  const currentPromotions = promotionMap(currentRegistry, "current");
  for (const [recipeId, promotion] of previousPromotions) {
    const next = currentPromotions.get(recipeId);
    if (!next) fail(`existing promotion ${recipeId} was removed`);
    if (canonical(promotion) !== canonical(next)) {
      fail(`existing promotion ${recipeId} was modified instead of appended`);
    }
  }
}

function main(): void {
  const base = process.argv[2]?.trim();
  if (!base) {
    fail("pass the pull-request base revision as the first argument");
  }
  git(["rev-parse", "--verify", base]);
  assertAppendOnlyFiles(base);
  assertExistingRecipesUnchanged(base);
  console.log("Recipe immutability check passed (history is append-only).");
}

main();
