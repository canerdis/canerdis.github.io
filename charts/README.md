# Chart house style

Every chart on the site is exported through `house.mplstyle`. Consistency across
charts is what makes the site read as designed rather than generated.

## Usage

```python
import matplotlib.pyplot as plt
plt.style.use('charts/house.mplstyle')

fig, ax = plt.subplots(figsize=(8, 5))
# ... plot ...
fig.savefig('src/assets/viz/my-chart.png')  # transparent bg, site fonts
```

## Rules

- Never export a white background. The site is `#0F0E0C`.
- Categorical colors come from `palette.py`. Do not invent per-chart colors.
- Gradients ARE allowed here: a sequential colormap encoding a continuous
  variable is correct data visualization. The site's gradient ban covers
  decorative CSS only, and the lint never inspects images.
- Chart palette colors must never be added to site CSS.

## Re-exporting existing charts

Existing charts predate this style and must be re-exported through it.
