"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WEEKDAYS, type WeekdayIndex, type WowStat } from "@/lib/analysis";
import { countPhrase, formatDelta, formatRate, formatShare, formatShortDate, formatWeekday } from "@/lib/format";
import { signalLabel } from "@/lib/narrative";

export function WowExplorer({ stats }: { stats: WowStat[] }) {
  const [weekday, setWeekday] = useState<WeekdayIndex>(4);
  const stat = stats.find((item) => item.weekday === weekday) ?? stats[0];
  if (!stat) return null;
  const maxAbs = Math.max(...stat.rows.map((row) => Math.abs(row.delta)), 0.0001);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((label, index) => {
          const item = stats.find((statItem) => statItem.weekday === index);
          return (
            <Button
              key={label}
              variant={weekday === index ? "default" : "outline"}
              size="sm"
              aria-pressed={weekday === index}
              onClick={() => setWeekday(index as WeekdayIndex)}
            >
              {label}
              {item?.signal ? " · 70%" : ""}
            </Button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h3 className="font-heading text-3xl tracking-tight">{formatWeekday(stat.weekday)} versus the week before</h3>
        <Badge variant={stat.signal ? "default" : "outline"}>{signalLabel(stat.signal)}</Badge>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        {stat.n === 0
          ? "Not enough repeats of this weekday, seven days apart."
          : `${formatWeekday(stat.weekday)} was ${
              stat.dominant === "up" ? "higher" : stat.dominant === "down" ? "lower" : "unchanged"
            } than the previous ${formatWeekday(stat.weekday)} in ${countPhrase(stat.dominantHits, stat.n)} comparisons (${formatShare(stat.dominantShare)}). Mean change ${formatDelta(stat.meanDelta ?? 0)}. Only gaps of exactly seven days are counted.`}
      </p>
      {stat.rows.length > 0 ? (
        <div className="mt-5 flex h-24 items-stretch gap-1" aria-hidden>
          {stat.rows.map((row) => {
            const height = Math.max(4, (Math.abs(row.delta) / maxAbs) * 40);
            return (
              <div key={row.date} className="flex h-full flex-1 flex-col justify-center">
                <div className="flex h-1/2 items-end">
                  {row.delta > 0 ? <div className="w-full rounded-sm bg-rise" style={{ height }} /> : null}
                </div>
                <div className="h-px bg-border" />
                <div className="flex h-1/2 items-start">
                  {row.delta < 0 ? <div className="w-full rounded-sm bg-fall" style={{ height }} /> : null}
                  {row.delta === 0 ? <div className="h-1 w-full rounded-sm bg-muted-foreground" /> : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="py-2 pr-3 font-medium">Previous</th>
              <th className="py-2 pr-3 font-medium">This week</th>
              <th className="py-2 text-right font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {stat.rows.map((row) => (
              <tr key={row.date} className="border-t border-border">
                <td className="py-1.5 pr-3 tabular-nums">
                  <span className="text-muted-foreground">{formatShortDate(row.prevDate)} </span>
                  {formatRate(row.prevRate)}
                </td>
                <td className="py-1.5 pr-3 tabular-nums">
                  <span className="text-muted-foreground">{formatShortDate(row.date)} </span>
                  {formatRate(row.rate)}
                </td>
                <td
                  className={`py-1.5 text-right font-medium tabular-nums ${
                    row.delta > 0 ? "text-rise" : row.delta < 0 ? "text-fall" : "text-muted-foreground"
                  }`}
                >
                  {formatDelta(row.delta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
