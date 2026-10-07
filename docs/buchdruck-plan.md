# Buchdruck mit Paged.js — Plan

**Status:** Phasen 0 bis 6 umgesetzt, Layout als Blatt je Rezept umgesetzt, Phase 7 Workflow angelegt, erster CI-Lauf steht aus
**Erstellt:** 2026-09-29
**Recherche-Stand:** 2026-09-30 (Paged.js weiterhin ohne Release, siehe Versionsangaben unten)
**Entscheidungen:** 2026-09-30 getroffen, siehe Abschnitt 7
**Ergebnis des letzten Laufs:** 113 Seiten, Rezepttext links und Bild rechts, A5 mit 3 mm Beschnitt
**Stand:** 2026-10-05, PDF `dist-book/das-ferment.pdf`, 13,6 MB, alle Prüfungen grün (siehe Abschnitt 6)

Dieser Plan ist keine Projektregel. Er beschreibt die zweite Ausgabe des Rezeptbuchs als
PDF. Die Website bleibt unverändert und funktionsfähig, auch wenn der Buchbau nicht
weitergepflegt wird.

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
| `puppeteer` | 25.12.0, wird direkt benutzt, nicht die CLI |
| Repository | von GitLab nach GitHub umgezogen (Jan 2026), Commits bis 2026-09-28, aber **kein Release seit v0.4.3** |
| Offene Issues | 236 |
| Lizenz | MIT |

Am 2026-09-30 erneut geprüft: `latest` ist unverändert 0.4.3, es gibt kein neues
Release. `pagedjs` wird mit exakter Version installiert, `puppeteer` ebenfalls
pinned, damit die Paginierung zwischen Läufen und Maschinen nicht wandert.

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

### Beobachtungen aus der Umsetzung (Paged.js 0.4.3)

Vier Punkte, die im Quelltext nicht dokumentiert sind und den Lauf geprägt haben:

1. **`string-set` erzeugt einen unbrauchbaren Wert.** `src/modules/generated-content/string-sets.js`
   schreibt `` `--pagedjs-string-first-${name}` `` mit öffnendem, aber ohne schließendes
   Anführungszeichen. Der Wert ist damit ungültig, `string()` bleibt in allen Randboxen
   leer. **Umgang:** `make-pdf.mjs` setzt die Variable `--laufender-kopf` je Seite selbst,
   `book.css` liest nur noch `var(--laufender-kopf, "")`.
2. **Der Inhalt einer Randbox steht im `::after`, nicht im Text.** Paged.js legt den Inhalt
   als `content` auf `.pagedjs_margin-content::after`. Ein `textContent` oder `innerText`
   der Randbox ist deshalb immer leer. **Wichtig beim Prüfen:** eine leere Randbox im DOM
   beweist nicht, dass im PDF nichts steht. `pdftotext` zeigt den echten Text.
3. **`counter(page)` in Randboxen funktioniert.** Der Zähler wird auf `.pagedjs_page`
   (`counter-increment: page 1`) und `.pagedjs_pages` (`counter-reset: page 0`) geführt, der
   Browser löst ihn im `::after` auf. Kein Eingriff nötig, nur eine Seitenzahl je Seite und
   keine zweite in `@bottom-center`, sonst steht dieselbe Zahl doppelt.
4. **`publicDir: false` lehnt Astro 7 ab** (`Expected type "string", received "boolean"`).
   Der Ordner `src/book/public` wird deshalb gar nicht erst angelegt; Astro findet
   schlicht keinen.

Zwei eigene Fehler, die nur am fertigen PDF sichtbar wurden:

* `pdfPage.setTrimBox(x, y, breite, hoehe)` erwartet **Breite und Höhe**, nicht die rechte
  obere Ecke, und schreibt selbst `[x, y, x + breite, y + hoehe]`. Mit Eckpunkten wird die
  Box um deren Betrag zu groß, hier 148 × 210 mm zu 151 × 213 mm.
* Die seitlichen Beschnittmarken sitzen bei Paged.js 2 mm neben dem Schnitt, die oberen und
  unteren direkt daran (`--pagedjs-crop-offset: 2mm` greift nur seitlich). Der Wert ist in
  `book.css` auf `0.27mm` gesetzt, damit alle vier Marken denselben Abstand halten.
  Maßgeblich bleibt die TrimBox im PDF.
