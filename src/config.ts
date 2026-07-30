// Bio drawn from the CV. Every claim here is from that document: role,
// employer, coursework, location. Deliberately omitted: the phone number,
// which does not belong on a public page.
//
// `bio` is the lead paragraph; `facts` is the scannable block beside it, the
// same split the CV makes between its summary and its dated entries. Keeping
// them separate means the prose can stay short without losing the specifics.
export const SITE = {
  name: 'Caner Diş',
  bio:
    'Final-year statistics student in Istanbul and a data analyst at Europe ' +
    'Magazine, where I clean public datasets from statistical agencies, ' +
    'international organisations and industry sources and publish them as ' +
    'charts and written analysis for an audience over 100,000. ' +
    'I don’t just work with data; I try to understand the story behind it.',
  // Dated, newest first, because that is what a CV is: claims you can place in
  // time. The years also make the left column mean the same thing here as it
  // does in the work list below — when — instead of two grids that look alike
  // and encode different things.
  // Education and work in one reverse-chronological list, matching the CV.
  // They are not split into two blocks because the left column already means
  // one thing across the whole page — when — and two parallel lists would
  // make the same rail carry two separate timelines.
  facts: [
    { when: '2025 —', what: 'Data analyst, Europe Magazine' },
    { when: '2025–26', what: 'Exchange student, Computer Science, Ulm University of Applied Sciences' },
    { when: '2025', what: 'Student assistant, Research and Application Centres Office, Mimar Sinan Fine Arts University' },
    { when: '2024–25', what: 'Market research analyst, Cybele' },
    { when: '2023 —', what: 'BSc Statistics, Mimar Sinan Fine Arts University' },
  ],
  tools: 'Python, SQL, R · Power BI, Tableau, Flourish',
  // Portrait shown beside the intro, masked to a circle in CSS. The source is
  // already cropped square and centred on the face, so no object-position
  // nudge is needed — a wide photo would have been cropped on the sides only,
  // leaving the face sitting high in the circle.
  portrait: { alt: 'Caner Diş' },
  links: [
    { label: 'Email', href: 'mailto:canerdis2004@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/canerdis' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/canerdis' },
  ],
} as const;
