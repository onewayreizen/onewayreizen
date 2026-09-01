import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    region: z.string(),
    description: z.string(),
    date: z.string(),
  }),
});

export const collections = { posts };
