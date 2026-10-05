import {
	BOOK_TITLE,
	bookChapters,
	bookRegister,
	figurenAnchor,
	infoAnchor,
	prefaceAnchor,
	registerAnchor,
	type BookChapter,
	type BookRegisterGroup,
} from './book';
import { gruppiereInfos, type Info, type InfoGruppe } from './infos';
import type { Recipe } from './recipes';

/** Die Abschnitte, die im Buch eigene Seiten bekommen. */
export type EpubArt = 'titel' | 'vorwort' | 'gestalten' | 'wissen' | 'rezept' | 'register';

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
	ebene: 0 | 1 | 2;
}

export interface EpubTeilBlatt extends EpubTeilBasis {
	art: 'titel' | 'vorwort' | 'gestalten' | 'register';
}

export interface EpubTeilWissen extends EpubTeilBasis {
	art: 'wissen';
	gruppe: InfoGruppe;
	info: Info;
}

export interface EpubTeilRezept extends EpubTeilBasis {
	art: 'rezept';
	kapitel: BookChapter;
}

export type EpubTeil = EpubTeilBlatt | EpubTeilWissen | EpubTeilRezept;

/**
 * Ein Teil ist ein Eintrag der Lesefolge, die im Buch, im EPUB und im
 * Inhaltsverzeichnis gleich ist. Das EPUB braucht je Teil eine eigene Datei,
 * weil ein Lesegerät nur zwischen Spinen-Einträgen blättern und springen kann;
 * die Druckfassung schreibt alles in eine Datei und überlässt die Aufteilung
 * Paged.js.
 *
 * Reihenfolge, Anker und Titel kommen aus `book.ts` und den Daten, damit keine
 * Ausgabe eine eigene Sortierung erfindet. Eine Wissensgruppe bekommt keine
 * eigene Datei, sie steht nur als Überschrift im Verzeichnis. Seitenzahlen gibt
 * es im EPUB nicht, das Register verweist deshalb auf Anker statt auf Blätter.
 */
export function epubTeile(rezepte: Recipe[], infos: Info[]): EpubTeil[] {
	const gruppen = gruppiereInfos(infos);
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

	for (const gruppe of gruppen) {
		for (const info of gruppe.infos) {
			teile.push({
				art: 'wissen',
				slug: infoAnchor(info.id),
				anker: infoAnchor(info.id),
				titel: info.codex_titel ?? info.titel,
				ebene: 2,
				gruppe,
				info,
			});
		}
	}

	for (const kapitel of bookChapters(rezepte)) {
		teile.push({
			art: 'rezept',
			slug: kapitel.anchor,
			anker: kapitel.anchor,
			titel: kapitel.recipe.codex_titel,
			ebene: 1,
			kapitel,
		});
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
	/** Teil, auf den die Gruppenüberschrift im Verzeichnis zeigt. */
	slugErsterEintrag: string;
}

export function epubGruppenKoepfe(teile: EpubTeil[]): EpubGruppenKopf[] {
	const koepfe: EpubGruppenKopf[] = [];

	for (const teil of teile) {
		if (teil.art !== 'wissen') continue;

		const letzter = koepfe.at(-1);
		if (letzter && letzter.slug === teil.gruppe.slug) continue;

		koepfe.push({
			slug: teil.gruppe.slug,
			label: teil.gruppe.label,
			slugErsterEintrag: teil.slug,
		});
	}

	return koepfe;
}

/** Verzeichnis der Rezepte, alphabetisch nach Zutat, wie im Buch. */
export function epubRegister(rezepte: Recipe[]): BookRegisterGroup[] {
	return bookRegister(bookChapters(rezepte));
}
