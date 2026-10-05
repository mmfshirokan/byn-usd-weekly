export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEKDAY_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Direction = "up" | "down" | "flat";

export type RatePoint = {
  date: string;
  rate: number;
};

export const DIRECTION_THRESHOLD = 0.7;

export type WeekDay = {
  date: string;
  rate: number;
};

export type WeekObservation = {
  isoYear: number;
  isoWeek: number;
  label: string;
  days: Partial<Record<WeekdayIndex, WeekDay>>;
  complete: boolean;
};

export type PairWeek = {
  label: string;
  fromDate: string;
  toDate: string;
  fromRate: number;
  toRate: number;
  delta: number;
};

export type PairStat = {
  from: WeekdayIndex;
  to: WeekdayIndex;
  n: number;
  up: number;
  down: number;
  flat: number;
  upShare: number;
  downShare: number;
  flatShare: number;
  meanDelta: number | null;
  medianDelta: number | null;
  weeks: PairWeek[];
  signal: Direction | null;
  dominant: Direction;
  dominantShare: number;
  dominantHits: number;
};

export type WowRow = {
  prevDate: string;
  date: string;
  prevRate: number;
  rate: number;
  delta: number;
};

export type WowStat = {
  weekday: WeekdayIndex;
  n: number;
  up: number;
  down: number;
  flat: number;
  upShare: number;
  downShare: number;
  flatShare: number;
  meanDelta: number | null;
  medianDelta: number | null;
  rows: WowRow[];
  signal: Direction | null;
  dominant: Direction;
  dominantShare: number;
  dominantHits: number;
};

export type StepStats = {
  n: number;
  up: number;
  down: number;
  flat: number;
  upShare: number;
  mean: number | null;
  median: number | null;
};

export type WeekdayBias = {
  weekday: WeekdayIndex;
  n: number;
  above: number;
  below: number;
  aboveShare: number;
  belowShare: number;
  meanResidual: number | null;
  signal: Direction | null;
};

export type Analysis = {
  points: RatePoint[];
  start: string;
  end: string;
  startRate: number;
  endRate: number;
  levelDelta: number;
  levelPercent: number;
  dayCount: number;
  gapCount: number;
  minRate: number;
  minDate: string;
  maxRate: number;
  maxDate: string;
  allSteps: StepStats;
  businessSteps: StepStats;
  weekendSteps: StepStats;
  weeks: WeekObservation[];
  fullWeekCount: number;
  pairs: PairStat[];
  wow: WowStat[];
  bias: WeekdayBias[];
  weekendCopiesFriday: { weeks: number; copies: number };
  threshold: number;
};

export function parseISODate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`Invalid date: ${iso}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date: ${iso}`);
  }
  return date;
}

