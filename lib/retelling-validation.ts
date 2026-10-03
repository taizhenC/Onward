import { containsToneViolation } from "./reader-bridge-copy";
import { RETELLING_ROLES, RETELLING_TOPICS, type Retelling } from "./retelling-types";

// Editorial structure and disclosure checks, not a factuality classifier.
// Human review still verifies background, inventions and reader safety.
export function retellingErrors(story: Retelling): string[] {
  const errors: string[] = [];
  const require = (condition: boolean, message: string) => { if (!condition) errors.push(message); };
  const nonempty = (value: string) => value.trim().length > 0;
  require(story.kind === "fictionalized-retelling-v1", "Wrong story kind");
  require(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(story.slug), "Unsafe slug");
  for (const field of ["figureName", "title", "summary", "contentNote", "inventionNote"] as const) {
    require(nonempty(story[field]), "Missing " + field);
  }
  require(/invent|fiction|imagined/i.test(story.inventionNote), "Inventions must be explicitly disclosed");
  require(story.topics.length > 0 && new Set(story.topics).size === story.topics.length, "Missing or duplicate topics");
  require(story.topics.every(topic => Object.hasOwn(RETELLING_TOPICS, topic)), "Unknown reading topic");
  require(story.background.length >= 1 && story.sources.length >= 1, "Documented background needs references");
  const ids = new Set(story.sources.map(source => source.id));
  require(ids.size === story.sources.length, "Duplicate source ID");
  for (const source of story.sources) {
    require(/^[a-z0-9-]+$/.test(source.id) && nonempty(source.title) && nonempty(source.note), "Incomplete source");
    let safeUrl = false;
    try {
      const url = new URL(source.url);
      safeUrl = url.protocol === "https:" && !url.username && !url.password && !!url.hostname;
    } catch { /* Invalid links are rejected, never repaired silently. */ }
    require(safeUrl, "Source URL must be public HTTPS without credentials");
    require(story.background.some(fact => fact.sourceIds.includes(source.id)), "Unreferenced source");
  }
  for (const fact of story.background) {
    require(nonempty(fact.text) && fact.sourceIds.length > 0, "Background claim needs a source");
    require(new Set(fact.sourceIds).size === fact.sourceIds.length && fact.sourceIds.every(id => ids.has(id)), "Invalid background reference");
  }
  require(story.pages.length === RETELLING_ROLES.length, "Incomplete seven-part story");
  const paragraphs: string[] = [];
  story.pages.forEach((page, index) => {
    require(page.role === RETELLING_ROLES[index], "Story roles out of order");
    require(nonempty(page.title) && page.paragraphs.length >= 2, "Passage requires a heading and complete paragraphs");
    require(page.paragraphs.every(nonempty), "Empty passage");
    if (page.role === "bridge") require(!containsToneViolation(page.paragraphs.join(" ")), "Bridge instructs, promises, diagnoses or equates lives");
    paragraphs.push(...page.paragraphs);
  });
  require(new Set(paragraphs).size === paragraphs.length, "Duplicate story paragraphs");
  const words = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  require(words >= 400 && words <= 900, "Retelling must contain 400–900 words");
  return errors;
}
