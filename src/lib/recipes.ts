export interface RecipeAdvisor {
	sprecher: string;
	text: string;
}

export interface Recipe {
	titel: string;
	tags: string[];
	zutaten: string[];
	zubereitung: string[];
	picture: string | null;
	codex_titel: string;
	codex_einleitung?: string;
	ratgeber?: RecipeAdvisor;
}

export function slugify(value: string): string {
	return value
		.replaceAll('ß', 'ss')
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/&/g, ' und ')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function recipeImageAlt(recipe: Pick<Recipe, 'titel'>): string {
	return `Buchmalerei zum Rezept „${recipe.titel}“`;
}

export function categorySlug(tag: string): string {
	return slugify(tag);
}

export function categoryLabel(tag: string): string {
	return tag === 'gemuese' ? 'Gemüse' : tag;
}
