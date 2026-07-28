"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import type { OwnerStorySavePresentation } from "@/lib/owner-story-save-types";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Props = {
  isAnonymous: boolean;
  savePresentation: OwnerStorySavePresentation;
};

type RequestMode = "idle" | "sending" | "confirmation_pending";
type RequestError = "email_exists" | "rate_limited" | "unavailable" | null;

// The browser can request an Auth conversion, but it cannot declare that Save
// succeeded. The durable server projection passed by the story page is the only
// authority for the saved and unavailable states. A successful updateUser call
// remains explicitly temporary until the reader confirms the email.
export function SaveStoriesCard({
  isAnonymous,
  savePresentation,
}: Props) {
  const [requestMode, setRequestMode] = useState<RequestMode>("idle");
  const [email, setEmail] = useState("");
  const [requestError, setRequestError] = useState<RequestError>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const saveState = isConsistentPresentation(
    isAnonymous,
    savePresentation,
  )
    ? savePresentation
    : ({ status: "unavailable" } as const);

  const trimmedEmail = email.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const canRequestConfirmation =
    emailValid && requestMode !== "sending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canRequestConfirmation || saveState.status !== "temporary") return;

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setRequestError("unavailable");
      focusAfterRender(errorRef);
      return;
    }

    setRequestMode("sending");
    setRequestError(null);
    const { error } = await supabase.auth.updateUser({ email: trimmedEmail });

    if (error) {
      if (error.code === "email_exists") {
        setRequestError("email_exists");
      } else if (error.code === "over_email_send_rate_limit") {
        setRequestError("rate_limited");
      } else {
        setRequestError("unavailable");
      }
      setRequestMode("idle");
      focusAfterRender(errorRef);
      return;
    }

    setRequestMode("confirmation_pending");
    focusAfterRender(statusRef);
  }

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      aria-labelledby="owner-story-save-heading"
      className="space-y-4 border border-[var(--color-ink-soft)]/40 px-6 py-6"
    >
      {saveState.status === "saved" ? (
        <SavedState />
      ) : saveState.status === "unavailable" ? (
        <UnavailableState />
      ) : requestMode === "confirmation_pending" ? (
        <ConfirmationPendingState statusRef={statusRef} />
      ) : (
        <>
          <div className="space-y-3">
            <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
              Account-wide save
            </p>
            <h2 id="owner-story-save-heading" className="text-xl">
              Keep every story in this account
            </h2>
            <p className="leading-relaxed text-[var(--color-ink-soft)]">
              This is still a temporary guest account. It and every story in
              it are deleted about six hours after the latest story creation or
              saved reading progress. Add and confirm an email to make this
              same account permanent. That keeps every story already here and
              every story you create later until you delete the story or
              account.
            </p>
            <p className="leading-relaxed text-[var(--color-ink-soft)]">
              Each kept story includes its generated wording and the age used
              to find it. What you wrote before a story still clears after its
              fixed 60-day deadline.
            </p>
          </div>

          {requestError ? (
            <RequestErrorMessage
              kind={requestError}
              errorRef={errorRef}
            />
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="sr-only">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setRequestError(null);
                }}
                disabled={requestMode === "sending"}
                required
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={requestError ? true : undefined}
                aria-describedby={
                  requestError ? "owner-story-save-error" : undefined
                }
                className="font-ui block min-h-11 w-full border-b border-[var(--color-ink-soft)] bg-transparent px-1 py-2 text-sm focus:border-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
              />
            </label>
            <button
              type="submit"
              disabled={!canRequestConfirmation}
              className="font-ui min-h-11 border border-[var(--color-ink)] px-5 py-2 text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {requestMode === "sending"
                ? "Sending…"
                : "Send confirmation link"}
            </button>
          </form>
          <p className="font-ui text-xs leading-relaxed text-[var(--color-ink-soft)]">
            Sending the email does not save the account. The account changes
            only after you use its confirmation link.{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
            >
              Read the privacy details
            </Link>
            .
          </p>
        </>
      )}
    </motion.aside>
  );
}

function SavedState() {
  return (
    <div className="space-y-3">
      <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
        Account-wide save
      </p>
      <h2 id="owner-story-save-heading" className="text-xl">
        Your stories are kept
      </h2>
      <p className="leading-relaxed text-[var(--color-ink-soft)]">
        This permanent account keeps every story already here and every story
        you create later until you delete the story or account. Each story
        keeps its generated wording and the age used to find it. What you wrote
        before the story still clears after its fixed 60-day deadline.
      </p>
      <Link
        href="/stories"
        className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
      >
        See your stories
      </Link>
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="space-y-3">
      <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
        Save status unavailable
      </p>
      <h2 id="owner-story-save-heading" className="text-xl">
        We cannot confirm permanent storage
      </h2>
      <p role="status" className="leading-relaxed text-[var(--color-ink-soft)]">
        Onward cannot verify this account&apos;s durable save record right now,
        so we are not promising that these stories will be kept. Refresh this
        page or return later before relying on this as a permanent library.
      </p>
    </div>
  );
}

function ConfirmationPendingState({
  statusRef,
}: {
  statusRef: React.RefObject<HTMLParagraphElement | null>;
}) {
  return (
    <div className="space-y-3">
      <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
        Confirmation needed
      </p>
      <h2 id="owner-story-save-heading" className="text-xl">
        Your stories are still temporary
      </h2>
      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="leading-relaxed text-[var(--color-ink-soft)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
      >
        We sent the link. Use it before guest cleanup runs. Only successful
        confirmation makes this account permanent and keeps every story already
        here and every story you create later until you delete it or the
        account.
      </p>
      <p className="leading-relaxed text-[var(--color-ink-soft)]">
        Confirmation does not extend the fixed 60-day deadline for what you
        wrote before a story.
      </p>
    </div>
  );
}

function RequestErrorMessage({
  kind,
  errorRef,
}: {
  kind: Exclude<RequestError, null>;
  errorRef: React.RefObject<HTMLParagraphElement | null>;
}) {
  return (
    <p
      id="owner-story-save-error"
      ref={errorRef}
      tabIndex={-1}
      role="alert"
      className="font-ui text-sm text-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
    >
      {kind === "email_exists" ? (
        <>
          That email already has an account.{" "}
          <Link
            href="/signin"
            className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            Sign in instead
          </Link>
          —but signing in will not transfer these temporary stories.
        </>
      ) : kind === "rate_limited" ? (
        "We just sent a link. Give it a minute before asking for another."
      ) : (
        "The confirmation link could not be sent. Please try again in a moment."
      )}
    </p>
  );
}

function isConsistentPresentation(
  isAnonymous: boolean,
  presentation: OwnerStorySavePresentation,
): boolean {
  if (presentation.status === "temporary") return isAnonymous;
  if (presentation.status === "saved") return !isAnonymous;
  return true;
}

function focusAfterRender(
  target: React.RefObject<HTMLElement | null>,
): void {
  requestAnimationFrame(() => target.current?.focus());
}
