import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDict, PDFDocument, PDFHexString, PDFName, PDFNumber } from 'pdf-lib';
import puppeteer from 'puppeteer';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const bookDir = join(projectRoot, 'dist-book');
const entryFile = join(bookDir, 'index.html');
const outputFile = join(bookDir, 'das-ferment.pdf');
const polyfillFile = join(projectRoot, 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js');

// Ohne gesetzten Viewport rechnet der Headless-Chromium mit 800 × 600 und damit
// mit einem anderen vw-Maß. Das Buch braucht den Viewport trotzdem nicht, aber ein
// fester Wert macht den Durchlauf auf jeder Maschine gleich.
const VIEWPORT = { width: 1280, height: 1024, deviceScaleFactor: 1 };
const PX_TO_PT = 0.75;

const MIME_TYPES = {
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.ico': 'image/x-icon',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.ttf': 'font/ttf',
	'.woff2': 'font/woff2',
};

// Paged.js liest die Datei über HTTP. So spielen absolute Asset-Pfade und der
// file://-Schutzmechanismus des Browsers keine Rolle.
async function serveBook() {
	const server = createServer((request, response) => {
		const requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
		const relative = normalize(requested).replace(/^([/\\])+/, '');
		const file = join(bookDir, relative === '' ? 'index.html' : relative);

		if (!file.startsWith(bookDir + sep)) {
			response.writeHead(403).end();
			return;
		}

		stat(file)
			.then((info) => {
				if (info.isDirectory()) throw new Error('verzeichnis');

				response.writeHead(200, {
					'Content-Type': MIME_TYPES[extname(file)] ?? 'application/octet-stream',
					'Content-Length': info.size,
					'Cache-Control': 'no-store',
				});
				createReadStream(file).pipe(response);
			})
			.catch(() => {
				response.writeHead(404).end();
			});
	});

	await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));

	const { port } = server.address();
	return { server, url: `http://127.0.0.1:${port}/index.html` };
}

function toPoints(value) {
	return Math.round(value * PX_TO_PT * 100) / 100;
}

function setTrimBoxes(pdfDoc, boxes) {
	const pdfPages = pdfDoc.getPages();

	pdfPages.forEach((pdfPage, index) => {
		const box = boxes[index];
		if (!box) return;

		const media = box.media;
		const crop = box.crop;
		if (media.width === crop.width && media.height === crop.height) return;

		// pdf-lib erwartet x, y, width und height und schreibt selbst ein
		// Eckpunktrechteck. Die Werte kommen aus dem Paged.js-Seitenkasten, also
		// aus dem Satzspiegel plus Beschnitt.
		pdfPage.setTrimBox(
			toPoints(crop.x),
			toPoints(crop.y),
			toPoints(crop.width),
			toPoints(crop.height),
		);
	});
}

function countNodes(layer) {
	return layer.reduce((total, item) => total + 1 + countNodes(item.children), 0);
}

function assignRefs(layer, context, parentRef) {
	for (const item of layer) {
		item.ref = context.nextRef();
		item.parentRef = parentRef;
		assignRefs(item.children, context, item.ref);
	}
}

function buildOutlineObjects(layer, context) {
	for (const [index, item] of layer.entries()) {
		const previous = layer[index - 1];
		const next = layer[index + 1];

		const object = new Map([
			[PDFName.of('Title'), PDFHexString.fromText(item.title)],
			[PDFName.of('Dest'), PDFName.of(item.destination)],
			[PDFName.of('Parent'), item.parentRef],
		]);

		if (previous) object.set(PDFName.of('Prev'), previous.ref);
		if (next) object.set(PDFName.of('Next'), next.ref);

		if (item.children.length > 0) {
			object.set(PDFName.of('First'), item.children[0].ref);
			object.set(PDFName.of('Last'), item.children[item.children.length - 1].ref);
			object.set(PDFName.of('Count'), PDFNumber.of(countNodes(item.children)));
		}

		context.assign(item.ref, PDFDict.fromMapWithContext(object, context));
		buildOutlineObjects(item.children, context);
	}
}

