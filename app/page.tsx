import Link from "next/link";
import { CRISIS_RESOURCES } from "@/lib/safety";

// The front door. Static, quiet, plain — it should read like the first page of a
// small book, not a product site. No marketing language, no feature lists.

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-[36rem] px-6 py-24">
      <div className="space-y-20">
        <header className="space-y-6">
          <h1 className="text-4xl">Onward</h1>
          <p className="text-lg leading-relaxed">
            You write a few sentences about what you&apos;re going through.
            Onward finds a real person from history who, at about your age,
            lived through something that felt the same — and walks you through
            their story, slowly, one page at a time.
          </p>
          <div className="pt-2">
            <Link
              href="/begin"
              className="inline-block font-ui text-sm uppercase tracking-wider border border-[var(--color-ink)] px-6 py-3 hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] transition-colors"
            >
              Begin
            </Link>
          </div>
        </header>

        <section className="space-y-5">
          <SectionLabel>How it works</SectionLabel>
          <ol className="space-y-4 list-none">
            <li className="leading-relaxed">
              <span className="text-[var(--color-accent)]">1.</span>&nbsp; Say
              what you&apos;re carrying. A few honest sentences are enough.
            </li>
            <li className="leading-relaxed">
              <span className="text-[var(--color-accent)]">2.</span>&nbsp; We
              look for a real person whose documented life holds a stretch
              that rhymes with yours — not a famous quote, an actual hard
              season someone lived through.
            </li>
            <li className="leading-relaxed">
              <span className="text-[var(--color-accent)]">3.</span>&nbsp; You
              read their story in small steps, at your own pace. At the end,
              it comes back around to you.
            </li>
          </ol>
        </section>

        <section className="space-y-5">
          <SectionLabel>What this is not</SectionLabel>
          <p className="leading-relaxed">
            Onward is not therapy, and it is not advice. It is a quiet place
            to read one true story that resembles your own. If you are in
            crisis right now, please reach for people who can actually help:
          </p>
          <ul className="space-y-2 border-l-2 border-[var(--color-accent)]/40 pl-4">
            {CRISIS_RESOURCES.map((resource) => (
              <li
                key={resource}
                className="font-ui text-sm text-[var(--color-ink-soft)]"
              >
                {resource}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-5">
          <SectionLabel>What happens to what you write</SectionLabel>
          <ul className="space-y-3 list-none">
            <li className="leading-relaxed">
              You start anonymous. No account, no name, no email.
            </li>
            <li className="leading-relaxed">
              A story you don&apos;t save fades away a few hours after you
              stop reading. If you save it with an email, the story stays.
            </li>
            <li className="leading-relaxed">
              Either way, the words you wrote to us are erased from our side
              within sixty days.
            </li>
            <li className="leading-relaxed">
              Nobody else can open your story — not with the link, not by
              accident.
            </li>
          </ul>
        </section>

        <footer className="pt-4 border-t border-[var(--color-ink-soft)]/30 flex items-baseline justify-between">
          <p className="font-ui text-sm text-[var(--color-ink-soft)]">
            Saved stories from before?{" "}
            <Link
              href="/signin"
              className="underline underline-offset-4 hover:text-[var(--color-ink)]"
            >
              Sign in
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
