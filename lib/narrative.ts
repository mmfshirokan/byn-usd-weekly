import {
  findPair,
  hitsNeeded,
  WEEKDAY_LONG,
  type Analysis,
  type Direction,
  type PairStat,
  type WowStat,
} from "@/lib/analysis";
import {
  countPhrase,
  formatDelta,
  formatLevelPercent,
  formatLongDate,
  formatRate,
  formatShare,
} from "@/lib/format";

export type Narrative = {
  headline: string;
  lede: string;
  paragraphs: string[];
};

function pairName(pair: PairStat): string {
  return `${WEEKDAY_LONG[pair.from]} to ${WEEKDAY_LONG[pair.to]}`;
}

function describePair(pair: PairStat): string {
  if (pair.n === 0) return `${pairName(pair)} never occurs inside one week in this window.`;
  const needed = hitsNeeded(pair.n, pair.signal ? undefined : 0.7);
  if (pair.signal === "flat") {
    return `${pairName(pair)} was unchanged in ${countPhrase(pair.flat, pair.n)} weeks (${formatShare(pair.flatShare)}).`;
  }
  if (pair.signal === "up" || pair.signal === "down") {
    const hits = pair.signal === "up" ? pair.up : pair.down;
    const verb = pair.signal === "up" ? "higher" : "lower";
    return `${WEEKDAY_LONG[pair.to]} was ${verb} than ${WEEKDAY_LONG[pair.from]} in ${countPhrase(hits, pair.n)} weeks (${formatShare(hits / pair.n)}).`;
  }
  const verb = pair.dominant === "up" ? "higher" : pair.dominant === "down" ? "lower" : "unchanged";
  const hits = pair.dominantHits;
  return `${WEEKDAY_LONG[pair.to]} was ${verb} than ${WEEKDAY_LONG[pair.from]} in ${countPhrase(hits, pair.n)} weeks (${formatShare(pair.dominantShare)}). That is short of ${needed}, the count 70% requires for ${pair.n} weeks.`;
}

function describeWow(stat: WowStat): string {
  const day = WEEKDAY_LONG[stat.weekday];
  if (stat.signal === "up") {
    return `${day} was higher than the previous ${day} in ${countPhrase(stat.up, stat.n)} comparisons (${formatShare(stat.upShare)}).`;
  }
  if (stat.signal === "down") {
    return `${day} was lower than the previous ${day} in ${countPhrase(stat.down, stat.n)} comparisons (${formatShare(stat.downShare)}).`;
  }
  if (stat.signal === "flat") {
    return `${day} was unchanged from the previous ${day} in ${countPhrase(stat.flat, stat.n)} comparisons (${formatShare(stat.flatShare)}).`;
  }
  return "";
}

export function narrative(analysis: Analysis): Narrative {
  const businessPairs = analysis.pairs.filter((pair) => pair.to <= 4 && pair.n > 0);
  const businessSignals = businessPairs.filter((pair) => pair.signal);
  const monThu = findPair(analysis, 0, 3);
  const nearest = [...businessPairs].sort((a, b) => {
    if (b.dominantShare !== a.dominantShare) return b.dominantShare - a.dominantShare;
    return Math.abs(b.meanDelta ?? 0) - Math.abs(a.meanDelta ?? 0);
  })[0];

  const headline =
    businessSignals.length === 0
      ? "No Monday-to-Friday move keeps the same sign in 70% of weeks."
      : `Inside the business week, ${businessSignals.map(pairName).join(", ")} clear 70%.`;

  const monThuSentence =
    monThu.n === 0
      ? "This window has no week that contains both a Monday and a Thursday."
      : `Thursday’s rate minus Monday’s was positive in ${countPhrase(monThu.up, monThu.n)} weeks (${formatShare(monThu.upShare)}). The average gap was ${formatDelta(monThu.meanDelta ?? 0)} rubles.`;

  const lede = `${monThuSentence} ${
    businessSignals.length === 0
      ? "That does not clear the 70% bar, and neither does any other Monday–Friday pair."
      : "Those are the only business-day pairs that clear the bar."
  }`;

  const paragraphs: string[] = [];

  if (nearest && nearest.signal == null) {
    paragraphs.push(`The strongest lean inside the business week is ${pairName(nearest)}. ${describePair(nearest)}`);
  } else if (businessSignals.length > 0) {
    paragraphs.push(businessSignals.map(describePair).join(" "));
  }

  const { weeks, copies } = analysis.weekendCopiesFriday;
  if (weeks > 0 && copies === weeks) {
    paragraphs.push(
      `What does clear 70% is the weekend, and it is flat rather than a rise. In every one of the ${weeks} complete weeks, Saturday and Sunday print Friday’s rate exactly. The bank’s feed carries Friday forward; it does not post a new dollar fix on those days. Friday to Saturday, Friday to Sunday, and Saturday to Sunday are unchanged every time.`,
    );
  } else if (weeks > 0) {
    paragraphs.push(
      `Saturday and Sunday matched Friday in ${countPhrase(copies, weeks)} complete weeks.`,
    );
  }

  const wowSignals = analysis.wow.filter((stat) => stat.signal);
  if (wowSignals.length > 0) {
    paragraphs.push(
      `Across weeks, same weekday versus the week before: ${wowSignals.map(describeWow).join(" ")} This is the three-month climb in the level — ${formatRate(analysis.startRate)} to ${formatRate(analysis.endRate)} (${formatLevelPercent(analysis.levelPercent)}) — not a Monday-versus-Thursday habit. Saturday repeats Friday in this sample, so its week-to-week count is the Friday count again.`,
    );
  }

  const biasSignals = analysis.bias.filter((item) => item.signal);
  if (biasSignals.length === 0 && analysis.fullWeekCount > 0) {
    const monday = analysis.bias.find((item) => item.weekday === 0);
    const thursday = analysis.bias.find((item) => item.weekday === 3);
    if (monday && thursday) {
      paragraphs.push(
        `Checked another way, Monday sat below that week’s Monday–Friday average in ${countPhrase(monday.below, monday.n)} weeks, and Thursday sat above it in ${countPhrase(thursday.above, thursday.n)}. Neither share reaches 70%.`,
      );
    }
  }

  if (analysis.businessSteps.n > 0) {
    paragraphs.push(
      `Day to day, the rate rose on ${countPhrase(analysis.businessSteps.up, analysis.businessSteps.n)} business-day steps (${formatShare(analysis.businessSteps.upShare)}). All ${analysis.weekendSteps.n} weekend steps are exactly flat. A positive difference means more rubles per dollar: the ruble’s official price of the dollar went up.`,
    );
  }

  paragraphs.push(
    `${analysis.fullWeekCount} complete Monday–Sunday weeks sit inside ${analysis.dayCount} daily fixes from ${formatLongDate(analysis.start)} to ${formatLongDate(analysis.end)}. That is a short sample. A pair has to be lopsided to clear 70%, so anything under that line is a lean, not a rule.`,
  );

  return { headline, lede, paragraphs };
}

export function signalLabel(direction: Direction | null): string {
  if (direction === "up") return "Clears 70% higher";
  if (direction === "down") return "Clears 70% lower";
  if (direction === "flat") return "Clears 70% unchanged";
  return "Under 70%";
}