* **sharp füllt einen transparenten Grund schwarz, sobald als JPEG konvertiert wird.** Die
  neun Wissensmotive aus `src/pic/smallactors/` sind PNG mit Alphakanal. `getImage` bekommt
  für diese Bilder deshalb `format: 'png'`; `pages/*` und `actors/*` sind deckend und laufen
  weiter als JPEG. `pdfimages -list` zeigt die Wissensmotive deshalb mit `smask`, die
  Rezeptbilder ohne.
* **`justify-content: center` greift auf der Bildseite nicht.** Paged.js gibt
  `.pagedjs_page_content` keine volle Höhe, sodass ein Flexcontainer ohne `height: 100%`
  oben klebt. Mit beiden Werten sitzt das Motiv mittig.

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

**Gelöst am 2026-09-30.** `src/book/fonts/` enthält die statischen Schnitte von
EB Garamond (Regular, Medium, SemiBold, Italic) als Fließtext und Cinzel (Regular,
SemiBold) als Display-Schrift, dazu je eine Kopie der OFL-Lizenz. Beide Familien stehen
unter der SIL Open Font License. `book.css` bindet sie per `@font-face` ein, das
Website-Stylesheet bleibt unangetastet.

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

Lösung: im Buchdokument mit `getImage()` ein **einzelnes** Bild ohne `srcset`/`sizes`
rendern, `loading="eager"`, `decoding="sync"`. `SMALL_ACTOR_SIZE` bzw. die Bilddaten
bleiben die einzige Quelle für die Größe. `renderImage()` in
`src/book/pages/index.astro` merkt sich jedes Motiv nach Quelle und Breite, sonst rechnet
sharp dieselbe Datei bis zu 39-mal neu.

