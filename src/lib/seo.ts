import { SITE_NAME } from './social';
import type { Recipe } from './recipes';

export interface TrailEntry {
	name: string;
	path: string;
}

export const META_DESCRIPTION_MAX = 155;

// Meta-Beschreibungen und Titles werden in Suchergebnissen abgeschnitten. Ein
// Umbruch am Wortende liest sich dann sauber, ein Bruch mitten im Wort nicht.
export function shorten(text: string, max = META_DESCRIPTION_MAX): string {
	const clean = text.replace(/\s+/g, ' ').trim();
	if (clean.length <= max) return clean;

	const cut = clean.slice(0, max - 1);
	const lastSpace = cut.lastIndexOf(' ');
	const head = (lastSpace > Math.floor(max / 2) ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:–-]+$/, '');
	return `${head} …`;
}

// Der sachliche Rezepttitel trägt die Suchbegriffe, die Kodex-Einleitung nur die
// Atmosphäre. Beides zusammen ergibt die Meta-Beschreibung der Rezeptseite.
export function recipeDescription(recipe: Pick<Recipe, 'titel' | 'codex_einleitung'>): string {
	const einleitung = recipe.codex_einleitung?.trim();
	return shorten(einleitung ? `${recipe.titel} – ${einleitung}` : recipe.titel);
}

export function siteObjects(homeUrl: string): object[] {
	return [
		{
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: SITE_NAME,
			url: homeUrl,
			inLanguage: 'de',
		},
		{
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: SITE_NAME,
			url: homeUrl,
		},
	];
}

export function breadcrumbObjects(trail: { name: string; url: string }[]): object {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: trail.map((entry, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: entry.name,
			item: entry.url,
		})),
	};
}

export function itemListObject(name: string, items: { name: string; url: string }[]): object {
	return {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name,
		numberOfItems: items.length,
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			url: item.url,
		})),
	};
}
