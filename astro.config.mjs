// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages serves this repository at https://drgonzales.github.io/dasferment/.
// The environment variables keep local and hosted builds configurable.
const site = process.env.PUBLIC_SITE_URL ?? 'https://drgonzales.github.io';
const base = process.env.PUBLIC_BASE_PATH ?? '/dasferment';

const basePath = `${base.replace(/\/$/, '')}/`;

// Die Sitemap wird aufgeteilt, damit Rezepte und Kategorien je eine eigene Datei
// bekommen. Was kein Chunk annimmt, legt die Integration selbst in
// sitemap-pages-0.xml ab.
const sitemapChunk = (page) => {
	const { pathname } = new URL(page.url);
	if (pathname.startsWith(`${basePath}kapitel/`) && pathname.includes('/rezepte/')) {
		return 'rezepte';
	}
	if (pathname.startsWith(`${basePath}kategorien/`)) return 'kategorien';
	return undefined;
};

// https://astro.build/config
export default defineConfig({
	site,
	base,
	integrations: [
		sitemap({
			// Die alten `/rezepte/<slug>/`-Weiterleitungen sind keine Inhalte,
			// sondern nur Kompatibilitätsblätter; sie gehören nicht in die Sitemap.
			serialize(item) {
				if (new URL(item.url).pathname.startsWith(`${basePath}rezepte/`)) {
					return undefined;
				}
				return item;
			},
			chunks: {
				rezepte: (item) => (sitemapChunk(item) === 'rezepte' ? item : undefined),
				kategorien: (item) => (sitemapChunk(item) === 'kategorien' ? item : undefined),
			},
		}),
	],
});
