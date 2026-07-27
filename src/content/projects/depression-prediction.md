---
title: When the dataset changes underneath a finished project
date: 2026-07-27
summary: >-
  A group machine-learning project had to be rebuilt after its dataset was
  replaced. Diagnosing why the original pipeline could no longer run at all
  turned out to be the interesting part.
cover: ../../assets/viz/depression-model-comparison.png
alt: >-
  Grouped bar chart comparing two models against a majority-class baseline across
  five metrics. The baseline scores 0.82 accuracy but 0.00 F1 and 0.50 ROC-AUC.
tools: [Python, scikit-learn, scikit-optimize, pandas]
featured: true
---

This started as a completed Machine Learning Lab group project and stopped
working when the dataset underneath it was replaced. The change was not
cosmetic — the original notebook cannot be pointed at the new files at all.

| | Old dataset | New `train.csv` |
|---|---|---|
| Rows | 27,901 | 140,700 |
| Population | Students only | Students **and** working professionals |
| Depression rate | 58.6% | 18.2% |
| Missing values | None | 80% on the academic columns |
| `Sleep Duration` values | 5 | 36 |
| `Degree` values | 28 | 115 |

The old file turns out to be the **student subset** of the new one: the student
depression rate in `train.csv` is 0.5855, matching the old file's rate exactly.

## The nulls are structural, not missing

Students answer the academic block; working professionals answer the work block.
The two never overlap:

| Column pair | Both populated | Neither | Exactly one |
|---|---|---|---|
| Academic / Work Pressure | 0 | 21 | 140,679 |
| Study / Job Satisfaction | 2 | 15 | 140,683 |

Both pairs are measured on the same 1–5 scale, so each pair collapses into a
single feature with no information loss — turning a column that is 80% "missing"
into one that is fully populated. Treating those nulls as missing data to be
imputed would have been wrong: nothing is missing, the question simply was not
asked.

## Four ways the original pipeline breaks

1. **`dropna()` returns 0 of 140,700 rows.** Every row is null on either the
   academic or the work block, so dropping incomplete rows drops everything. The
   old pipeline would hand an empty frame to the model.
2. **The sleep-duration lookup maps 100% of rows to NaN.** The old file stored
   these values with literal quote characters (`"'5-6 hours'"`); this one does
   not, and adds 32 further variants. A four-key dictionary matches nothing.
3. **Three columns are dropped that now carry the signal.** `Profession`,
   `Work Pressure` and `Job Satisfaction` were dropped for being constant —
   correct for a students-only file, wrong here, where 112,799 working
   professionals have real values in exactly those fields.
4. **Balancing by undersampling would discard 89,566 rows — 63.7% of the data.**
   The old class split was 58/42, so undersampling cost little. This one is 82/18.

A fifth issue is latent rather than live: rows were removed with
`pd.concat([df, sample]).drop_duplicates(keep=False)`, which also deletes any
*naturally* duplicated rows. Both files happen to have none once `id` is
included, so nothing was lost — but the correctness depended on a property of the
data that nobody had checked.

## Why accuracy became the wrong headline

At an 82/18 split, **predicting "not depressed" for every single person scores
0.8183 accuracy.** The original notebook reported 81.67%–83.80% across four
models. Those numbers were honest on balanced data; carried over to this dataset
they would be indistinguishable from a model that has learned nothing.

So the baseline is reported as a row in the results table rather than assumed:

| Model | ROC-AUC | PR-AUC | Balanced acc. | F1 | Accuracy |
|---|---|---|---|---|---|
| HistGradientBoosting | **0.9747** | **0.9068** | **0.9214** | **0.8044** | 0.9181 |
| Logistic Regression | 0.9740 | 0.9034 | 0.9194 | 0.7976 | 0.9145 |
| Majority baseline | 0.5000 | 0.1817 | 0.5000 | 0.0000 | 0.8183 |

Five-fold stratified cross-validation on all 140,700 rows. The baseline row is
the point: 0.8183 accuracy alongside 0.5 ROC-AUC and 0.0 F1.

## Searching harder did not help

The hyperparameters above were chosen by hand, so I replaced that with three
search strategies and measured whether searching actually helps. A 20% holdout is
split off before any search runs, and no search ever sees it.

**It did not.** Across 12 configurations drawn from a wide six-dimensional space,
the worst scored 0.9026 and the best 0.9067 — a spread of 0.004, for 102 extra
model fits and roughly 30× the compute.

That is a result rather than a failure, and the candidate spread is the evidence.
When every point in the space performs within half a percentage point of every
other point, the response surface is flat and no amount of extra budget will find
anything, because there is nothing to find. Had the spread been wide, a
12-candidate budget would have been the binding constraint and the honest
conclusion would have been "search harder."

Two secondary observations. **Tuning optimism is negligible here** (+0.0013,
+0.0003, −0.0002): with 112,560 rows in the search pool, a 3-fold CV estimate is
stable enough that selecting the maximum over a dozen candidates barely overfits
it — on a small dataset, this gap is where over-optimistic results come from.
And **Bayesian search cost 1.8× the wall time of random search for no gain**,
because it is sequential and cannot parallelise across candidates. It earns its
keep when individual fits are expensive and the surface has real structure;
neither is true here.

## Read `age` carefully

Permutation importance ranks `age` far above everything else at 0.1425, with
`suicidal_thoughts` next at 0.0270. But `age` is doing two jobs at once:
depression falls monotonically from 64.3% in the 18–22 band to 0.8% in the 45–60
band, and `age < 30` also predicts student status with 84.5% accuracy.

`is_student` scores only 0.0026 — not because the cohort is irrelevant, but
because permuting it leaves `age` carrying the same information. Permutation
importance understates any feature that has a correlated twin, and these two are
twins. Reading the table without that caveat would lead you to drop the cohort
flag as useless.

## Limitations

- `test.csv` has no labels, so every number here is cross-validated on train. No
  score against the competition's held-out set is claimed.
- `CGPA` exists only for students and is left missing for professionals rather
  than imputed across cohorts, which would invent a grade point average for
  people who have none.
- This is a synthetic Kaggle dataset generated from a real survey. Relationships
  in it are not evidence about actual mental health.
