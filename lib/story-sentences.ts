// Sentence-level helpers shared by the StorySpec validator and the public
// transparency projection. Both must agree on how canonical prose splits into
// sentences, because `sentenceEvidence.sentenceIndex` is interpreted against
// exactly this split.

export function splitCanonicalSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(
      /(?:(?<=[.!?])|(?<=[.!?]["'”’]))\s+(?=[A-Z0-9"'“‘])/,
    )
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function extractDirectQuotes(text: string): string[] {
  return [
    ...text.matchAll(/(?:“([^”]+)”|"([^"\r\n]+)")/g),
  ].map((match) => (match[1] ?? match[2]).trim());
}

export function countWords(text: string): number {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

// Whole-word, case-sensitive containment. Used to keep named entities out of
// dramatized texture and reader copy without false positives on substrings
// ("Lee" must not match "asleep").
export function containsWholeWord(text: string, needle: string): boolean {
  const trimmed = needle.trim();
  if (!trimmed) return false;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`).test(text);
}
