"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

// Post-story upgrade card: converts the invisible anonymous user into a permanent one
// via updateUser({ email }) — same user id, so every story they own carries over by
// doing nothing. An optional password can be set in the same step so the user can sign
// in without an email link next time. Mounted by StoryPlayer at both end paths.
// Renders nothing while auth state is unknown or unavailable.

type Mode = "hidden" | "idle" | "sending" | "sent" | "permanent";

export function SaveStoriesCard() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return; // offline/memory dev: no card
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const user = data.session?.user;
      if (!user) return; // shouldn't happen mid-story; keep hidden
      const isPermanent = user.is_anonymous !== true && Boolean(user.email);
      setMode(isPermanent ? "permanent" : "idle");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const trimmedEmail = email.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  // Password is optional; if typed, let Supabase validate its strength on submit —
  // so the weak_password message below actually fires, and the rule tracks whatever
  // Supabase is configured to require (no hardcoded length on the client).
  const wantsPassword = password.length > 0;
  const canSave = emailValid;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || mode === "sending") return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setMode("sending");
    setError(null);
    setEmailExists(false);

    // Setting email + password together: the password is stored now; the email
    // change still requires confirmation via the link we send.
    const { error: updateError } = await supabase.auth.updateUser(
      wantsPassword
        ? { email: trimmedEmail, password }
        : { email: trimmedEmail },
    );

    if (updateError) {
      if (updateError.code === "email_exists") {
        setEmailExists(true);
      } else if (updateError.code === "over_email_send_rate_limit") {
        setError(
          "We just sent a link — give it a minute before asking for another.",
        );
      } else if (updateError.code === "weak_password") {
        setError("Please choose a longer password (at least 6 characters).");
      } else {
        setError("The link couldn't be sent. Please try again in a moment.");
      }
      setMode("idle");
      return;
    }

    setMode("sent");
  }

  if (mode === "hidden") return null;

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="border border-[var(--color-ink-soft)]/40 px-6 py-6 space-y-4"
    >
      {mode === "permanent" ? (
        <p className="text-[var(--color-ink-soft)] leading-relaxed">
          This story is saved with your account.{" "}
          <Link
            href="/stories"
            className="underline underline-offset-4 hover:text-[var(--color-ink)]"
          >
            See your stories
          </Link>
        </p>
      ) : mode === "sent" ? (
        <div role="status" className="space-y-4">
          <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
            Check your email
          </p>
          <p className="leading-relaxed">
            One click on the link we sent and this story stays with your account
            until you delete it.
          </p>
        </div>
      ) : (
        <>
          <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
            Keep this story
          </p>
          <p className="leading-relaxed">
            Right now you&apos;re anonymous. This story is automatically deleted
            about six hours after your last activity. Add an email and the story
            stays until you delete it from Your stories. What you wrote before
            the story is removed after 60 days. A password is optional if
            you&apos;d like to skip the email next time.
          </p>
          {emailExists ? (
            <p
              id="save-story-error"
              role="alert"
              className="font-ui text-sm text-[var(--color-accent)]"
            >
              That email already has an account.{" "}
              <Link href="/signin" className="underline underline-offset-4">
                Sign in instead
              </Link>{" "}
              — though signing in won&apos;t carry this anonymous story over.
            </p>
          ) : null}
          {error ? (
            <p
              id="save-story-error"
              role="alert"
              className="font-ui text-sm text-[var(--color-accent)]"
            >
              {error}
            </p>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="sr-only">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={mode === "sending"}
                placeholder="you@example.com"
                autoComplete="email"
                aria-describedby={
                  emailExists || error ? "save-story-error" : undefined
                }
                className="block w-full bg-transparent border-b border-[var(--color-ink-soft)] focus:border-[var(--color-ink)] focus:outline-none px-1 py-2 font-ui text-sm"
              />
            </label>
            <label className="block">
              <span className="sr-only">Password (optional)</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={mode === "sending"}
                placeholder="Password (optional, 6+ characters)"
                autoComplete="new-password"
                aria-describedby={error ? "save-story-error" : undefined}
                className="block w-full bg-transparent border-b border-[var(--color-ink-soft)] focus:border-[var(--color-ink)] focus:outline-none px-1 py-2 font-ui text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={!canSave || mode === "sending"}
              className="font-ui text-sm uppercase tracking-wider border border-[var(--color-ink)] px-5 py-2 hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {mode === "sending" ? "Sending…" : "Save"}
            </button>
          </form>
        </>
      )}
    </motion.aside>
  );
}
