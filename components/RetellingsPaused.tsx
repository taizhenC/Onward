import React from "react";
import Link from "next/link";

export function RetellingsPaused() {
  return <main className="mx-auto max-w-[36rem] space-y-5 px-6 py-16">
    <h1 className="text-2xl">Retellings are temporarily unavailable.</h1>
    <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Return to Onward</Link>
    <p>If you need support now, <a href="https://findahelpline.com/" className="inline-flex min-h-11 items-center underline underline-offset-4" target="_blank" rel="noopener noreferrer">find local crisis resources</a>.</p>
  </main>;
}
