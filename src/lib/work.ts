import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

// One index for everything Caner has made: published charts and analysis
// projects sit in the same list, told apart by their type label rather than
// by living on separate pages. Numbered oldest-first, so a number never
// changes when new work is added on top.
export type WorkItem = {
  id: string;
  collection: 'viz' | 'projects';
  no: string;
  date: Date;
  title: string;
  line: string;
  type: string;
  href: string;
  image?: ImageMetadata;
  alt?: string;
  source?: string;
  tools: string[];
};

type Entry = CollectionEntry<'viz'> | CollectionEntry<'projects'>;

function toItem(e: Entry): Omit<WorkItem, 'no'> {
  if (e.collection === 'viz') {
    return {
      id: e.id,
      collection: 'viz',
      date: e.data.date,
      title: e.data.title,
      line: e.data.summary,
      type: e.data.kind,
      // Entries without a write-up have no page of their own; their row
      // opens the chart itself.
      href: e.data.writeup ? `/visualizations/${e.id}` : e.data.chart.src,
      image: e.data.chart,
      alt: e.data.alt,
      source: e.data.source,
      tools: e.data.tools,
    };
  }
  return {
    id: e.id,
    collection: 'projects',
    date: e.data.date,
    title: e.data.title,
    line: e.data.summary,
    type: e.data.kind,
    href: `/data-science/${e.id}`,
    image: e.data.cover,
    alt: e.data.alt,
    tools: e.data.tools,
  };
}

let cache: WorkItem[] | undefined;

/** Every piece of work, newest first. */
export async function getWork(): Promise<WorkItem[]> {
  if (cache) return cache;
  const all = [...(await getCollection('viz')), ...(await getCollection('projects'))].map(toItem);
  const oldestFirst = [...all].sort((a, b) => a.date.valueOf() - b.date.valueOf());
  const width = Math.max(2, String(oldestFirst.length).length);
  const numbered = oldestFirst.map((it, i) => ({ ...it, no: String(i + 1).padStart(width, '0') }));
  cache = numbered.reverse();
  return cache;
}

/** The item after this one in reading order, wrapping to the newest. */
export function nextOf(items: WorkItem[], id: string): WorkItem {
  const i = items.findIndex((it) => it.id === id);
  return items[(i + 1) % items.length];
}

/** 2026-07-28 -> 2026.07 (index) or 2026.07.28 (detail). */
export function stamp(d: Date, withDay = false): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return withDay ? `${y}.${m}.${day}` : `${y}.${m}`;
}
