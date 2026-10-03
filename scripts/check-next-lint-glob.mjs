import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { ESLint } from "eslint";

const require = createRequire(import.meta.url);
const repository = process.cwd();
const pluginPackagePath = require.resolve("@next/eslint-plugin-next/package.json");
const pluginDirectory = path.dirname(pluginPackagePath);
const pluginPackage = require(pluginPackagePath);
const pluginRequire = createRequire(pluginPackagePath);
const installedGlob = pluginRequire("fast-glob");
const authoredGlob = require("../vendor/next-lint-glob/index.cjs");
const rootUtilityPath = path.join(pluginDirectory, "dist/utils/get-root-dirs.js");
const { getRootDirs } = require(rootUtilityPath);
const plugin = require("@next/eslint-plugin-next");
const referenceArgument = process.argv.slice(2).find((argument) => argument.startsWith("--reference-fast-glob="));
assert.equal(process.argv.length - 2, referenceArgument ? 1 : 0, "Only the optional read-only reference path is accepted");
const reference = referenceArgument ? require(path.resolve(referenceArgument.split("=").slice(1).join("="))) : null;

assert.equal(pluginPackage.version, "15.5.26", "Review the glob contract before changing the Next plugin version");
assert.equal(pluginPackage.dependencies["fast-glob"], "3.3.1");
assert.equal(pluginRequire("fast-glob/package.json").name, "@onward/next-lint-glob");
assert.deepEqual(Object.keys(installedGlob), ["globSync"]);
assert.equal(
  createHash("sha256").update(fs.readFileSync(rootUtilityPath)).digest("hex"),
  "886677432990a735e5ebdfb345ff1cbd40e264f9947a8432eeeb254b3a926bde",
  "Review any change to the actual Next glob caller before updating this pin",
);
assert.equal(
  createHash("sha256").update(fs.readFileSync(pluginRequire.resolve("fast-glob"))).digest("hex"),
  createHash("sha256").update(fs.readFileSync(path.join(repository, "vendor/next-lint-glob/index.cjs"))).digest("hex"),
  "npm ci must install the current authored compatibility module",
);

const globConsumers = [];
function inspectConsumers(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) inspectConsumers(entryPath);
    else if (entry.name.endsWith(".js") && /require\(["']fast-glob["']\)/.test(fs.readFileSync(entryPath, "utf8"))) {
      globConsumers.push(path.relative(pluginDirectory, entryPath).replaceAll("\\", "/"));
    }
  }
}
inspectConsumers(path.join(pluginDirectory, "dist"));
assert.deepEqual(globConsumers, ["dist/utils/get-root-dirs.js"], "A new fast-glob consumer needs a compatibility review");

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "onward-next-lint-glob-"));
const fixtureParent = fs.realpathSync(os.tmpdir());
assert.equal(path.dirname(fs.realpathSync(fixture)), fixtureParent, "Temporary fixture must remain directly under the OS temp directory");
const relativeDirectories = [
  "pages",
  "apps",
  "apps/project-a",
  "apps/project-a/pages",
  "apps/project-b",
  "apps/project-b/pages",
  "apps/.hidden-project",
  "apps/.hidden-project/pages",
  "ranges",
  "ranges/project-1",
  "ranges/project-1/pages",
  "ranges/project-2",
  "ranges/project-2/pages",
];
const visibleDirectories = relativeDirectories.filter((directory) => !directory.includes("/."));
for (const directory of relativeDirectories) fs.mkdirSync(path.join(fixture, directory), { recursive: true });
for (const directory of ["pages", "apps/project-a/pages", "apps/project-b/pages", "apps/.hidden-project/pages", "ranges/project-1/pages", "ranges/project-2/pages"]) {
  fs.writeFileSync(path.join(fixture, directory, "known.js"), "export default function Known() {}\n");
}
fs.writeFileSync(path.join(fixture, "apps/readme.md"), "Not a root directory\n");
fs.mkdirSync(path.join(fixture, "linked"));
fs.symlinkSync(path.join(fixture, "apps/project-a"), path.join(fixture, "linked/project-link"), process.platform === "win32" ? "junction" : "dir");
visibleDirectories.push("linked", "linked/project-link", "linked/project-link/pages");
const absoluteA = path.join(fixture, "apps/project-a").replaceAll("\\", "/");
const absoluteB = path.join(fixture, "apps/project-b").replaceAll("\\", "/");
const absoluteFixture = fixture.replaceAll("\\", "/");
const rootCases = [
  { name: "default root", root: undefined, expected: [fixture] },
  { name: "relative literal", root: "apps/project-a", expected: ["apps/project-a"] },
  { name: "relative dot prefix", root: "./apps/project-a", expected: ["./apps/project-a"] },
  { name: "literal trailing slash", root: "apps/project-a/", expected: ["apps/project-a/"] },
  { name: "absolute project root", root: absoluteA, expected: [absoluteA] },
  { name: "absolute working directory", root: absoluteFixture, expected: [absoluteFixture] },
  { name: "Windows separators", root: absoluteA.replaceAll("/", "\\"), expected: [absoluteA] },
  { name: "directory wildcard excludes files and dot roots", root: "apps/*", expected: ["apps/project-a", "apps/project-b"] },
  { name: "directory wildcard with dot prefix", root: "./apps/*", expected: ["./apps/project-a", "./apps/project-b"] },
  { name: "parent-relative directory wildcard", root: `../${path.basename(fixture)}/apps/*`, expected: [`../${path.basename(fixture)}/apps/project-a`, `../${path.basename(fixture)}/apps/project-b`] },
  { name: "absolute directory wildcard", root: `${absoluteFixture}/apps/*`, expected: [absoluteA, absoluteB] },
  { name: "globstar excludes traversal root", root: "apps/**", expected: visibleDirectories.filter((directory) => directory.startsWith("apps/")) },
  { name: "globstar with trailing slash", root: "apps/**/", expected: visibleDirectories.filter((directory) => directory.startsWith("apps/")) },
  { name: "bare globstar", root: "**", expected: visibleDirectories },
  { name: "bare globstar slash", root: "**/", expected: visibleDirectories },
  { name: "brace root choices", root: "apps/{project-a,project-b}", expected: ["apps/project-a", "apps/project-b"] },
  { name: "brace roots with globstar", root: "apps/{project-a,project-b}/**", expected: ["apps/project-a/pages", "apps/project-b/pages"] },
  { name: "brace alternatives include globstar", root: "{apps/project-a/**,apps/project-b}", expected: ["apps/project-a/pages", "apps/project-b"] },
  { name: "brace range roots", root: "ranges/project-{1..2}", expected: ["ranges/project-1", "ranges/project-2"] },
  { name: "extglob root choices", root: "apps/@(project-a|project-b)", expected: ["apps/project-a", "apps/project-b"] },
  { name: "negative extglob retains a matching hidden root", root: "apps/!(project-a)", expected: ["apps/project-b", "apps/.hidden-project"] },
  { name: "explicit hidden root", root: "apps/.hidden-project", expected: ["apps/.hidden-project"] },
  { name: "explicit hidden wildcard", root: "apps/.hidden-*", expected: ["apps/.hidden-project"] },
  { name: "missing literal", root: "apps/missing", expected: [] },
  { name: "file literal is not a directory", root: "apps/readme.md", expected: [] },
  { name: "junction literal root", root: "linked/project-link", expected: ["linked/project-link"] },
  { name: "junction wildcard root", root: "linked/*", expected: ["linked/project-link"] },
  { name: "junction globstar", root: "linked/**", expected: ["linked/project-link", "linked/project-link/pages"] },
  { name: "root array preserves roots and ignores nonstrings", root: ["apps/project-a", absoluteB, null, 7], expected: ["apps/project-a", absoluteB] },
];
const sorted = (values) => [...values].sort();
let differentialCases = 0;
let ruleCases = 0;

