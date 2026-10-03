# Das Ferment — Projektregeln für Agenten

Statische Rezeptwebsite mit Astro. Inhalte kommen vollständig aus zwei JSON-Dateien, es gibt kein clientseitiges JavaScript und keine UI-Frameworks.

Diese Datei ist die einzige Quelle für Projektregeln. Detailwissen, das hier nicht steht, gehört hierher und nicht in eine Agent-Datei.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Befehle

| Befehl | Wirkung |
| --- | --- |
| `npm run dev` | `astro dev --host 0.0.0.0` |
| `npm run build` | statischer Build nach `dist/`, aktuell 73 Seiten |
| `npm run preview` | Build lokal ansehen |
| `npx astro build` | Build ohne npm-Skript, wenn `npm` nicht verfügbar ist |
| `npm run build:book` | Buch-Build nach `dist-book/`, eine Seite, aktuell 102 Seiten |
| `npm run make:pdf` | Buch-Build plus `dist-book/das-ferment.pdf` |
| `npm run check:book` | prüft den fertigen Umbruch im Browser und das PDF, siehe `scripts/buch-pruefen.mjs` |
| `npm run check` | Website, Buch, PDF und Buchprüfung in einem Durchlauf |

`npm run check:book` braucht `poppler-utils` für die PDF-Seite. Im Devcontainer ist es
über `.devcontainer/Dockerfile` installiert, lokal `sudo apt-get install -y poppler-utils`.

`npm run make:pdf` braucht zusätzlich Chrome für Puppeteer. Im Devcontainer legt das
`Dockerfile` es unter `PUPPETEER_CACHE_DIR=/home/node/.cache/puppeteer` ab, lokal
`npx puppeteer browsers install chrome`. Die Chrome-Version folgt der gepinnten
`puppeteer`-Version in `package.json`. Fehlt eine Systembibliothek, meldet Chrome
`error while loading shared libraries`; das `Dockerfile` installiert genau die Liste, die
dann passt. Puppeteers eigenes `--install-deps` funktioniert auf Debian nicht, weil es
das apt-Paket `google-chrome-stable` nachzieht und dafür das Google-Repository fehlt.

`npx astro check` funktioniert nicht, solange `@astrojs/check` und `typescript` nicht installiert sind. Nicht eigenmächtig installieren, sondern vorher fragen.

## Projektstruktur

```text
src/
├── components/        Header.astro, Footer.astro, RecipeCard.astro, SeoHead.astro
├── data/              das_ferment.json, das_ferment_infos.json
├── lib/               recipes.ts, infos.ts, pageImages.ts, actorImages.ts, smallActors.ts, categoryImages.ts, social.ts, book.ts, figuren.ts
├── pages/             index, rezepte, kategorien, wissen, ueber-diese-seite, kontakt, impressum, sitemap.xml.ts, robots.txt.ts
├── pic/               pages/ (Rezeptillustrationen), actors/ (Ratschlag-Portraits), smallactors/ (Wissenseite), categories/ (Kategorieseite)
├── styles/            global.css
└── book/              nur Buchausgabe, siehe Abschnitt Buchdruck
    ├── fonts/         EB Garamond und Cinzel als TTF, dazu OFL-Lizenzen
    ├── pages/index.astro
    ├── styles/book.css
    └── hyphenate.ts   Silbentrennung zur Build-Zeit
```

`src/styles/global.css` ist das einzige Stylesheet der Website. Keine weiteren CSS-Dateien für die Website anlegen. `src/book/styles/book.css` gehört zur Buchausgabe und wird nie von der Website geladen.

## Architektur

Verwendet werden Astro, TypeScript (`astro/tsconfigs/strict`), HTML, CSS, JSON. Sonst nichts.

Beide JSON-Dateien sind Single Source of Truth:

* `src/data/das_ferment.json` — 40 Rezepte, aktuell alle mit `picture`, `ratgeber` und `codex_einleitung`
* `src/data/das_ferment_infos.json` — 18 Wissenseinträge, 9 Kategorien, 20 Abschnitte, 2 Tabellen

Regeln:

