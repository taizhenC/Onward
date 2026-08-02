import promptReleasesDocument from "../config/prompt-releases.json";
import {
  FACET_TAGGER_PROMPT_CONTRACT,
  RERANK_PROMPT_CONTRACT,
  STORY_PROMPT_CONTRACT,
  STORY_PROMPT_CONTRACT_V2,
  canonicalPromptContract,
  type StoryPromptContract,
} from "./llm-prompts";
import { sha256Hex } from "./sha256-edge";

const PROMPT_RELEASE_REGISTRY_V1 = "prompt-release-registry-v1";
const PROMPT_RELEASE_REGISTRY_V2 = "prompt-release-registry-v2";
const PROMPT_RELEASE_MAX_ENTRIES = 256;
const PROMPT_VERSION = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const PROMPT_HASH = /^[0-9a-f]{64}$/;

type PromptReleaseKind = "rerank" | "story" | "facetTagger";
type PromptRelease = Readonly<{ version: string; sha256: string }>;
type PromptReleaseRegistry = Readonly<{
  schemaVersion:
    | typeof PROMPT_RELEASE_REGISTRY_V1
    | typeof PROMPT_RELEASE_REGISTRY_V2;
  rerank: readonly PromptRelease[];
  story: readonly PromptRelease[];
  facetTagger: readonly PromptRelease[];
}>;

const PROMPT_RELEASE_REGISTRY = parsePromptReleaseRegistry(
  promptReleasesDocument as unknown,
);

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
export const DEFAULT_FACET_TAGGER_MODEL_ID = "gpt-oss-120b";
export const DEFAULT_FACET_TAGGER_TEMPERATURE = 0;
export const DEFAULT_FACET_TAGGER_REASONING_EFFORT = "low";
export const DEFAULT_FACET_TAGGER_TIMEOUT_MS = 3000;
export const DEFAULT_FACET_TAGGER_INPUT_MAX_BYTES = 4096;
export const DEFAULT_FACET_TAGGER_RESPONSE_MAX_BYTES = 65_536;
export const DEFAULT_PROSE_MODEL_ID = "gpt-oss-120b";
export const DEFAULT_STORY_TEMPERATURE = 0.3;
export const DEFAULT_PROSE_TIMEOUT_MS = 8000;
export const STORY_PROMPT_VERSION_V1 =
  "opening-copy-prompt-v1-2026-07" as const;
export const STORY_PROMPT_VERSION_V2 =
  "opening-copy-prompt-v2-2026-07" as const;
const STORY_PROMPT_RELEASE_V1 = releasedStoryPromptContract(
  STORY_PROMPT_VERSION_V1,
  STORY_PROMPT_CONTRACT,
);
export const FACET_TAGGER_PROMPT_VERSION = activePromptRelease(
  "facetTagger",
  sha256Hex(canonicalPromptContract(FACET_TAGGER_PROMPT_CONTRACT)),
);
const STORY_PROMPT_RELEASE_V2 = releasedStoryPromptContract(
  STORY_PROMPT_VERSION_V2,
  STORY_PROMPT_CONTRACT_V2,
);
export const SUPPORTED_STORY_PROMPT_RELEASES = Object.freeze(
  [
    STORY_PROMPT_RELEASE_V1,
    STORY_PROMPT_RELEASE_V2,
  ] satisfies ReadonlyArray<{
    version: string;
    contract: StoryPromptContract;
  }>,
);
// Default for local development only. Released policies bind to their explicit
// immutable identity above rather than to this movable default alias.
export const STORY_PROMPT_VERSION = STORY_PROMPT_VERSION_V1;

export function storyPromptContractFor(
  version: string,
): StoryPromptContract | null {
  return (
    SUPPORTED_STORY_PROMPT_RELEASES.find(
      (release) => release.version === version,
    )?.contract ?? null
  );
}

export function isSupportedStoryPromptVersion(version: string): boolean {
  return storyPromptContractFor(version) !== null;
}

function releasedStoryPromptContract(
  version: string,
  contract: StoryPromptContract,
): Readonly<{ version: string; contract: StoryPromptContract }> {
  if (
    activePromptRelease(
      "story",
      sha256Hex(canonicalPromptContract(contract)),
    ) !== version
  ) {
    throw new Error("Story prompt release identity does not match its content.");
  }
  return Object.freeze({
    version,
    contract,
  });
}

function activePromptRelease(
  kind: PromptReleaseKind,
  contentSha256: string,
): string {
  const releases = PROMPT_RELEASE_REGISTRY[kind];
  const release = releases.find((value) => value.sha256 === contentSha256);
  if (!release) {
    throw new Error("Prompt content has no immutable release identity.");
  }
  return release.version;
}

function parsePromptReleaseRegistry(value: unknown): PromptReleaseRegistry {
  if (!isRecord(value)) invalidRegistry();
  const schemaVersion = value.schemaVersion;
  const isV1 = schemaVersion === PROMPT_RELEASE_REGISTRY_V1;
  const isV2 = schemaVersion === PROMPT_RELEASE_REGISTRY_V2;
  if (
    (!isV1 && !isV2) ||
    !hasExactKeys(
      value,
      isV1
        ? ["schemaVersion", "rerank", "story"]
        : ["schemaVersion", "rerank", "story", "facetTagger"],
    )
  ) {
    invalidRegistry();
  }

  const versions = new Set<string>();
  const hashes = new Set<string>();
  const rerank = parsePromptReleaseLane(value.rerank, versions, hashes);
  const story = parsePromptReleaseLane(value.story, versions, hashes);
  const facetTagger = isV2
    ? parsePromptReleaseLane(value.facetTagger, versions, hashes)
    : [];
  return Object.freeze({
    schemaVersion,
    rerank,
    story,
    facetTagger,
  });
}

function parsePromptReleaseLane(
  value: unknown,
  versions: Set<string>,
  hashes: Set<string>,
): readonly PromptRelease[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > PROMPT_RELEASE_MAX_ENTRIES
  ) {
    invalidRegistry();
  }
  return Object.freeze(value.map((entry) => {
    if (
      !isRecord(entry) ||
      !hasExactKeys(entry, ["version", "sha256"]) ||
      typeof entry.version !== "string" ||
      !PROMPT_VERSION.test(entry.version) ||
      typeof entry.sha256 !== "string" ||
      !PROMPT_HASH.test(entry.sha256) ||
      versions.has(entry.version) ||
      hashes.has(entry.sha256)
    ) {
      invalidRegistry();
    }
    versions.add(entry.version);
    hashes.add(entry.sha256);
    return Object.freeze({
      version: entry.version,
      sha256: entry.sha256,
    });
  }));
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return (
    Object.keys(value).sort().join(",") === [...expected].sort().join(",")
  );
}

function invalidRegistry(): never {
  throw new Error("Prompt release registry is invalid.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
