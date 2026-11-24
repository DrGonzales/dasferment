# Umsetzungsplan: P2.9 – Keyword-Clusters als Einstiegsseiten

**Datum:** 2026-11-24
**Quelle:** `WEBSITE_REVIEW.md`, P2 Punkt 9 in der Fassung vom 24.11.2026
**Branch:** neuer Branch `keyword-cluster` von `main`; P0/P1 sind mit PR #4 gemergt
**Stand:** umgesetzt auf Branch `keyword-cluster`; Prüfergebnisse siehe unten

## Rahmenbedingungen

- Die technischen Voraussetzungen aus P0/P1 sind vorhanden: sachliche `<h1>` auf Rezeptseiten, eigene Wissens-URLs, `lastmod` und `<image:image>` in der Sitemap, `SeoHead` als einzige Stelle für Meta-Tags und JSON-LD. Dieser Plan baut darauf auf und ändert nichts davon.
- **Die 55 Rezeptblätter bleiben inhaltlich unverändert.** Es werden keine Rezepttexte, `codex_*`-Felder, Ratgeber oder Überschriften umgeschrieben. Geändert werden nur zwei Datenfelder in einer Rezept-JSON-Datei (ein Tag, ein neues `saison`-Feld).
- Landingpage-Texte, Reihenfolgen und Wissensverweise kommen in eine eigene Datenquelle. In `.astro`-Templates stehen keine Suchbegriffe, Tags, Titel oder Textbausteine als Literal.
- `SeoHead.astro` bleibt unverändert. Jede neue oder umgeschriebene Seite übergibt `title`, `description`, `canonicalUrl`, `image`, `breadcrumbs` und `itemList` dorthin; keine Seite baut eigene Meta-Tags.
- `astro.config.mjs` bleibt unverändert. Die Sitemap folgt den gebauten Routen: Kategorie-URLs bleiben im `kategorien`-Chunk, `/saison/herbst-winter/` landet automatisch in `sitemap-pages-0.xml`.
- Kein Client-JavaScript, kein zweites Stylesheet, keine neuen Bilddateien. Neue Layout-Klassen kommen, falls nötig, in `src/styles/global.css` dazu; vorhandene Klassen wie `.section-heading`, `.recipe-grid`, `.prose-link` und `.recipe-related` werden zuerst genutzt.
- Alle internen Links laufen über `import.meta.env.BASE_URL`, beziehungsweise über `withBase()` in den Templates und `absoluteUrl()` in den Metadaten.
- Die lokale Arbeitsbaum-Änderung an `WEBSITE_REVIEW.md` ist die Quelle dieses Plans und bleibt unangetastet. Die unversionierte Datei `docs/bilderzeugung-plan.md` gehört nicht in diesen Branch. Vor dem Branch-Wechsel beides bewusst behandeln, nichts versehentlich mitcommitten.
- Wenn die Datenänderungen nicht mehr am 24.11.2026 passieren: `stand` in `src/data/Kapitel.json` auf den dann gültigen Änderungstag setzen, sonst meldet die Sitemap ein veraltetes Datum.

## Entscheidungen vorab

