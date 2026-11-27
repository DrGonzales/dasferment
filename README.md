# Das Ferment

Eine statische, mittelalterlich inspirierte Rezept-Website für Fermente, Kimchi, eingelegtes Gemüse und Sauerkraut. Die Website bildet ein ruhig gestaltetes Rezeptbuch auf Pergament ab und trennt die sachlichen Rezeptdaten redaktionell von der Kodex-Präsentation.

## Projektstatus

- **55 Rezepte** und **42 Wissenseinträge** in **3 Kapiteln**
- **56 Schlagworte**, davon **24 Kategorien mit eigener Seite** (mindestens 2 Rezepte je Kategorie)
- **55 lokale Buchmalereien** für die illustrierten Rezeptblätter
- Statische HTML-Ausgabe mit Astro Static Site Generation
- Responsive Layout für Desktop, Tablet und Smartphone
- Recipe-JSON-LD, Canonicals, aufgeteilte Sitemap und `robots.txt`
- Keine clientseitige JavaScript-Anwendung; die einzige Ausnahme ist das externe Umami-Skript

Die ausführlichen Projektregeln stehen in [`AGENTS.md`](AGENTS.md). Sie sind die einzige Quelle für Konventionen, Befehle und Architekturentscheidungen.

## Spezifikationen mit OpenSpec

Das Verhalten der Website und der beiden Buchausgaben ist in `openspec/specs/` als OpenSpec-Spezifikationen (`schema: spec-driven`) beschrieben. Die Baseline wurde aus den Projektregeln in `AGENTS.md` und den Plänen in `docs/` verdichtet; die Detaildokumente bleiben erhalten.

Die OpenSpec-Skills liegen in `.agents/skills/` und sind in OpenCode verfügbar:

| Befehl | Zweck |
| --- | --- |
| `/openspec-propose "<Idee>"` | Change Proposal mit Spezifikation, Design und Tasks anlegen |
| `/openspec-apply-change` | Tasks eines Changes umsetzen |
| `/openspec-archive-change` | Change archivieren und die Specs aktualisieren |
| `npx @fission-ai/openspec@latest validate --all` | alle Changes und Specs prüfen |

## Technologien

