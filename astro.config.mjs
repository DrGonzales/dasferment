// @ts-check
import { defineConfig } from 'astro/config';

// PUBLIC_SITE_URL enables absolute canonical URLs and sitemap URLs in production.
const site = process.env.PUBLIC_SITE_URL;

// https://astro.build/config
export default defineConfig({ site });
