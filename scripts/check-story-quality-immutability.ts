import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import {
  parseStoryQualityEvidence,
  type StoryQualityEvidence,
} from "./story-quality-evidence";

const POLICY_PATH = "config/story-quality-policy.json";
const PROTOCOL_PATH = "roadmap/story_quality_benchmark.md";
const STORY_QUALITY_ROOT = "evals/story-quality";
const HISTORY_ROOT = `${STORY_QUALITY_ROOT}/history`;
const PRIVATE_ROOT = `${STORY_QUALITY_ROOT}/private`;
const RUNS_ROOT = `${STORY_QUALITY_ROOT}/runs`;

export type NameStatusChange = {
  status: string;
  paths: string[];
};

export type PolicyVersions = {
  policyVersion: string;
  protocolVersion: string;
};

export type StoryQualityImmutabilityInput = {
  changes: NameStatusChange[];
  trackedPaths: string[];
  basePolicy: PolicyVersions | null;
  currentPolicy: PolicyVersions | null;
  addedHistoryEvidenceValid: boolean;
};

export type StoryQualityImmutabilityFailure =
  | "history_not_append_only"
  | "history_evidence_invalid"
  | "private_material_tracked"
  | "current_policy_invalid"
  | "policy_version_not_increased"
  | "protocol_version_not_changed";

const FAILURE_MESSAGES: Record<StoryQualityImmutabilityFailure, string> = {
  history_not_append_only:
    "published story-quality evidence must remain append-only",
  history_evidence_invalid:
    "new story-quality history entries must be exact, safe, non-pass evidence written at their content-addressed path",
  private_material_tracked:
    "private benchmark inputs and working runs must not be tracked",
  current_policy_invalid:
    "the current story-quality policy is missing or invalid",
  policy_version_not_increased:
    "policy changes require a strictly increased policyVersion",
  protocol_version_not_changed:
    "benchmark protocol changes require a new protocolVersion",
};

function fail(message: string): never {
  console.error(`Story-quality immutability check failed: ${message}.`);
  process.exit(1);
}

function git(args: string[]): string {
  try {
    return execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    fail("the requested repository state is unavailable");
  }
}

