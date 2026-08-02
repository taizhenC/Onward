import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SetPasswordForm } from "@/components/SetPasswordForm";
import { SignOutButton } from "@/components/SignOutButton";
import { getAccountAuthContext } from "@/lib/auth";
import { getOwnerStorySavePresentation } from "@/lib/owner-story-save";
import type { OwnerStorySavePresentation } from "@/lib/owner-story-save-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account — Onward",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const context = await getAccountAuthContext();
  if (!context) redirect("/signin");
  const saveState = await getOwnerStorySavePresentation({
    userId: context.userId,
    isAnonymous: context.isAnonymous,
  });

  return (
    <main className="mx-auto max-w-[36rem] px-6 py-24">
      <div className="space-y-10">
        <header className="flex items-baseline justify-between border-b border-[var(--color-ink-soft)]/30 pb-6">
          <div className="space-y-2">
            <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
              Onward
            </p>
            <h1 className="text-3xl">Account</h1>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/privacy"
              className="font-ui inline-flex min-h-11 items-center text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
            >
              Privacy
            </Link>
            <Link
              href="/stories"
              className="font-ui inline-flex min-h-11 items-center text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
            >
              {context.isAnonymous ? "Temporary stories" : "Your stories"}
            </Link>
            {!context.isAnonymous ? <SignOutButton /> : null}
          </div>
        </header>

        <AccountRetention saveState={saveState} />

        {!context.isAnonymous ? <SetPasswordForm /> : null}

        <section className="space-y-4 border-t border-[var(--color-ink-soft)]/30 pt-8">
          <div className="space-y-2">
            <h2 className="text-xl">
              {context.isAnonymous ? "Delete guest data" : "Delete account"}
            </h2>
            <p className="leading-relaxed text-[var(--color-ink-soft)]">
              {context.isAnonymous
                ? "Delete this temporary guest account and every story attached to it from Onward's active account data without contacting support."
                : "Delete your sign-in and every story attached to it from Onward's active account data without contacting support."}
            </p>
          </div>
          <Link
            href="/account/delete"
            className="font-ui inline-flex min-h-11 items-center border border-[var(--color-accent)] px-5 py-3 text-sm uppercase tracking-wider text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            {context.isAnonymous ? "Delete guest data" : "Delete account"}
          </Link>
        </section>
      </div>
    </main>
  );
}

function AccountRetention({
  saveState,
}: {
  saveState: OwnerStorySavePresentation;
}) {
  if (saveState.status === "temporary") {
    return (
      <section className="space-y-3" aria-labelledby="account-retention">
        <h2 id="account-retention" className="text-xl">
          Temporary guest account
        </h2>
        <p className="leading-relaxed text-[var(--color-ink-soft)]">
          This temporary guest account and every story in it are deleted about
          six hours after the latest story creation or saved reading progress
          in that account. Sending a confirmation email does not change this;
          the account becomes permanent only after the link is confirmed.
        </p>
      </section>
    );
  }

  if (saveState.status === "saved") {
    return (
      <section className="space-y-3" aria-labelledby="account-retention">
        <h2 id="account-retention" className="text-xl">
          What stays
        </h2>
        <p className="leading-relaxed text-[var(--color-ink-soft)]">
          This permanent account keeps every current and future story until you
          delete the story or account. Each story keeps its generated wording
          and the age used to find it. The situation you wrote and its private
          matching context are still removed by daily cleanup after their fixed
          60-day deadline, or earlier if you delete the story or account.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3" aria-labelledby="account-retention">
      <h2 id="account-retention" className="text-xl">
        Save status unavailable
      </h2>
      <p role="status" className="leading-relaxed text-[var(--color-ink-soft)]">
        Onward cannot verify this account&apos;s durable save record right now,
        so this page does not promise permanent story storage. Refresh or return
        later before relying on this account as a permanent library.
      </p>
    </section>
  );
}