function setOutline(pdfDoc, outline) {
	if (outline.length === 0) return;

	const context = pdfDoc.context;
	const outlineRef = context.nextRef();

	assignRefs(outline, context, outlineRef);
	buildOutlineObjects(outline, context);

	context.assign(
		outlineRef,
		PDFDict.fromMapWithContext(
			new Map([
				[PDFName.of('First'), outline[0].ref],
				[PDFName.of('Last'), outline[outline.length - 1].ref],
				[PDFName.of('Count'), PDFNumber.of(countNodes(outline))],
			]),
			context,
		),
	);

	pdfDoc.catalog.set(PDFName.of('Outlines'), outlineRef);
}

async function main() {
	const file = await stat(entryFile).catch(() => null);
	if (!file) {
		throw new Error(`${entryFile} fehlt. Erst "npm run build:book" ausführen.`);
	}

	const { server, url } = await serveBook();
	const browser = await puppeteer.launch({
		args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
	});

	try {
		const tab = await browser.newPage();
		tab.setDefaultTimeout(0);
		await tab.setViewport(VIEWPORT);
		await tab.emulateMediaType('print');
		await tab.evaluateOnNewDocument(() => {
			window.PagedConfig = { auto: false };
		});
		await tab.goto(url, { waitUntil: 'networkidle0' });
		await tab.evaluate(() => document.fonts.ready);
		await tab.addScriptTag({ path: polyfillFile });

		let total = 0;
		await tab.exposeFunction('__buchFertig', (anzahl) => {
			total = anzahl;
		});

		await tab.evaluate(async () => {
			const flow = await window.PagedPolyfill.preview();
			await window.__buchFertig(flow.total);
		});

		// Kolumnentitel. Paged.js 0.4.3 schreibt den Wert von string-set ohne
		// schließendes Anführungszeichen in die Custom Property, wodurch der
		// Wert ungültig wird und string() leer bleibt. Deshalb setzt der Umbruch
		// --laufender-kopf selbst, je Seite, und das Stylesheet liest nur noch die
		// Variable. Auf Kapitelanfangsseiten und Leerseiten bleibt der Rand leer.
		const koepfe = await tab.evaluate(() => {
			const kapitelWaehler = '.book-part__title, .knowledge-group__title, .register-group__title';
			let kapitel = '';
			let rezept = '';
			let gesetzt = 0;

			for (const seite of document.querySelectorAll('.pagedjs_page')) {
				const inhalt = seite.querySelector('.pagedjs_page_content');
				if (!inhalt) continue;

				const kapitelTitel = inhalt.querySelector(kapitelWaehler);
				const rezeptTitel = inhalt.querySelector('.recipe__heading');
				const kopf = kapitelTitel ? '' : rezeptTitel ? kapitel : rezept || kapitel;

				if (kopf && inhalt.textContent.trim() !== '') {
					const wert = kopf.trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"');
					seite.style.setProperty('--laufender-kopf', `"${wert}"`);
					gesetzt += 1;
				}

				if (kapitelTitel) kapitel = kapitelTitel.textContent.trim();
				if (rezeptTitel) rezept = rezeptTitel.textContent.trim();
			}

			return gesetzt;
		});

		// Das Inhaltsverzeichnis bekommt seine Seitenzahlen aus dem fertigen
		// Umbruch. Die Platzhalter sind breit genug, damit das Einfügen die
		// Paginierung nicht mehr verschiebt.
		const verzeichnis = await tab.evaluate(() => {
			const seiten = [...document.querySelectorAll('.pagedjs_page')];
			const fundort = new Map();

			for (const [index, seite] of seiten.entries()) {
				for (const knoten of seite.querySelectorAll('[data-book-ref]')) {
					const ref = knoten.getAttribute('data-book-ref');
					if (ref && !fundort.has(ref)) fundort.set(ref, index + 1);
				}
			}

			const fehlend = [];
			for (const feld of document.querySelectorAll('[data-toc-page]')) {
				const ref = feld.getAttribute('data-toc-page');
				const seite = fundort.get(ref);
				if (seite) {
					feld.textContent = String(seite);
				} else {
					fehlend.push(ref);
				}
			}

			return { fehlend, gefunden: fundort.size, seiten: seiten.length };
		});

		if (verzeichnis.fehlend.length > 0) {
			throw new Error(
				`Ohne Seite im Inhaltsverzeichnis: ${verzeichnis.fehlend.join(', ')}`,
			);
		}

		const kopfzeilen = await tab.evaluate(() => {
			return [...document.querySelectorAll('[data-outline]')].map((knoten) => ({
				ebene: Number(knoten.tagName.slice(1)),
				// Weiche Trennzeichen stehen im Text, damit der Umbruch bricht.
				// In einem Lesezeichen wären sie sichtbarer als gedacht.
				titel: knoten.textContent.replace(/\u00AD/g, '').replace(/\s+/g, ' ').trim(),
				ref: knoten.getAttribute('data-outline-ref'),
			}));
		});

		// Chromium legt nur für Links, die auf eine id zeigen, ein Ziel im PDF an.
		// Die Links bleiben unsichtbar, sonst kämen sie in den Satz.
		await tab.evaluate((refs) => {
			const halter = document.createElement('div');
			halter.setAttribute('aria-hidden', 'true');
			halter.style.display = 'none';

			for (const ref of refs) {
				const link = document.createElement('a');
				link.href = `#${ref}`;
				halter.append(link);
			}

			document.body.prepend(halter);
		}, [...new Set(kopfzeilen.map((eintrag) => eintrag.ref).filter(Boolean))]);

		const kasten = await tab.evaluate(() => {
			return [...document.querySelectorAll('.pagedjs_page')].map((seite) => {
				const media = seite.getBoundingClientRect();
				const crop = seite.querySelector('.pagedjs_pagebox').getBoundingClientRect();

				return {
					media: { width: media.width, height: media.height, x: 0, y: 0 },
					crop: {
						width: crop.width,
						height: crop.height,
						x: crop.x - media.x,
						y: crop.y - media.y,
					},
				};
			});
		});

		const metadaten = await tab.evaluate(() => {
			const meta = {};
			for (const tag of document.querySelectorAll('meta[name]')) {
				meta[tag.getAttribute('name')] = tag.getAttribute('content');
			}
			meta.title = document.title;
			return meta;
		});

		const datei = await tab.pdf({
			preferCSSPageSize: true,
			printBackground: true,
			displayHeaderFooter: false,
			margin: { top: 0, right: 0, bottom: 0, left: 0 },
		});

		const pdfDoc = await PDFDocument.load(datei);

		pdfDoc.setTitle(metadaten.title ?? 'Das Ferment');
		if (metadaten.author) pdfDoc.setAuthor(metadaten.author);
		if (metadaten.description) pdfDoc.setSubject(metadaten.description);
		pdfDoc.setKeywords(['Fermentation', 'Rezeptbuch', 'Kodex']);
		pdfDoc.setCreator('Astro, Paged.js, pdf-lib');
		pdfDoc.setProducer('Chromium');
		pdfDoc.setCreationDate(new Date());
		pdfDoc.setModificationDate(new Date());

		setTrimBoxes(pdfDoc, kasten);
		setOutline(
			pdfDoc,
			buildOutlineTree(kopfzeilen),
		);

		const { writeFile } = await import('node:fs/promises');
		const fertig = Buffer.from(await pdfDoc.save());
		await writeFile(outputFile, fertig);

		console.log(`${verzeichnis.seiten} Seiten im Umbruch, ${total} gemeldet.`);
		console.log(
			`Inhaltsverzeichnis: ${verzeichnis.gefunden} Sprungmarken, ${kopfzeilen.length} Lesezeichen.`,
		);
		console.log(`Kolumnentitel auf ${koepfe} Seiten.`);
		console.log(`PDF: ${outputFile} (${(fertig.length / 1024 / 1024).toFixed(1)} MB)`);
	} finally {
		await browser.close();
		server.close();
	}
}

function buildOutlineTree(eintraege) {
	const wurzel = { children: [], depth: 0 };
	let aktuell = wurzel;

	for (const eintrag of eintraege) {
		const knoten = {
			title: eintrag.titel,
			destination: eintrag.ref,
			children: [],
		};

		while (aktuell.depth > 0 && eintrag.ebene <= aktuell.depth) {
			aktuell = aktuell.parent;
		}

		aktuell.children.push(knoten);
		knoten.parent = aktuell;
		knoten.depth = eintrag.ebene;
		aktuell = knoten;
	}

	const ohneEltern = (knoten) => {
		delete knoten.parent;
		delete knoten.depth;
		for (const kind of knoten.children) ohneEltern(kind);
	};

	ohneEltern(wurzel);
	return wurzel.children;
}

await main();
