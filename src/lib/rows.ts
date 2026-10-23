// Splits a rendered write-up into the page's two-cell rows: each `<h2>`
// becomes a row's label and everything up to the next `<h2>` its body.
// Text before the first heading gets a label of its own, so a write-up with
// no headings at all is still one row.
//
// This works on the HTML the content layer has already rendered
// (`entry.rendered.html`). Markdown `##` headings always come out as
// top-level <h2> elements, so a split on them is exact here; it is not a
// general HTML parser and is not meant to be.

export type Row = { label: string; id?: string; html: string };

const H2 = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/g;

export function toRows(html: string): Row[] {
  const rows: Row[] = [];
  const heads = [...html.matchAll(H2)];
  const lead = (heads.length ? html.slice(0, heads[0].index) : html).trim();
  if (lead) rows.push({ label: heads.length ? 'Overview' : 'Write-up', html: lead });
  heads.forEach((m, i) => {
    const start = m.index! + m[0].length;
    const end = i + 1 < heads.length ? heads[i + 1].index! : html.length;
    const id = /\bid="([^"]+)"/.exec(m[1])?.[1];
    rows.push({ label: m[2].trim(), id, html: html.slice(start, end).trim() });
  });
  return rows;
}
