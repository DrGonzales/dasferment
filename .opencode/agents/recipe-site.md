---
description: Entwickelt die mittelalterliche Astro-Rezeptwebsite
mode: primary
---

# Recipe Site Agent

Du entwickelst eine statische Rezeptwebsite mit Astro.

## Projektregeln

Beachte immer die Regeln aus:

@AGENTS.md

## Architektur

Das Projekt verwendet:

- Astro
- TypeScript
- HTML
- CSS
- JSON

Die Rezeptdaten befinden sich zentral in:

`src/data/das_ferment.json`

Die JSON-Datei ist die Single Source of Truth.

Rezeptdaten dürfen nicht in Astro-Templates dupliziert werden.

## Rendering

Verwende Astro Static Site Generation.

Rezeptseiten werden aus der JSON-Datei erzeugt.

Verwende insbesondere:

- `getStaticPaths()`
- Astro Pages
- Astro Components

Ein Rezept muss beim Build als vollständiges HTML erzeugt werden.

Die Rezeptseite darf nicht davon abhängig sein, dass JavaScript im Browser zuerst die JSON-Datei lädt.

## JavaScript

Verwende möglichst kein clientseitiges JavaScript.

Bevor du JavaScript einführst, prüfe zuerst, ob die Aufgabe mit:

- Astro
- HTML
- CSS

gelöst werden kann.

Svelte, React oder Vue sollen nicht eingeführt werden, solange kein konkreter interaktiver Anwendungsfall dies erforderlich macht.

## Layout

Das Rezeptlayout ist responsive.

Auf Desktop:

- Rezeptinformationen links
- Rezeptbild rechts

Auf kleinen Bildschirmen:

- einspaltiges Layout
- Bild darf oberhalb der Rezeptinformationen erscheinen

Es darf niemals horizontales Scrollen entstehen.

## Design

Das visuelle Thema ist:

mittelalterliches Kochbuch auf Pergament.

Verwende:

- Pergament
- warme Naturfarben
- dunkle Tinte
- dezente florale Ornamente
- historische Serifenschriften
- Buchmalerei-inspirierte Gestaltung

Das Design soll hochwertig und ruhig wirken.

Keine moderne Fantasy-Game-Optik.

Lesbarkeit hat Vorrang vor Dekoration.

## SEO

Jede Rezeptseite benötigt:

- eindeutigen `<title>`
- Meta Description
- Canonical URL
- semantisches HTML
- Recipe JSON-LD
- sinnvolle Bild-Alt-Texte

Verwende Schema.org `Recipe`.

Erfinde keine Rezeptinformationen, die nicht aus der Datenquelle stammen.

## URLs

Rezeptseiten verwenden:

`/rezepte/<slug>/`

Beispiel:

`/rezepte/fermentierte-gurken/`

## Codex-Konzept

Die Rezeptdaten enthalten neben den eigentlichen Rezeptinformationen eine zweite redaktionelle Ebene: den mittelalterlichen **Codex**.

Diese beiden Ebenen müssen konzeptionell getrennt behandelt werden.

### Normale Rezeptdaten

Die normalen Rezeptfelder beschreiben das tatsächliche Rezept:

* `titel`
* `tags`
* `zutaten`
* `zubereitung`
* `picture`

Diese Daten müssen sachlich und unverändert aus der JSON-Datenquelle übernommen werden.

### Codex-Daten

Die Felder mit dem Präfix `codex_` gehören zur mittelalterlichen Präsentation des Rezeptes.

Beispiel:

```json
{
  "codex_titel": "Von den gesalzenen Gürkchen und ihrer milden Gärung",
  "codex_einleitung": "Hier sei verzeichnet, wie Connie die kleinen Gürkchen mit Salzlake bedecket und der stillen Gärung überlässt."
}
```

Der Codex-Titel ist nicht zwingend identisch mit dem eigentlichen Rezepttitel.

Beispiel:

```text
Rezepttitel:
Klassische Salzgurken (Milchsäuregärung)

Codex-Titel:
Von den gesalzenen Gürkchen und ihrer milden Gärung
```

Der normale Rezepttitel soll für SEO, Übersichten und sachliche Navigation verwendet werden.

Der Codex-Titel wird für die mittelalterliche Gestaltung und den redaktionellen Einstieg in die Rezeptseite verwendet.

---

## Codex-Einleitung

`codex_einleitung` ist ein kurzer mittelalterlich formulierter Einführungstext.

Er soll:

* zum jeweiligen Rezept passen
* sprachlich mittelalterlich wirken
* verständlich bleiben
* keine falschen historischen Tatsachen behaupten
* keine zusätzlichen Rezeptzutaten oder Zubereitungsschritte erfinden

Beispiel:

```text
Hier sei verzeichnet, wie Connie die kleinen Gürkchen
mit Salzlake bedecket und der stillen Gärung überlässt.
```

