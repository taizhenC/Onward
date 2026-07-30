import "./_smoke-bootstrap";
import { FIGURE_STAGES } from "../lib/figures-data";
import {
  buildDraftStorySpec,
  parseStorySpecDocument,
  storySpecContainsDisclosure,
  validateStorySpec,
} from "../lib/story-spec";
import type { StorySpec } from "../lib/story-spec-types";

const syntheticDisclosure =
  "I feel unusually marooned after a private problem nobody in this biography could possibly know.";

function main(): void {
  const specs = FIGURE_STAGES.map(buildDraftStorySpec);
  const ids = new Set<string>();
  const failures: string[] = [];

  for (const spec of specs) {
    const label = `${spec.figureKey}/${spec.stageId}`;
    if (ids.has(spec.storySpecId)) failures.push(`${label}: duplicate storySpecId`);
    ids.add(spec.storySpecId);

    const draft = validateStorySpec(spec, { forPublish: false });
    if (!draft.valid) failures.push(`${label}: invalid draft: ${draft.errors.join("; ")}`);

    const attemptedPublish = validateStorySpec(
      { ...spec, status: "published" },
      { forPublish: true },
    );
    if (attemptedPublish.valid) {
      failures.push(`${label}: unreviewed broad-source draft passed publish validation`);
    }
    if (!attemptedPublish.errors.some((error) => error.includes("source locator"))) {
      failures.push(`${label}: publish gate did not identify broad evidence mapping`);
    }
    if (!attemptedPublish.errors.some((error) => error.includes("approvals are required"))) {
      failures.push(`${label}: publish gate did not identify missing human review`);
    }
    if (storySpecContainsDisclosure(spec, syntheticDisclosure)) {
      failures.push(`${label}: canonical arc overlaps the synthetic disclosure`);
    }
  }

  const fixture = specs[0];
  checkDocumentBoundary(fixture, failures);

  // Editors narrow evidence claim by claim — the builders must give every
  // fact and quote its own sourceRefs array, never one shared reference.
  if (
    fixture.facts.length >= 2 &&
    fixture.facts[0].sourceRefs === fixture.facts[1].sourceRefs
  ) {
    failures.push("fact atoms share one mutable sourceRefs array");
  }
  if (
    fixture.quotes.length >= 2 &&
    fixture.quotes[0].sourceRefs === fixture.quotes[1].sourceRefs
  ) {
    failures.push("quote records share one mutable sourceRefs array");
  }

  expectRejected(
    failures,
    "missing evidence",
    mutate(fixture, (spec) => {
      spec.facts[0].sourceRefs = [];
    }),
    false,
    "source reference",
  );
  expectRejected(
    failures,
    "unresolved entity",
    mutate(fixture, (spec) => {
      spec.arc[0].entityIds.push("entity-not-reviewed");
    }),
    false,
    "unknown entity",
  );
  expectRejected(
    failures,
    "unsupported quote",
    publishShape(
      mutate(fixture, (spec) => {
        spec.arc[0].canonicalText += ' "This sentence was never documented."';
      }),
    ),
    true,
    "unsupported direct quote",
  );
  expectRejected(
    failures,
    "impossible chronology",
    mutate(fixture, (spec) => {
      spec.facts[1].eventOrder = 0;
    }),
    false,
    "eventOrder must be a positive integer",
  );
  expectRejected(
    failures,
    "exact source without locator",
    publishShape(
      mutate(fixture, (spec) => {
        spec.facts[0].sourceRefs = spec.facts[0].sourceRefs.map((ref) => ({
          ...ref,
          scope: "exact",
          locator: undefined,
        }));
      }),
    ),
    true,
    "source reference needs a locator",
  );
  expectRejected(
    failures,
    "missing sentence evidence",
    publishShape(fixture),
    true,
    "sentence-level evidence",
  );
  const primaryFactId = fixture.facts[0].factId;
  const secondaryFactId = fixture.facts[1].factId;
  expectRejected(
    failures,
    "mapped disallowed interpretation",
    evidenceMappingSpec(fixture, {
      declaredFactIds: [primaryFactId],
      mappedFactIds: [primaryFactId],
      interpretation: {
        interpretationId: "interpretation-blocked",
        statement: "An editorial interpretation that is explicitly blocked.",
        supportingFactIds: [primaryFactId],
        allowed: false,
      },
    }),
    true,
    "disallowed interpretation",
  );
  expectRejected(
    failures,
    "undeclared interpretation support",
    evidenceMappingSpec(fixture, {
      declaredFactIds: [primaryFactId],
      mappedFactIds: [primaryFactId],
      interpretation: {
        interpretationId: "interpretation-unsupported-here",
        statement: "An allowed interpretation supported by a different fact.",
        supportingFactIds: [secondaryFactId],
        allowed: true,
      },
    }),
    true,
    `sentence evidence uses undeclared fact ${secondaryFactId}`,
  );
  expectRejected(
    failures,
    "undeclared sentence fact",
    evidenceMappingSpec(fixture, {
      declaredFactIds: [primaryFactId],
      mappedFactIds: [secondaryFactId],
    }),
    true,
    `sentence evidence uses undeclared fact ${secondaryFactId}`,
  );
  expectRejected(
    failures,
    "decorative optional fact",
    evidenceMappingSpec(fixture, {
      declaredFactIds: [primaryFactId],
      optionalFactIds: [secondaryFactId],
      mappedFactIds: [primaryFactId],
    }),
    true,
    `declares fact ${secondaryFactId} without sentence evidence`,
  );
  expectRejected(
    failures,
    "required optional overlap",
    evidenceMappingSpec(fixture, {
      declaredFactIds: [primaryFactId],
      optionalFactIds: [primaryFactId],
      mappedFactIds: [primaryFactId],
    }),
    true,
    "required and optional facts must be disjoint",
  );
  expectRejected(
    failures,
    "duplicate interpretation identity",
    publishShape(
      mutate(fixture, (spec) => {
        const duplicate = {
          interpretationId: "interpretation-duplicate",
          statement: "A duplicate editorial identity.",
          supportingFactIds: [primaryFactId],
          allowed: true,
        };
        spec.interpretations.push(duplicate, structuredClone(duplicate));
      }),
    ),
    true,
    "interpretation IDs must be unique",
  );

  expectEvidenceClosureAccepted(
    failures,
    "interpretation-only sentence",
    evidenceMappingSpec(fixture, {
      declaredFactIds: [primaryFactId],
      mappedFactIds: [],
      interpretation: {
        interpretationId: "interpretation-grounded",
        statement: "A grounded interpretation without a redundant direct link.",
        supportingFactIds: [primaryFactId],
        allowed: true,
      },
    }),
  );
  expectEvidenceClosureAccepted(
    failures,
    "unreferenced blocked interpretation",
    publishShape(
      mutate(fixture, (spec) => {
        spec.interpretations.push({
          interpretationId: "interpretation-unreferenced",
          statement: "A retained editorial decision that prose cannot use.",
          supportingFactIds: [],
          allowed: false,
        });
      }),
    ),
  );
  expectRejected(
    failures,
    "invalid content profile",
    mutate(fixture, (spec) => {
      (spec.contentProfile as { intensity: string }).intensity = "extreme";
    }),
    false,
    "content profile intensity",
  );

  console.log("Onward StorySpec validator");
  console.log("==========================");
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`${failures.length} StorySpec contract failure(s).`);
    process.exit(1);
  }

  console.log(`PASS ${specs.length}/${specs.length} structurally valid draft specs`);
  console.log(`PASS ${specs.length}/${specs.length} unreviewed publish attempts rejected`);
  console.log(
    "PASS negative gates: evidence closure, entity, quote, chronology, locator, and sentence mapping",
  );
  console.log("PASS untrusted documents require exact nested StorySpec shapes");
  console.log("PASS immutable publication is delegated to migration 0004 lifecycle gates");
}

