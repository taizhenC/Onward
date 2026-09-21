"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RETELLING_DISCLOSURE, RETELLING_LABEL, type Retelling } from "@/lib/retelling-types";

const linkStyle = "inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]";
const buttonStyle = "min-h-11 rounded-sm bg-[var(--color-accent-deep)] px-6 py-3 text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]";

export function RetellingPlayer({ story }: { story: Retelling }) {
  const [accepted, setAccepted] = useState(false);
  const [page, setPage] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [accepted, page]);
  const passage = story.pages[page];
  const last = page === story.pages.length - 1;
  const move = (next: number) => {
    moved.current = true;
    setPage(Math.max(0, Math.min(next, story.pages.length - 1)));
  };

  return <article className="space-y-8">
    <header className="space-y-4 border-b border-[var(--color-rule)] pb-6">
      <p className="font-ui text-sm font-semibold text-[var(--color-accent)]">{RETELLING_LABEL}</p>
      <h1 className="text-3xl leading-snug">{story.title}</h1>
      <p className="text-lg">Inspired by {story.figureName}</p>
      <p className="text-[var(--color-ink-soft)]">{RETELLING_DISCLOSURE}</p>
      <p className="text-sm text-[var(--color-ink-soft)]"><strong>Content note:</strong> {story.contentNote}</p>
    </header>
    {!accepted ? <section aria-labelledby="retelling-notice" className="space-y-5">
      <h2 id="retelling-notice" className="text-xl">Before you read</h2>
      <p>{story.inventionNote}</p>
      <p className="text-sm text-[var(--color-ink-soft)]">This collection is for adults. Choosing a story does not establish a match to your life. It is public fiction, not a saved story; reading progress stays only in this page.</p>
      <button type="button" className={buttonStyle} onClick={() => { moved.current = true; setAccepted(true); }}>
        I’m 18 or older — read the fictionalized retelling
      </button>
      <Link href="/begin" className={linkStyle}>Choose a historical story instead</Link>
    </section> : <>
      <section aria-labelledby="retelling-passage" className="space-y-5">
        <p id="retelling-page-label" className="font-ui text-sm font-semibold text-[var(--color-accent)]">{RETELLING_LABEL} · {story.figureName}</p>
        <h2 id="retelling-passage" ref={heading} tabIndex={-1} aria-describedby="retelling-page-label"
          className="text-xl focus:outline-2 focus:outline-offset-4 focus:outline-[var(--color-accent)]">{passage.title}</h2>
        {passage.paragraphs.map((paragraph, index) => <p key={`${page}-${index}`} className="text-lg leading-loose">{paragraph}</p>)}
      </section>
      <nav aria-label="Retelling pages" className="flex flex-wrap items-center gap-5">
        {page > 0 && <button type="button" onClick={() => move(page - 1)} className={linkStyle}>Previous passage</button>}
        {!last && <button type="button" onClick={() => move(page + 1)} className={buttonStyle}>Continue reading</button>}
        {last && <p role="status" className="text-[var(--color-ink-soft)]">The end of this fictionalized retelling.</p>}
      </nav>
    </>}
    <details className="border-y border-[var(--color-rule)] py-5">
      <summary className="min-h-11 cursor-pointer text-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]">Documented background and what we invented</summary>
      <div className="mt-5 space-y-5">
        <h2 className="text-xl">Documented background</h2>
        <p className="text-sm text-[var(--color-ink-soft)]">These references support only the background below. They are not evidence that the fictional scenes or conversations happened.</p>
        <ul className="list-disc space-y-4 pl-5">
          {story.background.map((fact, index) => <li key={index}>
            <p>{fact.text}</p>
            <p className="text-sm">{fact.sourceIds.map((id, sourceIndex) => {
              const source = story.sources.find(item => item.id === id)!;
              return <span key={id}>{sourceIndex > 0 ? "; " : "Source: "}<a href={source.url} target="_blank" rel="noopener noreferrer" className={linkStyle}>{source.title}</a></span>;
            })}</p>
          </li>)}
        </ul>
        <h2 className="text-xl">What we invented</h2>
        <p>{story.inventionNote}</p>
        <h2 className="text-xl">About the references</h2>
        <ul className="list-disc space-y-3 pl-5">
          {story.sources.map(source => <li key={source.id}><span className="font-semibold">{source.title}.</span> {source.note}</li>)}
        </ul>
      </div>
    </details>
    <footer className="space-y-4 text-sm text-[var(--color-ink-soft)]">
      <p>No part of this fiction promises that your situation will resolve the same way.</p>
      <div className="flex flex-wrap gap-x-6"><Link href="/retellings" className={linkStyle}>Browse more retellings</Link><Link href="/begin" className={linkStyle}>Find a historical story</Link></div>
      <p>Need support now? <a href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer" className={linkStyle}>Find local crisis support</a>.</p>
    </footer>
  </article>;
}