| Punkt | Entscheidung | Warum |
| --- | --- | --- |
| Kanonische URL je Suchintention | Die Kategorieseite ist jeweils die kanonische Einstiegsseite; `/saison/herbst-winter/` die vierte. | Eine URL pro Suchbegriff, wie in der Review gefordert. |
| `/kapitel/gingerbug/rezepte/` | Bleibt als eigenständiges Kapitelregister erhalten, behält seinen eigenen `<title>` und seine H1 „Die Rezepte" und verlinkt auf die Einstiegsseite. Kein zweiter „Ginger Bug Rezept"-Titel, kein übergreifendes `rel=canonical`. | Zwei konkurrierende Titel für denselben Suchbegriff wären Duplicate Content; ein fremdes Canonical würde eine nützliche Seite aus der Indexierung nehmen. |
| Rezepte verlinken | Die vorhandenen Tag-Chips auf Rezeptseiten verlinken Ginger Bug, Kimchi und Sauerkraut bereits auf die Kategorieseiten. Für die Saison-Seite kommen datengesteuerte Verweise hinzu, zusätzlich zum Eintrag in `/kategorien/`. | Jede neue Seite hat mindestens einen sichtbaren Link von einer bestehenden Seite. |
| Reihenfolge der Karten | Ein Datenfeld `reihenfolge` in `Einstiegsseiten.json` stellt die genannten Blätter nach vorn; alle übrigen Rezepte folgen dem optionalen `order` beziehungsweise der JSON-Reihenfolge. Fehlt ein genannter Titel im Ergebnis, ist das ein Build-Fehler. | Der „erste Treffer" ist steuerbar, ohne Tags oder Templates zu ändern; Daten drift fällt beim Build auf. |
| Zahlen in Texten | `title` und `description` dürfen `{anzahl}` enthalten; ein Helfer ersetzt das mit der tatsächlichen Rezeptzahl. | Die Review nennt 11/8/3/6 Rezepte. Wird ein Tag geändert, soll der Text nicht still veralten. |
| Salzmenge und Gärdauer | Keine Zahlen auf der Landingsseite erfinden. Die Seite nennt die Themen und verlinkt die vorhandenen Wissenseinträge `salzlaken/` und `fermentationsdauer/` (sowie `trocken-salzen/`, wo es passt). | Die Wissenseinträge sind die fachliche Quelle; die Einstiegsseite ist ein Wegweiser, kein zweites Fachbuch. |
| Saison-Auswahl | Neues optionales Rezeptfeld `saison: string[]` mit Werten aus `Einstiegsseiten.json`. Keine hart verdrahteten Tags, kein `tag === "Kürbis"`. | Die Auswahl bleibt in den Daten und ist auch für künftige Saison-Seiten wiederverwendbar. |
| Buch und EPUB | Keine Template-Änderung. Das neue Rezeptfeld wird vom Spread in `src/lib/chapters.ts` automatisch mitgetragen. Wegen der Datenänderung trotzdem die volle Prüfkette fahren. | Getrennte Ausgaben, gemeinsame Daten; die Seitenzahlen sollten unverändert bleiben. |

## Geprüfter Ist-Stand

| Thema | Tatsächlicher Stand | Fundstelle |
| --- | --- | --- |
| Rezepte / Wissenseinträge | 55 / 42 in drei Kapiteln | `src/data/*/*.json` |
| Tags / Kategorien mit Seite | 56 / 24 (`MIN_CATEGORY_RECIPES = 2`) | `src/lib/recipes.ts` |
| Rezepte je Suchbegriff | Ginger Bug 11, Kimchi 8, Sauerkraut 2, obwohl drei Titel „Sauerkraut" tragen | `src/data/*/*.json` |
| Fehlendes Sauerkraut-Tag | „Rotes Sauerkraut mit Apfel" hat `Gemüse, Kohl, Rotkohl`, aber kein `Sauerkraut` | `src/data/lactation/das_ferment.json` |
| Wissens-IDs für die Cluster | `ginger-bug-ansetzen-und-fuettern`, `salzlaken`, `trocken-salzen`, `fermentationsdauer`, `temperatur`, `lagerung` | `src/data/*/*_infos.json` |
| Kategorieseite heute | `<title>` „Ginger Bug fermentieren – 11 Rezepte \| Das Ferment", H1 nur „Ginger Bug", sonst nur Kicker + Zähler + Kartenraster | `src/pages/kategorien/[category].astro` |
| Social Card | Läuft bereits über `socialCard()` und `getImage()`; Kategorie und Rezeptlisten haben ein Bild | `src/pages/kategorien/[category].astro`, `src/lib/social.ts` |
| Sitemap | 137 URLs beim Nachmessen am 24.11.2026, alle mit `<lastmod>`; 58 `<image:image>`; Kategorie-URLs im eigenen Chunk | `dist/` vor dieser Änderung; die ältere Zahl 140 stammt aus `docs/umsetzungsplan-p0-p1.md` und war veraltet |
| Website | 193 Seiten; nach der neuen Route erwartet: 194 | `AGENTS.md`, letzter Check |

