"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [requestMode, setRequestMode] = useState<RequestMode>("idle");
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<RequestError>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const stateHeadingRef = useRef<HTMLHeadingElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const retryPendingRef = useRef(false);

  const saveState = isConsistentPresentation(
    isAnonymous,
    savePresentation,
  )
    ? savePresentation
    : ({ status: "unavailable", reason: "integrity_conflict" } as const);

  const trimmedEmail = email.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const canRequestConfirmation =
    emailValid && requestMode !== "sending";

  useEffect(() => {
    if (refreshing || !retryPendingRef.current) return;
    retryPendingRef.current = false;
    stateHeadingRef.current?.focus();
  }, [refreshing]);

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
    setSentTo(trimmedEmail);
    focusAfterRender(statusRef);
  }

  function editConfirmationEmail() {
    setRequestMode("idle");
    setSentTo(null);
    setRequestError(null);
    requestAnimationFrame(() => {
      emailRef.current?.focus();
      emailRef.current?.select();
    });
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
        <SavedState headingRef={stateHeadingRef} />
      ) : saveState.status === "unavailable" ? (
        <UnavailableState
          headingRef={stateHeadingRef}
          isAnonymous={isAnonymous}
          reason={saveState.reason}
          refreshing={refreshing}
          onRetry={() => {
            retryPendingRef.current = true;
            startRefresh(() => router.refresh());
          }}
        />
      ) : requestMode === "confirmation_pending" ? (
        <ConfirmationPendingState
          statusRef={statusRef}
          sentTo={sentTo ?? trimmedEmail}
          onEditEmail={editConfirmationEmail}
        />
      ) : (
        <>
          <div className="space-y-3">
            <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
              Account-wide save
            </p>
            <h2
              id="owner-story-save-heading"
              ref={stateHeadingRef}
              tabIndex={-1}
              className="text-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
            >
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
                ref={emailRef}
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
                aria-invalid={
                  requestError === "email_exists" ? true : undefined
                }
                aria-describedby={
                  requestError === "email_exists"
                    ? "owner-story-save-error"
                    : undefined
                }
                className="font-ui block min-h-11 w-full border-b border-[var(--color-ink-soft)] bg-transparent px-1 py-2 text-sm focus:border-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
              />
            </label>
            <button
              type="submit"
              disabled={!canRequestConfirmation}
              className="font-ui min-h-11 border border-[var(--color-accent-deep)] px-5 py-2 text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-30"
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

function SavedState({
  headingRef,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <div className="space-y-3">
      <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
        Account-wide save
      </p>
      <h2
        id="owner-story-save-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
      >
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

function UnavailableState({
  headingRef,
  isAnonymous,
  reason,
  refreshing,
  onRetry,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  isAnonymous: boolean;
  reason: "read_error" | "integrity_conflict";
  refreshing: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
        Save status unavailable
      </p>
      <h2
        id="owner-story-save-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
      >
        We cannot confirm permanent storage
      </h2>
      <p role="status" className="leading-relaxed text-[var(--color-ink-soft)]">
        {reason === "read_error"
          ? `Onward could not read this ${isAnonymous ? "guest " : ""}account's durable save record just now, so we are not promising that these stories will be kept.`
          : "The verified account details and durable save record do not agree, so Onward cannot safely promise permanent storage."}
      </p>
      {reason === "read_error" ? (
        <>
          {isAnonymous ? (
            <p className="leading-relaxed text-[var(--color-ink-soft)]">
              Check again now before the guest cleanup window runs out.
            </p>
          ) : null}
          <button
            type="button"
            onClick={onRetry}
            disabled={refreshing}
            className="font-ui min-h-11 border border-[var(--color-accent-deep)] px-5 py-2 text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] disabled:cursor-wait disabled:opacity-50"
          >
            {refreshing ? "Checking…" : "Check again"}
          </button>
        </>
      ) : (
        <p className="leading-relaxed text-[var(--color-ink-soft)]">
          Please return later before relying on this account as a permanent
          library.
        </p>
      )}
    </div>
  );
}

function ConfirmationPendingState({
  statusRef,
  sentTo,
  onEditEmail,
}: {
  statusRef: React.RefObject<HTMLParagraphElement | null>;
  sentTo: string;
  onEditEmail: () => void;
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
        We sent the link to{" "}
        <span className="break-all text-[var(--color-ink)]">{sentTo}</span>.
        Use it before guest cleanup runs. Only successful confirmation makes
        this account permanent and keeps every story already here and every
        story you create later until you delete it or the account.
      </p>
      <p className="leading-relaxed text-[var(--color-ink-soft)]">
        Confirmation does not extend the fixed 60-day deadline for what you
        wrote before a story.
      </p>
      <button
        type="button"
        onClick={onEditEmail}
        className="font-ui min-h-11 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
      >
        Change email or resend
      </button>
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
          That email already has an account. Use another email to keep this
          temporary library. Signing in cannot transfer these stories yet.
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
