import "server-only";
import { randomBytes } from "node:crypto";
import type { HistoricalConcernReason } from "./story-transparency-types";

export type HistoricalConcernQueueItem = {
  reportId: string;
  storySpecId: string;
  storySpecVersion: number;
  figureKey: string;
  stageId: string;
  factId: string;
  reason: HistoricalConcernReason;
  status: "open";
  reportCount: number;
  firstReportedAt: string;
  lastReportedAt: string;
};

export type SafeHistoricalConcern = Pick<
  HistoricalConcernQueueItem,
  | "storySpecId"
  | "storySpecVersion"
  | "figureKey"
  | "stageId"
  | "factId"
  | "reason"
>;

declare global {
  var __onwardHistoricalConcernReports:
    | Map<string, HistoricalConcernQueueItem>
    | undefined;
}

const reports =
  globalThis.__onwardHistoricalConcernReports ??
  (globalThis.__onwardHistoricalConcernReports = new Map());

export async function submitMemoryHistoricalConcern(
  input: SafeHistoricalConcern,
): Promise<void> {
  const key = queueKey(input);
  const now = new Date().toISOString();
  const existing = reports.get(key);
  if (existing) {
    reports.set(key, {
      ...existing,
      reportCount: existing.reportCount + 1,
      lastReportedAt: now,
    });
    return;
  }
  reports.set(key, {
    reportId: randomBytes(16).toString("hex"),
    ...input,
    status: "open",
    reportCount: 1,
    firstReportedAt: now,
    lastReportedAt: now,
  });
}

export function listMemoryHistoricalConcerns(): HistoricalConcernQueueItem[] {
  return [...reports.values()].map((report) => structuredClone(report));
}

function queueKey(input: SafeHistoricalConcern): string {
  return [
    input.storySpecId,
    input.storySpecVersion,
    input.factId,
    input.reason,
  ].join(":");
}
