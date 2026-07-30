import type { SourceRef } from "./story-spec-types";

export const STORY_TRANSPARENCY_LIMITS = Object.freeze({
  sources: 100,
  facts: 500,
  quotes: 100,
  sourceRefs: 100,
  citation: 2_000,
  locator: 500,
  sourceUrl: 2_000,
  factStatement: 4_000,
  quoteText: 4_000,
  quoteSpeaker: 500,
});

const SAFE_PUBLIC_ID = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/;
const REVIEW_DATE =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?Z)?$/;

export function isSafeTransparencyId(value: unknown): value is string {
  return typeof value === "string" && SAFE_PUBLIC_ID.test(value);
}

export function isBoundedTransparencyText(
  value: unknown,
  min: number,
  max: number,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= min &&
    value.length <= max
  );
}

export function isSafeTransparencySourceUrl(
  value: unknown,
): value is string {
  if (
    typeof value !== "string" ||
    value.length > STORY_TRANSPARENCY_LIMITS.sourceUrl ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return false;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function storySourceRefKey(
  ref: Pick<SourceRef, "sourceId" | "scope" | "locator">,
): string {
  return JSON.stringify([ref.sourceId, ref.scope, ref.locator ?? null]);
}

export function hasUniqueStorySourceRefs(
  refs: readonly SourceRef[],
): boolean {
  const keys = refs.map(storySourceRefKey);
  return new Set(keys).size === keys.length;
}

export function isStoryReviewDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = REVIEW_DATE.exec(value);
  if (!match) return false;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = hourText === undefined ? 0 : Number(hourText);
  const minute = minuteText === undefined ? 0 : Number(minuteText);
  const second = secondText === undefined ? 0 : Number(secondText);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return false;
  }
  return !Number.isNaN(Date.parse(value));
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leapYear =
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}
