import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUserId } from "@/lib/auth";
import { getByKey } from "@/lib/figures";
import { listSessionsByUser } from "@/lib/session";
import { SignOutButton } from "@/components/SignOutButton";
import { SetPasswordForm } from "@/components/SetPasswordForm";

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
  finished: boolean;
};

export default async function StoriesPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/signin");

  const sessions = await listSessionsByUser(userId);
  // The lookups are independent, so resolve them concurrently. Today getByKey hits
  // the load-once figure cache (one fetch total), so this is about staying fast if
  // it ever becomes per-call I/O — not about current latency. Order is preserved
  // (created-desc from the store).
  const items = (
    await Promise.all(
      sessions.map(async (session): Promise<StoryListItem | null> => {
        const stage = await getByKey(session.figureKey, session.stageId);
        if (!stage) return null;
        return {
          sessionId: session.sessionId,
          displayName: stage.displayName,
          startedAt: session.createdAt,
          finished: session.nextBeatIndex >= stage.beats.length,
        };
      }),
    )
  ).filter((item): item is StoryListItem => item !== null);

  return (
    <main className="mx-auto max-w-[36rem] px-6 py-24">
      <div className="space-y-12">
        <header className="space-y-3 pb-6 border-b border-[var(--color-ink-soft)]/30 flex items-baseline justify-between">
          <h1 className="text-3xl">Your stories</h1>
          <SignOutButton />
        </header>

        {items.length === 0 ? (
          <p className="text-[var(--color-ink-soft)] leading-relaxed">
            Nothing here yet. A story you finish stays with your account once
            you save it.
          </p>
        ) : (
          <ul className="space-y-6 list-none">
            {items.map((item) => (
              <li key={item.sessionId}>
                <Link
                  href={`/story/${item.sessionId}`}
                  className="block border border-[var(--color-ink-soft)]/40 hover:border-[var(--color-ink)] transition-colors px-5 py-4 space-y-1"
                >
                  <span className="block text-lg">{item.displayName}</span>
                  <span className="block font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
                    {formatDate(item.startedAt)}
                    {item.finished ? " · finished" : " · still open"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <footer className="pt-2">
          <Link
            href="/begin"
            className="font-ui text-sm uppercase tracking-wider border border-[var(--color-ink)] px-6 py-3 inline-block hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] transition-colors"
          >
            Begin another
          </Link>
        </footer>

        <SetPasswordForm />
      </div>
    </main>
  );
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