* Rezeptdaten dürfen nicht in Astro-Templates dupliziert oder umformuliert werden.
* Jedes Rezept nutzt dasselbe Template. Keine individuellen Seiten pro Rezept.
* Unterschiede zwischen Rezepten kommen aus den Daten.
* Die Rezeptseite darf nicht davon abhängen, dass JavaScript im Browser zuerst eine JSON-Datei lädt.

## URLs

| Seite | Pfad |
| --- | --- |
| Start | `/` |
| Rezepte | `/rezepte/`, `/rezepte/<slug>/` |
| Kategorien | `/kategorien/`, `/kategorien/<kategorie>/` |
| Wissen | `/wissen/` |
| Über diese Seite | `/ueber-diese-seite/` |
| Kontakt | `/kontakt/` |
| Impressum | `/impressum/` |
| Hilfsdateien | `/sitemap.xml`, `/robots.txt` |

Die Site liegt unter `base: /dasferment` auf GitHub Pages. Konsequenzen:

* Jeder interne Link wird über `import.meta.env.BASE_URL` gebildet, niemals als hartkodierter absoluter Pfad.
* `src/pages/sitemap.xml.ts` enthält auch die Wissensseite und alle Kategorien.
* Neue öffentliche Seite in `sitemap.xml.ts` eintragen und in `Header.astro` verlinken.

## Rendering und JavaScript

Statische Generierung mit `getStaticPaths()`. Jede Seite muss als vollständiges HTML im Build entstehen.

Kein clientseitiges JavaScript, solange ein konkreter interaktiver Anwendungsfall nicht vorliegt. Vor JavaScript immer prüfen, ob Astro, HTML oder CSS reichen. Svelte, React oder Vue werden nicht eingeführt.

## Kodex-Konzept

Die Rezeptdaten enthalten zwei redaktionelle Ebenen, die getrennt behandelt werden.

**Sachliche Ebene** — `titel`, `tags`, `zutaten`, `zubereitung`, `picture`. Wird unverändert übernommen und für SEO, Übersichten, Breadcrumbs und Navigation verwendet.

**Kodex-Ebene** — Felder mit dem Präfix `codex_`. Sie gehören zur mittelalterlichen Präsentation und sind ein Gestaltungselement.

`codex_titel` ist bewusst nicht identisch mit `titel`:

```text
Rezepttitel: Klassische Salzgurken (Milchsäuregärung)
Kodex-Titel: Von den gesalzenen Gürkchen und ihrer milden Gärung
```

Wenn Kodex-Texte erzeugt werden:

1. Das Rezept selbst bleibt unverändert.
2. `codex_titel` interpretiert das Rezept atmosphärisch.
3. `codex_einleitung` bleibt kurz.
4. Mittelalterlich klingen, aber verständlich bleiben.
5. Keine historischen Quellen, Zutaten oder Arbeitsschritte erfinden.
6. Der Stil bleibt über alle Rezepte hinweg konsistent.

## Ratgeber

`ratgeber` ist ein redaktionelles Gestaltungselement am Ende der Rezeptseite:

```json
"ratgeber": { "sprecher": "Connie", "text": "…" }
```

Es darf humorvoll sein und praktische Hinweise aus dem Rezept aufgreifen, aber keine sicherheitsrelevanten oder fachlichen Aussagen erfinden. Fehlt `ratgeber`, wird kein künstlicher Ratgeber erzeugt.

Aufbau der Ausgabe:

```text
┌────────────────────────────────────────────┐
│        ❦ Connies Ratschlag ❦              │
│                                            │
│   [ ] „Nimm dich der Gürkchen an ...“      │
│    ↑ Portrait                              │
│      (Text bleibt mittig)                  │
└────────────────────────────────────────────┘
```

* `<aside>` mit `aria-label`, Ornamente `✦` mit `aria-hidden="true"`, Zitattext in deutschen Anführungszeichen.
* Textbereich aus `<h2>` und `<blockquote>` bleibt immer exakt mittig, das Portrait steht links daneben.
* Reicht der Platz nicht, wandert das Portrait zentriert über den Text.
* Kein horizontales Scrollen, keine festen Pixelbreiten, nur `clamp()` und `aspect-ratio`.

