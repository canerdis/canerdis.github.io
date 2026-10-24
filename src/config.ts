// Everything personal the site says about Caner. The words live in
// src/data/site.json so they can be edited in Pages CMS (see .pages.yml)
// without touching code; this file only gives them their shape. Every claim
// is from his CV or from him directly. The phone number on the CV is
// deliberately absent: it does not belong on a public page.
import data from './data/site.json' with { type: 'json' };

// One cell of the strip under the hero. `live` puts the breathing dot before
// the value: it marks the one fact that is about right now. `wide` takes the
// full row on a phone, where two half-width cells would not fit it.
export interface Fact { k: string; v: string; live?: boolean; wide?: boolean; href?: string }

export const SITE = {
  name: data.name,
  // The about paragraph under the name. It is also the page description that
  // search results and shared links show.
  line: data.line,
  // Shown under the paragraph, as part of the description.
  tools: data.tools,
  email: data.email,
  facts: data.facts as Fact[],
  links: [
    { label: 'Email', href: `mailto:${data.email}` },
    { label: 'LinkedIn', href: data.linkedin },
    { label: 'GitHub', href: data.github },
  ],
};
