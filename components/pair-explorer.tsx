"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  hitsNeeded,
  WEEKDAYS,
  type PairStat,
  type WeekdayIndex,
} from "@/lib/analysis";
import {
  countPhrase,
  formatDelta,
  formatRate,
  formatShare,
  formatShortDate,
  formatWeekday,
} from "@/lib/format";
import { signalLabel } from "@/lib/narrative";

export function PairExplorer({ pairs }: { pairs: PairStat[] }) {
  const [selected, setSelected] = useState("0-3");
  const pair = pairs.find((item) => `${item.from}-${item.to}` === selected) ?? pairs[0];
  const ranked = useMemo(
    () =>
      [...pairs].sort((a, b) => {
        if (b.dominantShare !== a.dominantShare) return b.dominantShare - a.dominantShare;
        if (a.from !== b.from) return a.from - b.from;
        return a.to - b.to;
      }),
    [pairs],
  );

  if (!pair) return null;

  const maxAbs = Math.max(...pair.weeks.map((week) => Math.abs(week.delta)), 0.0001);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="overflow-x-auto">
        <p className="mb-3 text-sm text-muted-foreground">
          Later day minus earlier day, inside the same Monday–Sunday week. Select a cell.
        </p>
        <div className="min-w-[36rem]" role="grid" aria-label="Weekday pair results">
          <div className="grid grid-cols-[4.5rem_repeat(7,minmax(0,1fr))] gap-1">
            <div />
            {WEEKDAYS.map((day) => (
              <div key={day} className="pb-1 text-center text-xs tracking-wide text-muted-foreground uppercase">
                {day}
              </div>
            ))}
            {WEEKDAYS.map((rowLabel, row) => (
              <div key={rowLabel} className="contents">
                <div className="flex items-center text-xs tracking-wide text-muted-foreground uppercase">
                  {rowLabel}
                </div>
                {WEEKDAYS.map((_, column) => {
                  if (column <= row) {
                    return <div key={`${row}-${column}`} className="h-14 rounded-md bg-muted/40" />;
                  }
                  const cell = pairs.find((item) => item.from === row && item.to === column);
                  if (!cell || cell.n === 0) {
                    return (
                      <div key={`${row}-${column}`} className="h-14 rounded-md bg-muted/40" />
                    );
                  }
                  const active = pair.from === cell.from && pair.to === cell.to;
                  return (
                    <Button
                      key={`${row}-${column}`}
                      variant="outline"
                      aria-pressed={active}
                      onClick={() => setSelected(`${cell.from}-${cell.to}`)}
                      className={`h-14 flex-col gap-0 rounded-md border px-1 text-foreground hover:bg-accent ${tone(cell)} ${
                        active ? "ring-2 ring-foreground" : ""
                      }`}
                    >
                      <span className="text-sm font-medium tabular-nums">{formatShare(cell.dominantShare)}</span>
                      <span className="text-[10px] tracking-wide uppercase opacity-80">
                        {cell.dominant === "up" ? "higher" : cell.dominant === "down" ? "lower" : "flat"}
                      </span>
                    </Button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-3xl tracking-tight">
            {formatWeekday(pair.from)} → {formatWeekday(pair.to)}
          </h3>
          <Badge variant={pair.signal ? "default" : "outline"}>{signalLabel(pair.signal)}</Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {pair.n === 0
            ? "These two weekdays do not occur together in any week of this window."
            : `${formatWeekday(pair.to)} was ${
                pair.dominant === "up" ? "higher" : pair.dominant === "down" ? "lower" : "unchanged"
              } than ${formatWeekday(pair.from)} in ${countPhrase(pair.dominantHits, pair.n)} weeks (${formatShare(pair.dominantShare)}). The 70% bar at this sample size is ${hitsNeeded(pair.n)} weeks. Mean gap ${formatDelta(pair.meanDelta ?? 0)}, median ${formatDelta(pair.medianDelta ?? 0)}.`}
        </p>
        {pair.weeks.length > 0 ? (
          <>
            <div className="mt-5 flex h-24 items-stretch gap-1" aria-hidden>
              {pair.weeks.map((week) => {
                const height = Math.max(4, (Math.abs(week.delta) / maxAbs) * 40);
                return (
                  <div key={week.label} className="flex h-full flex-1 flex-col justify-center">
                    <div className="flex h-1/2 items-end">
                      {week.delta > 0 ? (
                        <div className="w-full rounded-sm bg-rise" style={{ height }} />
                      ) : null}
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex h-1/2 items-start">
                      {week.delta < 0 ? (
                        <div className="w-full rounded-sm bg-fall" style={{ height }} />
                      ) : null}
                      {week.delta === 0 ? <div className="h-1 w-full rounded-sm bg-muted-foreground" /> : null}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <thead>
                  <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                    <th className="py-2 pr-3 font-medium">Week</th>
                    <th className="py-2 pr-3 font-medium">{formatWeekday(pair.from, "short")}</th>
                    <th className="py-2 pr-3 font-medium">{formatWeekday(pair.to, "short")}</th>
                    <th className="py-2 text-right font-medium">B − A</th>
                  </tr>
                </thead>
                <tbody>
                  {pair.weeks.map((week) => (
                    <tr key={week.label} className="border-t border-border">
                      <td className="py-1.5 pr-3 tabular-nums">{week.label}</td>
                      <td className="py-1.5 pr-3 tabular-nums">
                        <span className="text-muted-foreground">{formatShortDate(week.fromDate)} </span>
                        {formatRate(week.fromRate)}
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums">
                        <span className="text-muted-foreground">{formatShortDate(week.toDate)} </span>
                        {formatRate(week.toRate)}
                      </td>
                      <td
                        className={`py-1.5 text-right font-medium tabular-nums ${
                          week.delta > 0 ? "text-rise" : week.delta < 0 ? "text-fall" : "text-muted-foreground"
                        }`}
                      >
                        {formatDelta(week.delta)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>

      <div className="lg:col-span-2 overflow-x-auto">
        <table className="w-full min-w-[42rem] text-sm">
          <caption className="mb-2 text-left text-sm text-muted-foreground">
            Every pair, ranked by how often the majority result showed up.
          </caption>
          <thead>
            <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="py-2 pr-3 font-medium">Pair</th>
              <th className="py-2 pr-3 text-right font-medium">Weeks</th>
              <th className="py-2 pr-3 text-right font-medium">Higher</th>
              <th className="py-2 pr-3 text-right font-medium">Lower</th>
              <th className="py-2 pr-3 text-right font-medium">Flat</th>
              <th className="py-2 pr-3 text-right font-medium">Mean B − A</th>
              <th className="py-2 font-medium">70% test</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((item) => {
              const active = item.from === pair.from && item.to === pair.to;
              return (
                <tr key={`${item.from}-${item.to}`} className={`border-t border-border ${active ? "bg-accent/60" : ""}`}>
                  <td className="py-1.5 pr-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      aria-pressed={active}
                      onClick={() => setSelected(`${item.from as WeekdayIndex}-${item.to}`)}
                    >
                      {formatWeekday(item.from, "short")} → {formatWeekday(item.to, "short")}
                    </Button>
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{item.n}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {item.up} · {formatShare(item.upShare)}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {item.down} · {formatShare(item.downShare)}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {item.flat} · {formatShare(item.flatShare)}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {item.meanDelta == null ? "—" : formatDelta(item.meanDelta)}
                  </td>
                  <td className="py-1.5">
                    <Badge variant={item.signal ? "default" : "outline"}>{signalLabel(item.signal)}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function tone(pair: PairStat): string {
  if (pair.signal === "flat" || (pair.signal == null && pair.dominant === "flat")) return "bg-flat-soft";
  if (pair.dominant === "up") return pair.signal ? "bg-rise-soft border-rise/40" : "bg-rise-soft/70";
  if (pair.dominant === "down") return pair.signal ? "bg-fall-soft border-fall/40" : "bg-fall-soft/70";
  return "";
}
