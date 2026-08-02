import "server-only";
import {
  DEFAULT_PREFACE_LINES,
  NEUTRAL_EYEBROW,
  curatedEyebrow,
  sanitizeEyebrow,
  type EyebrowProviderSurface,
  type OpeningCopyInput,
} from "./opening-copy";
import {
  STORY_PROMPT_VERSION_V1,
  storyPromptContractFor,
} from "./llm-recipe-constants";
import { buildEyebrowUserPrompt } from "./llm-prompts";
import { containsResonanceEcho } from "./resonance-brief";
import type { OpeningCopy } from "./types";

export type OpeningCopyPolicy = Readonly<{
  storyPromptVersion: string;
  providerPrompts(
    surface: EyebrowProviderSurface,
  ): Readonly<{ systemPrompt: string; userPrompt: string }>;
  fromRealCandidate(
    raw: string | null,
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

const V1_POLICY: OpeningCopyPolicy = Object.freeze({
  storyPromptVersion: STORY_PROMPT_VERSION_V1,
  providerPrompts(surface) {
    return Object.freeze({
      systemPrompt: v1Contract.eyebrow.system,
      userPrompt: buildEyebrowUserPrompt(surface, v1Contract),
    });
  },
  fromRealCandidate(raw, input) {
    const eyebrow = sanitizeEyebrow(raw, input.stage.displayName);
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

export const SUPPORTED_OPENING_COPY_POLICIES: readonly OpeningCopyPolicy[] =
  Object.freeze([V1_POLICY]);

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
