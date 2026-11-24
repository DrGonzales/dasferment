# Umsetzungsplan: Website-Review P0 und P1

**Datum:** 2026-11-24
**Quelle:** `WEBSITE_REVIEW.md` vom 24.11.2026, Abschnitte „P0 – sofort" und „P1 – 1–2 Wochen"
**Umsetzung auf dem Branch:** `modernisierung`
**Stand:** Umgesetzt und geprüft am 24.11.2026. Die Änderungen liegen uncommitted auf `modernisierung`; der Pull Request steht noch aus.

## Rahmenbedingungen

- Alle Änderungen entstehen auf dem Branch `modernisierung`. Kein Direkt-Commit auf `main`; nach Abschluss Pull Request mit Verweis auf diesen Plan und auf `WEBSITE_REVIEW.md`.
- Branch anlegen: `git -c safe.directory='*' checkout -b modernisierung`. Das Flag wird wegen der WSL-Freigabe gebraucht; alternativ einmalig `git config --global --add safe.directory <Pfad>`.
- Vor dem Branch-Wechsel den aktuellen Arbeitsstand sichern: `git status` zeigt derzeit geänderte `AGENTS.md` und `CLAUDE.md` sowie die unversionierte Datei `docs/bilderzeugung-plan.md`. Diese Änderungen dürfen nicht verloren gehen und gehören nicht ohne Rückfrage in diesen Branch.
- Das Repository ist die Quelle der Wahrheit. Wo dieser Plan eine in `AGENTS.md` dokumentierte Regel ändert, wird `AGENTS.md` im selben Arbeitsschritt mitgeändert.
- Nicht in diesem Plan enthalten: die Review-Punkte „Suche/Filter" und P2 (Reichweite, eigene Domain, Umami-Events). Sie sind bewusst zurückgestellt.

## Geprüfter Ist-Stand

Die Zahlen der Review treffen inzwischen auf den Code zu; andere Angaben im Repo sind veraltet.

