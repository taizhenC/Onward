import "server-only";
import { createHash } from "node:crypto";
import { FACET_PROJECTION_TEMPLATE_CATALOG } from "./facet-signal";
import { FACET_PROJECTION_SCHEMA_VERSION } from "./facet-tagger-recipe-constants";
import { embedQuery, embeddingModelId } from "./embeddings";
import { consumeDerivedOutput } from "./derived-output-retention";

// Lazy, memoized RETRIEVAL_QUERY vectors for the closed projection-template sentences
// (lib/facet-signal.ts). Template texts act on the QUERY side of the asymmetric encoder — they
// stand in for the user's feeling inside a facet lane — so they must be embedded with the query
// task type, never reuse the seeded document vectors.
//
// Because the catalog is closed (~34 server-owned sentences), the whole working set memoizes in
// process memory: the first match that selects a template pays one embedQuery call; every later
// match reuses the vector. Keys fold in the embedder model id and the projection schema version,
// so an embedder swap or a catalog release invalidates naturally. Failures are absorbed (the
// caller falls back to the raw-feeling query vector) and never memoized — the same
// absorb-don't-retry posture as the tagger itself.
//
// Privacy: this cache holds vectors of SERVER-OWNED editorial sentences only. Membership in the
// closed catalog is enforced below, so user-derived text can never enter it — which is what
// makes a process-wide, request-spanning memo acceptable where a user-query vector memo would
// violate the request-ephemeral rule.

const TEMPLATE_TEXTS: ReadonlySet<string> = new Set(
  Object.values(FACET_PROJECTION_TEMPLATE_CATALOG).flatMap((templates) =>
    templates.map(({ text }) => text),
  ),
);

declare global {
  var __onwardTemplateQueryVectors: Map<string, Promise<number[]>> | undefined;
}

function cacheKey(text: string): string {
  const contentHash = createHash("sha256").update(text, "utf8").digest("hex");
  return `${embeddingModelId()}::${FACET_PROJECTION_SCHEMA_VERSION}::${contentHash}`;
}

// The vector for one catalog sentence, or null when embedding fails (caller falls back to the
// raw-feeling vector). Throws on non-catalog input — that is a programming error, not a
// degradable condition: it would put user-derived text into a cross-request cache.
export async function templateQueryVector(text: string): Promise<number[] | null> {
  if (!TEMPLATE_TEXTS.has(text)) {
    throw new Error("templateQueryVector only accepts catalog sentences.");
  }
  const cache = (globalThis.__onwardTemplateQueryVectors ??= new Map());
  const key = cacheKey(text);
  let pending = cache.get(key);
  if (!pending) {
    pending = embedQuery(text).then((output) =>
      consumeDerivedOutput(output, "retrieval_scoring"),
    );
    cache.set(key, pending);
    // Transient failures must not poison the memo; the next request retries fresh.
    pending.catch(() => cache.delete(key));
  }
  try {
    return await pending;
  } catch {
    return null;
  }
}

export function resetTemplateQueryVectors(): void {
  globalThis.__onwardTemplateQueryVectors = undefined;
}
