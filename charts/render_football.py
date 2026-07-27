"""Re-export the football project's charts through the site house style.

The project's own `football_analytics.py` renders these on a white background
with navy/grey bars. That is fine in the project repo, but a white chart on a
#0F0E0C page reads as a lightbulb. This script recomputes the same figures from
the already-derived fact table and re-renders them transparent, in house colors.

Definitions are copied from `football_analytics.py` exactly — in particular
"Attackers only" means attackers who *played* (appearances > 0), not all
attacker-seasons. Getting that wrong moves the number from 0.573 to 0.431.

    python charts/render_football.py --source "path/to/Football"
"""

from __future__ import annotations

import argparse
import sqlite3
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

# Labels contain "≥", which a cp1252 Windows console cannot encode.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import palette  # noqa: E402

plt.style.use(str(HERE / "house.mplstyle"))

# Bars that carry the argument get the categorical blue; bars that are context
# for it recede to the site's muted grey. This is the same emphasis the original
# chart made with navy-on-grey, expressed in house colors.
HIGHLIGHT = palette.CATEGORICAL[0]
CONTEXT = palette.MUTED

POSITION_ATTRS = [
    "marking", "standing_tackle", "sliding_tackle", "interceptions",
    "finishing", "volleys", "positioning", "long_shots",
    "short_passing", "long_passing", "vision", "ball_control",
]


def _frame(ax, title: str, xlabel: str = "", grid_axis: str = "x") -> None:
    """House chart chrome: left-aligned title, one grid direction, no box."""
    ax.set_title(title, loc="left", fontsize=13, color=palette.FG, pad=14)
    ax.set_xlabel(xlabel, color=palette.MUTED)
    ax.set_ylabel("")
    ax.grid(False)
    ax.grid(axis=grid_axis, color="#2A2724", linewidth=0.8)
    ax.set_axisbelow(True)


def chart_segmentation(df: pd.DataFrame, min_apps: int, outdir: Path) -> dict[str, float]:
    """Headline: what position segmentation and an exposure floor actually buy."""
    played = df[df["appearances"] > 0]
    attackers = played[played["position_class"] == "Attacker"]
    qualified = attackers[attackers["appearances"] >= min_apps]

    steps = {
        "All players, total goals": df["finishing"].corr(df["goals_count"]),
        "Attackers only": attackers["finishing"].corr(attackers["goals_count"]),
        f"Attackers, ≥{min_apps} starts": qualified["finishing"].corr(qualified["goals_count"]),
        f"Attackers, ≥{min_apps} starts,\ngoals per start": qualified["finishing"].corr(
            qualified["goals_per_start"]
        ),
    }

    fig, ax = plt.subplots(figsize=(10, 4.6))
    labels, values = list(steps), list(steps.values())
    colors = [CONTEXT] * (len(values) - 1) + [HIGHLIGHT]
    bars = ax.barh(labels, values, color=colors, height=0.62)
    ax.bar_label(bars, fmt="%.3f", padding=6, fontsize=11, color=palette.FG)
    ax.invert_yaxis()
    ax.set_xlim(0, 0.8)
    _frame(ax, "Finishing rating vs goals: effect of segmentation and exposure",
           "Pearson correlation")
    fig.tight_layout()
    fig.savefig(outdir / "football-segmentation.png")
    plt.close(fig)
    return steps


def chart_attributes(df: pd.DataFrame, min_apps: int, outdir: Path) -> None:
    """Which attributes track goals and assists, per position."""
    positions = ["Defender", "Midfielder", "Attacker"]
    fig, axes = plt.subplots(1, 3, figsize=(16, 5.2), sharex=True)
    fig.suptitle(
        f"Attribute correlation with output, by position (≥{min_apps} starts)",
        fontsize=14, x=0.01, ha="left", color=palette.FG,
    )
    for ax, pos in zip(axes, positions):
        sub = df[(df["position_class"] == pos) & (df["appearances"] >= min_apps)]
        corr = sub[POSITION_ATTRS + ["goals_count", "assists_count"]].corr(numeric_only=True)
        plot = corr[["goals_count", "assists_count"]].drop(
            index=["goals_count", "assists_count"], errors="ignore"
        )
        top = (plot["goals_count"] + plot["assists_count"]).sort_values(ascending=False).index[:6]
        plot = plot.loc[top].sort_values("goals_count")
        plot.columns = ["Goals", "Assists"]
        # Two data series => two categorical hues (identity), not highlight/context.
        plot.plot(kind="barh", ax=ax, color=[palette.CATEGORICAL[0], palette.CATEGORICAL[1]],
                  width=0.7, legend=False)
        _frame(ax, f"{pos.upper()}  (n={len(sub):,})", "Pearson correlation")
        ax.axvline(0, color=palette.MUTED, linewidth=0.8)
        ax.set_xlim(-0.15, 0.75)
        ax.tick_params(colors=palette.MUTED)

    handles, labels = axes[-1].get_legend_handles_labels()
    axes[-1].legend(handles, labels, frameon=False, loc="lower right",
                    labelcolor=palette.FG)
    fig.tight_layout(rect=[0, 0, 1, 0.92])
    fig.savefig(outdir / "football-attributes.png")
    plt.close(fig)


