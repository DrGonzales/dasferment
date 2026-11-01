import type { ImageMetadata } from 'astro';
import type { Info } from './infos';
import { slugify, type Recipe } from './recipes';
import orderData from '../data/Kapitel.json';

type RawRecipe = Omit<Recipe, 'codex_titel'> & {
	codex_titel?: string;
	codex_titel_zeitung?: string;
	codex_titel_englisch?: string;
};

interface KapitelDatei {
	titel: string;
	beschreibung: string;
	rezepte: string;
	wissen: string;
	bilder: {
		actors: string;
		smallactors: string;
		kapitel: string[];
	};
}

export interface Chapter extends KapitelDatei {
	slug: string;
	recipes: Recipe[];
	infos: Info[];
	image?: ImageMetadata;
}

type JsonModule<T> = { default: T };

const dataModules = import.meta.glob<JsonModule<unknown>>('../data/*/*.json', {
	eager: true,
});

const chapterImages = import.meta.glob<JsonModule<ImageMetadata>>(
	'../pic/chapters/*.png',
	{ eager: true },
);

function dataAt<T>(path: string): T {
	const module = dataModules[path];
	if (!module) throw new Error(`Kapiteldatei fehlt: ${path}`);
	return module.default as T;
}

function chapterImageFor(file: string | undefined): ImageMetadata | undefined {
	if (!file) return undefined;
	const name = file.split('/').pop();
	return name ? chapterImages[`../pic/chapters/${name}`]?.default : undefined;
}

export const chapters: Chapter[] = orderData.reihenfolge.map((reference) => {
	const path = `../data/${reference}`;
	const config = dataAt<KapitelDatei>(path);
	const directory = path.slice(0, path.lastIndexOf('/'));
	const slug = reference.split('/')[0];
	const recipes = dataAt<RawRecipe[]>(`${directory}/${config.rezepte}`).map((recipe) => ({
		...recipe,
		codex_titel:
			recipe.codex_titel ??
			recipe.codex_titel_zeitung ??
			recipe.codex_titel_englisch ??
			recipe.titel,
		kapitel: slug,
	}));
	const infos = dataAt<{ infos: Info[] }>(`${directory}/${config.wissen}`).infos.map(
		(info) => ({ ...info, kapitel: slug }),
	);

	return {
		...config,
		slug,
		recipes,
		infos,
		image: chapterImageFor(config.bilder.kapitel[0]),
	};
});

export const allRecipes: Recipe[] = chapters.flatMap((chapter) => chapter.recipes);
export const allInfos: Info[] = chapters.flatMap((chapter) => chapter.infos);

export function chapterPath(chapter: Pick<Chapter, 'slug'>): string {
	return `/kapitel/${chapter.slug}/`;
}

export function chapterRecipesPath(chapter: Pick<Chapter, 'slug'>): string {
	return `${chapterPath(chapter)}rezepte/`;
}

export function chapterKnowledgePath(chapter: Pick<Chapter, 'slug'>): string {
	return `${chapterPath(chapter)}wissen/`;
}

export function recipePath(recipe: Pick<Recipe, 'titel' | 'kapitel'>): string {
	return `/kapitel/${recipe.kapitel}/rezepte/${slugify(recipe.titel)}/`;
}
