import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[36rem] px-6 py-24 space-y-6">
      <h1 className="text-2xl">There&apos;s no page here.</h1>
      <p className="text-[var(--color-ink-soft)]">
        The link may be stale. The front page is still where it was.
      </p>
      <Link
        href="/"
        className="font-ui text-sm uppercase tracking-wider border border-[var(--color-ink)] px-4 py-2 inline-block hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] transition-colors"
      >
        Go home
      </Link>
    </main>
  );
}
