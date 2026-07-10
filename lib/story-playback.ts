import "server-only";
import { chunkBeatText } from "./chunks";
import { getByKey, toClientOutline } from "./figures";
import { toClientArtifactOutline } from "./story-artifact";
import { getOwnedStoryArtifact } from "./story-artifacts";
import { sanitizeLegacyDisclosurePlaceholder } from "./story-privacy";
import type {
  BeatKind,
  BeatRole,
  ClientFigureOutline,
  OpeningCopy,
  Session,
} from "./types";

export type StoryPlaybackBeat = {
  kind: BeatKind;
  role: BeatRole;
  chunks: string[];
};

export type StoryPlayback = {
  outline: ClientFigureOutline;
  beats: StoryPlaybackBeat[];
  openingCopy: OpeningCopy;
  source: "artifact" | "legacy_stage";
};

export async function getStoryPlayback(session: Session): Promise<StoryPlayback | null> {
  if (session.storyArtifactId) {
    const artifact = await getOwnedStoryArtifact(
      session.storyArtifactId,
      session.userId,
      session.sessionId,
    );
    // Never fall through: a missing/corrupt owned artifact is an integrity error,
    // not permission to serve whatever prose the stage contains today.
    if (
      !artifact ||
      artifact.figureKey !== session.figureKey ||
      artifact.stageId !== session.stageId
    ) {
      return null;
    }
    return {
      outline: toClientArtifactOutline(artifact),
      beats: artifact.beats.map((beat) => ({
        kind: beat.kind,
        role: beat.role,
        chunks: beat.chunks,
      })),
      openingCopy: artifact.openingCopy,
      source: "artifact",
    };
  }

  // Compatibility for pre-0005 sessions only. New session creation requires an
  // artifact; permanent saved legacy sessions still require an explicit backfill
  // before this compatibility path can be removed.
  const stage = await getByKey(session.figureKey, session.stageId);
  if (!stage) return null;
  return {
    outline: toClientOutline(stage),
    beats: stage.beats.map((beat) => ({
      kind: beat.kind,
      role: beat.role,
      chunks: chunkBeatText({
        ...beat,
        text: sanitizeLegacyDisclosurePlaceholder(beat.text),
      }),
    })),
    openingCopy: session.openingCopy,
    source: "legacy_stage",
  };
}
