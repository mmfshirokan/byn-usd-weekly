import snapshot from "@/data/usd-snapshot.json";
import { shiftMonths, utcToday, type RatePoint } from "@/lib/analysis";

const CUR_ID = 431;

type CurrencyMeta = {
  Cur_Abbreviation: string;
  Cur_Scale: number;
  Cur_QuotName_Eng: string;
  Cur_Name_Eng: string;
};

type DynamicsRow = {
  Date: string;
  Cur_OfficialRate: number;
};

export type SeriesLoad = {
  points: RatePoint[];
  source: "live" | "snapshot";
  start: string;
  end: string;
  curId: number;
  abbreviation: string;
  scale: number;
  quoteName: string;
  name: string;
  requestUrl: string;
  warning?: string;
};

export function windowEnding(today = utcToday()): { start: string; end: string } {
  return { start: shiftMonths(today, -3), end: today };
}

function snapshotSeries(start: string, end: string, warning: string): SeriesLoad {
  return {
    points: snapshot.points,
    source: "snapshot",
    start,
    end,
    curId: snapshot.curId,
    abbreviation: snapshot.abbreviation,
    scale: snapshot.scale,
    quoteName: snapshot.quoteName,
    name: snapshot.name,
    requestUrl: snapshot.source,
    warning,
  };
}

export async function loadSeries(today = utcToday()): Promise<SeriesLoad> {
  const { start, end } = windowEnding(today);
  const requestUrl = `https://api.nbrb.by/exrates/rates/dynamics/${CUR_ID}?startdate=${start}&enddate=${end}`;
  const snapStart = snapshot.points[0]?.date;
  const snapEnd = snapshot.points[snapshot.points.length - 1]?.date;

  try {
    const [ratesRes, metaRes] = await Promise.all([
      fetch(requestUrl, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(20_000),
      }),
      fetch(`https://api.nbrb.by/exrates/currencies/${CUR_ID}`, {
        next: { revalidate: 86_400 },
        signal: AbortSignal.timeout(20_000),
      }),
    ]);
    if (!ratesRes.ok) throw new Error(`rates HTTP ${ratesRes.status}`);
    if (!metaRes.ok) throw new Error(`currency HTTP ${metaRes.status}`);
    const rates = (await ratesRes.json()) as DynamicsRow[];
    const meta = (await metaRes.json()) as CurrencyMeta;
    if (!Array.isArray(rates) || rates.length === 0) throw new Error("empty rate list");
    if (meta.Cur_Abbreviation !== "USD") {
      throw new Error(`expected USD, received ${meta.Cur_Abbreviation}`);
    }
    const scale = meta.Cur_Scale > 0 ? meta.Cur_Scale : 1;
    const points = rates
      .map((row) => ({
        date: row.Date.slice(0, 10),
        rate: row.Cur_OfficialRate / scale,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return {
      points,
      source: "live",
      start,
      end,
      curId: CUR_ID,
      abbreviation: meta.Cur_Abbreviation,
      scale,
      quoteName: meta.Cur_QuotName_Eng,
      name: meta.Cur_Name_Eng,
      requestUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    if (start === snapStart && end === snapEnd) {
      return snapshotSeries(
        start,
        end,
        `The live NBRB request failed (${message}). Showing the saved pull from ${snapshot.fetchedOn}.`,
      );
    }
    throw new Error(`Could not load NBRB rates for ${start} to ${end}: ${message}`);
  }
}
