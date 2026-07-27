"""Render the depression-prediction project's charts in the site house style.

The project writes CSV results but no figures, so these are built from
`outputs/*.csv` — every value plotted comes from a file the pipeline produced.

    python charts/render_depression.py --source "path/to/Macihne Learning"
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import palette  # noqa: E402

plt.style.use(str(HERE / "house.mplstyle"))

BLUE, AQUA = palette.CATEGORICAL[0], palette.CATEGORICAL[1]


def _frame(ax, title: str, xlabel: str = "", ylabel: str = "", grid_axis: str = "y") -> None:
    ax.set_title(title, loc="left", fontsize=13, color=palette.FG, pad=14)
    ax.set_xlabel(xlabel, color=palette.MUTED)
    ax.set_ylabel(ylabel, color=palette.MUTED)
    ax.grid(False)
    ax.grid(axis=grid_axis, color="#2A2724", linewidth=0.8)
    ax.set_axisbelow(True)
    ax.tick_params(colors=palette.MUTED)


def chart_models(src: Path, outdir: Path) -> None:
    """The project's central argument: accuracy alone certifies nothing.

    The majority baseline is drawn in muted grey rather than a categorical hue —
    it is the null, not a third competitor. Its tall accuracy bar beside its
    zero F1 is the whole point of the figure.
    """
    df = pd.read_csv(src / "outputs" / "model_comparison.csv")
    metrics = ["roc_auc", "pr_auc", "balanced_accuracy", "f1", "accuracy"]
    nice = ["ROC-AUC", "PR-AUC", "Balanced acc.", "F1", "Accuracy"]

    x = np.arange(len(metrics))
    width = 0.26
    colors = {"HistGradientBoosting": BLUE, "Logistic Regression": AQUA,
              "Majority baseline": palette.MUTED}

    fig, ax = plt.subplots(figsize=(11, 5.2))
    for i, (_, row) in enumerate(df.iterrows()):
        vals = [row[m] for m in metrics]
        bars = ax.bar(x + (i - 1) * width, vals, width,
                      label=row["model"], color=colors.get(row["model"], BLUE))
        ax.bar_label(bars, fmt="%.2f", padding=3, fontsize=8, color=palette.MUTED)

    ax.set_xticks(x)
    ax.set_xticklabels(nice)
    ax.set_ylim(0, 1.05)
    _frame(ax, "Every metric except accuracy separates the models from the null",
           ylabel="Score")
    ax.legend(frameon=False, labelcolor=palette.FG, loc="lower left", fontsize=9)
    fig.tight_layout()
    fig.savefig(outdir / "depression-model-comparison.png")
    plt.close(fig)


def chart_importance(src: Path, outdir: Path, top: int = 8) -> None:
    """Permutation importance. `age` dominates, and it has a correlated twin."""
    df = pd.read_csv(src / "outputs" / "feature_importance.csv")
    df = df.nlargest(top, "importance").sort_values("importance")

    fig, ax = plt.subplots(figsize=(9.5, 5))
    colors = [BLUE if f == "age" else palette.MUTED for f in df["feature"]]
    bars = ax.barh(df["feature"].str.replace("_", " "), df["importance"],
                   color=colors, height=0.68, xerr=df["std"],
                   error_kw={"ecolor": "#2A2724", "elinewidth": 1})
    ax.bar_label(bars, fmt="%.4f", padding=6, fontsize=9, color=palette.FG)
    ax.set_xlim(0, df["importance"].max() * 1.22)
    _frame(ax, "Permutation importance: mean drop in ROC-AUC (5 repeats)",
           xlabel="Importance", grid_axis="x")
    fig.tight_layout()
    fig.savefig(outdir / "depression-feature-importance.png")
    plt.close(fig)


def chart_tuning(src: Path, outdir: Path) -> None:
    """102 extra model fits buy +0.0001 PR-AUC. That is the finding.

    Score against wall-clock time, so flatness is the vertical axis and cost is
    the horizontal one. Two decisions worth stating:

    - The y-range is deliberately wider than the data. Zooming to the data would
      manufacture visual separation that the 0.004 candidate spread says is not
      there — the honest rendering of "no difference" is a flat line.
    - Colour encodes the *model*, since that is what actually separates the two
      score levels; the strategy is annotated. Labels alternate above/below
      because the 36-fit runs sit close enough on a log axis to collide.
    """
    df = pd.read_csv(src / "outputs" / "tuning_comparison.csv").sort_values("seconds")
    model_color = {"HistGradientBoosting": BLUE, "Logistic Regression": AQUA}

    fig, ax = plt.subplots(figsize=(10.5, 5.4))
    seen: set[str] = set()
    for i, (_, row) in enumerate(df.iterrows()):
        family = "Logistic Regression" if "Logistic" in row["model"] else "HistGradientBoosting"
        color = model_color[family]
        ax.scatter(row["seconds"], row["holdout_pr_auc"], s=170, color=color, zorder=3,
                   edgecolor=palette.BG, linewidth=1.5,
                   label=family if family not in seen else None)
        seen.add(family)

        above = i % 2 == 0
        ax.annotate(f"{row['strategy']} · {int(row['fits'])} fit{'s' if row['fits'] > 1 else ''}",
                    (row["seconds"], row["holdout_pr_auc"]),
                    textcoords="offset points", xytext=(0, 16 if above else -26),
                    ha="center", fontsize=9, color=palette.FG)

    ax.set_xscale("log")
    ax.set_xlim(0.3, 400)
    ax.set_ylim(0.86, 0.94)
    _frame(ax, "102 extra model fits bought +0.0001 PR-AUC",
           xlabel="Wall-clock seconds (log scale)", ylabel="Holdout PR-AUC")
    ax.grid(axis="x", color="#2A2724", linewidth=0.8)
    ax.legend(frameon=False, labelcolor=palette.FG, loc="upper left", fontsize=9)
    fig.tight_layout()
    fig.savefig(outdir / "depression-tuning.png")
    plt.close(fig)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, type=Path)
    ap.add_argument("--outdir", type=Path, default=HERE.parent / "src" / "assets" / "viz")
    args = ap.parse_args()

    args.outdir.mkdir(parents=True, exist_ok=True)
    chart_models(args.source, args.outdir)
    chart_importance(args.source, args.outdir)
    chart_tuning(args.source, args.outdir)
    print(f"wrote 3 charts to {args.outdir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
