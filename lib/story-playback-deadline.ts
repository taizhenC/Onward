import "server-only";
import { getStoryPlayback } from "./story-playback";
import type { StoryPlayback } from "./story-playback";
import type { Session } from "./types";

type StoryPlaybackLoader = (session: Session) => Promise<StoryPlayback | null>;

// Story labels are optional enrichment on privacy-control surfaces. A corrupt,
// slow, or unavailable artifact must never hide an owner's delete control.
export async function getStoryPlaybackBeforeDeadline(
  session: Session,
  options: {
    budgetMs?: number;
    load?: StoryPlaybackLoader;
  } = {},
): Promise<StoryPlayback | null> {
  const budgetMs = options.budgetMs ?? STORY_LIST_PLAYBACK_BUDGET_MS;
  if (!Number.isSafeInteger(budgetMs) || budgetMs < 1 || budgetMs > 5_000) {
    throw new Error("story playback deadline is invalid");
  }
  const load = options.load ?? getStoryPlayback;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve()
        .then(() => load(session))
        .catch(() => null),
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => resolve(null), budgetMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

const STORY_LIST_PLAYBACK_BUDGET_MS = 500;
