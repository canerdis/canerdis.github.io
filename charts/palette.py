"""Chart palette. These colors appear ONLY inside chart images.

Site thesis: color is reserved for data. The interface is monochrome, so
these hexes must never be added to site CSS — the design lint rejects any
color outside the four interface tokens, and that is correct behaviour.
"""

from matplotlib.colors import LinearSegmentedColormap

# Site tokens, mirrored so charts match the page exactly.
BG = "#0F0E0C"
FG = "#E8E4DC"
MUTED = "#8A857C"

# Categorical palette chosen under the dataviz skill: colorblind-safe and
# legible on BG, validated at >=3:1 contrast against the site surface.
# Order matters — it is the colorblind-safety mechanism. Do not reorder.
CATEGORICAL = [
    "#3987e5",  # blue
    "#199e70",  # aqua
    "#c98500",  # yellow
    "#e66767",  # red
    "#008300",  # green
    "#d95926",  # orange
]

# Sequential ramp: single-hue blue, light -> dark. For continuous data
# encoded as a gradient (e.g. heatmaps, magnitude fills).
SEQUENTIAL = LinearSegmentedColormap.from_list(
    "house_seq",
    [
        "#cde2fb",
        "#9ec5f4",
        "#6da7ec",
        "#3987e5",
        "#256abf",
        "#184f95",
        "#0d366b",
    ],
)

# Diverging ramp: blue <-> gray <-> red, warm dark-gray midpoint. For data
# with a meaningful zero/neutral point (e.g. deltas, differences).
DIVERGING = LinearSegmentedColormap.from_list(
    "house_div",
    [
        "#3987e5",  # blue pole
        "#383835",  # midpoint
        "#e66767",  # red pole
    ],
)