## Umsetzung

### 1. Datenquelle anlegen: `src/data/Einstiegsseiten.json`

Eine Datei mit einem Array `eintraege`. Jeder Eintrag enthält nur Steuerungs- und Seitentexte, nie Rezeptinhalte:

```json
{
  "eintraege": [
    {
      "slug": "ginger-bug",
      "typ": "kategorie",
      "route": "/kategorien/ginger-bug/",
      "kapitel": ["gingerbug"],
      "h1": "Ginger Bug Rezept",
      "title": "Ginger Bug Rezept – {anzahl} Rezepte | Das Ferment",
      "description": "Ginger Bug Rezept: Ingwer-Mutter ansetzen, füttern und {anzahl} Limonaden fermentieren – mit Buchmalereien aus dem Kodex.",
      "kicker": "Der lebendige Ansatz",
      "lead": "…",
      "reihenfolge": ["Der Ginger Bug – Die lebendige Ingwer-Mutter"],
      "wissen": ["ginger-bug-ansetzen-und-fuettern"]
    }
  ]
}
```

Vier Einträge:

Die Längen unten sind die des fertigen `<title>` nach Ersetzung von `{anzahl}`:

| `slug` | `typ` / Route | H1 | `<title>` mit `{anzahl}` | `wissen` |
| --- | --- | --- | --- | --- |
| `ginger-bug` | `kategorie` → `/kategorien/ginger-bug/` | Ginger Bug Rezept | Ginger Bug Rezept – {anzahl} Rezepte \| Das Ferment (44 Zeichen) | `ginger-bug-ansetzen-und-fuettern` |
| `kimchi` | `kategorie` → `/kategorien/kimchi/` | Kimchi Grundrezept und Varianten | Kimchi Grundrezept – {anzahl} Varianten \| Das Ferment (46 Zeichen) | `salzlaken`, `fermentationsdauer` |
| `sauerkraut` | `kategorie` → `/kategorien/sauerkraut/` | Sauerkraut richtig fermentieren | Sauerkraut richtig fermentieren \| Das Ferment (45 Zeichen) | `salzlaken`, `trocken-salzen`, `fermentationsdauer` |
| `herbst-winter` | `saison` → `/saison/herbst-winter/` | Fermentieren im Herbst/Winter | Fermentieren im Herbst/Winter \| Das Ferment (43 Zeichen) | `temperatur`, `lagerung` |

Der `saison`-Eintrag enthält zusätzlich `saisons: ["Herbst", "Winter"]` als Filterwert; die `kategorie`-Einträge brauchen dieses Feld nicht. Die Saison-Seite wird nicht in die Hauptnavigation aufgenommen. `lead` ist je Eintrag ein kurzer, eigener Absatz (zwei bis drei Sätze) im bestehenden Mittelalter-Ton, sachlich korrekt und ohne neue Zahlen. `reihenfolge` nennt nur Rezept-Titel zur Sortierung:

| Eintrag | `reihenfolge` |
| --- | --- |
| `ginger-bug` | `Der Ginger Bug – Die lebendige Ingwer-Mutter` |
| `kimchi` | `Klassisches Baechu-Kimchi (Chinakohl-Kimchi)`, `Kakkdugi (Rettich-Kimchi)`, `Oi-Sobagi (Gefülltes Gurken-Kimchi)`, `Nabak-Kimchi (Mildes Wasser-Kimchi)` |
| `sauerkraut` | `Klassisches Sauerkraut mit Kümmel`, `Rotes Sauerkraut mit Apfel`, `Sauerkraut mit Karotte und Ingwer` |
| `herbst-winter` | `Herbstliches Kürbis-Apfel-Kimchi`, `Fermentierter Kürbis mit Chili und Ingwer`, `Winterliches Wurzelgemüse-Ferment`, `Fermentierte Rote Bete mit Meerrettich`, `Rotes Sauerkraut mit Apfel`, `Mildes Weißkohl-Pfeffer-Ferment` |

