import "server-only";
import type { BeatBlueprint, Session } from "./types";

const WORD_DELAY_MS = 40;

export type StreamBeatInput = {
  session: Session;
  beat: BeatBlueprint;
  textOverride?: string;
};

export async function* streamBeat({
  session,
  beat,
  textOverride,
}: StreamBeatInput): AsyncIterable<string> {
  const rawText = textOverride ?? beat.text;
  const text =
    beat.kind === "bridge"
      ? rawText.replaceAll("{feeling}", session.feeling)
      : rawText;

  for (const chunk of toWordChunks(text)) {
    await sleep(WORD_DELAY_MS);
    yield chunk;
  }
}

function toWordChunks(text: string): string[] {
  return text.match(/\s*\S+\s*/g) ?? [];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
