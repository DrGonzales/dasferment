/**
 * Prüft das fertige EPUB an der Quelle, also an der Datei, die ausgeliefert wird.
 *
 * Warum nicht nur epubcheck: Der Validator kennt die Spezifikation, aber nicht die
 * Regeln dieses Projekts. Er meldet keine doppelte `id` in einem Blatt, keinen
 * Anker im Verzeichnis, der auf keine Datei zeigt, keine Schrift im Archiv, die
 * das Stylesheet nicht lädt, und kein Bild im Manifest, das keine Seite anzeigt.
 * Genau das sind die Fehler, die beim Umbau von Blättern entstehen.
 *
 * Aufruf: node scripts/epub-pruefen.mjs [--kein-epubcheck]
 * Rückgabewert 0 bei bestandener Prüfung, 1 bei Befunden.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { inflateRawSync } from 'node:zlib';

const ausführen = promisify(execFile);

const wurzel = resolve(fileURLToPath(new URL('..', import.meta.url)));
const epubDatei = join(wurzel, 'dist-epub', 'das-ferment.epub');
const jar = join(wurzel, 'node_modules', 'epub-check', 'lib', 'epubcheck', 'epubcheck.jar');
const ohneValidator = process.argv.includes('--kein-epubcheck');

const OCF_ROOT = 'EPUB';
const TEXT_DIR = `${OCF_ROOT}/text`;

const fehler = [];
const notizen = [];

function pruefe(bedingung, meldung) {
	if (!bedingung) fehler.push(meldung);
	return bedingung;
}

/**
 * Liest das ZIP selbst. Es ist ein reines Archiv ohne Komplexität: lokale Kopfzeilen,
 * ein Inhaltsverzeichnis am Ende, keine Verschlüsselung. Der erste Eintrag liegt
 * immer unkomprimiert vorn, deshalb lässt sich `deflateRaw` nur bei den anderen
 * anwenden.
 */
function liesZip(daten) {
	const eintraege = new Map();
	let versatz = 0;

	while (daten.readUInt32LE(versatz) === 0x04034b50) {
		const verfahren = daten.readUInt16LE(versatz + 8);
		const groesse = daten.readUInt32LE(versatz + 18);
		const namensLaenge = daten.readUInt16LE(versatz + 26);
		const zusatzLaenge = daten.readUInt16LE(versatz + 28);
		const name = daten.toString('utf8', versatz + 30, versatz + 30 + namensLaenge);
		const beginn = versatz + 30 + namensLaenge + zusatzLaenge;
		const roh = daten.subarray(beginn, beginn + groesse);

		eintraege.set(name, verfahren === 0 ? roh : inflateRawSync(roh));
		versatz = beginn + groesse;
	}

	return eintraege;
}

function text(eintraege, name) {
	const inhalt = eintraege.get(name);
	return inhalt ? inhalt.toString('utf8') : null;
}

/** Alle `href`- und `src`-Ziele eines Dokuments, als Rohwerte. */
function verweise(quelle) {
	return [...quelle.matchAll(/(?:href|src)="([^"]*)"/g)].map((treffer) => treffer[1]);
}

if (!existsSync(epubDatei)) {
	console.error('dist-epub/das-ferment.epub fehlt. Zuerst `npm run make:epub` ausführen.');
	process.exit(1);
}

const dateien = liesZip(await readFile(epubDatei));
const namen = [...dateien.keys()];

notizen.push(`${namen.length} Einträge, ${((await readFile(epubDatei)).length / 1024 / 1024).toFixed(1)} MB`);

// Der `mimetype`-Eintrag muss ganz vorn stehen und unkomprimiert bleiben, sonst
// erkennen Leser und Validator die Datei nicht als EPUB. Das ist die häufigste
// Ursache dafür, dass eine sonst korrekte Datei nicht geöffnet wird.
const zipRoh = await readFile(epubDatei);
pruefe(zipRoh.readUInt32LE(0) === 0x04034b50, 'kein gültiger ZIP-Kopf');
pruefe(namen[0] === 'mimetype', `erster Eintrag ist ${namen[0]} statt mimetype`);
pruefe(text(dateien, 'mimetype') === 'application/epub+zip', 'mimetype hat den falschen Inhalt');
pruefe(zipRoh.readUInt16LE(8) === 0, 'mimetype ist komprimiert, muss unkomprimiert bleiben');
pruefe(zipRoh.toString('utf8', 30, 30 + zipRoh.readUInt16LE(26)) === 'mimetype', 'mimetype ohne Namen');

