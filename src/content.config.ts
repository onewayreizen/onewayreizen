import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Een tekstveld dat leeg mag zijn (een lege regel in je bestand geeft dan geen foutmelding)
const optionalText = z.string().nullish().transform((v) => (v ? v : undefined));

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z
    .object({
      title: z.string(),
      // Regio en land mag je weglaten voor een algemeen artikel (bijv. "scooter huren")
      region: optionalText,
      country: optionalText,
      // Optioneel: andere landen waar dit artikel ook bij hoort, bijv. [Chili]
      otherCountries: z
        .union([z.array(z.string()), z.string()])
        .nullish()
        .transform((v) => (Array.isArray(v) ? v : v ? [v] : [])),
      destination: optionalText,
      description: z.string().nullish().transform((v) => v ?? ''),
      // Werkt met en zonder aanhalingstekens: 2026-01-01 of "2026-01-01"
      date: z.coerce.date(),
      image: optionalText,
      themes: z.array(z.string()).nullish().transform((v) => v ?? []),
    })
    .refine((d) => !d.country || d.region, {
      message:
        'Je hebt een land (country:) ingevuld maar geen regio (region:). Vul allebei in, of laat allebei weg voor een algemeen artikel.',
      path: ['region'],
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
