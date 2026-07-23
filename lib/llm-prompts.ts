import facetTaggerPromptArtifactDocument from "../config/prompt-artifacts/facet-tagger/a68e57abeb7f92699ef8787004ec40f13dc918e518ccb8f8c8266bb534228c64.json";

type TemplateValue = string | number | readonly string[];

export type FacetTaggerPromptContract = Readonly<{
  schemaVersion: "facet-tagger-prompt-contract-v1";
  system: string;
  user: string;
  responseFormat: "json_object";
}>;

export type PromptRerankCandidate = Readonly<{
  figureKey: string;
  stageId: string;
  displayName: string;
  ageMin: number;
  ageMax: number;
  biographicalFacts: string;
}>;

export type PromptEyebrowSurface = Readonly<{
  resonance: Readonly<{
    primaryPressure: string;
    emotionalCore: string;
    situationShape: string;
    desiredDistance: string;
  }>;
  throughLine: string;
}>;

export type PromptHybridPlanSurface = Readonly<{
  schemaVersion: string;
  resonance: PromptEyebrowSurface["resonance"];
  episodeShape: string;
  allowedTransitionRoles: readonly string[];
  allowedTransitionTemplateIds: readonly string[];
  allowedBridgeTemplateIds: readonly string[];
  priorFailureReasons: readonly string[];
}>;

export const FACET_TAGGER_PROMPT_CONTRACT =
  normalizeFacetTaggerPromptArtifact(
    facetTaggerPromptArtifactDocument as unknown,
  );

export const RERANK_PROMPT_CONTRACT = Object.freeze({
  system: [
    "You are matching a person's emotional disclosure to a curated set of real historical figures.",
    "Each candidate is one episode from a figure's life at a particular age, described by biographical facts.",
    "Choose the ONE candidate whose specific struggle at a similar age best mirrors the emotional shape of what the person wrote.",
    "",
    "Rules:",
    "- Bias against figures whose stories are widely taught in school (Lincoln, Van Gogh, Einstein, etc.). When fit is comparable, prefer the less-famous figure — recognizability adds nothing if the resonance is shallow.",
    "- Weigh emotional shape first. Treat a large gap between the person's age and a candidate's age range as part of what the match does NOT cover, not as a disqualifier.",
    "- Distinguish being trapped in a life or role imposed by others from losing, wrecking, or restarting a career path one chose. When both are possible, prefer the candidate whose trigger matches the person's stated trap.",
    "- Distinguish being trapped in a private life role imposed by family or convention from being denied public credit or recognition for work one actually did.",
    "- Before deciding, hold two things in mind: the strongest reason the match resonates with the person's specific words, and the strongest gap (what their words carry that this figure's struggle does not). Then commit. Do not refuse to choose.",
    "- If no candidate genuinely matches the person's situation, still choose the closest candidate, but set confidence to \"low\"; do not inflate a weak or merely adjacent fit.",
    "- Choose only from the provided candidates, using their exact figure_key and stage_id.",
    "",
    'Respond with a single JSON object and nothing else, with keys: figure_key (string), stage_id (string), resonance (one sentence), gap (one sentence), confidence (one of "low", "medium", "high").',
  ].join("\n"),
  user: [
    "The person is {{age}} years old. They wrote:",
    '\"\"\"',
    "{{feeling}}",
    '\"\"\"',
    "",
    "Candidates:",
    "{{candidates}}",
    "",
    "Choose the best match and respond with the JSON object.",
  ].join("\n"),
  candidate: "- figure_key: {{figureKey}} | stage_id: {{stageId}} | name: {{displayName}} | age_range: {{ageMin}}-{{ageMax}}\n  biographical_facts: {{biographicalFacts}}",
  responseFormat: "json_object",
});

export const STORY_PROMPT_CONTRACT = Object.freeze({
  eyebrow: Object.freeze({
    system: [
      "You write one quiet line for the top of a page in a small, gentle book.",
      "A privacy-safe emotional shape has been derived from what someone shared. A real life story has been chosen to sit beside theirs, but its subject is not named here.",
      "Write a single short line that gestures at that pressure — like a chapter eyebrow, not a full sentence.",
      "",
      "Rules:",
      "- No diagnosis. No advice. No reassurance and no promises.",
      "- Do not name any person, place, or year. Do not claim the two lives match exactly.",
      "- Under ten words. Plain and calm. No quotation marks.",
      "- No preamble and no explanation. Output ONLY the line itself.",
    ].join("\n"),
    user: [
      "A privacy boundary reduced the reader's disclosure to these governed fields:",
      "Primary pressure: {{primaryPressure}}",
      "Emotional shape: {{emotionalCore}}",
      "Situation shape: {{situationShape}}",
      "Desired distance: {{desiredDistance}}",
      "",
      "The chosen life carries this emotional through-line (do not quote it, do not name its subject):",
      "{{throughLine}}",
      "",
      "Write the one-line eyebrow now.",
    ].join("\n"),
  }),
  hybridPlan: Object.freeze({
    system: [
      "You choose a bounded personalization plan for a true historical story.",
      "Return only one JSON object using values from the supplied allowlists.",
      "Do not write prose, add fields, infer a diagnosis, or repeat the emotional summary.",
      "Choose one transition role, one transition template ID, and one bridge template ID.",
    ].join("\n"),
    user: [
      "Plan schema: {{schemaVersion}}",
      "Primary pressure: {{primaryPressure}}",
      "Emotional shape: {{emotionalCore}}",
      "Situation shape: {{situationShape}}",
      "Desired distance: {{desiredDistance}}",
      "Historical episode shape: {{episodeShape}}",
      "Allowed transition roles: {{allowedTransitionRoles}}",
      "Allowed transition template IDs: {{allowedTransitionTemplateIds}}",
      "Allowed bridge template IDs: {{allowedBridgeTemplateIds}}",
      "Prior validation failures: {{priorFailureReasons}}",
      "Return keys schemaVersion, transitionRole, transitionTemplateId, bridgeTemplateId.",
    ].join("\n"),
    responseFormat: "json_object",
    temperature: 0,
  }),
});

