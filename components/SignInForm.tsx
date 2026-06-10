"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Props = {
  // Set when /auth/confirm bounced an expired or already-used link back here.
  linkError: boolean;
};

export function SignInForm({ linkError }: Props) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabaseAvailable = getSupabaseBrowser() !== null;
  const trimmedEmail = email.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const canSubmit = emailValid && !sending;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setSending(true);
    setError(null);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
    });

    if (otpError) {
      setError(
        otpError.code === "over_email_send_rate_limit"
          ? "We just sent you a link — give it a minute before asking for another."
          : "The link couldn't be sent. Please try again in a moment.",
      );
      setSending(false);
      return;
    }

    setSentTo(trimmedEmail);
  }

  if (!supabaseAvailable) {
    return (
      <p className="text-[var(--color-ink-soft)]">
        Sign-in isn&apos;t available in this offline build.
      </p>
    );
  }

  if (sentTo) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="space-y-4"
      >
        <h1 className="text-3xl">Check your email</h1>
        <p className="text-[var(--color-ink-soft)] leading-relaxed">
          A sign-in link is on its way to {sentTo}. It works once and expires
          soon — open it on this device if you can.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-10"
    >
      <header className="space-y-3">
        <h1 className="text-3xl">Sign in</h1>
        <p className="text-[var(--color-ink-soft)]">
          Enter the email you saved your stories with. We&apos;ll send you a
          link — there are no passwords here.
        </p>
        {linkError ? (
          <p className="font-ui text-sm text-[var(--color-accent)]">
            That link expired or was already used. Enter your email for a
            fresh one.
          </p>
        ) : null}
      </header>

      <label className="block space-y-2">
        <span className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
          Email
        </span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={sending}
          autoComplete="email"
          className="block w-full bg-transparent border-b border-[var(--color-ink-soft)] focus:border-[var(--color-ink)] focus:outline-none px-1 py-2"
        />
      </label>

      {error ? (
        <p className="font-ui text-sm text-[var(--color-accent)]">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="font-ui text-sm uppercase tracking-wider border border-[var(--color-ink)] px-6 py-3 hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {sending ? "Sending…" : "Send the link"}
      </button>
    </motion.form>
  );
}
