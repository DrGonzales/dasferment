// @ts-check
import { defineConfig } from 'astro/config';

// Dritte, eigenständige Ausgabe: das EPUB. Ohne `site` und `base`, weil das Buch
// im Reader keinen Ort im Web hat. Die Website-Konfiguration in astro.config.mjs
// und die Druckfassung in astro.book.config.mjs bleiben unberührt.
//
// `assets` heißt hier `assets` statt `astral`, weil scripts/make-epub.mjs die
// Bilddateien unter demselben Namen in das Archiv übernimmt. Ohne festen
// Ordnernamen müsste das Skript den Hash-Verzeichnisnamen erraten.
export default defineConfig({
	srcDir: './src/epub',
	outDir: './dist-epub',
	build: {
		// Fester Ordnername, damit `make-epub.mjs` die Bilddateien unter genau
		// diesem Namen im Archiv ablegen kann, ohne den Hash-Namen zu erraten.
		assets: 'assets',
	},
});
