import { PairExplorer } from "@/components/pair-explorer";
import { RateChart } from "@/components/rate-chart";
import { WeekStrips } from "@/components/week-strips";
import { WowExplorer } from "@/components/wow-explorer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { analyze, findPair } from "@/lib/analysis";
import {
  formatDelta,
  formatLevelPercent,
  formatLongDate,
  formatRate,
  formatShare,
} from "@/lib/format";
import { loadSeries } from "@/lib/nbrb";
import { narrative } from "@/lib/narrative";

export const revalidate = 3600;

export default async function Page() {
  const series = await loadSeries();
  const analysis = analyze(series.points);
  const story = narrative(analysis);
  const monThu = findPair(analysis, 0, 3);
  const signals = analysis.pairs.filter((pair) => pair.signal);
  const wowSignals = analysis.wow.filter((item) => item.signal);
  const fridayWow = analysis.wow.find((item) => item.weekday === 4);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-6 md:py-14">
      <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
        National Bank of the Republic of Belarus
      </p>
      <h1 className="mt-3 max-w-3xl font-heading text-4xl tracking-tight text-balance md:text-6xl">
        What the dollar does inside a week
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
        Official price of 1 US dollar in Belarusian rubles, {formatLongDate(analysis.start)} to{" "}
        {formatLongDate(analysis.end)}. A weekday pair counts as a habit only when the same sign shows up in at
        least 70% of weeks.
      </p>

      {series.warning ? (
        <p className="mt-4 rounded-lg border border-border bg-rise-soft px-3 py-2 text-sm">{series.warning}</p>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border py-5 md:grid-cols-4">
        <div>
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">Start</dt>
          <dd className="mt-1 font-heading text-3xl tabular-nums">{formatRate(analysis.startRate)}</dd>
          <dd className="text-xs text-muted-foreground">{formatLongDate(analysis.start)}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">End</dt>
          <dd className="mt-1 font-heading text-3xl tabular-nums">{formatRate(analysis.endRate)}</dd>
          <dd className="text-xs text-muted-foreground">{formatLongDate(analysis.end)}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">Change</dt>
          <dd className={`mt-1 font-heading text-3xl tabular-nums ${analysis.levelDelta >= 0 ? "text-rise" : "text-fall"}`}>
            {formatLevelPercent(analysis.levelPercent)}
          </dd>
          <dd className="text-xs text-muted-foreground tabular-nums">{formatDelta(analysis.levelDelta)} BYN</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">Full weeks</dt>
          <dd className="mt-1 font-heading text-3xl tabular-nums">{analysis.fullWeekCount}</dd>
          <dd className="text-xs text-muted-foreground">{analysis.dayCount} daily fixes</dd>
        </div>
      </dl>

      <section className="mt-12" aria-labelledby="verdict">
        <h2 id="verdict" className="font-heading text-3xl tracking-tight md:text-4xl">
          {story.headline}
        </h2>
        <p className="mt-4 max-w-3xl text-lg leading-8">{story.lede}</p>
        <div className="mt-4 max-w-3xl space-y-4 text-base leading-7 text-muted-foreground">
          {story.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardDescription>Monday → Thursday</CardDescription>
              <CardTitle className="font-heading text-2xl">
                Higher in {monThu.up} of {monThu.n} weeks
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {formatShare(monThu.upShare)} of weeks had a higher Thursday. Mean gap{" "}
              {formatDelta(monThu.meanDelta ?? 0)} BYN.
              {monThu.signal ? " This clears 70%." : " This stays under the 70% bar."}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Pairs that clear 70%</CardDescription>
              <CardTitle className="font-heading text-2xl">
                {signals.length} within the week, {wowSignals.length} week to week
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {signals.map((pair) => (
                <Badge key={`${pair.from}-${pair.to}`} variant="secondary">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][pair.from]} →{" "}
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][pair.to]} · {pair.signal}
                </Badge>
              ))}
              {wowSignals.map((item) => (
                <Badge key={item.weekday} variant="outline">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][item.weekday]} week-over-week · {item.signal}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-14" aria-labelledby="series">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="series" className="font-heading text-3xl tracking-tight">
              The daily fix
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Rubles per 1 dollar. Hollow dots are Saturday and Sunday, which sit on Friday’s value. Low{" "}
              {formatRate(analysis.minRate)} on {formatLongDate(analysis.minDate)}. High {formatRate(analysis.maxRate)} on{" "}
              {formatLongDate(analysis.maxDate)}.
            </p>
          </div>
        </div>
        <RateChart
          points={analysis.points}
          minRate={analysis.minRate}
          minDate={analysis.minDate}
          maxRate={analysis.maxRate}
          maxDate={analysis.maxDate}
        />
      </section>

      <Separator className="my-14" />

      <section aria-labelledby="pairs">
        <h2 id="pairs" className="font-heading text-3xl tracking-tight">
          Every weekday pair
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          The brief’s test: if Monday is A and Thursday is B, count the weeks where B − A is positive. The same
          test is applied to every later weekday against every earlier one. Amber is a higher later day, green is
          a lower one, and a solid badge means the majority reaches 70%.
        </p>
        <div className="mt-6">
          <PairExplorer pairs={analysis.pairs} />
        </div>
      </section>

      <Separator className="my-14" />

      <section aria-labelledby="wow">
        <h2 id="wow" className="font-heading text-3xl tracking-tight">
          Same weekday, next week
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          A different question from the move inside one week.
          {fridayWow?.signal === "up"
            ? " Friday clears 70% here because the dollar’s ruble price climbed over these three months. Monday does not."
            : " This compares the level of the fix with the same weekday one week earlier."}
        </p>
        <div className="mt-6">
          <WowExplorer stats={analysis.wow} />
        </div>
      </section>

      <Separator className="my-14" />

      <section aria-labelledby="shapes">
        <h2 id="shapes" className="font-heading text-3xl tracking-tight">
          Week by week
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Each sparkline is scaled to that week alone, so the shape is visible. Monday and Thursday are the larger
          dots. Grey dots are the weekend copy of Friday. Partial weeks at the edges of the three-month window are
          listed and left out of pairs that they do not contain.
        </p>
        <div className="mt-4">
          <WeekStrips weeks={analysis.weeks} />
        </div>
      </section>

      <section className="mt-14 border-t border-border pt-8 text-sm leading-6 text-muted-foreground" aria-labelledby="method">
        <h2 id="method" className="font-heading text-2xl tracking-tight text-foreground">
          How this is counted
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            Source: {series.quoteName} ({series.name}), internal code {series.curId}, scale {series.scale}. The
            current ISO code of the Belarusian ruble is BYN. BLR is an old code and is not this series.{" "}
            <a className="underline decoration-border underline-offset-4" href={series.requestUrl}>
              Rate dynamics
            </a>{" "}
            and{" "}
            <a
              className="underline decoration-border underline-offset-4"
              href="https://www.nbrb.by/apihelp/exrates"
            >
              API notes
            </a>
            . {series.source === "live" ? "Fetched live from NBRB." : "Served from the saved snapshot."}
          </li>
          <li>
            The window is the last three calendar months ending today, {series.start} through {series.end}. The
            first and last ISO weeks can be partial. A pair is counted only in weeks that contain both days.
          </li>
          <li>
            B − A uses the official rate in rubles per dollar. Positive means the dollar became more expensive in
            rubles. The opposite quote, dollars per ruble, would flip rise and fall. Weekend equality would stay.
          </li>
          <li>
            70% is applied to the raw share, not a rounded percent. With 13 weeks, 9 of 13 is 69.2% and does not
            pass; 10 of 13 is 76.9% and does.
          </li>
        </ul>
      </section>
    </main>
  );
}
