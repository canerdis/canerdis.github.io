"""Render the Machine Learning Lab group project's own results in house style.

Figures are the ones the group reported in its final presentation, not the later
solo rebuild on the replacement dataset. The majority-class baseline is added
because the presentation did not carry one: at a 58.6% positive rate, predicting
"depressed" for everybody scores 58.6% accuracy and 100% sensitivity, and without
that row a reader cannot tell how much of the sensitivity is skill.

    python charts/render_ml_lab.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import palette  # noqa: E402

plt.style.use(str(HERE / "house.mplstyle"))

BLUE, AQUA = palette.CATEGORICAL[0], palette.CATEGORICAL[1]

# Reported by the group in the final presentation.
MODELS = ["Decision Tree", "Random Forest", "k-Nearest\nNeighbours", "Neural\nNetwork"]
ACCURACY = [81.67, 82.30, 81.78, 83.80]
SENSITIVITY = [81.74, 83.56, 82.47, 79.78]

# Not in the presentation. Predicting the majority class ("depressed", 58.6% of
# the sample) for everybody: it catches every true case, hence 100% sensitivity,
# while getting 41.4% of the sample wrong.
BASE_ACC, BASE_SENS = 58.6, 100.0


def main() -> int:
    outdir = HERE.parent / "src" / "assets" / "viz"
    outdir.mkdir(parents=True, exist_ok=True)

    x = np.arange(len(MODELS) + 1)
    width = 0.36
    acc = ACCURACY + [BASE_ACC]
    sens = SENSITIVITY + [BASE_SENS]
    labels = MODELS + ["Majority\nbaseline"]

    # The baseline is the null, not a fifth competitor, so it recedes to grey.
    acc_colors = [BLUE] * len(MODELS) + [palette.MUTED]
    sens_colors = [AQUA] * len(MODELS) + [palette.MUTED]

    fig, ax = plt.subplots(figsize=(10.5, 5.2))
    b1 = ax.bar(x - width / 2, acc, width, color=acc_colors, label="Accuracy")
    b2 = ax.bar(x + width / 2, sens, width, color=sens_colors, label="Sensitivity")
    ax.bar_label(b1, fmt="%.1f", padding=3, fontsize=9, color=palette.MUTED)
    ax.bar_label(b2, fmt="%.1f", padding=3, fontsize=9, color=palette.MUTED)

    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylim(0, 112)
    ax.set_ylabel("Percent", color=palette.MUTED)
    ax.set_title("Four classifiers, and the rule that needs no data at all",
                 loc="left", fontsize=13, color=palette.FG, pad=14)
    ax.grid(False)
    ax.grid(axis="y", color="#2A2724", linewidth=0.8)
    ax.set_axisbelow(True)
    ax.tick_params(colors=palette.MUTED)

    handles = [plt.Rectangle((0, 0), 1, 1, color=BLUE), plt.Rectangle((0, 0), 1, 1, color=AQUA)]
    ax.legend(handles, ["Accuracy", "Sensitivity"], frameon=False,
              labelcolor=palette.FG, loc="lower left", fontsize=9)

    fig.tight_layout()
    out = outdir / "ml-lab-results.png"
    fig.savefig(out)
    plt.close(fig)
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