### Portrait des Ratschlags

Die Portraits liegen in `src/pic/actors/`, der Dateiname entspricht `sprecher` in Kleinschreibung (`Connie → connie.png`). Die Zuordnung übernimmt `actorImageFor()` aus `src/lib/actorImages.ts`.

* Gibt es kein Portrait, wird der Ratschlag ohne Portrait gerendert. Kein kaputtes `<img>`, kein leerer Platzhalter, kein erfundenes Bild.
* Portraits dürfen **nie beschchnitten** werden: kein `object-fit: cover`, kein `object-position`-Trick, kein abschneidender `border-radius`. `object-fit: contain` ist die Absicherung.
* Kein Rahmen, kein Schatten, keine abgerundeten Ecken. Die Buchmalerei steht frei im Text.
* Alt-Text wird aus `sprecher` abgeleitet, zum Beispiel „Connie in der Schreibkammer“.
* Auslieferung über `astro:assets` mit `Image`, `widths`, `sizes`, `loading="lazy"`, `decoding="async"`. Die mehreren Megabyte großen Quelldateien werden nie direkt referenziert.

### Layout des Ratschlags

Zwei symmetrische Außenspalten halten den Text trotz Portrait mittig:

```css
.recipe-advisor {
	container-type: inline-size;
}

.recipe-advisor__content {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
	align-items: center;
}

.recipe-advisor__portrait {
	grid-column: 1;
	justify-self: end;
	width: clamp(4.85rem, 8.4vw, 8.6rem);
	aspect-ratio: 2 / 3;
}
```

Reicht der Platz nicht mehr, schaltet eine Container-Query auf eine Spalte mit `justify-items: center` um. Die Schwelle muss mindestens betragen:

```text
max-width des Textes + 2 × (Breite des Portraits + Gap)
```

Aktuell `34rem` Text plus `2 × (8.6rem + 1.5rem)`, also `@container (max-width: 55rem)`. Wird das Portrait vergrößert, muss die Schwelle mitwachsen, sonst wird der Textblock aus der Mitte geschoben. Ein reines `flex-wrap` reicht nicht, weil Text und Portrait dann als Gruppe zentriert würden.

## Wissensseite

Alle Einträge aus `das_ferment_infos.json` stehen auf **einer** Seite: `/wissen/`. Sie ist in der Hauptnavigation zwischen „Kategorien“ und „Über diese Seite“ verlinkt.

Aufbau: Breadcrumbs, Überschrift mit Anzahlen, Sprungmarken-Navigation zu allen Gruppen, pro Gruppe ein `<section>`, pro Eintrag ein `<article>` mit `id={info.id}`. Gruppen-IDs erhalten das Präfix `gruppe-`, damit sie sich nicht mit einer `info.id` überschneiden.

```text
──────── Was passiert bei der Fermentation? ────────   ← info.titel
Von der wundersamen Verwandlung des Gemüses           ← info.codex_titel
Wenn frisches Gemüse in rechter Weise …                ← info.codex_intro

  Von den kleinen unsichtbaren Helfern                  ← abschnitt.codex_titel
  Es sind gar kleine und dem Auge verborgene Wesen …   ← codex_text oder codex_liste
```

**Kodex-Feld zuerst, normales Feld als Fallback.** Die Helfer `codexText()` und `codexListe()` in `src/lib/infos.ts` übernehmen das:

| Kodex-Feld | Fallback | Verwendung |
| --- | --- | --- |
| `codex_titel` | `titel` | Überschrift |
| `codex_intro` | `intro` | Einleitung |
| `codex_text` | `text` | Absatz |
| `codex_liste` | `liste` | Aufzählung |
| `codex_titel` (Tabelle) | `tabelle.titel` | Tabellenbeschriftung |
| `codex_hinweis` | `tabelle.hinweis` | Hinweis unter der Tabelle |

Weitere Regeln:

