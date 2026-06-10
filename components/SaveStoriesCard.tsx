"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

// Post-story upgrade card: converts the invisible anonymous user into a permanent one
// via updateUser({ email }) — same user id, so every story they own carries over by
// doing nothing. Mounted by StoryPlayer at both end paths (in-flow finish + refresh
// after finish). Renders nothing while auth state is unknown or unavailable.

type Mode = "hidden" | "idle" | "sending" | "sent" | "permanent";

export function SaveStoriesCard() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [email, setEmail] = useState("");
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailValid || mode === "sending") return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setMode("sending");
    setError(null);
    setEmailExists(false);

    const { error: updateError } = await supabase.auth.updateUser({
      email: trimmedEmail,
    });

    if (updateError) {
      if (updateError.code === "email_exists") {
        setEmailExists(true);
      } else if (updateError.code === "over_email_send_rate_limit") {
        setError(
          "We just sent a link — give it a minute before asking for another.",
        );
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
        <>
          <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
            Check your email
          </p>
          <p className="leading-relaxed">
            One click on the link we sent and this story is yours to keep.
          </p>
        </>
      ) : (
        <>
          <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
            Keep this story
          </p>
          <p className="leading-relaxed">
            Right now you&apos;re anonymous. This story fades about six hours
            after you stop reading. Add an email and it stays.
          </p>
          {emailExists ? (
            <p className="font-ui text-sm text-[var(--color-accent)]">
              That email already has an account.{" "}
              <Link href="/signin" className="underline underline-offset-4">
                Sign in instead
              </Link>{" "}
              — though signing in won&apos;t carry this anonymous story over.
            </p>
          ) : null}
          {error ? (
            <p className="font-ui text-sm text-[var(--color-accent)]">
              {error}
            </p>
          ) : null}
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-4 flex-wrap"
          >
            <label className="block grow space-y-2">
              <span className="sr-only">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={mode === "sending"}
                placeholder="you@example.com"
                autoComplete="email"
                className="block w-full bg-transparent border-b border-[var(--color-ink-soft)] focus:border-[var(--color-ink)] focus:outline-none px-1 py-2 font-ui text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={!emailValid || mode === "sending"}
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
