import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const viz = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/viz' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      summary: z.string(),
      chart: image(),
      // Required, unconditionally: a viz entry's image IS the content.
      alt: z.string().min(1),
      source: z.string().optional(),
      tools: z.array(z.string()).default([]),
      // true => a detail page is generated. Exists so gallery items without
      // something to say do not acquire thin one-paragraph stub pages.
      writeup: z.boolean().default(false),
      featured: z.boolean().default(false),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        date: z.coerce.date(),
        summary: z.string(),
        cover: image().optional(),
        alt: z.string().optional(),
        tools: z.array(z.string()).default([]),
        repo: z.string().url().optional(),
        featured: z.boolean().default(false),
      })
      // Conditionally required: optional with no cover, mandatory with one.
      // A plain .optional() would let a cover ship with no alt text.
      .refine((d) => !d.cover || (d.alt !== undefined && d.alt.length > 0), {
        message: 'alt is required when cover is present',
        path: ['alt'],
      }),
});

export const collections = { viz, projects };
