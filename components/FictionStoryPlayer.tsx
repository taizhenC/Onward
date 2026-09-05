"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NIUDA_FICTION } from "@/lib/fiction-niuda";

type FictionStory = typeof NIUDA_FICTION;

export function FictionStoryPlayer({ story }: { story: FictionStory }) {
  const [acceptedNotice, setAcceptedNotice] = useState(false);
  const [page, setPage] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [page, acceptedNotice]);
  const passage = story.pages[page];
  const last = page === story.pages.length - 1;
  const move = (next: number) => { moved.current = true; setPage(next); };
  return (
    <article lang="zh-CN" className="space-y-8">
      <header className="space-y-3 border-b border-[var(--color-rule)] pb-6">
        <p className="font-ui text-sm text-[var(--color-ink-soft)]">Onward · 虚构喜剧彩蛋</p>
        <h1 className="text-3xl leading-snug">{story.title}</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">{story.disclosure}</p>
        <p className="text-sm text-[var(--color-ink-soft)]">{story.contentNote}</p>
      </header>
      {!acceptedNotice ? <section aria-label="阅读提示" className="space-y-5">
        <p>这篇喜剧含成人双关，适合已满十八岁且愿意阅读此类内容的人。也可以直接返回历史故事。</p>
        <button type="button" onClick={() => { moved.current = true; setAcceptedNotice(true); }}
          className="min-h-11 rounded-sm bg-[var(--color-accent-deep)] px-6 py-3 text-[var(--color-bg)]">
          我已满十八岁，愿意阅读
        </button>
        <Link href="/begin" className="block min-h-11 py-3 underline underline-offset-4">回到历史故事</Link>
      </section> : <>
      <section aria-labelledby="fiction-passage-heading" className="space-y-5">
        <h2 ref={heading} tabIndex={-1} id="fiction-passage-heading"
          className="text-xl focus:outline-2 focus:outline-offset-4 focus:outline-[var(--color-accent)]">
          {passage.title}
        </h2>
        {passage.paragraphs.map((paragraph, index) => <p key={`${page}-${index}`} className="text-lg leading-loose">{paragraph}</p>)}
      </section>
      <nav aria-label="虚构故事翻页" className="flex flex-wrap items-center gap-5">
        {page > 0 && <button type="button" onClick={() => move(page - 1)} className="min-h-11 underline underline-offset-4">上一段</button>}
        {!last
          ? <button type="button" onClick={() => move(page + 1)} className="min-h-11 rounded-sm bg-[var(--color-accent-deep)] px-6 py-3 text-[var(--color-bg)]">接着整</button>
          : <p role="status" className="text-[var(--color-ink-soft)]">完。没有真实人物在本次创作中被编造履历。</p>}
        <Link href="/begin" className="min-h-11 py-3 underline underline-offset-4">回到历史故事</Link>
      </nav>
      </>}
      <footer className="border-t border-[var(--color-rule)] pt-5 text-sm text-[var(--color-ink-soft)]">
        <p>这是固定的公开虚构短篇，不会保存到“Your stories”。翻页进度只留在当前页面。</p>
        <p className="mt-3">如果你需要危机支持，可以查看 <a href="https://findahelpline.com/" className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">当地支持资源</a>。</p>
      </footer>
    </article>
  );
}
