import "server-only";
import { createHash } from "node:crypto";
import {
  STORY_RECIPE_REGISTRY,
  StoryRecipeRuntimeError,
  type StoryRecipeManifest,
} from "./story-recipe-runtime";

export * from "./story-recipe-runtime";

// Server paths perform a second, cryptographic integrity check. CI governance
// independently recomputes these hashes from disk; the edge-safe runtime module
// handles startup environment validation without importing Node built-ins.
for (const manifest of STORY_RECIPE_REGISTRY.recipes) {
  if (storyRecipeManifestSha256(manifest) !== manifest.manifestSha256) {
    throw new StoryRecipeRuntimeError("registry_invalid");
  }
}

export function storyRecipeManifestSha256(
  manifest: StoryRecipeManifest,
): string {
  const { manifestSha256: _storedHash, ...identity } = manifest;
  void _storedHash;
  return createHash("sha256").update(canonicalJson(identity)).digest("hex");
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  const primitive = JSON.stringify(value);
  if (primitive === undefined) {
    throw new StoryRecipeRuntimeError("registry_invalid");
  }
  return primitive;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
