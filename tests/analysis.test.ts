import assert from "node:assert/strict";
import { test } from "node:test";
import snapshot from "../data/usd-snapshot.json";
import {
  analyze,
  findPair,
  hitsNeeded,
  isoWeekParts,
  shiftMonths,
  weekdayIndex,
} from "../lib/analysis";
import { narrative } from "../lib/narrative";

test("calendar helpers match ISO weeks", () => {
  assert.equal(shiftMonths("2026-10-05", -3), "2026-07-05");
  assert.equal(shiftMonths("2026-03-31", -1), "2026-02-28");
  assert.deepEqual(isoWeekParts("2026-07-05"), { year: 2026, week: 27 });
  assert.equal(weekdayIndex("2026-07-05"), 6);
  assert.deepEqual(isoWeekParts("2026-07-06"), { year: 2026, week: 28 });
  assert.equal(weekdayIndex("2026-07-06"), 0);
  assert.deepEqual(isoWeekParts("2026-10-05"), { year: 2026, week: 41 });
  assert.deepEqual(isoWeekParts("2025-12-29"), { year: 2026, week: 1 });
  assert.deepEqual(isoWeekParts("2026-12-31"), { year: 2026, week: 53 });
  assert.equal(hitsNeeded(13), 10);
  assert.equal(hitsNeeded(12), 9);
  assert.equal(hitsNeeded(10), 7);
});

test("three-month USD snapshot weekday patterns", () => {
  const analysis = analyze(snapshot.points);
  assert.equal(analysis.dayCount, 93);
  assert.equal(analysis.gapCount, 0);
  assert.equal(analysis.fullWeekCount, 13);
  assert.equal(analysis.start, "2026-07-05");
  assert.equal(analysis.end, "2026-10-05");
  assert.equal(analysis.startRate, 2.9062);
  assert.equal(analysis.endRate, 3.0073);
  assert.equal(analysis.minRate, 2.8607);
  assert.equal(analysis.maxRate, 3.0792);

  const monThu = findPair(analysis, 0, 3);
  assert.equal(monThu.n, 13);
  assert.equal(monThu.up, 7);
  assert.equal(monThu.down, 6);
  assert.equal(monThu.flat, 0);
  assert.equal(monThu.signal, null);
  assert.ok(Math.abs((monThu.meanDelta ?? 0) - 0.0075) < 0.00015);

  const tueWed = findPair(analysis, 1, 2);
  assert.equal(tueWed.up, 9);
  assert.equal(tueWed.down, 4);
  assert.equal(tueWed.signal, null);

  for (const [from, to] of [
    [4, 5],
    [4, 6],
    [5, 6],
  ] as const) {
    const pair = findPair(analysis, from, to);
    assert.equal(pair.flat, 13);
    assert.equal(pair.signal, "flat");
  }

  const business = analysis.pairs.filter((pair) => pair.to <= 4);
  assert.equal(
    business.some((pair) => pair.signal),
    false,
  );

  assert.equal(analysis.weekendCopiesFriday.copies, 13);
  assert.equal(analysis.allSteps.n, 92);
  assert.equal(analysis.allSteps.up, 36);
  assert.equal(analysis.businessSteps.n, 66);
  assert.equal(analysis.businessSteps.up, 36);
  assert.equal(analysis.businessSteps.flat, 0);
  assert.equal(analysis.weekendSteps.n, 26);
  assert.equal(analysis.weekendSteps.flat, 26);

  const friday = analysis.wow.find((item) => item.weekday === 4);
  assert.ok(friday);
  assert.equal(friday.n, 12);
  assert.equal(friday.up, 10);
  assert.equal(friday.signal, "up");

  const monday = analysis.wow.find((item) => item.weekday === 0);
  assert.ok(monday);
  assert.equal(monday.n, 13);
  assert.equal(monday.up, 7);
  assert.equal(monday.signal, null);

  const sunday = analysis.wow.find((item) => item.weekday === 6);
  assert.ok(sunday);
  assert.equal(sunday.n, 13);
  assert.equal(sunday.up, 10);
  assert.equal(sunday.signal, "up");

  assert.equal(
    analysis.bias.some((item) => item.signal),
    false,
  );
});

test("narrative points at the 70% results and the Monday-Thursday miss", () => {
  const story = narrative(analyze(snapshot.points));
  const text = [story.headline, story.lede, ...story.paragraphs].join(" ");
  assert.match(story.headline, /No Monday-to-Friday/);
  assert.match(text, /7 of 13/);
  assert.match(text, /53\.8%/);
  assert.match(text, /Tuesday to Wednesday/);
  assert.match(text, /9 of 13/);
  assert.match(text, /69\.2%/);
  assert.match(text, /10 of 12/);
  assert.match(text, /83\.3%/);
  assert.match(text, /Saturday and Sunday print Friday/);
});
