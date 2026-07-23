import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthUserId } from "@/lib/auth";
import { getOwnedSession } from "@/lib/session";
import { StoryPlayer } from "@/components/StoryPlayer";
import { getStoryPlayback } from "@/lib/story-playback";
import { getOwnedStoryArtifact } from "@/lib/story-artifacts";
import { getResonanceFeedbackPresentation } from "@/lib/resonance-feedback";
import type { ResonanceFeedbackPresentation } from "@/lib/resonance-feedback-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stories are private; never indexed (robots.ts disallows /story/ too — belt and
// suspenders for links that leak).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function StoryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  // Ownership chokepoint: absent user, unknown id, and someone else's story are all
  // the same 404 ("this story has drifted away").
  const userId = await getAuthUserId();
  const session = await getOwnedSession(sessionId, userId);
  if (!session) notFound();

  const playback = await getStoryPlayback(session);
  if (!playback) notFound();
  const outline = playback.outline;
  let initialFeedback: ResonanceFeedbackPresentation = {
    status: "unanswered",
  };
  let feedbackAvailable = playback.source === "artifact";
  if (userId && session.storyArtifactId && playback.source === "artifact") {
    try {
      const artifact = await getOwnedStoryArtifact(
        session.storyArtifactId,
        userId,
        session.sessionId,
      );
      if (artifact) {
        initialFeedback = await getResonanceFeedbackPresentation({
          userId,
          session,
          artifact,
        });
      } else {
        feedbackAvailable = false;
      }
    } catch {
      // Feedback is optional. A read-path outage must not hide a valid story.
      feedbackAvailable = false;
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Masthead — a quiet way out: home, or your saved stories, at any point
          in the read (matches the /signin and / mastheads). */}
      <div className="border-t-[3px] border-[var(--color-ink)]" />
      <div className="mx-auto w-full max-w-[1080px] px-8">
        <div className="flex items-center justify-between border-b border-[var(--color-ink)]/12 py-[17px]">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-[21px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]"
          >
            Onward
          </Link>
          <Link
            href="/stories"
            className="inline-flex min-h-11 items-center border-b border-[var(--color-ink)]/30 font-ui text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Your stories
          </Link>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[36rem] px-6 py-16">
        <StoryPlayer
          key={sessionId}
          sessionId={sessionId}
          outline={outline}
          openingCopy={playback.openingCopy}
          contentNote={playback.contentNote}
          transparency={playback.transparency}
          framing={session.framing}
          initialBeatIndex={session.nextBeatIndex}
          initialChunkIndex={session.nextChunkIndex}
          completedBridgeText={
            session.nextBeatIndex >= playback.beats.length
              ? playback.beats.at(-1)?.chunks.join(" ") ?? null
              : null
          }
          feedbackAvailable={feedbackAvailable}
          initialFeedback={initialFeedback}
        />
      </main>
    </div>
  );
}