Deskriptionen (nach Ersetzung von `{anzahl}` alle unter 155 Zeichen, gemessen 115–123): sinngemäß

- „Ginger Bug Rezept: Ingwer-Mutter ansetzen, füttern und {anzahl} Limonaden fermentieren – mit Buchmalereien aus dem Kodex."
- „Kimchi Grundrezept und Varianten: Baechu, Kakkdugi, Oi-Sobagi und Nabak – mit Salz, Gärdauer und Buchmalereien."
- „Sauerkraut richtig fermentieren: {anzahl} Rezepte, Salz und Gärdauer aus dem Wissensteil – mit Buchmalereien aus dem Kodex."
- „Fermentieren im Herbst und Winter: Kürbis, Wurzelgemüse, Kohl und Apfel – {anzahl} Rezepte plus Wissen zu Lagerung und Temperatur."

### 2. Rezeptdaten ergänzen: `src/data/lactation/das_ferment.json`

Zwei Änderungen, ausschließlich in dieser Datei:

1. „Rotes Sauerkraut mit Apfel" bekommt zusätzlich den Tag `Sauerkraut`. Danach tragen alle drei Sauerkraut-Blätter diesen Tag, die Kategorie hat drei Rezepte. Es entsteht kein neuer Tag-Slug und keine neue Kategorie.
2. Sechs Rezepte bekommen ein optionales `saison`-Feld. Die Werte richten sich nach vorhandenen Titeln, Zutaten und Kodex-Texten; es werden keine neuen fachlichen Aussagen erfunden.

| Rezept | `saison` |
| --- | --- |
| Herbstliches Kürbis-Apfel-Kimchi | `["Herbst"]` |
| Fermentierter Kürbis mit Chili und Ingwer | `["Herbst", "Winter"]` |
| Winterliches Wurzelgemüse-Ferment | `["Winter"]` |
| Fermentierte Rote Bete mit Meerrettich | `["Herbst", "Winter"]` |
| Rotes Sauerkraut mit Apfel | `["Winter"]` |
| Mildes Weißkohl-Pfeffer-Ferment | `["Winter"]` |

### 3. Helfer anlegen: `src/lib/landingPages.ts`

Neues Modul, das `Einstiegsseiten.json` lädt und die Datenquelle für alle Cluster-Seiten ist:

- `interface LandingPage` mit den Feldern aus Schritt 1, `typ: 'kategorie' | 'saison'`.
- `landingPages: LandingPage[]` als einziger Export der geladenen Datei.
- `landingPageForRoute(route)`: liefert den Eintrag zu einem kanonischen Pfad oder `undefined`.
- `landingsForChapter(slug)`: filtert über `kapitel`, für die Verweise auf Kapitel-Rezeptseiten.
- `landingsForSaison(saison)`: filtert über `saisons` beziehungsweise die Verwendungen in den Rezeptdaten; liefert die Saison-Seite für ein Rezept.
- `withCount(text, count)`: ersetzt `{anzahl}` und wirft, wenn danach noch ein Platzhalter steht.
- `orderedRecipes(recipes, names)`: stellt die genannten Titel in der angegebenen Reihenfolge nach vorn, sortiert den Rest über `sortByOrder()` nach `order` und JSON-Reihenfolge und wirft bei einem unbekannten Namen. Damit ist ein umbenanntes Rezept ein sichtbarer Datenfehler, kein leerer Platz.
- `seasonalRecipes(saisons)`: filtert `allRecipes` über `recipe.saison` und gibt die Resultate durch `orderedRecipes()`.
- Wissens-IDs werden nicht neu validiert; `relatedInfos({ titel: landing.h1, wissen: landing.wissen }, allInfos)` aus `src/lib/infos.ts` übernimmt das schon inklusive Fehlermeldung bei toter ID.

