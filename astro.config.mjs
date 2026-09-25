// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages serves this repository at https://drgonzales.github.io/dasferment/.
// The environment variables keep local and hosted builds configurable.
const site = process.env.PUBLIC_SITE_URL ?? 'https://drgonzales.github.io';
const base = process.env.PUBLIC_BASE_PATH ?? '/dasferment';

// https://astro.build/config
export default defineConfig({ site, base });