* Der normale `titel` steht immer zusätzlich als kleine Zeile über der Kodex-Überschrift (`.codex-kicker`), damit der sachliche Begriff im Dokument steht.
* Fehlt ein Kodex-Feld, entsteht keine Lücke. Fehlt `abschnitte`, wird nur die Einleitung gezeigt.
* `tabelle` ist optional. Tabellen werden mit `<caption>` und `scope` ausgegeben.
* Gruppen werden nach Anzahl der Einträge absteigend sortiert, bei Gleichstand alphabetisch.
* Jede Sprungmarke im Inhaltsverzeichnis muss auch existieren. Tote Anker und doppelte IDs sind Fehler.

### Portraits auf der Wissensseite

Jeder Eintrag zeigt ein 128 × 128 großes Motiv aus `src/pic/smallactors/` (9 quadratische PNGs, 640 × 640), direkt vor dem `.codex-kicker`.

* Auswahl über `assignPortraits()` in `src/lib/smallActors.ts`.
* Die Zuordnung ist **deterministisch**: zwei gemischte Decks aus den 9 Bildern, jedes Bild genau zweimal bei 18 Einträgen, keine direkte Wiederholung an zwei aufeinanderfolgenden Einträgen, bei zwei Builds identisches Ergebnis. Kein Zufall pro Build.
* `SMALL_ACTOR_SIZE` (128) ist die einzige Quelle für die Größe, nicht im Template hartzodieren.
* Ausgabe als `<Image>` mit `width`, `height`, `quality`, `loading="lazy"`, `decoding="async"`.
* Die Bilder sind rein illustrativ, deshalb `alt="" aria-hidden="true"`. Keine Motive beschreiben, die nicht belegt sind.
* Layout: ab 40rem Float links mit Textumbruch, darunter eigener Block über dem Kicker, damit der Kicker auf dem Handy nicht gequetscht wird. `.knowledge-entry::after` hält den Float im Eintrag.

## Design

Mittelalterliches Kochbuch auf Pergament: Pergament, warme Naturfarben, dunkle Tinte, dezente florale Ornamente, historische Serifenschriften, Buchmalerei-inspiriert. Hochwertig und ruhig, keine moderne Fantasy-Game-Optik. Lesbarkeit hat Vorrang vor Dekoration.

* Farben und Abstände kommen aus den Custom Properties am Anfang von `global.css`. Keine Hexwerte inline im Template.
* Keine festen Pixelbreiten für Layout und Typografie, dafür `clamp()`.
* Es darf niemals horizontales Scrollen entstehen.
* Rezeptlayout: auf Desktop Rezeptinformationen links und Rezeptbild rechts, auf kleinen Bildschirmen einspaltig, das Bild darf oberhalb stehen.
* Kodex-Bereich und Rezeptdaten werden visuell getrennt, nicht vermischt.
* Keine dekorativen Bilder, die Layout oder Lesefluss stören.

## Bilder

Alle Bilder werden über `astro:assets` mit `Image` oder `getImage()` ausgeliefert, nie als Originaldatei referenziert. Responsive, optimiert, semantisch korrekt, mit sinnvollem Alt-Text.

| Ordner | Inhalt | Maße | Einsatz |
| --- | --- | --- | --- |
| `src/pic/pages/` | 40 Rezeptillustrationen `1.png` … `40.png` | 1024 × 1536 | Rezeptbild, Karten, Social Card |
| `src/pic/actors/` | `connie.png`, `katze.png` | 1024 × 1536 | Portrait im Ratschlag |
| `src/pic/smallactors/` | `1.png` … `9.png` | 640 × 640 | Portrait auf der Wissensseite |
| `src/pic/categories/` | 26 Kategoriebilder, eine Datei je Kategorie-Slug | 1254 × 1254 | Kachel auf `/kategorien/` |

`pageImages.ts` bildet den Dateinamen über den Key der Rezeptdaten zu, die Portrait-Module über `import.meta.glob` in `actorImages.ts` und `smallActors.ts`.

### Kategorieseite

`/kategorien/` zeigt je Kategorie eine Kachel aus Text links und Bild rechts.