try {
  process.chdir(fixture);
  for (const test of rootCases) {
    const context = { cwd: fixture, settings: { next: { rootDir: test.root } } };
    assert.deepEqual(sorted(getRootDirs(context)), sorted(test.expected), test.name);
    if (reference && test.root !== undefined) {
      const patterns = Array.isArray(test.root) ? test.root.filter((root) => typeof root === "string") : [test.root];
      const original = patterns.flatMap((pattern) => reference.globSync(pattern.replaceAll("\\", "/"), { onlyDirectories: true }));
      const replacement = patterns.flatMap((pattern) => authoredGlob.globSync(pattern.replaceAll("\\", "/"), { onlyDirectories: true }));
      assert.deepEqual(sorted(replacement), sorted(original), `Original fast-glob parity: ${test.name}`);
      differentialCases++;
    }
    if (test.expected.length === 0) continue;
    const eslint = new ESLint({
      cwd: fixture,
      overrideConfigFile: true,
      overrideConfig: [{
        files: ["**/*.jsx"],
        languageOptions: { ecmaVersion: "latest", sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } },
        plugins: { "@next/next": plugin },
        settings: { next: { rootDir: test.root } },
        rules: { "@next/next/no-html-link-for-pages": "error" },
      }],
    });
    const positive = await eslint.lintText('export default () => <a href="/known">Known</a>;', { filePath: "probe.jsx" });
    const hasKnownPage = test.expected.some((root) => fs.existsSync(path.join(root, "pages/known.js")));
    assert.equal(positive[0].messages.some((message) => message.ruleId === "@next/next/no-html-link-for-pages"), hasKnownPage, `Actual Next rule detects a known internal route when a matched root contains it: ${test.name}`);
    const negative = await eslint.lintText('export default () => <a href="https://example.com/known">External</a>;', { filePath: "probe.jsx" });
    assert.equal(negative[0].errorCount, 0, `Actual Next rule permits an external link: ${test.name}`);
    ruleCases += 2;
  }
  for (const [pattern, options] of [["apps/*", {}], ["apps/*", { onlyDirectories: false }], ["apps/*", { onlyDirectories: true, dot: true }], [[], { onlyDirectories: true }], ["", { onlyDirectories: true }]]) {
    assert.throws(() => authoredGlob.globSync(pattern, options), TypeError);
  }
} finally {
  process.chdir(repository);
  assert.equal(path.dirname(fs.realpathSync(fixture)), fixtureParent, "Verify the cleanup target remains the created OS temp fixture");
  assert(path.basename(fixture).startsWith("onward-next-lint-glob-"));
  fs.rmSync(fixture, { recursive: true, force: true });
}

console.log(JSON.stringify({ ok: true, rootCases: rootCases.length, actualNextRuleCases: ruleCases, rejectedUnsupportedCalls: 5, differentialCases, pluginVersion: pluginPackage.version, replacement: "@onward/next-lint-glob@1.0.0", globVersion: "13.0.6" }));
