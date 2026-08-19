"use client";

// Branded quiet error boundary. Renders generic prose ONLY — never error.message or
// any error content (the categorical no-logging invariant extends to screens: a raw
// message could echo provider output or user input back in an unintended place).
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-[36rem] px-6 py-24 space-y-6">
      <h1 className="text-2xl">Something broke on our side.</h1>
      <p className="text-[var(--color-ink-soft)]">
        It wasn&apos;t anything you did. You can try again, or come back a
        little later.
      </p>
      <button
        type="button"
        onClick={reset}
        className="font-ui text-sm uppercase tracking-wider border border-[var(--color-accent-deep)] px-4 py-2 inline-block hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)] transition-colors"
      >
        Try again
      </button>
    </main>
  );
}
