// Everything personal the site says about Caner lives here. Every claim is
// from his CV or from him directly. The phone number on the CV is
// deliberately absent: it does not belong on a public page.
export const SITE = {
  name: 'Caner Diş',
  // The one sentence under the name. Kept short on purpose: the facts strip
  // below it and the experience rows further down carry the specifics.
  line:
    'I work in pricing at MediaMarkt and make charts and written analysis ' +
    'from public data, many of them published by Europe Magazine.',
  // Used for <meta name="description"> and anywhere a longer bio is needed.
  bio:
    'Pricing assistant at MediaMarkt and final-year statistics student in ' +
    'Istanbul. I clean public datasets from statistical agencies and ' +
    'international organisations and publish them as charts and written ' +
    'analysis, many for Europe Magazine and its audience of over 100,000.',
  email: 'canerdis2004@gmail.com',
  // The strip under the hero. `live` puts the breathing dot before the value:
  // it marks the one fact that is about right now. `wide` cells take the full
  // row on a phone, where two half-width cells would not fit them.
  facts: [
    { k: 'Focus', v: 'Pricing & data analysis' },
    { k: 'Based', v: 'Istanbul, Türkiye' },
    { k: 'Now', v: 'Pricing at MediaMarkt', live: true, wide: true },
  ],
  // Reverse-chronological, matching the CV.
  experience: [
    { when: '2026 —', what: 'Pricing assistant', where: 'MediaMarkt' },
    { when: '2025 —', what: 'Data analyst', where: 'Europe Magazine' },
    { when: '2025–26', what: 'Exchange student, Computer Science', where: 'Ulm University of Applied Sciences' },
    { when: '2025', what: 'Student assistant, Research and Application Centres Office', where: 'Mimar Sinan Fine Arts University' },
    { when: '2024–25', what: 'Market research analyst', where: 'Cybele' },
    { when: '2023 —', what: 'BSc Statistics', where: 'Mimar Sinan Fine Arts University' },
  ],
  tools: 'Python, SQL, R · Power BI, Tableau, Flourish',
  links: [
    { label: 'Email', href: 'mailto:canerdis2004@gmail.com' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/canerdis' },
    { label: 'GitHub', href: 'https://github.com/canerdis' },
  ],
} as const;
