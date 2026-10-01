---
name: buch-umbruch
description: Umbruch des Rezeptbuchs in src/book/ ändern und prüfen, Paged.js-Sonderheiten bei break-before, Blocksatz, Bildseiten und Kolumnentiteln
license: MIT
compatibility: opencode
metadata:
  bereich: buchdruck
  ausgabe: dist-book
---

# Buchumbruch ändern

Das Rezeptbuch ist eine zweite Ausgabe. `src/data/` und `src/lib/` sind gemeinsam,
`src/book/` und `src/lib/book.ts` gehören zu beiden. Jede Änderung an `src/book/`
oder `src/lib/book.ts` braucht am Ende `npm run check`.

## Reihenfolge

1. Änderung in `src/book/pages/index.astro` oder `src/book/styles/book.css`.
2. `npm run build:book` für den HTML-Umbruch, `npm run make:pdf` für das PDF.
3. `npm run check:book` prüft Umbruch und PDF. Erst danach ist eine Änderung fertig.
4. `npm run build` prüfen, die Website bleibt bei 71 Seiten.

`npm run check:book` misst den fertigen Paged.js-Umbruch im Browser und das fertige
PDF mit den Werkzeugen aus poppler-utils. Das Skript schlägt bei Bildseite auf einem
Verso, Bildseite mit Kolumnentitel, Rezept ohne Text auf der Rückseite, unmittigem
oder falsch breitem Rezeptbild, geerbter Blocksatz-Ausrichtung, doppelten `id` und
toten Sprungmarken fehl.

## Blatt je Rezept

`.recipe-plate` steht im Markup vor `.recipe`. Das Bild bekommt das Recto, der
Rezepttext beginnt auf der Rückseite.

```css
.recipe       { break-before: left; }
.recipe-plate { break-before: right; }
```

Die Reihenfolge macht das Markup, nicht CSS. Läuft ein Rezepttext über, schiebt
Paged.js eine Leerseite dazwischen, damit das nächste Bild wieder rechts steht.
Leerseiten sind deshalb nie im Template festgelegt.

## Fallstricke, die schon Zeit gekostet haben

* **`margin: 0` auf `.recipe-plate__frame` ist Pflicht.** Ohne die Regel greift der
  Standardrahmen des `<figure>` mit `margin: 1em 40px` und das Bild wird 80 px
  schmaler, ohne Fehlermeldung.
* **Paged.js erbt `text-align-last`.** An jedem umbrochenen Block setzt Paged.js
  `data-align-last-split-element="justify"`, was `text-align-last: justify` bedeutet.
  Kindelemente erben das und werden über die volle Spaltenbreite auseinandergezogen.
  Deshalb die Reset-Liste in `book.css`. `npm run check:book` findet den Fehler
  wieder, wenn sie fehlt.
* **Der Kolumnentitel entsteht nicht über `string-set`.** Paged.js 0.4.3 schreibt den
  Wert ohne schließendes Anführungszeichen in die Custom Property, `string()` bleibt
  leer. `scripts/make-pdf.mjs` setzt `--laufender-kopf` deshalb selbst, je Seite.
* **Bildseiten bekommen keinen Kolumnentitel.** Das Rezept steht dort noch nicht im
  Textfluss, die laufende Variable enthielte den Titel des vorherigen Rezepts.
* **Typografie in `pt`, keine Media Queries, kein `vw`, keine Container Queries.**
* **Bilder mit Transparenz bleiben PNG.** Als JPEG füllt sharp den transparenten
  Grund schwarz. Das gilt für `smallactors/*`.
* **Ein Durchlauf.** `make-pdf.mjs` schreibt Kolumnentitel, Inhaltsverzeichnis und
  Lesezeichen in das bereits umgebrochene DOM. Paged.js darf nicht ein zweites Mal
  laufen, das würde die Paginierung verschieben.
* **Am PDF messen, nicht am DOM.** Seiten werden im DOM nie umgebrochen, dort steht
  eine einzige lange Seite.

## Geänderte Seitenzahlen sind normal

Nach jedem Umbruch neu bauen und die Seitenzahl im PDF prüfen. Trifft `check:book`
keinen Befund, sind die Zahlen in `docs/buchdruck-plan.md` trotzdem veraltet und
müssen im Abschnitt „Stand nach der Umsetzung“ nachgezogen werden.

## Was nicht dorthin gehört

Kein `@page`, kein Print-Stylesheet und keine Drucklogik in der Website.
`global.css` bleibt das einzige Stylesheet der Website.
