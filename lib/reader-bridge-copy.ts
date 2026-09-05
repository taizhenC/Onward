import { containsWholeWord, countWords } from "./story-sentences";

// The two distance sentences. Every bridge carries them verbatim; they are the
// only reader-directed copy that needs no further review.
export const READER_BRIDGE_SENTENCES = [
  "Your life is not theirs.",
  "But a piece of this story may still sit beside you.",
] as const;

const READER_BRIDGE_SENTENCE_SET = new Set<string>(
  READER_BRIDGE_SENTENCES,
);

export function isReaderBridgeSentence(value: string): boolean {
  return READER_BRIDGE_SENTENCE_SET.has(value);
}

// Reader-permission sentences close the bridge: one or two short lines that
// give the reader permission to be where they are ("You don't have to know
// how it ends to keep going."). They are hand-authored per story, so the
// validator bounds their shape instead of allowlisting their text.
export const READER_PERMISSION_MAX_SENTENCES = 2;
export const READER_PERMISSION_MIN_WORDS = 3;
export const READER_PERMISSION_MAX_WORDS = 24;

export type ReaderPermissionRejection =
  | "length"
  | "not_second_person"
  | "digits"
  | "quotation"
  | "tone"
  | "names_figure";

// Shared with artifact validation of personalized templates: reader-directed
// copy may never instruct, promise, diagnose, or equate.
export function containsToneViolation(value: string): boolean {
  return /\b(?:you (?:will|must|should|need to|have to be)|everything will|guarantee|diagnos(?:e|is)|clinically|cure[ds]?|your life is (?:the same as|exactly like)|because (?:they|this person) did it,? you)\b/i.test(
    value,
  );
}

export function readerPermissionRejection(
  sentence: string,
  forbiddenNames: readonly string[] = [],
): ReaderPermissionRejection | null {
  const words = countWords(sentence);
  if (
    words < READER_PERMISSION_MIN_WORDS ||
    words > READER_PERMISSION_MAX_WORDS
  ) {
    return "length";
  }
  if (!/\b(?:you|your|yours|yourself)\b/i.test(sentence)) {
    return "not_second_person";
  }
  if (/\d/.test(sentence)) return "digits";
  if (/["“”]/.test(sentence)) return "quotation";
  if (containsToneViolation(sentence)) return "tone";
  if (forbiddenNames.some((name) => containsWholeWord(sentence, name))) {
    return "names_figure";
  }
  return null;
}

export function isReaderPermissionSentence(
  sentence: string,
  forbiddenNames: readonly string[] = [],
): boolean {
  return readerPermissionRejection(sentence, forbiddenNames) === null;
}
