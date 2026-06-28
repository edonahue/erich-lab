import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const offlineFormat = z.object({
  type: z.enum(['html', 'zip', 'pdf']),
  label: z.string(),
  href: z.string().startsWith('/'),
  filename: z.string().optional(),
  note: z.string().optional(),
});

const experimentSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string(),
    summary: z.string(),
    status: z.enum(['Idea', 'Prototype', 'Active', 'Paused', 'Archived', 'Graduated']),
    kind: z.string(),
    technologies: z.array(z.string()).default([]),
    sourceUrl: z.string().url(),
    destinationUrl: z.string().url().optional(),
    published: z.boolean().default(false),
    featured: z.boolean().default(false),
    created: z.coerce.date(),
    updated: z.coerce.date(),
    image: z.string().optional(),
    offline: z
      .object({
        status: z.enum(['full', 'limited']),
        note: z.string().optional(),
        formats: z.array(offlineFormat).min(1),
      })
      .optional(),
  })
  .superRefine((data, context) => {
    if (data.updated < data.created) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['updated'],
        message: 'updated must be on or after created',
      });
    }
    if (data.status === 'Graduated' && !data.destinationUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destinationUrl'],
        message: 'Graduated experiments require a destination URL',
      });
    }
  });

const experiments = defineCollection({
  loader: glob({ base: './src/content/experiments', pattern: '**/*.{md,mdx}' }),
  schema: experimentSchema,
});

export const collections = { experiments };
