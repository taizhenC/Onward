import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  INTAKE_MAX_FEELING_LENGTH,
  INTAKE_MIN_FEELING_LENGTH,
  isValidIntakeFeeling,
} from "../lib/intake-constraints";
import * as intakePresentationModule from "../lib/intake-presentation";

type IntakeField = "age" | "feeling";

type Draft = Readonly<{
  age: string;
  feeling: string;
}>;

type DraftValidation = Readonly<{
  age: string | null;
  feeling: string | null;
}>;

type SubmissionCopy = Readonly<{
  buttonLabel: string;
  liveStatus: string;
}>;

type IntakePresentationContract = Readonly<{
  INTAKE_WRITING_PROMPTS: readonly unknown[];
  INTAKE_FICTIONAL_EXAMPLE: unknown;
  INTAKE_SUBMISSION_COPY: Readonly<Record<string, SubmissionCopy>>;
  validateIntakeDraft: (draft: Draft) => DraftValidation;
  firstInvalidIntakeField: (validation: DraftValidation) => IntakeField | null;
}>;

const presentation =
  intakePresentationModule as unknown as IntakePresentationContract;

const VALID_FEELING =
  "I keep meeting closed doors and I am unsure what to try next.";
const PRIVATE_CANARY =
  "private-intake-canary@example.test should never enter presentation output";

function main(): void {
  checkGuidanceContract();
  checkValidationContract();
  checkSubmissionCopyContract();
  checkAccessibleComponentWiring();
  checkTruthfulTransitionWiring();
  checkPrivacyBoundary();
  checkAutomationWiring();

  console.log("Onward guided-intake experience validator");
  console.log("==========================================");
  console.log("PASS guidance asks for useful context without adding diagnostic inputs");
  console.log("PASS exact age and disclosure boundaries produce focused inline errors");
  console.log("PASS submission copy describes only observable client transitions");
  console.log("PASS the intake form wires descriptions, errors, focus, and a polite live status");
  console.log("PASS guidance stays outside request, telemetry, and browser persistence");
  console.log("PASS the guided-intake contract is required by the pull-request CI gate");
}

function checkGuidanceContract(): void {
  const prompts = presentation.INTAKE_WRITING_PROMPTS;
  assert(Array.isArray(prompts), "writing prompts must be a closed array");
  assert.equal(prompts.length, 3, "intake must offer exactly three writing prompts");
  assert(Object.isFrozen(prompts), "writing prompt catalog must be immutable");

  const promptTexts = prompts.map(promptText);
  assert.equal(
    new Set(promptTexts.map(normalizeCopy)).size,
    prompts.length,
    "writing prompts must be distinct",
  );
  assert(
    promptTexts.some((text) => /\b(?:happened|happening|changed)\b/i.test(text)),
    "guidance must ask what happened",
  );
  assert(
    promptTexts.some((text) => /\b(?:hurt|hurts|hardest|heavy)\b/i.test(text)),
    "guidance must ask what hurts most",
  );
  assert(
    promptTexts.some((text) =>
      /\b(?:uncertain|unsure|unknown|next)\b/i.test(text),
    ),
    "guidance must ask what feels uncertain",
  );

  const serializedPrompts = JSON.stringify(prompts);
  for (const forbidden of [
    "diagnosis",
    "diagnostic",
    "disorder",
    "symptom",
    "searchPhrase",
    "matchPhrase",
    "keywords",
  ]) {
    assert(
      !serializedPrompts.toLowerCase().includes(forbidden.toLowerCase()),
      `writing guidance exposed forbidden matching or clinical field ${forbidden}`,
    );
  }

  const example = exampleText(presentation.INTAKE_FICTIONAL_EXAMPLE);
  assert.match(
    example,
    /\bfictional\b/i,
    "the example must identify itself as fictional",
  );
  const disclosure = example.replace(/^.*?\bfictional\b[^:.\n]*[:.\s-]*/i, "");
  assert(
    isValidIntakeFeeling(disclosure),
    "the fictional example must model a valid disclosure",
  );
  assert(
    !/\b(?:19|20)\d{2}\b/.test(example),
    "the fictional example must not model unnecessary dates",
  );
}

