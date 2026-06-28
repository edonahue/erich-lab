import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const offlineFormat = z.object({
  type: z.enum(['html', 'zip', 'pdf']),
  label: z.string(),
  href: z.string().startsWith('/'),
  filename: z.string().optional(),
  note: z.string().optional(),
});

const experiments = defineCollection({
  loader: glob({ base: './src/content/experiments', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string(),
    summary: z.string(),
    status: z.enum(['Idea', 'Prototype', 'Active', 'Paused', 'Archived']),
    kind: z.string(),
    technologies: z.array(z.string()).default([]),
    sourceUrl: z.string().url(),
    published: z.boolean().default(false),
    featured: z.boolean().default(false),
    created: z.coerce.date(),
    updated: z.coerce.date(),
    image: z.string().optional(),
    offline: z.object({
      status: z.enum(['full', 'limited']),
      note: z.string().optional(),
      formats: z.array(offlineFormat).min(1),
    }).optional(),
  }),
});

export const collections = { experiments };
