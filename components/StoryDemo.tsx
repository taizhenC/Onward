"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// A self-contained marketing demo for the landing page: a canned Frederick
// Douglass excerpt that streams in word by word, mirroring how the real reader
// feels. The content is hardcoded on purpose — this is an illustration, not the
// live product (the real story comes from the DB via /api/beat).

type DemoPage = {
  stream: boolean;
  interlude?: boolean;
  revealName?: boolean;
  paragraphs: string[];
};

const STREAM_SPEED_MS = 30;

// The sample disclosure the demo answers — shown once in the intro and echoed
// back in the closing beat. Kept in one place so the two can't drift apart.
const SAMPLE_FEELING =
  "I moved across the country to get away from where I grew up, and now I'm completely alone. I don't recognize the person I'm supposed to become out here, and some days I'm sure I made a mistake.";

const STORY: DemoPage[] = [
  {
    stream: true,
    paragraphs: [
      "There was a young man. He had just escaped from a place where he had not been allowed to choose anything for himself.",
      "He had not picked his name. He had not picked the work he did. He had not picked where he slept. The papers in his shirt pocket said he was someone else — a free man, who had let him borrow that name for a few days so he could travel without being stopped.",
      "Now he was in a city he had never seen, in a room that did not belong to him, four days from the only world he had ever known.",
      "He didn't even know his own age. His mother had died before she could tell him.",
    ],
  },
  {
    stream: true,
    paragraphs: [
      "He held very still when boots stopped at the door downstairs.",
      "He had heard that men came looking for people like him in this city. He had heard they sometimes got what they came for.",
      "The boots moved on. He let himself breathe.",
      "He had written to the woman he loved before he left. He didn't know if the letter had reached her. He didn't know if she could even come — she lived in the same place he had just run from, and anyone could stop her on the way.",
      "He thought about her sitting in the chair next to him.",
      "He thought about her trying to get here, alone.",
      "He thought about her never coming.",
      "The light moved across the floor. He didn't move with it.",
    ],
  },
  {
    stream: false,
    interlude: true,
    paragraphs: [
      "She came. They married that week, and took a boat to a town neither of them had seen. Three years passed there — day labor, a borrowed name, two children born free. Sometimes, at the back of a small church, he stood and said a few sentences about the place he had escaped. The town never thought to ask.",
    ],
  },
  {
    stream: true,
    paragraphs: [
      "One summer he traveled to a big meeting on an island. There were a few hundred people there — most of them white — all talking about ending the system he had escaped from.",
      "A man who had heard him speak at the small church asked him to stand up and tell his own story. He had never spoken to a room of white strangers before. Not from his own mouth. Not about his own life.",
      "He stood up. His voice came out thin. He said the name of the man who had owned him. He said what had been done to him. He said what it had been like to learn to read in secret. His hands sweated against the back of the bench in front of him. He spoke for maybe fifteen minutes. Then he sat down.",
      "A famous man in the room stood up right after him. The famous man turned to the audience and asked them: “Have we been listening to a thing, a piece of property, or a man?”",
      "The room shouted back: “A man! A man!”",
      "Before the night was over, they offered him a paid job — to travel and speak. He took it.",
    ],
  },
  {
    stream: true,
    revealName: true,
    paragraphs: [
      "His name was Frederick Douglass.",
      "He became one of the most important voices in American history. He had escaped from slavery as a young man, and he spent the rest of his life — fifty years — fighting to end it, and then fighting for everyone the country still wouldn't make room for. His books are still read. His words are still quoted. None of that had happened yet on the morning we just sat with him.",
      "Your life is not his. But a piece of this story may still sit beside you.",
      "When he sat in that chair, four days free, he didn't have a name yet. He didn't have a plan. He didn't know if the woman he loved would come. He didn't know that the voice he would become known for was already inside him, waiting.",
      "You don't have to know who you are yet. He didn't either.",
    ],
  },
];

function wordCount(page: DemoPage): number {
  return page.paragraphs.reduce(
    (n, p) => n + p.split(/\s+/).filter(Boolean).length,
    0,
  );
}

const outlineButton =
  "font-ui text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-ink)] border border-[var(--color-accent-deep)] px-[26px] py-[13px] transition-colors hover:bg-[var(--color-accent-deep)] hover:text-[var(--color-bg)]";

