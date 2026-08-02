"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Props = {
  // Set when /auth/confirm bounced an expired or already-used link back here.
  linkError: boolean;
};

// Two ways in: a password (fast, no email round-trip) or a one-time email link.
// Password is the default for returning users; the email link doubles as the
// password-recovery path (no separate reset flow).
type Mode = "password" | "link";

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

const inputClasses =
  "block w-full border-b border-[var(--color-ink)]/40 bg-transparent px-[2px] py-2 font-body text-[20px] text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]";

const labelClasses =
  "mb-[10px] block font-ui text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-soft)]";

export function SignInForm({ linkError }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sentStatusRef = useRef<HTMLParagraphElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  // Render nothing until mounted on the client, so the server HTML and the first
  // client render are identical — defensive hardening of the browser-only auth gate
  // below against any future hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const supabaseAvailable = getSupabaseBrowser() !== null;
  const trimmedEmail = email.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const canSubmit =
    !sending &&
    emailValid &&
    (mode === "link" || password.length > 0);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setSending(true);
    setError(null);

    if (mode === "password") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError) {
        setError(passwordErrorMessage(signInError.code));
        setSending(false);
        focusAfterRender(errorRef);
        return;
      }
      // The browser client just wrote the auth cookie. Invalidate the router cache
      // first, then navigate, so /stories is fetched fresh with the new cookie
      // rather than from any cached (logged-out) payload.
      router.refresh();
      router.push("/stories");
      return;
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      // /signin is a returning-owner surface. Creating a new permanent user
      // here would bypass the informed guest-to-permanent Save decision.
      options: { shouldCreateUser: false },
    });
    if (otpError) {
      setError(
        otpError.code === "over_email_send_rate_limit"
          ? "We just sent you a link — give it a minute before asking for another."
          : "The link couldn't be sent. Please try again in a moment.",
      );
      setSending(false);
      focusAfterRender(errorRef);
      return;
    }
    setSentTo(trimmedEmail);
    focusAfterRender(sentStatusRef);
  }

  // Gate the entire render on mount (the line that actually prevents the mismatch).
  if (!mounted) return null;

  if (!supabaseAvailable) {
    return (
      <p className="text-center text-[var(--color-ink-soft)]">
        Sign-in isn&apos;t available in this offline build.
      </p>
    );
  }

  // Sent state (email-link mode). Terminal on purpose: the magic link must be
  // opened from the user's email — there is no signed-in session to continue from.
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
        <p
          ref={sentStatusRef}
          tabIndex={-1}
          role="status"
          className="mx-auto mt-5 max-w-[27rem] text-[18px] leading-[1.65] text-[var(--color-ink-soft)] text-pretty focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
        >
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
          {mode === "password"
            ? "Enter the email and password you saved your stories with."
            : "We'll email you a one-time link — no password needed."}
        </p>
        {linkError ? (
          <p className="mx-auto mt-4 max-w-[26rem] font-ui text-sm text-[var(--color-accent)]">
            That link expired or was already used. Sign in again below.
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-[42px] flex flex-col gap-[26px]">
        <label className="block">
          <span className={labelClasses}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={sending}
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClasses}
          />
        </label>

        {mode === "password" ? (
          <label className="block">
            <span className={labelClasses}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={sending}
              autoComplete="current-password"
              placeholder="••••••••"
              className={inputClasses}
            />
          </label>
        ) : null}

        {error ? (
          <p
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="font-ui text-sm text-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            {error}
          </p>
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
            {sending
              ? mode === "password"
                ? "Signing in…"
                : "Sending…"
              : mode === "password"
                ? "Sign in"
                : "Send the link"}
          </button>
        </div>
      </form>

      {/* Mode toggle — the email link is also the "forgot password" recovery. */}
      <div className="mt-7">
        {mode === "password" ? (
          <button
            type="button"
            onClick={() => switchMode("link")}
            className="font-ui text-[13px] tracking-[0.02em] text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
          >
            Forgot your password?{" "}
            <span className="text-[var(--color-accent)]">Email me a link instead</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => switchMode("password")}
            className="font-ui text-[13px] tracking-[0.02em] text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
          >
            <span className="text-[var(--color-accent)]">Use a password instead</span>
          </button>
        )}
      </div>

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

// Supabase auth error code → gentle, human message. Unknown codes fall through
// to a generic line; the email-link toggle below is always the recovery path.
function passwordErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "That email and password don't match. Try again, or email yourself a link.";
    case "email_not_confirmed":
      return "Your email isn't confirmed yet — use the email link below to get in.";
    default:
      return "We couldn't sign you in. Try again in a moment.";
  }
}

function focusAfterRender(
  target: React.RefObject<HTMLElement | null>,
): void {
  requestAnimationFrame(() => target.current?.focus());
}
