// Read-only editorial packet check. No environment, database or provider access.
// Run from any directory: node <this-file>
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const packet = dirname(fileURLToPath(import.meta.url));
const repo = resolve(packet, "../../..");
const read = path => readFileSync(path, "utf8");
const json = path => JSON.parse(read(path));
const sha = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const old = json(resolve(packet, "../remaining-story-review-2026-09-20/review-targets.json"));
const index = json(resolve(packet, "review-targets.json"));
assert.equal(index.kind, "editorial-review-index-not-promotion-authority");
assert.equal(index.approval, "none");
assert.equal(index.targets.length, 26);
assert.deepEqual(index.targets.map(x => x.figureKey).sort(),
  old.targets.filter(x => x.disposition === "hold").map(x => x.figureKey).sort());

for (const target of old.targets) {
  assert.equal(sha(resolve(repo, target.path)), target.sha256,
    `Old snapshot changed: ${target.figureKey}`);
}

const listedPaths = new Set();
const ids = new Set();
for (const target of index.targets) {
  const path = resolve(repo, target.path);
  const inside = relative(packet, path);
  assert(!isAbsolute(inside) && !inside.startsWith(`..${sep}`) && inside !== "..",
    "Target outside new packet");
  assert(!listedPaths.has(path), "Duplicate candidate path");
  listedPaths.add(path);
  assert.equal(sha(path), target.sha256, `New hash mismatch: ${target.figureKey}`);
  const spec = json(path);
  assert.equal(spec.figureKey, target.figureKey);
  assert.equal(spec.status, "draft");
  assert.deepEqual(spec.review, {});
  assert(!ids.has(spec.storySpecId), "Duplicate story identity");
  ids.add(spec.storySpecId);
  assert.equal(spec.arc.length, 7);
  assert.equal(spec.arc.map(beat => beat.canonicalText).join(" ").trim().split(/\s+/).length,
    target.words, `Word count mismatch: ${target.figureKey}`);
  assert.equal(target.format, "source-led-vignette");
  assert.equal(typeof target.integrationHold, "boolean");
  assert.equal(target.disposition, "for-owner-reading");
  const readingCopy = read(resolve(dirname(path), "READING-COPY.md"));
  assert(readingCopy.includes(target.sha256), `Missing reading hash: ${target.figureKey}`);
  const crossReview = read(resolve(dirname(path), "CROSS-REVIEW.md"));
  assert(crossReview.includes(target.sha256), `Cross-review hash stale: ${target.figureKey}`);
  const receipt = json(resolve(dirname(path), "STRUCTURAL-CHECK.json"));
  const checked = receipt.candidates.find(candidate => candidate.figureKey === target.figureKey);
  assert.equal(checked?.sha256, target.sha256, `Structural receipt stale: ${target.figureKey}`);
  assert.equal(checked.words, target.words);
  for (const count of [checked.draftErrors, checked.draftWarnings,
    checked.publicationErrors, checked.publicationWarnings]) assert.equal(count, 0);
  for (const beat of spec.arc) {
    assert(readingCopy.includes(beat.canonicalText),
      `Reading copy differs: ${target.figureKey}/${beat.role}`);
  }
}

for (const [set, count] of [[1, 9], [2, 9], [3, 8]]) {
  const dir = resolve(packet, `set-${set}`);
  const names = readdirSync(dir).filter(x => x.endsWith(".candidate.json")).sort();
  assert.equal(names.length, count);
  const hashes = json(resolve(dir, "candidate-sha256.json"));
  assert.deepEqual(Object.keys(hashes).sort(), names);
  for (const name of names) {
    const path = resolve(dir, name);
    assert(listedPaths.has(path), `Unindexed candidate: ${name}`);
    assert.equal(sha(path), hashes[name], `Set hash mismatch: ${name}`);
  }
}

console.log(JSON.stringify({ ok: true, candidates: index.targets.length,
  previousSnapshotsUnchanged: old.targets.length, setSizes: [9, 9, 8],
  exactReadingCopies: true, crossReviewHashesPresent: true, structuralReceiptHashesMatch: true,
  approval: "none", productionWrites: false }, null, 2));