const opfRoh = text(dateien, `${OCF_ROOT}/content.opf`);
pruefe(opfRoh !== null, 'content.opf fehlt');

const container = text(dateien, 'META-INF/container.xml') ?? '';
pruefe(
	container.includes(`full-path="${OCF_ROOT}/content.opf"`),
	'container.xml zeigt nicht auf EPUB/content.opf',
);

const opf = opfRoh ?? '';
const MEDIEN_BILD = /^image\//;
const manifestZeilen = [...opf.matchAll(/<item\s([^>]*)\/>/g)].map((treffer) => treffer[1]);
const spineIds = [...opf.matchAll(/<itemref\s+idref="([^"]*)"/g)].map((treffer) => treffer[1]);

const manifest = manifestZeilen.map((attribute) => ({
	id: /id="([^"]*)"/.exec(attribute)?.[1] ?? '',
	href: /href="([^"]*)"/.exec(attribute)?.[1] ?? '',
	typ: /media-type="([^"]*)"/.exec(attribute)?.[1] ?? '',
	properties: /properties="([^"]*)"/.exec(attribute)?.[1] ?? '',
}));

const doppelteIds = manifest.map((eintrag) => eintrag.id).filter((id, index, alle) => alle.indexOf(id) !== index);
pruefe(doppelteIds.length === 0, `doppelte id im Manifest: ${[...new Set(doppelteIds)].join(', ')}`);

const doppelteHrefs = manifest.map((eintrag) => eintrag.href).filter((href, index, alle) => alle.indexOf(href) !== index);
pruefe(doppelteHrefs.length === 0, `doppelter Verweis im Manifest: ${[...new Set(doppelteHrefs)].join(', ')}`);

for (const eintrag of manifest) {
	pruefe(eintrag.id !== '', 'Manifest-Eintrag ohne id');
	pruefe(eintrag.typ !== '', `Manifest-Eintrag ${eintrag.id} ohne media-type`);
	pruefe(
		dateien.has(`${OCF_ROOT}/${eintrag.href}`),
		`Manifest nennt eine fehlende Datei: ${eintrag.href}`,
	);
}

// Ein Cover muss benannt sein, sonst zeigt der Reader kein Cover an, sondern nur das
// erste Bild, das ihm begegnet.
const cover = manifest.find((eintrag) => eintrag.properties.split(/\s+/).includes('cover-image'));
pruefe(cover !== undefined, 'kein Manifest-Eintrag mit properties="cover-image"');
pruefe(
	manifest.some((eintrag) => eintrag.properties.split(/\s+/).includes('nav')),
	'kein Manifest-Eintrag mit properties="nav"',
);

const navName = manifest.find((eintrag) => eintrag.properties.split(/\s+/).includes('nav'))?.href;
const nav = navName ? text(dateien, `${OCF_ROOT}/${navName}`) : null;
pruefe(nav !== null, 'nav.xhtml fehlt');
const blaetter = namen.filter((name) => name.startsWith(`${TEXT_DIR}/`) && name.endsWith('.xhtml'));
pruefe(blaetter.length > 0, 'keine Blätter im Archiv');

const manifestBlattIds = new Set(manifest.filter((e) => e.href.startsWith('text/')).map((e) => e.href));
for (const blatt of blaetter) {
	const href = blatt.slice(`${OCF_ROOT}/`.length);
	pruefe(manifestBlattIds.has(href), `Blatt ohne Manifest-Eintrag: ${href}`);
}
for (const href of manifestBlattIds) {
	pruefe(
		dateien.has(`${OCF_ROOT}/${href}`),
		`Manifest nennt ein fehlendes Blatt: ${href}`,
	);
}

for (const idref of spineIds) {
	pruefe(
		manifest.some((eintrag) => eintrag.id === idref),
		`Spine verweist auf unbekannte id: ${idref}`,
	);
}
pruefe(spineIds.length === blaetter.length, `Spine hat ${spineIds.length} Einträge, es gibt ${blaetter.length} Blätter`);