`src/lib/recipes.ts` bekommt nur `saison?: string[]` im `Recipe`-Interface. `src/lib/chapters.ts` braucht keine Änderung: der Spread übernimmt das neue Feld automatisch.

### 4. Kategorieseiten umstellen: `src/pages/kategorien/[category].astro`

- `landing = landingPageForRoute(canonicalPath)`.
- Ist ein Eintrag vorhanden: `title = withCount(landing.title, recipes.length)`, `description = withCount(landing.description, recipes.length)`, H1 = `landing.h1`, Kicker = `landing.kicker`, Lead = `landing.lead`, Kartenreihenfolge = `orderedRecipes(recipes, landing.reihenfolge)`. Das `itemList` an `SeoHead` bekommt dieselbe Reihenfolge wie das sichtbare Raster.
- Unter dem Header ein kurzer Block mit den verlinkten Wissenseinträgen (`infoPath()`), beschriftet aus den Datensätzen, nicht aus Literalen.
- Ohne Eintrag bleibt die bisherige schematische Erzeugung unverändert; die anderen 21 Kategorieseiten dürfen sich nicht still verändern.
- `socialCard()`, `coverImageFor()` und der Self-Canonical bleiben wie sie sind.

### 5. Sichtbare Verweise von bestehenden Seiten

- `src/pages/kategorien/index.astro`: vor oder über dem Kategorie-Raster ein Abschnitt „Einstiegsseiten" mit allen vier `landingPages` als Link auf `withBase(landing.route)`, Linktext `landing.h1`. Damit hat jede neue beziehungsweise umgeschriebene URL mindestens einen festen internen Verweis.
- `src/pages/kapitel/[chapter]/rezepte/index.astro`: für Kapitel mit Treffern aus `landingsForChapter(chapter.slug)` eine kleine Linkzeile zu den Einstiegsseiten, mit vorhandenen Klassen (`.prose-link`). Für `gingerbug` verweist sie auf `/kategorien/ginger-bug/`, für `lactation` auf Kimchi und Sauerkraut. Der Kapitel-`<title>` bleibt unverändert.
- `src/components/Header.astro`: bleibt unverändert. Die Saison-Seite wird bewusst nicht in die Hauptnavigation aufgenommen; sie ist über `/kategorien/`, die Kapitel-Rezeptlisten und die betroffenen Rezeptblätter erreichbar.
- `src/pages/kapitel/[chapter]/rezepte/[slug].astro`: optional, aber empfohlen – die sechs Rezepte mit `saison` erhalten unter `.recipe-intro__tags` einen dezenten `prose-link` zur Saison-Seite. Die Tag-Chips selbst bleiben unverändert.

### 6. Neue Route: `src/pages/saison/[saison].astro`

- `getStaticPaths()` über `landingPages.filter(page => page.typ === 'saison')`, `params: { saison: landing.slug }`, `props: { landing }`. Kein hart verdrahteter Slug im Template.
- Rezeptauswahl über `seasonalRecipes(landing.saisons)` beziehungsweise `orderedRecipes()` mit `landing.reihenfolge`; sechs Karten im `.recipe-grid`.
- Breadcrumbs nur `Startseite → Fermentieren im Herbst/Winter`. Es gibt keine `/saison/`-Indexseite, deren Link sonst tot wäre.
- `<h1>` = `landing.h1`, Kicker und Lead aus den Daten, danach das Kartenraster, danach die verlinkten Wissenseinträge zu `temperatur` und `lagerung` mit vorhandenen Klassen.
- `SeoHead` mit `title`, `description`, Self-Canonical, `coverImageFor(selectedRecipes)` über `socialCard()`, `breadcrumbs` und `itemList` in der sichtbaren Reihenfolge. `type` bleibt `website`.
- Falls das vorhandene CSS nicht reicht: Ergänzungen nur in `src/styles/global.css`, ohne feste Pixelbreiten und ohne horizontales Scrollen.

