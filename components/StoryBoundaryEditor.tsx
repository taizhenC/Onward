"use client";

import React, { forwardRef, useId } from "react";

import {
  BOUNDARY_TOPICS,
  STORY_INTENSITIES,
  type StoryBoundaries,
  type StoryIntensity,
} from "@/lib/story-boundaries";
import type { ContentFlag } from "@/lib/story-spec-types";

const INTENSITY_PRESENTATION = {
  gentle: {
    label: "Gentle",
    description: "Keep difficult events at a greater distance.",
  },
  moderate: {
    label: "Balanced",
    description: "Name difficult events without dwelling on them.",
  },
  direct: {
    label: "More direct",
    description: "Still non-graphic, with less distance from hard facts.",
  },
} as const satisfies Record<
  StoryIntensity,
  Readonly<{ label: string; description: string }>
>;

export type StoryBoundaryEditorValue = Readonly<{
  enabled: boolean;
  boundaries: StoryBoundaries;
}>;

export type StoryBoundaryEditorAction =
  | Readonly<{ type: "set_enabled"; enabled: boolean }>
  | Readonly<{ type: "set_intensity"; maxIntensity: StoryIntensity }>
  | Readonly<{ type: "toggle_topic"; flag: ContentFlag }>;

export function updateStoryBoundaryEditorValue(
  value: StoryBoundaryEditorValue,
  action: StoryBoundaryEditorAction,
): StoryBoundaryEditorValue {
  if (action.type === "set_enabled") {
    return {
      enabled: action.enabled,
      boundaries: cloneStoryBoundaries(value.boundaries),
    };
  }
  if (action.type === "set_intensity") {
    return {
      enabled: value.enabled,
      boundaries: {
        maxIntensity: action.maxIntensity,
        excludedFlags: [...value.boundaries.excludedFlags],
      },
    };
  }
  const excludedFlags = value.boundaries.excludedFlags.includes(action.flag)
    ? value.boundaries.excludedFlags.filter(
        (candidate) => candidate !== action.flag,
      )
    : [...value.boundaries.excludedFlags, action.flag];
  return {
    enabled: value.enabled,
    boundaries: {
      maxIntensity: value.boundaries.maxIntensity,
      excludedFlags,
    },
  };
}

export function selectedStoryBoundaries(
  value: StoryBoundaryEditorValue,
): StoryBoundaries | undefined {
  return value.enabled ? cloneStoryBoundaries(value.boundaries) : undefined;
}

function cloneStoryBoundaries(boundaries: StoryBoundaries): StoryBoundaries {
  return {
    maxIntensity: boundaries.maxIntensity,
    excludedFlags: [...boundaries.excludedFlags],
  };
}

type StoryBoundaryEditorProps = Readonly<{
  value: StoryBoundaryEditorValue;
  onChange: (next: StoryBoundaryEditorValue) => void;
  disabled?: boolean;
}>;

export const StoryBoundaryEditor = forwardRef<
  HTMLFieldSetElement,
  StoryBoundaryEditorProps
>(function StoryBoundaryEditor({ value, onChange, disabled = false }, ref) {
  const id = useId();
  const optionsId = `${id}-options`;
  const toggleLabelId = `${id}-toggle-label`;
  const toggleDescriptionId = `${id}-toggle-description`;
  const radioName = `${id}-intensity`;

  return (
    <fieldset
      ref={ref}
      tabIndex={-1}
      disabled={disabled}
      className="space-y-5 border border-[var(--color-ink-soft)]/35 p-5 focus:outline-2 focus:outline-offset-4 focus:outline-[var(--color-accent)]"
    >
      <legend className="px-2 font-ui text-xs font-medium uppercase tracking-widest text-[var(--color-ink-soft)]">
        Keep this story…
      </legend>

      <label htmlFor={`${id}-toggle`} className="flex items-start gap-3">
        <input
          id={`${id}-toggle`}
          type="checkbox"
          checked={value.enabled}
          onChange={(event) =>
            onChange(
              updateStoryBoundaryEditorValue(value, {
                type: "set_enabled",
                enabled: event.target.checked,
              }),
            )
          }
          aria-expanded={value.enabled}
          aria-controls={value.enabled ? optionsId : undefined}
          aria-labelledby={toggleLabelId}
          aria-describedby={toggleDescriptionId}
          className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
        />
        <span>
          <span
            id={toggleLabelId}
            className="block font-ui text-sm font-medium"
          >
            Set limits for this story
          </span>
          <span
            id={toggleDescriptionId}
            className="mt-1 block text-sm leading-relaxed text-[var(--color-ink-soft)]"
          >
            Optional. These limits are used only to choose this story and are
            not added to it.
          </span>
        </span>
      </label>

      {value.enabled ? (
        <div
          id={optionsId}
          className="space-y-6 border-t border-[var(--color-ink-soft)]/20 pt-5"
        >
          <fieldset className="space-y-3">
            <legend className="font-ui text-sm font-medium">
              Level of detail
            </legend>
            {STORY_INTENSITIES.map((intensity) => {
              const presentation = INTENSITY_PRESENTATION[intensity];
              const inputId = `${id}-intensity-${intensity}`;
              const labelId = `${inputId}-label`;
              const descriptionId = `${inputId}-description`;
              return (
                <label
                  key={intensity}
                  htmlFor={inputId}
                  className="flex items-start gap-3"
                >
                  <input
                    id={inputId}
                    type="radio"
                    name={radioName}
                    value={intensity}
                    checked={value.boundaries.maxIntensity === intensity}
                    onChange={() =>
                      onChange(
                        updateStoryBoundaryEditorValue(value, {
                          type: "set_intensity",
                          maxIntensity: intensity,
                        }),
                      )
                    }
                    aria-labelledby={labelId}
                    aria-describedby={descriptionId}
                    className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                  />
                  <span>
                    <span
                      id={labelId}
                      className="block font-ui text-sm font-medium"
                    >
                      {presentation.label}
                    </span>
                    <span
                      id={descriptionId}
                      className="block text-sm text-[var(--color-ink-soft)]"
                    >
                      {presentation.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="font-ui text-sm font-medium">
              Topics to leave out
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {BOUNDARY_TOPICS.map((topic) => {
                const inputId = `${id}-topic-${topic.flag}`;
                const labelId = `${inputId}-label`;
                const descriptionId = `${inputId}-description`;
                return (
                  <label
                    key={topic.flag}
                    htmlFor={inputId}
                    className="flex items-start gap-3"
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={value.boundaries.excludedFlags.includes(
                        topic.flag,
                      )}
                      onChange={() =>
                        onChange(
                          updateStoryBoundaryEditorValue(value, {
                            type: "toggle_topic",
                            flag: topic.flag,
                          }),
                        )
                      }
                      aria-labelledby={labelId}
                      aria-describedby={descriptionId}
                      className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                    />
                    <span>
                      <span
                        id={labelId}
                        className="block font-ui text-sm font-medium"
                      >
                        {topic.label}
                      </span>
                      <span
                        id={descriptionId}
                        className="block text-xs leading-relaxed text-[var(--color-ink-soft)]"
                      >
                        {topic.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
      ) : null}
    </fieldset>
  );
});

StoryBoundaryEditor.displayName = "StoryBoundaryEditor";
