import Link from "next/link";
import { StoryDemo } from "@/components/StoryDemo";
import { CRISIS_RESOURCES } from "@/lib/safety";

// Landing page (ported from the Onward.dc.html design). The rotating hero lines
// below are sample marketing copy carried over from the design — illustrations,
// not real submissions.
const HERO_QUOTES = [
  "I failed the one exam I had built everything around.",
  "I moved across the country, and now I'm completely alone.",
  "I'm past forty and I still don't know what I'm for.",
  "I gave up the thing I loved because I got scared.",
  "Everyone else has moved on. I feel stuck.",
];

const STEPS = [
  {
    n: 1,
    title: "Say what you're carrying",
    body: "A failed exam, a lonely move, a door that just closed. A few honest sentences — and no one reading over your shoulder.",
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

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Masthead */}
      <div className="border-t-[3px] border-[var(--color-ink)]" />
      <div className="mx-auto w-full max-w-[1080px] px-8">
        <div className="flex items-center justify-between border-b border-[var(--color-ink)]/[0.16] py-[17px]">
          <span className="text-[22px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">
            Onward
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

      {/* Hero */}
      <header className="mx-auto max-w-[1080px] px-8 pb-[104px] pt-24 text-center">
        <Diamond />
        <p className="mb-[26px] font-ui text-[12px] font-medium uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
          A companion for hard seasons
        </p>
        <h1 className="mx-auto max-w-[13ch] text-[clamp(2.7rem,6.6vw,4.3rem)] font-semibold leading-[1.04] tracking-[-0.02em] text-balance">
          You are not the first to carry this.
        </h1>
        <p className="mx-auto mt-7 max-w-[34rem] text-[20px] leading-[1.6] text-[var(--color-ink-soft)] text-pretty">
          {"Tell Onward what you're carrying. Meet someone who felt the same way you do — and came through."}
        </p>
        <div className="mt-[38px] flex flex-wrap items-center justify-center gap-[22px]">
          <Link href="/begin" className={filledButton}>
            Read a story
          </Link>
          <a
            href="#how"
            className="border-b border-[var(--color-ink)]/40 pb-[3px] font-ui text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            How it works
          </a>
        </div>

        {/* Rotating first-person lines */}
        <div className="mt-[60px]">
          <p className="mb-[18px] font-ui text-[11px] font-medium uppercase tracking-[0.18em] text-[#8a8378]">
            What people carry here
          </p>
          <div className="relative mx-auto h-[3.6em] max-w-[33rem]">
            {HERO_QUOTES.map((quote, i) => (
              <p
                key={quote}
                className="absolute inset-0 m-0 flex items-center justify-center text-center text-[clamp(1.3rem,3.1vw,1.75rem)] italic leading-[1.42] text-[var(--color-ink)] text-pretty opacity-0"
                style={{
                  animation: `ow-hero-cycle 19s ease-in-out ${i * 3.8}s infinite`,
                }}
              >
                “{quote}”
              </p>
            ))}
          </div>
        </div>
      </header>

      {/* How it works */}
      <section
        id="how"
        className="border-y border-[var(--color-ink)]/10 bg-[var(--color-paper-deep)]"
      >
        <div className="mx-auto max-w-[1080px] px-8 py-[84px]">
          <p className="mb-[54px] text-center font-ui text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
            How it works
          </p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-12">
            {STEPS.map((step) => (
              <div key={step.n} className="text-center">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live demo */}
      <section id="story" className="mx-auto max-w-[1080px] px-8 pb-24 pt-24 text-center">
        <p className="mb-[14px] font-ui text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          What a story looks like
        </p>
        <p className="mx-auto mb-9 max-w-[30rem] text-[18px] leading-[1.65] text-[var(--color-ink-soft)] text-pretty">
          An excerpt, exactly as you would meet it — the words arriving one page
          at a time. The name is kept until the end.
        </p>
        <StoryDemo />
      </section>

      {/* Closing coda */}
      <section className="mx-auto max-w-[1080px] px-8 pb-24 pt-[104px] text-center">
        <Diamond />
        <p className="mx-auto max-w-[24rem] text-[clamp(2rem,4.8vw,2.7rem)] font-semibold leading-[1.24] tracking-[-0.015em] text-balance">
          {"You don't have to know who you are yet."}
        </p>
        <p className="mx-auto mt-4 max-w-[28rem] text-[21px] italic leading-[1.5] text-[var(--color-ink-soft)]">
          Neither did they — and look what they went on to become.
        </p>
        <div className="mt-[42px]">
          <Link href="/begin" className={filledButton}>
            Begin
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-ink)]/[0.14]">
        <div className="mx-auto max-w-[1080px] px-8 pb-[60px] pt-[30px]">
          <p className="mb-[22px] max-w-[40rem] font-ui text-[12.5px] leading-[1.7] text-[#8a8378]">
            In crisis right now? Please reach for people who can help —{" "}
            {CRISIS_RESOURCES.map((resource, index) => (
              <span key={resource}>
                {index > 0 ? " · " : null}
                <span className="text-[var(--color-ink-soft)]">{resource}</span>
              </span>
            ))}
          </p>
          <div className="flex items-baseline justify-between border-t border-[var(--color-ink)]/10 pt-[18px]">
            <span className="text-[17px] font-semibold text-[var(--color-ink)]">
              Onward
            </span>
            <span className="font-ui text-[11px] tracking-[0.06em] text-[#8a8378]">
              Read one true story
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
