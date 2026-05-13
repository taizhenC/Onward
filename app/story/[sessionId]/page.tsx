import { notFound } from "next/navigation";
import { getByKey, toClientOutline } from "@/lib/figures";
import { getSession } from "@/lib/session";
import { StoryPlayer } from "@/components/StoryPlayer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function StoryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = getSession(sessionId);
  if (!session) notFound();

  const stage = getByKey(session.figureKey, session.stageId);
  if (!stage) notFound();

  const outline = toClientOutline(stage);

  return (
    <main className="mx-auto max-w-[36rem] px-6 py-16">
      <StoryPlayer
        sessionId={sessionId}
        outline={outline}
        framing={session.framing}
        initialBeatIndex={session.nextBeatIndex}
      />
    </main>
  );
}
