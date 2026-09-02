import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    region: z.string(),
    country: z.string(),
    destination: z.string().optional(),
    description: z.string(),
    date: z.string(),
    image: z.string().optional(),
    themes: z.array(z.string()).optional(),
  }),
});

const countries = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    capital: z.string().optional(),
    language: z.string().optional(),
    currency: z.string().optional(),
    flightTime: z.string().optional(),
    intro: z.string().optional(),
  }),
});

const themeInfo = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    intro: z.string().optional(),
  }),
});

export const collections = { posts, countries, themeInfo };
