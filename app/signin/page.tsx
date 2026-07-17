import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/SignInForm";
import { CRISIS_RESOURCES } from "@/lib/safety";

export const metadata: Metadata = {
  title: "Sign in — Onward",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Masthead — full-bleed rule, then a wider column than the body below. */}
      <div className="border-t-[3px] border-[var(--color-ink)]" />
      <div className="mx-auto w-full max-w-[1080px] px-8">
        <div className="flex items-center justify-between border-b border-[var(--color-ink)]/12 py-[17px]">
          <Link
            href="/"
            className="text-[21px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]"
          >
            Onward
          </Link>
          <span className="hidden font-ui text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-accent)] sm:block">
            A companion for hard seasons
          </span>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-[34rem] flex-1 flex-col justify-center px-7 pb-[72px] pt-14">
        <SignInForm linkError={error === "link"} />
      </main>

      {/* Crisis resources stay visible without any detection, per the privacy
          promise — copy lives in lib/safety.ts so it never drifts from /. */}
      <footer className="mx-auto w-full max-w-[34rem] px-7 pb-14">
        <p className="border-t border-[var(--color-ink)]/10 pt-[22px] font-ui text-[12px] leading-[1.7] text-[var(--color-ink-faint)]">
          In crisis right now? Please reach for people who can help —{" "}
          {CRISIS_RESOURCES.map((resource, index) => (
            <span key={resource.id}>
              {index > 0 ? " · " : null}
              <a
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-ink-soft)] underline underline-offset-2"
              >
                {resource.region}: {resource.action}
              </a>
            </span>
          ))}
        </p>
      </footer>
    </div>
  );
}
