---
title: Machine Learning Lab — Student Depression
date: 2026-02-10
summary: >-
  Group project at Ulm comparing four classifiers on a student survey, and what
  changed when the dataset underneath it was replaced.
cover: ../../assets/viz/ml-lab-results.png
alt: >-
  Grouped bar chart of accuracy and sensitivity for four classifiers and a
  majority-class baseline. The baseline reaches 100 percent sensitivity at 58.6
  percent accuracy.
tools: [Python, scikit-learn, pandas, scikit-optimize]
repo: https://github.com/canerdis/depression-prediction
featured: true
---

A five-person group project for the Machine Learning Lab at **Ulm University of
Applied Sciences**: predict depression from a 27,900-record student survey, and
compare classifier families properly rather than reaching for one.

## Getting the data usable

The survey was dirtier than its shape suggested. The `City` column alone
contained city names, degree titles, free text and bare numbers mixed together —
so it was repaired first, then replaced with each city's population, which turns
an unusable high-cardinality string field into one ordered number.

The rest of the preparation was ordinary and deliberate: binary flags for
gender, suicidal thoughts and family history; ordinal encoding where the
categories have a real order (sleep duration, dietary habits, degree level); an
80/20 **stratified** split; Min–Max scaling.

One detail worth stating because it is the usual place student projects go wrong:
**the scaler was fitted on the training split only** and applied to the test set,
not fitted on the full table before splitting. No leakage.

## Four classifiers

| Model | Accuracy | Sensitivity |
|---|---|---|
| Decision Tree (post-pruned) | 81.67% | 81.74% |
| Random Forest | 82.30% | 83.56% |
| k-Nearest Neighbours | 81.78% | 82.47% |
| **Neural Network** | **83.80%** | 79.78% |

The decision tree's pruning parameter was not guessed: `cost_complexity_pruning_path`
generated the candidate alphas and `GridSearchCV` with 5 folds picked one.

The interesting part is that **the ranking flips depending on the metric**. The
neural network wins on accuracy; Random Forest wins on sensitivity, which for a
screening tool is the one that matters — a missed case is worse than a false
alarm. Reporting only the headline number would have chosen the wrong model.

## What the presentation was missing

Looking back at it with more experience, the comparison needed a row it did not
have: **the majority-class baseline**. At a 58.6% positive rate, predicting
"depressed" for everybody scores 58.6% accuracy and **100% sensitivity**.

That does not overturn the result — every model beats 58.6% accuracy by more than
20 points, so they are all learning something real. But without the baseline on
the chart, a reader cannot tell whether 83% sensitivity is good, and cannot see
that the do-nothing rule beats every model on that metric alone. It is on the
chart above now.

Two other things I would do differently:

- **All four models were compared on the same test set, and the best was chosen by
  that comparison.** That makes the reported figure slightly optimistic; a separate
  validation split or nested cross-validation would keep the test set clean.
- **One 80/20 split** carries sampling noise. The 2.1-point spread between the
  weakest and strongest model is within the range a different random seed could
  produce, so "the neural network is best" is a weaker claim than it looks.

## When the dataset was replaced

The dataset this was built on was later swapped for one five times the size —
140,700 records covering working professionals as well as students — and the
original pipeline could no longer run at all. Its cleaning step returned **0 of
140,700 rows**, because every row is null on either the academic block or the work
block, and a hard-coded lookup mapped **100%** of sleep-duration values to null.

Rebuilding it for that data changed the conclusions:

- The 80% null rate was **structural, not missing** — students and professionals
  answer different question blocks — so each complementary pair collapsed onto its
  shared 1–5 scale rather than being imputed.
- The class split moved from 58/42 to 82/18, so accuracy stopped meaning anything:
  the majority rule alone scores **0.8183**. PR-AUC and balanced accuracy replaced
  it as the headline, with the best model at **ROC-AUC 0.975, PR-AUC 0.907** under
  5-fold stratified cross-validation.
- Grid, randomized and Bayesian hyperparameter search all landed within **0.0001
  PR-AUC** of hand-picked values, which says the response surface is flat rather
  than that the search was too small.

## Limitations

- The competition's held-out set has no labels, so every figure from the rebuild
  is cross-validated on train.
- `CGPA` exists only for students and is left missing for professionals rather
  than imputed across cohorts.
- The replacement data is synthetic, generated from a real survey. Relationships
  in it are not evidence about actual mental health.
