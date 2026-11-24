// @ts-check
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// `stand` ist das feste Änderungsdatum der Inhalte. Ein Build-Datum würde bei
// jedem Build alle URLs als neu melden, auch wenn sich kein Rezept geändert hat.
const { stand } = JSON.parse(
	readFileSync(fileURLToPath(new URL('./src/data/Kapitel.json', import.meta.url)), 'utf8'),
);

function metaContent(html, property) {
	const match = html.match(
		new RegExp(`<meta property="${property}" content="([^"]+)"`),
	);
	return match?.[1].replaceAll('&amp;', '&').replaceAll('&quot;', '"');
}

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
				const { pathname } = new URL(item.url);
				if (pathname.startsWith(`${basePath}rezepte/`)) {
					return undefined;
				}

				// Der Stream kennt `img`, der Typ der Integration ist enger.
				const result = /** @type {any} */ (item);
				result.lastmod = stand;

				const relative = decodeURIComponent(pathname.slice(basePath.length));
				const htmlPath = fileURLToPath(
					new URL(`./dist/${relative}index.html`, import.meta.url),
				);
				if (pathname.includes('/rezepte/') && existsSync(htmlPath)) {
					const html = readFileSync(htmlPath, 'utf8');
					const loc = metaContent(html, 'og:image');
					const alt = metaContent(html, 'og:image:alt');
					if (loc && alt) {
						result.img = [
							{
								url: loc,
								title: alt,
								caption: alt,
							},
						];
					}
				}
				return result;
			},
			chunks: {
				rezepte: (item) => (sitemapChunk(item) === 'rezepte' ? item : undefined),
				kategorien: (item) => (sitemapChunk(item) === 'kategorien' ? item : undefined),
			},
		}),
	],
});
