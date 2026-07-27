---
title: The baseline belongs in the table
date: 2026-07-27
summary: >-
  A model that always predicts "not depressed" scores 0.82 accuracy. Plotting it
  alongside the real models is what makes their scores mean anything.
chart: ../../assets/viz/depression-model-comparison.png
alt: >-
  Grouped bar chart of five metrics for two models and a majority-class baseline.
  The baseline reaches 0.82 accuracy but scores 0.50 ROC-AUC, 0.18 PR-AUC, 0.50
  balanced accuracy and 0.00 F1.
source: Kaggle depression survey, 140,700 records
tools: [Python, scikit-learn, matplotlib]
writeup: true
featured: true
---

The grey bars are not a third model. They are what you get by predicting the
majority class for every single person in the dataset — a rule with no inputs,
no training, and no ability to distinguish anyone from anyone else.

On the far right, that rule scores **0.82 accuracy**. Four groups to the left, it
scores **0.00 F1** and **0.50 ROC-AUC**, which is the number you get from a coin
flip.

At an 18% positive rate, accuracy stops being a measure of skill and becomes a
measure of the class balance. The original version of this project reported
81.67%–83.80% accuracy across four models on a balanced dataset, where those
numbers were meaningful. Carried onto this data unchanged, they would sit
*below* the do-nothing rule while looking like a result.

Putting the baseline in the chart rather than mentioning it in a footnote makes
the comparison impossible to skip. The two real models are separated from the
null by every metric except the one people quote.

The two models are also within 0.004 ROC-AUC of each other, which is its own
finding: the ceiling here is set by the data, not the algorithm.

Full diagnosis of the dataset change is in the
[project write-up](/data-science/depression-prediction).
