import "server-only";
import type { BeatBlueprint } from "./types";

// Tighter than seems necessary on purpose: the goal is *arrivable* reading,
// not efficient reading. Tune up only after walking the build with a real reader.
export const CHUNK_CHAR_LIMIT = 240;

const PARAGRAPH_SEPARATOR = "\n\n";

export function chunkBeatText(beat: BeatBlueprint): string[] {
  const paragraphs = beat.text
    .split(/\n\n+/)
    .filter((paragraph) => paragraph.length > 0);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const segments = splitOversizedParagraph(paragraph);

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const separator =
        current.length > 0 && index === 0 ? PARAGRAPH_SEPARATOR : "";
      const nextLength = current.length + separator.length + segment.length;

      if (current.length > 0 && nextLength > CHUNK_CHAR_LIMIT) {
        chunks.push(current);
        current = segment;
      } else {
        current = `${current}${separator}${segment}`;
      }
    }
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

function splitOversizedParagraph(paragraph: string): string[] {
  if (paragraph.length <= CHUNK_CHAR_LIMIT) return [paragraph];

  const words = paragraph.split(/\s+/).filter((word) => word.length > 0);
  const segments: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > CHUNK_CHAR_LIMIT) {
      if (current.length > 0) {
        segments.push(current);
        current = "";
      }

      for (let index = 0; index < word.length; index += CHUNK_CHAR_LIMIT) {
        segments.push(word.slice(index, index + CHUNK_CHAR_LIMIT));
      }
      continue;
    }

    const candidate = current.length > 0 ? `${current} ${word}` : word;
    if (candidate.length > CHUNK_CHAR_LIMIT) {
      segments.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current.length > 0) {
    segments.push(current);
  }

  return segments;
}
