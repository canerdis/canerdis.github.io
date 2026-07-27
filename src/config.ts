// Bio drawn from CV_CanerDis_DataAnalyst.md. Every claim here is from that
// document — role, employer, coursework, location. Deliberately omitted: the
// phone number, which does not belong on a public page.
export const SITE = {
  name: 'Caner Diş',
  bio:
    'I am a statistics student in Istanbul and a data analyst at Europe Magazine, ' +
    'where I clean public datasets from Eurostat, the World Bank etc. and turn them ' +
    'into published charts and written analysis for an audience of over 100,000. ' +
    'I work mostly in Python and SQL, with Power BI, Tableau and Flourish for ' +
    'dashboards and visual storytelling, and spent an exchange semester at Ulm ' +
    'University of Applied Sciences studying machine learning, business analytics ' +
    'and data visualisation. I try to understand the story behind the data, which ' +
    'in practice is the unglamorous half of the job — checking whether a number ' +
    'survives contact with the raw data before anyone builds an argument on it.',
  links: [
    { label: 'Email', href: 'mailto:canerdis2004@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/canerdis' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/canerdis' },
  ],
} as const;
