# canerdis.github.io

Personal site. Charts I have made and published, and write-ups of my data
projects, in one index.

Live at <https://canerdis.github.io>.

Built with Astro. Every page is complete HTML and CSS; one small script adds
the motion on top, and the site works the same without it.

The rule the site is built on: colour is reserved for data. The interface is a
cool monochrome drawn on hairlines, and apart from one small status dot, every
colour you see on a page comes from inside a chart image. A lint step fails the build if any colour outside
the tokens reaches the CSS, which is what stops that from quietly eroding.

## Editing

Content is edited in [Pages CMS](https://pagescms.org), configured by
`.pages.yml`: the about text and facts (`src/data/site.json`), charts
(`src/content/viz`) and data science projects (`src/content/projects`).
Every save is a commit; the deploy workflow runs the tests and design checks
before anything goes live. A step-by-step guide in Turkish is in
[docs/panel-rehberi.md](docs/panel-rehberi.md).
