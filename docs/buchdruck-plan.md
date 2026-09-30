# Buchdruck mit Paged.js — Plan

**Status:** offen, nicht begonnen
**Erstellt:** 2026-09-29
**Recherche-Stand:** 2026-09-29 (Paged.js unverändert gepflegt, siehe Versionsangaben unten)

Dieser Plan ist keine Projektregel. Er beschreibt eine geplante, zweite Ausgabe des
Rezeptbuchs als PDF. Die Website bleibt unverändert und funktionsfähig, auch wenn dieser
Plan nie umgesetzt wird.

---

## 1. Ziel

Ein druckfähiges PDF des Rezeptbuchs aus denselben Daten wie die Website:
39 Rezepte, 18 Wissenseinträge, 9 Kategorien, aus `das_ferment.json` und
`das_ferment_infos.json`. Kein clientseitiges JavaScript auf der Website, kein
Eingriff in `global.css`, kein gemeinsamer Build mit der Website.

## 2. Grundsatzentscheidung: getrennte Ausgabe, gemeinsame Daten

Es wird **nicht** getrennt: die Daten (`src/data/*.json`) und die Hilfsmodule (`src/lib/`).
Es wird getrennt: alles, was Ausgabe betrifft — Build, CSS, Layout-Hülle, Bildpipeline.

Begründung: Der gesamte Gewinn der Trennung liegt bei CSS-Verschmutzung und
Layout-Hülle, nicht beim Werkzeug. Würde man auch die Markup-Struktur duplizieren,
zahlt man den einzigen echten Preis (zwei Templates pro Rezept, zwei Stellen pro neuem
Datenfeld) und gewinnt nichts zusätzlich.

### Verworfene Alternativen

| Alternative | Warum verworfen |
| --- | --- |
| **Buch als Route im Site-Build** (`src/pages/buch/`) | `global.css` wird geladen: 54 `clamp(...vw...)` brechen, Viewport-Media-Queries treffen falsch, `.site-shell` mit `overflow: hidden` und `position: fixed` stört Paged.js, `base: /dasferment` bricht `file://`. |
| **Buch komplett aus Astro herausholen** (reines Node-Skript mit Hand-HTML) | Markup-Duplizierung ohne Gegenwert, kein `astro:assets`/`getImage`, Bilder müssten vorgerendert werden. |
| **Astro Container API** (`experimental_AstroContainer.renderToString()`) | Technisch passend, aber laut Astro-Doku *„experimental and subject to breaking changes, even in minor or patch releases"*. `package.json` pinnt `astro: ^7.3.5` — ein Minor-Update könnte den Buchbau still brechen. |

## 3. Recherche: Stand von Paged.js

Verifiziert über die npm-Registry und den Quellcode, nicht über Sekundärquellen.

### Versionen und Zustand

| Paket | Stand |
| --- | --- |
| `pagedjs` `latest` | **0.4.3, veröffentlicht 2023-07-06** |
| `pagedjs` `beta` | 0.5.0-beta.2, 2024-10-04 |
| `pagedjs-cli` | 0.4.3, 2023-07-20, Abhängigkeit `puppeteer ^20.9.0` |
| Repository | von GitLab nach GitHub umgezogen (Jan 2026), Commits bis 2026-09-28, aber **kein Release seit v0.4.3** |
| Offene Issues | 236 |
| Lizenz | MIT |

Vor der Umsetzung erneut prüfen, ob ein Release nach 0.4.3 erschienen ist. Die im
Januar 2026 nach GitHub übernommenen Korrekturen (u. a. Marginalia) liegen bisher nur
in `main`, nicht in einer veröffentlichten Version.

### Funktionsumfang

PDF-Lesezeichen über `--outline-tags` (Default `h1,h2,h3`, Umsetzung mit pdf-lib).
TrimBox und Beschnitt über `setTrimBoxes`. Standardmäßig `printBackground: true`,
`displayHeaderFooter: false`, `emulateMediaType("print")`.

### Nicht unterstützt und für dieses Projekt relevant

