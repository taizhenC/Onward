import type {
  StoryEvidenceClass,
  StoryTransparencyBeat,
} from "./story-transparency-types";

const EVIDENCE_LABELS: Readonly<Record<StoryEvidenceClass, string>> =
  Object.freeze({
    documented_scene:
      "Includes historical claims — documented and told in narrative language",
    documented_with_interpretation:
      "Includes historical claims — documented with reviewed interpretation",
    documented_with_texture:
      "Includes historical claims — documented events, told with scene detail we wrote; those lines are listed below",
    qualified_historical_evidence:
      "Includes historical claims — some evidence is probable or disputed and labeled below",
    qualified_evidence_with_interpretation:
      "Includes historical claims — qualified evidence with reviewed interpretation",
    qualified_evidence_with_texture:
      "Includes historical claims — some evidence is probable or disputed, and some scene detail is ours; both are listed below",
    reader_bridge: "Reflection — not a historical claim",
    review_pending:
      "Editorial review draft — evidence mapping is not public-ready",
  });

const LEGACY_MIXED_BRIDGE_LABEL =
  "Includes historical claims — this earlier saved story uses an older evidence format; evidence links are listed below";

export function storyEvidenceLabel(
  beat: Pick<
    StoryTransparencyBeat,
    "evidenceClass" | "factIds" | "quoteIds" | "role"
  >,
): string {
  return isLegacyMixedBridge(beat)
    ? LEGACY_MIXED_BRIDGE_LABEL
    : EVIDENCE_LABELS[beat.evidenceClass];
}

export function isLegacyMixedBridge(
  beat: Pick<
    StoryTransparencyBeat,
    "evidenceClass" | "factIds" | "quoteIds" | "role"
  >,
): boolean {
  return (
    beat.role === "bridge" &&
    beat.evidenceClass === "reader_bridge" &&
    (beat.factIds.length > 0 || beat.quoteIds.length > 0)
  );
}
