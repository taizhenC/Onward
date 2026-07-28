import "server-only";
import {
  PERSONALIZED_PREFACE_PROMPT_CONTRACT,
  PREFACE_ACKNOWLEDGEMENT_TEMPLATES,
  PREFACE_DISTANCE_TEMPLATES,
  PREFACE_FALLBACK_LINES,
  PREFACE_INVITATION_LINE,
  PREFACE_NON_EQUIVALENCE_LINE,
  PREFACE_PLAN_SCHEMA_VERSION,
  type PrefaceAcknowledgementTemplateId,
  type PrefaceDistanceTemplateId,
  type PrefacePlanCandidate,
  type PrefacePlanRequest,
} from "./preface-plan-contract";
import {
  PRIMARY_PRESSURES,
  containsResonanceEcho,
  type DesiredDistance,
  type PrimaryPressure,
  type ResonanceBrief,
} from "./resonance-brief";
import type { EyebrowProviderSurface } from "./opening-copy";

export type PrefacePlanValidation =
  | Readonly<{ valid: true; plan: PrefacePlanCandidate }>
  | Readonly<{ valid: false }>;

const DESIRED_DISTANCES = [
  "gentle",
  "direct",
  "unspecified",
] as const satisfies readonly DesiredDistance[];

const TEMPLATE_LINE_MAX_LENGTH = 180;
const EYEBROW_MAX_LENGTH = 72;
const FORBIDDEN_TEMPLATE_COPY =
  /\{[^}]+\}|\b(?:you (?:will|must|should|need to)|everything will|guarantee|diagnos(?:e|is)|clinically|cure[ds]?|your life is (?:the same as|exactly like)|because (?:they|this person) did it,? you)\b/i;
const FORBIDDEN_EYEBROW_COPY =
  /\{[^}]+\}|\b(?:you|your|must|should|need to|guarantee|diagnos(?:e|is)|clinically|cure[ds]?|everything will|things will|will be (?:okay|fine|better)|your life is (?:the same as|exactly like))\b|\b(?:18|19|20)\d{2}\b/i;

assertCatalogIntegrity();

export function buildPrefacePlanRequest(
  surface: EyebrowProviderSurface,
): PrefacePlanRequest {
  const allowedAcknowledgementTemplateIds =
    PREFACE_ACKNOWLEDGEMENT_TEMPLATES.filter((template) =>
      allowsPressure(template, surface.resonance.primaryPressure),
    ).map((template) => template.id);
  const allowedDistanceTemplateIds = PREFACE_DISTANCE_TEMPLATES.filter(
    (template) => allowsDistance(template, surface.resonance.desiredDistance),
  ).map((template) => template.id);

  if (
    allowedAcknowledgementTemplateIds.length === 0 ||
    allowedDistanceTemplateIds.length === 0
  ) {
    throw new Error("Personalized preface catalog is incomplete.");
  }

  return deepFreeze({
    schemaVersion: PREFACE_PLAN_SCHEMA_VERSION,
    resonance: { ...surface.resonance },
    episodeShape: surface.throughLine,
    allowedAcknowledgementTemplateIds,
    allowedDistanceTemplateIds,
  });
}

export function validatePrefacePlanCandidate(
  value: unknown,
  request: PrefacePlanRequest,
): PrefacePlanValidation {
  if (
    !isExactRecord(
      value,
      "acknowledgementTemplateId,distanceTemplateId,eyebrow,schemaVersion",
    ) ||
    value.schemaVersion !== PREFACE_PLAN_SCHEMA_VERSION ||
    typeof value.eyebrow !== "string" ||
    !validEyebrowCandidate(value.eyebrow) ||
    typeof value.acknowledgementTemplateId !== "string" ||
    !request.allowedAcknowledgementTemplateIds.includes(
      value.acknowledgementTemplateId as PrefaceAcknowledgementTemplateId,
    ) ||
    typeof value.distanceTemplateId !== "string" ||
    !request.allowedDistanceTemplateIds.includes(
      value.distanceTemplateId as PrefaceDistanceTemplateId,
    )
  ) {
    return Object.freeze({ valid: false });
  }

  return deepFreeze({
    valid: true,
    plan: {
      schemaVersion: PREFACE_PLAN_SCHEMA_VERSION,
      eyebrow: value.eyebrow,
      acknowledgementTemplateId:
        value.acknowledgementTemplateId as PrefaceAcknowledgementTemplateId,
      distanceTemplateId:
        value.distanceTemplateId as PrefaceDistanceTemplateId,
    },
  });
}

export function firstCompatiblePrefacePlan(
  request: PrefacePlanRequest,
  eyebrow: string,
): PrefacePlanCandidate {
  const acknowledgementTemplateId =
    request.allowedAcknowledgementTemplateIds[0];
  const distanceTemplateId = request.allowedDistanceTemplateIds[0];
  if (!acknowledgementTemplateId || !distanceTemplateId) {
    throw new Error("Personalized preface catalog is incomplete.");
  }
  return deepFreeze({
    schemaVersion: PREFACE_PLAN_SCHEMA_VERSION,
    eyebrow,
    acknowledgementTemplateId,
    distanceTemplateId,
  });
}

