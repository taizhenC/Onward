export type BeatRole =
  | "scene"
  | "dark_moment"
  | "response"
  | "struggle"
  | "turning_point"
  | "became"
  | "bridge";

export type BeatKind = "narrative" | "bridge";

export type BeatBlueprint =
  | { kind: "narrative"; role: BeatRole; text: string; sourceNotes?: string }
  | { kind: "bridge"; role: BeatRole; text: string; sourceNotes?: string };

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
  nextChunkIndex: number;
  createdAt: number;
};

export type MatchResponse =
  | { crisis: true; resources: string[] }
  | { error: string }
  | { sessionId: string };

export type ClientBeat =
  | { kind: "narrative"; role: BeatRole }
  | { kind: "bridge"; role: BeatRole };

export type ClientFigureOutline = {
  figureKey: string;
  displayName: string;
  birthYear?: number;
  deathYear?: number;
  ageMin: number;
  ageMax: number;
  beats: ClientBeat[];
};
