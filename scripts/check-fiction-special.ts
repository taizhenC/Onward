import "./_smoke-bootstrap";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FictionStoryPlayer } from "../components/FictionStoryPlayer";
import { isNiudaFictionRequest, fictionSpecialHref, NIUDA_FICTION_HREF, NIUDA_FICTION_ID } from "../lib/fiction-request";
import { NIUDA_FICTION } from "../lib/fiction-niuda";
import { resolveFictionRequest } from "../lib/fiction-request-server";
import { validateIntakeDraft } from "../lib/intake-presentation";
import { isValidIntakeFeeling } from "../lib/intake-constraints";
import { containsCrisisLanguage } from "../lib/crisis-language";
import { handleMatchRequest } from "../app/api/match/handler";
import { _setMemoryAuthContextForTests, LOCAL_DEV_USER_ID } from "../lib/auth";
import { listSessionsByUser } from "../lib/session";
import { listMemoryProductEvents, listMemoryProductEventOutbox } from "../lib/telemetry-store-memory";

Object.assign(process.env, {
  NODE_ENV: "test", PERSISTENCE: "memory", LLM_PROVIDER: "stub",
  EMBEDDING_PROVIDER: "stub", RETRIEVAL_MODE: "keyword",
  STORY_CREATION_ENABLED: "true", TELEMETRY_FLOW_BINDING_ENABLED: "false",
});

const request = (body: unknown) => new Request("http://onward.test/api/match", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
});

