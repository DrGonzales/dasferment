import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';
import { parseDocument } from 'htmlparser2';
import { render } from 'dom-serializer';
import sharp from 'sharp';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const buildDir = join(projectRoot, 'dist-epub');
const manifestFile = join(buildDir, 'epub-manifest.json');
const outFile = join(buildDir, 'das-ferment.epub');

// Aufbau des Archivs. Die Blätter liegen eine Ebene tiefer als Bilder, Schriften und
// Styles, deshalb beginnt jeder Verweis in einem Blatt mit `../`. Die Ordnernamen
// sind deshalb nicht frei wählbar: `src/epub/` schreibt genau diese Pfade in die
// Blätter, und hier landen die Dateien genau dort.
const OCF_ROOT = 'EPUB';
const TEXT_DIR = `${OCF_ROOT}/text`;
const IMAGE_DIR_BIN = 'images';
const FONT_DIR = `${OCF_ROOT}/fonts`;
const STYLE_FILE = `${OCF_ROOT}/styles/epub.css`;
const NAV_FILE = `${OCF_ROOT}/nav.xhtml`;
const OPF_FILE = `${OCF_ROOT}/content.opf`;

// Jeder Verweis aus einem Blatt, der auf eine von sharp erzeugte Bilddatei zeigt.
// Das Cover und seine Rückseite sind hier nicht gemeint, die liegen unverändert in
// `src/pic/cover/` und werden weiter unten einzeln eingetragen.
const VERWEIS_AUF_ASSET = /\.\.\/assets\/[\w.-]+/g;

// Der Einband und seine Rückseite liegen als PNG im Repository. Sie haben keinen
// transparenten Grund, und als PNG wiegen die beiden über 6 MB, mehr als der Rest
// des Buchs. Deshalb werden sie hier einmal zu JPEG. Die Motive der Wissensseiten
// behalten ihren transparenten Grund und bleiben PNG.
// Im Archiv heißen die Dateien so, wie `src/epub/` sie in den Blättern anspricht.
// Das OPF liegt selbst in `EPUB/`, seine Verweise beginnen deshalb ohne den
// Ordnernamen des Archivs.
const COVER_QUELLE = 'src/pic/cover/front.png';
const RUECKSEITE_QUELLE = 'src/pic/cover/back.png';
const COVER_ZIEL = `${OCF_ROOT}/${IMAGE_DIR_BIN}/cover.jpg`;
const RUECKSEITE_ZIEL = `${OCF_ROOT}/${IMAGE_DIR_BIN}/cover-rueckseite.jpg`;

// Nur die vier Schriften, die `src/epub/styles/epub.css` wirklich lädt. Cinzel
// wird in halbfett nicht gebraucht, EB Garamond in keinem Schnitt.
const SCHRIFTEN = [
	'Cinzel-Regular.ttf',
	'EBGaramond-Italic.ttf',
	'EBGaramond-Regular.ttf',
	'EBGaramond-SemiBold.ttf',
];
const LIZENZEN = ['OFL-Cinzel.txt', 'OFL-EBGaramond.txt'];

const MEDIEN = {
	'.css': 'text/css',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	// Der Medientyp einer TrueType-Schrift im EPUB 3. epubcheck meldet dafür
	// trotzdem ein `INFO(CSS-007)` über einen nicht standardisierten Schrifttyp.
	// Das trifft jede eingebettete TTF und lässt sich nicht vermeiden, solange die
	// Schriften TTF sind. Fehler und Warnungen bleiben davon unberührt.
	'.ttf': 'application/font-sfnt',
};

const SPRACHE = 'de';

function medienTyp(pfad) {
	const typ = MEDIEN[pathExtension(pfad)];
	if (!typ) throw new Error(`kein Medientyp für ${pfad}`);
	return typ;
}

function pathExtension(pfad) {
	const punkt = pfad.lastIndexOf('.');
	return punkt < 0 ? '' : pfad.slice(punkt).toLowerCase();
}

