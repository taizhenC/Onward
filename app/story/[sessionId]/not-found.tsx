import Link from "next/link";

export default function StoryNotFound() {
  return (
    <main className="mx-auto max-w-[36rem] px-6 py-24 space-y-6">
      <h1 className="text-2xl">This story has drifted away.</h1>
      <p className="text-[var(--color-ink-soft)]">
        The session may have ended, or the link may be stale. You can begin a
        new one.
      </p>
      <Link
        href="/begin"
        className="font-ui text-sm uppercase tracking-wider border border-[var(--color-accent-deep)] px-4 py-2 inline-block hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)] transition-colors"
      >
        Begin again
      </Link>
    </main>
  );
}
