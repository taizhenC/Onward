import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NavigationStatus } from "@/components/NavigationStatus";
import { getAccountAuthContext } from "@/lib/auth";
import {
  ACCOUNT_DELETION_SUCCESS_COOKIE,
  accountDeletionSuccessReceiptDisposition,
} from "@/lib/account-deletion-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account deleted — Onward",
  robots: { index: false, follow: false },
};

export default async function AccountDeletedPage() {
  const receipt = (await cookies()).get(
    ACCOUNT_DELETION_SUCCESS_COOKIE,
  )?.value;
  let receiptIsValid = false;
  try {
    receiptIsValid =
      accountDeletionSuccessReceiptDisposition(receipt) === "valid";
  } catch {
    redirect("/");
  }
  if (!receiptIsValid) redirect("/");

  // The receipt intentionally contains no account identifier. A currently
  // authenticated account therefore wins over it, preventing a copied receipt
  // from making a claim about the wrong account.
  let activeAccount: Awaited<ReturnType<typeof getAccountAuthContext>>;
  try {
    activeAccount = await getAccountAuthContext();
  } catch {
    redirect("/");
  }
  if (activeAccount) redirect("/account");

  return (
    <main className="mx-auto max-w-[36rem] px-6 py-24">
      <div className="space-y-8">
        <header className="space-y-3 border-b border-[var(--color-ink-soft)]/30 pb-6">
          <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
            Account
          </p>
          <h1 className="text-3xl">Your account has been deleted</h1>
        </header>
        <NavigationStatus className="border border-[var(--color-ink-soft)]/40 px-4 py-3">
          Your sign-in, stories, reading places, private context, and saved
          feedback have been removed from Onward&apos;s active account data.
        </NavigationStatus>
        <p className="leading-relaxed text-[var(--color-ink-soft)]">
          An unlinked deletion record and counts already combined into daily
          totals follow a 30-day expiry schedule with physical removal by daily
          cleanup. Historical concern reports stay with shared
          historical-library source, story-template, and fact identifiers, but
          contain no account, session, saved-story, artifact, disclosure, or
          generated-prose identifier. Information already processed by service providers and copies in
          provider-managed infrastructure backups follow their separate
          retention terms. Read the full explanation in our{" "}
          <Link
            href="/privacy#retention-after-deletion"
            className="text-[var(--color-ink)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            privacy guide
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/"
            className="font-ui inline-flex min-h-11 items-center border border-[var(--color-accent-deep)] px-5 py-3 text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Return home
          </Link>
          <Link
            href="/begin"
            className="font-ui inline-flex min-h-11 items-center text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Begin again with a new guest account
          </Link>
        </div>
      </div>
    </main>
  );
}
