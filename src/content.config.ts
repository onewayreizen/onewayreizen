import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Een tekstveld dat leeg mag zijn (een lege regel in je bestand geeft dan geen foutmelding)
const optionalText = z.string().nullish().transform((v) => (v ? v : undefined));

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    region: z.string(),
    country: z.string(),
    destination: optionalText,
    // Optioneel: andere landen waar dit artikel ook bij hoort, bijv. [Chili]
    otherCountries: z
      .union([z.array(z.string()), z.string()])
      .nullish()
      .transform((v) => (Array.isArray(v) ? v : v ? [v] : [])),
    description: z.string().nullish().transform((v) => v ?? ''),
    // Werkt met en zonder aanhalingstekens: 2026-01-01 of "2026-01-01"
    date: z.coerce.date(),
    image: optionalText,
    themes: z.array(z.string()).nullish().transform((v) => v ?? []),
  }),
});

const countries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/countries' }),
  schema: z.object({
    name: z.string(),
    capital: optionalText,
    language: optionalText,
    currency: optionalText,
    flightTime: optionalText,
    reisperiode: optionalText,
    intro: optionalText,
    image: optionalText,
  }),
});

const themes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/themes' }),
  schema: z.object({
    name: z.string(),
    intro: optionalText,
    image: optionalText,
  }),
});

const regions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/regions' }),
  schema: z.object({
    name: z.string(),
    intro: optionalText,
    image: optionalText,
  }),
});

export const collections = { posts, countries, themes, regions };
