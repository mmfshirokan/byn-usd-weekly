import type { WeekObservation, WeekdayIndex } from "@/lib/analysis";
import { formatDelta, formatRate, formatShortDate } from "@/lib/format";

function Spark({ week }: { week: WeekObservation }) {
  const values = [0, 1, 2, 3, 4, 5, 6].map((index) => week.days[index as WeekdayIndex]?.rate);
  const present = values.filter((value): value is number => value != null);
  const low = Math.min(...present);
  const high = Math.max(...present);
  const span = high - low || 1;
  const width = 168;
  const height = 36;
  const coords = values.map((value, index) => {
    if (value == null) return null;
    const x = 8 + (index / 6) * (width - 16);
    const y = 6 + ((high - value) / span) * (height - 12);
    return { x, y };
  });
  const defined = coords.filter((point): point is { x: number; y: number } => point != null);
  const path = defined.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const net = week.days[0] && week.days[4] ? week.days[4].rate - week.days[0].rate : null;
  const stroke = net == null ? "stroke-muted-foreground" : net > 0 ? "stroke-rise" : net < 0 ? "stroke-fall" : "stroke-muted-foreground";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-40" aria-hidden>
      <path d={path} fill="none" className={stroke} strokeWidth="1.75" />
      {coords.map((point, index) =>
        point ? (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={index === 0 || index === 3 ? 2.4 : 1.6}
            className={index >= 5 ? "fill-muted-foreground" : "fill-foreground"}
          />
        ) : null,
      )}
    </svg>
  );
}

export function WeekStrips({ weeks }: { weeks: WeekObservation[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <caption className="sr-only">Each Monday–Sunday week, scaled to its own range</caption>
        <thead>
          <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
            <th className="py-2 pr-3 font-medium">Week</th>
            <th className="py-2 pr-3 font-medium">Dates</th>
            <th className="py-2 pr-3 font-medium">Shape</th>
            <th className="py-2 pr-3 text-right font-medium">Monday</th>
            <th className="py-2 pr-3 text-right font-medium">Thu − Mon</th>
            <th className="py-2 text-right font-medium">Fri − Mon</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => {
            const dates = Object.values(week.days).sort((a, b) => a.date.localeCompare(b.date));
            const monThu =
              week.days[0] && week.days[3] ? week.days[3].rate - week.days[0].rate : null;
            const monFri =
              week.days[0] && week.days[4] ? week.days[4].rate - week.days[0].rate : null;
            return (
              <tr key={week.label} className="border-t border-border">
                <td className="py-2 pr-3 font-medium tabular-nums">{week.label}</td>
                <td className="py-2 pr-3 text-muted-foreground">
                  {dates.length ? `${formatShortDate(dates[0].date)} – ${formatShortDate(dates[dates.length - 1].date)}` : "—"}
                  {week.complete ? "" : " · partial"}
                </td>
                <td className="py-2 pr-3">
                  <Spark week={week} />
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {week.days[0] ? formatRate(week.days[0].rate) : "—"}
                </td>
                <td className={`py-2 pr-3 text-right tabular-nums ${deltaClass(monThu)}`}>
                  {monThu == null ? "—" : formatDelta(monThu)}
                </td>
                <td className={`py-2 text-right tabular-nums ${deltaClass(monFri)}`}>
                  {monFri == null ? "—" : formatDelta(monFri)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function deltaClass(delta: number | null): string {
  if (delta == null || delta === 0) return "text-muted-foreground";
  return delta > 0 ? "text-rise" : "text-fall";
}
