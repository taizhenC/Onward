import promptReleasesDocument from "../config/prompt-releases.json";
import {
  RERANK_PROMPT_CONTRACT,
  STORY_PROMPT_CONTRACT,
  canonicalPromptContract,
} from "./llm-prompts";
import { sha256Hex } from "./sha256-edge";

// Provider-neutral identity for every model-controlled recipe surface. Keeping
// these constants outside the provider implementation lets deployment
// validation prove prompt/tuning identity without bypassing lib/llm.ts for any
// provider operation.
export const DEFAULT_RERANK_MODEL_ID = "gpt-oss-120b";
export const DEFAULT_LLM_BASE_URL = "https://api.cerebras.ai/v1";
export const DEFAULT_RERANK_TEMPERATURE = 0;
export const DEFAULT_RERANK_REASONING_EFFORT = "low";
export const DEFAULT_RERANK_TIMEOUT_MS = 15000;
export const RERANK_PROMPT_VERSION = activePromptRelease(
  "rerank",
  sha256Hex(canonicalPromptContract(RERANK_PROMPT_CONTRACT)),
);
export const DEFAULT_PROSE_MODEL_ID = "gpt-oss-120b";
export const DEFAULT_STORY_TEMPERATURE = 0.3;
export const DEFAULT_PROSE_TIMEOUT_MS = 8000;
export const STORY_PROMPT_VERSION = activePromptRelease(
  "story",
  sha256Hex(canonicalPromptContract(STORY_PROMPT_CONTRACT)),
);

type PromptReleaseKind = "rerank" | "story";

function activePromptRelease(
  kind: PromptReleaseKind,
  contentSha256: string,
): string {
  const document = promptReleasesDocument as unknown;
  if (!isRecord(document) || document.schemaVersion !== "prompt-release-registry-v1") {
    throw new Error("Prompt release registry is invalid.");
  }
  const releases = document[kind];
  if (!Array.isArray(releases) || releases.length === 0) {
    throw new Error("Prompt release registry is invalid.");
  }
  const versions = new Set<string>();
  const hashes = new Set<string>();
  let active: string | null = null;
  for (const value of releases) {
    if (
      !isRecord(value) ||
      Object.keys(value).sort().join(",") !== "sha256,version" ||
      typeof value.version !== "string" ||
      !/^[a-z0-9][a-z0-9@._-]{0,127}$/.test(value.version) ||
      typeof value.sha256 !== "string" ||
      !/^[0-9a-f]{64}$/.test(value.sha256) ||
      versions.has(value.version) ||
      hashes.has(value.sha256)
    ) {
      throw new Error("Prompt release registry is invalid.");
    }
    versions.add(value.version);
    hashes.add(value.sha256);
    if (value.sha256 === contentSha256) active = value.version;
  }
  if (!active) throw new Error("Prompt content has no immutable release identity.");
  return active;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
