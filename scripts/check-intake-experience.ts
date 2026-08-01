import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

import {
  INTAKE_MAX_FEELING_LENGTH,
  INTAKE_MIN_FEELING_LENGTH,
  isValidIntakeFeeling,
} from "../lib/intake-constraints";
import {
  INTAKE_FICTIONAL_EXAMPLE,
  INTAKE_SUBMISSION_COPY,
  INTAKE_WRITING_PROMPTS,
  firstInvalidIntakeField,
  type IntakeDraft,
  type IntakeDraftValidation,
  type IntakeField,
  type IntakeSubmissionState,
  validateIntakeDraft,
} from "../lib/intake-presentation";
import {
  beginMatchRequest,
  confirmCurrentRequestCreatedNoStory,
  crisisResourceOrigin,
  INITIAL_MATCH_REQUEST_PRIVACY,
  matchRequestMayHaveCreatedStory,
} from "../lib/intake-request-privacy";
import { buildIntakeMatchRequest } from "../lib/intake-match-request";
import {
  selectedStoryBoundaries,
  type StoryBoundaryEditorValue,
  updateStoryBoundaryEditorValue,
} from "../components/StoryBoundaryEditor";

const VALID_FEELING =
  "I keep meeting closed doors and I am unsure what to try next.";
const PRIVATE_CANARY =
  "private-intake-canary@example.test should never enter presentation output";

function main(): void {
  checkGuidanceContract();
  checkValidationContract();
  checkBoundaryRequestContract();
  checkSubmissionCopyContract();
  checkRequestPrivacyStateMachine();
  checkAccessibleComponentWiring();
  checkTruthfulTransitionWiring();
  checkPrivacyBoundary();
  checkAutomationWiring();

  console.log("Onward guided-intake experience validator");
  console.log("==========================================");
  console.log("PASS guidance asks for useful context without adding diagnostic inputs");
  console.log("PASS exact age and disclosure boundaries produce focused inline errors");
  console.log("PASS story limits project to one exact optional request shape");
  console.log("PASS submission copy describes only observable client transitions");
  console.log("PASS response-loss uncertainty survives later retries and confirmations");
  console.log("PASS the intake form wires descriptions, errors, focus, and a polite live status");
  console.log("PASS guidance stays outside request, telemetry, and browser persistence");
  console.log("PASS the guided-intake contract is required by the pull-request CI gate");
}

