import "./_smoke-bootstrap";
import { listAll } from "../lib/figures";
import type { BeatBlueprint, FigureStageRow } from "../lib/types";

// Authoring validator: structural / role gates on every hand-authored figure stage in
// lib/figures-data.ts. The user authors figures; this keeps their entries conformant
// before they enter the eval. Pure in-memory check — no provider, no env, no network.
//
// It does NOT judge editorial quality (that's the human's job) and does NOT touch the
// embedded-vs-rerank anti-echo split (smoke.ts already guards toRerankCandidate /
// toClientOutline). Scope here is: does this row have the shape the player + matcher
// assume?

const EXPECTED_LINEAR_ROLES = [
  "scene",
  "dark_moment",
  "response",
  "struggle",
  "turning_point",
  "became",
  "bridge",
] as const;

const SHAPE_MIN = 2;
const SHAPE_MAX = 3;
const AGE_FLOOR = 0;
const AGE_CEILING = 120;
const FEELING_PLACEHOLDER = "{feeling}";

const FACET_KEYS = [
  "emotionalCore",
  "decisionShape",
  "triggerEvent",
  "agencyState",
] as const;

function nonEmpty(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function checkFigure(stage: FigureStageRow): string[] {
  const problems: string[] = [];

  // Identity.
  if (!nonEmpty(stage.figureKey)) problems.push("figureKey is empty");
  if (!nonEmpty(stage.stageId)) problems.push("stageId is empty");
  if (!nonEmpty(stage.displayName)) problems.push("displayName is empty");
  if (!nonEmpty(stage.stageLabel)) problems.push("stageLabel is empty");

  // Age range (the soft age filter's input; ageMin must not exceed ageMax).
  if (!Number.isFinite(stage.ageMin) || !Number.isFinite(stage.ageMax)) {
    problems.push("ageMin/ageMax must be finite numbers");
  } else {
    if (stage.ageMin > stage.ageMax) {
      problems.push(`ageMin ${stage.ageMin} > ageMax ${stage.ageMax}`);
    }
    if (stage.ageMin < AGE_FLOOR || stage.ageMax > AGE_CEILING) {
      problems.push(
        `age range ${stage.ageMin}-${stage.ageMax} outside [${AGE_FLOOR}, ${AGE_CEILING}]`,
      );
    }
  }

  // shapeSentences — embedded surface; [0] is the editorial through-line by convention.
  if (!Array.isArray(stage.shapeSentences)) {
    problems.push("shapeSentences is not an array");
  } else {
    if (
      stage.shapeSentences.length < SHAPE_MIN ||
      stage.shapeSentences.length > SHAPE_MAX
    ) {
      problems.push(
        `shapeSentences has ${stage.shapeSentences.length}, expected ${SHAPE_MIN}-${SHAPE_MAX}`,
      );
    }
    stage.shapeSentences.forEach((sentence, index) => {
      if (!nonEmpty(sentence)) problems.push(`shapeSentences[${index}] is empty`);
    });
  }

  // Facets — all four are TS-guaranteed keys; here we only enforce non-empty content.
  for (const key of FACET_KEYS) {
    if (!nonEmpty(stage.facets?.[key])) problems.push(`facets.${key} is empty`);
  }

  // Rerank surface + provenance.
  if (!nonEmpty(stage.biographicalFacts)) problems.push("biographicalFacts is empty");
  if (!Array.isArray(stage.sources) || stage.sources.length === 0) {
    problems.push("sources is empty");
  } else {
    stage.sources.forEach((source, index) => {
      if (!nonEmpty(source)) problems.push(`sources[${index}] is empty`);
    });
  }

  // themes — drive the deterministic keyword/theme lane. An empty set means the scorer
  // can never route a feeling to this stage.
  if (!Array.isArray(stage.themes) || stage.themes.length === 0) {
    problems.push("themes is empty (the theme lane can never score this stage)");
  } else {
    stage.themes.forEach((theme, index) => {
      if (!nonEmpty(theme)) problems.push(`themes[${index}] is empty`);
    });
  }

  problems.push(...checkBeats(stage.beats));

  return problems;
}

function checkBeats(beats: BeatBlueprint[]): string[] {
  const problems: string[] = [];

  if (!Array.isArray(beats) || beats.length !== EXPECTED_LINEAR_ROLES.length) {
    const actual = Array.isArray(beats) ? `${beats.length}` : "non-array";
    problems.push(`beats has ${actual}, expected ${EXPECTED_LINEAR_ROLES.length}`);
    // Role-by-index checks are meaningless once the count is wrong.
    return problems;
  }

  beats.forEach((beat, index) => {
    const expectedRole = EXPECTED_LINEAR_ROLES[index];
    if (beat.role !== expectedRole) {
      problems.push(`beat[${index}] role=${beat.role}, expected ${expectedRole}`);
    }

    // The bridge beat is the only `bridge` kind; every other beat is `narrative`.
    const expectedKind = expectedRole === "bridge" ? "bridge" : "narrative";
    if (beat.kind !== expectedKind) {
      problems.push(
        `beat[${index}] (${expectedRole}) kind=${beat.kind}, expected ${expectedKind}`,
      );
    }

    if (!nonEmpty(beat.text)) {
      problems.push(`beat[${index}] (${expectedRole}) text is empty`);
    }

    // {feeling} is interpolated ONLY in the bridge beat (lib/llm-stub.ts). A placeholder
    // anywhere else would render literally to the user; a missing one in the bridge
    // drops the personal callback the bridge exists for.
    const hasPlaceholder =
      typeof beat.text === "string" && beat.text.includes(FEELING_PLACEHOLDER);
    if (expectedRole === "bridge" && !hasPlaceholder) {
      problems.push(`bridge beat is missing the ${FEELING_PLACEHOLDER} placeholder`);
    }
    if (expectedRole !== "bridge" && hasPlaceholder) {
      problems.push(
        `beat[${index}] (${expectedRole}) contains ${FEELING_PLACEHOLDER}, only interpolated in the bridge`,
      );
    }
  });

  return problems;
}

function main(): void {
  const stages = listAll();

  console.log("Onward figure validator");
  console.log("=======================");
  console.log("");

  if (stages.length === 0) {
    console.log("No figures in the library (lib/figures-data.ts).");
    process.exit(1);
  }

  let failed = 0;
  stages.forEach((stage, index) => {
    const problems = checkFigure(stage);
    const tag = problems.length === 0 ? "OK  " : "FAIL";
    const number = `[${index + 1}/${stages.length}]`;
    console.log(`${number} ${tag}  ${stage.figureKey} / ${stage.stageId}`);
    for (const problem of problems) console.log(`         - ${problem}`);
  });

  for (const stage of stages) {
    if (checkFigure(stage).length > 0) failed += 1;
  }

  console.log("");
  if (failed === 0) {
    console.log(`All ${stages.length} figure(s) passed.`);
    process.exit(0);
  }
  console.log(`${failed} of ${stages.length} figure(s) failed.`);
  process.exit(1);
}

main();
