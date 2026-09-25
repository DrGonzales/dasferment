import type { APIRoute } from 'astro';
import recipeData from '../data/das_ferment.json';
import { categorySlug, slugify, type Recipe } from '../lib/recipes';

const recipes = recipeData as Recipe[];

const recipePaths = recipes.map((recipe) => `/rezepte/${slugify(recipe.titel)}/`);
const categoryPaths = [...new Set(recipes.flatMap((recipe) => recipe.tags.map((tag) => `/kategorien/${categorySlug(tag)}/`)))];
const sitemapPaths = [
	'/',
	'/rezepte/',
	'/kategorien/',
	'/ueber-diese-seite/',
	'/impressum/',
	...recipePaths,
	...categoryPaths,
];

function escapeXml(value: string): string {
	return value.replace(/[<>&'\"]/g, (character) => {
		const entities: Record<string, string> = {
			'<': '&lt;',
			'>': '&gt;',
			'&': '&amp;',
			"'": '&apos;',
			'"': '&quot;',
		};
		return entities[character];
	});
}

export const prerender = true;

export const GET: APIRoute = ({ site, url }) => {
	const baseUrl = site ?? new URL(url.origin);
	const entries = sitemapPaths
		.map((path) => `  <url><loc>${escapeXml(new URL(path, baseUrl).toString())}</loc></url>`)
		.join('\n');

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
		{ headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
	);
};
