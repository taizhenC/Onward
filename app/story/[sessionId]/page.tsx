import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getByKey, toClientOutline } from "@/lib/figures";
import { getAuthUserId } from "@/lib/auth";
import { getOwnedSession } from "@/lib/session";
import { StoryPlayer } from "@/components/StoryPlayer";

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
  const session = await getOwnedSession(sessionId, await getAuthUserId());
  if (!session) notFound();

  const stage = await getByKey(session.figureKey, session.stageId);
  if (!stage) notFound();

  const outline = toClientOutline(stage);

  return (
    <main className="mx-auto max-w-[36rem] px-6 py-16">
      <StoryPlayer
        sessionId={sessionId}
        outline={outline}
        openingCopy={session.openingCopy}
        initialBeatIndex={session.nextBeatIndex}
        initialChunkIndex={session.nextChunkIndex}
      />
    </main>
  );
}
