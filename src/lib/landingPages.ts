import landingData from '../data/Einstiegsseiten.json';
import { allInfos, allRecipes } from './chapters';
import { relatedInfos, type Info } from './infos';
import type { Recipe } from './recipes';

export interface LandingPage {
	slug: string;
	typ: 'kategorie' | 'saison';
	route: string;
	kapitel?: string[];
	saisons?: string[];
	h1: string;
	title: string;
	description: string;
	kicker: string;
	lead: string;
	reihenfolge: string[];
	wissen: string[];
}

export const landingPages: LandingPage[] = landingData.eintraege as unknown as LandingPage[];

const saisonWerte = new Set(
	landingPages.flatMap((page) => (page.typ === 'saison' ? (page.saisons ?? []) : [])),
);

for (const recipe of allRecipes) {
	const ungueltig = (recipe.saison ?? []).filter((saison) => !saisonWerte.has(saison));
	if (ungueltig.length > 0) {
		throw new Error(
			`Unbekannte Saison in „${recipe.titel}": ${ungueltig.join(', ')}`,
		);
	}
}

export function landingPageForRoute(route: string): LandingPage | undefined {
	return landingPages.find((page) => page.route === route);
}

export function landingsForChapter(slug: string): LandingPage[] {
	return landingPages.filter((page) => page.kapitel?.includes(slug));
}

export function landingsForSaison(saison: string): LandingPage[] {
	return landingPages.filter(
		(page) => page.typ === 'saison' && page.saisons?.includes(saison),
	);
}

export function withCount(text: string, count: number): string {
	const result = text.replaceAll('{anzahl}', String(count));
	if (result.includes('{anzahl}')) {
		throw new Error(`Nicht ersetzter Zähler im Einstiegsseiten-Text: ${text}`);
	}
	return result;
}

/** Genannte Rezepte zuerst in Datenreihenfolge, den Rest alphabetisch. */
export function orderedRecipes(recipes: Recipe[], names: string[]): Recipe[] {
	const byTitle = new Map(recipes.map((recipe) => [recipe.titel, recipe]));
	const missing = names.filter((name) => !byTitle.has(name));
	if (missing.length > 0) {
		throw new Error(`Fehlende Rezepte in Einstiegsseiten.json: ${missing.join(', ')}`);
	}
	const head = names.map((name) => byTitle.get(name)!);
	const tail = recipes
		.filter((recipe) => !names.includes(recipe.titel))
		.sort((a, b) => a.titel.localeCompare(b.titel, 'de'));
	return [...head, ...tail];
}

export function seasonalRecipes(page: LandingPage): Recipe[] {
	if (page.typ !== 'saison' || !page.saisons?.length) return [];
	const selected = allRecipes.filter((recipe) =>
		recipe.saison?.some((saison) => page.saisons!.includes(saison)),
	);
	return orderedRecipes(selected, page.reihenfolge);
}

/** Die Wissens-IDs einer Einstiegsseite; unbekannte IDs sind ein Datenfehler. */
export function landingInfos(page: LandingPage): Info[] {
	return relatedInfos({ titel: page.h1, wissen: page.wissen }, allInfos);
}
