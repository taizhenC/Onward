import "server-only";
import { getSupabase } from "./db";
import { validateStorySpec } from "./story-spec";
import type { StorySpec } from "./story-spec-types";

type StorySpecDbRow = { spec: unknown };

export function storySpecStageKey(figureKey: string, stageId: string): string {
  return `${figureKey}\u0000${stageId}`;
}

export async function listPublishedStorySpecKeys(): Promise<ReadonlySet<string>> {
  const catalog = await listPublishedStorySpecCatalog();
  return new Set(catalog.keys());
}

export async function listPublishedStorySpecCatalog(): Promise<
  ReadonlyMap<string, StorySpec>
> {
  const result = await getSupabase()
    .from("story_specs")
    .select("figure_key,stage_id,spec")
    .eq("status", "published");
  if (result.error) throw new Error(`list published StorySpecs failed: ${result.error.message}`);
  const catalog = new Map<string, StorySpec>();
  for (const row of result.data ?? []) {
    try {
      const spec = row.spec as StorySpec;
      const validation = validateStorySpec(spec, { forPublish: true });
      if (
        validation.valid &&
        spec.figureKey === row.figure_key &&
        spec.stageId === row.stage_id
      ) {
        catalog.set(
          storySpecStageKey(row.figure_key, row.stage_id),
          deepFreeze(structuredClone(spec)),
        );
      }
    } catch {
      // A malformed published row is quarantined from matching. The readiness
      // check reports incomplete coverage; runtime never offers invalid content.
    }
  }
  return catalog;
}

// Runtime reads fail closed. A malformed or incompletely reviewed document is
// an operational error and must never be projected into a reader artifact.
export async function getPublishedStorySpec(
  figureKey: string,
  stageId: string,
): Promise<StorySpec | null> {
  const result = await getSupabase()
    .from("story_specs")
    .select("spec")
    .eq("figure_key", figureKey)
    .eq("stage_id", stageId)
    .eq("status", "published")
    .maybeSingle();

  if (result.error) throw new Error(`load published StorySpec failed: ${result.error.message}`);
  if (!result.data) return null;

  const spec = (result.data as StorySpecDbRow).spec as StorySpec;
  let validation;
  try {
    validation = validateStorySpec(spec, { forPublish: true });
  } catch {
    throw new Error("published StorySpec has an invalid document shape");
  }
  if (!validation.valid) {
    throw new Error(`published StorySpec failed validation: ${validation.errors.join("; ")}`);
  }
  return deepFreeze(structuredClone(spec));
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