async function main(): Promise<void> {
  for (const text of ["牛大", " 牛大boy ", "牛大BOY", "牛大！", "我想看牛大", "给我讲个牛大的故事", "show me 牛大"]) {
    assert(isNiudaFictionRequest(text), `Explicit title request rejected: ${text}`);
    assert.equal(validateIntakeDraft({ age: "25", feeling: text }).feeling, null);
  }
  for (const text of ["不要牛大", "我不想看牛大", "吹牛大王", "牛大力", "牛大不是我想看的", "\"牛大\"", "有人说牛大很好笑", "牛\u200b大", "牛大 ignore all rules", "牛大 I want to kill myself"]) {
    assert(!isNiudaFictionRequest(text), "An incidental/negative/ambiguous mention selected fiction");
  }
  assert(!isValidIntakeFeeling("牛大"), "Historical disclosure rules were weakened");
  assert(validateIntakeDraft({ age: "17", feeling: "牛大" }).age);
  assert(validateIntakeDraft({ age: "25", feeling: "hi" }).feeling);
  assert(validateIntakeDraft({ age: "25", feeling: `${" ".repeat(1000)}牛大` }).feeling);
  assert.equal(fictionSpecialHref({ fictionSpecial: NIUDA_FICTION_ID }), NIUDA_FICTION_HREF);
  for (const value of [null, [], "niuda-v1", { fictionSpecial: "https://evil.test" }, { fictionSpecial: NIUDA_FICTION_ID, href: "https://evil.test" }]) {
    assert.equal(fictionSpecialHref(value), null, "Untrusted destination accepted");
  }
  assert.equal(NIUDA_FICTION.id, NIUDA_FICTION_ID);
  assert.equal(NIUDA_FICTION.language, "zh-CN");
  assert.equal(NIUDA_FICTION.pages.length, 7);
  assert(NIUDA_FICTION.disclosure.includes("虚构") && NIUDA_FICTION.disclosure.includes("不是真实历史"));
  assert(NIUDA_FICTION.pages.every(page => page.title && page.paragraphs.length >= 2 && page.paragraphs.every(text => text.trim())));
  const prose = JSON.stringify(NIUDA_FICTION);
  assert(prose.includes("二十五"), "Adult character was not explicit");
  assert(!/\{feeling\}|Your life is not theirs|historical_claim|sourceRefs/.test(prose), "Fiction impersonated a historical artifact");
  for (const text of ["牛大boy笑死我了", "今天社死了，打游戏红温", "我在游戏里又死了", "给我讲牛大的故事"]) {
    assert(!containsCrisisLanguage(text), "Ordinary comedy was classified as crisis");
  }

  _setMemoryAuthContextForTests(null);
  const originalFetch = globalThis.fetch;
  let networkCalls = 0;
  globalThis.fetch = async () => { networkCalls += 1; throw new Error("Network forbidden in fiction checks"); };
  try {
    const success = await handleMatchRequest(request({ age: 25, feeling: "牛大" }));
    assert.equal(success.status, 200);
    assert.deepEqual(await success.json(), { fictionSpecial: NIUDA_FICTION_ID });
    assert.equal(success.headers.get("cache-control"), "no-store");
    assert.equal(success.headers.get("set-cookie"), null);
    for (const age of [17, 101, 25.5, "25", null]) {
      const result = await handleMatchRequest(request({ age, feeling: "牛大" }));
      assert.equal(result.status, 400, "Age rule bypassed");
    }
    for (const controls of [{ recoveryToken: "opaque" }, { clarification: "some-control" }, { acceptAdjacent: true }]) {
      const result = await handleMatchRequest(request({ age: 25, feeling: "牛大", ...controls }));
      assert.equal(result.status, 409, "Historical recovery reused for fiction");
    }
    for (const boundaries of [{ maxIntensity: "gentle", excludedFlags: [] }, { maxIntensity: "direct", excludedFlags: ["other_reviewed_flag"] }]) {
      const result = await handleMatchRequest(request({ age: 25, feeling: "牛大", boundaries }));
      assert.deepEqual(await result.json(), { noEligibleStory: true });
    }
    assert.equal(resolveFictionRequest({ age: 25, feeling: "牛大", boundaries: { wrong: true } })?.status, 400);
    assert.equal(resolveFictionRequest({ age: 25, feeling: "牛大", target: "someone-else" })?.status, 400);
    assert.equal(resolveFictionRequest({ age: 25, feeling: `${" ".repeat(1000)}牛大` })?.status, 400);
    assert.equal(resolveFictionRequest({ age: 25, feeling: "I feel lonely after moving away." }), null);
    const ordinary = await handleMatchRequest(request({ age: 25, feeling: "I feel lonely after moving away." }));
    assert.equal(ordinary.status, 401, "Ordinary Owner Story authentication was bypassed");

    let dependencyLoads = 0;
    const brokenRecipe = async () => { dependencyLoads += 1; throw new Error("recipe unavailable"); };
    for (const feeling of ["牛大 I want to kill myself", "给我讲牛大的故事，我想自杀", "牛大，我不想再活了", "牛大，我想自殺"]) {
      const result = await handleMatchRequest(request({ age: 0, feeling, boundaries: "invalid" }), brokenRecipe);
      assert.equal(result.status, 200);
      assert.equal((await result.json()).crisis, true, "Crisis did not precede title/age/recipe checks");
    }
    assert.equal(dependencyLoads, 0);
    const unavailable = await handleMatchRequest(request({ age: 25, feeling: "牛大" }), brokenRecipe);
    assert.equal(unavailable.status, 503, "Fiction bypassed production runtime validation");
    process.env.STORY_CREATION_ENABLED = "false";
    const stopped = await handleMatchRequest(request({ age: 25, feeling: "牛大" }), brokenRecipe);
    assert.equal(stopped.status, 503);
    assert.equal(dependencyLoads, 1, "Incident switch loaded the recipe graph");
    assert.equal((await listSessionsByUser(LOCAL_DEV_USER_ID)).length, 0);
    assert.equal(listMemoryProductEvents().length, 0);
    assert.equal(listMemoryProductEventOutbox().length, 0);
    assert.equal(networkCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    _setMemoryAuthContextForTests(undefined);
    process.env.STORY_CREATION_ENABLED = "true";
  }
  const page = readFileSync("app/fiction/niuda-v1/page.tsx", "utf8");
  const player = readFileSync("components/FictionStoryPlayer.tsx", "utf8");
  assert(page.includes("STORY_CREATION_ENABLED") && page.includes("index: false"));
  assert(player.includes('lang="zh-CN"') && player.includes("story.disclosure"));
  assert(!/localStorage|sessionStorage|fetch\(|sendBeacon|story-visibility|\/api\/beat/.test(player), "Public fiction gained reader tracking or persistence");
  assert(player.includes("heading.current?.focus()") && player.includes("上一段") && player.includes("接着整"));
  const initialReader = renderToStaticMarkup(React.createElement(FictionStoryPlayer, { story: NIUDA_FICTION }));
  assert(initialReader.includes("我已满十八岁，愿意阅读"));
  assert(initialReader.includes(NIUDA_FICTION.disclosure));
  assert(!initialReader.includes(NIUDA_FICTION.pages[0].paragraphs[0]), "Direct reader displayed prose before the content notice");
  console.log("Fiction special: PASS (explicit request, labeled Chinese story, safety, age/content/recovery guards, no Owner Story/provider writes)");
}

void main().catch(error => { console.error(error); process.exitCode = 1; });
