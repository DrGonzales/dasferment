/**
 * Prüft den Buchumbruch an der Quelle: einmal im fertigen Paged.js-DOM und,
 * wenn dist-book/das-ferment.pdf existiert, zusätzlich am PDF.
 *
 * Warum beides: Der DOM kennt die berechneten Stile und Textbereiche, daran
 * lassen sich Seitenlage und Blocksatz-Fehler exakt messen. Das PDF ist die
 * Auslieferung, an ihr sieht man, ob die Bildseite wirklich stumm bleibt. Der
 * Textlayer des PDF taugt nicht für Typografie-Messungen, pdftotext zerlegt
 * Small-Caps-Kicker in einzelne Zeilen.
 *
 * Aufruf: node scripts/buch-pruefen.mjs [--kein-pdf]
 * Rückgabewert 0 bei bestandener Prüfung, 1 bei Befunden.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import puppeteer from 'puppeteer';

const ausführen = promisify(execFile);

const wurzel = resolve(fileURLToPath(new URL('..', import.meta.url)));
const buchDir = join(wurzel, 'dist-book');
const pdfDatei = join(buchDir, 'das-ferment.pdf');
const polyfill = join(wurzel, 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js');
const ohnePdf = process.argv.includes('--kein-pdf');

// 117 mm Satzspiegel entsprechen 442 px im Umbruch.
const PX_PRO_MM = 442 / 117;
const BILDBREITE_MM = 113;

const MIME = {
	'.css': 'text/css',
	'.html': 'text/html',
	'.png': 'image/png',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.ttf': 'font/ttf',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
};

const fehler = [];
const notizen = [];

function pruefe(bedingung, meldung) {
	if (!bedingung) fehler.push(meldung);
	return bedingung;
}

function mm(pixel) {
	return Math.round((pixel / PX_PRO_MM) * 10) / 10;
}

async function liesAusgabe(bin, argumente) {
	const { stdout } = await ausführen(bin, argumente, { maxBuffer: 256 * 1024 * 1024 });
	return stdout;
}

function statServer() {
	return createServer((anfrage, antwort) => {
		const pfad = normalize(decodeURIComponent(new URL(anfrage.url, 'http://l').pathname)).replace(
			/^([/\\])+/,
			'',
		);
		const datei = join(buchDir, pfad === '' ? 'index.html' : pfad);
		stat(datei).then((info) => {
			if (info.isDirectory()) throw new Error('verzeichnis');
			antwort.writeHead(200, { 'Content-Type': MIME[extname(datei)] ?? 'application/octet-stream' });
			createReadStream(datei).pipe(antwort);
		}).catch(() => antwort.writeHead(404).end());
	});
}

/** Misst den fertigen Umbruch im Browser. */
async function pruefeUmbruch() {
	const server = statServer();
	await new Promise((fertig) => server.listen(0, '127.0.0.1', fertig));
	const url = `http://127.0.0.1:${server.address().port}/index.html`;

	const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
	try {
		const seite = await browser.newPage();
		seite.setDefaultTimeout(0);
		await seite.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 1 });
		await seite.emulateMediaType('print');
		await seite.evaluateOnNewDocument(() => {
			window.PagedConfig = { auto: false };
		});
		await seite.goto(url, { waitUntil: 'networkidle0' });
		await seite.evaluate(() => document.fonts.ready);
		await seite.addScriptTag({ path: polyfill });
		await seite.evaluate(async () => {
			await window.PagedPolyfill.preview();
		});

		const bericht = await seite.evaluate(() => {
			const seiten = [...document.querySelectorAll('.pagedjs_page')].map((blatt, index) => {
				const inhalt = blatt.querySelector('.pagedjs_page_content');
				const bild = inhalt?.querySelector('.recipe-plate');
				const rezept = inhalt?.querySelector('article.recipe');
				const text = (inhalt?.textContent ?? '').replace(/ /g, ' ').trim();
				const eintrag = {
					nummer: index + 1,
					gerade: (index + 1) % 2 === 0,
					kopf: (blatt.style.getPropertyValue('--laufender-kopf') || '').trim(),
					art: bild ? 'bild' : rezept ? 'rezept' : text ? 'inhalt' : 'leer',
				};
				const bildRect = bild?.querySelector('img')?.getBoundingClientRect();
				if (bildRect && bildRect.height > 0) {
					const box = bild.getBoundingClientRect();
					eintrag.bild = {
						breite: bildRect.width,
						oben: bildRect.top - box.top,
						unten: box.bottom - bildRect.bottom,
					};
				}
				return eintrag;
			});

			// Paged.js setzt an jedem umbrochenen Block text-align-last: justify.
			// Das erben alle Kindelemente und ziehen einzeilige Überschriften,
			// Kicker, Claims und Tabellenbeschriftungen über die volle Spaltenbreite
			// auseinander. Diese Elemente dürfen den Wert nie geerbt bekommen.
			// Tabellenzellen bleiben ausgenommen, sie sind vom Inhalt her schmal
			// und ihre Überschriften sollen nicht über die Zeile gesperrt werden.
			const verdacht = /^(H[1-6]|CAPTION)$/;
			const geerbt = [];
			for (const knoten of document.querySelectorAll(
				'[data-align-last-split-element="justify"] *',
			)) {
				if (knoten.getClientRects().length === 0) continue;
				if (getComputedStyle(knoten).textAlignLast !== 'justify') continue;
				const klasse = typeof knoten.className === 'string' ? knoten.className : '';
				const gehoert = verdacht.test(knoten.nodeName) || /(kicker|claim|ornament|title|subtitle|source|block-title)/.test(klasse);
				if (!gehoert) continue;
				geerbt.push({
					typ: knoten.nodeName.toLowerCase(),
					klasse: klasse.split(' ')[0],
					text: knoten.textContent.replace(/ /g, ' ').trim().slice(0, 40),
				});
			}

			const doppelte = [...document.querySelectorAll('[id]')]
				.map((k) => k.id)
				.filter((id, position, alle) => alle.indexOf(id) !== position);
			const toteAnker = [...document.querySelectorAll('a[href^="#"]')]
				.map((a) => a.getAttribute('href').slice(1))
				.filter((ziel) => ziel && !document.getElementById(ziel));

			return {
				seiten,
				geerbt,
				doppelte: [...new Set(doppelte)],
				toteAnker: [...new Set(toteAnker)],
				bilder: document.querySelectorAll('.recipe-plate__frame img').length,
				rezepte: document.querySelectorAll('article.recipe').length,
				plaettenOhneBild: document.querySelectorAll('.recipe-plate:not(:has(img))').length,
			};
		});

		const bildseiten = bericht.seiten.filter((s) => s.art === 'bild');
		const rezeptseiten = bericht.seiten.filter((s) => s.art === 'rezept');
		const leerseiten = bericht.seiten.filter((s) => s.art === 'leer');

		pruefe(
			bericht.bilder === bericht.rezepte,
			`${bericht.bilder} Bildseiten, aber ${bericht.rezepte} Rezepte`,
		);
		pruefe(bericht.plaettenOhneBild === 0, `${bericht.plaettenOhneBild} Bildseiten ohne Bild`);
		pruefe(bericht.doppelte.length === 0, `doppelte id-Attribute: ${bericht.doppelte.join(', ')}`);
		pruefe(bericht.toteAnker.length === 0, `tote Sprungmarken: ${bericht.toteAnker.join(', ')}`);
		pruefe(
			bericht.geerbt.length === 0,
			`im Blocksatz gedehnt, erbt text-align-last: justify: ${bericht.geerbt
				.slice(0, 6)
				.map((g) => `${g.typ}.${g.klasse} „${g.text}“`)
				.join('; ')}${bericht.geerbt.length > 6 ? `; und ${bericht.geerbt.length - 6} weitere` : ''}`,
		);

		for (const bildseite of bildseiten) {
			const nummer = bildseite.nummer;
			const position = bericht.seiten.indexOf(bildseite);
			const rueckseite = bericht.seiten[position + 1];

			pruefe(!bildseite.gerade, `Seite ${nummer}: Bildseite ist ein Verso, muss ein Recto sein`);
			pruefe(!bildseite.kopf, `Seite ${nummer}: Bildseite trägt den Kolumnentitel „${bildseite.kopf}“`);
			pruefe(
				rueckseite?.art === 'rezept',
				`Seite ${nummer}: Bildseite, auf der Rückseite ${rueckseite?.nummer ?? '—'} steht ${rueckseite?.art ?? 'nichts'}`,
			);
			if (bildseite.bild) {
				const { breite, oben, unten } = bildseite.bild;
				pruefe(
					Math.abs(mm(breite) - BILDBREITE_MM) < 1.5,
					`Seite ${nummer}: Bild ${mm(breite)} mm breit, erwartet ${BILDBREITE_MM} mm`,
				);
				pruefe(
					Math.abs(mm(oben) - mm(unten)) < 1.5,
					`Seite ${nummer}: Bild nicht mittig, ${mm(oben)} mm oben, ${mm(unten)} mm unten`,
				);
			}
		}

		// Läuft ein Rezepttext auf eine Folgeseite, schiebt der Umbruch eine
		// Leerseite dazwischen. Fehlt sie, stimmt die Blattlogik nicht mehr.
		for (const rezeptseite of rezeptseiten) {
			const position = bericht.seiten.indexOf(rezeptseite);
			const danach = bericht.seiten[position + 1];
			if (danach?.art === 'bild' && danach.gerade) {
				fehler.push(
					`Seite ${rezeptseite.nummer}: Rezept läuft auf ${danach.nummer} weiter, Leerseite fehlt`,
				);
			}
		}

		notizen.push(`Seiten im Umbruch: ${bericht.seiten.length}`);
		notizen.push(`Bildseiten: ${bildseiten.length}, Rezeptseiten: ${rezeptseiten.length}`);
		notizen.push(
			`Leerseiten: ${leerseiten.length}` +
				(leerseiten.length ? ` (${leerseiten.map((s) => s.nummer).join(', ')})` : ''),
		);
		if (bildseiten.length > 0) {
			notizen.push(
				`Rezeptteil: Bild ${bildseiten[0].nummer} bis ${bildseiten.at(-1).nummer}, ` +
					`Text bis ${rezeptseiten.at(-1)?.nummer ?? '—'}`,
			);
		}
		return { gesamt: bericht.seiten.length, bildseiten: bildseiten.map((s) => s.nummer) };
	} finally {
		await browser.close();
		server.close();
	}
}

