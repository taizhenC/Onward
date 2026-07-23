import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  RERANK_PROMPT_CONTRACT,
  STORY_PROMPT_CONTRACT,
  canonicalPromptContract,
} from "../lib/llm-prompts";
import {
  RERANK_PROMPT_VERSION,
  STORY_PROMPT_VERSION,
} from "../lib/llm-recipe-constants";
import { sha256Hex } from "../lib/sha256-edge";

const REGISTRY_PATH = "config/prompt-releases.json";
const REGISTRY_V1 = "prompt-release-registry-v1";
const REGISTRY_V2 = "prompt-release-registry-v2";
const RELEASE_KINDS = ["rerank", "story", "facetTagger"] as const;
const MAX_RELEASES_PER_LANE = 256;
const HASH = /^[0-9a-f]{64}$/;
const VERSION = /^[a-z0-9][a-z0-9._-]{0,127}$/;

type PromptRelease = Readonly<{ version: string; sha256: string }>;
type PromptReleaseRegistry = Readonly<{
  schemaVersion: typeof REGISTRY_V1 | typeof REGISTRY_V2;
  rerank: readonly PromptRelease[];
  story: readonly PromptRelease[];
  facetTagger: readonly PromptRelease[];
}>;

function main(): void {
  const registry = parseRegistry(
    JSON.parse(readFileSync(REGISTRY_PATH, "utf8")) as unknown,
    "current prompt release registry",
  );
  const actual = {
    rerank: verifiedSha256(canonicalPromptContract(RERANK_PROMPT_CONTRACT)),
    story: verifiedSha256(canonicalPromptContract(STORY_PROMPT_CONTRACT)),
  } as const;
  assertActiveRelease(registry.rerank, RERANK_PROMPT_VERSION, actual.rerank);
  assertActiveRelease(registry.story, STORY_PROMPT_VERSION, actual.story);
  checkRegistryFixtures(registry);

  const base = process.argv[2]?.trim();
  if (base) assertAppendOnlyFromBase(base, registry);
  console.log(
    `Prompt release check passed (rerank=${RERANK_PROMPT_VERSION}; story=${STORY_PROMPT_VERSION}).`,
  );
}

function verifiedSha256(value: string): string {
  const edge = sha256Hex(value);
  const node = createHash("sha256").update(value).digest("hex");
  assert(edge === node, "edge prompt digest differs from Node SHA-256");
  return edge;
}

function assertActiveRelease(
  releases: readonly PromptRelease[],
  version: string,
  sha256: string,
): void {
  const matches = releases.filter(
    (release) => release.version === version && release.sha256 === sha256,
  );
  assert(matches.length === 1, `${version} does not bind the exact prompt content`);
}

