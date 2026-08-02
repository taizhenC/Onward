// Pure story-output privacy guards. This module intentionally has no provider,
// persistence, or logging dependency so every prose path can use the same rule.

export const SAFE_BRIDGE_DISTANCE_LINE =
  "Your life is not theirs. But a piece of this story may still sit beside you.";

const LEGACY_DISCLOSURE_LINES = [
  /You wrote:\s*["“]\{feeling\}["”]/gi,
  /You wrote:\s*["“]\$\{feeling\}["”]/gi,
];

export function sanitizeLegacyDisclosurePlaceholder(text: string): string {
  const sanitized = LEGACY_DISCLOSURE_LINES.reduce(
    (safe, pattern) => safe.replace(pattern, SAFE_BRIDGE_DISTANCE_LINE),
    text,
  );
  // Backstop for a malformed legacy row whose placeholder isn't wrapped in the
  // canonical "You wrote:" line: a bare token must never render literally.
  return sanitized
    .replace(/\$?\{feeling\}/gi, "")
    .replace(/[^\S\n]{2,}/g, " ");
}

// Runtime defense for future generated artifacts. Exact normalized reflection is
// rejected for every multi-word disclosure and for meaningful single tokens
// (three or more ASCII characters, or two or more non-ASCII code points),
// including short safety-sensitive inputs such as "abused" or "suicidal".
// For longer disclosures, a contiguous eight-word copy is also unsafe. Both
// sides are space-padded so matches align on whole words — "ice person" must
// not flag a story containing "nice person".
export function containsDisclosureEcho(storyText: string, disclosure: string): boolean {
  const story = ` ${normalize(storyText)} `;
  const source = normalize(disclosure);
  const words = source.split(" ").filter(Boolean);
  if (words.length === 0) return false;
  const singleToken = words[0];
  const exactMatchIsSensitive =
    words.length > 1 ||
    singleToken.length >= 3 ||
    (/[^\x00-\x7f]/u.test(singleToken) &&
      [...singleToken].length >= 2);
  if (exactMatchIsSensitive && story.includes(` ${source} `)) {
    return true;
  }
  if (words.length < 8) return false;
  for (let index = 0; index <= words.length - 8; index += 1) {
    if (story.includes(` ${words.slice(index, index + 8).join(" ")} `)) return true;
  }
  return false;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
