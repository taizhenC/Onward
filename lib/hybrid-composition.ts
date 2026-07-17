import "server-only";
import type { BeatRole } from "./types";
import type { StorySpec } from "./story-spec-types";
import {
  toResonancePromptSurface,
  type ResonanceBrief,
  type ResonancePromptSurface,
} from "./resonance-brief";

export const HYBRID_PLAN_SCHEMA_VERSION = "hybrid-plan-v1-2026-07";
export const HYBRID_TEMPLATE_POLICY_VERSION = "hybrid-templates-v1-2026-07";

export const HYBRID_TRANSITION_TEMPLATE_IDS = [
  "transition-shared-pressure-v1",
  "transition-emotional-shape-v1",
] as const;

export const HYBRID_BRIDGE_TEMPLATE_IDS = [
  "bridge-company-v1",
  "bridge-open-ending-v1",
] as const;

export type HybridTransitionTemplateId =
  (typeof HYBRID_TRANSITION_TEMPLATE_IDS)[number];
export type HybridBridgeTemplateId =
  (typeof HYBRID_BRIDGE_TEMPLATE_IDS)[number];
export type HybridTemplateId =
  | HybridTransitionTemplateId
  | HybridBridgeTemplateId;

export type HybridCompositionPlan = {
  schemaVersion: typeof HYBRID_PLAN_SCHEMA_VERSION;
  transitionRole: BeatRole;
  transitionTemplateId: HybridTransitionTemplateId;
  bridgeTemplateId: HybridBridgeTemplateId;
};

export const HYBRID_PLAN_FAILURE_REASONS = [
  "schema_invalid",
  "shape_invalid",
  "zone_not_allowed",
  "template_not_allowed",
  "artifact_rejected",
  "provider_timeout",
  "provider_error",
] as const;

export type HybridPlanFailureReason =
  (typeof HYBRID_PLAN_FAILURE_REASONS)[number];

export class HybridPlanProviderError extends Error {
  constructor(
    readonly reason: "provider_timeout" | "provider_error",
    message: string,
  ) {
    super(message);
    this.name = "HybridPlanProviderError";
  }
}

export type HybridPlanRequest = {
  schemaVersion: typeof HYBRID_PLAN_SCHEMA_VERSION;
  resonance: ResonancePromptSurface;
  episodeShape: string;
  allowedTransitionRoles: BeatRole[];
  allowedTransitionTemplateIds: HybridTransitionTemplateId[];
  allowedBridgeTemplateIds: HybridBridgeTemplateId[];
  priorFailureReasons: HybridPlanFailureReason[];
};

export type HybridPlanValidation =
  | { valid: true; plan: HybridCompositionPlan }
  | { valid: false; failureReasons: HybridPlanFailureReason[] };

const PRESSURE_LABELS: Record<ResonanceBrief["primaryPressure"], string> = {
  loss: "living with an absence",
  rejection: "being refused or unseen",
  isolation: "carrying difficulty without enough company",
  identity: "outgrowing an old sense of self",
  blocked_agency: "wanting movement while choices feel constrained",
  shame: "a setback becoming tangled with personal worth",
  uncertainty: "not knowing which direction can be trusted",
  exhaustion: "continuing after energy has thinned",
  other: "carrying a pressure without a simple name",
};

export function buildHybridPlanRequest(
  storySpec: StorySpec,
  resonanceBrief: ResonanceBrief,
  priorFailureReasons: HybridPlanFailureReason[] = [],
): HybridPlanRequest {
  return deepFreeze({
    schemaVersion: HYBRID_PLAN_SCHEMA_VERSION,
    resonance: toResonancePromptSurface(resonanceBrief),
    episodeShape: storySpec.episode.throughLine,
    allowedTransitionRoles: allowedTransitionRoles(storySpec),
    allowedTransitionTemplateIds: [...HYBRID_TRANSITION_TEMPLATE_IDS],
    allowedBridgeTemplateIds: [...HYBRID_BRIDGE_TEMPLATE_IDS],
    priorFailureReasons: [...new Set(priorFailureReasons)],
  });
}

