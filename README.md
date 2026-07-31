# canerdis.github.io

Portfolio site. Charts I have published, and write-ups of two data projects.

Live at <https://canerdis.github.io>.

Built with Astro. The build ships no client-side JavaScript, so every page is
HTML and CSS by the time it reaches the browser.

The rule the whole site is built on: colour is reserved for data. The interface
is four greys, and every colour you see on a page comes from inside a chart
image. A lint step fails the build if any other colour reaches the CSS, which is
what stops that from quietly eroding.