* Der Dateiname in `src/pic/categories/` ist der Kategorie-Slug aus `categorySlug(tag)`, also ASCII und kleingeschrieben: `Möhre → mohre.png`, `Rote Bete → rote-bete.png`, `Wurzelgemüse → wurzelgemuse.png`. Kein `ue` statt `u`, keine erfundenen Namen.
* Die Zuordnung übernimmt `categoryImageFor()` aus `src/lib/categoryImages.ts`.
* Fehlt für einen Slug ein Bild, wird die Kachel ohne Bild gerendert. Kein kaputtes `<img>`, kein leerer Platzhalter.
* Die Bilder sind rein illustrativ, der Kategoriename steht als Text daneben. Deshalb `alt="" aria-hidden="true"`.
* Das Bild steht rechts vom Text, der Pfeil darunter. Breite über `clamp()`, Seitenverhältnis aus der Quelle, `object-fit: contain`, damit nichts beschnitten wird.

### Tags und Kategorien

Die Kategorien entstehen **allein** aus den `tags` der Rezepte. Es gibt keine eigene Kategorienliste im Code und keine festen Seiten pro Kategorie.

* Der Slug ist `categorySlug(tag)`, also `slugify(tag)`. Der Anzeigename ist der Tag selbst. Zwei Tags dürfen nie denselben Slug ergeben, sonst entstehen zwei Seiten mit identischem Titel. Aktuell 26 Tags, 26 Slugs, keine Kollision.
* **Kein Tag-Literal in Templates.** Tags in `src/data/*.json` sind Anzeigenamen mit Umlaut und dürfen umbenannt werden. Wer ein bestimmtes Tag in Code prüft, nimmt `isGeneralTag(tag)` beziehungsweise `hasGeneralTag(recipe)` aus `src/lib/recipes.ts` und vergleicht über `slugify`. Ein hart verdrahtetes `"gemuese"` hat `recipeCategory` auf allen 40 Rezeptseiten und den Chipfilter auf allen 40 Karten stillschweigend abgeschaltet, nachdem das Tag in den Daten zu `"Gemüse"` umbenannt wurde.
* Ein Tag darf in einem Rezept nicht doppelt stehen. `kategorien/index.astro` zählt Tag-Vorkommen statt Rezepte, `kategorien/[category].astro` schiebt das Rezept sonst zweimal in die Liste.
* Das Ober-Tag `Gemüse` trägt für Leser, interne Verlinkung und JSON-LD nichts. Es wird auf Rezeptkarten ausgeblendet und liefert nur `recipeCategory`. Rezepte ohne Ober-Tag, etwa die Obstfermente, bekommen deshalb kein `recipeCategory`. Das ist gewollt.
* Wer einen Tag hinzufügt, braucht ein Bild in `src/pic/categories/<slug>.png`. Fehlt es, rendert die Kachel ohne Bild. Umgekehrt ist ein Bild ohne Slug ein Waisenbild und gehört gelöscht, weil die Quelldatei im Repository liegen bleibt.

## SEO

Jede Seite rendert ihre Meta-Tags über `src/components/SeoHead.astro`. Meta-Tags nicht von Hand duplizieren.

Jede Rezeptseite liefert:

* eindeutigen `<title>`
* Meta Description
* Canonical URL
* semantisches HTML
* Recipe JSON-LD
* sinnvolle Bild-Alt-Texte

Rezeptdaten, die nicht aus der Quelle stammen, werden nicht erfunden.

### JSON-LD der Rezeptseite

| Property | Quelle |
| --- | --- |
| `name` | `titel` |
| `description` | `codex_einleitung`, Fallback `titel` |
| `image` | `picture`, zwei Breiten (800 px und 1200 px) als `ImageObject` |
| `inLanguage` | `"de"` |
| `url`, `mainEntityOfPage` | Canonical URL der Seite |
| `author`, `publisher` | Organization „Das Ferment“ |
| `totalTime` | aus `zubereitung` abgeleitet |
| `recipeCategory` | `hasGeneralTag(recipe) ? GENERAL_TAG_LABEL : undefined` |
| `keywords` | `tags` |
| `recipeIngredient` | `zutaten` |
| `recipeInstructions` | `zubereitung` als `HowToStep` |

