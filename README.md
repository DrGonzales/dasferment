# Das Ferment

Eine statische, mittelalterlich inspirierte Rezept-Website für Fermente, Kimchi, eingelegtes Gemüse und Sauerkraut. Die Website bildet ein ruhig gestaltetes Rezeptbuch auf Pergament ab und trennt die sachlichen Rezeptdaten redaktionell von der Codex-Präsentation.

## Projektstatus

- **39 Rezepte** aus einer zentralen JSON-Datei
- **26 Kategorien** als statische Unterseiten
- **22 lokale Buchmalereien** für die illustrierten Rezeptblätter
- Statische HTML-Ausgabe mit Astro Static Site Generation
- Responsive Layout für Desktop, Tablet und Smartphone
- Recipe-JSON-LD, Canonicals, Sitemap und `robots.txt`
- Keine interaktive Client-Seitenschicht; die Website funktioniert ohne JavaScript im Browser

## Technologien

- [Astro](https://astro.build/) 7
- TypeScript
- HTML
- CSS
- JSON
- Astro Assets für responsive, optimierte WebP-Bilder

Es werden keine React-, Vue-, Svelte- oder sonstigen UI-Frameworks benötigt. Das einzige Script in den Rezeptseiten ist das nicht ausführbare JSON-LD für Suchmaschinen.

## Schnellstart

Voraussetzung ist Node.js ab Version `22.12.0`.

```sh
npm install
```

### Entwicklungsserver im Hintergrund

```sh
npm run astro -- dev --background
```

Der Server ist anschließend unter `http://localhost:4321` erreichbar. Der Hintergrundserver kann mit folgenden Befehlen verwaltet werden:

```sh
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
```

Für einen normalen Vordergrund-Start steht zusätzlich `npm run dev` zur Verfügung.

### Produktions-Build

```sh
npm run build
```

Der Build erzeugt die statische Website in `dist/`.

### Lokale Vorschau des Builds

```sh
npm run preview
```

## Seitenstruktur

| Route | Beschreibung |
| --- | --- |
| `/` | Startseite mit Hero, Codex-Einstieg und vollständiger Rezeptübersicht |
| `/rezepte/` | Alphabetisch bzw. in der Datenreihenfolge sortierte Rezeptübersicht |
| `/rezepte/<slug>/` | Statische Detailseite eines Rezepts |
| `/kategorien/` | Übersicht aller Kategorien |
| `/kategorien/<category>/` | Statische Detailseite einer Kategorie |
| `/ueber-diese-seite/` | Informationen zum Codex und zur Website |
| `/impressum/` | Impressumsseite |
| `/sitemap.xml` | XML-Sitemap für Suchmaschinen |
| `/robots.txt` | robots-Datei mit Verweis auf die Sitemap |

Rezept-Slugs werden aus dem jeweiligen Rezeptfeld `titel` abgeleitet. Die Seiten werden über `getStaticPaths()` in `src/pages/rezepte/[slug].astro` erzeugt; sie hängen nicht von einem späteren JSON-Ladeprozess im Browser ab.

## Datenquelle

Die zentrale und einzige Rezeptdatenquelle ist:

```text
src/data/das_ferment.json
```

Die JSON-Datei ist die **Single Source of Truth**. Rezeptinformationen werden nicht in Astro-Templates dupliziert. Die wichtigsten Felder sind:

- `titel`: sachlicher Rezeptname für SEO, Übersichten und Navigation
- `tags`: Kategorien und Schlagworte
- `zutaten`: Zutatenliste
- `zubereitung`: geordnete Zubereitungsschritte
- `picture`: Dateiname einer Illustration, zum Beispiel `1.png`
- `codex_titel`: redaktionelle, historisch klingende Überschrift
- `codex_einleitung`: kurze Codex-Einleitung
- `ratgeber`: optionaler persönlicher Ratschlag mit `sprecher` und `text`

Die Codex-Felder sind bewusst eine zweite redaktionelle Ebene. Der normale Rezepttitel bleibt der primäre Name für SEO und Navigation, während `codex_titel` die gestalterische Einleitung auf der Detailseite übernimmt.

## Bilder

Lokale Illustrationen liegen in:

```text
src/pic/pages/
```

Aktuell sind dort die Dateien `1.png` bis `22.png` vorhanden. Die Zuordnung zwischen Rezepten und Bildern erfolgt zentral über `src/lib/pageImages.ts` anhand des `picture`-Feldes.

Die Detail- und Kartenbilder werden mit Astros `Image`-Komponente und passenden `widths`/`sizes` erzeugt. Die Darstellung verwendet proportionale Skalierung mit `object-fit: contain`, sodass die vollständige Illustration sichtbar bleibt und nicht zugeschnitten wird. Für Rezepte ohne Bild gibt es einen gestalteten Codex-Platzhalter.

## Projektstruktur

```text
.
├── public/
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   └── RecipeCard.astro
│   ├── data/
│   │   └── das_ferment.json
│   ├── lib/
│   │   ├── pageImages.ts
│   │   └── recipes.ts
│   ├── pages/
│   │   ├── index.astro
│   │   ├── kategorien/
│   │   │   ├── [category].astro
│   │   │   └── index.astro
│   │   ├── rezepte/
│   │   │   ├── [slug].astro
│   │   │   └── index.astro
│   │   ├── impressum/index.astro
│   │   ├── ueber-diese-seite/index.astro
│   │   ├── robots.txt.ts
│   │   └── sitemap.xml.ts
│   ├── pic/pages/
│   │   └── 1.png … 22.png
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── AGENTS.md
```

## SEO und statische Ausgabe

Jede Rezeptseite enthält:

- einen eindeutigen HTML-`<title>` mit dem sachlichen Rezeptnamen
- eine Meta Description aus den vorhandenen Codex-Daten
- eine Canonical URL
- semantisches HTML mit Brotkrümelnavigation, Zutaten- und Zubereitungsliste
- ein `Recipe`-JSON-LD-Objekt mit Name, Beschreibung, Bild, Zutaten und Schritten
- sinnvolle Bild-Alt-Texte aus der Bildzuordnung

`src/pages/sitemap.xml.ts` und `src/pages/robots.txt.ts` erzeugen die technischen SEO-Dateien. Die Website wird vollständig in statisches HTML und optimierte Assets übersetzt; es gibt keine nachträgliche Rezeptdarstellung im Browser.

## Produktions-URL und Basispfad konfigurieren

Für Canonicals sowie absolute URLs in Sitemap und `robots.txt` können beim Build eine echte Domain und ein abweichender Basispfad gesetzt werden:

```sh
PUBLIC_SITE_URL=https://www.deine-domain.de PUBLIC_BASE_PATH=/ npm run build
```

Ohne Umgebungsvariablen verwendet die Konfiguration die Standardwerte für GitHub Pages:

- `PUBLIC_SITE_URL=https://drgonzales.github.io`
- `PUBLIC_BASE_PATH=/dasferment`

Damit liegt die lokale bzw. veröffentlichte Website unter `https://drgonzales.github.io/dasferment/`. Für eine eigene Domain im Hauptverzeichnis kann der Basispfad mit `PUBLIC_BASE_PATH=/` überschrieben werden. Die Konfiguration befindet sich in `astro.config.mjs`.

## Deployment

1. Abhängigkeiten installieren:

   ```sh
   npm ci
   ```

2. Den statischen Build erzeugen:

   ```sh
   npm run build
   ```

3. Den Inhalt von `dist/` auf einen statischen Hosting-Anbieter hochladen oder die von Astro unterstützte Plattformintegration verwenden.

Ein Push auf `main` wird durch `.github/workflows/deploy.yml` automatisch als GitHub-Pages-Deployment unter `https://drgonzales.github.io/dasferment/` veröffentlicht. Bei einer eigenen Domain werden `PUBLIC_SITE_URL` und gegebenenfalls `PUBLIC_BASE_PATH` im Deployment-Build gesetzt.

## Rezeptdaten ändern

Für ein neues oder geändertes Rezept:

1. `src/data/das_ferment.json` bearbeiten.
2. Bei einer Illustration den passenden Dateinamen in `picture` eintragen.
3. Optional `codex_titel`, `codex_einleitung` und `ratgeber` ergänzen.
4. `npm run build` ausführen.
5. Die betroffene statische Seite unter `dist/rezepte/<slug>/` prüfen.

Rezepttexte, Zutaten und Zubereitungsschritte dürfen nicht in den Templates dupliziert oder durch Darstellungscode erfunden werden.

## Vor der Veröffentlichung

Die Impressumsseite enthält derzeit bewusst einen Platzhalter. Vor einer öffentlichen Veröffentlichung müssen die tatsächlichen Angaben zu Anbieter, Kontakt und Verantwortlichkeit ergänzt werden. Außerdem sollte `PUBLIC_SITE_URL` auf die finale Domain gesetzt werden.