| Thema | Tatsächlicher Stand | Fundstelle |
| --- | --- | --- |
| Rezepte / Wissenseinträge | 55 / 42 | `src/data/*/*.json`, `Kapitel.json` |
| Kapitel | 3 (`lactation`, `gingerbug`, `milchkefir`) | `src/data/Kapitel.json` |
| Tags / Kategorien mit eigener Seite | 56 / 24 (`MIN_CATEGORY_RECIPES = 2`) | `src/lib/recipes.ts`, `src/pages/kategorien/` |
| Illustrierte Rezepte | 55 | Felder `picture` in den Rezeptdaten |
| Wissens-IDs | 42, alle eindeutig | `src/data/*/*_infos.json` |
| Impressum | Adresse `Friedrichstr. 45`, `67678 Mehlignen` ist korrekt und bestätigt | `src/pages/impressum/index.astro` |
| Web3Forms | Domain ist im Web3Forms-Dashboard bereits eingeschränkt; kein externer Schritt nötig | Bestätigung vom 24.11.2026 |
| Autorenfoto | Keines vorhanden; `Person`-JSON-LD ohne `image` | Bestätigung vom 24.11.2026 |
| Veraltet | `README.md` (39/26/22, falscher Datenpfad, „Platzhalter"-Hinweis), `AGENTS.md` (2 Kapitel/52/32/47/22/139 Seiten) | Repo-Dateien |

Das „in3 Kapiteln" aus der Review ist ein Whitespace-Artefakt in `src/pages/ueber-diese-seite/index.astro:111-112`. Die zusammenhängende Adresse im Review-Text ist ein Extraktionsartefakt der `flex`-Spalten in `.impressum-address`.

## Entscheidungen vorab

| Punkt | Entscheidung | Konsequenz |
| --- | --- | --- |
| H1 auf Rezeptseiten | Sachlicher `titel` wird `<h1>`; `codex_titel` bleibt als großer Untertitel `<p class="recipe-intro__codex-title">` | Erfüllt Review-Punkt 4 ohne Gestaltungsverlust. Die gegenteilige Regel in `AGENTS.md` („Kodex-`h1`") wird im selben Schritt ersetzt. Buch und EPUB behalten ihre eigene Überschrift. |
| Kategorie-Zahl | Einheitlich „56 Schlagworte, davon 24 Kategorien mit eigener Seite" | Beide Zahlen sind korrekt, aber nicht dasselbe. Helfer `categoryCounts()` / `MIN_CATEGORY_RECIPES` als einzige Quelle. |
| Wissensseiten | 42 eigene URLs zusätzlich zur Sammelseite; alle bisherigen Anker bleiben | Keine toten Links. Die Sammelseite bleibt indexierbar; leichte Duplicate Content wird bewusst in Kauf genommen und in der GSC beobachtet. |
| `lastmod` | Festes Datum aus einem neuen Feld `stand` in `src/data/Kapitel.json`, nicht das Build-Datum | Deterministische Builds. Die `AGENTS.md`-Notiz „lastmod bleibt leer" wird ersetzt. |
| Autor | `Person` mit `name` und `url`; **`image` entfällt bewusst**, da kein Autorenfoto vorhanden ist. `sameAs`-Ziele bleiben offen. | Kein erfundenes Foto, keine erfundenen Profile. Die `AGENTS.md`-Tabelle wird angepasst. |
| Impressum | Adresse bestätigt und unverändert; ergänzt wird ein KI-Hinweis zu den Illustrationen | Siehe P0.1d. Der veraltete Platzhalter-Hinweis in `README.md` entfällt. |
| KI-Transparenz | Hinweis kommt ins Impressum; „Über diese Seite" bleibt unverändert | Review, Abschnitt „Authentizität". Wortlaut an `docs/bilderzeugung-plan.md` anlehnen, keine Modellnamen oder Details erfinden. |
| Web3Forms | Kein Dashboard-Schritt mehr nötig | Access-Key bleibt bewusst im HTML; das wird in `AGENTS.md` als Absicht dokumentiert. |

---

## P0 – sofort (ca. ½ Tag)

| # | Aufgabe | Dateien | Ergebnis |
| --- | --- | --- | --- |
| 1a | Datenschutzerklärung als eigene Seite: Umami und Web3Forms, Zweck, Speicherdauer, Widerruf; `SeoHead`, Breadcrumbs, Link in Navigation/Footer | neu `src/pages/datenschutz/index.astro`, `src/components/Header.astro` oder `Footer.astro`, `AGENTS.md` | `/datenschutz/` erscheint automatisch in `sitemap-pages-0.xml` |
| 1b | Datenschutzhinweis direkt am Formular, Links auf die neue Seite | `src/pages/kontakt/index.astro` | Hinweis am Ort der Dateneingabe |
| 1c | Adresse bleibt unverändert; nur den veralteten README-Hinweis „enthält derzeit bewusst einen Platzhalter" entfernen | `README.md` | README behauptet nichts Veraltetes mehr |
| 1d | Eigener Abschnitt im Impressum: Die Buchmalereien wurden mit Unterstützung eines lokal betriebenen KI-Modells erzeugt. Sachlich formulieren, ohne Modellnamen, Prompts oder Details zu erfinden; Wortlaut mit `docs/bilderzeugung-plan.md` abgleichen | `src/pages/impressum/index.astro`, ggf. `AGENTS.md` | Transparenz ohne Gewerbe-/Rechtsanspruch; Bildrechte-Abschnitt bleibt unverändert |
| 2a | „Klassische Salzgurken": Salzmenge aus der eigenen 5%-Tabelle ableiten (bei 1 l = 50 g), „steril" → „sauber, heiß ausgespült", „Das Glas verschließen" → Gärverschluss/locker auflegen und Gärgase entweichen lassen, Eichen-/Weinblätter „unbehandelt, Lebensmittelqualität" | `src/data/lactation/das_ferment.json`, Rezept 1 | Fachlicher Widerspruch zum Wissensteil aufgelöst |
| 2b | Audit aller Rezepte auf `verschließen` / `steril` (rund 12 Treffer), nur eindeutig falsche Fälle angleichen | `src/data/*/*.json` | Keine neuen Sicherheitsaussagen erfinden, nur an der eigenen Wissensbasis orientieren |
| 3a | README auf aktuellen Stand bringen: 55/42/3 Kapitel/24 Kategorien/55 Bilder, echte Datenpfade, Routen unter `/kapitel/...`, Umami-Ausnahme, Platzhalter-Hinweis raus | `README.md` | README als Einstieg wieder belastbar |
| 3b | Zahlen in `AGENTS.md` und auf „Über diese Seite" vereinheitlichen, Leerzeichen vor `{chapters.length}` explizit setzen | `AGENTS.md`, `src/pages/ueber-diese-seite/index.astro` | „in3" verschwindet, keine widersprüchlichen Zahlen |
| 4a | Navigation „Kapitel" → „Start" (oder „Kodex"), Ziel bleibt `/`; `isCurrent()` unverändert | `src/components/Header.astro` | Kein irreführender Menüpunkt; Kapitel über `#kapitel` und `ChapterNav` erreichbar |
| 4b | Rezeptseite: `<h1>{recipe.titel}</h1>`, Kodex-Titel als Untertitel, CSS-Selektoren umziehen, `.recipe-intro__recipe-title` entfällt | `src/pages/kapitel/[chapter]/rezepte/[slug].astro`, `src/styles/global.css`, `AGENTS.md` | Genau eine H1, sachlicher Name für SEO, Kodex-Look bleibt; JSON-LD unverändert |

**Prüfung P0:** `npm run build`; Seitenzahl mit vorherigem Build vergleichen; eine Rezeptseite im HTML auf die H1 prüfen; `/datenschutz/` in der Sitemap suchen. Wegen der Datenänderungen zusätzlich `npm run make:pdf && npm run check:book` und `npm run make:epub && npm run check:epub`; geänderte Seitenzahl in `docs/buchdruck-plan.md` nachtragen.

---

## P1 – 1–2 Wochen

### 5. Eigene Wissensseiten (größter Hebel)

- Helfer `infoPath(info)` in `src/lib/chapters.ts` oder `src/lib/infos.ts` ergänzen.
- Neue Route `src/pages/kapitel/[chapter]/wissen/[info].astro` mit `getStaticPaths()` über alle 42 Einträge; Parameter `info` ist die `info.id`, die Eindeutigkeit ist geprüft.
- Template: `ChapterNav`, Breadcrumbs `Startseite → Kapitel → Wissen → Eintrag`, `SeoHead` mit sachlichem `titel` im `<title>` und Kodex-Titel als Lead. JSON-LD: `Article` + `BreadcrumbList`. `FAQPage` nur bei echtem Frage-Antwort-Format; Google zeigt das fast nur noch für Behörden und Gesundheitsseiten, daher keine Rich-Results-Erwartung.
- Sammelseite `.../wissen/index.astro`: je Eintrag einen klaren Link „Eigene Seite" ergänzen; `id={info.id}` bleibt als Anker erhalten.
- Optional eigener Sitemap-Chunk `wissen` in `astro.config.mjs` (Pfad-Regel, kein Tag).

### 6. Sitemap und Messung

- `lastmod` über `serialize(item)` oder die globale Option aus `stand` in `src/data/Kapitel.json` setzen; `AGENTS.md`-Notiz dazu ändern.
- `<image:image>`: In `@astrojs/sitemap` 3.7.6 ist der Namespace deklariert, es gibt aber keine Bild-API. Zuerst prüfen, ob `serialize(item)` ein `images`-Feld an den zugrunde liegenden `sitemap`-Stream durchreicht (dort existiert der Typ `Img`). Falls nicht: kleines Post-Build-Skript oder eigene Sitemap. Nicht raten, sondern am Build prüfen.
- Die 55 Bilddateien heißen `1.png … 55.png`. Vorerst `image:title` und `image:caption` mit dem Rezepttitel füllen; eine Umbenennung wäre ein eigener, teurer Eingriff in Daten, Buch und EPUB.
- Extern: `sitemap-index.xml` in Google Search Console und Bing Webmaster einreichen; Core Web Vitals mit PageSpeed Insights oder Lighthouse messen. Umami-Performance bleibt bewusst abgeschaltet.

### 7. Internes Linknetz

- Explizites Feld `wissen: string[]` mit Info-IDs in den Rezept-JSONs; Typ in `src/lib/recipes.ts`, Helfer `relatedInfos()` in `src/lib/infos.ts` inklusive Build-Time-Prüfung auf tote IDs.
- Rezeptseite: Modul „Mehr dazu" mit 2–3 Wissenslinks; Wissensdetailseite: Rückverweis „Passende Rezepte".
- Datenänderung → volle Prüfkette inklusive Buch und EPUB, auch wenn die Module nur auf der Website erscheinen.

### 8. Vertrauen und Barrierefreiheit

- Author-JSON-LD: `Person` mit `name` und `url`, `sameAs` nur für belegte Profile, bewusst **ohne `image`**, da kein Autorenfoto vorhanden ist. `src/lib/seo.ts` und die `AGENTS.md`-Tabelle anpassen.
- Kontrast: `--ink-faint: #8b745c` → `#6d5843` in `src/styles/global.css`. Gemessen 5,32:1 auf `--paper` und 4,51:1 auf `--paper-deep`; `#746047` scheitert auf `--paper-deep` mit 4,03:1. `book.css` bleibt wegen des Druckkontexts unverändert.
- Skip-Link: `<a class="skip-link" href="#main">Zum Inhalt springen</a>` als erstes Kind von `<body>`, `id="main"` auf allen 14 `<main>`-Elementen, CSS erst bei `:focus-visible` sichtbar. Umgesetzt als `SkipLink.astro`; die `id` muss trotzdem in jedem Template gesetzt werden.

**Prüfung P1:** `npm run check` (Website, Buch, PDF, Buchprüfung, EPUB, EPUB-Prüfung) sowie `npm run build` und Sichtprüfung der neuen Wissensseiten. Zusätzlich: keine doppelten `id`, keine toten Sprungmarken, alle internen Links mit `BASE_URL`, keine horizontale Scrollleiste.

## Reihenfolge

1. P0.2 und P0.3 (Daten, Zahlen, README, AGENTS.md)
2. P0.4 (Navigation, H1) – bewusste Regeländerung in `AGENTS.md`
3. P0.1 (Datenschutz, Formularhinweis, KI-Hinweis im Impressum)
4. P1.5 (Wissensdetailseiten)
5. P1.6 (Sitemap, GSC/Bing, CWV)
6. P1.7 (Linknetz)
7. P1.8 (Author, Kontrast, Skip-Link)
8. Abschlussprüfung, Commit auf `modernisierung`, Pull Request

## Offene Punkte

- **`sameAs`-Ziele:** Bleiben offen. Nur ergänzen, wenn Profile tatsächlich belegbar sind; ohne Foto ist das `Person`-JSON-LD auch ohne Bild gültig. P1.8 wurde ohne `sameAs` umgesetzt und wird bei Bedarf später ergänzt.
- **Externe Schritte:** Sitemap-Einreichung in Google Search Console und Bing Webmaster sowie PageSpeed/Lighthouse-Messung liegen außerhalb des Repos und sind nicht Teil dieses Commits.

## Ergebnis der Abschlussprüfung

`npm run check` im Devcontainer (Node 22.23.5, Chrome 157, poppler-utils, Java) lief vollständig durch:

| Prüfung | Ergebnis |
| --- | --- |
| Website | 193 Seiten, davon 42 Wissensdetailseiten; `/datenschutz/` und 42 Wissens-URLs in der Sitemap, `/404.html` und die 55 Weiterleitungsblätter nicht |
| Sitemap | 140 URLs, alle mit `<lastmod>` aus `stand`; 58 `<image:image>` (55 Rezepte und 3 Rezeptlisten) |
| Struktur | eine `<h1>` je echter Seite, Skip-Link und `<main id="main">` auf 138 Seiten, keine doppelten `id`, keine toten Sprungmarken |
| Buch | 174 Druckseiten, 55 Bildseiten, 57 Textseiten, drei Leerseiten; Buchprüfung bestanden |
| EPUB | 104 Blätter, epubcheck ohne Fehler und Warnungen (vier `INFO(CSS-007)` zu eingebetteten TTFs) |

Die Seitenzahlen in `AGENTS.md` und `docs/buchdruck-plan.md` sind nachgezogen. `CLAUDE.md` und `docs/bilderzeugung-plan.md` sind nicht Teil der Änderungen.
