import "server-only";
import {
  DEFAULT_PREFACE_LINES,
  NEUTRAL_EYEBROW,
  curatedEyebrow,
  sanitizeEyebrow,
  toEyebrowProviderSurface,
  toEyebrowSurface,
  type EyebrowProviderSurface,
  type OpeningCopyInput,
} from "./opening-copy";
import {
  STORY_PROMPT_VERSION_V1,
  STORY_PROMPT_VERSION_V2,
  storyPromptContractFor,
} from "./llm-recipe-constants";
import {
  buildEyebrowUserPrompt,
  buildPrefacePlanUserPrompt,
} from "./llm-prompts";
import {
  buildPrefacePlanRequest,
  firstCompatiblePrefacePlan,
  renderPersonalizedOpeningCopy,
  validatePrefacePlanCandidate,
} from "./preface-plan";
import { containsResonanceEcho } from "./resonance-brief";
import type { OpeningCopy } from "./types";

export type OpeningCopyProviderPrompts = Readonly<{
  responseMode: "line" | "json_object";
  systemPrompt: string;
  userPrompt: string;
}>;

export type OpeningCopyPolicy = Readonly<{
  storyPromptVersion: string;
  providerPrompts(
    surface: EyebrowProviderSurface,
  ): OpeningCopyProviderPrompts;
  fromRealCandidate(
    raw: unknown,
    input: OpeningCopyInput,
  ): OpeningCopy;
  fromStub(input: OpeningCopyInput): OpeningCopy;
}>;

export class OpeningCopyPolicyError extends Error {
  readonly code = "unsupported_story_prompt_version";

  constructor() {
    super("Opening-copy policy is unavailable.");
    this.name = "OpeningCopyPolicyError";
  }
}

const v1Contract = storyPromptContractFor(STORY_PROMPT_VERSION_V1);
if (!v1Contract) throw new OpeningCopyPolicyError();
const v2Contract = storyPromptContractFor(STORY_PROMPT_VERSION_V2);
if (!v2Contract?.personalizedPreface) throw new OpeningCopyPolicyError();
const v2PersonalizedPrefaceContract = v2Contract.personalizedPreface;

const V1_POLICY: OpeningCopyPolicy = Object.freeze({
  storyPromptVersion: STORY_PROMPT_VERSION_V1,
  providerPrompts(surface) {
    return Object.freeze({
      responseMode: "line",
      systemPrompt: v1Contract.eyebrow.system,
      userPrompt: buildEyebrowUserPrompt(surface, v1Contract),
    });
  },
  fromRealCandidate(raw, input) {
    const eyebrow = sanitizeEyebrow(
      typeof raw === "string" ? raw : null,
      input.stage.displayName,
    );
    return {
      eyebrow: containsResonanceEcho(eyebrow, input.resonanceBrief)
        ? NEUTRAL_EYEBROW
        : eyebrow,
      prefaceLines: DEFAULT_PREFACE_LINES,
    };
  },
  fromStub(input) {
    return {
      eyebrow: curatedEyebrow(input.stage.figureKey, input.stage.stageId),
      prefaceLines: DEFAULT_PREFACE_LINES,
    };
  },
});

const V2_POLICY: OpeningCopyPolicy = Object.freeze({
  storyPromptVersion: STORY_PROMPT_VERSION_V2,
  providerPrompts(surface) {
    const request = buildPrefacePlanRequest(surface);
    return Object.freeze({
      responseMode: "json_object",
      systemPrompt: v2PersonalizedPrefaceContract.system,
      userPrompt: buildPrefacePlanUserPrompt(request, v2Contract),
    });
  },
  fromRealCandidate(raw, input) {
    const request = buildPrefacePlanRequest(
      toProviderSurfaceFromInput(input),
    );
    const validation = validatePrefacePlanCandidate(raw, request);
    if (!validation.valid) return fallbackOpeningCopy();

    return (
      renderPersonalizedOpeningCopy(
        validation.plan,
        input.resonanceBrief,
      ) ?? fallbackOpeningCopy()
    );
  },
  fromStub(input) {
    const request = buildPrefacePlanRequest(
      toProviderSurfaceFromInput(input),
    );
    const plan = firstCompatiblePrefacePlan(request);
    return (
      renderPersonalizedOpeningCopy(plan, input.resonanceBrief) ??
      fallbackOpeningCopy()
    );
  },
});

export const SUPPORTED_OPENING_COPY_POLICIES: readonly OpeningCopyPolicy[] =
  Object.freeze([V1_POLICY, V2_POLICY]);

export function openingCopyPolicyForStoryPromptVersion(
  storyPromptVersion: string,
): OpeningCopyPolicy {
  const policy = SUPPORTED_OPENING_COPY_POLICIES.find(
    (candidate) => candidate.storyPromptVersion === storyPromptVersion,
  );
  if (!policy) throw new OpeningCopyPolicyError();
  return policy;
}

export function isOpeningCopyPolicySupported(
  storyPromptVersion: string,
): boolean {
  return SUPPORTED_OPENING_COPY_POLICIES.some(
    (policy) => policy.storyPromptVersion === storyPromptVersion,
  );
}

function toProviderSurfaceFromInput(
  input: OpeningCopyInput,
): EyebrowProviderSurface {
  return toEyebrowProviderSurface(toEyebrowSurface(input));
}

function fallbackOpeningCopy(): OpeningCopy {
  return {
    eyebrow: NEUTRAL_EYEBROW,
    prefaceLines: DEFAULT_PREFACE_LINES,
  };
}
