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