function checkGuidanceContract(): void {
  const prompts = INTAKE_WRITING_PROMPTS;
  assert(Array.isArray(prompts), "writing prompts must be a closed array");
  assert.equal(prompts.length, 3, "intake must offer exactly three writing prompts");
  assert(Object.isFrozen(prompts), "writing prompt catalog must be immutable");

  const promptTexts = [...prompts];
  assert(
    promptTexts.every((prompt) => prompt.trim().length > 0),
    "writing prompts must not be empty",
  );
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

  const example = INTAKE_FICTIONAL_EXAMPLE;
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
    typeof validateIntakeDraft,
    "function",
    "intake presentation must export validateIntakeDraft",
  );
  assert.equal(
    typeof firstInvalidIntakeField,
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

function checkBoundaryRequestContract(): void {
  const hiddenDraft: StoryBoundaryEditorValue = {
    enabled: false,
    boundaries: {
      maxIntensity: "gentle",
      excludedFlags: ["addiction"],
    },
  };
  Object.freeze(hiddenDraft.boundaries.excludedFlags);
  Object.freeze(hiddenDraft.boundaries);
  Object.freeze(hiddenDraft);

  const hiddenSelection = selectedStoryBoundaries(hiddenDraft);
  assert.equal(
    hiddenSelection,
    undefined,
    "a disabled editor must not project its retained draft",
  );
  const baseRequest = buildIntakeMatchRequest({
    age: 28,
    feeling: VALID_FEELING,
    boundaries: hiddenSelection,
    clarification: null,
    acceptAdjacent: false,
    recoveryToken: null,
  });
  assert.deepEqual(
    baseRequest,
    { age: 28, feeling: VALID_FEELING },
    "an initial request must omit every inactive optional field",
  );
  const serializedBaseRequest = JSON.stringify(baseRequest);
  for (const hiddenCanary of [
    "boundaries",
    "maxIntensity",
    "excludedFlags",
    "gentle",
    "addiction",
  ]) {
    assert(
      !serializedBaseRequest.includes(hiddenCanary),
      `an inactive story limit leaked ${hiddenCanary} into the request`,
    );
  }

  const enabledDraft = updateStoryBoundaryEditorValue(hiddenDraft, {
    type: "set_enabled",
    enabled: true,
  });
  const enabledSelection = selectedStoryBoundaries(enabledDraft);
  assert(enabledSelection, "a re-enabled editor must project its restored draft");
  const boundaryRequest = buildIntakeMatchRequest({
    age: 28,
    feeling: VALID_FEELING,
    boundaries: enabledSelection,
    clarification: null,
    acceptAdjacent: false,
    recoveryToken: null,
  });
  assert.deepEqual(boundaryRequest, {
    age: 28,
    feeling: VALID_FEELING,
    boundaries: {
      maxIntensity: "gentle",
      excludedFlags: ["addiction"],
    },
  });
  assert.notEqual(
    boundaryRequest.boundaries?.excludedFlags,
    enabledDraft.boundaries.excludedFlags,
    "the request builder must isolate its boundary array from editor state",
  );

  const recoveryRequest = buildIntakeMatchRequest({
    age: 28,
    feeling: VALID_FEELING,
    boundaries: enabledSelection,
    clarification: "uncertainty",
    acceptAdjacent: true,
    recoveryToken: "recovery-token-canary",
  });
  assert.deepEqual(recoveryRequest, {
    age: 28,
    feeling: VALID_FEELING,
    boundaries: {
      maxIntensity: "gentle",
      excludedFlags: ["addiction"],
    },
    clarification: "uncertainty",
    acceptAdjacent: true,
    recoveryToken: "recovery-token-canary",
  });
  assert.deepEqual(hiddenDraft, {
    enabled: false,
    boundaries: {
      maxIntensity: "gentle",
      excludedFlags: ["addiction"],
    },
  });
}

function checkSubmissionCopyContract(): void {
  const states = INTAKE_SUBMISSION_COPY;
  assert(Object.isFrozen(states), "submission copy catalog must be immutable");
  assert.deepEqual(Object.keys(states).sort(), [
    "checking_request",
    "finding_story",
    "opening_story",
    "securing_session",
  ]);

  const expectedSemantics: Readonly<Record<IntakeSubmissionState, RegExp>> = {
    checking_request: /\bcheck(?:ing)?\b[\s\S]*\brequest\b/i,
    securing_session: /\b(?:securing|private)\b[\s\S]*\bsession\b/i,
    finding_story: /\bfind(?:ing)?\b[\s\S]*\b(?:story|life episode)\b/i,
    opening_story: /\b(?:open(?:ing)?|ready)\b[\s\S]*\bstory\b/i,
  };
  const renderedCopy: string[] = [];

  for (const state of Object.keys(expectedSemantics) as IntakeSubmissionState[]) {
    const semanticPattern = expectedSemantics[state];
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

function checkRequestPrivacyStateMachine(): void {
  const firstAttempt = beginMatchRequest(INITIAL_MATCH_REQUEST_PRIVACY);
  assert(Object.isFrozen(firstAttempt), "request privacy state must be immutable");
  assert.equal(
    crisisResourceOrigin(firstAttempt),
    "request_may_have_started",
    "an in-flight or response-lost request must remain uncertain",
  );

  const firstAttemptConfirmed =
    confirmCurrentRequestCreatedNoStory(firstAttempt);
  assert.equal(
    crisisResourceOrigin(firstAttemptConfirmed),
    "server_confirmed_no_story",
    "a confirmed first attempt may use the no-story copy",
  );
  assert.equal(
    crisisResourceOrigin(firstAttemptConfirmed, true),
    "server_no_write",
    "the authoritative crisis response has its own no-write provenance",
  );

  const retryAfterConfirmed = beginMatchRequest(firstAttemptConfirmed);
  assert.equal(
    retryAfterConfirmed.priorAttemptMayHaveCreatedStory,
    false,
    "a proven no-story response must not create phantom uncertainty",
  );

  const retryAfterLostResponse = beginMatchRequest(firstAttempt);
  assert.equal(
    retryAfterLostResponse.priorAttemptMayHaveCreatedStory,
    true,
    "dispatching a retry must preserve an unresolved earlier attempt",
  );
  const laterRateLimit =
    confirmCurrentRequestCreatedNoStory(retryAfterLostResponse);
  assert.equal(matchRequestMayHaveCreatedStory(laterRateLimit), true);
  assert.equal(
    crisisResourceOrigin(laterRateLimit),
    "request_may_have_started",
    "a later confirmation must not erase an earlier ambiguous commit",
  );
  assert.equal(
    crisisResourceOrigin(laterRateLimit, true),
    "request_may_have_started",
    "even a later crisis response cannot prove an earlier attempt wrote nothing",
  );
}

function checkAccessibleComponentWiring(): void {
  const form = source("components/IntakeForm.tsx");
  const boundaryEditor = source("components/StoryBoundaryEditor.tsx");
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
  assert.match(
    form,
    /<StoryBoundaryEditor[\s\S]{0,220}ref=\{boundaryRef\}[\s\S]{0,220}value=\{storyBoundaryEditorValue\}[\s\S]{0,220}onChange=\{handleBoundaryEditorChange\}[\s\S]{0,220}disabled=\{submitting\}/,
    "intake must use the controlled boundary editor and preserve its focus target",
  );
  assert.match(
    form,
    /function handleBoundaryEditorChange\([\s\S]{0,220}setStoryBoundaryEditorValue\(next\)[\s\S]{0,120}resetMatchRecovery\(\)/,
    "every story-limit edit must invalidate clarification and recovery state",
  );
  assert.match(boundaryEditor, /forwardRef<\s*HTMLFieldSetElement/);
  assert.match(boundaryEditor, /const id = useId\(\)/);
  assert.match(boundaryEditor, /<fieldset[\s\S]{0,180}disabled=\{disabled\}/);
  assert.match(boundaryEditor, /aria-expanded=\{value\.enabled\}/);
  assert.match(boundaryEditor, /aria-labelledby=/);
  assert.match(boundaryEditor, /STORY_INTENSITIES\.map/);
  assert.match(boundaryEditor, /BOUNDARY_TOPICS\.map/);
  assert.doesNotMatch(boundaryEditor, /\.(?:preventDefault|stopPropagation)\(/);
  assert.equal(
    (
      boundaryEditor.match(
        /\bonChange\(\s*updateStoryBoundaryEditorValue/g,
      ) ?? []
    ).length,
    3,
    "each editor interaction path must emit one controlled value",
  );
  const toggleStart = boundaryEditor.indexOf(
    '<label htmlFor={`${id}-toggle`}',
  );
  const intensityStart = boundaryEditor.indexOf("STORY_INTENSITIES.map");
  const topicStart = boundaryEditor.indexOf("BOUNDARY_TOPICS.map");
  assert(
    toggleStart >= 0 && intensityStart > toggleStart && topicStart > intensityStart,
    "boundary editor action regions must remain auditable",
  );
  const toggleRegion = boundaryEditor.slice(toggleStart, intensityStart);
  const intensityRegion = boundaryEditor.slice(intensityStart, topicStart);
  const topicRegion = boundaryEditor.slice(topicStart);
  assert.match(
    toggleRegion,
    /type="checkbox"[\s\S]*type:\s*"set_enabled"[\s\S]*enabled:\s*event\.target\.checked/,
    "the disclosure toggle must emit only its checked enabled state",
  );
  assert.doesNotMatch(toggleRegion, /type:\s*"(?:set_intensity|toggle_topic)"/);
  assert.match(
    intensityRegion,
    /type="radio"[\s\S]*type:\s*"set_intensity"[\s\S]*maxIntensity:\s*intensity/,
    "each intensity radio must emit its catalog intensity",
  );
  assert.doesNotMatch(intensityRegion, /type:\s*"(?:set_enabled|toggle_topic)"/);
  assert.match(
    topicRegion,
    /type="checkbox"[\s\S]*type:\s*"toggle_topic"[\s\S]*flag:\s*topic\.flag/,
    "each topic checkbox must emit its catalog flag",
  );
  assert.doesNotMatch(topicRegion, /type:\s*"(?:set_enabled|set_intensity)"/);

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
  assert.match(
    crisisCard,
    /origin:\s*CrisisResourceOrigin;/,
    "CrisisCard requires a provenance value for its persistence copy",
  );
  assert.match(
    crisisCard,
    /Readonly<Record<CrisisResourceOrigin,\s*string>>/,
    "every crisis-resource origin needs explicit persistence copy",
  );
  const uncertainCopyStart = crisisCard.indexOf("request_may_have_started:");
  const uncertainCopyEnd = crisisCard.indexOf("});", uncertainCopyStart);
  assert(
    uncertainCopyStart >= 0 && uncertainCopyEnd > uncertainCopyStart,
    "uncertain request copy must be auditable",
  );
  const uncertainCopy = crisisCard.slice(uncertainCopyStart, uncertainCopyEnd);
  assert.match(uncertainCopy, /may already have created a story/i);
  assert.doesNotMatch(
    uncertainCopy,
    /(?:did not|was not|wasn't|nothing was)\s+(?:save|saved|sent|start)/i,
    "an uncertain request must never receive a no-save guarantee",
  );
  assert.match(
    form,
    /type CrisisPresentation[\s\S]{0,180}resources:\s*CrisisResource\[\][\s\S]{0,100}origin:\s*CrisisResourceOrigin/,
    "resource data and persistence provenance must move atomically",
  );
  assert.match(
    form,
    /<CrisisCard[\s\S]{0,180}resources=\{crisisPresentation\.resources\}[\s\S]{0,100}origin=\{crisisPresentation\.origin\}/,
    "the intake form must pass the atomic crisis presentation to CrisisCard",
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
    (form.match(/if \(stopForInterruptedIntake\(\)\) return;/g) ?? []).length >= 7,
    "every awaited match/auth/response boundary must stop after crisis access or navigation",
  );
  assert.match(
    form,
    /function stopForInterruptedIntake\(\)[\s\S]{0,400}clearFirstContentRequestStarted\(\)[\s\S]{0,200}finishSubmitting\(\)/,
    "interrupted intake must clear pending visibility timing and preparation state",
  );
  assert.match(
    form,
    /event\.metaKey[\s\S]{0,100}event\.ctrlKey[\s\S]{0,100}event\.shiftKey[\s\S]{0,100}event\.altKey/,
    "new-tab and modifier-key links must not abandon the current intake",
  );
  assert(
    form.lastIndexOf("</motion.form>") < form.lastIndexOf('aria-live="polite"'),
    "the screen-reader submission status must stay outside the busy form subtree",
  );
  assert.match(
    form,
    /if \(!storyNavigationCommittedRef\.current\)[\s\S]{0,180}clearFirstContentRequestStarted\(\)/,
    "unmount cleanup must preserve successful story visibility timing",
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
  const boundaryEditor = source("components/StoryBoundaryEditor.tsx");
  assert.doesNotMatch(
    `${form}\n${boundaryEditor}`,
    /\b(?:localStorage|sessionStorage|indexedDB)\b/,
    "raw intake must not be persisted in browser storage",
  );
  assert.doesNotMatch(
    boundaryEditor,
    /\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|Worker|SharedWorker|BroadcastChannel|useEffect|useState|navigator|window|document|globalThis|location|history|postMessage|Image|console)\b|\/api\//,
    "the boundary editor must remain controlled, presentational, and sink-free",
  );
  const editorSourceFile = ts.createSourceFile(
    "components/StoryBoundaryEditor.tsx",
    boundaryEditor,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const editorImports: string[] = [];
  const forbiddenModuleLoads: string[] = [];
  const visitEditor = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier) {
        if (ts.isStringLiteral(node.moduleSpecifier)) {
          editorImports.push(node.moduleSpecifier.text);
        } else {
          forbiddenModuleLoads.push("non-literal static module specifier");
        }
      }
    }
    if (ts.isImportEqualsDeclaration(node)) {
      forbiddenModuleLoads.push("TypeScript import-equals");
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      forbiddenModuleLoads.push("dynamic import()");
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "require"
    ) {
      forbiddenModuleLoads.push("CommonJS require()");
    }
    ts.forEachChild(node, visitEditor);
  };
  visitEditor(editorSourceFile);
  assert.deepEqual(
    forbiddenModuleLoads,
    [],
    "the boundary editor must not load modules outside auditable static imports",
  );
  assert.deepEqual(
    editorImports.sort(),
    ["@/lib/story-boundaries", "@/lib/story-spec-types", "react"].sort(),
    "the boundary editor import surface must remain closed to React and reviewed catalogs",
  );

  const bodyStart = form.indexOf("const body = JSON.stringify");
  const postStart = form.indexOf("const postMatch", bodyStart);
  assert(bodyStart >= 0 && postStart > bodyStart, "match request body is not auditable");
  const requestBody = form.slice(bodyStart, postStart);
  assert.match(
    requestBody,
    /buildIntakeMatchRequest\([\s\S]{0,180}boundaries:\s*selectedStoryBoundaries\(storyBoundaryEditorValue\)/,
    "match requests must project limits through the exact controlled-value seam",
  );
  assert.equal(
    (requestBody.match(/storyBoundaryEditorValue/g) ?? []).length,
    1,
    "the match request must reference the editor value only through its bounded projection",
  );
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

  const requestBegin = form.indexOf("beginMatchRequest(", postStart);
  const fetchDispatch = form.indexOf('fetch("/api/match"', postStart);
  assert(
    requestBegin >= postStart && fetchDispatch > requestBegin,
    "privacy state must become uncertain before the browser dispatches a match",
  );

  const getSession = form.indexOf("supabase.auth.getSession()");
  const authInterruption = form.indexOf("sessionError || interrupted()", getSession);
  const signIn = form.indexOf("supabase.auth.signInAnonymously()", getSession);
  assert(
    getSession >= 0 && authInterruption > getSession && signIn > authInterruption,
    "manual help or navigation must interrupt auth between session lookup and sign-in",
  );

  const unavailableStart = form.indexOf(
    'if (response.status === 503 || "temporarilyUnavailable" in payload)',
  );
  const noEligibleStart = form.indexOf('"noEligibleStory" in payload', unavailableStart);
  assert(
    unavailableStart >= 0 && noEligibleStart > unavailableStart,
    "temporary-unavailability handling must be auditable",
  );
  const unavailableBranch = form.slice(unavailableStart, noEligibleStart);
  assert.doesNotMatch(
    unavailableBranch,
    /confirmCurrentRequestCreatedNoStory/,
    "503 cannot prove that createSession did not commit before response loss",
  );
  assert.match(
    unavailableBranch,
    /story may already exist/i,
    "503 copy must disclose ambiguous persistence",
  );
  assert.match(
    form,
    /could not read the result[\s\S]{0,120}story may already exist/i,
    "a successful response with unreadable JSON must disclose possible creation",
  );
  assert.match(
    form,
    /response\.ok\s*\|\|\s*response\.status\s*===\s*503/,
    "an unreadable 503 must use the same response-loss guidance",
  );
  assert.match(
    form,
    /const ambiguousRequestRecoveryCopy = recoveryToken[\s\S]{0,320}cannot be safely replayed[\s\S]{0,320}telemetryFlowId[\s\S]{0,260}recover the same journey[\s\S]{0,260}another retry may start another story/i,
    "replay copy must distinguish one-shot recovery, idempotent, and legacy requests",
  );
  assert(
    (form.match(/requestHistoryMayHaveCreatedStory/g) ?? []).length >= 4,
    "no-close, no-eligible, and rate-limit copy must retain prior uncertainty",
  );
  assert.match(
    form,
    /earlier response-lost attempt may have created/i,
    "confirmed current outcomes must disclose an unresolved earlier attempt",
  );
  assert.doesNotMatch(
    form,
    /Nothing was saved\./,
    "no-story outcomes must not deny bounded product-event persistence",
  );
  assert(
    (form.match(/if \(recoveryToken\) resetMatchRecovery\(\);/g) ?? []).length >=
      3,
    "ambiguous one-shot recovery responses must not offer an unsafe replay",
  );
  assert.match(
    form,
    /connection dropped[\s\S]{0,220}refreshing or leaving will clear it[\s\S]{0,140}server may already have received/i,
    "connection-loss copy must distinguish the page draft from server uncertainty",
  );

  const successfulNavigation = form.indexOf(
    "storyNavigationCommittedRef.current = true",
  );
  const bindVisibility = form.indexOf("bindFirstContentStory(", successfulNavigation);
  const routeStory = form.indexOf("router.push(", successfulNavigation);
  assert(
    successfulNavigation >= 0 &&
      bindVisibility > successfulNavigation &&
      routeStory > bindVisibility,
    "successful navigation must preserve visibility timing before unmount",
  );

  assert.match(
    form,
    /response\.headers\.get\(["']retry-after["']\)/,
    "rate-limit recovery must honor the server Retry-After header",
  );
  assert.doesNotMatch(
    form,
    /if\s*\(\s*rateLimited\s*\)\s*return\s*\(/,
    "rate limiting must keep the device-only draft available in the form",
  );

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

function validate(draft: IntakeDraft): IntakeDraftValidation {
  const result = validateIntakeDraft(draft);
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

function firstInvalid(
  validation: IntakeDraftValidation,
): IntakeField | null {
  const result = firstInvalidIntakeField(validation);
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