export function StoryDemo() {
  const [view, setView] = useState<"intro" | "preface" | "reading">("intro");
  const [pageIndex, setPageIndex] = useState(0);
  const [shownWords, setShownWords] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startStream(idx: number) {
    clearTimer();
    const page = STORY[idx];
    setPageIndex(idx);
    setShownWords(0);
    if (!page.stream) {
      setStreaming(false);
      return;
    }
    setStreaming(true);
    const total = wordCount(page);
    const start = performance.now();
    timerRef.current = setInterval(() => {
      const target = Math.min(
        total,
        Math.floor((performance.now() - start) / STREAM_SPEED_MS) + 1,
      );
      if (target >= total) {
        clearTimer();
        setShownWords(total);
        setStreaming(false);
      } else {
        setShownWords(target);
      }
    }, 16);
  }

  function beginStory() {
    setView("reading");
    startStream(0);
  }

  function skip() {
    if (!streaming) return;
    clearTimer();
    setShownWords(wordCount(STORY[pageIndex]));
    setStreaming(false);
  }

  function next() {
    if (pageIndex >= STORY.length - 1) return;
    startStream(pageIndex + 1);
  }

  function replay() {
    clearTimer();
    setView("preface");
    setPageIndex(0);
    setShownWords(0);
    setStreaming(false);
  }

  const page = STORY[pageIndex];
  let revealed: string[] = [];
  if (page.stream && streaming) {
    let count = shownWords;
    for (const para of page.paragraphs) {
      const words = para.split(/\s+/).filter(Boolean);
      if (count <= 0) break;
      if (count >= words.length) {
        revealed.push(para);
        count -= words.length;
      } else {
        revealed.push(words.slice(0, count).join(" "));
        count = 0;
        break;
      }
    }
  } else {
    revealed = page.paragraphs.slice();
  }
  const paragraphsHead = revealed.slice(0, Math.max(0, revealed.length - 1));
  const lastParagraph = revealed.length ? revealed[revealed.length - 1] : "";

  const isInterlude = view === "reading" && !!page.interlude;
  const isProse = view === "reading" && !isInterlude;
  const showName = view === "reading" && !!page.revealName;
  const isLast = pageIndex >= STORY.length - 1;
  const showActions = view === "reading" && !streaming;
  const showCaret = isProse && streaming;

  return (
    <div className="mx-auto flex min-h-[460px] max-w-[640px] flex-col border border-[var(--color-rule)] bg-[var(--color-bg)] px-10 py-[42px] text-left shadow-[0_1px_0_rgba(31,27,22,0.04)]">
      {view === "intro" ? (
        <div className="ow-fade flex flex-1 flex-col justify-center">
          <p className="mb-[22px] font-ui text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
            Someone opened Onward and wrote
          </p>
          <p className="border-l-2 border-[var(--color-accent)]/55 pl-[22px] text-[21px] italic leading-[1.66] text-[var(--color-ink)] text-pretty">
            {`“${SAMPLE_FEELING}”`}
          </p>
          <div className="mt-10">
            <button
              type="button"
              onClick={() => setView("preface")}
              className={outlineButton}
            >
              Read what Onward found
            </button>
          </div>
        </div>
      ) : null}

      {view === "preface" ? (
        <div className="flex flex-1 flex-col justify-center">
          <div className="flex flex-col gap-4">
            {[
              "That hurts.",
              "You are not the first to stand here.",
              "Someone once stood in this same weight — and went on to a remarkable life.",
              "Let's start with their story.",
            ].map((line, i) => (
              <p
                key={line}
                className={`text-[22px] leading-[1.5] ${
                  i === 3
                    ? "text-[var(--color-ink-soft)]"
                    : "text-[var(--color-ink)]"
                }`}
                style={{ animation: `ow-fade 0.7s ease ${i * 0.55}s both` }}
              >
                {line}
              </p>
            ))}
          </div>
          <div
            className="mt-10"
            style={{ animation: "ow-fade 0.7s ease 2.2s both" }}
          >
            <button type="button" onClick={beginStory} className={outlineButton}>
              Begin their story
            </button>
          </div>
        </div>
      ) : null}

      {view === "reading" ? (
        <div className="flex flex-1 flex-col">
          <div className="mb-[26px] border-b border-[var(--color-rule)] pb-[18px]">
            <p className="font-ui text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
              Beginning again with no name to stand on
            </p>
            {showName ? (
              <h3 className="mt-[10px] text-[23px] font-semibold text-[var(--color-ink)]">
                Frederick Douglass{" "}
                <span className="oldstyle-nums text-[15px] font-normal text-[var(--color-ink-soft)]">
                  1818–1895
                </span>
              </h3>
            ) : null}
          </div>

          {isProse ? (
            <div
              onClick={streaming ? skip : undefined}
              onKeyDown={
                streaming
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        skip();
                      }
                    }
                  : undefined
              }
              role={streaming ? "button" : undefined}
              tabIndex={streaming ? 0 : -1}
              aria-label={streaming ? "Skip animation" : undefined}
              className="flex-1 focus-visible:outline-offset-4 focus-visible:[outline:2px_solid_var(--color-accent)]"
            >
              {paragraphsHead.map((para, i) => (
                <p
                  key={i}
                  className="mb-[1.05em] text-[19px] leading-[1.78] text-[var(--color-ink)] text-pretty"
                >
                  {para}
                </p>
              ))}
              <p className="mb-[1.05em] text-[19px] leading-[1.78] text-[var(--color-ink)] text-pretty">
                {lastParagraph}
                {showCaret ? (
                  <span
                    aria-hidden
                    className="ml-[3px] inline-block h-[1.05em] w-[2px] bg-[var(--color-accent)] align-[-2px]"
                    style={{ animation: "ow-blink 1s step-end infinite" }}
                  />
                ) : null}
              </p>
            </div>
          ) : null}

          {isInterlude ? (
            <div className="flex flex-1 items-center">
              <p className="border-l-2 border-[var(--color-accent)]/50 pl-5 text-[18px] italic leading-[1.75] text-[var(--color-ink-soft)] text-pretty">
                {lastParagraph}
              </p>
            </div>
          ) : null}

          {showActions ? (
            <div className="ow-fade mt-8 flex items-center gap-[18px]">
              {isLast ? (
                <>
                  <Link
                    href="/begin"
                    className={`inline-block ${outlineButton}`}
                  >
                    Begin your own
                  </Link>
                  <button
                    type="button"
                    onClick={replay}
                    className="font-ui text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
                  >
                    Replay
                  </button>
                </>
              ) : (
                <button type="button" onClick={next} className={outlineButton}>
                  Continue
                </button>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
