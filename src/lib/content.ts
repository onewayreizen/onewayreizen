import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from '../data/site';

// ------------------------------------------------------------
//  Hulpfuncties die de site gebruikt om regio's, landen,
//  plekken en thema's automatisch uit je artikelen te halen.
//  Hier hoef je normaal nooit iets te veranderen.
// ------------------------------------------------------------

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' en ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const DEFAULT_IMAGE = site.heroImage;

export type Post = {
  id: string;
  title: string;
  description: string;
  date: Date;
  image?: string;
  region: string;
  regionSlug: string;
  country: string;
  countrySlug: string;
  destination?: string;
  destinationSlug?: string;
  themes: { name: string; slug: string }[];
  url: string;
  entry: CollectionEntry<'posts'>;
};

export type CountryInfo = CollectionEntry<'countries'>['data'];
export type ThemeInfo = CollectionEntry<'themes'>['data'];

export type CountryGroup = {
  name: string;
  slug: string;
  url: string;
  regionName: string;
  regionSlug: string;
  posts: Post[];
  info?: CountryInfo;
  image?: string;
  destinations: { name: string; slug: string; count: number }[];
};

export type RegionGroup = {
  name: string;
  slug: string;
  url: string;
  posts: Post[];
  countries: CountryGroup[];
  image?: string;
};

export type ThemeGroup = {
  name: string;
  slug: string;
  url: string;
  posts: Post[];
  info?: ThemeInfo;
  image?: string;
};

export type SiteData = {
  posts: Post[];
  countries: CountryGroup[];
  regions: RegionGroup[];
  themes: ThemeGroup[];
};

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, 'nl');

const firstImage = (posts: Post[]) => posts.find((p) => p.image)?.image;

async function compute(): Promise<SiteData> {
  const [postEntries, countryEntries, themeEntries] = await Promise.all([
    getCollection('posts'),
    getCollection('countries'),
    getCollection('themes'),
  ]);

  // ---- Artikelen (nieuwste eerst) ----
  const posts: Post[] = postEntries
    .map((entry) => {
      const d = entry.data;
      const regionSlug = slugify(d.region);
      const countrySlug = slugify(d.country);
      return {
        id: entry.id,
        title: d.title,
        description: d.description,
        date: d.date,
        image: d.image,
        region: d.region.trim(),
        regionSlug,
        country: d.country.trim(),
        countrySlug,
        destination: d.destination?.trim(),
        destinationSlug: d.destination ? slugify(d.destination) : undefined,
        themes: d.themes
          .map((t) => ({ name: t.trim(), slug: slugify(t) }))
          .filter((t) => t.slug !== ''),
        url: `/bestemmingen/${regionSlug}/${countrySlug}/${entry.id}/`,
        entry,
      };
    })
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

  // ---- Landen ----
  const countryInfoBySlug = new Map<string, CountryInfo>(
    countryEntries.map((e) => [slugify(e.data.name), e.data]),
  );
  const countryMap = new Map<string, CountryGroup>();
  for (const post of posts) {
    const key = `${post.regionSlug}/${post.countrySlug}`;
    let group = countryMap.get(key);
    if (!group) {
      const info = countryInfoBySlug.get(post.countrySlug);
      if (!info) {
        console.warn(
          `[One Way Reizen] Let op: er is nog geen landbestand voor "${post.country}". ` +
            `Maak src/content/countries/${post.countrySlug}.md aan (zie COUNTRY_TEMPLATE.md), ` +
            `of controleer de spelling van "country:" in je artikel.`,
        );
      }
      group = {
        name: info?.name ?? post.country,
        slug: post.countrySlug,
        url: `/bestemmingen/${post.regionSlug}/${post.countrySlug}/`,
        regionName: post.region,
        regionSlug: post.regionSlug,
        posts: [],
        info,
        image: undefined,
        destinations: [],
      };
      countryMap.set(key, group);
    }
    group.posts.push(post);
  }
  const countries = [...countryMap.values()].sort(byName);
  for (const c of countries) {
    c.image = c.info?.image ?? firstImage(c.posts);
    const destMap = new Map<string, { name: string; slug: string; count: number }>();
    for (const p of c.posts) {
      if (!p.destination || !p.destinationSlug) continue;
      const existing = destMap.get(p.destinationSlug);
      if (existing) existing.count += 1;
      else destMap.set(p.destinationSlug, { name: p.destination, slug: p.destinationSlug, count: 1 });
    }
    c.destinations = [...destMap.values()].sort(byName);
  }

  // ---- Regio's ----
  const regionMap = new Map<string, RegionGroup>();
  for (const c of countries) {
    let region = regionMap.get(c.regionSlug);
    if (!region) {
      region = {
        name: c.regionName,
        slug: c.regionSlug,
        url: `/bestemmingen/${c.regionSlug}/`,
        posts: [],
        countries: [],
        image: undefined,
      };
      regionMap.set(c.regionSlug, region);
    }
    region.countries.push(c);
    region.posts.push(...c.posts);
  }
  const regions = [...regionMap.values()].sort(byName);
  for (const r of regions) {
    r.posts.sort((a, b) => b.date.valueOf() - a.date.valueOf());
    r.image = firstImage(r.posts);
  }

  // ---- Thema's ----
  const themeInfoBySlug = new Map<string, ThemeInfo>(
    themeEntries.map((e) => [slugify(e.data.name), e.data]),
  );
  const themeMap = new Map<string, ThemeGroup>();
  for (const post of posts) {
    for (const t of post.themes) {
      let group = themeMap.get(t.slug);
      if (!group) {
        const info = themeInfoBySlug.get(t.slug);
        group = {
          name: info?.name ?? t.name,
          slug: t.slug,
          url: `/jouw-avontuur/${t.slug}/`,
          posts: [],
          info,
          image: undefined,
        };
        themeMap.set(t.slug, group);
      }
      if (!group.posts.includes(post)) group.posts.push(post);
    }
  }
  const themes = [...themeMap.values()].sort(byName);
  for (const t of themes) {
    t.image = t.info?.image ?? firstImage(t.posts);
  }

  return { posts, countries, regions, themes };
}

let cache: Promise<SiteData> | undefined;

// Haalt alle gegevens één keer op en hergebruikt ze voor elke pagina
export function getData(): Promise<SiteData> {
  if (import.meta.env.DEV) return compute();
  if (!cache) cache = compute();
  return cache;
}
