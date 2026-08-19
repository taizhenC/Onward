import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthOwnerLifecycle } from "@/lib/auth";
import { listSessionsByUser } from "@/lib/session";
import { getStoryPlaybackBeforeDeadline } from "@/lib/story-playback-deadline";
import { SignOutButton } from "@/components/SignOutButton";
import { NavigationStatus } from "@/components/NavigationStatus";
import { SaveStoriesCard } from "@/components/SaveStoriesCard";
import { getOwnerStorySavePresentation } from "@/lib/owner-story-save";
import type { OwnerStorySavePresentation } from "@/lib/owner-story-save-types";

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
  const owner = await getAuthOwnerLifecycle();
  if (!owner) redirect("/signin");

  const query = await searchParams;
  const page = parsePage(query.page);
  const [sessions, saveState] = await Promise.all([
    listSessionsByUser(owner.userId, {
      offset: (page - 1) * STORY_LIST_PAGE_SIZE,
      limit: STORY_LIST_PAGE_SIZE + 1,
    }),
    getOwnerStorySavePresentation(owner),
  ]);
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
          displayName: playback?.outline.displayName ?? "Story",
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
          <h1 className="text-3xl">
            {owner.isAnonymous ? "Your temporary stories" : "Your stories"}
          </h1>
          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/account"
              className="font-ui inline-flex min-h-11 items-center text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
            >
              Account
            </Link>
            {!owner.isAnonymous ? <SignOutButton /> : null}
          </div>
        </header>

        <StoryLibraryRetention
          isAnonymous={owner.isAnonymous}
          saveState={saveState}
        />

        {owner.isAnonymous && saveState.status !== "saved" ? (
          <SaveStoriesCard
            isAnonymous={owner.isAnonymous}
            savePresentation={saveState}
          />
        ) : null}

        {query.deletion === "complete" ? (
          <NavigationStatus className="border border-[var(--color-ink-soft)]/40 px-4 py-3">
            Story deleted.
          </NavigationStatus>
        ) : null}

        {items.length === 0 ? (
          <p className="text-[var(--color-ink-soft)] leading-relaxed">
            {emptyLibraryCopy(saveState)}
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
            aria-label="Story pages"
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
            className="font-ui inline-flex min-h-11 items-center border border-[var(--color-accent-deep)] px-6 py-3 text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Begin another
          </Link>
        </footer>
      </div>
    </main>
  );
}

function StoryLibraryRetention({
  isAnonymous,
  saveState,
}: {
  isAnonymous: boolean;
  saveState: OwnerStorySavePresentation;
}) {
  if (saveState.status === "temporary") {
    return (
      <section
        aria-labelledby="story-library-retention"
        className="space-y-2 border-l-2 border-[var(--color-accent)] pl-4"
      >
        <h2 id="story-library-retention" className="text-xl">
          Temporary guest library
        </h2>
        <p className="leading-relaxed text-[var(--color-ink-soft)]">
          This guest account and every story in it are deleted about six hours
          after the latest story creation or saved reading progress. Confirming
          an email below is what changes the whole account to permanent.
        </p>
      </section>
    );
  }

  if (saveState.status === "saved") {
    return (
      <section
        aria-labelledby="story-library-retention"
        className="space-y-2 border-l-2 border-[var(--color-accent)] pl-4"
      >
        <h2 id="story-library-retention" className="text-xl">
          Permanent story library
        </h2>
        <p className="leading-relaxed text-[var(--color-ink-soft)]">
          This account keeps every current and future story until you delete
          the story or account, including each story&apos;s generated wording and
          the age used to find it. What you wrote before a story still clears
          after its fixed 60-day deadline.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="story-library-retention"
      className="space-y-2 border-l-2 border-[var(--color-accent)] pl-4"
    >
      <h2 id="story-library-retention" className="text-xl">
        Save status unavailable
      </h2>
      <p role="status" className="leading-relaxed text-[var(--color-ink-soft)]">
        Onward cannot verify the durable save record for this{" "}
        {isAnonymous ? "guest account" : "account"} right now, so this page does
        not promise permanent storage. Refresh or return later before relying
        on this as a permanent library.
      </p>
    </section>
  );
}

function emptyLibraryCopy(
  saveState: OwnerStorySavePresentation,
): string {
  if (saveState.status === "temporary") {
    return "Nothing here yet. A story you begin will belong to this temporary guest library.";
  }
  if (saveState.status === "saved") {
    return "Nothing here yet. Stories you create with this permanent account will remain until you delete them or the account.";
  }
  return "Nothing here yet. Begin a story when you are ready.";
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