// Doppelte `id` innerhalb eines Blatts, tote Anker, nicht aufgelöste Verweise und
// Bilder ohne Manifest-Eintrag. Genau hier entstehen die Fehler beim Umbau.
const benutzteAssets = new Set();
const toteAnker = new Set();

for (const blatt of blaetter) {
	const quelle = text(dateien, blatt) ?? '';

	pruefe(quelle.startsWith('<?xml'), `${blatt} beginnt ohne XML-Deklaration`);
	pruefe(/<!DOCTYPE html>/.test(quelle), `${blatt} ohne DOCTYPE`);
	pruefe(/<html[^>]+xmlns:epub="http:\/\/www\.idpf\.org\/2007\/ops"/.test(quelle), `${blatt} ohne epub-Namensraum`);
	pruefe(/<h1[\s>]/.test(quelle), `${blatt} ohne Überschrift`);
	pruefe(!/<img(?![^>]*\balt=)/.test(quelle), `${blatt} hat ein Bild ohne alt-Attribut`);

	const ids = [...quelle.matchAll(/\sid="([^"]*)"/g)].map((treffer) => treffer[1]);
	const doppelt = ids.filter((id, index) => ids.indexOf(id) !== index);
	pruefe(doppelt.length === 0, `${blatt} doppelte id: ${[...new Set(doppelt)].join(', ')}`);

	for (const ziel of verweise(quelle)) {
		if (/^(https?:|mailto:|data:)/.test(ziel)) continue;

		const aufgeloest = ziel.startsWith('../')
			? `${OCF_ROOT}/${ziel.slice('../'.length)}`
			: `${TEXT_DIR}/${ziel}`;

		pruefe(dateien.has(aufgeloest), `${blatt} zeigt auf eine fehlende Datei: ${ziel}`);

		if (ziel.startsWith('#')) {
			const zielId = ziel.slice(1);
			if (!ids.includes(zielId)) toteAnker.add(`${blatt} → ${ziel}`);
		}
		if (ziel.startsWith('../assets/') || ziel.startsWith('../images/')) {
			benutzteAssets.add(`${OCF_ROOT}/${ziel.slice('../'.length)}`);
		}
	}
}

// Die Wissensseiten tragen Motive, die keine Ratgeber sind, und umgekehrt. Beide
// Gruppen tragen dasselbe Motiv mehrmals, das ist beabsichtigt und kein Fehler.
for (const eintrag of manifest.filter((eintrag) => MEDIEN_BILD.test(eintrag.typ))) {
	if (eintrag.id === 'cover-rueckseite') continue;
	if (!benutzteAssets.has(`${OCF_ROOT}/${eintrag.href}`)) {
		fehler.push(`Bild im Manifest, das kein Blatt anzeigt: ${eintrag.href}`);
	}
}

const stil = text(dateien, `${OCF_ROOT}/styles/epub.css`) ?? '';
const geladeneSchriften = [...stil.matchAll(/url\(["']?\.\.\/fonts\/([^"')]+)["']?\)/g)].map(
	(treffer) => treffer[1],
);
const schriftEintraege = manifest.filter((eintrag) => eintrag.href.startsWith('fonts/'));

pruefe(geladeneSchriften.length > 0, 'das Stylesheet lädt keine Schrift');

for (const schrift of new Set(geladeneSchriften)) {
	pruefe(dateien.has(`${OCF_ROOT}/fonts/${schrift}`), `Schrift fehlt im Archiv: ${schrift}`);
	pruefe(
		schriftEintraege.some((eintrag) => eintrag.href === `fonts/${schrift}`),
		`Schrift nicht im Manifest: ${schrift}`,
	);
}

for (const eintrag of schriftEintraege) {
	const name = eintrag.href.replace('fonts/', '');
	if (name.endsWith('.ttf') && !geladeneSchriften.includes(name)) {
		fehler.push(`Schrift im Archiv, die das Stylesheet nicht lädt: ${name}`);
	}
}

