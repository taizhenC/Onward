export type BeatRole =
  | "scene"
  | "dark_moment"
  | "fork"
  | "reveal"
  | "struggle"
  | "turning_point"
  | "became"
  | "bridge";

export type BeatKind = "narrative" | "decision" | "bridge";

export type ArcVariant = "single_fork" | "double_fork";

export type DecisionContinuation = {
  label: string;
  continuationText: string;
  realChoice: boolean;
};

export type BeatBlueprint =
  | { kind: "narrative"; role: BeatRole; text: string; sourceNotes?: string }
  | { kind: "bridge"; role: BeatRole; text: string; sourceNotes?: string }
  | {
      kind: "decision";
      role: BeatRole;
      text: string;
      decisionContinuations: DecisionContinuation[];
      sourceNotes?: string;
    };

export type FigureRow = {
  figureKey: string;
  displayName: string;
  birthYear?: number;
  deathYear?: number;
};

export type Facets = {
  emotionalCore: string;
  decisionShape: string;
  triggerEvent: string;
  agencyState: string;
};

export type FigureStageRow = FigureRow & {
  stageId: string;
  stageLabel: string;
  arcVariant: ArcVariant;
  ageMin: number;
  ageMax: number;
  shapeSentences: string[];
  facets: Facets;
  biographicalFacts: string;
  themes: string[];
  antiThemes: string[];
  beats: BeatBlueprint[];
  sources: string[];
};

export type Framing = "definitive" | "partial";

export type Session = {
  sessionId: string;
  figureKey: string;
  stageId: string;
  framing: Framing;
  age: number;
  feeling: string;
  nextBeatIndex: number;
  choices: Record<number, string>;
  createdAt: number;
};

export type MatchResponse =
  | { crisis: true; resources: string[] }
  | { sessionId: string };

export type ClientBeat =
  | { kind: "narrative"; role: BeatRole }
  | { kind: "bridge"; role: BeatRole }
  | { kind: "decision"; role: BeatRole; options: { label: string }[] };

export type ClientFigureOutline = {
  figureKey: string;
  displayName: string;
  birthYear?: number;
  deathYear?: number;
  arcVariant: ArcVariant;
  ageMin: number;
  ageMax: number;
  beats: ClientBeat[];
};