**Das Zielformat entscheidet über die Transparenz.** JPEG kennt keinen Alphakanal, und
sharp füllt die-transparenten Stellen schwarz, statt sie zu komponieren. Betroffen sind
die neun Wissensmotive aus `src/pic/smallactors/`, die als RGBA mit vollständig
transparenten Ecken vorliegen. Sie bekommen deshalb `format: 'png'`. `src/pic/pages/*`
und `src/pic/actors/*` sind deckend (RGB) und laufen weiter als JPEG, wo die Qualitätsstufe
über die Dateigröße entscheidet.

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
    ├── fonts/            EB Garamond und Cinzel (TTF) plus OFL-Lizenzen
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
	build: { assets: 'astral', inlineStylesheets: 'never' },
});
```

`assets: 'astral'` und `inlineStylesheets: 'never'` halten die `astro:assets`-Bilder und das
Stylesheet als eigene Dateien. `publicDir` wird weggelassen, weil der Wert `false` in
Astro 7 abgelehnt wird. `site` und `base` fehlen bewusst, das Buch hat keine kanonischen
URLs.

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

`npm run build` bleibt unverändert bei 79 Seiten. Das PDF landet in `dist-book/` und
**nicht** in `dist/` — es wird nicht mitdeployt.

### Aufbau des Buchs

```text
Titelblatt → Inhaltsverzeichnis → Vorwort → Gestalten → Wissen → Rezepte → Register
```

**Ein Dokument, fortlaufende arabische Zählung von der Titelseite an.** Der ursprüngliche
Plan sah zwei Dateien vor, weil Paged.js die Seitenzählung nicht zurücksetzen kann
(Issue #31) und weil die Doku für unterschiedliche Seitenformate zwei Dateien verlangt.
Beides trifft hier nicht zu: Es gibt nur ein Format, und die Titelseite soll mitgezählt
werden, weil das Inhaltsverzeichnis sonst um eine Zahl danebenliegt. Der Nachteil — das
Inhaltsverzeichnis nennt keine römischen Vorlaufzahlen — ist bei 113 Seiten belanglos.
Zwei Dokumente bleiben der Rückfallpfad, falls doch ein Vorlauf ohne Seitenzahlen
entstehen soll; `pdf-lib` kann sie später in einer Datei zusammenführen.

**Gestalten zwischen Vorwort und Wissen.** Connie und Katze stehen auf einer Seite, beide
mit Portrait links und Text rechts. Die Texte kommen aus `src/lib/figuren.ts`, weil sie
auch auf `/ueber-diese-seite/` stehen und dort nicht doppelt im Template gepflegt werden
dürfen. Beide Portraits stammen aus `src/pic/actors/` und laufen als JPEG.

**Rezepte alphabetisch nach `titel`.** Die Rezepte tragen 22 Zutaten-Tags, aber im
Schnitt nur 1,8 Rezepte je Kategorie, plus das auf allen 39 Rezepten liegende Tag
`gemuese`. Eine Gruppierung nach Kategorie zerfällt also in 22 kleine Gruppen. Stattdessen
steht jedes Rezept alphabetisch, beginnt auf einer neuen Seite und nennt seine Kategorien
als Kicker. Die Kategorien werden im **Register der Rezepte** am Ende des Buchs
ausgewertet, dort darf ein Rezept mehrfach erscheinen.

Das Register ist nach Zutat alphabetisch, ohne Anzahl der Rezepte je Zutat. Unter jeder
Zutat stehen die Rezepte zweispaltig mit `codex_titel` und Seitenzahl, die Seitenzahlen
kommen aus denselben Platzhaltern wie im Inhaltsverzeichnis (`data-toc-page`).

**Jedes Rezept ist ein Blatt.** Das Bild steht auf der rechten Seite (Recto), der
Rezepttext beginnt auf der Rückseite (Verso). Das Bild bekommt die gute Seite, der Text
beginnt auf dem Blatt, das man beim Umblättern zuerst umschlägt. Die Reihenfolge entsteht
aus dem Markup, die Seitenlage aus CSS:

```css
.recipe       { break-before: left; }
.recipe-plate { break-before: right; }
```

In `src/book/pages/index.astro` steht deshalb `.recipe-plate` vor `.recipe`. Die
Bildseite trägt nur das Bild: keine Bildunterschrift und keinen Kolumnentitel, sonst
stünde dort der Titel des vorherigen Rezepts, weil das Rezept an dieser Stelle noch gar
nicht im Textfluss ist. `data-book-ref` steht nur am Rezepttext, damit das
Inhaltsverzeichnis nicht auf eine Bildseite zeigt.

Läuft ein Rezepttext über eine Seite hinaus, läuft er auf der Folgeseite weiter. Weil das
Bild danach wieder rechts stehen muss, schiebt der Umbruch automatisch eine Leerseite
dazwischen. Leerseiten sind damit eine Folge der Regel und keine festen Seiten im
Template. Bei 39 von 39 Rezepten, die auf eine Seite passen, entsteht im aktuellen Stand
keine einzige zusätzliche Leerseite im Rezeptteil.

**Nur die Codex-Überschrift.** Das Blatt nennt `codex_titel` groß, darüber die Kategorien
als Kicker. Den sachlichen `titel` führt das Buch nicht mehr. Auf der Website bleibt er
stehen, weil er dort für SEO, Brotkrümelnavigation und die Beschriftung der Karten
gebraucht wird; im Buch gibt es keine dieser Anforderungen, und der Kodex-Charakter
wird durch die Codex-Überschrift allein getragen.

Ohne Header, Footer, Brotkrümelnavigation und Site-Shell. Keine erfundenen Texte: Titel
und Zeile auf dem Titelblatt stammen aus der Website (`Das Ferment`,
`Aus der Küche der Geduld`), alle Zahlen aus den Daten.

### `book.css`

`@page` mit Beschnitt, Passerzeichen und `marks: crop`, Satzspiegel über
`@page :left` / `@page :right`, Kolumnentitel über `var(--laufender-kopf, "")`, Seitenzahl
als `counter(page)` in `@bottom-left` / `@bottom-right`, Typografie in `pt`.
`break-before: left` für den Rezepttext und `break-before: right` für die Bildseite und
die drei Buchteile, `break-inside: avoid` für Zutatenliste, Ratschlag und Tabellen. Keine
Media Queries, kein `vw`.

Das Rezeptbild steht 113 mm breit im Satzspiegel, damit 169,5 mm hoch nach dem
Seitenverhältnis der Quelle (1024 × 1536). `height: 100%` und `justify-content: center` auf
`.recipe-plate` gehören zusammen: ohne die volle Höhe klebt das Motiv oben, weil Paged.js
dem Flexcontainer keine Höhe gibt. `margin: 0` auf `.recipe-plate__frame` ist ebenfalls
Pflicht, sonst schiebt der Standardrahmen des `<figure>` (`margin: 1em 40px`) das Bild um
80 px schmaler.

Der Kolumnentitel entsteht bewusst nicht über `string-set`, siehe die Beobachtungen in
Abschnitt 3. Die Randboxen der Titelseite (`@page :first`) bleiben leer.

### `scripts/make-pdf.mjs`

Puppeteer mit gesetztem Viewport, `emulateMediaType("print")`,
`preferCSSPageSize` aktiv, `page.pdf()` mit `printBackground: true`.

Reihenfolge nach `PagedPolyfill.preview()`, alles ohne zweiten Umbruch:

1. Kolumnentitel je Seite in `--laufender-kopf` schreiben.
2. Inhaltsverzeichnis füllen. Die Platzhalter sind zweistellig breit, das Einfügen
   verschiebt also keine Seite.
3. Lesezeichen aus `[data-outline]` sammeln, dazu unsichtbare `<a href="#…">` einhängen,
   weil Chromium nur für verankerte Links ein PDF-Ziel anlegt.
4. Media- und Trimbox je Seite messen, PDF schreiben, TrimBoxen und Outline mit `pdf-lib`
   nachtragen.

## 6. Phasen

| # | Phase | Inhalt | Stand |
| --- | --- | --- | --- |
| 0 | **Entscheidungen** | Die sechs offenen Punkte aus Abschnitt 7 klären. | erledigt 2026-09-30 |
| 1 | Datenweg | `src/lib/book.ts`: Rezepte sortieren, Kategorien-Register, Front-Matter-Bausteine. Nur die vorhandenen JSON-Quellen. | erledigt 2026-09-30 |
| 2 | Buchroute | `src/book/pages/index.astro`: ein `<body>` mit allem Inhalt, Bilder über `getImage` in fester Breite, ohne Header, Footer, Breadcrumbs und Site-Shell. | erledigt 2026-09-30 |
| 3 | `book.css` | `@page`, Satzspiegel, Seitenzahl, Typografie in `pt`, `@font-face`. | erledigt 2026-09-30 |
| 4 | Generatorskript | Puppeteer + pagedjs, Viewport gesetzt, ein Durchlauf. | erledigt 2026-09-30 |
| 5 | Inhaltsverzeichnis | Seitenzahlen aus dem fertigen Umbruch in die Platzhalter schreiben, Punct-Leader mit einem Flex-Band aus `border-bottom: dotted` nachbauen. **Kein zweiter Durchlauf nötig**, die Platzhalter sind brechendurch gleich breit. | erledigt 2026-09-30 |
| 6 | Silbentrennung | `hyphenation.de` (npm 0.2.1) plus `hypher` als Build-Zeit-Transformation, die weiche Trennzeichen in die Druckfassung schreibt. Bewusst als Build-Schritt, damit die Druckfassung nicht von System-Wörterbüchern abhängt. | erledigt 2026-09-30 |
| 7 | CI | Eigenständiger Job neben dem Website-Deploy, Chromium-Version gepinnt, PDF als Artefakt. | Workflow angelegt, erster Lauf steht aus |
| 8 | Blatt je Rezept | Bild auf der rechten Seite, Rezepttext auf der Rückseite. `.recipe-plate` steht im Markup vor `.recipe`, `break-before: right` auf `.recipe-plate`, `break-before: left` auf `.recipe`. Die Bildseite trägt nur das Bild, ohne Bildunterschrift und Kolumnentitel. Ein langer Text läuft auf der Folgeseite weiter, der Umbruch schiebt dann eine Leerseite dazwischen. | erledigt 2026-10-01 |
| 9 | Transparente Bilder | Die neun Wissensmotive aus `smallactors/*` bleiben PNG. `pages/*` und `actors/*` sind deckend und laufen als JPEG. | erledigt 2026-09-30 |

### Stand nach der Umsetzung

| | |
| --- | --- |
| Umfang | 113 Seiten: Titel, Inhalt (2), Vorwort (5), Gestalten (6), Wissen (15: 7 bis 21), Rezepte (86: 23 bis 108 aus einem Kapitelblatt, 41 Bildseiten, 42 Textseiten und zwei Leerseiten), Register (5: 109 bis 113), vier Leerseiten insgesamt (4, 22, 24, 48) |
| Gestalten | „Connie und Katze“ auf Seite 6, Text aus `src/lib/figuren.ts`, dieselbe Quelle wie `/ueber-dische-seite/`. Beide Portraits 24 mm breit links neben dem Text, 384 px, JPEG |
| Register | „Register der Rezepte“, 28 Zutatengruppen alphabetisch, ohne Anzahlangabe. Die Rezepte stehen zweispaltig darunter mit `codex_titel`, Punct-Leader und Seitenzahl |
| Seitengröße | MediaBox 154,18 × 215,9 mm, TrimBox 148 × 210 mm bei 3 mm Versatz |
| Rezeptseiten | 41 von 41 als Blatt: Bild auf der rechten Seite 25, 27, … 45 und 49, 51, … 107, der Rezepttext auf der Rückseite 26, 28, … 46 und 50, … 108. Ein Rezepttext läuft über und nimmt die Seite 47 rechts mit, die Leerseite 48 hält das nächste Bild wieder auf einer Recto-Seite. Davor steht das Kapitelblatt „Die Rezepte“ auf 23, die Leerseite 24 schiebt das erste Bild auf 25 |
| Lesezeichen | 77, davon 3 Haupteinträge, 2 Gestalten, 9 Wissensgruppen, 21 Einträge, 41 Rezepte und die Überschrift „Connie und Katze“ |
| Dateigröße | 13,6 MB bei 768 px Bildbreite und JPEG 80 |
| Rezeptbild | 113 mm breit, 169,5 mm hoch, mittig auf einer Satzspiegelmitte von 74 mm, Seitenverhältnis wie die Quelle |
| Rezeptüberschrift | nur `codex_titel`, Kategorien als Kicker darüber, kein sachlicher `titel` im Buch |
| Transparenz | 19 `smask`-Einträge in `pdfimages -list`, ausschließlich auf den Wissensseiten. Die Rezeptbilder sind deckend und haben keinen |
| Kolumnentitel | 48 von 113 Seiten: alle Text- und Wissensseiten, keine Bildseite, Titelseite ohne Randinhalt |
| Offen | Erster CI-Lauf, Wissen-Teil mit neun Gruppenbeginnen auf neuen Seiten (15 Seiten: 7 bis 21) |

### Prüfstand des letzten Laufs

Alles mit den Bordmitteln des Projekts nachprüfbar, `poppler-utils` vorausgesetzt:

| Prüfung | Kommando | Ergebnis |
| --- | --- | --- |
| Umbruch | `npm run make:pdf` | 113 Seiten im Umbruch, 113 gemeldet |
| Inhaltsverzeichnis | Ausgabe von `make-pdf.mjs` | 75 Sprungmarken, 77 Lesezeichen, keine fehlende Seite |
| Lesezeichen | `pdf-lib` über das fertige PDF | 77 Einträge, 3 Haupteinträge, keine weichen Trennzeichen in den Titeln |
| Seitengröße | `pdf-lib` | MediaBox 154,18 × 215,9 mm, TrimBox 148 × 210 mm bei 3 mm Versatz |
| Rezeptpaare | `npm run check:book` | 41 Bildseiten 25 bis 107 auf Recto, je mit Text auf der Rückseite, eine Fortsetzungsseite 47, keine mit Kolumnentitel, Bild 113 mm breit und mittig |
| Blattsatz | `npm run check:book` | kein Element steht im Blocksatz: `text-align: left` im Body und kein Überschriften-, Kicker- oder Claim-Element erbt `text-align-last: justify` |
| Anker | `dist-book/index.html` | 78 `id`, keine doppelt, keine tote Sprungmarke |
| Website | `npm run build` | 79 Seiten, unverändert |

`scripts/buch-pruefen.mjs` macht diese Prüfungen. Sie misst den fertigen Paged.js-Umbruch
im Browser und das fertige PDF mit `pdfinfo`, `pdftotext` und `pdfimages`. Aufruf über
`npm run check:book`.

Warum beides und nicht nur das PDF: Der DOM kennt die berechneten Stile, nur dort lässt
sich der geerbte Blocksatz messen. `pdftotext` zerlegt Small-Caps-Kicker in einzelne
Zeilen und taugt deshalb nicht für Typografie-Messungen. Der erste Entwurf der Prüfung
suchte im PDF-Textlayer nach gedehnten Zeilen und fand nichts, obwohl der Fehler im DOM
deutlich sichtbar war.

Zwei Fehler dieses Laufs, die nur deshalb sichtbar wurden, weil am fertigen PDF und nicht
am DOM gemessen wurde:

* Die Rezeptschleife lief über `chapters` statt über `folios`. `image` war damit
  `undefined`, und alle 39 Bildseiten fehlten im HTML, ohne dass der Build eine Warnung
  gab. Das prüft man nur mit `grep -c 'recipe-plate' dist-book/index.html`, nicht mit dem
  grünen Build.
* Ein Flexcontainer mit `justify-content: center` klebt ohne `height: 100%` oben, weil
  Paged.js `.pagedjs_page_content` keine volle Höhe gibt. Beide Eigenschaften gehören
  zusammen.

Der Wissen-Teil ist der einzige Bereich mit mehreren halbleeren Seiten: Jede der neun
Gruppen beginnt auf einer neuen Seite, dadurch bleiben sechs Seiten unter halb voll. Das
ist der klassische Kapitelbeginn und wurde bewusst so gelassen; wer später dichter
drucken will, streicht `break-before: page` bei `.knowledge-group`.

## 7. Getroffene Entscheidungen (Phase 0, 2026-09-30)

| # | Frage | Entscheidung | Folge |
| --- | --- | --- | --- |
| 1 | **Zielformat?** | **148 × 210 mm (A5)** | Satzspiegel ca. 113 mm, Bilder mit ~230 dpi. Kleinere Formate bringen keinen Gewinn mehr, größere werden weich. |
| 2 | **Umfang?** | **Ein PDF mit allen 39 Rezepten** | Ein Durchlauf, ein fertiges Band. Aufteilung nach Kategorien bleibt der Rückfallpfad, falls der Speicherbedarf kippt. |
| 3 | **Schriften?** | **Ja, EB Garamond für den Fließtext, Cinzel als Display** | OFL, selbst gehostet in `src/book/fonts/`. Website-Stylesheet bleibt unverändert. |
| 4 | **Abhängigkeiten?** | **Ja, `pagedjs` und `puppeteer` als devDependencies, exakt gepinnt** | `pagedjs` 0.4.3, `puppeteer` 25.12.0. Die CLI wird nicht benutzt, sie setzt den Viewport nicht und kennt keine Silbentrennung. |
| 5 | **PDF-Ablage?** | **Nur lokal in `dist-book/`, kein Deploy** | Kein Eingriff in den Website-Deploy. Veröffentlichen kann später als eigener Schritt dazukommen. |
| 6 | **CI-Form?** | **Eigener Job, unabhängig vom Website-Deploy** | Ein Buchfehler blockiert die Website nicht. |

Dazu zwei Festlegungen aus der Umsetzungsvorbereitung:

* **Reihenfolge der Rezepte:** alphabetisch nach `titel`, mit Register der Rezepte am Ende,
  darin alphabetisch nach Zutat.
  Die Sortierung bleibt nach `titel`, auch wenn die Überschrift `codex_titel` ist.
* **Rezeptüberschrift:** nur `codex_titel`, groß, mit den Kategorien als Kicker darüber.

### Lokale Voraussetzungen für den PDF-Lauf

Das gebündelte Chromium braucht Systembibliotheken, die ein schlanker Container nicht
mitbringt. Unter Debian/Ubuntu:

```bash
sudo apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
	libatspi2.0-0 libcups2 libdbus-1-3 libgbm1 libxkbcommon0 libxcomposite1 \
	libxdamage1 libxfixes3 libxrandr2 libasound2 libpango-1.0-0 libcairo2
```

Auf `ubuntu-latest` in CI sind sie vorhanden. Chromium startet nur mit
`--no-sandbox --disable-dev-shm-usage` in Containern ohne Root-Rechte.

Für die Kontrolle des fertigen PDF hilfreich, aber nicht nötig für den Bau:

```bash
sudo apt-get install -y poppler-utils python3-pil
pdfinfo dist-book/das-ferment.pdf          # Seitenzahl, Seitengröße, Metadaten
pdftotext -f 20 -l 20 -layout dist-book/das-ferment.pdf -   # Text, Seitenzahl, Kolumnentitel
pdftoppm -r 300 -f 20 -l 20 -png dist-book/das-ferment.pdf s20   # Beschnittmarken im Bild prüfen
```

`textContent` der Randboxen im DOM taugt als Nachweis nicht, siehe Beobachtung 2 in
Abschnitt 3.

## 8. Was die Trennung nicht löst

Unverändert offen, unabhängig von Stufe 1:

- **Bildauflösung 1024 × 1536** — die Obergrenze liegt im Material, nicht im Werkzeug.
  768 px Rezeptbildbreite ergeben auf 113 mm rund 173 dpi; für einen echten Offset-Druck
  wäre Material in 2× besserer Auflösung die einzige wirksame Verbesserung.
- **Paged.js-Lücken** — kein `target-counter` (Inhaltsverzeichnis braucht Phase 5), kein
  `leaders()`, keine Seitenzahl-Reset für den Vorlauf.
- **Keine Webfonts auf der Website** — im Buch durch `src/book/fonts/` gelöst, die
  Website behält ihre System-Stacks. Das ist Absicht, kein Restproblem.
- **Kein `target-counter`** — die Seitenzahlen im Inhaltsverzeichnis kommen aus dem
  fertigen Umbruch in einem Durchlauf. Vor einem Upgrade muss geprüft werden, ob Paged.js
  das wieder selbst kann; der Kolumnentitel umgeht `string-set` wegen eines Fehlers in
  Version 0.4.3.
- **Seitenzahl-Stabilität** — wird durch den eigenen CI-Job besser, aber nicht gelöst.

## 9. Risiken

| Risiko | Wirkung | Gegenmaßlage |
| --- | --- | --- |
| Paged.js ohne Release seit 2023, 236 offene Issues | Bug im Umbruch, keine Upstream-Fixes | Version pinnen, Generatorskript eigenständig halten, Ausweichpfad `pagedjs@0.5.0-beta.2` |
| Font-Metrik und Trennungskontext | Seitenzahl schwankt zwischen Maschinen | Fonts pinnen, nur in CI generieren, Seitenzahl im PDF protokollieren |
| `vw` und Media Queries | Layout kollabiert | Buch-Stylesheet ohne `vw` und ohne Media Queries, dafür `--pagedjs-pagebox-width` |
| `overflow: hidden` auf `.site-shell` | Seitenboxen abgeschnitten | Buchinhalt außerhalb der Site-Shell |
| 1024 px Quellbilder | matschiger Offset-Druck | kleines Format wählen oder Bildmaterial neu anliefern |
| 113 Seiten in einem Chromium | Speicher / Zeit | Läuft mit 13,6 MB stabil durch, Kategorie-PDFs bleiben der Rückfallpfad |
| `astro: ^7.3.5` und `@page`-Semantik | Minor-Update bricht Buchbau | Build des Buchs separat, Site-Build bleibt unberührt |
| `publicDir: false` in Astro 7 | Book-Build scheitert an einer Typprüfung | Ordner weglassen statt auf `false` setzen |
| `string-set` in Paged.js 0.4.3 | Kolumnentitel bleiben leer | Variable in `make-pdf.mjs` selbst setzen, Vor Upgrade prüfen |

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
