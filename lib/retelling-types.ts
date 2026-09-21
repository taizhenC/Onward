// Authored public fiction. Never a FigureStageRow, StorySpec or match result.
export const RETELLING_LABEL = "Fictionalized retelling";
export const RETELLING_DISCLOSURE = "A work of fiction inspired by a real person. Scenes, conversations, thoughts and connecting events may be invented. This is not a documented account of their life or a historical match to yours.";
export const RETELLING_TOPICS = {
  "creative-work": "Making something",
  "learning": "Learning again",
  "asking-for-help": "Asking for help",
  "care-and-family": "Care and family",
  "recognition-and-money": "Recognition and money",
  "uncertainty": "Living with uncertainty",
  "working-together": "Working with others",
  "finding-a-voice": "Finding a voice",
  "changing-direction": "Changing direction",
} as const;
export type RetellingTopic = keyof typeof RETELLING_TOPICS;
export const RETELLING_ROLES = ["scene", "dark_moment", "response", "struggle", "turning_point", "became", "bridge"] as const;
export type Retelling = Readonly<{
  kind: "fictionalized-retelling-v1";
  slug: string;
  figureName: string;
  title: string;
  summary: string;
  topics: readonly RetellingTopic[];
  contentNote: string;
  inventionNote: string;
  background: readonly Readonly<{ text: string; sourceIds: readonly string[] }>[];
  sources: readonly Readonly<{ id: string; title: string; url: string; note: string }>[];
  pages: readonly Readonly<{
    role: typeof RETELLING_ROLES[number];
    title: string;
    paragraphs: readonly string[];
  }>[];
}>;
