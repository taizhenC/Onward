import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import type { StoryBoundaries } from "./story-boundaries";

export const RESONANCE_BRIEF_VERSION = "resonance-brief-v1-2026-07";
export const RESONANCE_BRIEF_SENSITIVITY = "sensitive-derived-ephemeral";

export const PRIMARY_PRESSURES = [
  "loss",
  "rejection",
  "isolation",
  "identity",
  "blocked_agency",
  "shame",
  "uncertainty",
  "exhaustion",
  "other",
] as const;

export type PrimaryPressure = (typeof PRIMARY_PRESSURES)[number];
export type DesiredDistance = "gentle" | "direct" | "unspecified";

export const RESONANCE_ANCHOR_CONCEPTS = [
  ...PRIMARY_PRESSURES,
  "belonging",
  "starting_over",
  "being_seen",
  "unclear_next_step",
  "loss_of_control",
] as const;

export type ResonanceAnchorConcept =
  (typeof RESONANCE_ANCHOR_CONCEPTS)[number];

export type ResonanceBrief = {
  version: typeof RESONANCE_BRIEF_VERSION;
  sensitivity: typeof RESONANCE_BRIEF_SENSITIVITY;
  primaryPressure: PrimaryPressure;
  emotionalCore: string;
  situationShape: string;
  desiredDistance: DesiredDistance;
  anchors: Array<{
    sourceSpanHash: string;
    concept: ResonanceAnchorConcept;
  }>;
  forbiddenEchoHashes: string[];
};

export type ResonancePromptSurface = Pick<
  ResonanceBrief,
  | "version"
  | "primaryPressure"
  | "emotionalCore"
  | "situationShape"
  | "desiredDistance"
>;

const PRESSURE_PROJECTIONS: Record<
  PrimaryPressure,
  { emotionalCore: string; situationShape: string }
> = {
  loss: {
    emotionalCore: "living with an absence that changed what felt stable",
    situationShape: "something important is gone and the next shape is not clear yet",
  },
  rejection: {
    emotionalCore: "effort or identity not being recognized by others",
    situationShape: "a closed door has made continuing feel harder to justify",
  },
  isolation: {
    emotionalCore: "feeling cut off from recognition, company, or belonging",
    situationShape: "the person is carrying a difficult stretch without enough connection",
  },
  identity: {
    emotionalCore: "the current life no longer fitting the person living it",
    situationShape: "an old identity is loosening before a new one feels available",
  },
  blocked_agency: {
    emotionalCore: "wanting movement while choices feel constrained",
    situationShape: "the person can see a need for change but not a safe route through it",
  },
  shame: {
    emotionalCore: "a setback becoming entangled with personal worth",
    situationShape: "what happened is being carried as a judgment about the whole self",
  },
  uncertainty: {
    emotionalCore: "not knowing which direction can be trusted",
    situationShape: "several futures are possible and none yet feels solid",
  },
  exhaustion: {
    emotionalCore: "effort continuing after energy and hope have thinned",
    situationShape: "the demands have lasted longer than the person's current reserves",
  },
  other: {
    emotionalCore: "carrying a pressure that does not fit a simple category",
    situationShape: "something difficult is asking for company rather than a quick answer",
  },
};

type AnchorRule = {
  pressure: PrimaryPressure;
  concept: ResonanceAnchorConcept;
  pattern: RegExp;
  weight: number;
};

