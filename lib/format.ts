import { parseISODate, WEEKDAY_LONG, type Direction, type WeekdayIndex } from "@/lib/analysis";

export function formatRate(value: number): string {
  return value.toLocaleString("en-GB", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export function formatDelta(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return prefix + formatRate(value);
}

export function formatShare(share: number): string {
  return share.toLocaleString("en-GB", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatLevelPercent(fraction: number): string {
  const prefix = fraction > 0 ? "+" : "";
  return (
    prefix +
    fraction.toLocaleString("en-GB", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatLongDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatShortDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatWeekday(index: WeekdayIndex, length: "short" | "long" = "long"): string {
  return length === "long" ? WEEKDAY_LONG[index] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index];
}

export function countPhrase(hits: number, n: number): string {
  return `${hits} of ${n}`;
}

export function directionWord(direction: Direction, tense: "past" | "adjective" = "past"): string {
  if (tense === "adjective") {
    if (direction === "up") return "higher";
    if (direction === "down") return "lower";
    return "unchanged";
  }
  if (direction === "up") return "rose";
  if (direction === "down") return "fell";
  return "was unchanged";
}
