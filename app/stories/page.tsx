import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUserId } from "@/lib/auth";
import { listSessionsByUser } from "@/lib/session";
import { getStoryPlaybackBeforeDeadline } from "@/lib/story-playback-deadline";
import { SignOutButton } from "@/components/SignOutButton";
import { NavigationStatus } from "@/components/NavigationStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your stories — Onward",
  robots: { index: false, follow: false },
};

// The listing shows figure + date + progress ONLY — never the user's feeling. List
// surfaces keep disclosures out of view by default.
type StoryListItem = {
  sessionId: string;
  displayName: string;
  startedAt: number;
  finished: boolean | null;
};

type Props = {
  searchParams: Promise<{
    deletion?: string | string[];
    page?: string | string[];
  }>;
};

export default async function StoriesPage({ searchParams }: Props) {
  const userId = await getAuthUserId();
  if (!userId) redirect("/signin");

  const query = await searchParams;
  const page = parsePage(query.page);
  const sessions = await listSessionsByUser(userId, {
    offset: (page - 1) * STORY_LIST_PAGE_SIZE,
    limit: STORY_LIST_PAGE_SIZE + 1,
  });
  const hasOlderStories = sessions.length > STORY_LIST_PAGE_SIZE;
  const pageSessions = sessions.slice(0, STORY_LIST_PAGE_SIZE);
  if (page > 1 && pageSessions.length === 0) redirect("/stories");
  // Labels are independent optional enrichment, so resolve them concurrently
  // behind a hard deadline. Order remains created-desc from the store.
  const items = (
    await Promise.all(
      pageSessions.map(async (session): Promise<StoryListItem> => {
        // A corrupt/retired artifact must not make its owner lose the delete
        // control. Keep the row with a disclosure-free fallback label.
        const playback = await getStoryPlaybackBeforeDeadline(session);
        return {
          sessionId: session.sessionId,
          displayName: playback?.outline.displayName ?? "Saved story",
          startedAt: session.createdAt,
          finished: playback
            ? session.nextBeatIndex >= playback.beats.length
            : null,
        };
      }),
    )
  );

  return (
    <main className="mx-auto max-w-[36rem] px-6 py-24">
      <div className="space-y-12">
        <header className="space-y-3 pb-6 border-b border-[var(--color-ink-soft)]/30 flex items-baseline justify-between">
          <h1 className="text-3xl">Your stories</h1>
          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/account"
              className="font-ui inline-flex min-h-11 items-center text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
            >
              Account
            </Link>
            <SignOutButton />
          </div>
        </header>

        {query.deletion === "complete" ? (
          <NavigationStatus className="border border-[var(--color-ink-soft)]/40 px-4 py-3">
            Story deleted.
          </NavigationStatus>
        ) : null}

        {items.length === 0 ? (
          <p className="text-[var(--color-ink-soft)] leading-relaxed">
            Nothing here yet. A story you finish stays with your account once
            you save it.
          </p>
        ) : (
          <ul className="space-y-6 list-none">
            {items.map((item, index) => (
              <li key={item.sessionId}>
                <article className="border border-[var(--color-ink-soft)]/40 transition-colors hover:border-[var(--color-ink)]">
                  <Link
                    href={`/story/${item.sessionId}`}
                    className="block space-y-1 px-5 py-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
                  >
                    <span className="block text-lg">{item.displayName}</span>
                    <span className="block font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
                      {formatStoryTimestamp(item.startedAt)}
                      {item.finished === null
                        ? ""
                        : item.finished
                          ? " · finished"
                          : " · still open"}
                    </span>
                  </Link>
                  <div className="border-t border-[var(--color-ink-soft)]/30 px-5 py-3">
                    <Link
                      href={`/stories/${item.sessionId}/delete`}
                      aria-label={`Delete ${item.displayName}, started ${formatStoryTimestamp(item.startedAt)}, story ${index + 1} on this page`}
                      className="font-ui inline-flex min-h-11 items-center text-xs uppercase tracking-widest text-[var(--color-accent)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
                    >
                      Delete story
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}

        {page > 1 || hasOlderStories ? (
          <nav
            aria-label="Saved story pages"
            className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-ink-soft)]/30 pt-5"
          >
            {page > 1 ? (
              <Link
                href={page === 2 ? "/stories" : `/stories?page=${page - 1}`}
                className="font-ui inline-flex min-h-11 items-center text-sm uppercase tracking-wider underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
              >
                Newer stories
              </Link>
            ) : (
              <span />
            )}
            {hasOlderStories ? (
              <Link
                href={`/stories?page=${page + 1}`}
                className="font-ui inline-flex min-h-11 items-center text-sm uppercase tracking-wider underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
              >
                Older stories
              </Link>
            ) : null}
          </nav>
        ) : null}

        <footer className="pt-2">
          <Link
            href="/begin"
            className="font-ui inline-flex min-h-11 items-center border border-[var(--color-ink)] px-6 py-3 text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Begin another
          </Link>
        </footer>
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

function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,5}$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : 1;
}

const STORY_LIST_PAGE_SIZE = 20;