def chart_possession(db: Path, outdir: Path) -> float:
    """Possession vs result, rebuilt from the match table in long form."""
    def last_possession(blob):
        if not isinstance(blob, str):
            return None, None
        try:
            root = ET.fromstring(blob)
        except ET.ParseError:
            return None, None
        rows = []
        for value in root.findall("value"):
            try:
                elapsed = int(value.findtext("elapsed"))
                stats = value.find("stats")
                node = stats if stats is not None else value
                rows.append((elapsed, int(node.findtext("homepos")), int(node.findtext("awaypos"))))
            except (AttributeError, TypeError, ValueError):
                continue
        if not rows:
            return None, None
        _, home, away = max(rows, key=lambda r: r[0])
        return home, away

    with sqlite3.connect(db) as conn:
        m = pd.read_sql_query(
            "SELECT match_api_id, home_team_goal, away_team_goal, possession FROM Match", conn
        )

    m[["home_pos", "away_pos"]] = m["possession"].apply(lambda x: pd.Series(last_possession(x)))
    m = m.drop(columns=["possession"]).dropna(subset=["home_pos", "away_pos"])

    home = m.rename(columns={"home_team_goal": "gf", "away_team_goal": "ga", "home_pos": "possession"})
    away = m.rename(columns={"away_team_goal": "gf", "home_team_goal": "ga", "away_pos": "possession"})
    cols = ["match_api_id", "gf", "ga", "possession"]
    long = pd.concat([home[cols], away[cols]], ignore_index=True)
    long["goal_diff"] = long["gf"] - long["ga"]
    long["possession"] = pd.to_numeric(long["possession"], errors="coerce")
    long = long.dropna(subset=["possession"])

    grouped = long.groupby(pd.cut(long["possession"], list(range(20, 85, 5))),
                           observed=True)["goal_diff"].mean()

    fig, ax = plt.subplots(figsize=(11, 5))
    # Signed quantity: blue above the line, red below. The zero line is the story.
    colors = [palette.CATEGORICAL[0] if v >= 0 else palette.CATEGORICAL[3] for v in grouped.values]
    ax.bar([str(b) for b in grouped.index], grouped.values, color=colors)
    ax.axhline(0, color=palette.MUTED, linewidth=1)
    _frame(ax, "Average goal difference by possession share", "Possession (%)", grid_axis="y")
    ax.set_ylabel("Avg. goal difference", color=palette.MUTED)
    ax.tick_params(axis="x", rotation=45, colors=palette.MUTED)
    fig.tight_layout()
    fig.savefig(outdir / "football-possession.png")
    plt.close(fig)
    return long["possession"].corr(long["goal_diff"])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, type=Path, help="the Football project directory")
    ap.add_argument("--outdir", type=Path, default=HERE.parent / "src" / "assets" / "viz")
    ap.add_argument("--min-appearances", type=int, default=10)
    args = ap.parse_args()

    facts = args.source / "outputs" / "player_seasons.csv"
    if not facts.exists():
        print(f"missing fact table: {facts}", file=sys.stderr)
        return 1

    args.outdir.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(facts)
    print(f"loaded {len(df):,} player-seasons")

    steps = chart_segmentation(df, args.min_appearances, args.outdir)
    for label, value in steps.items():
        print(f"  {label.replace(chr(10), ' '):45} {value:.3f}")
    chart_attributes(df, args.min_appearances, args.outdir)

    db = args.source / "database.sqlite"
    if db.exists():
        r = chart_possession(db, args.outdir)
        print(f"  possession vs goal difference: r = {r:.3f}")
    else:
        print(f"  skipped possession chart (no {db.name})")

    print(f"wrote charts to {args.outdir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
