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
	return tag;
}

export const GENERAL_TAG_LABEL = 'Gemüse';

// Das Ober-Tag steckt in fast jedem Rezept und sagt für Leser, interne Verlinkung
// und JSON-LD nichts. Der Vergleich läuft über den Slug, damit ein Umbenennen des
// Tags in den Daten nicht wieder an einem hart verdrahteten String scheitert.
const GENERAL_TAG_SLUG = slugify(GENERAL_TAG_LABEL);

export function isGeneralTag(tag: string): boolean {
	return slugify(tag) === GENERAL_TAG_SLUG;
}

export function hasGeneralTag(recipe: Pick<Recipe, 'tags'>): boolean {
	return recipe.tags.some(isGeneralTag);
}

// Verwandtschaft entsteht ausschließlich aus geteilten Tags, nie aus geratenem
// Ähnlichkeitsgefühl. Das Ober-Tag zählt nicht mit, sonst stünde hinter fast
// jedem Blatt dasselbe Blatt. Bei gleichem Ergebnis entscheidet der Titel,
// damit zwei Builds dieselbe Reihenfolge liefern.
export function relatedRecipes(
	recipe: Recipe,
	all: Recipe[],
	limit = 3,
): Recipe[] {
	const candidates = all
		.filter((candidate) => candidate.titel !== recipe.titel)
		.map((candidate) => {
			const sharedSpecific = candidate.tags.filter(
				(tag) => !isGeneralTag(tag) && recipe.tags.includes(tag),
			).length;
			const anyShared = candidate.tags.some((tag) => recipe.tags.includes(tag));
			return { candidate, sharedSpecific, anyShared };
		})
		.filter((entry) => entry.anyShared)
		.sort(
			(a, b) =>
				b.sharedSpecific - a.sharedSpecific ||
				a.candidate.titel.localeCompare(b.candidate.titel, 'de'),
		)
		.map((entry) => entry.candidate);

	return candidates.slice(0, limit);
}

const DURATION_UNITS: Record<string, number> = {
	minute: 1,
	minuten: 1,
	stunde: 60,
	stunden: 60,
	tag: 1440,
	tage: 1440,
	woche: 10080,
	wochen: 10080,
};

const DURATION_PATTERN =
	/(\d+)\s*(?:bis|–|—|-|to)?\s*(\d+)?\s*(Minuten|Stunde|Tage|Woche)/gi;

export function totalTimeIso(
	recipe: Pick<Recipe, 'zubereitung'>,
): string | undefined {
	const text = recipe.zubereitung.join(' ');
	let minutes = 0;

	for (const match of text.matchAll(DURATION_PATTERN)) {
		const unit = DURATION_UNITS[match[3].toLowerCase()];
		const upperBound = Number(match[2] ?? match[1]);
		if (unit && Number.isFinite(upperBound)) {
			minutes = Math.max(minutes, upperBound * unit);
		}
	}

	if (!minutes) return undefined;
	if (minutes % 1440 === 0) return `P${minutes / 1440}D`;
	if (minutes % 60 === 0) return `PT${minutes / 60}H`;
	return `PT${minutes}M`;
}