/** Prüft das ausgelieferte PDF mit den Werkzeugen aus poppler-utils. */
async function pruefePdf(umbruch) {
	let gesamt = 0;
	try {
		gesamt = Number((await liesAusgabe('pdfinfo', [pdfDatei])).match(/^Pages:\s+(\d+)$/m)?.[1] ?? 0);
	} catch {
		notizen.push('pdfinfo fehlt, PDF-Prüfung übersprungen (poppler-utils installieren)');
		return;
	}
	pruefe(gesamt === umbruch.gesamt, `PDF hat ${gesamt} Seiten, der Umbruch ${umbruch.gesamt}`);

	// Die Seitenzahl steht als eigene Zeile im Rand und zählt nicht als Text.
	const ohneZahl = [];
	for (let nummer = 1; nummer <= gesamt; nummer += 1) {
		const roh = await liesAusgabe('pdftotext', [
			'-f', String(nummer), '-l', String(nummer), pdfDatei, '-',
		]);
		ohneZahl.push(
			roh
				.split('\n')
				.filter((zeile) => !/^\s*\d{1,3}\s*$/.test(zeile))
				.join(' '),
		);
	}

	const textfrei = [];
	for (const nummer of umbruch.bildseiten) {
		if (ohneZahl[nummer - 1]?.trim() === '') textfrei.push(nummer);
	}

	pruefe(
		textfrei.length === umbruch.bildseiten.length,
		`${umbruch.bildseiten.length - textfrei.length} Bildseiten tragen Text im PDF: ` +
			umbruch.bildseiten.filter((n) => !textfrei.includes(n)).join(', '),
	);

	for (const nummer of umbruch.bildseiten) {
		const rueckseite = ohneZahl[nummer]?.trim() ?? '';
		pruefe(
			rueckseite.length > 0,
			`Seite ${nummer + 1}: Rückseite der Bildseite ohne Rezepttext`,
		);
	}

	notizen.push(`PDF: ${gesamt} Seiten, ${umbruch.bildseiten.length} Bildseiten ohne Text`);
	notizen.push(`Alle Bildseiten im PDF stumm: ${textfrei.length === umbruch.bildseiten.length ? 'ja' : 'nein'}`);
}

try {
	await stat(join(buchDir, 'index.html'));
} catch {
	console.error('dist-book/index.html fehlt. Zuerst `npm run build:book` ausführen.');
	process.exit(1);
}

const umbruch = await pruefeUmbruch();
if (!ohnePdf) await pruefePdf(umbruch);

for (const notiz of notizen) console.log(`  ${notiz}`);

if (fehler.length > 0) {
	console.error(`\n${fehler.length} Befund(e):`);
	for (const eintrag of fehler) console.error(`  - ${eintrag}`);
	process.exit(1);
}

console.log('\nBuchprüfung bestanden.');