export const RERANK_SYSTEM_PROMPT = RERANK_PROMPT_CONTRACT.system;
export const EYEBROW_SYSTEM_PROMPT = STORY_PROMPT_CONTRACT.eyebrow.system;
export const HYBRID_PLAN_SYSTEM_PROMPT = STORY_PROMPT_CONTRACT.hybridPlan.system;

export function buildRerankUserPrompt(
  age: number,
  feeling: string,
  candidates: readonly PromptRerankCandidate[],
): string {
  const renderedCandidates = candidates.map((candidate) =>
    renderTemplate(RERANK_PROMPT_CONTRACT.candidate, candidate),
  );
  return renderTemplate(RERANK_PROMPT_CONTRACT.user, {
    age,
    feeling,
    candidates: renderedCandidates.join("\n"),
  });
}

export function buildEyebrowUserPrompt(surface: PromptEyebrowSurface): string {
  return renderTemplate(STORY_PROMPT_CONTRACT.eyebrow.user, {
    ...surface.resonance,
    throughLine: surface.throughLine,
  });
}

export function buildHybridPlanUserPrompt(
  input: PromptHybridPlanSurface,
): string {
  return renderTemplate(STORY_PROMPT_CONTRACT.hybridPlan.user, {
    schemaVersion: input.schemaVersion,
    ...input.resonance,
    episodeShape: input.episodeShape,
    allowedTransitionRoles: input.allowedTransitionRoles,
    allowedTransitionTemplateIds: input.allowedTransitionTemplateIds,
    allowedBridgeTemplateIds: input.allowedBridgeTemplateIds,
    priorFailureReasons:
      input.priorFailureReasons.length > 0
        ? input.priorFailureReasons
        : "none",
  });
}

export function canonicalPromptContract(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalPromptContract(entry)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonicalPromptContract(record[key])}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function normalizeFacetTaggerPromptArtifact(
  value: unknown,
): FacetTaggerPromptContract {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "schemaVersion",
      "systemLines",
      "userLines",
      "responseFormat",
    ]) ||
    value.schemaVersion !== "facet-tagger-prompt-contract-v1" ||
    value.responseFormat !== "json_object"
  ) {
    throw new Error("Facet-tagger prompt artifact is invalid.");
  }

  const system = validatePromptLines(value.systemLines).join("\n");
  const user = validatePromptLines(value.userLines).join("\n");
  if (system.includes("{{") || system.includes("}}")) {
    throw new Error("Facet-tagger prompt artifact is invalid.");
  }

  const placeholders = [
    ...user.matchAll(/\{\{([A-Za-z][A-Za-z0-9]*)\}\}/g),
  ]
    .map((match) => match[1])
    .sort();
  const withoutPlaceholders = user.replace(
    /\{\{[A-Za-z][A-Za-z0-9]*\}\}/g,
    "",
  );
  if (
    placeholders.join(",") !== "feeling,projectionTemplateCatalog" ||
    withoutPlaceholders.includes("{{") ||
    withoutPlaceholders.includes("}}")
  ) {
    throw new Error("Facet-tagger prompt artifact is invalid.");
  }

  return Object.freeze({
    schemaVersion: "facet-tagger-prompt-contract-v1",
    system,
    user,
    responseFormat: "json_object",
  });
}

function validatePromptLines(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 64) {
    throw new Error("Facet-tagger prompt artifact is invalid.");
  }
  const lines: string[] = [];
  let totalBytes = 0;
  for (const line of value) {
    if (
      typeof line !== "string" ||
      utf8Bytes(line) > 1_024 ||
      /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u.test(line)
    ) {
      throw new Error("Facet-tagger prompt artifact is invalid.");
    }
    totalBytes += utf8Bytes(line);
    lines.push(line);
  }
  if (totalBytes === 0 || totalBytes > 16_384) {
    throw new Error("Facet-tagger prompt artifact is invalid.");
  }
  return lines;
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return (
    Object.keys(value).sort().join(",") === [...expected].sort().join(",")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function renderTemplate(
  template: string,
  values: Readonly<Record<string, TemplateValue>>,
): string {
  return template.replace(/\{\{([A-Za-z][A-Za-z0-9]*)\}\}/g, (_, key: string) => {
    const value = values[key];
    if (value === undefined) throw new Error("prompt template value is missing");
    return Array.isArray(value) ? value.join(", ") : String(value);
  });
}
