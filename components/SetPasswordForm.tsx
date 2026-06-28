"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

// Set/change a password from the profile (/stories). The user is already signed
// in and permanent here, so updateUser({ password }) is reliable. Once set, they
// can sign in with email + password instead of waiting for an email link.
type Mode = "idle" | "saving" | "saved";

export function SetPasswordForm() {
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);
  // Render nothing until mounted so server + first client render match (hardens the
  // browser-only auth gate below against hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Reuse this instance in handleSubmit (no second getSupabaseBrowser() call). It's
  // guarded non-null right below, but TS doesn't carry that narrowing into the async
  // closure, so handleSubmit asserts it — safe because the form only renders, and
  // handleSubmit only runs, when supabase is non-null.
  const supabase = getSupabaseBrowser();
  if (!supabase) return null; // offline/memory dev — no auth

  // Gate on non-empty only; let Supabase validate strength on submit so the
  // weak_password message fires and the rule tracks the dashboard config.
  const valid = password.length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || mode === "saving") return;
    setMode("saving");
    setError(null);

    const { error: updateError } = await supabase!.auth.updateUser({ password });
    if (updateError) {
      setError(
        updateError.code === "weak_password"
          ? "Please choose a longer password (at least 6 characters)."
          : "Couldn't save your password. Try again in a moment.",
      );
      setMode("idle");
      return;
    }
    setPassword("");
    setMode("saved");
  }

  return (
    <section className="space-y-4 border-t border-[var(--color-ink-soft)]/30 pt-8">
      <div className="space-y-1">
        <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
          Account
        </p>
        <p className="text-[var(--color-ink-soft)] leading-relaxed">
          Set a password to sign in without waiting for an email link.
        </p>
      </div>

      {mode === "saved" ? (
        <p className="font-ui text-sm text-[var(--color-ink-soft)]">
          Password saved. You can use it next time you sign in.
        </p>
      ) : null}
      {error ? (
        <p className="font-ui text-sm text-[var(--color-accent)]">{error}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex items-end gap-4 flex-wrap">
        <label className="block grow space-y-2">
          <span className="sr-only">New password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={mode === "saving"}
            autoComplete="new-password"
            placeholder="New password (6+ characters)"
            className="block w-full bg-transparent border-b border-[var(--color-ink-soft)] focus:border-[var(--color-ink)] focus:outline-none px-1 py-2 font-ui text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={!valid || mode === "saving"}
          className="font-ui text-sm uppercase tracking-wider border border-[var(--color-ink)] px-5 py-2 hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {mode === "saving" ? "Saving…" : "Save password"}
        </button>
      </form>
    </section>
  );
}