function checkDocumentBoundary(spec: StorySpec, failures: string[]): void {
  const jsonRoundTrip = JSON.parse(JSON.stringify(spec)) as unknown;
  if (parseStorySpecDocument(jsonRoundTrip) === null) {
    failures.push("exact parser rejected a generated draft StorySpec");
  }

  const extraTopLevel = { ...structuredClone(spec), unexpected: true };
  expectDocumentRejected(failures, "extra top-level field", extraTopLevel);

  const extraEpisode = structuredClone(spec);
  (
    extraEpisode.episode as StorySpec["episode"] & {
      unexpected?: boolean;
    }
  ).unexpected = true;
  expectDocumentRejected(failures, "extra episode field", extraEpisode);

  const extraFact = structuredClone(spec);
  (
    extraFact.facts[0] as StorySpec["facts"][number] & {
      unexpected?: boolean;
    }
  ).unexpected = true;
  expectDocumentRejected(failures, "extra fact field", extraFact);

  const invalidEnum = structuredClone(spec);
  (
    invalidEnum.contentProfile as unknown as {
      intensity: string;
    }
  ).intensity = "extreme";
  expectDocumentRejected(failures, "unknown content intensity", invalidEnum);

  const malformedArray = structuredClone(spec);
  malformedArray.facts = [null] as unknown as StorySpec["facts"];
  expectDocumentRejected(failures, "malformed fact member", malformedArray);

  const invalidOptional = structuredClone(spec);
  (
    invalidOptional.sources[0] as StorySpec["sources"][number] & {
      locator?: string | undefined;
    }
  ).locator = undefined;
  expectDocumentRejected(failures, "present undefined optional field", invalidOptional);
}