export function renderPersonalizedPreface(
  plan: PrefacePlanCandidate,
  resonanceBrief: ResonanceBrief,
): readonly string[] {
  const acknowledgement = PREFACE_ACKNOWLEDGEMENT_TEMPLATES.find(
    (template) => template.id === plan.acknowledgementTemplateId,
  );
  const distance = PREFACE_DISTANCE_TEMPLATES.find(
    (template) => template.id === plan.distanceTemplateId,
  );
  if (
    !acknowledgement ||
    !distance ||
    !allowsPressure(acknowledgement, resonanceBrief.primaryPressure) ||
    !allowsDistance(distance, resonanceBrief.desiredDistance)
  ) {
    return PREFACE_FALLBACK_LINES;
  }

  const lines = deepFreeze([
    acknowledgement.line,
    distance.line,
    PREFACE_NON_EQUIVALENCE_LINE,
    PREFACE_INVITATION_LINE,
  ]);
  if (
    !validTemplateLines(lines) ||
    lines.some((line) => containsResonanceEcho(line, resonanceBrief))
  ) {
    return PREFACE_FALLBACK_LINES;
  }
  return lines;
}

export function validatePersonalizedPrefaceLines(
  lines: readonly string[],
  resonanceBrief: ResonanceBrief | null,
): boolean {
  if (sameLines(lines, PREFACE_FALLBACK_LINES)) return true;
  if (
    lines.length !== 4 ||
    lines[2] !== PREFACE_NON_EQUIVALENCE_LINE ||
    lines[3] !== PREFACE_INVITATION_LINE ||
    !validTemplateLines(lines)
  ) {
    return false;
  }
  const acknowledgement = PREFACE_ACKNOWLEDGEMENT_TEMPLATES.find(
    (template) => template.line === lines[0],
  );
  const distance = PREFACE_DISTANCE_TEMPLATES.find(
    (template) => template.line === lines[1],
  );
  if (!acknowledgement || !distance) return false;
  if (
    resonanceBrief !== null &&
    (!allowsPressure(acknowledgement, resonanceBrief.primaryPressure) ||
      !allowsDistance(distance, resonanceBrief.desiredDistance) ||
      lines.some((line) => containsResonanceEcho(line, resonanceBrief)))
  ) {
    return false;
  }
  return true;
}

export function isUniversalPreface(lines: readonly string[]): boolean {
  return sameLines(lines, PREFACE_FALLBACK_LINES);
}

function assertCatalogIntegrity(): void {
  const allTemplates = [
    ...PREFACE_ACKNOWLEDGEMENT_TEMPLATES,
    ...PREFACE_DISTANCE_TEMPLATES,
  ];
  const ids = allTemplates.map((template) => template.id);
  const lines = allTemplates.map((template) => template.line);
  if (
    new Set(ids).size !== ids.length ||
    new Set(lines).size !== lines.length ||
    !validTemplateLines([
      ...lines,
      PREFACE_NON_EQUIVALENCE_LINE,
      PREFACE_INVITATION_LINE,
      ...PREFACE_FALLBACK_LINES,
    ]) ||
    PRIMARY_PRESSURES.some(
      (pressure) =>
        PREFACE_ACKNOWLEDGEMENT_TEMPLATES.filter((template) =>
          allowsPressure(template, pressure),
        ).length < 2,
    ) ||
    DESIRED_DISTANCES.some(
      (distance) =>
        PREFACE_DISTANCE_TEMPLATES.filter((template) =>
          allowsDistance(template, distance),
        ).length < 2,
    )
  ) {
    throw new Error("Personalized preface catalog is invalid.");
  }
  if (
    PERSONALIZED_PREFACE_PROMPT_CONTRACT.schemaVersion !==
    PREFACE_PLAN_SCHEMA_VERSION
  ) {
    throw new Error("Personalized preface prompt contract is invalid.");
  }
}

function validEyebrowCandidate(value: string): boolean {
  return (
    value.trim() === value &&
    value.length > 0 &&
    value.length <= EYEBROW_MAX_LENGTH &&
    value.trim().split(/\s+/).length <= 10 &&
    !value.includes("\n") &&
    !value.includes("\r") &&
    !/^["'\u201c\u201d\u2018\u2019]|["'\u201c\u201d\u2018\u2019]$/.test(
      value,
    ) &&
    !FORBIDDEN_EYEBROW_COPY.test(value)
  );
}

function allowsPressure(
  template: Readonly<{ allowedPressures: readonly PrimaryPressure[] }>,
  pressure: PrimaryPressure,
): boolean {
  return template.allowedPressures.includes(pressure);
}

function allowsDistance(
  template: Readonly<{ allowedDistances: readonly DesiredDistance[] }>,
  distance: DesiredDistance,
): boolean {
  return template.allowedDistances.includes(distance);
}

function validTemplateLines(lines: readonly string[]): boolean {
  return lines.every(
    (line) =>
      line.trim() === line &&
      line.length > 0 &&
      line.length <= TEMPLATE_LINE_MAX_LENGTH &&
      !line.includes("\n") &&
      !FORBIDDEN_TEMPLATE_COPY.test(line),
  );
}

function sameLines(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((line, index) => line === right[index])
  );
}

function isExactRecord(
  value: unknown,
  sortedKeys: string,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).sort().join(",") ===
      sortedKeys
  );
}

function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
