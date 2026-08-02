import "server-only";
import type { CrisisResource } from "./types";
import { containsCrisisLanguage } from "./crisis-language";

export { containsCrisisLanguage } from "./crisis-language";

export const crisisRegexVersion = "v2-2026-07";
export const crisisResourcesReviewedAt = "2026-07-10";

export type CrisisResult = {
  crisisDetected: boolean;
  crisisRegexVersion: string;
  latencyMs: number;
};

export function classifyCrisis(feeling: string): CrisisResult {
  const start = performance.now();
  const detected = containsCrisisLanguage(feeling);
  const latencyMs = performance.now() - start;
  return { crisisDetected: detected, crisisRegexVersion, latencyMs };
}

// Reviewed against the linked provider pages on 2026-07-10. Each region links
// its service's OWN official page (a person in crisis should not have to find
// their country in an affiliate directory) and uses that page's stated action.
export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    id: "us-988",
    region: "United States and territories",
    label: "988 Suicide & Crisis Lifeline",
    action: "Call or text 988",
    href: "https://988lifeline.org/get-help/",
  },
  {
    id: "us-ctl",
    region: "United States",
    label: "Crisis Text Line",
    action: "Text HOME to 741741",
    href: "https://www.crisistextline.org/",
  },
  {
    id: "uk-shout",
    region: "United Kingdom",
    label: "Shout",
    action: "Text SHOUT to 85258",
    href: "https://giveusashout.org/",
  },
  {
    id: "ca-khp",
    region: "Canada",
    label: "Kids Help Phone",
    action: "Text CONNECT to 686868",
    href: "https://kidshelpphone.ca/",
  },
  {
    id: "ie-text-about-it",
    region: "Ireland",
    label: "Text About It",
    action: "Text TALK to 50808",
    href: "https://www.textaboutit.ie/",
  },
  {
    id: "international-findahelpline",
    region: "International",
    label: "Find A Helpline",
    action: "Find a verified local helpline",
    href: "https://findahelpline.com/",
  },
];
