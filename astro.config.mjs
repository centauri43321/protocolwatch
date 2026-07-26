// @ts-check
import { defineConfig } from 'astro/config';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const CATEGORIES = ['dexes', 'lending', 'liquid-staking', 'bridges', 'derivatives', 'yield', 'privacy'];

// Scan every category's Markdown once, capturing the data both the redirects and sitemap need.
const contentEntries = CATEGORIES.flatMap(category => {
  const dir = fileURLToPath(new URL(`./src/content/${category}`, import.meta.url));
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const slug = file.replace(/\.md$/, '');
      const lastmod = readFileSync(`${dir}/${file}`, 'utf-8')
        .match(/^lastUpdated:\s*["']?([\d-]+)["']?/m)?.[1];
      return { category, file, slug, lastmod };
    });
});

// Redirect legacy `/category/slug.md` URLs (pre-cleanup) to clean `/category/slug`.
const legacyMdRedirects = Object.fromEntries(
  contentEntries.map(({ category, file, slug }) => [`/${category}/${file}`, `/${category}/${slug}`])
);

// Map `/category/slug` → `lastUpdated` date so the sitemap can emit accurate <lastmod>.
const lastmodByPath = Object.fromEntries(
  contentEntries
    .filter(({ lastmod }) => lastmod)
    .map(({ category, slug, lastmod }) => [`/${category}/${slug}`, lastmod])
);

// https://astro.build/config
export default defineConfig({
  site: 'https://protocolwatch.xyz',
  redirects: legacyMdRedirects,
  integrations: [
    sitemap({
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, '');
        const lastmod = lastmodByPath[path];
        if (lastmod) item.lastmod = new Date(lastmod).toISOString();
        return item;
      },
    }),
  ],
  server: {
    host: true
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
