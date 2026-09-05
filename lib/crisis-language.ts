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
  // Initial explicit Simplified/Traditional Chinese signals. Conservative,
  // not comprehensive multilingual detection; no matched phrase is exposed.
  /自\s*[杀殺残殘]/u,
  /[轻輕]\s*生/u,
  /割\s*腕/u,
  /我[^。！？\n]{0,12}(?:想|要|[准準][备備]|打算|[计計][划劃])\s*(?:去\s*)?死/u,
  /(?:我[^。！？\n]{0,12})?(?:不想|不愿|不願)\s*(?:再|继续|繼續)?\s*(?:活(?:着|著)?|存在|醒[来來])/u,
  /(?:活不下去|不想活了|不想再活|活[着著][没沒]有意[义義])/u,
  /(?:[结結]束|[结結]束掉)[^。！？\n]{0,6}(?:我|自己)[^。！？\n]{0,4}生命/u,
  /我[^。！？\n]{0,12}(?:想|要|[准準][备備]|打算|[计計][划劃])\s*[结結]束(?:掉)?\s*生命(?:了)?(?:[。！？,.!?，；;\s]|$)/u,
  /(?:[伤傷]害|[杀殺]死)\s*(?:我自己|自己)/u,
  /我[^。！？\n]{0,12}(?:跳[楼樓]|跳[桥橋]|跳河)/u,
]);

/**
 * Shared exact predicate for the server's authoritative crisis gate and the
 * intake's pre-validation resource handoff. It returns only a boolean: callers
 * must not expose which expression matched.
 */
export function containsCrisisLanguage(value: string): boolean {
  const normalized = value.normalize("NFKC").replace(/[\u200b-\u200d\ufeff]/gu, "");
  return CRISIS_PATTERNS.some((pattern) => pattern.test(normalized));
}
