---
description: Vor dem Abschluss die Checkliste aus AGENTS.md durchgehen
---

Gehe die Liste „Vor dem Abschluss prüfen“ aus @AGENTS.md Punkt für Punkt durch und
erledige jeden Punkt. Nutze den Skill `buch-umbruch`, wenn `src/data/`,
`src/lib/book.ts` oder `src/book/` betroffen sind, sonst den Skill `rezepte-daten`.

Führe aus:

```
npm run build
npm run make:pdf
npm run check:book
```

Prüfe zusätzlich von Hand:

* doppelte `id`-Attribute und tote Sprungmarken, im Website-Build und im Buch
* neue Bilder laufen über `astro:assets`, Alt-Text vorhanden oder `aria-hidden`
* neue Seiten stehen in `src/components/SeoHead.astro`, `src/pages/sitemap.xml.ts`
  und `src/components/Header.astro`
* kein horizontaler Overflow, keine festen Layoutbreiten, `clamp()` für Typografie
* keine erfundenen Rezept- oder Kontaktangaben

Berichte am Ende knapp: welche Punkte in Ordnung waren, welche Befunde es gab und
was du geändert hast. Nenne die Seitenzahlen von Website und Buch.