function assertAppendOnlyFromBase(
  base: string,
  current: PromptReleaseRegistry,
): void {
  let priorText: string;
  try {
    priorText = execFileSync(
      "git",
      ["show", `${base}:${REGISTRY_PATH}`],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  } catch {
    // The registry's first landing has no prior identities to protect.
    return;
  }
  const prior = parseRegistry(
    JSON.parse(priorText) as unknown,
    "base prompt release registry",
  );
  assertAppendOnly(prior, current);
}

function assertAppendOnly(
  prior: PromptReleaseRegistry,
  current: PromptReleaseRegistry,
): void {
  assert(
    prior.schemaVersion === REGISTRY_V1 ||
      current.schemaVersion === REGISTRY_V2,
    "prompt release registry was downgraded from v2",
  );
  for (const kind of RELEASE_KINDS) {
    assert(
      current[kind].length >= prior[kind].length,
      `${kind} prompt release history was truncated`,
    );
    if (kind !== "facetTagger") {
      assert(
        current[kind].length === prior[kind].length,
        `${kind} prompt releases changed while artifact binding is unavailable`,
      );
    }
    for (let index = 0; index < prior[kind].length; index += 1) {
      assert(
        canonical(prior[kind][index]) === canonical(current[kind][index]),
        `${kind} prompt release ${prior[kind][index].version} was modified`,
      );
    }
  }
}

function parseRegistry(value: unknown, label: string): PromptReleaseRegistry {
  assert(isRecord(value), `${label} is not an object`);
  const schemaVersion = value.schemaVersion;
  const isV1 = schemaVersion === REGISTRY_V1;
  const isV2 = schemaVersion === REGISTRY_V2;
  assert(
    isV1 || isV2,
    `${label} schema is unsupported`,
  );
  assert(
    Object.keys(value).sort().join(",") ===
      (isV1
        ? "rerank,schemaVersion,story"
        : "facetTagger,rerank,schemaVersion,story"),
    `${label} has missing or extra fields`,
  );
  const versions = new Set<string>();
  const hashes = new Set<string>();
  const rerank = parseReleases(
    value.rerank,
    `${label}.rerank`,
    versions,
    hashes,
  );
  const story = parseReleases(
    value.story,
    `${label}.story`,
    versions,
    hashes,
  );
  const facetTagger = isV2
    ? parseReleases(
        value.facetTagger,
        `${label}.facetTagger`,
        versions,
        hashes,
      )
    : [];
  return { schemaVersion, rerank, story, facetTagger };
}

function parseReleases(
  value: unknown,
  label: string,
  versions: Set<string>,
  hashes: Set<string>,
): PromptRelease[] {
  assert(
    Array.isArray(value) &&
      value.length > 0 &&
      value.length <= MAX_RELEASES_PER_LANE,
    `${label} has an unsafe release count`,
  );
  return value.map((entry, index) => {
    assert(isRecord(entry), `${label}[${index}] is not an object`);
    assert(
      Object.keys(entry).sort().join(",") === "sha256,version",
      `${label}[${index}] has missing or extra fields`,
    );
    assert(
      typeof entry.version === "string" && VERSION.test(entry.version),
      `${label}[${index}].version is invalid`,
    );
    assert(
      typeof entry.sha256 === "string" && HASH.test(entry.sha256),
      `${label}[${index}].sha256 is invalid`,
    );
    assert(!versions.has(entry.version), `${label} repeats a version`);
    assert(!hashes.has(entry.sha256), `${label} repeats a content hash`);
    versions.add(entry.version);
    hashes.add(entry.sha256);
    return { version: entry.version, sha256: entry.sha256 };
  });
}

function checkRegistryFixtures(current: PromptReleaseRegistry): void {
  const v1 = parseRegistry(
    {
      schemaVersion: REGISTRY_V1,
      rerank: current.rerank,
      story: current.story,
    },
    "v1 fixture",
  );
  const firstTaggerRelease = {
    version: "facet-tagger-prompt-v1-2026-07",
    sha256: "f".repeat(64),
  };
  const v2 = parseRegistry(
    {
      schemaVersion: REGISTRY_V2,
      rerank: current.rerank,
      story: current.story,
      facetTagger: [firstTaggerRelease],
    },
    "v2 fixture",
  );
  assertAppendOnly(v1, v2);
  assertAppendOnly(
    v2,
    parseRegistry(
      {
        schemaVersion: REGISTRY_V2,
        rerank: current.rerank,
        story: current.story,
        facetTagger: [
          firstTaggerRelease,
          {
            version: "facet-tagger-prompt-v2-2026-08",
            sha256: "e".repeat(64),
          },
        ],
      },
      "v2 append fixture",
    ),
  );

  expectFailure(
    () => assertAppendOnly(v2, v1),
    "v2 prompt registry downgrade was accepted",
  );
  expectFailure(
    () =>
      assertAppendOnly(
        v2,
        parseRegistry(
          {
            schemaVersion: REGISTRY_V2,
            rerank: current.rerank,
            story: current.story,
            facetTagger: [
              {
                ...firstTaggerRelease,
                sha256: "d".repeat(64),
              },
            ],
          },
          "mutated v2 fixture",
        ),
      ),
    "facet-tagger prompt history mutation was accepted",
  );
  expectFailure(
    () =>
      parseRegistry(
        {
          schemaVersion: REGISTRY_V2,
          rerank: current.rerank,
          story: current.story,
          facetTagger: [
            {
              version: "facet-tagger@unreviewed",
              sha256: "d".repeat(64),
            },
          ],
        },
        "unsafe version fixture",
      ),
    "unsafe prompt version grammar was accepted",
  );
  expectFailure(
    () =>
      parseRegistry(
        {
          schemaVersion: REGISTRY_V2,
          rerank: current.rerank,
          story: current.story,
          facetTagger: [
            {
              version: "facet-tagger-prompt-v1-2026-07",
              sha256: current.rerank[0]?.sha256,
            },
          ],
        },
        "cross-lane alias fixture",
      ),
    "cross-lane prompt hash alias was accepted",
  );
  expectFailure(
    () =>
      parseRegistry(
        {
          schemaVersion: REGISTRY_V2,
          rerank: current.rerank,
          story: current.story,
          facetTagger: Array.from(
            { length: MAX_RELEASES_PER_LANE + 1 },
            () => firstTaggerRelease,
          ),
        },
        "oversized lane fixture",
      ),
    "oversized prompt release lane was accepted",
  );
}

function expectFailure(action: () => void, message: string): void {
  let rejected = false;
  try {
    action();
  } catch {
    rejected = true;
  }
  assert(rejected, message);
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Prompt release check failed: ${message}`);
}

main();
