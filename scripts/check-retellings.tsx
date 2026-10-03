import "./_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getRetelling, listRetellings, retellingsPaused } from "../lib/retellings";
import { retellingErrors } from "../lib/retelling-validation";
import { RETELLING_DISCLOSURE, RETELLING_LABEL, RETELLING_ROLES, RETELLING_TOPICS, type Retelling } from "../lib/retelling-types";
import { RetellingCatalog } from "../components/RetellingCatalog";
import { RetellingPlayer } from "../components/RetellingPlayer";
import { RetellingsPaused } from "../components/RetellingsPaused";
import CollectionPage from "../app/retellings/page";
import StoryPage from "../app/retellings/[slug]/page";

const expected = ["berlin-i", "carver", "christie", "coltrane", "lamarr", "lee", "lewis-e", "lindgren",
  "mcclintock", "owens", "poitier", "rachmaninoff", "rogers", "rudolph", "rustin", "wang"];

async function main() {
  const originalFetch = globalThis.fetch;
  const originalPause = process.env.STORY_CREATION_ENABLED;
  let networkCalls = 0;
  globalThis.fetch = async () => { networkCalls += 1; throw new Error("Retellings must not fetch"); };
  try {
    const stories = listRetellings();
    assert.deepEqual(stories.map(story => story.slug).sort(), [...expected].sort());
    assert.equal(new Set(stories.map(story => story.figureName)).size, 16);
    assert.equal(getRetelling("lee")?.figureName, "Frances Glessner Lee");
    assert.equal(RETELLING_LABEL, "Fictionalized retelling");
    assert(RETELLING_DISCLOSURE.includes("invented") && RETELLING_DISCLOSURE.includes("not a documented account"));
    for (const topic of Object.keys(RETELLING_TOPICS)) assert(stories.some(story => story.topics.some(value => value === topic)), "Empty topic");
    for (const entry of stories) {
      assert.deepEqual(Object.keys(entry).sort(), ["slug", "figureName", "title", "summary", "topics", "contentNote"].sort());
      const story = getRetelling(entry.slug)!;
      assert.deepEqual(retellingErrors(story), [], story.slug);
      assert.deepEqual(story.pages.map(page => page.role), [...RETELLING_ROLES]);
      const html = renderToStaticMarkup(<RetellingPlayer story={story} />);
      assert(html.includes(RETELLING_LABEL) && html.includes("Before you read"));
      assert(html.includes("18 or older") && html.includes("not a saved story"));
      assert(html.includes("Documented background and what we invented"));
      assert(html.includes("not evidence that the fictional scenes"));
      assert(html.includes("findahelpline.com") && html.includes("/begin"));
      assert(!html.includes("retelling-passage"), "Narrative visible before explicit fiction choice");
      assert(!html.includes("data-story-session") && !html.includes("historical_claim"));
      for (const source of story.sources) assert(html.includes(source.url.replaceAll("&", "&amp;")), "Missing background reference");
    }
    const catalogHtml = renderToStaticMarkup(<RetellingCatalog stories={stories} />);
    assert.equal((catalogHtml.match(/Fictionalized retelling/g) ?? []).length, 16);
    assert(catalogHtml.includes("not a personal assessment or historical match"));
    for (const entry of stories) assert(catalogHtml.includes(`/retellings/${entry.slug}`));
    for (const slug of ["unknown", "__proto__", "../carver", "CARVER", "carver?feeling=secret", "https://evil.test"]) assert.equal(getRetelling(slug), null);

    for (const value of ["false", " FALSE "]) {
      process.env.STORY_CREATION_ENABLED = value;
      assert(retellingsPaused());
      const catalog = renderToStaticMarkup(<CollectionPage />);
      const story = renderToStaticMarkup(await StoryPage({ params: Promise.resolve({ slug: "carver" }) }));
      for (const html of [catalog, story]) {
        assert(html.includes("temporarily unavailable") && html.includes("findahelpline.com"));
        assert(!html.includes("Before you read") && !html.includes("retelling-topic"));
      }
    }
    process.env.STORY_CREATION_ENABLED = "true";
    assert(!retellingsPaused());
    assert(renderToStaticMarkup(<CollectionPage />).includes("Choose a retelling"));
    await assert.rejects(() => StoryPage({ params: Promise.resolve({ slug: "does-not-exist" }) }), /NEXT_HTTP_ERROR_FALLBACK;404/);
    assert(renderToStaticMarkup(<RetellingsPaused />).includes("crisis resources"));

    // Negative fixtures exercise the same editorial gate as the real catalog.
    const original = getRetelling("carver")!;
    const mutations: Array<(story: Retelling) => Retelling> = [
      story => ({ ...story, inventionNote: "An authentic account." }),
      story => ({ ...story, pages: story.pages.slice(1) }),
      story => ({ ...story, pages: [...story.pages].reverse() }),
      story => ({ ...story, background: [{ text: "Unsupported claim", sourceIds: [] }] }),
      story => ({ ...story, background: [{ text: "Unsupported claim", sourceIds: ["made-up"] }] }),
      story => ({ ...story, sources: story.sources.map(source => ({ ...source, url: "javascript:alert(1)" })) }),
      story => ({ ...story, sources: story.sources.map(source => ({ ...source, url: "https://secret@example.com/source" })) }),
      story => ({ ...story, pages: story.pages.map(page => page.role === "bridge" ? { ...page, paragraphs: ["You will recover because they did.", "Everything will be fine."] } : page) }),
      story => ({ ...story, slug: "../carver" }),
    ];
    for (const mutate of mutations) assert(retellingErrors(mutate(structuredClone(original))).length > 0, "Invalid retelling admitted");

    // This release is not allowed to rewrite historical gold into fiction gold.
    assert.equal(createHash("sha256").update(readFileSync("evals/match.json")).digest("hex"), "f87962a57990f65a8765afdcd141bbdd1c3b9f5a965d04f4810f1787d8aa2a1e");
    for (const file of ["lib/retellings.ts", "lib/retelling-types.ts", "components/RetellingPlayer.tsx", "components/RetellingCatalog.tsx"]) {
      const source = readFileSync(file, "utf8");
      assert(!/from ["'][^"']*(?:\/db|\/session|\/llm|\/embeddings|\/matching|\/telemetry|\/supabase)/.test(source), "Fiction imported historical or persistence machinery");
      assert(!/\b(?:fetch|localStorage|sessionStorage|sendBeacon)\b/.test(source), "Fiction introduced a data sink");
    }
    assert.equal(networkCalls, 0);
    console.log(`Retellings: PASS (16 complete stories, prominent disclosures, source links, opt-in, incident pause, unknown-story 404, ${mutations.length} negative fixtures; no network). Historical matching evidence is unchanged, not newly passed.`);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalPause === undefined) delete process.env.STORY_CREATION_ENABLED;
    else process.env.STORY_CREATION_ENABLED = originalPause;
  }
}

void main();
