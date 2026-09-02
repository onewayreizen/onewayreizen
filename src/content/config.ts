import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    region: z.string(),
    country: z.string(),
    description: z.string(),
    date: z.string(),
    country: z.string(),
    image: z.string().optional(),
    themes: z.array(z.string()).optional(),
  }),
});

export const collections = { posts };
