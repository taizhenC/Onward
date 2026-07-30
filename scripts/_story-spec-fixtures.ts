import {
  STORY_SPEC_SCHEMA_VERSION,
  type StoryBeatSpec,
  type StorySpec,
} from "../lib/story-spec-types";
import type { FigureStageRow } from "../lib/types";

export function buildPublishedStorySpecFixture(
  stage: FigureStageRow,
): StorySpec {
  const roles: StoryBeatSpec["role"][] = [
    "scene",
    "dark_moment",
    "response",
    "struggle",
    "turning_point",
    "became",
    "bridge",
  ];
  const texts = [
    "In 2001, the subject began a documented project.",
    "The first attempt ended in 2002.",
    'The record preserves the words "We began again."',
    "Work continued for three years, which the archive describes as a deliberate return.",
    "In 2005, a second route opened, though one account disputes its timing.",
    "The project was published in 2006.",
    "A life can remain distinct and still offer company.",
  ];
  const factIds = [
    "fact-1",
    "fact-2",
    "fact-3",
    "fact-4",
    "fact-5",
    "fact-6",
  ];
  const arc: StoryBeatSpec[] = roles.map((role, index) => {
    const isBridge = role === "bridge";
    const factId = isBridge ? undefined : factIds[index];
    const quoteIds =
      role === "response"
        ? ["quote-verbatim"]
        : role === "struggle"
          ? ["quote-paraphrase"]
          : role === "turning_point"
            ? ["quote-disputed"]
            : [];

    return {
      role,
      canonicalText: texts[index],
      requiredFactIds: factId ? [factId] : [],
      optionalFactIds: [],
      entityIds: ["entity-subject"],
      quoteIds,
      sentenceEvidence: factId
        ? [
            {
              sentenceIndex: 0,
              factIds: [factId],
              interpretationIds:
                role === "struggle" ? ["interpretation-return"] : [],
            },
          ]
        : [],
      personalizationZones: isBridge
        ? ["reader_bridge"]
        : role === "scene" || role === "became"
          ? ["none"]
          : ["emphasis", "transition"],
    };
  });

  return {
    storySpecId: `${stage.figureKey}:${stage.stageId}:published-test-v1`,
    schemaVersion: STORY_SPEC_SCHEMA_VERSION,
    figureKey: stage.figureKey,
    stageId: stage.stageId,
    version: 1,
    status: "published",
    episode: {
      ageMin: stage.ageMin,
      ageMax: stage.ageMax,
      startDate: "2001-01-01",
      endDate: "2006-12-31",
      throughLine:
        "A documented project was restarted after an early failure.",
    },
    contentProfile: {
      intensity: "gentle",
      flags: [],
      contentNote: "Includes a professional setback.",
    },
    sources: [
      {
        sourceId: "source-archive",
        citation: "Example Archive. Project papers, 2001-2006.",
        locator: "Collection 4",
        url: "https://example.org/archive/project-papers",
      },
      {
        sourceId: "source-history",
        citation: "Historian, A. A History of the Project (2020).",
        locator: "Chapter 3",
        url: "https://example.org/history/project",
      },
    ],
    facts: factIds.map((factId, index) => ({
      factId,
      statement: texts[index],
      sourceRefs: [
        {
          sourceId: index < 3 ? "source-archive" : "source-history",
          locator:
            index < 3 ? `Folder ${index + 1}` : `pp. ${40 + index}`,
          scope: "exact",
        },
      ],
      eventOrder: index + 1,
      confidence: index === 4 ? "disputed" : "documented",
      claimKind: index === 3 ? "context" : "event",
    })),
    entities: [
      {
        entityId: "entity-subject",
        kind: "person",
        value: stage.displayName,
        aliases: ["the subject"],
      },
    ],
    quotes: [
      {
        quoteId: "quote-verbatim",
        text: "We began again.",
        status: "verbatim",
        speaker: "Project record",
        sourceRefs: [
          {
            sourceId: "source-archive",
            locator: "Folder 3, leaf 2",
            scope: "exact",
          },
        ],
      },
      {
        quoteId: "quote-paraphrase",
        text: "The work was a deliberate return.",
        status: "paraphrase",
        sourceRefs: [
          {
            sourceId: "source-history",
            locator: "p. 43",
            scope: "bounded",
          },
        ],
      },
      {
        quoteId: "quote-disputed",
        text: "The second route opened in 2005.",
        status: "disputed",
        sourceRefs: [
          {
            sourceId: "source-history",
            locator: "pp. 44-45",
            scope: "bounded",
          },
        ],
      },
    ],
    arc,
    interpretations: [
      {
        interpretationId: "interpretation-return",
        statement:
          "The continuation can be read as a deliberate return.",
        supportingFactIds: ["fact-4"],
        allowed: true,
      },
    ],
    dramatizationLimits: [
      "No invented dialogue or interior monologue.",
    ],
    avoidRules: ["Do not add unsupported historical claims."],
    review: {
      researcherId: "researcher-test",
      historicalReviewerId: "historian-test",
      toneReviewerId: "tone-test",
      reviewedAt: "2026-07-02T12:00:00.000Z",
      contentProfileReviewed: true,
    },
  };
}
