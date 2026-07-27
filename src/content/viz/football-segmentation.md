---
title: Segmentation doubles a correlation
date: 2026-07-27
summary: >-
  The same relationship measured four ways. Pooling every player halves the
  apparent effect of finishing skill on goals scored.
chart: ../../assets/viz/football-segmentation.png
alt: >-
  Horizontal bar chart of four Pearson correlations between finishing rating and
  goals. All players 0.303, attackers only 0.573, attackers with at least ten
  starts 0.615, and the same group measured per start 0.618.
source: Kaggle European Soccer Database, 2008–2016
tools: [Python, pandas, matplotlib]
writeup: true
featured: true
---

Four measurements of one relationship — finishing rating against goals scored —
each on a slightly tighter population. The correlation roughly doubles from
0.303 to 0.618 without any change to the underlying data.

Three of the four bars are grey because they are context; only the last one is
the answer. The chart is arranged as an argument that runs top to bottom, each
step removing one source of dilution: mixing positions, then counting players who
never started, then failing to normalise for playing time.

The step from 0.303 to 0.573 is the largest, and it comes purely from separating
attackers out of a pool that also contains defenders and goalkeepers. A defender
with excellent finishing still does not score, so including them adds noise
that has nothing to do with the question.

The final step is deliberately small. Going from total goals to goals per start
moves the number by only 0.003, which is worth showing precisely *because* it is
small — the exposure problem is real, but most of it is already absorbed by the
ten-start filter applied one row above.

Full method, the data-quality checks, and the limitations are in the
[project write-up](/data-science/football-analytics).
