const CRISIS_PATTERNS: readonly RegExp[] = Object.freeze([
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
]);

/**
 * Shared exact predicate for the server's authoritative crisis gate and the
 * intake's pre-validation resource handoff. It returns only a boolean: callers
 * must not expose which expression matched.
 */
export function containsCrisisLanguage(value: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(value));
}