Zusätzlich ein `BreadcrumbList` für die vorhandene Brotkrümelnavigation: `Startseite → Rezepte → <Rezepttitel>`.

* URLs in JSON-LD sind absolut und enthalten den `base`-Pfad.
* Unbekannte Werte werden weggelassen, nicht geraten. `undefined` fällt beim Serialisieren automatisch weg.
* `totalTime` liefert `totalTimeIso(recipe)` aus `src/lib/recipes.ts`. Die Funktion sucht Angaben der Form „3 bis 5 Tage“, rechnet sie in Minuten um und gibt die obere Grenze als ISO-8601-Dauer zurück, zum Beispiel `P5D`. Das ist die im Rezepttext genannte Gärdauer, keine frei erfundene Zeit.

Diese Properties werden **nicht** erzeugt, weil die Datenquelle sie nicht hergibt: `nutrition`, `aggregateRating`, `review`, `recipeYield`, `datePublished`, `dateModified`, `recipeCuisine`. Falls sie später in `das_ferment.json` ergänzt werden, dürfen sie ins JSON-LD aufgenommen werden.

### Social Media Cards

`SeoHead.astro` erzeugt neben den klassischen Tags alle Open-Graph- und Twitter-Tags: `og:type`, `og:site_name`, `og:locale`, `og:title`, `og:description`, `og:url`, `og:image`, `og:image:width`, `og:image:height`, `og:image:alt` sowie `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:image:alt`.

* Rezeptseiten nutzen `og:type="article"`, alle übrigen `website`.
* Das Card-Bild erzeugt `socialCard()` aus `src/lib/social.ts`.
* Format ist **JPEG**, weil Twitter keine WebP-Cards unterstützt.
* Zielformat ist 1200 × 630 (`summary_large_image`). Die Bildservice von Astro vergrößert nie (`withoutEnlargement`), deshalb werden `og:image:width` und `og:image:height` aus `min(Ziel, Quellmaß)` berechnet. Die Quellbilder sind 1024 × 1536, die Karten daher 1024 × 630.
* Bildmotive: `fit: "cover"` mit `position: "top"`, damit der obere Bildbereich erhalten bleibt. Dieser Crop betrifft nur die Card, nie die Portraits im Text.
* Ohne passendes Motiv fällt die Seite auf `twitter:card="summary"` ohne Bild zurück. Das gilt für `/wissen/`, `/ueber-diese-seite/` und `/impressum/`.
* Übersichtsseiten ohne eigenes Motiv nehmen das erste illustrierte Rezept über `coverImageFor()` aus `src/lib/pageImages.ts`.
* Alle URLs in den Meta-Tags sind absolut und enthalten den `base`-Pfad.
* `twitter:site` und `twitter:creator` werden weggelassen, solange es keine echten Accounts gibt.

## Impressum

`/impressum/` nennt Anbieter, Anschrift und Kontakt sowie die Bildrechte. Die Angaben stehen als Konstanten im Frontmatter von `src/pages/impressum/index.astro`.

* Die E-Mail wird sichtbar in der Form `amkaltenpolar71(at)gmail.com` ausgegeben, verlinkt aber als echtes `mailto:amkaltenpolar71@gmail.com`, damit sie anklickbar bleibt.
* Der Bildrechtshinweis ist ein eigener Abschnitt mit eigenem Kicker und wird wortgleich wiedergegeben, nicht zusammengefasst.
* Zusätzlich verlinkt die Seite auf das Impressum von am-kalten-polar.blogspot.com für fortlaufend aktualisierte Angaben.

## Konventionen

* Einrückung mit Tabs in `.astro`, `.ts` und `.css`.
* Komponenten `PascalCase.astro`, Seiten `kebab-case.astro` in `src/pages/`, Hilfsmodule `camelCase.ts` in `src/lib/`.
* CSS-Klassen nach dem bestehenden Schema: Block, dann `__` für Teile, Zustände mit `is-`/`has-`.
* Texte in der Oberfläche auf Deutsch, Codebezeichner auf Englisch.
* Keine unnötige Abstraktion. Bestehende Helfer in `src/lib/` zuerst verwenden, bevor neue entstehen.
* Keine Kommentare, die offensichtlichen Code erklären. Nur Hinweise, warum eine Regel existiert.

