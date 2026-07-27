---
title: What actually explains a footballer's goal count
date: 2026-07-27
summary: >-
  Player and match analysis across 25,979 matches in 11 European leagues, asking
  how much of an apparent skill effect is really just playing time.
cover: ../../assets/viz/football-segmentation.png
alt: >-
  Horizontal bar chart of four Pearson correlations between finishing rating and
  goals, rising from 0.303 for all players to 0.618 for attackers with at least
  ten starts measured per start.
tools: [Python, pandas, SQLite, matplotlib, XML]
featured: true
---

The [Kaggle European Soccer Database](https://www.kaggle.com/datasets/hugomathien/soccer)
covers 25,979 matches across 11 leagues between 2008 and 2016, with per-season
snapshots of every player's attribute ratings. The question I set out to answer:
**which player attributes actually explain goal and assist output, and how much of
an apparent skill effect is really just playing time?**

## The headline

Correlation between a player's finishing rating and their goals, tightened one
step at a time:

| Population | Pearson r |
|---|---|
| All players, total goals | 0.303 |
| Attackers only | 0.573 |
| Attackers with ≥10 starts | 0.615 |
| Attackers with ≥10 starts, goals per start | **0.618** |

Analysed as one undifferentiated pool, finishing looks weakly related to scoring.
Segmenting by position and requiring a minimum number of starts roughly doubles
the measured relationship. The lesson is about the aggregation, not about
football: a mixed population hides the effect.

The exposure control matters on its own. Among attackers who played, appearances
correlate with goals at **r = 0.534** — playing time is nearly as good a predictor
of a season's goal count as finishing skill is. Any analysis using season totals
without normalising is partly measuring who got picked.

## Validating the parse instead of trusting it

The `Match.goal` field stores XML event blobs, and it contains more than scored
goals. Counting every `<player1>` element — the obvious reading — captures 39,863
events, of which 2,374 are not goals for that player:

| `goal_type` | Count | Treatment |
|---|---|---|
| `n` normal | 34,514 | Counted |
| `p` penalty | 2,975 | Counted |
| `o` own goal | 1,116 | Excluded — the goal counts for the opposition |
| `npm` missed penalty | 728 | Excluded, not a goal |
| `dg` disallowed goal | 518 | Excluded, not a goal |
| `rp`, `psm` | 12 | Excluded |

I checked the parse against the recorded scorelines: `n + p + o` reproduces
`home_team_goal + away_team_goal` on **99.9%** of matches, against 91.6% for the
naive parse. That reconciliation is what identified the excluded types in the
first place — the categories were not documented anywhere.

## Three decisions that changed the numbers

**Goalkeepers get their own class.** Scoring a keeper on outfield attributes puts
them wherever their least-bad attribute lands; 6,304 keeper-seasons would
otherwise have been distributed across the outfield classes, most into Midfielder.

**Incomplete attribute rows are dropped, not defaulted.** 1,518 player-seasons are
missing at least one of the twelve classification attributes. Comparing `NaN`
returns `False`, so a chained if/elif silently routed all of them to the fallback
branch rather than failing — a bug that is invisible unless you go looking.

**Assists are credited only on open-play goals.** `<player2>` appears on a handful
of penalty and own-goal events, where an assist is not a meaningful concept.

Everything joins into one player-season fact table of 68,697 rows.

## What the possession chart does not say

Average goal difference climbs monotonically across possession buckets, which
looks like a strong relationship. At match level the correlation is only
**r = 0.260**. Both are true: binning collapses the within-bucket scatter, so
orderly bin means and a weak individual-match relationship coexist comfortably.
Holding the ball is a weak predictor of winning, and the tidy-looking chart is
exactly the kind of figure that would suggest otherwise if read carelessly.

## Limitations

- Appearances are **starts only**. The schema has no substitute records, so
  substitute goals count toward a player not credited with the appearance. The
  ≥10 starts filter limits the distortion; it does not remove it.
- 2.9% of matches carry no lineup data and contribute no appearances.
- Position class is recomputed per season, so a player can change class between
  seasons.
- These correlations are descriptive. No causal claim is intended — finishing
  rating is itself partly assigned by observers who watched the player score.
