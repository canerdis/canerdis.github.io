---
title: A tidy chart of a weak relationship
date: 2026-07-27
summary: >-
  Average goal difference climbs cleanly with possession share. The match-level
  correlation is only 0.260.
chart: ../../assets/viz/football-possession.png
alt: >-
  Bar chart of average goal difference across possession buckets from 20 to 80
  percent, rising monotonically from about minus 1.5 to plus 1.5, with negative
  bars in red and positive bars in blue.
source: Kaggle European Soccer Database, 2008–2016
tools: [Python, pandas, matplotlib]
writeup: true
featured: false
---

This chart looks like strong evidence that possession wins matches. Every bucket
sits above the one before it, the sign flips almost exactly at 50%, and the
pattern is close to linear. It would be easy to publish as "possession decides
games."

The match-level correlation between possession share and goal difference is
**r = 0.260** — weak.

Both facts are correct. Binning collapses the variation *within* each bucket and
plots only the mean, so a bucket where individual matches range from a 4–0 win to
a 0–3 loss appears as a single tidy bar slightly above zero. The averages really
do climb; individual matches scatter enormously around them.

I kept the chart rather than dropping it, because the gap between how it looks
and what it supports is the useful part. A binned-mean chart answers "what
happens on average in each band" and is silently mute on "how much of any single
match does this explain." Those get confused constantly, and the visual is
persuasive in a way the correlation does not license.

The zero line is drawn in the muted grey rather than a bright colour so the
crossover is legible without being asserted as the headline.

Method and caveats are in the [project write-up](/data-science/football-analytics).