## Buchdruck

Das Rezeptbuch existiert als zweite Ausgabe: `astro.book.config.mjs` baut `src/book/` nach `dist-book/`, `scripts/make-pdf.mjs` rendert daraus mit Puppeteer und Paged.js das PDF. Der ausführliche Plan mit allen Entscheidungen, Messwerten und den Stolperfallen von Paged.js 0.4.3 liegt in `docs/buchdruck-plan.md`.

* **Getrennte Ausgabe, gemeinsame Daten.** `src/data/` und `src/lib/` werden von beiden Ausgaben genutzt, `src/lib/book.ts` gehört zu beiden. Build, Layout-Hülle und Stylesheet sind getrennt.
* Die Buchausgabe ändert **keine** der obigen Regeln. `global.css` bleibt das einzige Stylesheet der Website, `npm run build` bleibt bei 73 Seiten. Kein `@page`, kein Print-Stylesheet und keine Drucklogik gehören in die Website.
* Das PDF entsteht in einem Durchlauf. `make-pdf.mjs` schreibt Kolumnentitel, Inhaltsverzeichnis und Lesezeichen in das bereits umgebrochene DOM und ruft Paged.js nicht erneut auf.
* Neue Rezepte oder Wissenseinträge brauchen im Buch nichts außer Daten: Reihenfolge, Anker, Kolumnentitel, Inhaltsverzeichnis und Register entstehen aus `src/lib/book.ts` und dem Template.
* Geänderte Seitenzahlen sind normal. Nach jedem Umbruch neu bauen und die Seitenzahl im PDF prüfen, nicht im DOM.
* `pagedjs`, `puppeteer`, `pdf-lib`, `hypher` und `hyphenation.de` sind devDependencies und exakt gepinnt. Vor einem Upgrade Paged.js prüfen: Der Kolumnentitel umgeht `string-set` wegen eines Fehlers in Version 0.4.3.

### Was im Buch gilt und auf der Website nicht

* A5 mit 3 mm Beschnitt, `marks: crop`, Satzspiegel 117 × 180 mm, Seitenzahl außen, Kolumnentitel außen.
* Reihenfolge: Titel, Inhalt, Vorwort, Gestalten, Wissen, Rezepte, Register.
* Die Gestalten Connie und Katze stehen im Buch nach dem Vorwort und auf der Website unter `/ueber-dische-seite/`. Beide Ausgaben lesen `FIGUREN` aus `src/lib/figuren.ts`, die Texte stehen nirgends im Template.
* Ein Rezept je Blatt, alphabetisch nach `titel`, Register der Rezepte am Ende, darin alphabetisch nach Zutat. Ohne Anzahl der Rezepte je Zutat, die Rezepte zweispaltig mit `codex_titel` und Seitenzahl.
* Jedes Rezept ist ein Blatt: Das Bild steht auf der rechten Seite (Recto), der Rezepttext beginnt auf der Rückseite (Verso). Wird der Text länger als eine Seite, läuft er auf der nächsten Seite weiter; der Umbruch schiebt dann eine Leerseite dazwischen, damit das Bild des nächsten Rezepts wieder rechts steht.
* Überschrift: nur `codex_titel`, groß. Der sachliche `titel` steht nicht im Buch.
* Kein Header, Footer, keine Brotkrümelnavigation, keine Site-Shell.
* Kategorien im Buch kommen aus denselben `tags` wie auf der Website und folgen denselben Regeln: `isGeneralTag()` und `universalTags()` aus `src/lib/book.ts` halten das Ober-Tag und alle gemeinsamen Nenner aus den Blättern und aus dem Register. `universalTags()` zählt **Rezepte**, nicht Tag-Vorkommen, sonst macht ein doppeltes Tag in einem Rezept ein seltenes Tag zum scheinbar gemeinsamen. Das Blatt „Fermentierte Schlehen“ trägt `Obst` und `Schlehe` statt `Gemüse`; ohne den Rezeptzähler stünde `Gemüse` danach auf 39 von 40 Blättern.
* Bild und Text getrennt: `.recipe-plate` steht im Markup vor `.recipe`, `break-before: right` auf `.recipe-plate`, `break-before: left` auf `.recipe`. Leerseiten entstehen aus dieser Regel, nicht aus festen Seiten.
* Die Bildseite trägt nur das Bild: keine Bildunterschrift und keinen Kolumnentitel. `data-book-ref` steht deshalb nur am Text, damit das Inhaltsverzeichnis nicht auf eine Bildseite zeigt.
* Typografie in `pt`, keine Media Queries, kein `vw`, keine Container Queries.
* Bilder mit Transparenz bleiben PNG. Als JPEG verliert sharp den transparenten Grund und füllt ihn schwarz. Das gilt für `smallactors/*`; `pages/*` und `actors/*` sind deckend und laufen als JPEG.
* Alle Bilder über `astro:assets` mit `getImage` in fester Breite, keine Originale im PDF.
* Das Rezeptbild steht 113 mm breit und damit 169,5 mm hoch, mittig im Satzspiegel. Ohne `height: 100%` und ohne `justify-content: center` klebt es oben, weil Paged.js dem Flexcontainer keine volle Höhe gibt. `margin: 0` auf `.recipe-plate__frame` ist Pflicht, sonst schiebt der Standardrahmen des `<figure>` das Bild um 80 px schmaler.