function checkValidationContract(): void {
  assert.equal(
    typeof presentation.validateIntakeDraft,
    "function",
    "intake presentation must export validateIntakeDraft",
  );
  assert.equal(
    typeof presentation.firstInvalidIntakeField,
    "function",
    "intake presentation must export firstInvalidIntakeField",
  );

  const valid = validate({ age: "28", feeling: VALID_FEELING });
  assert.deepEqual(valid, { age: null, feeling: null });
  assert.equal(firstInvalid(valid), null);

  const empty = validate({ age: "", feeling: "   " });
  assert.match(requiredError(empty.age), /\bage\b/i);
  assert.match(requiredError(empty.feeling), /\b(?:write|happening)\b/i);
  assert.equal(firstInvalid(empty), "age");

  for (const age of ["12", "101"]) {
    const result = validate({ age, feeling: VALID_FEELING });
    assert.match(requiredError(result.age), /13|100|range|between/i);
    assert.equal(result.feeling, null);
    assert.equal(firstInvalid(result), "age");
  }

  for (const age of ["28.5", "not-a-number", "Infinity"]) {
    const result = validate({ age, feeling: VALID_FEELING });
    assert.match(requiredError(result.age), /whole|number|age/i);
    assert.equal(result.feeling, null);
  }

  const nineCodePoints = "a".repeat(INTAKE_MIN_FEELING_LENGTH - 1);
  const short = validate({ age: "28", feeling: nineCodePoints });
  assert.match(
    requiredError(short.feeling),
    new RegExp(String(INTAKE_MIN_FEELING_LENGTH)),
  );
  assert.equal(firstInvalid(short), "feeling");

  const exactLimit = "🙂".repeat(INTAKE_MAX_FEELING_LENGTH);
  assert.deepEqual(
    validate({ age: "28", feeling: exactLimit }),
    { age: null, feeling: null },
    "the UI must count Unicode code points like the server",
  );
  const overLimit = validate({
    age: "28",
    feeling: `${exactLimit}🙂`,
  });
  assert.match(
    requiredError(overLimit.feeling),
    new RegExp(
      INTAKE_MAX_FEELING_LENGTH.toLocaleString("en-US").replace(",", ",?"),
    ),
  );

  const normalized = validate({
    age: "28",
    feeling: `${"e\u0301".repeat(10)} this is still enough`,
  });
  assert.equal(normalized.feeling, null, "NFC input must remain valid");

  const privateValidation = validate({
    age: "",
    feeling: PRIVATE_CANARY,
  });
  assert(
    !JSON.stringify(privateValidation).includes(PRIVATE_CANARY),
    "validation output must not reflect private disclosure text",
  );
}

function checkSubmissionCopyContract(): void {
  const states = presentation.INTAKE_SUBMISSION_COPY;
  assert(Object.isFrozen(states), "submission copy catalog must be immutable");
  assert.deepEqual(Object.keys(states).sort(), [
    "checking_request",
    "finding_story",
    "opening_story",
    "securing_session",
  ]);

  const expectedSemantics = {
    checking_request: /\bcheck(?:ing)?\b[\s\S]*\brequest\b/i,
    securing_session: /\b(?:securing|private)\b[\s\S]*\bsession\b/i,
    finding_story: /\bfind(?:ing)?\b[\s\S]*\b(?:story|life episode)\b/i,
    opening_story: /\b(?:open(?:ing)?|ready)\b[\s\S]*\bstory\b/i,
  } as const;
  const renderedCopy: string[] = [];

  for (const [state, semanticPattern] of Object.entries(expectedSemantics)) {
    const copy = states[state];
    assert(copy, `submission copy is missing ${state}`);
    assert(Object.isFrozen(copy), `${state} copy must be immutable`);
    assert(copy.buttonLabel.trim(), `${state} button copy is empty`);
    assert(copy.liveStatus.trim(), `${state} live status is empty`);
    const combined = `${copy.buttonLabel} ${copy.liveStatus}`;
    assert.match(combined, semanticPattern, `${state} copy is not truthful`);
    assert.doesNotMatch(
      combined,
      /(?:\d+\s*%|\bpercent\b|\bseconds?\b|\bminutes?\b|\balmost done\b|\bhalfway\b)/i,
      `${state} copy makes an unobservable progress or duration promise`,
    );
    renderedCopy.push(normalizeCopy(combined));
  }
  assert.equal(
    new Set(renderedCopy).size,
    renderedCopy.length,
    "each observable submission transition needs distinct copy",
  );
}

