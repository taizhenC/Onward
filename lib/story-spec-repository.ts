import "server-only";
import { getSupabase } from "./db";
import {
  parseStorySpecDocument,
  validateStorySpec,
} from "./story-spec";
import type { StorySpec } from "./story-spec-types";

type StorySpecDbRow = Readonly<{
  story_spec_id: unknown;
  figure_key: unknown;
  stage_id: unknown;
  version: unknown;
  schema_version: unknown;
  status: unknown;
  spec: unknown;
}>;

const STORY_SPEC_ROW_KEYS = [
  "story_spec_id",
  "figure_key",
  "stage_id",
  "version",
  "schema_version",
  "status",
  "spec",
] as const;

export function storySpecStageKey(figureKey: string, stageId: string): string {
  return `${figureKey}\u0000${stageId}`;
}

export type PublishedStorySpecInspection = Readonly<{
  catalog: ReadonlyMap<string, StorySpec>;
  rawPublishedRowCount: number;
  quarantinedRowCount: number;
}>;

export async function listPublishedStorySpecKeys(): Promise<ReadonlySet<string>> {
  const catalog = await listPublishedStorySpecCatalog();
  return new Set(catalog.keys());
}

export async function listPublishedStorySpecCatalog(): Promise<
  ReadonlyMap<string, StorySpec>
> {
  return (await inspectPublishedStorySpecs()).catalog;
}

export async function inspectPublishedStorySpecs(): Promise<
  PublishedStorySpecInspection
> {
  const result = await getSupabase()
    .from("story_specs")
    .select(
      "story_spec_id,figure_key,stage_id,version,schema_version,status,spec",
    )
    .eq("status", "published");
  if (result.error) throw new Error(`list published StorySpecs failed: ${result.error.message}`);
  return inspectPublishedStorySpecRows(result.data ?? []);
}

export function inspectPublishedStorySpecRows(
  rows: readonly unknown[],
): PublishedStorySpecInspection {
  const catalog = new Map<string, StorySpec>();
  const duplicateKeys = new Set<string>();
  let quarantinedRowCount = 0;
  for (const row of rows) {
    const spec = parsePublishedStorySpecRow(row);
    if (!spec) {
      quarantinedRowCount += 1;
      continue;
    }
    const key = storySpecStageKey(spec.figureKey, spec.stageId);
    if (duplicateKeys.has(key)) {
      quarantinedRowCount += 1;
      continue;
    }
    if (catalog.has(key)) {
      catalog.delete(key);
      duplicateKeys.add(key);
      quarantinedRowCount += 2;
      continue;
    }
    catalog.set(key, spec);
  }
  return {
    catalog,
    rawPublishedRowCount: rows.length,
    quarantinedRowCount,
  };
}

// Runtime reads fail closed. A malformed or incompletely reviewed document is
// an operational error and must never be projected into a reader artifact.
export async function getPublishedStorySpec(
  figureKey: string,
  stageId: string,
): Promise<StorySpec | null> {
  const result = await getSupabase()
    .from("story_specs")
    .select(
      "story_spec_id,figure_key,stage_id,version,schema_version,status,spec",
    )
    .eq("figure_key", figureKey)
    .eq("stage_id", stageId)
    .eq("status", "published")
    .maybeSingle();

  if (result.error) throw new Error(`load published StorySpec failed: ${result.error.message}`);
  if (!result.data) return null;

  const spec = parsePublishedStorySpecRow(result.data);
  if (
    !spec ||
    spec.figureKey !== figureKey ||
    spec.stageId !== stageId
  ) {
    throw new Error("published StorySpec failed its integrity boundary");
  }
  return spec;
}

export function parsePublishedStorySpecRow(value: unknown): StorySpec | null {
  return parseStorySpecRow(value, "published");
}

export function parseStorySpecRow(
  value: unknown,
  expectedStatus: "review" | "published",
): StorySpec | null {
  if (!isRecord(value) || !hasExactKeys(value, STORY_SPEC_ROW_KEYS)) {
    return null;
  }
  const row = value as StorySpecDbRow;
  const spec = parseStorySpecDocument(row.spec);
  if (
    !spec ||
    typeof row.story_spec_id !== "string" ||
    typeof row.figure_key !== "string" ||
    typeof row.stage_id !== "string" ||
    typeof row.version !== "number" ||
    !Number.isFinite(row.version) ||
    typeof row.schema_version !== "string" ||
    row.status !== expectedStatus ||
    spec.storySpecId !== row.story_spec_id ||
    spec.figureKey !== row.figure_key ||
    spec.stageId !== row.stage_id ||
    spec.version !== row.version ||
    spec.schemaVersion !== row.schema_version ||
    spec.status !== row.status
  ) {
    return null;
  }
  const validation = validateStorySpec(spec, {
    forPublish: expectedStatus === "published",
  });
  if (!validation.valid) return null;
  return deepFreeze(structuredClone(spec));
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  return (
    actual.length === required.length &&
    actual.every((key, index) => key === required[index])
  );
}
