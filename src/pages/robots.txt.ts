import type { APIRoute } from 'astro';

export const prerender = true;

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const GET: APIRoute = ({ site, url }) => {
	const baseUrl = site ?? new URL(url.origin);
	// Der Index verweist auf die geteilten Sitemap-Dateien aus @astrojs/sitemap.
	const sitemapUrl = new URL(`${base}/sitemap-index.xml`, baseUrl).toString();

	return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