### 7. Dokumentation nachziehen

- `AGENTS.md`: neue Route in der URL-Tabelle, `src/data/Einstiegsseiten.json` und `src/lib/landingPages.ts` in der Projektstruktur, `saison` als optionales Rezeptfeld, Seitenzahl 193 → 194, kurze Regel „Einstiegsseiten-Texte liegen in `Einstiegsseiten.json`, nicht in Templates".
- `.opencode/skills/rezepte-daten/SKILL.md`: `saison` und die neue Datenquelle ergänzen, damit die Regel nicht nur in `AGENTS.md` steht.

## Prüfung

**Befehle:** `npm run build`, danach `npm run make:pdf && npm run check:book` und `npm run make:epub && npm run check:epub`. Der Datenpunkt `Sauerkraut`/`saison` ändert Inhalte, deshalb gehört die volle Kette dazu, obwohl Buch und EPUB keine Template-Änderung bekommen.

| Prüfung | Erwartung |
| --- | --- |
| Website-Build | Fehlerfrei, **194 Seiten** (bisher 193) |
| Sitemap | **138 URLs** (bisher 137); `/saison/herbst-winter/` in `sitemap-pages-0.xml`, die vier Cluster-URLs genau einmal, `<lastmod>` aus `stand`, `<image:image>` weiterhin bei Rezepten und Rezeptlisten |
| Kanonische URLs | Je Suchbegriff genau eine Seite mit `Ginger Bug Rezept`, `Kimchi Grundrezept`, `Sauerkraut richtig fermentieren` beziehungsweise `Fermentieren im Herbst/Winter` in H1 und `<title>`; jede Seite canonical auf sich selbst |
| Textlängen | Alle vier `<title>` < 60 Zeichen, alle Deskriptionen < 155 Zeichen, keine `{anzahl}` im fertigen HTML |
| Reihenfolge | Erste Karte in `/kategorien/ginger-bug/` ist `der-ginger-bug-die-lebendige-ingwer-mutter/`; in `/kategorien/kimchi/` stehen Baechu, Kakkdugi, Oi-Sobagi, Nabak zuerst; `/kategorien/sauerkraut/` zeigt drei Rezepte |
| Verweise | Von `/kategorien/` ist jede der vier Seiten erreichbar; von `/kapitel/gingerbug/rezepte/` und `/kapitel/lactation/rezepte/` führt je ein Link zur passenden Einstiegsseite; alle Wissenslinks zeigen auf existierende `/kapitel/.../wissen/.../`-URLs |
| Struktur | Genau ein `<h1>` je echter Seite, Skip-Link und `<main id="main">`, keine doppelten `id`, keine toten Sprungmarken, kein horizontales Scrollen; `SeoHead` liefert OG-, Twitter- und JSON-LD-Tags |
| Buch / EPUB | Prüfungen bestanden, Seitenzahlen unverändert (174 Druckseiten, 104 Blätter). Falls sich Zahlen doch ändern: `docs/buchdruck-plan.md` und `AGENTS.md` nachziehen |

**Fertig, wenn** die Tabelle ohne Abweichung abgehakt ist und die vier Suchbegriffe im gerenderten HTML stehen, ohne dass ein Rezeptblatt umgeschrieben wurde. Danach Commit auf `keyword-cluster` und Pull Request mit Verweis auf `WEBSITE_REVIEW.md` und diesen Plan. Die Einreichung der aktualisierten Sitemap in Google Search Console und Bing Webmaster ist ein externer Folgeschritt, kein Repo-Commit.

## Reihenfolge

