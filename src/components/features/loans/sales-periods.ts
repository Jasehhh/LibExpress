import { startOfDay } from "~/lib/time";

export const PERIODS = [
  { key: "today", label: "Today", days: 1 },
  { key: "week", label: "7 days", days: 7 },
  { key: "month", label: "30 days", days: 30 },
  { key: "all", label: "All time", days: null },
] as const;

export type Period = (typeof PERIODS)[number]["key"];

export const DEFAULT_PERIOD: Period = "month";

export const periodStart = (period: Period, now = new Date()) => {
  const days = PERIODS.find((p) => p.key === period)!.days;
  return days ? startOfDay(now, 1 - days) : undefined;
};