// Das Register verweist auf Rezepte. Trägt ein Eintrag keinen Verweis, zeigt er ins
// Leere, weil es kein Blatt mit diesem Anker gibt.
const registerBlatt = blaetter.find((name) => name.endsWith('/register.xhtml'));
if (registerBlatt) {
	const quelle = text(dateien, registerBlatt) ?? '';
	const rezepte = blaetter.filter((name) => name.includes('/rezept-')).length;
	const verweiseImRegister = verweise(quelle).filter((ziel) => ziel.endsWith('.xhtml'));
	notizen.push(`Register verweist auf ${verweiseImRegister.length} Einträge bei ${rezepte} Rezepten`);
}

// Das Inhaltsverzeichnis nennt jeden Sprung, und jeder Sprung muss es geben. Die
// Navigation liegt in `EPUB/`, ihre Verweise beginnen deshalb mit `text/`, während
// die Verweise aus einem Blatt mit `../` beginnen.
if (nav) {
	const navZiele = new Set(verweise(nav));

	for (const ziel of navZiele) {
		pruefe(dateien.has(`${OCF_ROOT}/${ziel}`), `Inhaltsverzeichnis zeigt auf eine fehlende Datei: ${ziel}`);
	}

	for (const blatt of blaetter) {
		const name = blatt.slice(`${TEXT_DIR}/`.length);
		if (!navZiele.has(`text/${name}`)) fehler.push(`Blatt fehlt im Inhaltsverzeichnis: ${name}`);
	}
}

for (const anker of toteAnker) fehler.push(`toter Anker: ${anker}`);

// epubcheck prüft die Spezifikation. Ohne Java läuft nur der Teil oben, das Skript
// sagt das dann deutlich, statt still zu bestehen.
if (ohneValidator) {
	notizen.push('epubcheck übersprungen');
} else if (!existsSync(jar)) {
	fehler.push(`epubcheck fehlt: ${jar}. Zuerst npm install ausführen.`);
} else {
	// `--mode exp` gilt nur für Exp-formatierte Bücher und epubcheck lehnt die
	// Option bei einer EPUB-Datei ab. Ohne die Option prüft er nach den Regeln, die
	// in der Datei stehen.
	const aufruf = ['-jar', jar, epubDatei];

	let meldung = '';

	try {
		const { stdout, stderr } = await ausführen('java', aufruf, { maxBuffer: 64 * 1024 * 1024 });
		meldung = `${stdout}\n${stderr}`;
	} catch (fehlerUrsache) {
		// epubcheck beendet sich bei Befunden mit Status 1 und schreibt den Bericht
		// trotzdem nach stdout. Der Bericht ist das Ergebnis, nicht der Absturz.
		if (fehlerUrsache.code === 'ENOENT') {
			fehler.push(
				'java fehlt. npm run check:epub braucht eine Java-Laufzeit, im Devcontainer über das Dockerfile.',
			);
			meldung = '';
		} else if (typeof fehlerUrsache.stdout === 'string' && fehlerUrsache.stdout) {
			meldung = `${fehlerUrsache.stdout}\n${fehlerUrsache.stderr ?? ''}`;
		} else {
			fehler.push(`epubcheck abgebrochen: ${fehlerUrsache.message}`);
			meldung = '';
		}
	}

	const befunde = [...meldung.matchAll(/^(ERROR|FATAL|WARNING)(\([^)]*\))?: (.*)$/gm)];
	const hinweise = [...meldung.matchAll(/^INFO(\([^)]*\))?: (.*)$/gm)];

	for (const treffer of befunde) fehler.push(`epubcheck ${treffer[1]}${treffer[2] ?? ''}: ${treffer[3]}`);

	notizen.push(
		befunde.length === 0
			? `epubcheck: keine Fehler oder Warnungen${hinweise.length > 0 ? `, ${hinweise.length} Hinweise` : ''}`
			: `epubcheck: ${befunde.length} Fehler oder Warnungen`,
	);

	for (const treffer of hinweise.slice(0, 3)) notizen.push(`epubcheck INFO: ${treffer[2]}`);
}

for (const notiz of notizen) console.log(`  ${notiz}`);

if (fehler.length > 0) {
	console.error(`\n${fehler.length} Befund(e):`);
	for (const eintrag of fehler) console.error(`  - ${eintrag}`);
	process.exit(1);
}

console.log('\nEPUB-Prüfung bestanden.');