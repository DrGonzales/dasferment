import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { experimental_AstroContainer } from 'astro/container';
import infoData from '../../data/das_ferment_infos.json';
import recipeData from '../../data/das_ferment.json';
import { actorImageFor } from '../../lib/actorImages';
import { BOOK_SUBTITLE, BOOK_TITLE } from '../../lib/book';
import { epubRegister, epubTeile, type EpubTeil } from '../../lib/epub';
import { FIGUREN } from '../../lib/figuren';
import type { Info } from '../../lib/infos';
import { imageForRecipe } from '../../lib/pageImages';
import type { Recipe } from '../../lib/recipes';
import { assignPortraits, SMALL_ACTOR_SIZE } from '../../lib/smallActors';
import Gestalten from '../components/Gestalten.astro';
import Rezept from '../components/Rezept.astro';
import Register from '../components/Register.astro';
import Titelblatt from '../components/Titelblatt.astro';
import Vorwort from '../components/Vorwort.astro';
import Wissen from '../components/Wissen.astro';

const rezepte = recipeData as Recipe[];
const infos = infoData.infos as Info[];
const teile = epubTeile(rezepte, infos);

// Die Rezeptbilder stehen im Buch fast seitenhoch, im EPUB sind sie Beiwerk zum
// Text. Ein Reader zeigt sie höchstens in Spaltenbreite, und die meisten Geräte
// rechnen mit 600 bis 700 px. Mehr einzusparen macht die Strichzeichnung unscharf
// und das Archiv nur größer.
const REZEPT_BILD = 640;
const PORTRAIT_BILD = 224;

// Die Dateien der Lesefolge liegen in `EPUB/text/`, Bilder und Schriften eine Ebene
// darüber in `EPUB/`. Deshalb beginnt jeder Verweis aus einem Blatt mit `../`.
const ASSET_PFAD = '../';

// Der Einband wird von `make-epub.mjs` als `cover.jpg` abgelegt. Er steht hier
// deshalb als Pfad und nicht als Bild aus `astro:assets`, sonst emittierte der Build
// die Quelldatei ein zweites Mal, nur um sie dann nicht zu verwenden.
const COVER = { src: `${ASSET_PFAD}images/cover.jpg` };

interface Bild {
	src: string;
	breite: number;
	hoehe: number;
}

// Ohne `withoutEnlargement` vergrößert sharp; die Maße sind deshalb auf die Quelle
// begrenzt. Jedes Motiv wird einmal gerendert und dann geteilt, sonst rechnet sharp
// dieselben vierzig Bilder neununddreißigmal neu.
const vorgemerkteBilder = new Map<string, Promise<Bild | undefined>>();

function bild(
	image: ImageMetadata | undefined,
	breite: number,
	format: 'jpeg' | 'png' = 'jpeg',
): Promise<Bild | undefined> {
	if (!image) return Promise.resolve(undefined);

	const schluessel = `${image.src}-${breite}-${format}`;
	const vorgemerkt = vorgemerkteBilder.get(schluessel);
	if (vorgemerkt) return vorgemerkt;

	const ziel = Math.min(breite, image.width);
	const promise = getImage({
		src: image,
		width: ziel,
		format,
		quality: 75,
	}).then((ergebnis) => ({
		src: ASSET_PFAD + ergebnis.src.replace(/^\//, ''),
		breite: ergebnis.attributes.width,
		hoehe: ergebnis.attributes.height,
	}));

	vorgemerkteBilder.set(schluessel, promise);
	return promise;
}

// Die Wissensmotive liegen als PNG mit transparentem Grund vor. Als JPEG verliert
// sharp diese Durchsichtigkeit und füllt sie schwarz, deshalb bleiben sie PNG. Der
// Leser setzt sie auf die Seite, nicht auf Pergament.
const portraits = assignPortraits(infos);
const portraitNachId = new Map(infos.map((info, index) => [info.id, portraits[index]]));

const rezeptSlugNachAnker = new Map(
	teile.filter((teil) => teil.art === 'rezept').map((teil) => [teil.anker, teil.slug]),
);

const registerGruppen = epubRegister(rezepte).map((gruppe) => ({
	slug: gruppe.slug,
	label: gruppe.label,
	eintraege: gruppe.entries.map((eintrag) => ({
		titel: eintrag.codexTitel,
		slug: rezeptSlugNachAnker.get(eintrag.anchor) ?? '',
	})),
}));

const container = await experimental_AstroContainer.create();

async function propsFuer(teil: EpubTeil): Promise<Record<string, unknown>> {
	switch (teil.art) {
		case 'titel':
			return { cover: COVER, rezepte, infos };
		case 'vorwort':
			return { infos, rezepte };
		case 'gestalten':
			return {
				bilder: new Map(
					await Promise.all(
						FIGUREN.map(
							async (figur) =>
								[figur.id, await bild(actorImageFor(figur.sprecher), PORTRAIT_BILD)] as const,
						),
					),
				),
			};
		case 'wissen':
			return {
				info: teil.info,
				gruppenLabel: teil.gruppe.label,
				portrait: await bild(portraitNachId.get(teil.info.id), SMALL_ACTOR_SIZE, 'png'),
			};
		case 'rezept': {
			const ratschlag = teil.kapitel.recipe.ratgeber;

			return {
				teil,
				bild: await bild(imageForRecipe(teil.kapitel.recipe), REZEPT_BILD),
				portrait: ratschlag ? await bild(actorImageFor(ratschlag.sprecher), PORTRAIT_BILD) : undefined,
			};
		}
		case 'register':
			return {
				gruppen: registerGruppen,
				rezepte: rezepte.length,
				zutatengruppen: registerGruppen.length,
			};
	}
}

export function getStaticPaths() {
	return teile.map((teil) => ({ params: { slug: teil.slug }, props: { teil } }));
}

const KOMPONENTEN = {
	titel: Titelblatt,
	vorwort: Vorwort,
	gestalten: Gestalten,
	wissen: Wissen,
	rezept: Rezept,
	register: Register,
} as const;

export const GET = async ({ props }: { props: { teil: EpubTeil } }) => {
	const { teil } = props;
	const dokumentTitel = teil.art === 'titel' ? `${BOOK_TITLE}: ${BOOK_SUBTITLE}` : teil.titel;

	const body = await container.renderToString(KOMPONENTEN[teil.art], {
		props: await propsFuer(teil),
	});

	// Die Titelseite trägt den Einband als Bild und ist zugleich das erste Blatt.
	// `epub:type` unterscheidet sie damit von den reinen Textteilen.
	const epubType = teil.art === 'titel' ? 'cover' : 'bodymatter';

	// Astro serialisiert HTML, kein XHTML: leere Elemente schließt es nicht selbst.
	// `scripts/make-epub.mjs` liest genau diese Ausgabe und schließt sie beim Packen.
	const xhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="de" lang="de">
	<head>
		<meta charset="utf-8" />
		<title>${dokumentTitel}</title>
		<link rel="stylesheet" type="text/css" href="${ASSET_PFAD}styles/epub.css" />
	</head>
	<body epub:type="${epubType}" class="${teil.art}" id="${teil.anker}">
${body}
	</body>
</html>`;

	return new Response(xhtml, {
		headers: { 'content-type': 'application/xhtml+xml; charset=utf-8' },
	});
};