function checkAccessibleComponentWiring(): void {
  const form = source("components/IntakeForm.tsx");
  const crisisCard = source("components/CrisisCard.tsx");
  assert.match(form, /INTAKE_WRITING_PROMPTS/);
  assert.match(form, /INTAKE_FICTIONAL_EXAMPLE/);
  assert.match(form, /validateIntakeDraft/);
  assert.match(form, /firstInvalidIntakeField/);
  assert.match(
    form,
    /similar\s+(?:age|life\s+stage)|life\s+episode\s+from\s+(?:your|a)\s+similar/i,
    "age needs a plain-language matching rationale",
  );

  assert(
    (form.match(/aria-describedby=/g) ?? []).length >= 2,
    "age and disclosure controls must reference their help/error copy",
  );
  assert(
    (form.match(/aria-invalid=/g) ?? []).length >= 2,
    "age and disclosure controls must expose attempted validation",
  );
  assert.match(form, /aria-busy=\{submitting\}/);
  assert.match(form, /role=["']status["']/);
  assert.match(form, /aria-live=["']polite["']/);
  assert.match(form, /aria-atomic=["']true["']/);
  assert.match(
    form,
    /(?:validationAttempted|showValidation|submitted)[\s\S]{0,200}(?:setValidationAttempted|setShowValidation|setSubmitted)/,
    "inline errors need an explicit attempted-submit gate",
  );
  assert.match(form, /ageRef\.current\?\.focus\(\)/);
  assert.match(form, /feelingRef\.current\?\.focus\(\)/);

  const submitTag = openingTagContaining(form, 'type="submit"');
  assert(
    !/\b(?:ageValid|feelingValid|baseCanSubmit|canSubmit)\b/.test(submitTag),
    "an invalid draft must not be trapped behind a silently disabled submit button",
  );

  const crisisAction = openingButtonBeforeText(form, "I need immediate help");
  assert(
    !/\bdisabled(?:=|\s|>)/.test(crisisAction),
    "the always-available crisis action must remain enabled during submission",
  );
  const requestStartedProp =
    /(?:matchRequestStarted|requestStarted|requestWasSent)\??\s*:\s*boolean/;
  assert.match(
    crisisCard,
    requestStartedProp,
    "CrisisCard needs a boolean describing whether a match request started",
  );
  assert.match(
    form,
    /<CrisisCard[\s\S]{0,250}(?:matchRequestStarted|requestStarted|requestWasSent)=\{/,
    "the intake form must project request-start state into CrisisCard",
  );
  assert(
    /(?:matchRequestStarted|requestStarted|requestWasSent)\s*\?[\s\S]{0,700}:[\s\S]{0,500}(?:did not save|nothing (?:was|has been) sent)/i.test(
      crisisCard,
    ) ||
      /!(?:matchRequestStarted|requestStarted|requestWasSent)\s*\?[\s\S]{0,500}(?:did not save|nothing (?:was|has been) sent)[\s\S]{0,700}:/i.test(
        crisisCard,
    ),
    "CrisisCard may promise no save only on the no-request branch",
  );
  assert(
    form.indexOf("containsCrisisLanguage(feeling)") <
      form.indexOf("setValidationAttempted(true)"),
    "shared crisis detection must precede the local invalid-field stop",
  );
  assert.match(
    form,
    /function openCrisisResources\(\)[\s\S]{0,350}manualCrisisOpenedRef\.current = true/,
    "manual resource access must record its interruption before rendering",
  );
  assert(
    (form.match(/if \(stopForManualCrisis\(\)\) return;/g) ?? []).length >= 4,
    "every awaited match/auth/response boundary must stop after manual crisis access",
  );
  assert.match(
    form,
    /function stopForManualCrisis\(\)[\s\S]{0,350}clearFirstContentRequestStarted\(\)[\s\S]{0,200}finishSubmitting\(\)/,
    "manual crisis access must clear pending visibility timing and preparation state",
  );
}

function checkTruthfulTransitionWiring(): void {
  const form = source("components/IntakeForm.tsx");
  assert.doesNotMatch(
    form,
    /\bset(?:Timeout|Interval)\s*\(/,
    "submission progress must follow real transitions, not a timer",
  );
  assert.match(
    form,
    /setSubmissionState\(["']checking_request["']\)[\s\S]{0,900}(?:postMatch|fetch)\s*\(/,
    "checking status must begin at the initial request",
  );
  assert.match(
    form,
    /response\.status\s*===\s*401[\s\S]{0,500}setSubmissionState\(["']securing_session["']\)[\s\S]{0,500}ensureAuthSession\s*\(/,
    "private-session status must be entered only on the 401 auth path",
  );
  assert.match(
    form,
    /setSubmissionState\(["']finding_story["']\)[\s\S]{0,500}(?:postMatch|fetch)\s*\(/,
    "finding-story status must describe an actual match request",
  );
  assert.match(
    form,
    /["']sessionId["'] in payload[\s\S]{0,350}setSubmissionState\(["']opening_story["']\)[\s\S]{0,350}router\.push\s*\(/,
    "opening status must follow a successful session response",
  );
  assert.match(
    form,
    /function finishSubmitting\(\)[\s\S]{0,300}setSubmissionState\((?:null|["']idle["'])\)/,
    "recoverable outcomes must clear the live submission status",
  );
}

function checkPrivacyBoundary(): void {
  const form = source("components/IntakeForm.tsx");
  assert.doesNotMatch(
    form,
    /\b(?:localStorage|sessionStorage|indexedDB)\b/,
    "raw intake must not be persisted in browser storage",
  );

  const bodyStart = form.indexOf("const body = JSON.stringify");
  const postStart = form.indexOf("const postMatch", bodyStart);
  assert(bodyStart >= 0 && postStart > bodyStart, "match request body is not auditable");
  const requestBody = form.slice(bodyStart, postStart);
  for (const forbidden of [
    "INTAKE_WRITING_PROMPTS",
    "INTAKE_FICTIONAL_EXAMPLE",
    "writingPrompt",
    "promptId",
    "example",
    "guidance",
  ]) {
    assert(
      !requestBody.includes(forbidden),
      `presentation-only guidance leaked into the match request: ${forbidden}`,
    );
  }

  const telemetryStart = form.indexOf("async function sendIntakeStarted");
  assert(telemetryStart >= 0, "intake telemetry integration is missing");
  const telemetrySource = form.slice(telemetryStart);
  assert.match(telemetrySource, /JSON\.stringify\(\{\s*viewportBucket\s*\}\)/);
  assert.doesNotMatch(
    telemetrySource,
    /\b(?:age|feeling|draft|prompt|example)\b/,
    "guided-intake changes must not expand intake-started telemetry",
  );
}

function checkAutomationWiring(): void {
  const packageJson = JSON.parse(source("package.json")) as {
    scripts?: Record<string, string>;
  };
  assert.equal(
    packageJson.scripts?.["check-intake-experience"],
    "tsx scripts/check-intake-experience.ts",
    "package.json must expose the exact guided-intake checker",
  );
  assert(
    source(".github/workflows/ci.yml").includes(
      "npm run check-intake-experience",
    ),
    "pull-request CI must execute the guided-intake checker",
  );
}

function validate(draft: Draft): DraftValidation {
  const result = presentation.validateIntakeDraft(draft);
  assert(result && typeof result === "object", "validation must return an object");
  assert.deepEqual(
    Object.keys(result).sort(),
    ["age", "feeling"],
    "validation errors must remain a closed two-field record",
  );
  assert(Object.isFrozen(result), "validation output must be immutable");
  assert(
    result.age === null || typeof result.age === "string",
    "age validation must be null or copy",
  );
  assert(
    result.feeling === null || typeof result.feeling === "string",
    "feeling validation must be null or copy",
  );
  return result;
}

function firstInvalid(validation: DraftValidation): IntakeField | null {
  const result = presentation.firstInvalidIntakeField(validation);
  assert(
    result === "age" || result === "feeling" || result === null,
    "first invalid field must remain closed",
  );
  return result;
}

function requiredError(value: string | null): string {
  assert(typeof value === "string", "expected an inline validation message");
  assert(value.trim(), "inline validation message must not be empty");
  return value;
}

function promptText(prompt: unknown): string {
  if (typeof prompt === "string") {
    assert(prompt.trim(), "writing prompt must not be empty");
    return prompt;
  }
  assert(prompt && typeof prompt === "object", "writing prompt must be text");
  const candidate = prompt as Record<string, unknown>;
  const text = ["label", "text", "prompt"]
    .map((key) => candidate[key])
    .find((value): value is string => typeof value === "string");
  assert(
    typeof text === "string" && text.trim(),
    "writing prompt object needs label, text, or prompt copy",
  );
  return text;
}

function exampleText(example: unknown): string {
  if (typeof example === "string") {
    assert(example.trim(), "fictional example must not be empty");
    return example;
  }
  assert(example && typeof example === "object", "fictional example must be text");
  const values = Object.values(example as Record<string, unknown>).filter(
    (value): value is string => typeof value === "string",
  );
  const text = values.join(": ");
  assert(text.trim(), "fictional example object contains no copy");
  return text;
}

function normalizeCopy(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function openingTagContaining(contents: string, marker: string): string {
  const markerIndex = contents.indexOf(marker);
  assert(markerIndex >= 0, `could not find ${marker}`);
  const tagStart = contents.lastIndexOf("<button", markerIndex);
  const tagEnd = contents.indexOf(">", markerIndex);
  assert(tagStart >= 0 && tagEnd > markerIndex, `could not parse tag for ${marker}`);
  return contents.slice(tagStart, tagEnd + 1);
}

function openingButtonBeforeText(contents: string, text: string): string {
  const textIndex = contents.indexOf(text);
  assert(textIndex >= 0, `could not find button text ${text}`);
  const tagStart = contents.lastIndexOf("<button", textIndex);
  const tagEnd = contents.indexOf(">", tagStart);
  assert(tagStart >= 0 && tagEnd >= 0 && tagEnd < textIndex);
  return contents.slice(tagStart, tagEnd + 1);
}

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

try {
  main();
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
