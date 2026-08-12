import { Fragment } from "react";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { StoryDemo } from "@/components/StoryDemo";
import { CRISIS_RESOURCES } from "@/lib/safety";

// Sample marketing copy carried over from the design — an illustration, not a
// real submission. It stays static so readers are never given an unpausable
// content rotation.
const HERO_QUOTE = "I failed the one exam I had built everything around.";

// Single source of truth for the headline: the h1's aria-label and the animated
// word spans are derived from the same string so they can't drift.
const HEADLINE = "You are not the first to carry this.";
const HEADLINE_WORDS = HEADLINE.split(" ");

// Inline ow-fade with per-element delay — the established stagger idiom.
const settle = (delayS: number, durationS = 0.6) => ({
  animation: `ow-fade ${durationS}s ease ${delayS}s both`,
});

const STEPS = [
  {
    n: 1,
    title: "Say what you're carrying",
    body: "A failed exam, a lonely move, a door that just closed. A few honest sentences, kept out of public view.",
  },
  {
    n: 2,
    title: "Meet someone who felt it",
    body: "Onward finds a real person whose documented life held the same hard season — and who went on to do something remarkable.",
  },
  {
    n: 3,
    title: "Read how they came through",
    body: "One page at a time, at your pace. By the end it turns back to you: this has been survived before, and you're still near the beginning.",
  },
];

function Diamond() {
  return (
    <div className="mb-6 flex items-center justify-center gap-3" aria-hidden>
      <span className="block h-px w-[34px] bg-[var(--color-ink)]/[0.32]" />
      <span className="text-[9px] leading-none text-[var(--color-accent)]">◆</span>
      <span className="block h-px w-[34px] bg-[var(--color-ink)]/[0.32]" />
    </div>
  );
}

const filledButton =
  "inline-block font-ui text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-bg)] bg-[var(--color-ink)] border border-[var(--color-ink)] px-[30px] py-[14px] transition-colors hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)]";