| Feature | Status | Auswirkung hier |
| --- | --- | --- |
| `target-counter()` | fehlerhaft (Issue #46) | **Kein automatisches Inhaltsverzeichnis mit Seitenzahlen** |
| `target-counters()` | nicht unterstützt | dito |
| `leaders()` | nicht unterstützt | Punct-Leader im Inhaltsverzeichnis müssen nachgebaut werden |
| `counter-reset` für Seitenzahlen | offenes Issue #31 | **Vorlauf kann die Seitenzählung nicht bei 1 beginnen** |
| `@page <name>:nth()` / `:blank` | offene Issues #29/#30 | nur die Standard-Seitengruppe unterstützt Pseudoselektoren |
| `margin-inside` / `margin-outside` | nicht unterstützt | über `@page :left` / `:right` manuell setzen |
| `box-decoration-break` | nicht unterstützt | Kästen über Seitenumbrüche vermeiden |
| `float: footnote`, `::footnote-call` | nicht unterstützt | unkritisch, die Daten enthalten keine Fußnoten |
| Silbentrennung | **nicht eingebaut** | `src/modules/` enthält nur `filters`, `generated-content`, `handler.js`, `paged-media` |

### Zwei Stolperfallen in `pagedjs-cli`

1. **Kein `setViewport`.** Die CLI ruft es nirgends auf (`src/printer.js`, vollständig
   gelesen). Es gilt der Puppeteer-Default **800 × 600**, also `1vw = 8px`.
2. **Keine Option für Silbentrennung.** Die Website-Doku listet `-n, --hyphenate`,
   aber `src/cli.js` der Version 0.4.3 enthält sie nicht. Die Doku ist veraltet.

Weiterhin: `preferCSSPageSize: options.width ? false : true` — **`--width`/`--height`
niemals setzen**, sonst wird `@page { size }` ignoriert und die TrimBox stimmt nicht.

## 4. Blocker im bestehenden Projekt

Alle Fundstellen in `src/styles/global.css` beziehen sich auf den Stand vom 2026-09-29
(1796 Zeilen).

### 4.1 Keine Webfonts — kritisch

`global.css:14-15` definiert ausschließlich System-Stacks:

```css
--display: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif;
--body: Georgia, "Times New Roman", serif;
```

Im gesamten Stylesheet gibt es kein `@font-face`. Headless Chromium auf Linux hat weder
Iowan Old Style noch Palatino und fällt auf DejaVu/Liberation zurück. Für ein Buch muss
die Typografie metrisch feststehen, sonst ändert sich die Paginierung zwischen Maschine
und Druckerei. Die Paged.js-Doku warnt ausdrücklich davor, Browser **und** OS zwischen
Entwurf und Generierung zu wechseln.

### 4.2 `vw` bricht unter Paged.js

55 `vw`-Vorkommen, davon 54 in `clamp()`. Beispiel `global.css:225`:

```css
font-size: clamp(3.6rem, 7vw, 7.1rem);
```

`vw` bezieht sich immer auf den Browser-Viewport, nie auf die Paged.js-Seitenbox. Bei
800 px Breite wären 7vw = 56 px statt der gemeinten Größe. Sämtliche Abstände und
Schriftgrade kollabieren.

Gegenmittel: Buch-Stylesheet in absoluten Einheiten (`pt`/`mm`) oder über
`--pagedjs-pagebox-width` rechnen. Diese Variable setzt Paged.js selbst
(bestätigt in `css/interface.css`).

### 4.3 Viewport-Media-Queries treffen die falsche Bedingung

Derselbe Umstand wie oben, mit umgekehrter Richtung:

| Stelle | Regel | Effekt im PDF |
| --- | --- | --- |
| `global.css:674`, `:1250` | `@media (max-width: 780px)` | **trifft zu** |
| `global.css:663`, `:1769` | `@media (max-width: 1120px)` | **trifft zu** |
| `global.css:841` | `@media (max-width: 390px)` | trifft nicht zu |
| `global.css:724`, `:1271`, `:1448`, `:1775` | `@media (max-width: 560px)` | trifft nicht zu |
| `global.css:1643` | `@media (min-width: 40rem)` | **trifft zu** |
| `global.css:1223` | `@container (max-width: 55rem)` | greift, Ratschlag kollabiert auf einspaltig |

Das Buch-Stylesheet enthält daher **keine** Media Queries, nur `@page` und benannte Seiten.

### 4.4 Dekoration und Container, die im Buch nichts zu suchen haben

- `global.css:42-53` — `body::before` mit `position: fixed` (Papierstruktur). Feste
  Elemente erscheinen in Paged.js nur auf Seite 1 und ragen über den Rand.
- `global.css:73-85` — `.site-shell` mit `min-height: 100vh`, **`overflow: hidden`**,
  `box-shadow`, `width: min(100%, 1440px)`. `overflow: hidden` auf einem Vorfahren ist
  für Paged.js gefährlich, weil die Seitenboxen abgeschnitten werden können.
- `global.css:87-89` — absolute Pseudoelemente für die Pergamentoptik.
- `src/pages/rezepte/[slug].astro:136-142` (Breadcrumbs), `:163-168` (Tags),
  sowie `<Header />` und `<Footer />` gehören nicht ins Buch.

Durch die Trennung nach Stufe 1 entfallen diese vier Punkte automatisch, weil das
Buchdokument `global.css` nicht lädt. Sie bleiben hier dokumentiert, weil sie beim
Debuggen in einer späteren Umsetzung leicht wieder eingeführt werden.

### 4.5 Kein `@page`, kein Print-Stylesheet

`global.css` enthält keine einzige `@page`-Regel und kein `@media print`. Es gibt nichts,
was Paged.js lesen könnte. Das ist der Hauptteil der zu schreibenden Arbeit.

### 4.6 Bildauflösung ist die harte Obergrenze

`src/pic/pages/` liegt bei 1024 × 1536 px. Ein A4-Satzspiegel von ~170 mm Breite ergibt
daraus ~153 dpi. **A4 ist mit dem vorhandenen Material nicht sinnvoll machbar.**

| Format | Satzspiegel ca. | Effektive Auflösung |
| --- | --- | --- |
| 148 × 210 mm (A5) | 113 mm | ~230 dpi |
| 140 × 200 mm | 107 mm | ~243 dpi |
| 170 × 240 mm | 131 mm | ~198 dpi |
| 210 × 297 mm (A4) | 170 mm | ~153 dpi |

Laut `AGENTS.md` vergrößert der Astro-Bildservice nicht (`withoutEnlargement`). Die
1024 px sind ein Deckel, den keine CSS-Option hebt. Gilt auch für die 128 × 128 großen
Motive aus `src/pic/smallactors/` (640 × 640) und die Portraits in `src/pic/actors/`
(1024 × 1536).

### 4.7 `astro:assets` im Buchdokument

`src/pages/rezepte/[slug].astro:175-183` (Rezeptbild) und `:251-259` (Ratschlag-Portrait)
erzeugen `srcset` + `sizes`. Im Buch ist beides falsch:

- `sizes` beschreibt die Viewport-Breite, im PDF ist die Seitenbox fest → Chromium wählt
  ein falsches Kandidatenbild.
- `loading="lazy"` (`:256`, Wissensseite) lädt tiefer liegende Bilder unter Umständen
  nicht, bevor das PDF erzeugt wird.

Lösung: im Buchdokument mit `getImage({ src, width: 1024 })` ein **einzelnes** Bild ohne
`srcset`/`sizes` rendern, `loading="eager"`, `decoding="sync"`. `SMALL_ACTOR_SIZE` bzw.
die Bilddaten bleiben die einzige Quelle für die Größe.

### 4.8 Keine gemeinsame Layout-Komponente

Es existiert **kein `Layout.astro`** — jede Seite ist ein eigenständiges vollständiges
HTML-Dokument mit eigenem `<html>`/`<head>`/`<body>` (siehe `slug.astro:111-131`).
Paged.js braucht einen einzigen durchgehenden Fluss. Das Buch liefert ihn über eine
eigene Route mit eigenem Dokument-Gerüst.

### 4.9 `base`-Pfad bricht `file://`

`astro.config.mjs` setzt `base: '/dasferment'`. Gebaute Assets referenziert
`dist/buch/index.html` als `/dasferment/_astro/…`. Über `file://` findet Paged.js kein
einziges Bild. Durch den eigenen Book-Build mit `base: '/'` oder ohne `base` entfällt
das Problem.

### 4.10 CI

`.github/workflows/deploy.yml` nutzt `withastro/action@v6` in **einem** Schritt
(Build + Upload). Ein Buch-Schritt passt dazwischen nicht ohne Aufteilung. Der Runner ist
`ubuntu-latest`; bei anderer Font-Metrik und anderer Trennung liefern lokale Maschine und
CI unterschiedliche Seitenzahlen.

## 5. Architektur

```text
src/
├── components/           bestehend, nur Web
├── data/                 gemeinsam genutzt, Single Source of Truth
├── lib/                  gemeinsam genutzt
├── pages/                bestehend, nur Web
├── pic/                  gemeinsam genutzt
└── book/                 NEU, eigener Entry
    ├── pages/index.astro
    └── styles/book.css
astro.config.mjs          unverändert, Web
astro.book.config.mjs     NEU, Buch
scripts/
└── make-pdf.mjs          NEU, Puppeteer + pagedjs
```

`astro.book.config.mjs`:

```js
export default defineConfig({
	srcDir: './src/book',
	outDir: './dist-book',
	publicDir: false,
	site: process.env.PUBLIC_SITE_URL,
});
```

`src/book/pages/index.astro` importiert `../data/das_ferment.json` und
`../lib/recipes.ts` — dieselben Dateien wie die Website. `import.meta.glob` in
`src/lib/pageImages.ts:9` ist pfadrelativ zur Moduldatei und funktioniert aus jedem
Entry, ebenso `actorImages.ts` und `smallActors.ts`. `astro:assets` gilt genauso.

Nur `src/book/styles/book.css` wird geladen, nie `src/styles/global.css`.

`package.json`:

```json
"build":      "astro build",
"build:book": "astro build --config astro.book.config.mjs",
"make:pdf":   "npm run build:book && node scripts/make-pdf.mjs"
```

`npm run build` bleibt unverändert bei 71 Seiten. Das PDF landet in `dist-book/` und
**nicht** in `dist/` — es wird nicht mitdeployt.

### Aufbau des Buchs

Titelblatt → Inhaltsverzeichnis → Vorwort (Wissenseite) → Rezepte nach den 9 Kategorien.
Vorlauf und Rezeptteil als **zwei getrennte Dokumente** rendern, weil Paged.js die
Seitenzählung nicht zurücksetzen kann (Issue #31) und weil die Doku für unterschiedliche
Seitenformate ohnehin zwei Dateien verlangt.

### `book.css`

`@page` mit Beschnitt und Passerzeichen, Satzspiegel über `@page :left` / `@page :right`,
Kolumnentitel über `string-set`, Seitenzahl in `@bottom-center`, Typografie in `pt`.
`break-before: right` für Rezeptbeginn, `break-inside: avoid` für Zutatenliste,
Ratschlag und Tabellen. Keine Media Queries, kein `vw`.

### `scripts/make-pdf.mjs`

Puppeteer mit gesetztem Viewport, `emulateMediaType("print")`,
`preferCSSPageSize` aktiv, `page.pdf()` mit `printBackground: true`. `outlineTags` für
PDF-Lesezeichen.

## 6. Phasen

| # | Phase | Inhalt |
| --- | --- | --- |
| 0 | **Entscheidungen** | Die sechs offenen Punkte aus Abschnitt 7 klären. Blockiert alles Weitere. |
| 1 | Datenweg | `src/lib/book.ts`: Rezepte gruppieren, Reihenfolge festlegen, Front-Matter-Bausteine. Nur die vorhandenen JSON-Quellen. |
| 2 | Buchroute | `src/book/pages/index.astro`: ein `<body>` mit allem Inhalt, Bilder über `getImage` in fester Breite, ohne Header, Footer, Breadcrumbs und Site-Shell. |
| 3 | `book.css` | `@page`, Satzspiegel, `string-set`, Seitenzahl, Typografie in `pt`. |
| 4 | Generatorskript | Puppeteer + pagedjs, Viewport gesetzt, ein Durchlauf. |
| 5 | Inhaltsverzeichnis | Erster Durchlauf liefert über das `page`-Event die Seitenposition jedes Rezepts, zweiter Durchlauf rendert mit gefülltem Verzeichnis. Punct-Leader mit einem Flex-Band aus `border-bottom: dotted` nachbauen. |
| 6 | Silbentrennung | `hyphenation.de` (npm 0.2.1) plus `hypher` als Build-Zeit-Transformation, die weiche Trennzeichen in die Druckfassung schreibt. Bewusst als Build-Schritt, damit die Druckfassung nicht von System-Wörterbüchern abhängt. |
| 7 | CI | `deploy.yml` aufteilen: Build → `make:pdf` → Upload, als eigener Job. Chromium-Version pinnen. |

## 7. Offene Entscheidungen (blockierend)

| # | Frage | Warum blockierend |
| --- | --- | --- |
| 1 | **Zielformat?** 148 × 210, 140 × 200 oder 170 × 240 mm? | Bestimmt das Bildbudget, siehe 4.6. Vorschlag: 148 × 210 mm. |
| 2 | **Umfang?** Alle 39 Rezepte in einem PDF oder aufgeteilt nach den 9 Kategorien? | Bei ~60-80 Seiten ist ein Durchlauf realistisch, der Speicherbedarf im Headless-Browser aber nicht trivial. Aufteilung ist der Rückfallpfad. |
| 3 | **Schriften?** Darf ich OFL-Schriften selbst hosten (z. B. EB Garamond für `--body`, eine Display-Schrift für `--display`)? | Ohne diese Freigabe ist kein reproduzierbares Buch möglich, siehe 4.1. |
| 4 | **Abhängigkeiten?** Darf ich `pagedjs` und `puppeteer` als Dev-Dependencies installieren? | `AGENTS.md` verlangt ausdrücklich eine vorherige Frage. |
| 5 | **PDF-Ablage?** Wohin mit dem Ergebnis, und soll es überhaupt auf die Website? | Ohne gemeinsamen Build ist das unkritisch, aber zu entscheiden. |
| 6 | **CI-Form?** Buch im Deploy-Job oder als eigener Job, der unabhängig vom Website-Deploy läuft? | Bestimmt, ob ein Buchfehler die Website blockiert. |

## 8. Was die Trennung nicht löst

Unverändert offen, unabhängig von Stufe 1:

- **Bildauflösung 1024 × 1536** — die Obergrenze liegt im Material, nicht im Werkzeug.
- **Paged.js-Lücken** — kein `target-counter` (Inhaltsverzeichnis braucht Phase 5), kein
  `leaders()`, keine Seitenzahl-Reset für den Vorlauf.
- **Keine Webfonts** — jetzt sauber auf `book.css` begrenzt, die Freigabe aus Phase 0
  Punkt 3 braucht es trotzdem.
- **Seitenzahl-Stabilität** — wird durch den eigenen CI-Job besser, aber nicht gelöst.

## 9. Risiken

| Risiko | Wirkung | Gegenmaßlage |
| --- | --- | --- |
| Paged.js ohne Release seit 2023, 236 offene Issues | Bug im Umbruch, keine Upstream-Fixes | Version pinnen, Generatorskript eigenständig halten, Ausweichpfad `pagedjs@0.5.0-beta.2` |
| Font-Metrik und Trennungskontext | Seitenzahl schwankt zwischen Maschinen | Fonts pinnen, nur in CI generieren, Seitenzahl im PDF protokollieren |
| `vw` und Media Queries | Layout kollabiert | Buch-Stylesheet ohne `vw` und ohne Media Queries, dafür `--pagedjs-pagebox-width` |
| `overflow: hidden` auf `.site-shell` | Seitenboxen abgeschnitten | Buchinhalt außerhalb der Site-Shell |
| 1024 px Quellbilder | matschiger Offset-Druck | kleines Format wählen oder Bildmaterial neu anliefern |
| 60-80 Seiten in einem Chromium | Speicher / Zeit | Kategorie-PDFs als Aufteilung |
| `astro: ^7.3.5` und `@page`-Semantik | Minor-Update bricht Buchbau | Build des Buchs separat, Site-Build bleibt unberührt |

## 10. Quellen

- Paged.js-Dokumentation, abgerufen 2026-09-29:
  - <https://pagedjs.org/en/documentation/2-getting-started-with-paged.js/>
  - <https://pagedjs.org/en/documentation/5-web-design-for-print/>
  - <https://pagedjs.org/en/documentation/7-generated-content-in-margin-boxes/>
  - <https://pagedjs.org/en/documentation/14-supported-feature-of-the-w3c-specifications/>
  - <https://pagedjs.org/en/documentation/3-w3c-specifications-for-printing/>
  - <https://pagedjs.org/en/faq/>
- Quellcode, gelesen 2026-09-29:
  - <https://github.com/pagedjs/pagedjs/blob/main/src/printer.js> (pagedjs-cli)
  - <https://github.com/pagedjs/pagedjs-cli/blob/main/src/cli.js> (Optionen)
  - <https://github.com/pagedjs/pagedjs/blob/main/package.json>
  - <https://github.com/pagedjs/pagedjs/blob/main/css/interface.css>
  - Verzeichnisliste `src/modules/` über die GitHub-API (kein Trennmodul vorhanden)
- npm-Registry, abgerufen 2026-09-29: `pagedjs`, `pagedjs-cli`, `hyphenation.de`, `hypher`
- Astro-Dokumentation: `srcDir`, `outDir`, Astro Container API