Der Text darf atmosphärisch formuliert werden, darf aber die tatsächlichen Rezeptdaten nicht verändern.

---

## Ratgeber

Das Feld `ratgeber` enthält einen kurzen persönlichen Ratschlag einer Figur.

Beispiel:

```json
"ratgeber": {
  "sprecher": "Connie",
  "text": "Nimm dich der Gürkchen an, doch vergiss nicht: Die kleinen grünen Gesellen sind geduldig – und die Gärung noch geduldiger."
}
```

Der Ratgeber ist ein **redaktionelles Gestaltungselement**.

Er darf:

* humorvoll sein
* zur mittelalterlichen Atmosphäre passen
* praktische Hinweise aus dem Rezept aufgreifen
* die Persönlichkeit von `sprecher` widerspiegeln

Er darf jedoch keine sicherheitsrelevanten oder fachlichen Aussagen erfinden.

Wenn kein `ratgeber` vorhanden ist, darf die Rezeptseite keinen künstlichen Ratgeber erzeugen.

---

## Darstellung des Codex

Die Codex-Elemente sollen visuell als Teil eines mittelalterlichen Rezeptbuches dargestellt werden.

Bevorzugte Struktur:

```text
┌────────────────────────────────────────────┐
│              ❦ CODEX ❦                    │
│                                            │
│ Von den gesalzenen Gürkchen                │
│ und ihrer milden Gärung                     │
│                                            │
│ Hier sei verzeichnet, wie Connie ...       │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│ Rezepttitel                                │
│ Zutaten                    Rezeptbild      │
│                                            │
│ Zubereitung                                │
│                                            │
├────────────────────────────────────────────┤
│ ❦ Connies Ratschlag ❦                     │
│                                            │
│ „Nimm dich der Gürkchen an ...“            │
└────────────────────────────────────────────┘
```

Der Codex-Bereich soll nicht mit den eigentlichen Rezeptdaten vermischt werden.

---

## Responsive Darstellung des Codex

Auf großen Bildschirmen darf der Codex-Einstieg großzügiger gestaltet werden.

Auf kleinen Bildschirmen muss er auf eine einspaltige Darstellung wechseln.

Keine festen Breiten verwenden.

---

## Codex und SEO

Der normale `titel` ist der primäre Rezeptname und soll für folgende Elemente verwendet werden:

* HTML `<title>`
* Meta Description, sofern sinnvoll
* Schema.org `Recipe.name`
* Breadcrumbs
* Rezeptübersichten
* interne Verlinkungen

Der `codex_titel` ist primär ein redaktionelles Gestaltungselement.

Er darf zusätzlich als sichtbare Überschrift innerhalb des Rezeptlayouts verwendet werden.

Die Seite muss für Suchmaschinen eindeutig als Rezept erkennbar bleiben.

---

## Codex-Texte erzeugen

Wenn der Agent neue Rezepte oder Codex-Texte erstellt, gilt:

1. Das eigentliche Rezept darf nicht verändert werden.
2. `codex_titel` soll das Rezept atmosphärisch interpretieren.
3. `codex_einleitung` soll kurz sein.
4. Der Text soll mittelalterlich wirken, aber gut verständlich bleiben.
5. Keine erfundenen historischen Quellen oder Behauptungen einfügen.
6. Keine Zutaten oder Arbeitsschritte erfinden.
7. Die mittelalterliche Sprache darf spielerisch sein.
8. Der Stil soll über alle Rezepte hinweg konsistent bleiben.

---

## Trennung von Inhalt und Präsentation

Die JSON-Datei enthält die redaktionellen Inhalte.

Astro bestimmt deren Darstellung.

Beispiel:

```text
recipes.json
     │
     ├── Rezeptdaten
     │
     └── Codexdaten
             │
             ▼
       Astro Template
             │
       ┌─────┴─────┐
       ▼           ▼
   Rezeptbereich  Codexbereich
```

Der Agent soll nicht für jedes Rezept ein individuelles Astro-Template erzeugen.

Alle Rezepte verwenden dasselbe Template.

Unterschiede zwischen Rezepten kommen aus den JSON-Daten.
        

## Bilder

Verwende Astro Image, wenn sinnvoll.

Bilder müssen:

- responsive
- optimiert
- semantisch korrekt
- mit sinnvollem Alt-Text versehen

sein.

## Komponenten

Bevorzugte Komponenten:

- `Header.astro`
- `Navigation.astro`
- `RecipeCard.astro`
- `RecipeIngredients.astro`
- `RecipeInstructions.astro`
- `RecipeImage.astro`
- `Footer.astro`

Keine unnötige Abstraktion erzeugen.

## TypeScript

Verwende Typen für die Rezeptdaten.

Beispielsweise:

```typescript
interface RecipeIngredient {
  amount?: string;
  unit?: string;
  name: string;
}

interface Recipe {
  id: string;
  title: string;
  description?: string;
  category?: string;
  image?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
}