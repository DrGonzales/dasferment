import {
	BOOK_TITLE,
	bookChapters,
	bookRegister,
	bookSections,
	chapterAnchor,
	figurenAnchor,
	infoAnchor,
	prefaceAnchor,
	registerAnchor,
	type BookChapter,
	type BookRegisterGroup,
	type BookSection,
} from './book';
import type { Chapter } from './chapters';
import type { Info, InfoGruppe } from './infos';
import type { Recipe } from './recipes';

/** Die Abschnitte, die im Buch eigene Seiten bekommen. */
export type EpubArt =
	| 'titel'
	| 'vorwort'
	| 'gestalten'
	| 'kapitel'
	| 'wissen'
	| 'rezept'
	| 'register';

interface EpubTeilBasis {
	/**
	 * Der inhaltliche Anker aus `book.ts` ist zugleich der Dateiname des Blattes im
	 * EPUB. Ein zweiter Name für dieselbe Sache wäre nur eine Stelle mehr, an der
	 * Buch und EPUB auseinanderlaufen können.
	 */
	slug: string;
	anker: string;
	titel: string;
	/** Tiefe im Inhaltsverzeichnis des Lesegeräts. */
	ebene: 0 | 1 | 2 | 3;
}

export interface EpubTeilBlatt extends EpubTeilBasis {
	art: 'titel' | 'vorwort' | 'gestalten' | 'register';
}

export interface EpubTeilKapitel extends EpubTeilBasis {
	art: 'kapitel';
	abschnitt: BookSection;
}

export interface EpubTeilWissen extends EpubTeilBasis {
	art: 'wissen';
	gruppe: InfoGruppe;
	info: Info;
	kapitelSlug: string;
}

export interface EpubTeilRezept extends EpubTeilBasis {
	art: 'rezept';
	kapitel: BookChapter;
}

export type EpubTeil = EpubTeilBlatt | EpubTeilKapitel | EpubTeilWissen | EpubTeilRezept;

/**
 * Ein Teil ist ein Eintrag der Lesefolge, die im Buch, im EPUB und im
 * Inhaltsverzeichnis gleich ist. Das EPUB braucht je Teil eine eigene Datei,
 * weil ein Lesegerät nur zwischen Spinen-Einträgen blättern und springen kann;
 * die Druckfassung schreibt alles in eine Datei und überlässt die Aufteilung
 * Paged.js.
 *
 * Jedes Kapitel beginnt mit einem eigenen Blatt, danach folgen seine Rezepte und
 * zuletzt sein Wissen. Reihenfolge, Anker und Titel kommen aus `book.ts` und den
 * Daten, damit keine Ausgabe eine eigene Sortierung erfindet.
 */
export function epubTeile(chapters: Chapter[]): EpubTeil[] {
	const teile: EpubTeil[] = [
		{
			art: 'titel',
			slug: 'titel',
			anker: 'titel',
			titel: BOOK_TITLE,
			ebene: 0,
		},
		{
			art: 'vorwort',
			slug: prefaceAnchor(),
			anker: prefaceAnchor(),
			titel: 'Vorwort: Was die Geduld lehrt',
			ebene: 0,
		},
		{
			art: 'gestalten',
			slug: figurenAnchor(),
			anker: figurenAnchor(),
			titel: 'Connie und Katze',
			ebene: 0,
		},
	];

	for (const abschnitt of bookSections(chapters)) {
		teile.push({
			art: 'kapitel',
			slug: chapterAnchor(abschnitt.config.slug),
			anker: chapterAnchor(abschnitt.config.slug),
			titel: abschnitt.config.titel,
			ebene: 1,
			abschnitt,
		});

		for (const folio of abschnitt.recipes) {
			teile.push({
				art: 'rezept',
				slug: folio.anchor,
				anker: folio.anchor,
				titel: folio.recipe.codex_titel,
				ebene: 2,
				kapitel: folio,
			});
		}

		for (const gruppe of abschnitt.gruppen) {
			for (const info of gruppe.infos) {
				teile.push({
					art: 'wissen',
					slug: infoAnchor(info.id),
					anker: infoAnchor(info.id),
					titel: info.codex_titel ?? info.titel,
					ebene: 3,
					gruppe,
					info,
					kapitelSlug: abschnitt.config.slug,
				});
			}
		}
	}

	teile.push({
		art: 'register',
		slug: registerAnchor(),
		anker: registerAnchor(),
		titel: 'Register der Rezepte',
		ebene: 0,
	});

	return teile;
}

export interface EpubGruppenKopf {
	slug: string;
	label: string;
	/** Tiefe der Gruppenüberschrift im Inhaltsverzeichnis. */
	ebene: 2;
	/** Teil, auf den die Gruppenüberschrift im Verzeichnis zeigt. */
	slugErsterEintrag: string;
}

export function epubGruppenKoepfe(teile: EpubTeil[]): EpubGruppenKopf[] {
	const koepfe: EpubGruppenKopf[] = [];
	let letzterSchluessel = '';

	for (const teil of teile) {
		if (teil.art !== 'wissen') continue;

		const schluessel = `${teil.kapitelSlug}:${teil.gruppe.slug}`;
		if (schluessel === letzterSchluessel) continue;

		koepfe.push({
			slug: teil.gruppe.slug,
			label: teil.gruppe.label,
			ebene: 2,
			slugErsterEintrag: teil.slug,
		});
		letzterSchluessel = schluessel;
	}

	return koepfe;
}

/** Verzeichnis der Rezepte, alphabetisch nach Zutat, wie im Buch. */
export function epubRegister(rezepte: Recipe[]): BookRegisterGroup[] {
	return bookRegister(bookChapters(rezepte));
}
