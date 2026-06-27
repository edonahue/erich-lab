import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const experiments = defineCollection({
  loader: glob({ base: './src/content/experiments', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.string(),
    kind: z.string(),
    technologies: z.array(z.string()).default([]),
    launchPath: z.string(),
    sourceUrl: z.string().url(),
    featured: z.boolean().default(false),
    created: z.coerce.date(),
    updated: z.coerce.date(),
    image: z.string().optional(),
  }),
});

export const collections = { experiments };
