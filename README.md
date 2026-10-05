# Weekly habits of the Belarusian dollar rate

Official National Bank of the Republic of Belarus rate for **1 US dollar in Belarusian rubles** (BYN per USD), read for common **weekday patterns** over the last three months.

The page pulls [`/exrates/rates/dynamics/431`](https://api.nbrb.by/exrates/rates/dynamics/431) and [`/exrates/currencies/431`](https://api.nbrb.by/exrates/currencies/431). Currency 431 is the current US dollar quote (scale 1). The ISO code of the ruble is **BYN**. BLR is an earlier code and is not this series.

A pair of weekdays counts as a habit only when the same result shows up in **at least 70%** of ISO weeks (Monday–Sunday):

- later day higher than earlier day (`B − A > 0`)
- later day lower
- or the two days unchanged

## Result for 5 July 2026 – 5 October 2026

The rate moved from **2.9062** to **3.0073** BYN per USD (**+3.48%**) across 93 daily fixes and 13 complete weeks.

- **Monday → Thursday did not qualify.** Thursday was higher in **7 of 13** weeks (**53.8%**). Mean gap about **+0.0075** BYN.
- **No Monday–Friday pair clears 70%.** The nearest lean is Tuesday → Wednesday, higher in **9 of 13** weeks (**69.2%**), one week short of the bar.
- **The weekend is flat in every complete week.** Saturday and Sunday repeat Friday exactly (13 of 13). That is the within-week pattern that clears 70%.
- **Friday versus the previous Friday was higher in 10 of 12 weeks (83.3%).** That is the three-month climb, not a pattern inside the week. Monday versus the previous Monday was higher in only 7 of 13 weeks.

A positive change means more rubles per dollar.

## Run

```bash
npm install
npm test
npx next dev --hostname 0.0.0.0 --port 4317
```

If the live request fails and the requested window is still 5 July 2026 – 5 October 2026, the page falls back to `data/usd-snapshot.json`.
