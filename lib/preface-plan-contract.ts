import type {
  DesiredDistance,
  PrimaryPressure,
  ResonancePromptSurface,
} from "./resonance-brief";

export const PREFACE_PLAN_SCHEMA_VERSION = "preface-plan-v1-2026-07" as const;

type AcknowledgementTemplate = Readonly<{
  id: string;
  line: string;
  allowedPressures: readonly PrimaryPressure[];
}>;

type EyebrowTemplate = Readonly<{
  id: string;
  line: string;
  allowedPressures: readonly PrimaryPressure[];
}>;

type DistanceTemplate = Readonly<{
  id: string;
  line: string;
  allowedDistances: readonly DesiredDistance[];
}>;

const EYEBROW_TEMPLATE_SOURCE = [
  {
    id: "preface-eyebrow-loss-absence-v1",
    line: "Living beside an absence",
    allowedPressures: ["loss"],
  },
  {
    id: "preface-eyebrow-loss-changed-day-v1",
    line: "After what was gone changed the day",
    allowedPressures: ["loss"],
  },
  {
    id: "preface-eyebrow-rejection-closed-door-v1",
    line: "After the door closed",
    allowedPressures: ["rejection"],
  },
  {
    id: "preface-eyebrow-rejection-effort-met-no-v1",
    line: "When effort met a no",
    allowedPressures: ["rejection"],
  },
  {
    id: "preface-eyebrow-isolation-belonging-v1",
    line: "At a distance from belonging",
    allowedPressures: ["isolation"],
  },
  {
    id: "preface-eyebrow-isolation-quiet-v1",
    line: "Inside a quieter kind of loneliness",
    allowedPressures: ["isolation"],
  },
  {
    id: "preface-eyebrow-identity-stopped-fitting-v1",
    line: "When the old life stopped fitting",
    allowedPressures: ["identity"],
  },
  {
    id: "preface-eyebrow-identity-between-selves-v1",
    line: "Between an old self and what comes next",
    allowedPressures: ["identity"],
  },
  {
    id: "preface-eyebrow-blocked-agency-narrow-v1",
    line: "When every way forward felt narrow",
    allowedPressures: ["blocked_agency"],
  },
  {
    id: "preface-eyebrow-blocked-agency-room-v1",
    line: "A life waiting for room to move",
    allowedPressures: ["blocked_agency"],
  },
  {
    id: "preface-eyebrow-shame-verdict-v1",
    line: "When one moment felt like a verdict",
    allowedPressures: ["shame"],
  },
  {
    id: "preface-eyebrow-shame-self-judgment-v1",
    line: "Under the weight of self-judgment",
    allowedPressures: ["shame"],
  },
  {
    id: "preface-eyebrow-uncertainty-direction-v1",
    line: "Before any direction felt solid",
    allowedPressures: ["uncertainty"],
  },
  {
    id: "preface-eyebrow-uncertainty-next-step-v1",
    line: "At the edge of an unclear next step",
    allowedPressures: ["uncertainty"],
  },
  {
    id: "preface-eyebrow-exhaustion-outlasted-strength-v1",
    line: "After effort outlasted the available strength",
    allowedPressures: ["exhaustion"],
  },
  {
    id: "preface-eyebrow-exhaustion-far-step-v1",
    line: "When even a small step felt far away",
    allowedPressures: ["exhaustion"],
  },
  {
    id: "preface-eyebrow-other-difficult-middle-v1",
    line: "In the difficult middle",
    allowedPressures: ["other"],
  },
  {
    id: "preface-eyebrow-other-without-name-v1",
    line: "Beside a pressure without an easy name",
    allowedPressures: ["other"],
  },
] as const satisfies readonly EyebrowTemplate[];