function mutate(source: StorySpec, change: (copy: StorySpec) => void): StorySpec {
  const copy = structuredClone(source);
  change(copy);
  return copy;
}

function publishShape(spec: StorySpec): StorySpec {
  return { ...spec, status: "published" };
}

function evidenceMappingSpec(
  source: StorySpec,
  input: Readonly<{
    declaredFactIds: string[];
    optionalFactIds?: string[];
    mappedFactIds: string[];
    interpretation?: StorySpec["interpretations"][number];
  }>,
): StorySpec {
  return publishShape(
    mutate(source, (spec) => {
      const beat = spec.arc[0];
      beat.requiredFactIds = [...input.declaredFactIds];
      beat.optionalFactIds = [...(input.optionalFactIds ?? [])];
      beat.sentenceEvidence = [
        {
          sentenceIndex: 0,
          factIds: [...input.mappedFactIds],
          interpretationIds: input.interpretation
            ? [input.interpretation.interpretationId]
            : [],
        },
      ];
      if (input.interpretation) {
        spec.interpretations.push(structuredClone(input.interpretation));
      }
    }),
  );
}

function expectRejected(
  failures: string[],
  name: string,
  spec: StorySpec,
  forPublish: boolean,
  expectedError: string,
): void {
  const result = validateStorySpec(spec, { forPublish });
  if (result.valid || !result.errors.some((error) => error.includes(expectedError))) {
    failures.push(`${name}: expected rejection containing "${expectedError}"`);
  }
}

function expectDocumentRejected(
  failures: string[],
  name: string,
  value: unknown,
): void {
  if (parseStorySpecDocument(value) !== null) {
    failures.push(`${name}: exact parser accepted malformed StorySpec JSON`);
  }
}

function expectEvidenceClosureAccepted(
  failures: string[],
  name: string,
  spec: StorySpec,
): void {
  const closureErrors = validateStorySpec(spec, { forPublish: true }).errors.filter(
    (error) =>
      /interpretation IDs must be unique|disallowed interpretation|mapped interpretation|sentence evidence uses undeclared fact|without sentence evidence|required and optional facts must be disjoint/.test(
        error,
      ),
  );
  if (closureErrors.length > 0) {
    failures.push(`${name}: valid evidence closure was rejected: ${closureErrors.join("; ")}`);
  }
}

main();
