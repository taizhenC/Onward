// Pure story-output privacy guards. This module intentionally has no provider,
// persistence, or logging dependency so every prose path can use the same rule.

export const SAFE_BRIDGE_DISTANCE_LINE =
  "Your life is not theirs. But a piece of this story may still sit beside you.";

const LEGACY_DISCLOSURE_LINES = [
  /You wrote:\s*["“]\{feeling\}["”]/gi,
  /You wrote:\s*["“]\$\{feeling\}["”]/gi,
];

export function sanitizeLegacyDisclosurePlaceholder(text: string): string {
  return LEGACY_DISCLOSURE_LINES.reduce(
    (safe, pattern) => safe.replace(pattern, SAFE_BRIDGE_DISTANCE_LINE),
    text,
  );
}

// Runtime defense for future generated artifacts. Exact normalized reflection is
// always rejected. For longer disclosures, a contiguous eight-word copy is also
// considered an unsafe echo; approved generic phrases are far shorter than this.
export function containsDisclosureEcho(storyText: string, disclosure: string): boolean {
  const story = normalize(storyText);
  const source = normalize(disclosure);
  if (source.length < 10) return false;
  if (story.includes(source)) return true;

  const words = source.split(" ").filter(Boolean);
  if (words.length < 8) return false;
  for (let index = 0; index <= words.length - 8; index += 1) {
    if (story.includes(words.slice(index, index + 8).join(" "))) return true;
  }
  return false;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
