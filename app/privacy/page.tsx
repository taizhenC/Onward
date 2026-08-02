import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy — Onward",
  description:
    "A plain-language guide to what Onward processes, why, how long it stays, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[44rem] px-6 py-20 sm:py-24">
      <article className="space-y-12">
        <header className="space-y-4 border-b border-[var(--color-ink-soft)]/30 pb-8">
          <Link
            href="/"
            className="font-ui inline-flex min-h-11 items-center text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Onward home
          </Link>
          <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
            Last updated July 27, 2026
          </p>
          <h1 className="text-4xl leading-tight">Privacy, in plain language</h1>
          <p className="max-w-[38rem] text-xl leading-relaxed text-[var(--color-ink-soft)]">
            Onward asks about something emotionally personal. This page explains
            what the current product does with that information, how long it
            stays, and what deletion can and cannot reach.
          </p>
        </header>

        <section className="space-y-4" aria-labelledby="privacy-short-version">
          <h2 id="privacy-short-version" className="text-2xl">
            The short version
          </h2>
          <ul className="list-disc space-y-3 pl-6 leading-relaxed text-[var(--color-ink-soft)] marker:text-[var(--color-accent)]">
            <li>
              You can begin without giving an email. A temporary guest account
              is created only after you submit a valid, non-crisis story
              request, not when you land on the site.
            </li>
            <li>
              Crisis screening runs before sign-in, storage, rate limiting, or
              any AI-provider request. If it triggers, Onward shows reviewed
              resources and does not save that submission.
            </li>
            <li>
              A temporary guest account and every story in it are deleted about
              six hours after the latest story creation or saved reading
              progress in that account. Sending a confirmation email does not
              save anything by itself. Using its confirmation link makes the
              same account permanent; that account-wide change covers stories
              already there and stories created later until you delete them.
            </li>
            <li>
              You can delete one story or your whole account yourself. No
              support request is required.
            </li>
            <li>
              Onward does not intentionally log story requests, generated story
              text, raw IP addresses, or raw provider errors in application
              telemetry.
            </li>
          </ul>
        </section>

        <section className="space-y-5" aria-labelledby="privacy-data">
          <h2 id="privacy-data" className="text-2xl">
            What Onward keeps
          </h2>
          <DataItem
            title="Age, situation, and optional story limits"
            body="These are used to find and prepare a relevant story. The situation, selected limits, and closed clarification stay only on the original session; daily cleanup clears them after its fixed 60-day deadline unless deleting the guest account, story, or account removes them earlier. The age currently stays with a kept story until that story or the account is deleted."
          />
          <DataItem
            title="Story, reading place, and generated copy"
            body="These let the story remain stable and reopen where you stopped. For a guest, the account-wide cleanup clock runs from the latest story creation or saved reading progress in that account; when it expires, the guest account and every story in it are deleted. After an email is confirmed, the same account keeps every current and future story, including its generated wording and age, until you delete the story or account. Confirmation does not extend the original fixed 60-day deadline for what you wrote before the story."
          />
          <DataItem
            title="Account-wide save state"
            body="Onward records whether a guest account became permanent through the Save confirmation and—for current-policy transitions—the exact confirmation time. This state belongs to the account rather than one story. The sign-in page cannot create a new account. Older permanent accounts have an honest legacy record without an invented historical transition time."
          />
          <DataItem
            title="Short-lived working material"
            body="Reduced emotional shapes, raw AI responses, matching query vectors, and rejected composition plans are used only while preparing a request. Onward does not save them as stories, feedback, events, or editorial records. Only validated generated wording enters the saved story."
          />
          <DataItem
            title="Email and password"
            body="Supabase Auth handles sign-in and email confirmation. Onward's product tables store the account identifier and the account-wide save state, not your password. Password recovery uses a one-time email link."
          />
          <DataItem
            title="Essential cookies"
            body="Onward uses cookies for authentication and short-lived security handoffs, including confirmation and same-device reauthentication. The application does not install an advertising or third-party behavioral-analytics SDK."
          />
          <DataItem
            title="Story feedback"
            body="The product accepts a closed close/not-close answer and one closed reason, not a free-text note. Feedback carries a 90-day expiry and is removed by daily cleanup, or earlier with its story or account."
          />
          <DataItem
            title="Operational records"
            body="Salted IP rate-limit windows become eligible for daily cleanup after two days. Closed product events and identifier-free daily totals carry an at-most 30-day expiry; provider-attempt records contain no account, story, or content identifier and carry an at-most 14-day expiry. Daily cleanup removes expired rows."
          />
        </section>

        <section
          id="service-providers"
          className="scroll-mt-8 space-y-4"
          aria-labelledby="privacy-providers"
        >
          <h2 id="privacy-providers" className="text-2xl">
            AI and infrastructure providers
          </h2>
          <p className="leading-relaxed text-[var(--color-ink-soft)]">
            For a non-crisis request, the age, situation, and any closed
            clarification may be sent to the configured matching provider. The
            approved production retrieval
            mode is keyword-based: Gemini receives curated historical-library
            text when embeddings are seeded, not a reader&apos;s situation. A
            future or non-production semantic-retrieval configuration would
            send the situation to the embedding provider. The opening-copy and
            bounded composition paths receive a reduced emotional shape rather
            than the raw situation.
          </p>
          <p className="leading-relaxed text-[var(--color-ink-soft)]">
            Onward currently uses Cerebras for language-model requests, Gemini
            for library embeddings when enabled, Supabase for authentication
            and database services, Vercel for hosting, and Resend/custom SMTP to
            deliver sign-in and confirmation email. The email provider receives
            the delivery address and message needed for that purpose, not your
            story request.
          </p>
          <p className="leading-relaxed text-[var(--color-ink-soft)]">
            Provider processing is governed by the operator&apos;s plan,
            configuration, contract, and the provider&apos;s current terms. It is
            outside Onward&apos;s application database, so an in-app deletion
            cannot recall a request already processed there. Review the current{" "}
            <ExternalLink href="https://www.cerebras.ai/privacy-policy">
              Cerebras privacy policy
            </ExternalLink>
            ,{" "}
            <ExternalLink href="https://ai.google.dev/gemini-api/docs/zdr">
              Gemini API retention guide
            </ExternalLink>
            ,{" "}
            <ExternalLink href="https://supabase.com/privacy">
              Supabase privacy notice
            </ExternalLink>
            ,{" "}
            <ExternalLink href="https://vercel.com/legal/privacy-notice">
              Vercel privacy notice
            </ExternalLink>
            , and{" "}
            <ExternalLink href="https://resend.com/legal/privacy-policy">
              Resend privacy policy
            </ExternalLink>
            . Production configuration and contracts still require a formal
            privacy review before public launch.
          </p>
        </section>

        <section
          id="retention-after-deletion"
          className="scroll-mt-8 space-y-4"
          aria-labelledby="privacy-deletion"
        >
          <h2 id="privacy-deletion" className="text-2xl">
            What deletion does—and what may remain
          </h2>
          <p className="leading-relaxed text-[var(--color-ink-soft)]">
            Account deletion hard-deletes from Onward&apos;s active database the
            sign-in, owned stories, generated
            story copies, reading places, private context, saved feedback,
            recovery state, the account-wide save state, account-linked product
            events, and per-account rate limits. Deleting an original story
            also deletes its alternate;
            deleting only an alternate keeps the original.
          </p>
          <p className="leading-relaxed text-[var(--color-ink-soft)]">
            Account-free records can remain on their own schedules: salted-IP
            rate-limit windows and retry decisions become eligible for daily
            cleanup after two days; provider-attempt records carry 14-day
            expiries; and deletion events, opaque flow-revocation tombstones,
            other closed product events, or counts already combined into daily
            totals carry roughly 30-day expiries. None of these records contains
            your account, story text, or disclosure.
          </p>
          <p className="leading-relaxed text-[var(--color-ink-soft)]">
            A historical concern report stays attached to shared
            historical-library source, story-template, and fact identifiers,
            with a closed reason, status, count, and timestamps. It contains no
            account, session, saved-story, artifact, disclosure, or
            generated-prose identifier and currently has no automatic expiry.
            Provider processing and infrastructure backups
            follow their own terms and schedules; an in-app deletion does not
            claim to erase those copies immediately.
          </p>
        </section>

        <section className="space-y-4" aria-labelledby="privacy-preview">
          <h2 id="privacy-preview" className="text-2xl">
            Preview and launch limits
          </h2>
          <p className="leading-relaxed text-[var(--color-ink-soft)]">
            This is a product-behavior guide for the current preview, not a
            completed market-specific legal notice. Before public release,
            Onward still needs a named privacy contact and controller, a
            provider and backup-retention review, jurisdiction-specific rights
            language, and a youth/privacy review. The current intake accepts
            ages 13–100; that technical range is not evidence of legal approval
            for a launch to minors.
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-5 border-t border-[var(--color-ink-soft)]/30 pt-8">
          <Link
            href="/begin"
            className="font-ui inline-flex min-h-11 items-center border border-[var(--color-ink)] px-5 py-3 text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Begin a story
          </Link>
          <Link
            href="/account"
            className="font-ui inline-flex min-h-11 items-center text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Manage or delete your account
          </Link>
          <Link
            href="/signin"
            className="font-ui inline-flex min-h-11 items-center text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Sign in
          </Link>
        </div>
      </article>
    </main>
  );
}

function DataItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1 border-l-2 border-[var(--color-accent)] pl-4">
      <h3 className="text-lg">{title}</h3>
      <p className="leading-relaxed text-[var(--color-ink-soft)]">{body}</p>
    </div>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      rel="noreferrer"
      className="text-[var(--color-ink)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
    >
      {children}
    </a>
  );
}