export function validateHybridCompositionPlan(
  value: unknown,
  request: HybridPlanRequest,
): HybridPlanValidation {
  const failures = new Set<HybridPlanFailureReason>();
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { valid: false, failureReasons: ["shape_invalid"] };
  }
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).sort().join(",") !==
    "bridgeTemplateId,schemaVersion,transitionRole,transitionTemplateId"
  ) {
    failures.add("shape_invalid");
  }
  if (record.schemaVersion !== HYBRID_PLAN_SCHEMA_VERSION) {
    failures.add("schema_invalid");
  }
  if (
    typeof record.transitionRole !== "string" ||
    !request.allowedTransitionRoles.includes(record.transitionRole as BeatRole)
  ) {
    failures.add("zone_not_allowed");
  }
  if (
    typeof record.transitionTemplateId !== "string" ||
    !request.allowedTransitionTemplateIds.includes(
      record.transitionTemplateId as HybridTransitionTemplateId,
    ) ||
    typeof record.bridgeTemplateId !== "string" ||
    !request.allowedBridgeTemplateIds.includes(
      record.bridgeTemplateId as HybridBridgeTemplateId,
    )
  ) {
    failures.add("template_not_allowed");
  }
  if (failures.size > 0) {
    return { valid: false, failureReasons: [...failures] };
  }
  return {
    valid: true,
    plan: {
      schemaVersion: HYBRID_PLAN_SCHEMA_VERSION,
      transitionRole: record.transitionRole as BeatRole,
      transitionTemplateId:
        record.transitionTemplateId as HybridTransitionTemplateId,
      bridgeTemplateId: record.bridgeTemplateId as HybridBridgeTemplateId,
    },
  };
}

export function renderHybridTemplate(
  templateId: HybridTemplateId,
  resonanceBrief: ResonanceBrief,
): string {
  const pressure = PRESSURE_LABELS[resonanceBrief.primaryPressure];
  const distanceLead =
    resonanceBrief.desiredDistance === "gentle"
      ? "From a little distance, the lives remain different."
      : resonanceBrief.desiredDistance === "direct"
        ? "The parallel is limited, but this pressure is named plainly."
        : "The circumstances are different, and the parallel has limits.";

  switch (templateId) {
    case "transition-shared-pressure-v1":
      return `${distanceLead} This part holds the pressure of ${pressure}.`;
    case "transition-emotional-shape-v1":
      return `${distanceLead} This part stays with ${resonanceBrief.emotionalCore}.`;
    case "bridge-company-v1":
      return `The outcome belongs to this life, not yours. The story can only offer company for ${pressure}.`;
    case "bridge-open-ending-v1":
      return `Nothing here decides your next step. It leaves room around ${pressure}.`;
  }
}

export function renderHybridBeatText(
  canonicalText: string,
  templateId: HybridTemplateId,
  resonanceBrief: ResonanceBrief,
): string {
  return `${canonicalText}\n\n${renderHybridTemplate(templateId, resonanceBrief)}`;
}

export function isHybridTemplateId(value: string): value is HybridTemplateId {
  return (
    HYBRID_TRANSITION_TEMPLATE_IDS.includes(value as HybridTransitionTemplateId) ||
    HYBRID_BRIDGE_TEMPLATE_IDS.includes(value as HybridBridgeTemplateId)
  );
}

export function isTransitionTemplateId(
  value: string,
): value is HybridTransitionTemplateId {
  return HYBRID_TRANSITION_TEMPLATE_IDS.includes(
    value as HybridTransitionTemplateId,
  );
}

export function isBridgeTemplateId(value: string): value is HybridBridgeTemplateId {
  return HYBRID_BRIDGE_TEMPLATE_IDS.includes(value as HybridBridgeTemplateId);
}

function allowedTransitionRoles(storySpec: StorySpec): BeatRole[] {
  return storySpec.arc
    .filter(
      (beat) =>
        beat.role !== "bridge" &&
        (beat.personalizationZones.includes("transition") ||
          beat.personalizationZones.includes("emphasis")),
    )
    .map((beat) => beat.role);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
