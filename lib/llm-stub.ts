import "server-only";
import type { BeatBlueprint, Session } from "./types";

const WORD_DELAY_MS = 40;

export type StreamBeatInput = {
  session: Session;
  beat: BeatBlueprint;
  userChoice?: string;
};

export async function* streamBeat({
  session,
  beat,
  userChoice,
}: StreamBeatInput): AsyncIterable<string> {
  const text = resolveBeatText({ session, beat, userChoice });

  for (const chunk of toWordChunks(text)) {
    await sleep(WORD_DELAY_MS);
    yield chunk;
  }
}

function resolveBeatText({
  session,
  beat,
  userChoice,
}: StreamBeatInput): string {
  if (beat.kind === "bridge") {
    return beat.text.replaceAll("{feeling}", session.feeling);
  }

  if (beat.kind !== "decision") {
    return beat.text;
  }

  if (!userChoice) {
    return beat.text;
  }

  const continuation = beat.decisionContinuations.find(
    (candidate) => candidate.label === userChoice,
  );

  return (
    continuation?.continuationText ??
    beat.decisionContinuations.find((candidate) => candidate.realChoice)
      ?.continuationText ??
    beat.text
  );
}

function toWordChunks(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
