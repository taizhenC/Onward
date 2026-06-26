"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Props = {
  // Set when /auth/confirm bounced an expired or already-used link back here.
  linkError: boolean;
};

// Diamond divider that opens each state. It breathes on the confirmation state
// to give the otherwise-static "check your email" screen a small sign of life.
function Ornament({ pulse = false }: { pulse?: boolean }) {
  const line = pulse ? "w-9" : "w-8";
  return (
    <div className="mb-6 flex items-center justify-center gap-3" aria-hidden>
      <span className={`block h-px ${line} bg-[var(--color-ink)]/30`} />
      <span
        className={`leading-none text-[var(--color-accent)] ${
          pulse ? "diamond-pulse text-[10px]" : "text-[9px]"
        }`}
      >
        ◆
      </span>
      <span className={`block h-px ${line} bg-[var(--color-ink)]/30`} />
    </div>
  );
}

function Eyebrow() {
  return (
    <p className="mb-[18px] font-ui text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
      Welcome back
    </p>
  );
}

const headingClasses =
  "text-[clamp(2.1rem,5vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.018em]";

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
      <p className="text-center text-[var(--color-ink-soft)]">
        Sign-in isn&apos;t available in this offline build.
      </p>
    );
  }

  // Sent state. This is terminal on purpose: the magic link must be opened from
  // the user's email — there is no signed-in session to continue from here.
  if (sentTo) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <Ornament pulse />
        <Eyebrow />
        <h1 className={headingClasses}>Check your email</h1>
        <p className="mx-auto mt-5 max-w-[27rem] text-[18px] leading-[1.65] text-[var(--color-ink-soft)] text-pretty">
          A sign-in link is on its way to{" "}
          <span className="text-[var(--color-ink)]">{sentTo}</span>. It works
          once and expires soon — open it on this device if you can.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center">
        <Ornament />
        <Eyebrow />
        <h1 className={headingClasses}>Sign in</h1>
        <p className="mx-auto mt-[18px] max-w-[26rem] text-[18px] leading-[1.62] text-[var(--color-ink-soft)] text-pretty">
          Enter the email you saved your stories with. We&apos;ll send you a
          link — there are no passwords here.
        </p>
        {linkError ? (
          <p className="mx-auto mt-4 max-w-[26rem] font-ui text-sm text-[var(--color-accent)]">
            That link expired or was already used. Enter your email for a fresh
            one.
          </p>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-[42px] flex flex-col gap-[26px]"
      >
        <label className="block">
          <span className="mb-[10px] block font-ui text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={sending}
            autoComplete="email"
            placeholder="you@example.com"
            className="block w-full border-b border-[var(--color-ink)]/40 bg-transparent px-[2px] py-2 font-body text-[20px] text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
          />
        </label>

        {error ? (
          <p className="font-ui text-sm text-[var(--color-accent)]">{error}</p>
        ) : null}

        <div>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`border px-8 py-[14px] font-ui text-xs font-medium uppercase tracking-[0.16em] transition-colors ${
              canSubmit
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-bg)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]"
                : "cursor-not-allowed border-[var(--color-ink)]/30 bg-transparent text-[var(--color-ink)] opacity-40"
            }`}
          >
            {sending ? "Sending…" : "Send the link"}
          </button>
        </div>
      </form>

      <div className="mt-10 border-t border-[var(--color-ink)]/12 pt-[22px]">
        <Link
          href="/begin"
          className="font-ui text-[13px] tracking-[0.02em] text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
        >
          New to Onward?{" "}
          <span className="text-[var(--color-accent)]">Begin a story →</span>
        </Link>
      </div>
    </motion.div>
  );
}
