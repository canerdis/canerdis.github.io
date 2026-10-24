// Everything personal the site says about Caner lives here. Every claim is
// from his CV or from him directly. The phone number on the CV is
// deliberately absent: it does not belong on a public page.
export const SITE = {
  name: 'Caner Diş',
  // The about paragraph under the name, in Caner's own words. It is also the
  // page description that search results and shared links show.
  line:
    'I’m a final-year Statistics student in Istanbul. I work as a Pricing ' +
    'Assistant at MediaMarkt and as a data analyst at Europe Magazine, where I ' +
    'turn public data into analyses and charts for a 100K+ audience. I don’t ' +
    'just work with data; I try to understand the story behind it.',
  email: 'canerdis2004@gmail.com',
  // The strip under the hero. `live` puts the breathing dot before the value:
  // it marks the one fact that is about right now. `wide` cells take the full
  // row on a phone, where two half-width cells would not fit them.
  facts: [
    { k: 'Focus', v: 'Pricing & data science' },
    { k: 'Based', v: 'Istanbul, Türkiye' },
    { k: 'Now', v: 'Pricing at MediaMarkt', live: true, wide: true },
  ],
  // Shown under the sentence above, as part of the description.
  tools: 'Python, SQL, R · Power BI, Tableau, Flourish',
  links: [
    { label: 'Email', href: 'mailto:canerdis2004@gmail.com' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/canerdis' },
    { label: 'GitHub', href: 'https://github.com/canerdis' },
  ],
} as const;