function gitFile(revision: string, path: string): string | null {
  try {
    return execFileSync("git", ["show", `${revision}:${path}`], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

function gitFileMode(revision: string, path: string): string | null {
  let output: string;
  try {
    output = execFileSync(
      "git",
      ["ls-tree", "-z", revision, "--", path],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  } catch {
    return null;
  }
  const entries = output.split("\0").filter(Boolean);
  if (entries.length !== 1) return null;
  const separator = entries[0].indexOf("\t");
  if (separator < 0 || entries[0].slice(separator + 1) !== path) {
    return null;
  }
  const [mode, type, object, ...extra] = entries[0]
    .slice(0, separator)
    .split(" ");
  return (
    extra.length === 0 &&
      type === "blob" &&
      /^[0-9a-f]{40,64}$/i.test(object)
      ? mode
      : null
  );
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\/+/, "").toLowerCase();
}

function isWithin(path: string, root: string): boolean {
  const normalizedPath = normalizePath(path);
  const normalizedRoot = normalizePath(root);
  return (
    normalizedPath === normalizedRoot ||
    normalizedPath.startsWith(`${normalizedRoot}/`)
  );
}

function touchesPath(change: NameStatusChange, path: string): boolean {
  const target = normalizePath(path);
  return change.paths.some((entry) => normalizePath(entry) === target);
}

/**
 * Parse the NUL-delimited output of `git diff --name-status -z`.
 *
 * NUL delimiting prevents unusual file names from changing the record shape.
 * Rename and copy records carry two paths; every other status carries one.
 */
export function parseNameStatus(output: string): NameStatusChange[] | null {
  if (output.length === 0) return [];

  const tokens = output.split("\0");
  if (tokens.at(-1) === "") tokens.pop();

  const changes: NameStatusChange[] = [];
  let index = 0;
  while (index < tokens.length) {
    const status = tokens[index++];
    if (!/^(?:[ACDMRTUXB]|[RC]\d{1,3})$/.test(status)) return null;

    const pathCount = /^[RC]\d{1,3}$/.test(status) ? 2 : 1;
    if (index + pathCount > tokens.length) return null;

    const paths = tokens.slice(index, index + pathCount);
    if (paths.some((path) => path.length === 0)) return null;
    changes.push({ status, paths });
    index += pathCount;
  }

  return changes;
}

export function parsePolicyVersions(text: string): PolicyVersions | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const policyVersion = record.policyVersion;
  const protocolVersion = record.protocolVersion;
  const validVersion = (candidate: unknown): candidate is string =>
    typeof candidate === "string" &&
    /^[a-z0-9][a-z0-9._-]{0,127}$/i.test(candidate);

  if (!validVersion(policyVersion) || !validVersion(protocolVersion)) {
    return null;
  }
  return { policyVersion, protocolVersion };
}

/**
 * Version identifiers are repository-controlled strings rather than SemVer.
 * A strict increase therefore means that their numeric components advance
 * lexicographically. Text-only edits and equivalent zero suffixes do not pass.
 */
export function isStrictVersionIncrease(
  previous: string,
  current: string,
): boolean {
  if (previous === current) return false;
  const previousParts = previous.match(/\d+/g);
  const currentParts = current.match(/\d+/g);
  if (!previousParts || !currentParts) return false;

  const count = Math.max(previousParts.length, currentParts.length);
  for (let index = 0; index < count; index += 1) {
    const left = BigInt(previousParts[index] ?? "0");
    const right = BigInt(currentParts[index] ?? "0");
    if (right > left) return true;
    if (right < left) return false;
  }
  return false;
}

export function storyQualityEvidenceHistoryPath(
  evidence: StoryQualityEvidence,
): string {
  return `${HISTORY_ROOT}/${evidence.benchmark.benchmarkVersion}/${evidence.candidate.recipeId}/${evidence.evidenceId}.json`;
}

export function isRegularHistoryFileMode(
  mode: string | null,
): boolean {
  return mode === "100644";
}

/**
 * Ordinary pull-request CI has no custodian trust root, so it may admit only
 * exact incomplete/fail evidence. A future protected, base-owned authority
 * must verify and land a signed pass; PR-controlled code cannot self-promote.
 */
export function isValidAddedHistoryEvidence(
  path: string,
  text: string,
): boolean {
  try {
    const parsed = parseStoryQualityEvidence(
      JSON.parse(text) as unknown,
    );
    return (
      parsed.status !== "pass" &&
      normalizePath(path) ===
        normalizePath(storyQualityEvidenceHistoryPath(parsed))
    );
  } catch {
    return false;
  }
}

/**
 * Pure policy function so adversarial cases can be tested without invoking Git.
 */
export function evaluateStoryQualityImmutability(
  input: StoryQualityImmutabilityInput,
): StoryQualityImmutabilityFailure | null {
  if (
    input.trackedPaths.some(
      (path) => isWithin(path, PRIVATE_ROOT) || isWithin(path, RUNS_ROOT),
    )
  ) {
    return "private_material_tracked";
  }

  for (const change of input.changes) {
    if (
      change.paths.some((path) => isWithin(path, HISTORY_ROOT)) &&
      change.status !== "A"
    ) {
      return "history_not_append_only";
    }
  }
  if (!input.addedHistoryEvidenceValid) {
    return "history_evidence_invalid";
  }

  const policyChanged = input.changes.some((change) =>
    touchesPath(change, POLICY_PATH),
  );
  const protocolChanged = input.changes.some((change) =>
    touchesPath(change, PROTOCOL_PATH),
  );

  if ((policyChanged || protocolChanged) && !input.currentPolicy) {
    return "current_policy_invalid";
  }

  if (
    policyChanged &&
    input.basePolicy &&
    input.currentPolicy &&
    !isStrictVersionIncrease(
      input.basePolicy.policyVersion,
      input.currentPolicy.policyVersion,
    )
  ) {
    return "policy_version_not_increased";
  }

  if (
    protocolChanged &&
    (!policyChanged ||
      (input.basePolicy !== null &&
        input.currentPolicy?.protocolVersion ===
          input.basePolicy.protocolVersion))
  ) {
    return "protocol_version_not_changed";
  }

  return null;
}

function runSelfTest(): void {
  const basePolicy = {
    policyVersion: "story-quality-policy-v1-2026-07",
    protocolVersion: "story-quality-protocol-v1-2026-07",
  };
  const nextPolicy = {
    policyVersion: "story-quality-policy-v2-2026-07",
    protocolVersion: "story-quality-protocol-v2-2026-07",
  };
  const baseInput: StoryQualityImmutabilityInput = {
    changes: [],
    trackedPaths: [],
    basePolicy,
    currentPolicy: basePolicy,
    addedHistoryEvidenceValid: true,
  };
  const cases: Array<
    readonly [
      StoryQualityImmutabilityInput,
      StoryQualityImmutabilityFailure | null,
    ]
  > = [
    [baseInput, null],
    [
      {
        ...baseInput,
        changes: [
          {
            status: "A",
            paths: ["evals/story-quality/history/new.json"],
          },
        ],
      },
      null,
    ],
    [
      {
        ...baseInput,
        changes: [
          {
            status: "M",
            paths: ["evals/story-quality/history/old.json"],
          },
        ],
      },
      "history_not_append_only",
    ],
    [
      {
        ...baseInput,
        changes: [
          {
            status: "A",
            paths: ["evals/story-quality/history/raw.json"],
          },
        ],
        addedHistoryEvidenceValid: false,
      },
      "history_evidence_invalid",
    ],
    [
      {
        ...baseInput,
        changes: [
          {
            status: "C100",
            paths: [
              "outside.json",
              "evals/story-quality/history/copied.json",
            ],
          },
        ],
      },
      "history_not_append_only",
    ],
    [
      {
        ...baseInput,
        trackedPaths: ["evals/story-quality/private/packet.json"],
      },
      "private_material_tracked",
    ],
    [
      {
        ...baseInput,
        changes: [{ status: "M", paths: [POLICY_PATH] }],
      },
      "policy_version_not_increased",
    ],
    [
      {
        ...baseInput,
        changes: [{ status: "M", paths: [POLICY_PATH] }],
        currentPolicy: nextPolicy,
      },
      null,
    ],
    [
      {
        ...baseInput,
        changes: [{ status: "M", paths: [PROTOCOL_PATH] }],
      },
      "protocol_version_not_changed",
    ],
    [
      {
        ...baseInput,
        changes: [
          { status: "M", paths: [POLICY_PATH] },
          { status: "M", paths: [PROTOCOL_PATH] },
        ],
        currentPolicy: {
          ...nextPolicy,
          protocolVersion: basePolicy.protocolVersion,
        },
      },
      "protocol_version_not_changed",
    ],
    [
      {
        ...baseInput,
        changes: [
          { status: "M", paths: [POLICY_PATH] },
          { status: "M", paths: [PROTOCOL_PATH] },
        ],
        currentPolicy: nextPolicy,
      },
      null,
    ],
  ];
  const valid =
    cases.every(
      ([input, expected]) =>
        evaluateStoryQualityImmutability(input) === expected,
    ) &&
    isStrictVersionIncrease("quality-v2", "quality-v10") &&
    !isStrictVersionIncrease("quality-v10", "quality-v2") &&
    parseNameStatus(
      "A\0evals/story-quality/history/new.json\0",
    )?.length === 1 &&
    parseNameStatus("R100\0old.json\0new.json\0")?.[0]?.paths
      .length === 2 &&
    parseNameStatus("invalid\0path\0") === null &&
    isRegularHistoryFileMode("100644") &&
    !isRegularHistoryFileMode("100755") &&
    !isRegularHistoryFileMode("120000") &&
    !isRegularHistoryFileMode("160000") &&
    !isValidAddedHistoryEvidence(
      "evals/story-quality/history/raw.json",
      JSON.stringify({ disclosure: "private" }),
    );
  if (!valid) fail("the built-in policy contract did not hold");
  console.log(
    "Story-quality immutability contract self-test passed.",
  );
}

function main(): void {
  const requestedBase = process.argv[2]?.trim();
  if (requestedBase === "--self-test") {
    runSelfTest();
    return;
  }
  if (!requestedBase || requestedBase.startsWith("-")) {
    fail("pass the pull-request base revision as the first argument");
  }

  const base = git([
    "rev-parse",
    "--verify",
    "--end-of-options",
    `${requestedBase}^{commit}`,
  ]).trim();
  if (!/^[0-9a-f]{40,64}$/i.test(base)) {
    fail("the requested repository state is unavailable");
  }

  const changes = parseNameStatus(
    git([
      "diff",
      "--name-status",
      "-z",
      "--find-renames",
      "--find-copies",
      "--find-copies-harder",
      base,
      "HEAD",
      "--",
    ]),
  );
  if (!changes) {
    fail("the repository change set could not be parsed");
  }

  const trackedOutput = git(["ls-files", "-z", "--", STORY_QUALITY_ROOT]);
  const trackedPaths = trackedOutput.split("\0").filter(Boolean);
  const addedHistoryEvidenceValid = changes
    .filter(
      (change) =>
        change.status === "A" &&
        change.paths.some((path) => isWithin(path, HISTORY_ROOT)),
    )
    .every((change) =>
      change.paths
        .filter((path) => isWithin(path, HISTORY_ROOT))
        .every((path) => {
          const text = gitFile("HEAD", path);
          return (
            isRegularHistoryFileMode(gitFileMode("HEAD", path)) &&
            text !== null &&
            isValidAddedHistoryEvidence(path, text)
          );
        }),
    );

  const basePolicyText = gitFile(base, POLICY_PATH);
  const currentPolicyText = gitFile("HEAD", POLICY_PATH);
  const basePolicy =
    basePolicyText === null ? null : parsePolicyVersions(basePolicyText);
  const currentPolicy =
    currentPolicyText === null ? null : parsePolicyVersions(currentPolicyText);

  if (basePolicyText !== null && basePolicy === null) {
    fail("the base story-quality policy is invalid");
  }

  const failure = evaluateStoryQualityImmutability({
    changes,
    trackedPaths,
    basePolicy,
    currentPolicy,
    addedHistoryEvidenceValid,
  });
  if (failure) fail(FAILURE_MESSAGES[failure]);

  console.log(
    "Story-quality immutability check passed (evidence is append-only).",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
