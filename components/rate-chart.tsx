"use client";

import { useMemo, useState, type PointerEvent } from "react";
import { weekdayIndex, type RatePoint } from "@/lib/analysis";
import { formatDelta, formatLongDate, formatRate, formatWeekday } from "@/lib/format";

const WIDTH = 920;
const HEIGHT = 320;
const PAD = { left: 68, right: 18, top: 18, bottom: 36 };

export function RateChart({
  points,
  minRate,
  minDate,
  maxRate,
  maxDate,
}: {
  points: RatePoint[];
  minRate: number;
  minDate: string;
  maxRate: number;
  maxDate: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const layout = useMemo(() => {
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const low = Math.min(...points.map((point) => point.rate));
    const high = Math.max(...points.map((point) => point.rate));
    const span = high - low || 1;
    const yMin = low - span * 0.08;
    const yMax = high + span * 0.12;
    const xAt = (index: number) => PAD.left + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const yAt = (rate: number) => PAD.top + ((yMax - rate) / (yMax - yMin)) * innerH;
    const line = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${xAt(index).toFixed(2)} ${yAt(point.rate).toFixed(2)}`)
      .join(" ");
    const area = `${line} L ${xAt(points.length - 1).toFixed(2)} ${(PAD.top + innerH).toFixed(2)} L ${xAt(0).toFixed(2)} ${(PAD.top + innerH).toFixed(2)} Z`;
    const ticks = [low, (low + high) / 2, high];
    const months: { index: number; label: string }[] = [];
    let lastMonth = "";
    points.forEach((point, index) => {
      const month = point.date.slice(0, 7);
      if (month !== lastMonth) {
        months.push({
          index,
          label: new Date(`${point.date}T00:00:00Z`).toLocaleDateString("en-GB", {
            month: "short",
            timeZone: "UTC",
          }),
        });
        lastMonth = month;
      }
    });
    return { xAt, yAt, line, area, ticks, months };
  }, [points]);

  const active = hover == null ? null : points[hover];
  const previous = hover != null && hover > 0 ? points[hover - 1] : null;

  function locate(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const x = ratio * WIDTH;
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;
    points.forEach((_, index) => {
      const distance = Math.abs(layout.xAt(index) - x);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    });
    setHover(nearest);
  }

  return (
    <div className="overflow-x-auto">
      <div className="relative min-w-[720px]">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label="Official Belarusian rubles per US dollar, daily"
          onPointerMove={locate}
          onPointerLeave={() => setHover(null)}
        >
          {layout.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={layout.yAt(tick)}
                y2={layout.yAt(tick)}
                stroke="currentColor"
                className="text-border"
              />
              <text
                x={PAD.left - 10}
                y={layout.yAt(tick) + 4}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize="12"
              >
                {formatRate(tick)}
              </text>
            </g>
          ))}
          <path d={layout.area} className="fill-rise/15" />
          <path d={layout.line} fill="none" className="stroke-foreground" strokeWidth="2" />
          {points.map((point, index) =>
            weekdayIndex(point.date) >= 5 ? (
              <circle
                key={point.date}
                cx={layout.xAt(index)}
                cy={layout.yAt(point.rate)}
                r="2.2"
                className="fill-muted-foreground"
              />
            ) : null,
          )}
          {[minDate, maxDate].map((date) => {
            const index = points.findIndex((point) => point.date === date);
            if (index < 0) return null;
            const rate = date === minDate ? minRate : maxRate;
            return (
              <g key={date}>
                <circle cx={layout.xAt(index)} cy={layout.yAt(rate)} r="3.5" className="fill-foreground" />
              </g>
            );
          })}
          {layout.months.map((month) => (
            <text
              key={month.label + month.index}
              x={layout.xAt(month.index)}
              y={HEIGHT - 10}
              className="fill-muted-foreground"
              fontSize="12"
            >
              {month.label}
            </text>
          ))}
          {active && hover != null ? (
            <line
              x1={layout.xAt(hover)}
              x2={layout.xAt(hover)}
              y1={PAD.top}
              y2={HEIGHT - PAD.bottom}
              className="stroke-rise"
              strokeDasharray="3 3"
            />
          ) : null}
        </svg>
        {active && hover != null ? (
          <div
            className="pointer-events-none absolute z-10 w-52 rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-sm"
            style={{
              left: `${Math.min(Math.max((layout.xAt(hover) / WIDTH) * 100, 8), 78)}%`,
              top: 12,
            }}
          >
            <div className="font-medium">
              {formatLongDate(active.date)} · {formatWeekday(weekdayIndex(active.date))}
            </div>
            <div className="mt-1 tabular-nums">{formatRate(active.rate)} BYN</div>
            {previous ? (
              <div className="tabular-nums text-background/80">
                {formatDelta(active.rate - previous.rate)} from the day before
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