- [Astro](https://astro.build/) 7
- TypeScript (`astro/tsconfigs/strict`)
- HTML und CSS
- JSON als Datenquelle
- Astro Assets für responsive, optimierte WebP-Bilder

Es werden keine React-, Vue-, Svelte- oder sonstigen UI-Frameworks benötigt.

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

### Weitere Ausgaben und Prüfungen

```sh
npm run make:pdf     # Buch-Build und PDF in dist-book/
npm run make:epub    # EPUB-Build und Archiv in dist-epub/
npm run check        # Website, Buch, PDF und EPUB in einem Durchlauf
```

`npm run check:book` braucht `poppler-utils`, `npm run check:epub` eine Java-Laufzeit und `npm run make:pdf` Chrome für Puppeteer. Die Abhängigkeiten sind in `.devcontainer/Dockerfile` installiert.

## Seitenstruktur

| Route | Beschreibung |
| --- | --- |
| `/` | Startseite mit Hero, Kapitelübersicht und Rezeptgalerie |
| `/kapitel/<kapitel>/` | Kapitelblatt mit Beschreibung und Navigation |
| `/kapitel/<kapitel>/rezepte/` | Rezeptliste des Kapitels |
| `/kapitel/<kapitel>/rezepte/<slug>/` | Statische Rezeptseite |
| `/kapitel/<kapitel>/wissen/` | Alle Wissenseinträge des Kapitels auf einer Seite |
| `/kategorien/` | Kacheln aller Kategorien mit eigener Seite |
| `/kategorien/<category>/` | Statische Kategorieseite |
| `/buch/` | Download von PDF und EPUB aus dem GitHub-Release `buch` |
| `/ueber-diese-seite/`, `/kontakt/`, `/impressum/` | Redaktionelle Seiten |
| `/rezepte/<slug>/` | Alte Rezept-Links, leiten per `meta refresh` zum Kapitel weiter, nicht in der Sitemap |
| `/sitemap-index.xml` | Index, zeigt auf die drei Dateien darunter |
| `/sitemap-rezepte-0.xml` | Rezeptlisten und Rezepte unter `/kapitel/.../rezepte/` |
| `/sitemap-kategorien-0.xml` | Kategorienübersicht und alle Kategorien |
| `/sitemap-pages-0.xml` | alle übrigen Seiten |
| `/robots.txt` | robots-Datei mit Verweis auf den Sitemap-Index |
| `/404.html` | Fehlerseite, `noindex`, nicht in der Sitemap |

Rezept-Slugs werden aus dem `titel` der Daten abgeleitet. Die Seiten entstehen über `getStaticPaths()`; sie hängen nicht von einem späteren JSON-Ladeprozess im Browser ab.

## Datenquelle

Die Kapitel-JSON-Dateien sind die Single Source of Truth:

```text
src/data/Kapitel.json
src/data/<kapitel>/Kapitel.json
src/data/<kapitel>/*.json
```

`src/data/Kapitel.json` legt die Reihenfolge der Kapitel fest, jedes `Kapitel.json` listet seine Rezept- und Wissensdateien und Bildpfade. Rezeptangaben werden nicht in Astro-Templates dupliziert. Die wichtigsten Rezeptfelder sind:

- `titel`: sachlicher Rezeptname für SEO, Übersichten und Navigation
- `order`: optionale Sortierposition; ohne Wert bleibt die Reihenfolge der JSON-Datei
- `tags`: Schlagworte, aus denen die Kategorien entstehen
- `zutaten`: Zutatenliste
- `zubereitung`: geordnete Zubereitungsschritte
- `picture`: Dateiname einer Illustration, zum Beispiel `1.png`
- `codex_titel`, `codex_einleitung`: redaktionelle Kodex-Ebene
- `ratgeber`: optionaler persönlicher Ratschlag mit `sprecher` und `text`

Wissenseinträge liegen in den `*_infos.json`-Dateien der Kapitel und nutzen dieselbe Kodex-Ebene mit `codex_titel`, `codex_intro`, `codex_text` und `codex_liste`.

## Bilder

Lokale Illustrationen liegen unter `src/pic/`:

| Ordner | Inhalt |
| --- | --- |
| `pages/` | Rezeptillustrationen, referenziert über `picture` |
| `chapters/` | Kapitelbilder |
| `actors/<kapitel>/` | Portraits im Ratgeber |
| `smallactors/<kapitel>/` | Quadratische Motive auf den Wissensseiten |
| `categories/` | Kacheln der Kategorien, Dateiname ist der Kategorie-Slug |
| `icons/`, `cover/` | Download-Karten und Einband |

Die Zuordnung übernehmen die Helfer in `src/lib/`. Alle Bilder laufen über `astro:assets`; Originaldateien werden nie direkt referenziert. Ein Konzept für die lokale KI-Bilderzeugung liegt in [`docs/bilderzeugung-plan.md`](docs/bilderzeugung-plan.md).

## Projektstruktur (Auszug)

```text
.
├── src/
│   ├── components/        Header, Footer, ChapterNav, RecipeCard, SeoHead, Analytics
│   ├── data/              Kapitel.json und die Kapitelordner mit Rezepten und Wissen
│   ├── lib/               chapters, recipes, infos, seo, book, epub, …
│   ├── pages/             Website-Routen
│   ├── book/, epub/       eigene Ausgaben mit eigenem Stylesheet
│   ├── pic/               alle Bildmotive
│   └── styles/global.css  einziges Stylesheet der Website
├── scripts/               PDF-, EPUB- und Prüfskripte
├── docs/                  Pläne und Konzepte
└── AGENTS.md              Projektregeln
```

## SEO und statische Ausgabe

`src/components/SeoHead.astro` erzeugt Meta-Tags und JSON-LD für jede Seite. Rezeptseiten liefern einen eindeutigen Titel, eine Meta-Beschreibung, eine Canonical URL, semantisches HTML, `Recipe`-JSON-LD und sinnvolle Bild-Alt-Texte.

`@astrojs/sitemap` in `astro.config.mjs` und `src/pages/robots.txt.ts` erzeugen die technischen SEO-Dateien. Die Sitemap entsteht beim Build aus den gebauten Routen und ist in drei Dateien aufgeteilt; `sitemap-index.xml` verweist auf alle und ist die einzige Sitemap, die `robots.txt` nennt. Eine neue öffentliche Seite braucht deshalb keinen Sitemap-Eintrag.

## Webanalyse

`src/components/Analytics.astro` bindet Umami Cloud ein; es ist die einzige Ausnahme vom JavaScript-Verbot. Die Kennung ist öffentlich und steht im Bauteil. Buch und EPUB bleiben ohne Messung. Werbeblocker können Skript und Sende-Endpunkt blockieren; die Zahlen sind deshalb eine Stichprobe. Der Abschnitt „Reichweitenmessung" im Impressum beschreibt die Messung.

## Produktions-URL und Basispfad konfigurieren

Für Canonicals sowie absolute URLs in Sitemap und `robots.txt` können beim Build eine echte Domain und ein abweichender Basispfad gesetzt werden:

```sh
PUBLIC_SITE_URL=https://www.deine-domain.de PUBLIC_BASE_PATH=/ npm run build
```

Ohne Umgebungsvariablen verwendet die Konfiguration die Standardwerte für GitHub Pages:

- `PUBLIC_SITE_URL=https://drgonzales.github.io`
- `PUBLIC_BASE_PATH=/dasferment`

Damit liegt die Website unter `https://drgonzales.github.io/dasferment/`. Die Konfiguration steht in `astro.config.mjs`.

## Deployment

Ein Push auf `main` wird durch `.github/workflows/deploy.yml` als GitHub-Pages-Deployment veröffentlicht. `.github/workflows/buch-pdf.yml` baut PDF und EPUB und legt sie im GitHub-Release `buch` ab; die Download-Seite verweist auf dieses Release. Für eine eigene Domain werden `PUBLIC_SITE_URL` und gegebenenfalls `PUBLIC_BASE_PATH` im Deployment-Build gesetzt.

## Rezeptdaten ändern

1. Die passende JSON-Datei unter `src/data/<kapitel>/` bearbeiten.
2. Bei einer Illustration den Dateinamen in `picture` eintragen.
3. Optional `codex_titel`, `codex_einleitung` und `ratgeber` ergänzen.
4. `npm run build` ausführen und die betroffene Seite unter `dist/` prüfen.
5. Bei Datenänderungen zusätzlich `npm run make:pdf`, `npm run check:book`, `npm run make:epub` und `npm run check:epub` ausführen; geänderte Buchseitenzahlen in `docs/buchdruck-plan.md` nachtragen.

Rezepttexte, Zutaten und Zubereitungsschritte dürfen nicht in Templates dupliziert oder durch Darstellungscode erfunden werden.

## Vor der Veröffentlichung

Das Impressum enthält die tatsächlichen Anbieterangaben inklusive Anschrift sowie einen Transparenzhinweis zu den mit lokalem KI-Modell erzeugten Illustrationen. Vor einer eigenen Domain `PUBLIC_SITE_URL` auf die finale Domain setzen und die Sitemap in Google Search Console und Bing Webmaster einreichen.
