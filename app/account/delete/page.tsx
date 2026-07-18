import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NavigationStatus } from "@/components/NavigationStatus";
import {
  accountDeletionAuthenticationStatus,
  getAccountAuthContext,
} from "@/lib/auth";
import {
  issueAccountDeletionToken,
  issueAccountReauthRequestToken,
} from "@/lib/account-deletion-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delete account — Onward",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{
    error?: string | string[];
    reauth?: string | string[];
  }>;
};

export default async function DeleteAccountPage({ searchParams }: Props) {
  const context = await getAccountAuthContext();
  if (!context) redirect("/signin");
  const query = await searchParams;
  const authStatus = accountDeletionAuthenticationStatus(context);

  if (authStatus === "unavailable") {
    return (
      <AccountShell title="Deletion is temporarily unavailable">
        <NavigationStatus
          kind="alert"
          className="border border-[var(--color-accent)] px-4 py-3"
        >
          We couldn&apos;t verify a recent sign-in. Your account and stories are
          unchanged. Please try again in a moment.
        </NavigationStatus>
        <KeepAccountLink isGuest={false} />
      </AccountShell>
    );
  }

  if (authStatus === "stale") {
    const csrfToken = issueAccountReauthRequestToken(context.userId);
    return (
      <AccountShell title="Sign in again to continue">
        <p className="leading-relaxed text-[var(--color-ink-soft)]">
          For your privacy, confirm your email before deleting your account.
          We&apos;ll send a one-time sign-in link to the email already on this
          account.
        </p>
        {query.reauth === "sent" ? (
          <NavigationStatus className="border border-[var(--color-ink-soft)]/40 px-4 py-3">
            Check your email. Open the sign-in link on this device to continue.
            It expires soon. On another device, choose Delete account there.
          </NavigationStatus>
        ) : null}
        {reauthError(query.error)}
        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--color-ink-soft)]/30 pt-6">
          <KeepAccountLink isGuest={false} />
          <form action="/api/account-delete/reauth" method="post">
            <input
              type="hidden"
              name="intent"
              value="reauthenticate_account_deletion"
            />
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <button
              type="submit"
              className="font-ui min-h-11 border border-[var(--color-ink)] px-5 py-3 text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
            >
              Email me a sign-in link
            </button>
          </form>
        </div>
      </AccountShell>
    );
  }

  const isGuest = authStatus === "guest";
  const csrfToken = issueAccountDeletionToken(context.userId);
  const needsUnderstanding = query.error === "understood";
  return (
    <AccountShell
      title={
        isGuest ? "Delete this guest account?" : "Delete your Onward account?"
      }
    >
      {deletionError(query.error)}
      <section className="space-y-4">
        <p className="leading-relaxed text-[var(--color-ink-soft)]">
          {isGuest
            ? "This hard-deletes from Onward's active account data every story, reading place, private context, generated story copy, and saved feedback in this guest account now. If you do nothing, this guest account and every story in it are deleted about six hours after the latest story creation or saved reading progress in that account."
            : "This hard-deletes from Onward's active account data your sign-in and every story saved to this account, including reading places, private context still within its retention period, generated story copies, and saved feedback. You won't be able to recover them in Onward."}
        </p>
        <p className="leading-relaxed text-[var(--color-ink-soft)]">
          An unlinked record that deletion was requested or completed, and
          counts already combined into daily totals, follow a 30-day expiry
          schedule with physical removal by daily cleanup. Historical concern
          reports stay with shared historical-library source, story-template,
          and fact identifiers, but contain no account, session, saved-story,
          artifact, disclosure, or generated-prose identifier. They currently
          have no automatic expiry. Information already processed by model providers
          and copies in provider-managed infrastructure backups follow their
          separate retention terms and cannot be recalled by this action.{" "}
          <Link
            href="/privacy#retention-after-deletion"
            className="text-[var(--color-ink)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            See exactly what may remain.
          </Link>
        </p>
      </section>

      <form action="/api/account-delete" method="post" className="space-y-6">
        <input type="hidden" name="intent" value="delete_account" />
        <input type="hidden" name="csrfToken" value={csrfToken} />
        <label className="flex min-h-11 items-start gap-3">
          <input
            type="checkbox"
            name="understood"
            value="delete_account_and_stories"
            autoFocus={needsUnderstanding}
            aria-describedby={
              needsUnderstanding ? "account-delete-understood-error" : undefined
            }
            className="mt-1 size-5 shrink-0 accent-[var(--color-accent)]"
          />
          <span className="leading-relaxed">
            I understand that this deletes {isGuest ? "every story in this guest account" : "my account and every saved story"}.
          </span>
        </label>
        {needsUnderstanding ? (
          <p
            id="account-delete-understood-error"
            className="font-ui text-sm text-[var(--color-accent)]"
          >
            Confirm that you understand what will be deleted.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--color-ink-soft)]/30 pt-6">
          <KeepAccountLink isGuest={isGuest} />
          <button
            type="submit"
            className="font-ui min-h-11 border border-[var(--color-accent)] px-5 py-3 text-sm uppercase tracking-wider text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Delete {isGuest ? "guest account" : "account"} now
          </button>
        </div>
      </form>
    </AccountShell>
  );
}

function AccountShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-[36rem] px-6 py-24">
      <div className="space-y-8">
        <header className="space-y-3 border-b border-[var(--color-ink-soft)]/30 pb-6">
          <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
            Account
          </p>
          <h1 className="text-3xl">{title}</h1>
        </header>
        {children}
      </div>
    </main>
  );
}

function KeepAccountLink({ isGuest }: { isGuest: boolean }) {
  return (
    <Link
      href="/account"
      className="font-ui inline-flex min-h-11 items-center border border-[var(--color-ink)] px-5 py-3 text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
    >
      Keep {isGuest ? "guest account" : "my account"}
    </Link>
  );
}

function reauthError(value: string | string[] | undefined) {
  const messages: Record<string, string> = {
    reauth_rate: "We just sent a link. Give it a minute before asking for another.",
    reauth_send: "We couldn't send the link. Please try again in a moment.",
    reauth_expired: "That request expired. Review the details and try again.",
    reauth: "Your sign-in is no longer recent enough. Confirm it again to continue.",
  };
  const message = typeof value === "string" ? messages[value] : undefined;
  return message ? (
    <NavigationStatus
      kind="alert"
      className="border border-[var(--color-accent)] px-4 py-3"
    >
      {message}
    </NavigationStatus>
  ) : null;
}

function deletionError(value: string | string[] | undefined) {
  if (value === "temporary") {
    return (
      <NavigationStatus
        kind="alert"
        className="border border-[var(--color-accent)] px-4 py-3"
      >
        We couldn&apos;t delete your account. Your account and stories are still
        here. Please try again.
      </NavigationStatus>
    );
  }
  if (value === "expired") {
    return (
      <NavigationStatus
        kind="alert"
        className="border border-[var(--color-accent)] px-4 py-3"
      >
        This confirmation expired. Review the details and try again.
      </NavigationStatus>
    );
  }
  return null;
}
