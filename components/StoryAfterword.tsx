"use client";

import { useMemo, useRef, useState } from "react";
import type {
  HistoricalConcernReason,
  StoryTransparency,
  StoryTransparencyFact,
} from "@/lib/story-transparency-types";
import { storyEvidenceLabel } from "@/lib/story-transparency-presentation";
import { sendSourceOpened } from "@/lib/story-visibility-client";

type AfterwordFigure = {
  displayName: string;
  birthYear?: number;
  deathYear?: number;
};

type Props = {
  sessionId: string;
  transparency: StoryTransparency | null;
  figure?: AfterwordFigure | null;
};

type SubmissionState = "idle" | "submitting" | "sent" | "error";

const REASON_OPTIONS: Array<{
  value: HistoricalConcernReason;
  label: string;
}> = [
  { value: "incorrect_fact", label: "A fact seems incorrect" },
  {
    value: "misleading_context",
    label: "Important context is missing or misleading",
  },
  {
    value: "source_problem",
    label: "The source does not appear to support the claim",
  },
  {
    value: "quote_or_attribution",
    label: "A quotation or attribution seems wrong",
  },
  {
    value: "date_or_sequence",
    label: "A date or sequence seems wrong",
  },
];

export function StoryAfterword({ sessionId, transparency, figure }: Props) {
  const [factId, setFactId] = useState("");
  const [reason, setReason] = useState<HistoricalConcernReason>("incorrect_fact");
  const [submission, setSubmission] = useState<SubmissionState>("idle");
  const submittingRef = useRef(false);
  const sourceOpenedRef = useRef(false);
  const reportableFacts = useMemo(
    () => (transparency ? factsByFirstPassage(transparency) : []),
    [transparency],
  );

  if (!transparency) {
    return (
      <section
        aria-labelledby="story-afterword-heading"
        className="border-t border-[var(--color-ink-soft)]/30 pt-8"
      >
        <h2 id="story-afterword-heading" className="text-xl">
          About this story
        </h2>
        <p className="mt-3 leading-relaxed text-[var(--color-ink-soft)]">
          This earlier saved story predates Onward&apos;s source record. We won&apos;t
          reconstruct its provenance from newer, changeable content.
        </p>
      </section>
    );
  }

  const canReport =
    transparency.provenance.status === "editorially_reviewed" &&
    reportableFacts.length > 0;

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canReport || !factId || submittingRef.current) return;
    submittingRef.current = true;
    setSubmission("submitting");
    try {
      const response = await fetch("/api/historical-concern", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, factId, reason }),
      });
      setSubmission(response.ok ? "sent" : "error");
    } catch {
      setSubmission("error");
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <section
      aria-labelledby="story-afterword-heading"
      className="space-y-6 border-t border-[var(--color-ink-soft)]/30 pt-8"
    >
      <div className="space-y-3">
        <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
          Afterword
        </p>
        <h2 id="story-afterword-heading" className="text-xl">
          Why this story
        </h2>
        <p className="leading-relaxed">{transparency.rationale.resonance}</p>
        <p className="leading-relaxed text-[var(--color-ink-soft)]">
          {transparency.rationale.gap}
        </p>
        {transparency.provenance.status === "review_draft" ? (
          <p className="border-l-2 border-[var(--color-accent)] pl-3 font-ui text-sm leading-relaxed">
            Editorial review draft — this source mapping is not cleared for a
            public release.
          </p>
        ) : null}
      </div>

      <details
        onToggle={(event) => {
          if (!event.currentTarget.open || sourceOpenedRef.current) return;
          sourceOpenedRef.current = true;
          void sendSourceOpened(sessionId);
        }}
        className="group border-y border-[var(--color-ink-soft)]/30 py-4"
      >
        <summary className="cursor-pointer list-none font-ui text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]">
          <h3 id="story-record-heading" className="inline font-ui text-sm font-medium">
            Who this was, and what really happened
          </h3>
          <span aria-hidden="true" className="float-right group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="mt-5 space-y-7">
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            The story you just read keeps to what happened. Where it puts you
            inside a moment, some of the scene is ours. This section separates
            the two, and shows where to read more.
          </p>

          {figure ? <WhoThisWas figure={figure} /> : null}

          {transparency.facts.length > 0 ? (
            <EvidenceFacts transparency={transparency} />
          ) : (
            <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
              Claim-level evidence links are still awaiting editorial review.
            </p>
          )}

          <DramatizedLines transparency={transparency} />

          <div className="space-y-3">
            <h4 className="font-ui text-sm font-medium">How each passage was told</h4>
            <ol className="space-y-3 text-sm leading-relaxed">
              {transparency.beats.map((beat, index) => (
                <li key={`${beat.role}-${index}`}>
                  <span className="font-medium">
                    {index + 1}. {roleLabel(beat.role)}:
                  </span>{" "}
                  {storyEvidenceLabel(beat)}.
                  {beat.hasPersonalizedTransition ? (
                    <span className="block text-[var(--color-ink-soft)]">
                      Personalized transition — connective wording only; it adds
                      no historical facts.
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>

          <QuoteEvidence transparency={transparency} />
          <SourceList transparency={transparency} />
          <StoryRecord transparency={transparency} />
        </div>
      </details>

      {canReport ? (
        <details className="group border-b border-[var(--color-ink-soft)]/30 pb-4">
          <summary className="cursor-pointer list-none font-ui text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]">
            <h3 id="story-concern-heading" className="inline font-ui text-sm font-medium">
              Report a historical concern
            </h3>
            <span aria-hidden="true" className="float-right group-open:rotate-45">
              +
            </span>
          </summary>
          <form onSubmit={submitReport} className="mt-5 space-y-5">
            <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
              This sends only the story record, selected historical claim, and
              reason. It does not include what you wrote before the story.
            </p>
            <label className="block space-y-2 font-ui text-sm">
              <span className="font-medium">Historical claim</span>
              <select
                value={factId}
                onChange={(event) => {
                  setFactId(event.target.value);
                  if (submission !== "submitting") setSubmission("idle");
                }}
                required
                disabled={submission === "submitting" || submission === "sent"}
                className="block min-h-11 w-full border border-[var(--color-ink-soft)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              >
                <option value="">Choose a claim</option>
                {reportableFacts.map(({ fact, passage }) => (
                  <option key={fact.factId} value={fact.factId}>
                    {passage}: {fact.statement}
                  </option>
                ))}
              </select>
            </label>

            <fieldset
              disabled={submission === "submitting" || submission === "sent"}
              className="space-y-3"
            >
              <legend className="font-ui text-sm font-medium">What seems wrong?</legend>
              {REASON_OPTIONS.map((option) => (
                <label key={option.value} className="flex min-h-11 items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="historical-concern-reason"
                    value={option.value}
                    checked={reason === option.value}
                    onChange={() => {
                      setReason(option.value);
                      if (submission !== "submitting") setSubmission("idle");
                    }}
                    className="size-4 accent-[var(--color-accent)]"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </fieldset>

            {submission === "sent" ? (
              <p aria-live="polite" className="font-ui text-sm">
                Thank you. This has been added to the editorial review queue.
              </p>
            ) : (
              <button
                type="submit"
                disabled={!factId || submission === "submitting"}
                className="min-h-11 border border-[var(--color-accent-deep)] px-5 py-2 font-ui text-sm uppercase tracking-wider transition-colors hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submission === "submitting" ? "Sending…" : "Send concern"}
              </button>
            )}
            {submission === "error" ? (
              <p role="alert" className="font-ui text-sm text-[var(--color-accent)]">
                The concern could not be sent. Please try again.
              </p>
            ) : null}
          </form>
        </details>
      ) : null}
    </section>
  );
}

function WhoThisWas({ figure }: { figure: AfterwordFigure }) {
  const lifespan =
    figure.birthYear && figure.deathYear
      ? `${figure.birthYear}–${figure.deathYear}`
      : figure.birthYear
        ? `born ${figure.birthYear}`
        : null;
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      <h4 className="font-ui text-sm font-medium">Who this was</h4>
      <p>
        <span className="font-medium">{figure.displayName}</span>
        {lifespan ? (
          <span className="text-[var(--color-ink-soft)]"> ({lifespan})</span>
        ) : null}
      </p>
    </div>
  );
}

function StoryRecord({ transparency }: { transparency: StoryTransparency }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      <h4 className="font-ui text-sm font-medium">Story record</h4>
      <p className="break-words">
        {transparency.storySpec.storySpecId} · version {transparency.storySpec.version} ·{" "}
        {transparency.storySpec.schemaVersion}
      </p>
      <p className="text-[var(--color-ink-soft)]">
        {transparency.provenance.status === "editorially_reviewed"
          ? `Editorially reviewed${
              transparency.provenance.reviewedAt
                ? ` on ${transparency.provenance.reviewedAt.slice(0, 10)}`
                : ""
            }.`
          : "Editorial review draft."}
      </p>
    </div>
  );
}

function EvidenceFacts({ transparency }: { transparency: StoryTransparency }) {
  const sources = new Map(
    transparency.sources.map((source) => [source.sourceId, source]),
  );
  return (
    <div className="space-y-3">
      <h4 className="font-ui text-sm font-medium">What really happened</h4>
      <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
        The documented record, in order, with where each claim comes from.
      </p>
      <ol className="space-y-4 text-sm leading-relaxed">
        {transparency.facts.map((fact) => (
          <li key={fact.factId} className="break-words">
            <p>
              <span className="font-medium">{factLabel(fact)}:</span>{" "}
              {fact.statement}
            </p>
            <p className="text-[var(--color-ink-soft)]">
              {fact.sourceRefs.map((ref) => {
                const source = sources.get(ref.sourceId);
                return `${source?.citation ?? ref.sourceId}${
                  ref.locator ? ` — ${ref.locator}` : ""
                }`;
              }).join("; ")}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DramatizedLines({ transparency }: { transparency: StoryTransparency }) {
  const passages = transparency.beats
    .map((beat, index) => ({
      key: `${beat.role}-${index}`,
      label: `Passage ${index + 1} — ${roleLabel(beat.role)}`,
      sentences: beat.dramatizedSentences ?? [],
    }))
    .filter((passage) => passage.sentences.length > 0);
  if (passages.length === 0) return null;
  return (
    <div className="space-y-3">
      <h4 className="font-ui text-sm font-medium">What we wrote ourselves</h4>
      <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
        These lines are scene detail we wrote so the story could be told as a
        story. Each one rests on a documented moment listed above, and none adds
        a person, place, date, amount, quotation, or event to the record.
      </p>
      <ul className="space-y-4 text-sm leading-relaxed">
        {passages.map((passage) => (
          <li key={passage.key}>
            <p className="font-medium">{passage.label}</p>
            <ul className="mt-1 space-y-1 text-[var(--color-ink-soft)]">
              {passage.sentences.map((sentence, index) => (
                <li key={`${passage.key}-${index}`}>“{sentence}”</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuoteEvidence({ transparency }: { transparency: StoryTransparency }) {
  if (transparency.quotes.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-soft)]">
        No direct quotations are used in this story.
      </p>
    );
  }
  const sources = new Map(
    transparency.sources.map((source) => [source.sourceId, source]),
  );
  return (
    <div className="space-y-3">
      <h4 className="font-ui text-sm font-medium">Quotations</h4>
      <ul className="space-y-3 text-sm leading-relaxed">
        {transparency.quotes.map((quote) => (
          <li key={quote.quoteId}>
            <span className="font-medium">{quoteStatusLabel(quote.status)}:</span>{" "}
            “{quote.text}”
            {quote.speaker ? ` — ${quote.speaker}` : ""}
            <span className="block text-[var(--color-ink-soft)]">
              {quote.sourceRefs
                .map((ref) => {
                  const source = sources.get(ref.sourceId);
                  return `${source?.citation ?? ref.sourceId}${
                    ref.locator ? ` — ${ref.locator}` : ""
                  }`;
                })
                .join("; ")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SourceList({ transparency }: { transparency: StoryTransparency }) {
  return (
    <div className="space-y-3">
      <h4 className="font-ui text-sm font-medium">Where to read more</h4>
      <ol className="space-y-3 text-sm leading-relaxed">
        {transparency.sources.map((source) => (
          <li key={source.sourceId} className="break-words">
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[var(--color-ink-soft)] underline-offset-4 hover:decoration-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              >
                {source.citation} <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              source.citation
            )}
            {source.locator ? (
              <span className="block text-[var(--color-ink-soft)]">{source.locator}</span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function factsByFirstPassage(transparency: StoryTransparency) {
  const facts = new Map(transparency.facts.map((fact) => [fact.factId, fact]));
  const seen = new Set<string>();
  const result: Array<{ fact: StoryTransparencyFact; passage: string }> = [];
  transparency.beats.forEach((beat, index) => {
    for (const factId of beat.factIds) {
      const fact = facts.get(factId);
      if (!fact || seen.has(factId)) continue;
      seen.add(factId);
      result.push({ fact, passage: `Passage ${index + 1} — ${roleLabel(beat.role)}` });
    }
  });
  return result;
}

function factLabel(fact: StoryTransparencyFact): string {
  if (fact.confidence === "disputed") return "Disputed historical claim";
  if (fact.confidence === "probable") return "Probable historical claim";
  return fact.claimKind === "sensory" ? "Documented scene detail" : "Documented historical claim";
}

function quoteStatusLabel(status: StoryTransparency["quotes"][number]["status"]): string {
  switch (status) {
    case "verbatim":
      return "Direct quotation";
    case "paraphrase":
      return "Historical paraphrase";
    case "disputed":
      return "Disputed wording";
    case "forbidden":
      return "Not approved for use";
    case "unverified":
      return "Unverified wording";
  }
}

function roleLabel(role: StoryTransparency["beats"][number]["role"]): string {
  return role.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
