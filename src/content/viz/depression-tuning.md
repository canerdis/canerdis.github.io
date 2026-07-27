---
title: A negative result, drawn flat
date: 2026-07-27
summary: >-
  Hyperparameter search cost 102 extra model fits and gained 0.0001 PR-AUC. The
  chart's job is to show nothing happening.
chart: ../../assets/viz/depression-tuning.png
alt: >-
  Scatter plot of holdout PR-AUC against wall-clock seconds on a log scale for
  five tuning runs. All five sit at almost the same height near 0.90 despite
  compute ranging from under one second to over two minutes.
source: Kaggle depression survey, 140,700 records
tools: [Python, scikit-learn, scikit-optimize, matplotlib]
writeup: true
featured: false
---

Five tuning runs, plotted as score against wall-clock time. Compute spans from
under a second to over two minutes on a log axis. The scores do not move.

The y-axis is the decision worth explaining. The five values span 0.9022 to
0.9064 — a range of 0.004. Scaling the axis to that range would fill the chart
with dramatic-looking separation, and every visual instinct pushes that way,
because a flat chart feels like a failed chart.

It would also be a lie. The finding is that a wide six-dimensional search space
produces candidates that all perform within half a percentage point of each
other, which means the response surface is flat and extra budget buys nothing.
An axis zoomed to 0.900–0.907 would visually contradict the conclusion the data
supports. So the axis spans 0.86–0.94 and the points sit in a line.

Colour encodes the model rather than the search strategy, because that is what
actually separates the two score levels — the gap between the blue cluster and
the green points is a model-family difference, not a tuning difference. The
strategy is annotated instead, with labels alternating above and below since the
two 36-fit runs sit close together on a log scale.

The practical conclusion: effort on this problem belongs in features and data
quality, not in the optimiser. Details are in the
[project write-up](/data-science/depression-prediction).
