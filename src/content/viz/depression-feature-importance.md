---
title: The most important feature has a twin
date: 2026-07-27
summary: >-
  Permutation importance puts age five times above anything else — and
  understates the cohort flag that age is standing in for.
chart: ../../assets/viz/depression-feature-importance.png
alt: >-
  Horizontal bar chart of permutation importance for eight features. Age leads at
  0.1425, followed by suicidal thoughts at 0.0270, pressure at 0.0169 and
  financial stress at 0.0099.
source: Kaggle depression survey, 140,700 records
tools: [Python, scikit-learn, matplotlib]
writeup: true
featured: false
---

Age dominates this chart by a factor of five over the next feature. Read
literally, the conclusion would be that age is what matters and the cohort
someone belongs to is nearly irrelevant — `is_student` scores 0.0026, close to
the bottom.

That reading is wrong, and the chart cannot show why on its own.

Age is doing two jobs at once. Depression falls monotonically from 64.3% in the
18–22 band to 0.8% in the 45–60 band, so age carries real signal. But `age < 30`
also predicts student status with 84.5% accuracy. When permutation importance
shuffles `is_student`, the model simply reads the cohort off `age` instead and
barely loses any performance — so the method reports the cohort flag as
worthless.

Permutation importance understates any feature that has a correlated twin. It
measures what happens when one column is destroyed, which is only the same thing
as that column's value when no other column can substitute for it. Here two
columns are near-duplicates, and the method splits the credit unevenly rather
than sharing it.

Only `age` is highlighted; the rest recede, because the chart exists to make one
comparison rather than to be read as a ranked list of nine equals. The error bars
are the standard deviation across five permutation repeats — narrow enough that
the ordering is stable, which is worth confirming before drawing any conclusion
from a ranking.

`suicidal_thoughts` remains the strongest non-demographic predictor. As the
original project argued, it is arguably a symptom rather than a cause and is a
PHQ-9 diagnostic criterion, so it is not obviously useful for early screening.

Full context is in the [project write-up](/data-science/depression-prediction).
