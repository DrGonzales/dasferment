// @ts-check
import { defineConfig } from 'astro/config';

// Zweiter, eigenständiger Build für die Druckfassung. Ohne `site` und `base`,
// weil das Buch keine kanonischen URLs hat: Es ist ein Druckdokument, kein
// Angebot im Web. Die Website-Konfiguration in astro.config.mjs bleibt unberührt.
export default defineConfig({
	srcDir: './src/book',
	outDir: './dist-book',
	build: {
		assets: 'astral',
		inlineStylesheets: 'never',
	},
});