const ACKNOWLEDGEMENT_TEMPLATE_SOURCE = [
  {
    id: "preface-ack-loss-absence-v1",
    line: "An absence can change the shape of an ordinary day.",
    allowedPressures: ["loss"],
  },
  {
    id: "preface-ack-loss-weight-v1",
    line:
      "Losing someone or something important can leave a weight that does not move on command.",
    allowedPressures: ["loss"],
  },
  {
    id: "preface-ack-rejection-next-step-v1",
    line:
      "Being turned away can make the next step feel harder than it looked before.",
    allowedPressures: ["rejection"],
  },
  {
    id: "preface-ack-rejection-closed-door-v1",
    line: "A closed door can reach further than the moment when it closed.",
    allowedPressures: ["rejection"],
  },
  {
    id: "preface-ack-isolation-quiet-day-v1",
    line:
      "Feeling far from other people can make even a crowded day feel quiet.",
    allowedPressures: ["isolation"],
  },
  {
    id: "preface-ack-isolation-belonging-v1",
    line:
      "Going without a sense of belonging can wear on more than one part of a life.",
    allowedPressures: ["isolation"],
  },
  {
    id: "preface-ack-identity-inside-life-v1",
    line: "A life that no longer feels like yours can be difficult to stand inside.",
    allowedPressures: ["identity"],
  },
  {
    id: "preface-ack-identity-path-ahead-v1",
    line:
      "Not recognizing yourself in the path ahead can unsettle everything around it.",
    allowedPressures: ["identity"],
  },
  {
    id: "preface-ack-blocked-agency-small-choices-v1",
    line: "Being unable to move can make every available choice feel smaller.",
    allowedPressures: ["blocked_agency"],
  },
  {
    id: "preface-ack-blocked-agency-patience-v1",
    line:
      "When the way forward is constrained, even patience can feel like another demand.",
    allowedPressures: ["blocked_agency"],
  },
  {
    id: "preface-ack-shame-whole-self-v1",
    line:
      "Shame can turn one hard thing into a judgment about the whole self.",
    allowedPressures: ["shame"],
  },
  {
    id: "preface-ack-shame-verdict-v1",
    line:
      "It can be painful to feel as though a difficult moment says who you are.",
    allowedPressures: ["shame"],
  },
  {
    id: "preface-ack-uncertainty-present-v1",
    line: "Not knowing what comes next can make the present difficult to hold.",
    allowedPressures: ["uncertainty"],
  },
  {
    id: "preface-ack-uncertainty-directions-v1",
    line: "Uncertainty can make every possible direction feel unfinished.",
    allowedPressures: ["uncertainty"],
  },
  {
    id: "preface-ack-exhaustion-narrow-world-v1",
    line: "Carrying too much for too long can narrow the world around you.",
    allowedPressures: ["exhaustion"],
  },
  {
    id: "preface-ack-exhaustion-next-step-v1",
    line: "Exhaustion can make even a small next step feel far away.",
    allowedPressures: ["exhaustion"],
  },
  {
    id: "preface-ack-other-difficult-carry-v1",
    line: "Whatever shape this has taken, it sounds difficult to carry.",
    allowedPressures: ["other"],
  },
  {
    id: "preface-ack-other-without-name-v1",
    line: "Some experiences are hard before they have a clear name.",
    allowedPressures: ["other"],
  },
] as const satisfies readonly AcknowledgementTemplate[];

const DISTANCE_TEMPLATE_SOURCE = [
  {
    id: "preface-distance-gentle-edges-v1",
    line: "We can stay near the edges of it and move slowly.",
    allowedDistances: ["gentle"],
  },
  {
    id: "preface-distance-gentle-space-v1",
    line: "We can keep some distance and take one quiet step at a time.",
    allowedDistances: ["gentle"],
  },
  {
    id: "preface-distance-unspecified-parallel-v1",
    line: "We can look at one human parallel without forcing an answer.",
    allowedDistances: ["unspecified"],
  },
  {
    id: "preface-distance-unspecified-not-answer-v1",
    line: "This story offers a parallel, not an answer.",
    allowedDistances: ["unspecified"],
  },
  {
    id: "preface-distance-direct-plainly-v1",
    line: "We can name the pressure plainly without pretending it is simple.",
    allowedDistances: ["direct"],
  },
  {
    id: "preface-distance-direct-limits-v1",
    line:
      "We can look at the difficult part directly and leave room for what does not match.",
    allowedDistances: ["direct"],
  },
] as const satisfies readonly DistanceTemplate[];

