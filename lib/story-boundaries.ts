import {
  CONTENT_FLAGS,
  type ContentFlag,
  type StorySpec,
} from "./story-spec-types";

export const STORY_BOUNDARY_POLICY_VERSION = "story-boundaries-v1-2026-07";

export const STORY_INTENSITIES = ["gentle", "moderate", "direct"] as const;
export type StoryIntensity = (typeof STORY_INTENSITIES)[number];

export type StoryBoundaries = {
  maxIntensity: StoryIntensity;
  excludedFlags: ContentFlag[];
};

export const BOUNDARY_TOPICS: ReadonlyArray<{
  flag: ContentFlag;
  label: string;
  description: string;
}> = [
  {
    flag: "death_or_grief",
    label: "Death or grief",
    description: "Loss, bereavement, or the death of someone close.",
  },
  {
    flag: "suicide_loss",
    label: "Suicide loss",
    description: "A historical account that includes loss by suicide.",
  },
  {
    flag: "abuse_or_violence",
    label: "Abuse or violence",
    description: "Non-graphic references to abuse, assault, or violence.",
  },
  {
    flag: "addiction",
    label: "Addiction",
    description: "Alcohol, drug use, or recovery from addiction.",
  },
  {
    flag: "serious_illness",
    label: "Serious illness",
    description: "Life-changing illness, disability, or medical treatment.",
  },
  {
    flag: "discrimination",
    label: "Discrimination",
    description: "Racism, segregation, sexism, or other discrimination.",
  },
  {
    flag: "pregnancy_or_parenthood",
    label: "Pregnancy or parenthood",
    description: "Pregnancy, birth, or difficult experiences of parenthood.",
  },
  {
    flag: "other_reviewed_flag",
    label: "Other sensitive material",
    description: "Other material specifically flagged by an Onward editor.",
  },
] as const;

const INTENSITY_RANK: Record<StoryIntensity, number> = {
  gentle: 0,
  moderate: 1,
  direct: 2,
};

export type StoryBoundariesParseResult =
  | { value: StoryBoundaries | undefined }
  | { error: string };

export function parseStoryBoundaries(value: unknown): StoryBoundariesParseResult {
  if (value === undefined) return { value: undefined };
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Story boundaries must be an object when provided." };
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.join(",") !== "excludedFlags,maxIntensity") {
    return { error: "Story boundaries contain unsupported fields." };
  }
  if (
    typeof record.maxIntensity !== "string" ||
    !STORY_INTENSITIES.includes(record.maxIntensity as StoryIntensity)
  ) {
    return { error: "Story boundary intensity is invalid." };
  }
  if (!Array.isArray(record.excludedFlags)) {
    return { error: "Story boundary topics must be an array." };
  }
  const flags = record.excludedFlags;
  if (
    flags.some(
      (flag) =>
        typeof flag !== "string" ||
        !CONTENT_FLAGS.includes(flag as ContentFlag),
    )
  ) {
    return { error: "Story boundaries include an unknown topic." };
  }
  if (new Set(flags).size !== flags.length) {
    return { error: "Story boundary topics must not be repeated." };
  }
  return {
    value: {
      maxIntensity: record.maxIntensity as StoryIntensity,
      excludedFlags: [...(flags as ContentFlag[])],
    },
  };
}

export function storyProfileAllowed(
  profile: StorySpec["contentProfile"],
  boundaries: StoryBoundaries | undefined,
): boolean {
  if (!boundaries) return true;
  if (INTENSITY_RANK[profile.intensity] > INTENSITY_RANK[boundaries.maxIntensity]) {
    return false;
  }
  const excluded = new Set(boundaries.excludedFlags);
  return !profile.flags.some((flag) => excluded.has(flag));
}

export function filterStorySpecCatalog(
  catalog: ReadonlyMap<string, StorySpec>,
  boundaries: StoryBoundaries | undefined,
): ReadonlyMap<string, StorySpec> {
  if (!boundaries) return catalog;
  return new Map(
    [...catalog].filter(([, spec]) => storyProfileAllowed(spec.contentProfile, boundaries)),
  );
}
