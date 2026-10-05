import recipeData from '../../data/das_ferment.json';
import infoData from '../../data/das_ferment_infos.json';
import { BOOK_SUBTITLE, BOOK_TITLE } from '../../lib/book';
import { epubGruppenKoepfe, epubRegister, epubTeile } from '../../lib/epub';
import { FIGUREN } from '../../lib/figuren';
import type { Info } from '../../lib/infos';
import type { Recipe } from '../../lib/recipes';

const rezepte = recipeData as Recipe[];
const infos = infoData.infos as Info[];

const teile = epubTeile(rezepte, infos);
const rezeptSlugNachAnker = new Map(
	teile.filter((teil) => teil.art === 'rezept').map((teil) => [teil.anker, teil.slug]),
);

/**
 * Feste Kennung und festes Änderungsdatum, keine Zufallswerte. Sonst baut jeder
 * Durchlauf eine andere Datei, und ein Lesegerät erkennt dieselbe Kennung mit
 * neuerem Datum als neue Version.
 */
const IDENTIFIER = 'urn:uuid:8f3d6c1a-2b47-4e90-9a1c-5d2f7b6e84c3';
const MODIFIZIERT = '2024-01-01T00:00:00Z';

/**
 * `scripts/make-epub.mjs` läuft als reines Node-Skript und kann `src/lib/epub.ts`
 * nicht importieren. Deshalb schreibt der Build die Teileiste hier als JSON neben die
 * Blätter, und das Skript packt genau die Reihenfolge, die im Buch und auf der
 * Website gilt. Die Quelle bleibt `src/lib/epub.ts`, dieses Dokument ist nur ihre
 * Ablesestelle für den Packer.
 */
export const GET = () => {
	const manifest = {
		identifier: IDENTIFIER,
		modifiziert: MODIFIZIERT,
		titel: BOOK_TITLE,
		untertitel: BOOK_SUBTITLE,
		sprache: 'de',
		gestalten: FIGUREN.map((figur) => ({ id: figur.id, name: figur.name })),
		teile: teile.map((teil) => ({
			art: teil.art,
			slug: teil.slug,
			anker: teil.anker,
			titel: teil.titel,
			ebene: teil.ebene,
		})),
		gruppenKoepfe: epubGruppenKoepfe(teile),
		register: epubRegister(rezepte).map((gruppe) => ({
			slug: gruppe.slug,
			label: gruppe.label,
			eintraege: gruppe.entries.map((eintrag) => ({
				titel: eintrag.codexTitel,
				slug: rezeptSlugNachAnker.get(eintrag.anchor) ?? '',
			})),
		})),
	};

	return new Response(JSON.stringify(manifest, null, '\t'), {
		headers: { 'content-type': 'application/json; charset=utf-8' },
	});
};