function StoryStartButton({ label }: { label: string }) {
  return (
    <form action="/api/telemetry/landing-cta" method="post">
      <button type="submit" className={filledButton}>
        {label}
      </button>
    </form>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Masthead */}
      <div className="border-t-[3px] border-[var(--color-ink)]" />
      <div className="mx-auto w-full max-w-[1080px] px-8">
        <div className="flex items-center justify-between border-b border-[var(--color-ink)]/[0.16] py-[17px]">
          <span
            className="inline-flex items-center gap-[7px] whitespace-nowrap text-[22px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]"
            data-onward-brand-lockup
          >
            <span>Onward</span>
            <svg
              aria-hidden="true"
              className="relative -top-px h-4 w-[13px] shrink-0 text-[var(--color-accent)]"
              focusable="false"
              viewBox="0 0 16 20"
            >
              <path
                d="M8 1c.55 5.2 2.15 7.4 7 9-4.85 1.6-6.45 3.8-7 9-.55-5.2-2.15-7.4-7-9 4.85-1.6 6.45-3.8 7-9Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <div className="flex items-center gap-[22px]">
            <span className="hidden font-ui text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-accent)] sm:block">
              True stories of people who came through it
            </span>
            <Link
              href="/signin"
              className="border-b border-[var(--color-ink)]/30 pb-[2px] font-ui text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <main>
      {/* Hero */}
      <header className="mx-auto max-w-[1080px] px-8 pb-[104px] pt-24 text-center">
        <div style={settle(0)}>
          <Diamond />
        </div>
        <p
          className="mb-[26px] font-ui text-[12px] font-medium uppercase tracking-[0.22em] text-[var(--color-ink-soft)]"
          style={settle(0.12)}
        >
          A companion for hard seasons
        </p>
        <h1
          aria-label={HEADLINE}
          className="mx-auto max-w-[13ch] text-[clamp(2.7rem,6.6vw,4.3rem)] font-semibold leading-[1.04] tracking-[-0.02em] text-balance"
        >
          {/* One aria-hidden wrapper (not per-word) so browse-mode screen readers
              can't walk the word fragments; the aria-label above carries the
              sentence. Word spans are inline-block so the translateY applies;
              the {" "} siblings keep real spaces between them for text-balance. */}
          <span aria-hidden="true">
            {HEADLINE_WORDS.map((word, i) => (
              <Fragment key={`${word}-${i}`}>
                <span
                  className="inline-block"
                  style={{
                    animation: `ow-fade 0.5s ease ${(0.35 + i * 0.1).toFixed(2)}s both`,
                  }}
                >
                  {word}
                </span>{" "}
              </Fragment>
            ))}
          </span>
        </h1>
        <p
          className="mx-auto mt-7 max-w-[34rem] text-[20px] leading-[1.6] text-[var(--color-ink-soft)] text-pretty"
          style={settle(1.3)}
        >
          {"Tell Onward what you're carrying. Meet someone who felt the same way you do — and came through."}
        </p>
        <div
          className="mt-[38px] flex flex-wrap items-center justify-center gap-[22px]"
          style={settle(1.5)}
        >
          <StoryStartButton label="Read a story" />
          <a
            href="#how"
            className="border-b border-[var(--color-ink)]/40 pb-[3px] font-ui text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            How it works
          </a>
        </div>

        {/* Static first-person illustration */}
        <div className="mt-[60px]" style={settle(1.65)}>
          <p className="mb-[18px] font-ui text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            What people carry here
          </p>
          <p className="mx-auto max-w-[33rem] text-center text-[clamp(1.3rem,3.1vw,1.75rem)] italic leading-[1.42] text-[var(--color-ink)] text-pretty">
            “{HERO_QUOTE}”
          </p>
        </div>
      </header>

      {/* How it works */}
      <section
        id="how"
        className="border-y border-[var(--color-ink)]/10 bg-[var(--color-paper-deep)]"
      >
        <div className="mx-auto max-w-[1080px] px-8 py-[84px]">
          <Reveal>
            <h2 className="mb-[54px] text-center font-ui text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
              How it works
            </h2>
          </Reveal>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-12">
            {STEPS.map((step) => (
              <Reveal
                key={step.n}
                className="text-center"
                delay={(step.n - 1) * 0.15}
              >
                <span className="mx-auto mb-5 block h-[2px] w-[30px] bg-[var(--color-accent)]" />
                <span className="oldstyle-nums block text-[40px] leading-none text-[var(--color-accent)]">
                  {step.n}
                </span>
                <h3 className="mb-[10px] mt-4 text-[21px] font-semibold text-[var(--color-ink)]">
                  {step.title}
                </h3>
                <p className="text-[16px] leading-[1.66] text-[var(--color-ink-soft)] text-pretty">
                  {step.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Live demo */}
      <section id="story" className="mx-auto max-w-[1080px] px-8 pb-24 pt-24 text-center">
        <Reveal>
          <h2 className="mb-[14px] font-ui text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
            What a story looks like
          </h2>
          <p className="mx-auto mb-9 max-w-[30rem] text-[18px] leading-[1.65] text-[var(--color-ink-soft)] text-pretty">
            An excerpt, exactly as you would meet it — the words arriving one page
            at a time. The name is kept until the end.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <StoryDemo />
        </Reveal>
      </section>

      {/* Closing coda */}
      <section className="mx-auto max-w-[1080px] px-8 pb-24 pt-[104px] text-center">
        <Reveal>
          <Diamond />
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mx-auto max-w-[24rem] text-[clamp(2rem,4.8vw,2.7rem)] font-semibold leading-[1.24] tracking-[-0.015em] text-balance">
            {"You don't have to know who you are yet."}
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-4 max-w-[28rem] text-[21px] italic leading-[1.5] text-[var(--color-ink-soft)]">
            Neither did they — and look what they went on to become.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-[42px]">
            <StoryStartButton label="Begin" />
          </div>
        </Reveal>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-ink)]/[0.14]">
        <div className="mx-auto max-w-[1080px] px-8 pb-[60px] pt-[30px]">
          <p className="mb-[22px] max-w-[40rem] font-ui text-[12.5px] leading-[1.7] text-[var(--color-ink-faint)]">
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
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-[var(--color-ink)]/10 pt-[18px]">
            <span className="text-[17px] font-semibold text-[var(--color-ink)]">
              Onward
            </span>
            <div className="flex items-center gap-5 font-ui text-[11px] tracking-[0.06em] text-[var(--color-ink-faint)]">
              <Link
                href="/privacy"
                className="inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
              >
                Privacy
              </Link>
              <span>Read one true story</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
