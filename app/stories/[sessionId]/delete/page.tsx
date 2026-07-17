import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NavigationStatus } from "@/components/NavigationStatus";
import { getAuthUserId } from "@/lib/auth";
import { getOwnedSession } from "@/lib/session";
import { isStorySessionId } from "@/lib/story-deletion";
import { issueStoryDeletionToken } from "@/lib/story-deletion-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delete story — Onward",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function DeleteStoryPage({ params, searchParams }: Props) {
  const { sessionId } = await params;
  if (!isStorySessionId(sessionId)) notFound();

  const userId = await getAuthUserId();
  if (!userId) redirect("/signin");
  const session = await getOwnedSession(sessionId, userId);
  if (!session) notFound();

  // The delete authority depends only on the owned session. Optional artifact
  // playback is deliberately not loaded, so corruption or a slow content store
  // cannot hide the privacy control.
  const query = await searchParams;
  const isAlternate = session.alternateOfSessionId !== null;
  const displayName = `${isAlternate ? "Alternate story" : "Story"} from ${formatStoryTimestamp(session.createdAt)}`;
  const csrfToken = issueStoryDeletionToken(userId, session.sessionId);
  const temporaryError = query.error === "temporary";
  const expiredError = query.error === "expired";

  return (
    <main className="mx-auto max-w-[36rem] px-6 py-24">
      <div className="space-y-8">
        <header className="space-y-3 border-b border-[var(--color-ink-soft)]/30 pb-6">
          <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
            Your stories
          </p>
          <h1 className="text-3xl">Delete this story?</h1>
        </header>

        {temporaryError ? (
          <NavigationStatus
            kind="alert"
            className="border border-[var(--color-accent)] px-4 py-3"
          >
            We couldn&apos;t confirm the deletion. If this story is still here,
            please try again.
          </NavigationStatus>
        ) : expiredError ? (
          <NavigationStatus
            kind="alert"
            className="border border-[var(--color-accent)] px-4 py-3"
          >
            This confirmation expired. Review the details and try again.
          </NavigationStatus>
        ) : null}

        <section aria-labelledby="delete-story-name" className="space-y-4">
          <h2 id="delete-story-name" className="text-xl">
            {displayName}
          </h2>
          <p className="leading-relaxed text-[var(--color-ink-soft)]">
            {isAlternate
              ? "This permanently removes your saved copy of this alternate story, its reading place, and saved feedback. Your first story stays, and deleting this one does not make another alternate available."
              : "This permanently removes your saved copy of this story, its reading place, private context, and saved feedback. Any alternate created from this story is removed too."}
          </p>
          <p className="leading-relaxed text-[var(--color-ink-soft)]">
            This can&apos;t be undone. An unlinked record that deletion was
            requested or completed, and counts already combined into daily
            totals, may remain for up to 30 days; neither contains your account,
            session, or story ID. Historical concern reports stay with the shared
            source and fact record, without your account or session ID, and
            currently have no automatic expiry.
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--color-ink-soft)]/30 pt-6">
          <Link
            href="/stories"
            className="font-ui inline-flex min-h-11 items-center border border-[var(--color-ink)] px-5 py-3 text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Keep story
          </Link>
          <form action="/api/story-delete" method="post">
            <input type="hidden" name="intent" value="delete_story" />
            <input type="hidden" name="sessionId" value={session.sessionId} />
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <button
              type="submit"
              className="font-ui min-h-11 border border-[var(--color-accent)] px-5 py-3 text-sm uppercase tracking-wider text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
            >
              Permanently delete story
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function formatStoryTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