1. `Einstiegsseiten.json` und `landingPages.ts` anlegen, `Recipe.saison` ergänzen.
2. Rezeptdaten ändern (Tag + sechs `saison`-Felder).
3. Kategorieseiten auf Eintragsdaten umstellen; andere Kategorien unverändert lassen.
4. Neue Saisonroute bauen.
5. Sichtbare Verweise: `/kategorien/`, Kapitel-Rezeptlisten und die betroffenen Rezeptblätter; kein Saison-Punkt im Header.
6. `AGENTS.md` und Skill nachziehen.
7. `npm run build`, Sitemap- und HTML-Prüfung, danach Buch- und EPUB-Kette.
8. Commit und Pull Request.

## Ergebnis der Umsetzung

Builds und Prüfungen am 24.11.2026:

| Prüfung | Ergebnis |
| --- | --- |
| Website | `npm run build` fehlerfrei, 194 Seiten |
| Sitemap | 138 URLs (58 Rezept- und Rezeptlisten-URLs, 25 Kategorie-URLs, 55 übrige), alle mit `<lastmod>2026-11-24T00:00:00.000Z`, 58 `<image:image>`; die vier Cluster-URLs genau einmal, `/404.html` und alte `/rezepte/`-Weiterleitungen nicht |
| Textlängen | Titel 44/46/45/43 Zeichen, Descriptions 115/111/116/123 Zeichen, kein `{anzahl}` im HTML |
| Verweise | Von `/kategorien/` gehen Links auf alle vier Seiten; die Kapitel-Rezeptlisten verlinkt; die sechs Rezepte mit `saison` verweisen auf die Saison-Seite; kein Saison-Punkt in der Hauptnavigation |
| Struktur | Genau ein `<h1>` je echter Seite, Skip-Link und `<main id="main">`, keine doppelten `id`, OG-/Twitter-Tags und JSON-LD vorhanden |
| Buch | 174 Druckseiten, `npm run check:book` bestanden |
| EPUB | 104 Blätter, `npm run check:epub` bestanden, epubcheck ohne Fehler und Warnungen (vier `INFO(CSS-007)`) |

Die im Plan zuerst prognostizierten 140/141 Sitemap-URLs waren zu hoch; der Stand vor der Änderung waren 137 URLs, danach 138.

Nachtrag: Der zunächst geplante Saison-Link in der Hauptnavigation wurde auf Wunsch entfernt. `Header.astro` und das Feld `navLabel` sind dadurch unverändert beziehungsweise entfallen; die Seite bleibt über `/kategorien/` und die betroffenen Rezeptblätter verlinkt.

Nachtrag zur Sortierung: Die Rezept-JSONs kennen jetzt das optionale Feld `order`. `sortByOrder()` in `src/lib/recipes.ts` gilt für die Website-Listen (Kapitel, Kategorien, Einstiegsseiten) sowie für Buch und EPUB; Rezepte ohne Wert behalten die Reihenfolge ihrer JSON-Datei. `reihenfolge` in `Einstiegsseiten.json` bleibt bestehen und stellt nur die ersten Treffer der vier Suchintentionen nach vorn. Die beiden vorhandenen `order: 1`-Werte gehören zu „Der Ginger Bug" und „Milchkefirknollen vermehren" und stehen bereits an erster Stelle ihrer Dateien; die sichtbare Reihenfolge ändert sich dadurch nicht.

## Bewusst nicht in diesem Plan

- Die 55 Rezeptblätter neu texten oder ihre H1/JSON-LD-Struktur antasten.
- Eine clientseitige Suche oder einen Filter (Review-Punkt „Keine Suche/Filter") bauen.
- Weitere P2-Punkte (Newsletter-Lead-Magnet, Pinterest, Kooperationen, eigene Domain, zusätzliche Umami-Events) angehen; die stehen in `WEBSITE_REVIEW.md` separat.
- Anzahl der Kategorien, Tag-Namen oder Kategorie-Bilder verändern. Das Sauerkraut-Tag ergänzt nur ein vorhandenes Tag bei einem vorhandenen Rezept.
