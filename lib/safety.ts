import "server-only";
import type { CrisisResource } from "./types";

export const crisisRegexVersion = "v2-2026-07";
export const crisisResourcesReviewedAt = "2026-07-10";

const CRISIS_PATTERNS: RegExp[] = [
  /\bkill\s+(myself|me)\b/i,
  /\bend\s+(it|my\s+life|things|everything|it\s+all)\b/i,
  /\b(commit\s+)?suicide\b/i,
  /\bsuicidal\b/i,
  /\b(want|wanna|going|gonna|plan(?:ning)?|about)\s+to\s+die\b/i,
  /\bhurt(?:ing)?\s+myself\b/i,
  /\bharm(?:ing)?\s+myself\b/i,
  /\bself[-\s]?harm\b/i,
  /\bcut(?:ting)?\s+myself\b/i,
  /\boverdose\b/i,
  /\bjump\s+(off|from|in\s+front)\b/i,
  /\b(don'?t|do\s+not)\s+want\s+to\s+(be\s+here|live|exist|wake\s+up|be\s+alive)\b/i,
  /\bnot\s+want\s+to\s+(be\s+here|live|exist|wake\s+up|be\s+alive)\b/i,
  /\bbetter\s+off\s+(dead|gone|without\s+me)\b/i,
  /\bno\s+reason\s+to\s+(live|go\s+on|keep\s+going|wake\s+up)\b/i,
  /\bwish\s+i\s+(was|were)\s+(dead|gone|never\s+born)\b/i,
  /\b(take|end)\s+my\s+own\s+life\b/i,
  /\b(plan|planning|planned)\s+(to\s+)?(kill\s+myself|die|end\s+my\s+life)\b/i,
  /\b(have|made|making)\s+(a\s+)?(suicide|suicidal)\s+plan\b/i,
  /\b(can'?t|cannot)\s+keep\s+myself\s+safe\b/i,
  /\bno\s+point\s+(in\s+)?(being\s+alive|living|going\s+on)\b/i,
  /\b(everyone|they|you)\s+(would\s+be|is)\s+better\s+off\s+without\s+me\b/i,
  /\b(everyone|they|you)\s+would\s+be\s+better\s+off\s+(if\s+i\s+(was|were)\s+)?(dead|gone)\b/i,
  /\bhope\s+i\s+(don'?t|do\s+not|never)\s+wake\s+up\b/i,
  /\b(can'?t|cannot)\s+go\s+on\s+(anymore|like\s+this)\b/i,
];

export type CrisisResult = {
  crisisDetected: boolean;
  crisisRegexVersion: string;
  latencyMs: number;
};

export function classifyCrisis(feeling: string): CrisisResult {
  const start = performance.now();
  const detected = CRISIS_PATTERNS.some((re) => re.test(feeling));
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
