import "server-only";

export const crisisRegexVersion = "v1-2026-05";

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

export const CRISIS_RESOURCES: string[] = [
  "988 Suicide & Crisis Lifeline — call or text 988 (US)",
  "Crisis Text Line — text HOME to 741741 (US/Canada/UK/Ireland)",
  "International directory: findahelpline.com",
];
