import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function source(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

function themeColor(css: string, name: string): string {
  const match = css.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"));
  assert(match, `missing ${name} theme color`);
  return match[1];
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/../g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  assert(channels?.length === 3, `invalid color ${hex}`);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(left: string, right: string): number {
  const brighter = Math.max(relativeLuminance(left), relativeLuminance(right));
  const darker = Math.min(relativeLuminance(left), relativeLuminance(right));
  return (brighter + 0.05) / (darker + 0.05);
}

function checkTextContrast(): void {
  const css = source("app/globals.css");
  const background = themeColor(css, "--color-bg");
  const faintInk = themeColor(css, "--color-ink-faint");
  assert(contrastRatio(faintInk, background) >= 4.5, "quiet normal-sized text must meet WCAG AA contrast");
  assert(!source("app/page.tsx").includes("#8a8378"), "landing copy must not restore the failing legacy text color");
}

function checkLandingStructureAndMotion(): void {
  const landing = source("app/page.tsx");
  assert.equal(landing.match(/<main(?:\s|>)/g)?.length, 1, "landing needs one main");
  assert.equal(landing.match(/<h1(?:\s|>)/g)?.length, 1, "landing needs one h1");
  assert((landing.match(/<h2(?:\s|>)/g)?.length ?? 0) >= 3, "each landing section needs a level-two heading");
  assert.match(landing, /<h2[^>]*>\s*How it works\s*<\/h2>/s);
  assert.match(landing, /<h2[^>]*>\s*What a story looks like\s*<\/h2>/s);
  assert(!landing.includes("HERO_QUOTES"), "hero copy must not auto-rotate");
  assert(!landing.includes("ow-hero-cycle"), "hero copy must not animate forever");
}

function checkReaderMotionAndKeyboard(): void {
  const reader = source("components/StoryBeat.tsx");
  assert(reader.includes("useReducedMotion"), "reader must observe reduced motion");
  assert(
    reader.includes("shouldReduceMotion ? totalTokens : revealedCount"),
    "reduced motion must reveal every buffered word immediately",
  );
  assert(!/addEventListener\("keydown"/.test(reader), "reader must not capture document-wide keyboard scrolling");
  assert(reader.includes("Show full passage"), "reader needs an explicit reveal action");
}

checkTextContrast();
checkLandingStructureAndMotion();
checkReaderMotionAndKeyboard();

console.log("Onward core accessibility validator");
console.log("=====================================");
console.log("PASS quiet text meets WCAG AA contrast");
console.log("PASS landing has stable content and navigable heading landmarks");
console.log("PASS reader honors reduced motion without stealing Space scrolling");