export const PREFACE_EYEBROW_TEMPLATES = deepFreeze(
  EYEBROW_TEMPLATE_SOURCE,
);
export const PREFACE_ACKNOWLEDGEMENT_TEMPLATES = deepFreeze(
  ACKNOWLEDGEMENT_TEMPLATE_SOURCE,
);
export const PREFACE_DISTANCE_TEMPLATES = deepFreeze(
  DISTANCE_TEMPLATE_SOURCE,
);

export type PrefaceEyebrowTemplateId =
  (typeof PREFACE_EYEBROW_TEMPLATES)[number]["id"];
export type PrefaceAcknowledgementTemplateId =
  (typeof PREFACE_ACKNOWLEDGEMENT_TEMPLATES)[number]["id"];
export type PrefaceDistanceTemplateId =
  (typeof PREFACE_DISTANCE_TEMPLATES)[number]["id"];

export const PREFACE_NON_EQUIVALENCE_LINE =
  "Their life is not yours, and the two stories are not the same." as const;
export const PREFACE_INVITATION_LINE =
  "For a moment, here is what happened to them." as const;

export const PREFACE_FALLBACK_LINES = deepFreeze([
  "That hurts.",
  "You do not have to solve everything right now.",
  "Here is someone who stood in a similar kind of weight.",
  "Let's start with their story.",
] as const);

export type PrefacePlanRequest = Readonly<{
  schemaVersion: typeof PREFACE_PLAN_SCHEMA_VERSION;
  resonance: ResonancePromptSurface;
  episodeShape: string;
  allowedEyebrowTemplateIds: readonly PrefaceEyebrowTemplateId[];
  allowedAcknowledgementTemplateIds: readonly PrefaceAcknowledgementTemplateId[];
  allowedDistanceTemplateIds: readonly PrefaceDistanceTemplateId[];
}>;

export type PrefacePlanCandidate = Readonly<{
  schemaVersion: typeof PREFACE_PLAN_SCHEMA_VERSION;
  eyebrowTemplateId: PrefaceEyebrowTemplateId;
  acknowledgementTemplateId: PrefaceAcknowledgementTemplateId;
  distanceTemplateId: PrefaceDistanceTemplateId;
}>;

export const PERSONALIZED_PREFACE_PROMPT_CONTRACT = deepFreeze({
  schemaVersion: PREFACE_PLAN_SCHEMA_VERSION,
  system: [
    "You prepare the opening of a small, gentle book built around a true historical episode.",
    "Choose three template IDs from the supplied allowlists.",
    "The IDs select server-owned eyebrow and preface prose.",
    "Never write, quote, paraphrase, or explain any reader-visible copy.",
    "",
    "Selection rules:",
    "- Use only IDs from the supplied eyebrow, acknowledgement, and distance allowlists.",
    "- Return exactly the requested keys and no others.",
    "- Output one JSON object and nothing else.",
  ].join("\n"),
  user: [
    "Plan schema: {{schemaVersion}}",
    "Primary pressure: {{primaryPressure}}",
    "Emotional shape: {{emotionalCore}}",
    "Situation shape: {{situationShape}}",
    "Desired distance: {{desiredDistance}}",
    "Historical episode shape: {{episodeShape}}",
    "Allowed eyebrow template IDs: {{allowedEyebrowTemplateIds}}",
    "Allowed acknowledgement template IDs: {{allowedAcknowledgementTemplateIds}}",
    "Allowed distance template IDs: {{allowedDistanceTemplateIds}}",
    "Return keys schemaVersion, eyebrowTemplateId, acknowledgementTemplateId, distanceTemplateId.",
  ].join("\n"),
  responseFormat: "json_object" as const,
  eyebrowTemplates: PREFACE_EYEBROW_TEMPLATES,
  acknowledgementTemplates: PREFACE_ACKNOWLEDGEMENT_TEMPLATES,
  distanceTemplates: PREFACE_DISTANCE_TEMPLATES,
  fixedLines: [
    PREFACE_NON_EQUIVALENCE_LINE,
    PREFACE_INVITATION_LINE,
  ] as const,
  fallbackLines: PREFACE_FALLBACK_LINES,
});

export type PersonalizedPrefacePromptContract =
  typeof PERSONALIZED_PREFACE_PROMPT_CONTRACT;

function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
