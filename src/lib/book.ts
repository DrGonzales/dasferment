import { categoryLabel, isGeneralTag, slugify, type Recipe } from './recipes';

export const BOOK_TITLE = 'Das Ferment';
export const BOOK_SUBTITLE = 'Aus der Küche der Geduld';

export interface BookChapter {
	recipe: Recipe;
	anchor: string;
	categories: string[];
}

export interface BookRegisterEntry {
	codexTitel: string;
	anchor: string;
}

export interface BookRegisterGroup {
	slug: string;
	label: string;
	entries: BookRegisterEntry[];
}

export function recipeAnchor(recipe: Pick<Recipe, 'titel'>): string {
	return `rezept-${slugify(recipe.titel)}`;
}

export function infoAnchor(id: string): string {
	return `wissen-${id}`;
}

export function groupAnchor(slug: string): string {
	return `gruppe-${slug}`;
}

export function registerAnchor(): string {
	return 'register';
}

export function prefaceAnchor(): string {
	return 'vorwort';
}

export function figurenAnchor(): string {
	return 'gestalten';
}

export function recipesAnchor(): string {
	return 'rezepte';
}

export function contentsAnchor(): string {
	return 'inhalt';
}

// Tags, die auf jedem Rezept stehen, bilden keine Kategorie, sondern nur den
// gemeinsamen Nenner. Das Register würde sonst alle Rezepte unter einem einzigen
// Eintrag wiederholen. Gezählt werden Rezepte, nicht Tag-Vorkommen, sonst macht
// ein doppeltes Tag ein seltenes Tag zum scheinbar gemeinsamen.
export function universalTags(recipes: Recipe[]): Set<string> {
	if (recipes.length === 0) return new Set();

	const counts = new Map<string, number>();

	for (const recipe of recipes) {
		for (const tag of new Set(recipe.tags)) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}

	return new Set(
		[...counts].filter(([, count]) => count === recipes.length).map(([tag]) => tag),
	);
}

// Das Ober-Tag steht fast auf jedem Blatt und würde Blatt für Blatt wiederholt,
// obwohl es keine Kategorie ist. Ein Rezept ohne Ober-Tag darf es deshalb nicht
// zum scheinbar gemeinsamen Tag machen.
function isBookCategory(tag: string, universal: Set<string>): boolean {
	return !universal.has(tag) && !isGeneralTag(tag);
}

export function bookChapters(recipes: Recipe[]): BookChapter[] {
	const universal = universalTags(recipes);

	return [...recipes]
		.sort((a, b) => a.titel.localeCompare(b.titel, 'de'))
		.map((recipe) => ({
			recipe,
			anchor: recipeAnchor(recipe),
			categories: recipe.tags
				.filter((tag) => isBookCategory(tag, universal))
				.map(categoryLabel),
		}));
}

export function bookRegister(chapters: BookChapter[]): BookRegisterGroup[] {
	const universal = universalTags(chapters.map((chapter) => chapter.recipe));
	const groups = new Map<string, BookRegisterGroup>();

	for (const chapter of chapters) {
		for (const tag of new Set(chapter.recipe.tags)) {
			if (!isBookCategory(tag, universal)) continue;

			const group = groups.get(tag) ?? {
				slug: slugify(tag),
				label: categoryLabel(tag),
				entries: [],
			};

			group.entries.push({ codexTitel: chapter.recipe.codex_titel, anchor: chapter.anchor });
			groups.set(tag, group);
		}
	}

	return [...groups.values()].sort(
		(a, b) => a.label.localeCompare(b.label, 'de'),
	);
}
