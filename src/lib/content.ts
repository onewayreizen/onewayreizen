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
  otherCountries: string[];
  destination?: string;
  destinationSlug?: string;
  themes: { name: string; slug: string }[];
  hasCountry: boolean;
  url: string;
  entry: CollectionEntry<'posts'>;
};

export type CountryInfo = CollectionEntry<'countries'>['data'];
export type ThemeInfo = CollectionEntry<'themes'>['data'];
export type RegionInfo = CollectionEntry<'regions'>['data'];

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
  generalPosts: Post[];
  countries: CountryGroup[];
  info?: RegionInfo;
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
  const [postEntries, countryEntries, themeEntries, regionEntries] = await Promise.all([
    getCollection('posts'),
    getCollection('countries'),
    getCollection('themes'),
    getCollection('regions'),
  ]);

  // ---- Artikelen (nieuwste eerst) ----
  const posts: Post[] = postEntries
    .map((entry) => {
      const d = entry.data;
      const regionName = d.region?.trim() ?? '';
      const countryName = d.country?.trim() ?? '';
      const regionSlug = slugify(regionName);
      const countrySlug = slugify(countryName);
      const hasCountry = countrySlug !== '';
      const fileSlug = entry.id.split('/').pop() ?? entry.id;
      return {
        id: entry.id,
        title: d.title,
        description: d.description,
        date: d.date,
        image: d.image,
        region: regionName,
        regionSlug,
        country: countryName,
        countrySlug,
        otherCountries: d.otherCountries.map((c) => c.trim()).filter((c) => c !== ''),
        destination: d.destination?.trim(),
        destinationSlug: d.destination ? slugify(d.destination) : undefined,
        themes: d.themes
          .map((t) => ({ name: t.trim(), slug: slugify(t) }))
          .filter((t) => t.slug !== ''),
        hasCountry,
        url: hasCountry
          ? `/bestemmingen/${regionSlug}/${countrySlug}/${fileSlug}/`
          : `/artikelen/${fileSlug}/`,
        entry,
      };
    })
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

  // ---- Landen ----
  const countryInfoBySlug = new Map<string, CountryInfo>(
    countryEntries.map((e) => [slugify(e.data.name), e.data]),
  );
  const countryMap = new Map<string, CountryGroup>();

  function createGroup(
    regionSlug: string,
    regionName: string,
    countrySlug: string,
    countryName: string,
  ): CountryGroup {
    const info = countryInfoBySlug.get(countrySlug);
    if (!info) {
      console.warn(
        `[One Way Reizen] Let op: er is nog geen landbestand voor "${countryName}". ` +
          `Maak src/content/countries/${countrySlug}.md aan (zie COUNTRY_TEMPLATE.md), ` +
          `of controleer de spelling van "country:" in je artikel.`,
      );
    }
    const group: CountryGroup = {
      name: info?.name ?? countryName,
      slug: countrySlug,
      url: `/bestemmingen/${regionSlug}/${countrySlug}/`,
      regionName,
      regionSlug,
      posts: [],
      info,
      image: undefined,
      destinations: [],
    };
    countryMap.set(`${regionSlug}/${countrySlug}`, group);
    return group;
  }

  // Ronde 1: elk artikel bij zijn eigen land
  for (const post of posts) {
    if (!post.hasCountry) continue;
    const group =
      countryMap.get(`${post.regionSlug}/${post.countrySlug}`) ??
      createGroup(post.regionSlug, post.region, post.countrySlug, post.country);
    group.posts.push(post);
  }

  // Ronde 2: artikelen die ook bij andere landen horen (otherCountries)
  for (const post of posts) {
    if (!post.hasCountry) continue;
    for (const otherName of post.otherCountries) {
      const otherSlug = slugify(otherName);
      if (!otherSlug || otherSlug === post.countrySlug) continue;
      const group =
        [...countryMap.values()].find((g) => g.slug === otherSlug) ??
        createGroup(post.regionSlug, post.region, otherSlug, otherName);
      if (!group.posts.includes(post)) group.posts.push(post);
    }
  }
  const countries = [...countryMap.values()].sort(byName);
  for (const c of countries) {
    c.posts.sort((a, b) => b.date.valueOf() - a.date.valueOf());
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
  const regionInfoBySlug = new Map<string, RegionInfo>(
    regionEntries.map((e) => [slugify(e.data.name), e.data]),
  );
  const regionMap = new Map<string, RegionGroup>();

  function getRegion(slug: string, name: string): RegionGroup {
    let region = regionMap.get(slug);
    if (!region) {
      const info = regionInfoBySlug.get(slug);
      region = {
        name: info?.name ?? name,
        slug,
        url: `/bestemmingen/${slug}/`,
        posts: [],
        generalPosts: [],
        countries: [],
        info,
        image: undefined,
      };
      regionMap.set(slug, region);
    }
    return region;
  }

  for (const c of countries) {
    const region = getRegion(c.regionSlug, c.regionName);
    region.countries.push(c);
    for (const p of c.posts) {
      if (!region.posts.includes(p)) region.posts.push(p);
    }
  }
  // Algemene artikelen met wel een regio maar geen land (bijv. "scooter huren in Zuidoost-Azië")
  for (const post of posts) {
    if (post.hasCountry || !post.regionSlug) continue;
    const region = getRegion(post.regionSlug, post.region);
    region.generalPosts.push(post);
    region.posts.push(post);
  }
  const regions = [...regionMap.values()].sort(byName);
  for (const r of regions) {
    r.posts.sort((a, b) => b.date.valueOf() - a.date.valueOf());
    r.image = r.info?.image ?? firstImage(r.posts);
    for (const c of r.countries) c.regionName = r.name;
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
