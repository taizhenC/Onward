"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const supabase = getSupabaseBrowser();
  if (!supabase) return null; // offline/memory dev: nothing to sign out of

  async function handleSignOut() {
    setSigningOut(true);
    await getSupabaseBrowser()?.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      className="font-ui text-sm text-[var(--color-ink-soft)] underline underline-offset-4 hover:text-[var(--color-ink)] disabled:opacity-30"
    >
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