export function formatISODate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function utcToday(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function shiftMonths(iso: string, months: number): string {
  const date = parseISODate(iso);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return formatISODate(date);
}

export function daysBetween(earlier: string, later: string): number {
  return Math.round((parseISODate(later).getTime() - parseISODate(earlier).getTime()) / 86_400_000);
}

export function weekdayIndex(iso: string): WeekdayIndex {
  const day = parseISODate(iso).getUTCDay();
  return ((day + 6) % 7) as WeekdayIndex;
}

export function isoWeekParts(iso: string): { year: number; week: number } {
  const date = parseISODate(iso);
  const day = date.getUTCDay() || 7;
  const thursday = new Date(date.getTime());
  thursday.setUTCDate(thursday.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { year: thursday.getUTCFullYear(), week };
}

export function weekLabel(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function share(hits: number, n: number): number {
  return n === 0 ? 0 : hits / n;
}

export function hitsNeeded(n: number, threshold = DIRECTION_THRESHOLD): number {
  if (n <= 0) return 0;
  return Math.ceil(threshold * n - 1e-12);
}

function signalFor(upShare: number, downShare: number, flatShare: number, threshold: number): Direction | null {
  const candidates: { direction: Direction; value: number }[] = [
    { direction: "up", value: upShare },
    { direction: "down", value: downShare },
    { direction: "flat", value: flatShare },
  ];
  const ranked = candidates.filter((item) => item.value >= threshold);
  ranked.sort((a, b) => b.value - a.value);
  return ranked[0]?.direction ?? null;
}

function dominantDirection(up: number, down: number, flat: number): Direction {
  if (flat >= up && flat >= down) return "flat";
  if (down > up) return "down";
  return "up";
}

function summarizeCounts(up: number, down: number, flat: number, threshold: number) {
  const n = up + down + flat;
  const upShare = share(up, n);
  const downShare = share(down, n);
  const flatShare = share(flat, n);
  const dominant = dominantDirection(up, down, flat);
  const dominantHits = dominant === "up" ? up : dominant === "down" ? down : flat;
  return {
    n,
    up,
    down,
    flat,
    upShare,
    downShare,
    flatShare,
    dominant,
    dominantHits,
    dominantShare: share(dominantHits, n),
    signal: signalFor(upShare, downShare, flatShare, threshold),
  };
}

function stepStats(deltas: number[]): StepStats {
  const up = deltas.filter((delta) => delta > 0).length;
  const down = deltas.filter((delta) => delta < 0).length;
  const flat = deltas.filter((delta) => delta === 0).length;
  return {
    n: deltas.length,
    up,
    down,
    flat,
    upShare: share(up, deltas.length),
    mean: mean(deltas),
    median: median(deltas),
  };
}

function dedupeSorted(points: RatePoint[]): RatePoint[] {
  const byDate = new Map<string, number>();
  for (const point of points) {
    if (!Number.isFinite(point.rate)) throw new Error(`Non-finite rate on ${point.date}`);
    parseISODate(point.date);
    byDate.set(point.date, point.rate);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rate]) => ({ date, rate }));
}

export function analyze(input: RatePoint[], threshold = DIRECTION_THRESHOLD): Analysis {
  const points = dedupeSorted(input);
  if (points.length === 0) throw new Error("No exchange rates to analyze");

  let gapCount = 0;
  const allDeltas: number[] = [];
  const businessDeltas: number[] = [];
  const weekendDeltas: number[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const gap = daysBetween(points[index - 1].date, points[index].date);
    if (gap > 1) gapCount += gap - 1;
    const delta = points[index].rate - points[index - 1].rate;
    allDeltas.push(delta);
    if (weekdayIndex(points[index].date) >= 5) weekendDeltas.push(delta);
    else businessDeltas.push(delta);
  }

  const weeksMap = new Map<string, WeekObservation>();
  for (const point of points) {
    const { year, week } = isoWeekParts(point.date);
    const label = weekLabel(year, week);
    const weekObservation = weeksMap.get(label) ?? {
      isoYear: year,
      isoWeek: week,
      label,
      days: {},
      complete: false,
    };
    weekObservation.days[weekdayIndex(point.date)] = { date: point.date, rate: point.rate };
    weeksMap.set(label, weekObservation);
  }
  const weeks = [...weeksMap.values()].sort((a, b) => a.label.localeCompare(b.label));
  for (const week of weeks) {
    week.complete = WEEKDAYS.every((_, index) => week.days[index as WeekdayIndex] !== undefined);
  }

  const pairs: PairStat[] = [];
  for (let from = 0; from < 7; from += 1) {
    for (let to = from + 1; to < 7; to += 1) {
      const pairWeeks: PairWeek[] = [];
      for (const week of weeks) {
        const earlier = week.days[from as WeekdayIndex];
        const later = week.days[to as WeekdayIndex];
        if (!earlier || !later) continue;
        pairWeeks.push({
          label: week.label,
          fromDate: earlier.date,
          toDate: later.date,
          fromRate: earlier.rate,
          toRate: later.rate,
          delta: later.rate - earlier.rate,
        });
      }
      const counts = summarizeCounts(
        pairWeeks.filter((week) => week.delta > 0).length,
        pairWeeks.filter((week) => week.delta < 0).length,
        pairWeeks.filter((week) => week.delta === 0).length,
        threshold,
      );
      const deltas = pairWeeks.map((week) => week.delta);
      pairs.push({
        from: from as WeekdayIndex,
        to: to as WeekdayIndex,
        ...counts,
        meanDelta: mean(deltas),
        medianDelta: median(deltas),
        weeks: pairWeeks,
      });
    }
  }

  const wow: WowStat[] = [];
  for (let weekday = 0; weekday < 7; weekday += 1) {
    const sameDay = points.filter((point) => weekdayIndex(point.date) === weekday);
    const rows: WowRow[] = [];
    for (let index = 1; index < sameDay.length; index += 1) {
      if (daysBetween(sameDay[index - 1].date, sameDay[index].date) !== 7) continue;
      rows.push({
        prevDate: sameDay[index - 1].date,
        date: sameDay[index].date,
        prevRate: sameDay[index - 1].rate,
        rate: sameDay[index].rate,
        delta: sameDay[index].rate - sameDay[index - 1].rate,
      });
    }
    const counts = summarizeCounts(
      rows.filter((row) => row.delta > 0).length,
      rows.filter((row) => row.delta < 0).length,
      rows.filter((row) => row.delta === 0).length,
      threshold,
    );
    const deltas = rows.map((row) => row.delta);
    wow.push({
      weekday: weekday as WeekdayIndex,
      ...counts,
      meanDelta: mean(deltas),
      medianDelta: median(deltas),
      rows,
    });
  }

  const fullWeeks = weeks.filter((week) => week.complete);
  const bias: WeekdayBias[] = [];
  for (let weekday = 0; weekday < 5; weekday += 1) {
    const residuals: number[] = [];
    let above = 0;
    let below = 0;
    for (const week of fullWeeks) {
      const levels = [0, 1, 2, 3, 4].map((index) => week.days[index as WeekdayIndex]!.rate);
      const weekMean = mean(levels)!;
      const residual = week.days[weekday as WeekdayIndex]!.rate - weekMean;
      residuals.push(residual);
      if (residual > 0) above += 1;
      else if (residual < 0) below += 1;
    }
    const flat = fullWeeks.length - above - below;
    const counts = summarizeCounts(above, below, flat, threshold);
    bias.push({
      weekday: weekday as WeekdayIndex,
      n: counts.n,
      above,
      below,
      aboveShare: counts.upShare,
      belowShare: counts.downShare,
      meanResidual: mean(residuals),
      signal: counts.signal === "flat" ? null : counts.signal,
    });
  }

  let minRate = points[0].rate;
  let minDate = points[0].date;
  let maxRate = points[0].rate;
  let maxDate = points[0].date;
  for (const point of points) {
    if (point.rate < minRate) {
      minRate = point.rate;
      minDate = point.date;
    }
    if (point.rate > maxRate) {
      maxRate = point.rate;
      maxDate = point.date;
    }
  }

  const weekendCopies = fullWeeks.filter((week) => {
    const friday = week.days[4]!.rate;
    return week.days[5]!.rate === friday && week.days[6]!.rate === friday;
  }).length;

  const startRate = points[0].rate;
  const endRate = points[points.length - 1].rate;

  return {
    points,
    start: points[0].date,
    end: points[points.length - 1].date,
    startRate,
    endRate,
    levelDelta: endRate - startRate,
    levelPercent: startRate === 0 ? 0 : endRate / startRate - 1,
    dayCount: points.length,
    gapCount,
    minRate,
    minDate,
    maxRate,
    maxDate,
    allSteps: stepStats(allDeltas),
    businessSteps: stepStats(businessDeltas),
    weekendSteps: stepStats(weekendDeltas),
    weeks,
    fullWeekCount: fullWeeks.length,
    pairs,
    wow,
    bias,
    weekendCopiesFriday: { weeks: fullWeeks.length, copies: weekendCopies },
    threshold,
  };
}

export function pairKey(from: WeekdayIndex, to: WeekdayIndex): string {
  return `${from}-${to}`;
}

export function findPair(analysis: Analysis, from: WeekdayIndex, to: WeekdayIndex): PairStat {
  const pair = analysis.pairs.find((item) => item.from === from && item.to === to);
  if (!pair) throw new Error(`Missing pair ${from}→${to}`);
  return pair;
}
