"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CrisisCard } from "./CrisisCard";

type MatchSuccess = { sessionId: string };
type MatchCrisis = { crisis: true; resources: string[] };
type MatchError = { error: string };
type MatchPayload = MatchSuccess | MatchCrisis | MatchError;

export function IntakeForm() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [feeling, setFeeling] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crisisResources, setCrisisResources] = useState<string[] | null>(null);

  const ageNum = Number.parseInt(age, 10);
  const ageValid =
    Number.isInteger(ageNum) && ageNum >= 13 && ageNum <= 100;
  const trimmedFeeling = feeling.trim();
  const feelingValid =
    trimmedFeeling.length >= 10 && feeling.length <= 1000;
  const canSubmit = ageValid && feelingValid && !submitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    let response: Response;
    try {
      response = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ age: ageNum, feeling }),
      });
    } catch {
      setError("The connection dropped. Please try again.");
      setSubmitting(false);
      return;
    }

    let payload: MatchPayload;
    try {
      payload = (await response.json()) as MatchPayload;
    } catch {
      setError(
        response.ok
          ? "Couldn't read the response."
          : `The server returned an error (${response.status}).`,
      );
      setSubmitting(false);
      return;
    }

    if (!response.ok) {
      const message =
        "error" in payload ? payload.error : "Something went wrong.";
      setError(message);
      setSubmitting(false);
      return;
    }

    if ("crisis" in payload && payload.crisis) {
      setCrisisResources(payload.resources);
      return;
    }
    if ("sessionId" in payload) {
      router.push(`/story/${payload.sessionId}`);
      return;
    }
    setError("Unexpected response from the matcher.");
    setSubmitting(false);
  }

  if (crisisResources) {
    return <CrisisCard resources={crisisResources} />;
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
        <h1 className="text-3xl">Onward</h1>
        <p className="text-[var(--color-ink-soft)]">
          Tell us how old you are and what you are going through. We will
          find someone real who lived through something like it.
        </p>
      </header>

      <label className="block space-y-2">
        <span className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
          Age
        </span>
        <input
          type="number"
          min={13}
          max={100}
          value={age}
          onChange={(event) => setAge(event.target.value)}
          disabled={submitting}
          className="w-32 bg-transparent border-b border-[var(--color-ink-soft)] focus:border-[var(--color-ink)] focus:outline-none px-1 py-2"
        />
      </label>

      <label className="block space-y-2">
        <span className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
          What is going on
        </span>
        <textarea
          value={feeling}
          onChange={(event) => setFeeling(event.target.value)}
          disabled={submitting}
          rows={6}
          maxLength={1000}
          placeholder="A few sentences. Whatever feels honest."
          className="block w-full bg-transparent border border-[var(--color-ink-soft)] focus:border-[var(--color-ink)] focus:outline-none p-4 resize-none"
        />
        <span className="block font-ui text-xs text-[var(--color-ink-soft)]/70 text-right">
          {feeling.length}/1000
        </span>
      </label>

      {error ? (
        <p className="font-ui text-sm text-[var(--color-accent)]">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="font-ui text-sm uppercase tracking-wider border border-[var(--color-ink)] px-6 py-3 hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Finding…" : "Begin"}
      </button>
    </motion.form>
  );
}