const ANCHOR_RULES: readonly AnchorRule[] = [
  { pressure: "loss", concept: "loss", pattern: /\b(?:grief|grieving|bereaved|died|death|mourning)\b/gi, weight: 3 },
  { pressure: "loss", concept: "loss", pattern: /\b(?:lost someone|losing someone|breakup|broke up|divorce[ds]?)\b/gi, weight: 2 },
  { pressure: "rejection", concept: "rejection", pattern: /\b(?:reject(?:ed|ion)?|dismissed|turned down|not chosen|fired|laid off)\b/gi, weight: 3 },
  { pressure: "rejection", concept: "being_seen", pattern: /\b(?:ignored|unseen|overlooked|not taken seriously|no one notices)\b/gi, weight: 2 },
  { pressure: "isolation", concept: "isolation", pattern: /\b(?:alone|lonely|isolated|no one to talk to|without anyone)\b/gi, weight: 3 },
  { pressure: "isolation", concept: "belonging", pattern: /\b(?:do not belong|don't belong|left out|outsider|no community)\b/gi, weight: 2 },
  { pressure: "identity", concept: "identity", pattern: /\b(?:identity|who i am|do not know myself|don't know myself|not myself|wrong life|hiding who)\b/gi, weight: 3 },
  { pressure: "identity", concept: "starting_over", pattern: /\b(?:start(?:ing)? over|begin(?:ning)? again|reinvent|new life)\b/gi, weight: 2 },
  { pressure: "blocked_agency", concept: "blocked_agency", pattern: /\b(?:stuck|trapped|blocked|powerless|cannot leave|can't leave|no way out)\b/gi, weight: 3 },
  { pressure: "blocked_agency", concept: "loss_of_control", pattern: /\b(?:no control|forced|cornered|choices? (?:are|feel) limited)\b/gi, weight: 2 },
  { pressure: "shame", concept: "shame", pattern: /\b(?:shame|ashamed|embarrassed|humiliated|worthless|not good enough)\b/gi, weight: 3 },
  { pressure: "uncertainty", concept: "uncertainty", pattern: /\b(?:uncertain|unsure|confused|cannot decide|can't decide|do not know what|don't know what)\b/gi, weight: 3 },
  { pressure: "uncertainty", concept: "unclear_next_step", pattern: /\b(?:what comes next|next step|which direction|where to go|how to continue)\b/gi, weight: 2 },
  { pressure: "exhaustion", concept: "exhaustion", pattern: /\b(?:exhausted|burn(?:ed|t) out|burnout|drained|worn out|too tired|overwhelmed)\b/gi, weight: 3 },
] as const;

const DETAIL_STOP_WORDS = new Set([
  "after",
  "before",
  "because",
  "since",
  "today",
  "tomorrow",
  "when",
  "while",
  "yesterday",
]);

const MAX_ANCHORS = 6;
const MAX_FORBIDDEN_HASHES = 256;
const ECHO_WINDOW_WORDS = 8;

// Per-process random HMAC material makes the fingerprints useful only inside the
// short-lived request that owns the brief. They are deliberately neither stable
// identifiers nor reversible hashes suitable for persistence or analytics.
const EPHEMERAL_HASH_KEY = randomBytes(32);

export function createResonanceBrief(
  disclosure: string,
  boundaries?: StoryBoundaries,
): ResonanceBrief {
  const scores = new Map<PrimaryPressure, number>();
  const anchors: ResonanceBrief["anchors"] = [];
  const seenAnchors = new Set<string>();

  for (const rule of ANCHOR_RULES) {
    for (const match of disclosure.matchAll(rule.pattern)) {
      const span = match[0]?.trim();
      if (!span) continue;
      scores.set(rule.pressure, (scores.get(rule.pressure) ?? 0) + rule.weight);
      const sourceSpanHash = hashSensitiveSpan(span);
      const key = `${rule.concept}:${sourceSpanHash}`;
      if (anchors.length < MAX_ANCHORS && !seenAnchors.has(key)) {
        seenAnchors.add(key);
        anchors.push({ sourceSpanHash, concept: rule.concept });
      }
    }
  }

  const primaryPressure = choosePrimaryPressure(scores);
  if (anchors.length === 0) {
    anchors.push({
      sourceSpanHash: hashSensitiveSpan(disclosure),
      concept: primaryPressure,
    });
  }
  const projection = PRESSURE_PROJECTIONS[primaryPressure];
  const brief: ResonanceBrief = {
    version: RESONANCE_BRIEF_VERSION,
    sensitivity: RESONANCE_BRIEF_SENSITIVITY,
    primaryPressure,
    emotionalCore: projection.emotionalCore,
    situationShape: projection.situationShape,
    desiredDistance: desiredDistance(boundaries),
    anchors,
    forbiddenEchoHashes: buildForbiddenEchoHashes(disclosure),
  };

  if (!validateResonanceBrief(brief)) {
    throw new Error("ResonanceBrief construction violated its closed contract");
  }
  return deepFreeze(brief);
}

export function toResonancePromptSurface(
  brief: ResonanceBrief,
): ResonancePromptSurface {
  if (!validateResonanceBrief(brief)) {
    throw new Error("invalid ResonanceBrief prompt input");
  }
  return {
    version: brief.version,
    primaryPressure: brief.primaryPressure,
    emotionalCore: brief.emotionalCore,
    situationShape: brief.situationShape,
    desiredDistance: brief.desiredDistance,
  };
}

export function containsResonanceEcho(
  storyText: string,
  brief: ResonanceBrief,
): boolean {
  if (!validateResonanceBrief(brief)) return true;
  const storyWords = normalize(storyText).split(" ").filter(Boolean);
  if (storyWords.length === 0) return false;

  const fingerprintsByLength = new Map<number, Set<string>>();
  for (const fingerprint of brief.forbiddenEchoHashes) {
    const parsed = parseFingerprint(fingerprint);
    if (!parsed) return true;
    const set = fingerprintsByLength.get(parsed.wordCount) ?? new Set<string>();
    set.add(parsed.digest);
    fingerprintsByLength.set(parsed.wordCount, set);
  }

  for (const [wordCount, digests] of fingerprintsByLength) {
    if (wordCount > storyWords.length) continue;
    for (let index = 0; index <= storyWords.length - wordCount; index += 1) {
      const candidate = storyWords.slice(index, index + wordCount).join(" ");
      if (digests.has(hmac(candidate))) return true;
    }
  }
  return false;
}

export function validateResonanceBrief(value: unknown): value is ResonanceBrief {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const brief = value as Partial<ResonanceBrief>;
  if (
    Object.keys(value as Record<string, unknown>).sort().join(",") !==
      "anchors,desiredDistance,emotionalCore,forbiddenEchoHashes,primaryPressure,sensitivity,situationShape,version" ||
    brief.version !== RESONANCE_BRIEF_VERSION ||
    brief.sensitivity !== RESONANCE_BRIEF_SENSITIVITY ||
    !PRIMARY_PRESSURES.includes(brief.primaryPressure as PrimaryPressure) ||
    !["gentle", "direct", "unspecified"].includes(brief.desiredDistance ?? "") ||
    !Array.isArray(brief.anchors) ||
    brief.anchors.length === 0 ||
    brief.anchors.length > MAX_ANCHORS ||
    !Array.isArray(brief.forbiddenEchoHashes) ||
    brief.forbiddenEchoHashes.length > MAX_FORBIDDEN_HASHES
  ) {
    return false;
  }
  const projection = PRESSURE_PROJECTIONS[brief.primaryPressure as PrimaryPressure];
  if (
    brief.emotionalCore !== projection.emotionalCore ||
    brief.situationShape !== projection.situationShape ||
    brief.anchors.some(
      (anchor) =>
        anchor === null ||
        typeof anchor !== "object" ||
        Object.keys(anchor).sort().join(",") !== "concept,sourceSpanHash" ||
        !RESONANCE_ANCHOR_CONCEPTS.includes(anchor.concept) ||
        !/^[0-9a-f]{64}$/.test(anchor.sourceSpanHash),
    ) ||
    new Set(
      brief.anchors.map((anchor) => `${anchor.concept}:${anchor.sourceSpanHash}`),
    ).size !== brief.anchors.length ||
    brief.forbiddenEchoHashes.some((fingerprint) => !parseFingerprint(fingerprint)) ||
    new Set(brief.forbiddenEchoHashes).size !== brief.forbiddenEchoHashes.length
  ) {
    return false;
  }
  return true;
}

function choosePrimaryPressure(scores: Map<PrimaryPressure, number>): PrimaryPressure {
  let chosen: PrimaryPressure = "other";
  let chosenScore = 0;
  for (const pressure of PRIMARY_PRESSURES) {
    const score = scores.get(pressure) ?? 0;
    if (score > chosenScore) {
      chosen = pressure;
      chosenScore = score;
    }
  }
  return chosen;
}

function desiredDistance(boundaries?: StoryBoundaries): DesiredDistance {
  if (boundaries?.maxIntensity === "gentle") return "gentle";
  if (boundaries?.maxIntensity === "direct") return "direct";
  return "unspecified";
}

function buildForbiddenEchoHashes(disclosure: string): string[] {
  const normalized = normalize(disclosure);
  const words = normalized.split(" ").filter(Boolean);
  const fingerprints = new Set<string>();
  if (normalized.length >= 10 && words.length > 0) {
    fingerprints.add(fingerprint("exact", normalized));
  }
  if (words.length >= ECHO_WINDOW_WORDS) {
    for (let index = 0; index <= words.length - ECHO_WINDOW_WORDS; index += 1) {
      fingerprints.add(
        fingerprint(
          "window",
          words.slice(index, index + ECHO_WINDOW_WORDS).join(" "),
        ),
      );
    }
  }
  for (const detail of extractNamedDetails(disclosure)) {
    fingerprints.add(fingerprint("detail", detail));
  }
  return [...fingerprints].slice(0, MAX_FORBIDDEN_HASHES);
}

function extractNamedDetails(disclosure: string): string[] {
  const details = new Set<string>();
  for (const match of disclosure.matchAll(/\b[A-Z][a-z]{2,}\b/g)) {
    const raw = match[0] ?? "";
    const index = match.index ?? 0;
    const prefix = disclosure.slice(0, index).trimEnd();
    const atSentenceStart = prefix.length === 0 || /[.!?]$/.test(prefix);
    const normalized = normalize(raw);
    if (
      atSentenceStart ||
      !normalized ||
      DETAIL_STOP_WORDS.has(normalized)
    ) {
      continue;
    }
    details.add(normalized);
  }
  const patterns = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    /https?:\/\/[^\s]+/gi,
    /@[A-Za-z0-9_]{2,}/g,
    /\b(?:\d{4}|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{3}[-.\s]\d{3}[-.\s]\d{4})\b/g,
    /[“\"]([^”\"]{3,80})[”\"]/g,
  ];
  for (const pattern of patterns) {
    for (const match of disclosure.matchAll(pattern)) {
      const raw = (match[1] ?? match[0] ?? "").trim();
      const normalized = normalize(raw);
      if (!normalized || DETAIL_STOP_WORDS.has(normalized)) continue;
      details.add(normalized);
    }
  }
  return [...details].slice(0, 24);
}

function fingerprint(kind: "exact" | "window" | "detail", span: string): string {
  const normalized = normalize(span);
  const wordCount = normalized.split(" ").filter(Boolean).length;
  return `${kind}:${wordCount}:${hmac(normalized)}`;
}

function parseFingerprint(
  value: string,
): { wordCount: number; digest: string } | null {
  const match = /^(?:exact|window|detail):(\d{1,3}):([0-9a-f]{64})$/.exec(value);
  if (!match) return null;
  const wordCount = Number.parseInt(match[1], 10);
  return wordCount > 0 ? { wordCount, digest: match[2] } : null;
}

function hashSensitiveSpan(value: string): string {
  return hmac(normalize(value));
}

function hmac(value: string): string {
  return createHmac("sha256", EPHEMERAL_HASH_KEY).update(value).digest("hex");
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