function xmlWert(wert) {
	return String(wert)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

/**
 * Astro liefert HTML, kein XHTML: leere Elemente wie `<meta>` und `<img>` schließt
 * es nicht selbst, und `alt=""` steht dort ohne Wert. Der HTML-Parser stellt die
 * Verschachtelung wieder her, der Serializer schließt leere Elemente mit `/>` und
 * behält leere Attributwerte. Ohne diesen Schritt meldet jeder Leser die Datei als
 * kaputt, weil XHTML keine offenen Elemente kennt.
 *
 * Geparst wird im HTML-Modus, geschrieben wird im XML-Modus: der Parser ist
 * nachsichtig mit leeren Elementen, der XML-Modus streng bei Attributwerten.
 * `encodeEntities: 'utf8'` hält Umlaute als UTF-8 statt sie als Zahlenwerte zu
 * schreiben.
 */
function alsXhtml(html) {
	const ohneDeklaration = html.replace(/^<\?xml[^?]*\?>\s*/, '');
	const dokument = parseDocument(ohneDeklaration, { decodeEntities: true });

	return `<?xml version="1.0" encoding="utf-8"?>\n${render(dokument, {
		xmlMode: true,
		selfClosingTags: true,
		decodeEntities: true,
		encodeEntities: 'utf8',
	})}\n`;
}

/**
 * Das Verzeichnis entsteht aus derselben Teileiste wie die Dateien im Archiv. Eine
 * Wissensgruppe hat keine eigene Datei, ihre Überschrift zeigt deshalb auf den
 * ersten Eintrag der Gruppe. Das entspricht dem Sprungmarkenverzeichnis der
 * Wissensseite, das ebenfalls nur vorhandene Anker nennt.
 */
function navigation(teile, gruppenKoepfe) {
	const eintraege = [];

	for (const teil of teile) {
		for (const kopf of gruppenKoepfe) {
			if (kopf.slugErsterEintrag === teil.slug) {
				eintraege.push({ titel: kopf.label, slug: teil.slug, ebene: 1 });
			}
		}
		eintraege.push({ titel: teil.titel, slug: teil.slug, ebene: teil.ebene });
	}

	const verschachtelt = [];
	let stapel = [];

	for (const eintrag of eintraege) {
		while (stapel.length > eintrag.ebene) stapel.pop();
		if (stapel.length !== eintrag.ebene) {
			throw new Error(`Verzeichnisstufe ${eintrag.ebene} passt nicht zu ${eintrag.slug}`);
		}

		const knoten = { ...eintrag, kinder: [] };
		if (stapel.length === 0) {
			verschachtelt.push(knoten);
		} else {
			stapel[stapel.length - 1].kinder.push(knoten);
		}
		stapel.push(knoten);
	}

	function zeichne(knoten, tiefe) {
		const einrueckung = '\t'.repeat(tiefe);
		const zeilen = knoten.map((kind) => {
			const verweis = `<a href="text/${kind.slug}.xhtml">${xmlWert(kind.titel)}</a>`;
			if (kind.kinder.length === 0) return `${einrueckung}<li>${verweis}</li>`;
			return [
				`${einrueckung}<li>${verweis}`,
				zeichne(kind.kinder, tiefe + 1),
				`${einrueckung}</li>`,
			].join('\n');
		});

		return `${'\t'.repeat(tiefe)}<ol>\n${zeilen.join('\n')}\n${'\t'.repeat(tiefe)}</ol>`;
	}

	return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${SPRACHE}" lang="${SPRACHE}">
	<head>
		<meta charset="utf-8" />
		<title>Inhalt</title>
	</head>
	<body>
	<nav epub:type="toc" id="inhalt">
		<h1>Inhalt</h1>
${zeichne(verschachtelt, 2)}
	</nav>
	</body>
</html>
`;
}

function opf(teile, bildHrefs, rezepte, wissensEintraege) {
	const manifest = [
		// Der Einband ist zugleich das Bild auf der Titelseite. Deshalb steht er
		// einmal als `cover-image`, damit das Cover benannt ist, und einmal als
		// gewöhnliches Bild, weil die Titelseite es anzeigt. Ohne die zweite Zeile
		// läge das Bild im Archiv, aber nicht im Manifest.
		`\t\t<item id="cover" href="${opfVerweis(COVER_ZIEL)}" media-type="image/jpeg" properties="cover-image" />`,
		`\t\t<item id="cover-rueckseite" href="${opfVerweis(RUECKSEITE_ZIEL)}" media-type="image/jpeg" />`,
		...teile.map(
			(teil) =>
				`\t\t<item id="${teil.anker}" href="text/${teil.slug}.xhtml" media-type="application/xhtml+xml" />`,
		),
		...bildHrefs.map(
			(href) =>
				`\t\t<item id="${kennung(`bild-${basename(href)}`)}" href="${opfVerweis(href)}" media-type="${medienTyp(href)}" />`,
		),
		...SCHRIFTEN.map(
			(schrift) =>
				`\t\t<item id="schrift-${basename(schrift, '.ttf')}" href="fonts/${schrift}" media-type="${medienTyp(schrift)}" />`,
		),
		// Die Lizenz der Schriften gehört ins Buch, weil die Schriften mit OFL
		// weitergegeben werden. epubcheck meldet jede Datei im Archiv, die nicht im
		// Manifest steht, deshalb stehen die Lizenzen ausdrücklich drin.
		...LIZENZEN.map(
			(lizenz) => `\t\t<item id="lizenz-${basename(lizenz, '.txt')}" href="fonts/${lizenz}" media-type="text/plain" />`,
		),
		`\t\t<item id="stil" href="styles/epub.css" media-type="text/css" />`,
		`\t\t<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />`,
	];

	const spine = teile.map((teil) => `\t\t<itemref idref="${teil.anker}" />`).join('\n');

	return `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="${SPRACHE}">
	<!-- Die Kennung einer Verfeinerung muss über das ganze OPF eindeutig sein und darf
	     nicht mit einer Manifest-Kennung kollidieren. Das Titelblatt heisst titel,
	     deshalb tragen die Verfeinerungen das Präfix meta-. -->
	<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
		<dc:identifier id="uid">${xmlWert(IDENTIFIER)}</dc:identifier>
		<dc:title id="meta-titel">${xmlWert(TITEL)}</dc:title>
		<meta refines="#meta-titel" property="title-type">main</meta>
		<dc:title id="meta-untertitel">${xmlWert(UNTERTITEL)}</dc:title>
		<meta refines="#meta-untertitel" property="title-type">subtitle</meta>
		<dc:language>${SPRACHE}</dc:language>
		<dc:description>${xmlWert(
			`${rezepte} Rezepte und ${wissensEintraege} Einträge aus dem Wissen, geschrieben in den Blättern eines Kodex.`,
		)}</dc:description>
		<dc:creator id="meta-herausgeber">Das Ferment</dc:creator>
		<meta refines="#meta-herausgeber" property="role" scheme="marc:relators">aut</meta>
		<meta refines="#meta-herausgeber" property="role" scheme="marc:relators">pbl</meta>
		<meta property="dcterms:modified">${MODIFIZIERT}</meta>
	</metadata>
	<manifest>
${manifest.join('\n')}
	</manifest>
	<spine>
${spine}
	</spine>
</package>
`;
}

function container() {
	return `<?xml version="1.0" encoding="utf-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
	<rootfiles>
		<rootfile full-path="${OPF_FILE}" media-type="application/oebps-package+xml" />
	</rootfiles>
</container>
`;
}

/**
 * Das OPF liegt selbst in `EPUB/`. Seine Verweise beginnen deshalb ohne den
 * Ordnernamen des Archivs, die Einträge im ZIP aber mit.
 */
function opfVerweis(pfad) {
	return pfad.startsWith(`${OCF_ROOT}/`) ? pfad.slice(OCF_ROOT.length + 1) : pfad;
}

/** Eine `id` im OPF ist ein XML-Name: keine Punkte, keine Ziffer am Anfang. */
function kennung(wert) {
	return wert.replace(/[^\w-]+/g, '-');
}

function basename(pfad, endung) {
	const name = pfad.split('/').pop() ?? '';
	return endung && name.endsWith(endung) ? name.slice(0, -endung.length) : name;
}

const CRC_TABELLE = (() => {
	const tabelle = new Uint32Array(256);
	for (let n = 0; n < 256; n += 1) {
		let wert = n;
		for (let bit = 0; bit < 8; bit += 1) {
			wert = wert & 1 ? 0xedb88320 ^ (wert >>> 1) : wert >>> 1;
		}
		tabelle[n] = wert >>> 0;
	}
	return tabelle;
})();

function crc32(daten) {
	let wert = 0xffffffff;
	for (const byte of daten) wert = CRC_TABELLE[(wert ^ byte) & 0xff] ^ (wert >>> 8);
	return (wert ^ 0xffffffff) >>> 0;
}

/**
 * Der `mimetype`-Eintrag muss im Archiv ganz vorn stehen und unkomprimiert bleiben,
 * sonst erkennen Leser und Validator die Datei nicht als EPUB. Deshalb entsteht
 * das Archiv von Hand: erst dieser Eintrag, dann alle übrigen mit Kompression.
 */
function schreibeZip(eintraege) {
	const lokal = [];
	const zentral = [];
	let versatz = 0;

	for (const eintrag of eintraege) {
		const name = Buffer.from(eintrag.name, 'utf8');
		const roh = eintrag.daten;
		const daten = eintrag.store ? roh : deflateRawSync(roh, { level: 9 });
		const pruefsumme = crc32(roh);

		const kopf = Buffer.alloc(30);
		kopf.writeUInt32LE(0x04034b50, 0);
		kopf.writeUInt16LE(20, 4);
		kopf.writeUInt16LE(0x0800, 6);
		kopf.writeUInt16LE(eintrag.store ? 0 : 8, 8);
		kopf.writeUInt16LE(0, 10);
		kopf.writeUInt16LE(0x21, 12);
		kopf.writeUInt32LE(pruefsumme, 14);
		kopf.writeUInt32LE(daten.length, 18);
		kopf.writeUInt32LE(roh.length, 22);
		kopf.writeUInt16LE(name.length, 26);
		kopf.writeUInt16LE(0, 28);

		lokal.push(kopf, name, daten);

		const eintragKopf = Buffer.alloc(46);
		eintragKopf.writeUInt32LE(0x02014b50, 0);
		eintragKopf.writeUInt16LE(20, 4);
		eintragKopf.writeUInt16LE(20, 6);
		eintragKopf.writeUInt16LE(0x0800, 8);
		eintragKopf.writeUInt16LE(eintrag.store ? 0 : 8, 10);
		eintragKopf.writeUInt16LE(0, 12);
		eintragKopf.writeUInt16LE(0x21, 14);
		eintragKopf.writeUInt32LE(pruefsumme, 16);
		eintragKopf.writeUInt32LE(daten.length, 20);
		eintragKopf.writeUInt32LE(roh.length, 24);
		eintragKopf.writeUInt16LE(name.length, 28);
		eintragKopf.writeUInt32LE(versatz, 42);

		zentral.push(eintragKopf, name);
		versatz += kopf.length + name.length + daten.length;
	}

	const zentralPuffer = Buffer.concat(zentral);
	const ende = Buffer.alloc(22);
	ende.writeUInt32LE(0x06054b50, 0);
	ende.writeUInt16LE(eintraege.length, 8);
	ende.writeUInt16LE(eintraege.length, 10);
	ende.writeUInt32LE(zentralPuffer.length, 12);
	ende.writeUInt32LE(versatz, 16);

	return Buffer.concat([...lokal, zentralPuffer, ende]);
}

const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
const IDENTIFIER = manifest.identifier;
const MODIFIZIERT = manifest.modifiziert;
const TITEL = manifest.titel;
const UNTERTITEL = manifest.untertitel;

const buildDateien = await readdir(buildDir, { recursive: true, withFileTypes: true });
const blattDateien = buildDateien.filter((datei) => datei.isFile() && datei.name.endsWith('.xhtml'));

if (blattDateien.length === 0) throw new Error(`keine XHTML-Dateien in ${buildDir}`);

const blaetter = await Promise.all(
	blattDateien.map(async (datei) => ({
		slug: datei.name.slice(0, -'.xhtml'.length),
		xhtml: alsXhtml(await readFile(join(datei.parentPath, datei.name), 'utf8')),
	})),
);

const vorhanden = new Set(blaetter.map((blatt) => blatt.slug));
const fehlend = manifest.teile.filter((teil) => !vorhanden.has(teil.slug));
const ueberzaehlig = blaetter.filter((blatt) => !manifest.teile.some((teil) => teil.slug === blatt.slug));

if (fehlend.length > 0 || ueberzaehlig.length > 0) {
	throw new Error(
		[
			fehlend.length > 0 ? `im Build fehlen: ${fehlend.map((teil) => teil.slug).join(', ')}` : '',
			ueberzaehlig.length > 0
				? `im Build ohne Teileiste: ${ueberzaehlig.map((blatt) => blatt.slug).join(', ')}`
				: '',
		]
			.filter(Boolean)
			.join(' / '),
	);
}

/**
 * Der Build legt neben den bearbeiteten Bildern auch die unoptimierten Originale
 * aus `src/pic/` in `assets/` ab, weil `import.meta.glob` sie einbindet. Deshalb
 * zählt nicht, was im Ordner liegt, sondern was die Blätter wirklich anzeigen: nur
 * diese Dateien wandern ins Archiv, ein Waisenbild nicht.
 */
const assetHrefs = [
	...new Set(
		blaetter.flatMap((blatt) => [...blatt.xhtml.matchAll(VERWEIS_AUF_ASSET)].map((treffer) => treffer[0])),
	),
]
	.sort()
	.map((verweis) => `${OCF_ROOT}/${verweis.slice('../'.length)}`);

// Cover und Rückseite stehen schon als eigene Manifest-Zeilen oben. Sie dürfen nicht
// ein zweites Mal über die Bildliste ins Manifest, sonst hätte das Archiv zwei
// Einträge auf dieselbe Datei.
const bildHrefs = assetHrefs;

const rezepte = manifest.teile.filter((teil) => teil.art === 'rezept').length;
const wissensEintraege = manifest.teile.filter((teil) => teil.art === 'wissen').length;

const eintraege = [
	{ name: 'mimetype', daten: Buffer.from('application/epub+zip', 'utf8'), store: true },
	{ name: 'META-INF/container.xml', daten: Buffer.from(container(), 'utf8') },
	{
		name: OPF_FILE,
		daten: Buffer.from(opf(manifest.teile, bildHrefs, rezepte, wissensEintraege), 'utf8'),
	},
	{
		name: NAV_FILE,
		daten: Buffer.from(navigation(manifest.teile, manifest.gruppenKoepfe), 'utf8'),
	},
	{ name: STYLE_FILE, daten: await readFile(join(projectRoot, 'src/epub/styles/epub.css')) },
	{
		name: COVER_ZIEL,
		daten: await sharp(join(projectRoot, COVER_QUELLE))
			.jpeg({ quality: 88, mozjpeg: true })
			.toBuffer(),
	},
	{
		name: RUECKSEITE_ZIEL,
		daten: await sharp(join(projectRoot, RUECKSEITE_QUELLE))
			.jpeg({ quality: 88, mozjpeg: true })
			.toBuffer(),
	},
];

for (const blatt of blaetter.sort((a, b) => a.slug.localeCompare(b.slug))) {
	eintraege.push({ name: `${TEXT_DIR}/${blatt.slug}.xhtml`, daten: Buffer.from(blatt.xhtml, 'utf8') });
}

for (const href of assetHrefs) {
	eintraege.push({
		name: href,
		daten: await readFile(join(buildDir, href.replace(`${OCF_ROOT}/`, ''))),
	});
}

for (const name of [...SCHRIFTEN, ...LIZENZEN]) {
	eintraege.push({ name: `${FONT_DIR}/${name}`, daten: await readFile(join(projectRoot, 'src/book/fonts', name)) });
}

const zip = schreibeZip(eintraege);
await rm(outFile, { force: true });
await writeFile(outFile, zip);

console.log(
	[
		'das-ferment.epub',
		`${manifest.teile.length} Blätter`,
		`${manifest.gruppenKoepfe.length} Wissensgruppen`,
		`${bildHrefs.length + 2} Bilder`,
		`${SCHRIFTEN.length} Schriften`,
		`${(zip.length / 1024 / 1024).toFixed(1)} MB`,
	].join(', '),
);