## Vor dem Abschluss prüfen

1. `npm run build` läuft fehlerfrei durch, die Seitenzahl stimmt.
2. Keine doppelten `id`-Attribute und keine toten Sprungmarken.
3. Keine erfundenen Rezept- oder Kontaktangaben; alles stammt aus der Datenquelle.
4. Neue Bilder laufen über `astro:assets` und haben Alt-Text beziehungsweise sind als dekorativ markiert.
5. Neue Seiten: `SeoHead.astro`, Eintrag im Sitemap, Eintrag in der Navigation.
6. Kein horizontales Scrollen, keine festen Layoutbreiten.
7. Bei Änderungen an `src/data/`, `src/lib/book.ts` oder `src/book/` zusätzlich `npm run make:pdf` und `npm run check:book`. Das Skript prüft Bildseite auf Recto, Text auf der Rückseite, stumme Bildseite, Bildbreite und -mitte, geerbten Blocksatz, doppelte `id` und tote Sprungmarken.
8. Geänderte Seitenzahlen im Buch kommen in `docs/buchdruck-plan.md`, Abschnitt „Stand nach der Umsetzung“, nach.

## Skills und Commands

Wiederkehrende Abläufe liegen als Skills und Commands im Projekt, nicht nur hier.

| Datei | Wird geladen für |
| --- | --- |
| `.opencode/skills/buch-umbruch/SKILL.md` | Umbruch des Buchs ändern, Paged.js-Fallstricke, Bild- und Textblatt, Kolumnentitel |
| `.opencode/skills/rezepte-daten/SKILL.md` | Rezepte und Wissenseiten in `src/data/*.json` ändern, Codex-Texte, Ratgeber, Pflichtfelder |
| `.opencode/commands/buch-pruefen.md` | `/buch-pruefen` Buch neu bauen und Umbruch prüfen |
| `.opencode/commands/abschluss.md` | `/abschluss` Checkliste „Vor dem Abschluss prüfen“ durchgehen |
| `.opencode/commands/rezept.md` | `/rezept` Rezept oder Wissenseite in den Daten ändern |

Neue Erkenntnisse aus dem Buchdruck gehören in `buch-umbruch`, Erkenntnisse über
Datenform und Codex in `rezepte-daten`. Diese Datei bleibt die Übersicht, die
Detailwissen gehört in den jeweiligen Skill.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)


## Astro

For Astro questions, always use the official Astro Docs MCP.

## Other libraries

For library documentation, use Context7.

## Paged.js

For Paged.js documentation, use Context7 with:

/pagedjs/pagedjs