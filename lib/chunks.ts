import "server-only";
import type { BeatBlueprint } from "./types";

// Tighter than seems necessary on purpose: the goal is *arrivable* reading,
// not efficient reading. Tune up only after walking the build with a real reader.
const CHUNK_CHAR_LIMIT = 240;

// Byte-exact contract: paragraphs are captured as split by /\n\n+/ and re-joined
// with literal "\n\n". `chunks.join("\n\n")` must equal `beat.text` exactly. If a
// beat is authored with `\n\n\n` between paragraphs the smoke assertion fires and
// the editorial fix is to normalize the beat text. No trimming, no collapsing.
export function chunkBeatText(beat: BeatBlueprint): string[] {
  const paragraphs = beat.text
    .split(/\n\n+/)
    .filter((paragraph) => paragraph.length > 0);

  const chunks: string[] = [];

  for (let index = 0; index < paragraphs.length; index += 1) {
    const current = paragraphs[index];
    const next = paragraphs[index + 1];

    if (
      next !== undefined &&
      `${current}\n\n${next}`.length < CHUNK_CHAR_LIMIT
    ) {
      chunks.push(`${current}\n\n${next}`);
      index += 1;
    } else {
      chunks.push(current);
    }
  }

  return chunks;
}
