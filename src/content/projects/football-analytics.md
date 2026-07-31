---
title: Football Business Analytics
date: 2026-01-21
summary: >-
  Group project for the Business Analytics course at Ulm. Two star schemas over
  25,000+ matches, built to answer what a scout and a coach each need to know.
cover: ../../assets/viz/football-attributes.png
alt: >-
  Three panels of horizontal bars showing the six attributes most correlated with
  goals and assists for defenders, midfielders and attackers.
tools: [Python, SQL, SQLite, pandas, matplotlib, Flourish]
repo: https://github.com/canerdis/football-analytics
featured: true
---

A group project for the Business Analytics course at **Ulm University of Applied
Sciences** (Technische Hochschule Ulm), presented in January 2026. The brief was
to take a real dataset and answer a question two different stakeholders would
actually ask.

We picked football because the industry has moved from subjective observation to
budget decisions made on data, and because the [Kaggle European Soccer
Database](https://www.kaggle.com/datasets/hugomathien/soccer) is messy enough to
be worth the effort: 25,000+ matches and 10,000+ players across 11 countries,
2008–2016, with match events stored as XML blobs inside a SQLite column.

## Two questions, two stakeholders

**Scouts** need a talent filter: which attributes actually predict a goal scorer?
**Coaches** need a tactical read: does holding the ball actually win matches?

Those are different grains, so they became two different fact tables.

| Schema | Grain | Key | Dimensions |
|---|---|---|---|
| By season | one row per player per season | `player_api_id` + `season_id` | player, season |
| By match | one row per team per match | `match_api_id` + `team_api_id` | team, league, time |

Modelling it twice rather than forcing one table is the part of the project that
transferred best to everything after it. The question sets the grain; the grain
sets the schema.

## What we found

**Mental attributes beat athletic ones.** Across defenders, midfielders and
attackers, *reactions* and *positioning* correlate with output more strongly than
pure physical ratings do. For scouting under a transfer budget that matters,
because those attributes are cheaper to buy than pace.

**Possession has a break-even point, not a guarantee.** Teams above roughly **50%**
possession win more often, but the distributions overlap heavily — plenty of
matches are won on well under half the ball. Possession is a KPI a coach can use,
not a rule that decides games.

## Where the pipeline was wrong, and how we found out

The `Match.goal` column stores XML, and the obvious parse — count every
`<player1>` element — is wrong. It captures 39,863 events, of which **2,374 are
not goals for that player**: own goals, missed penalties, disallowed goals.

Nothing in the schema says so. What exposed it was reconciling the parsed totals
against the recorded scorelines: the naive parse matched on **91.6%** of matches,
and once own goals were credited to the opposition and the non-goal event types
excluded, that rose to **99.9%**.

Two smaller corrections came out of the same pass:

- **Goalkeepers were being classified as midfielders.** Scoring a keeper on
  outfield attributes puts them wherever their least-bad attribute lands, so 6,304
  keeper-seasons were quietly distributed across the outfield classes.
- **1,518 player-seasons had incomplete attribute rows.** Comparing `NaN` returns
  `False`, so a chained if/elif routed all of them to the fallback branch instead
  of failing — invisible unless you go looking for it.

## Afterwards

I kept working on it after the course ended. Segmenting by position and adding a
minimum-appearances filter raised the correlation between finishing rating and
goals from **0.303 to 0.618**, and appearances alone correlate with goals at
**0.534** — meaning a season total is partly a measure of who got picked, not who
finished well.

## Limitations

- Appearances are starts only; the schema has no substitute records.
- 2.9% of matches carry no lineup data.
- These are correlations. Finishing rating is itself partly assigned by observers
  who watched the player score.
