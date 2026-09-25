# AGENTS.md

## Projekt: Mittelalterliche Rezept-Website

Dieses Projekt ist eine statische, responsive Rezept-Website auf Basis von **Astro**.

Die Rezepte werden aus einer zentralen **JSON-Datei** geladen und beim Astro-Build in statische HTML-Seiten gerendert.

Das primäre Ziel ist eine optisch ansprechende, mittelalterlich inspirierte Rezeptwebsite, die gleichzeitig:

* schnell lädt
* auf Desktop, Tablet und Smartphone funktioniert
* von Suchmaschinen gut indexiert werden kann
* ohne unnötiges clientseitiges JavaScript auskommt
* die Rezeptdaten ausschließlich aus der JSON-Datenquelle bezieht

---

# 1. Technische Grundsätze

## Technologie

Verwende:

* Astro
* TypeScript
* HTML
* CSS
* JSON

Vermeide standardmäßig:

* React
* Vue
* Svelte
* große JavaScript-Frameworks
* unnötige Client-Side-Rendering-Logik

Interaktive Komponenten dürfen später gezielt ergänzt werden, wenn dafür ein echter Anwendungsfall besteht.

Die Website soll grundsätzlich auch ohne clientseitiges JavaScript funktionieren.

---

# 2. Datenquelle

Alle Rezepte werden zentral in einer JSON-Datei gespeichert.

Beispiel:

```text
src/data/das_ferment.json
```

Die JSON-Datei ist die **Single Source of Truth** für die Rezepte.

Es dürfen keine Rezeptdaten direkt in Astro-Templates dupliziert werden.

Beispielstruktur:

```json
[
  {
    "titel": "Klassische Salzgurken (Milchsäuregärung)",
    "tags": [
      "gemuese",
      "Gurke"
    ],
    "zutaten": [
      "1 kg kleine Einlegegurken",
      "1 Liter Wasser",
      "30–35 g Meersalz (ohne Jod und Trennmittel)",
      "3 Zehen Knoblauch",
      "1 Bund Dill mit Blüten",
      "1 TL Senfkörner",
      "1 TL schwarze Pfefferkörner",
      "2–3 Eichen- oder Weinblätter (für den Knack)"
    ],
    "zubereitung": [
      "Wasser und Salz aufkochen, bis sich das Salz komplett auflöst. Die Salzlake vollständig abkühlen lassen.",
      "Gurken gründlich waschen und etwa 1 Stunde in eiskaltes Wasser legen. Die Blütenansätze vorsichtig entfernen.",
      "Gewürze, Knoblauch und Kräuter auf den Boden eines sterilen Fermentationsglases geben. Die Gurken möglichst dicht stehend darauf schichten.",
      "Die kalte Salzlake eingießen, sodass alle Gurken vollständig bedeckt sind. Ein Fermentiergewicht auflegen.",
      "Das Glas verschließen und 3 bis 5 Tage bei Raumtemperatur fermentieren lassen, danach kühl stellen (z. B. im Kühlschrank oder Keller), um die Gärung zu verlangsamen."
    ],
    "picture": "1.png",
    "codex_titel": "Von den gesalzenen Gürkchen und ihrer milden Gärung",
    "codex_einleitung": "Hier sei verzeichnet, wie Connie die kleinen Gürkchen mit Salzlake bedecket und der stillen Gärung überlässt.",
    "ratgeber": {
      "sprecher": "Connie",
      "text": "Nimm dich der Gürkchen an, doch vergiss nicht: Die kleinen grünen Gesellen sind geduldig – und die Gärung noch geduldiger."
    }
  }
]
```

Die tatsächliche JSON-Struktur darf erweitert werden, wenn dies für weitere Rezeptinformationen erforderlich ist.

---

# 3. URL-Struktur

Jedes Rezept erhält eine eigene URL.

Beispiel:

```text
/rezepte/fermentierte-gurken/
/rezepte/sauerkraut/
/rezepte/kimchi/
```

Keine unnötigen Query-Parameter für die eigentliche Rezeptseite verwenden.

Bevorzugt:

```text
/rezepte/kimchi/
```

statt:

```text
/rezept?id=123
```

Der `id`-Wert bzw. ein daraus erzeugter Slug dient als stabile URL.

---

# 4. Astro Static Site Generation

Die Rezeptseiten werden beim Build generiert.

Das bevorzugte Prinzip:

```text
recipes.json
     │
     ▼
Astro getStaticPaths()
     │
     ▼
Rezept-Template
     │
     ▼
statisches HTML
```

Die fertige Website darf keine Abhängigkeit davon haben, dass der Browser zuerst `recipes.json` lädt und anschließend JavaScript das Rezept rendert.

Das HTML der Rezeptseite soll bereits beim Ausliefern den eigentlichen Rezeptinhalt enthalten.

---

# 5. Seitenstruktur

Die Website soll mindestens folgende Seiten unterstützen:

```text
/
├── index.html
│
├── rezepte/
│   ├── index.html
│   ├── [slug]/
│   │   └── index.html
│
├── kategorien/
│   ├── index.html
│   └── [category]/
│       └── index.html
│
├── ueber-diese-seite/
│
└── impressum/
```

Die konkrete Seitenstruktur darf erweitert werden.

---

# 6. Rezeptseiten – Desktop Layout

Auf ausreichend großen Bildschirmen soll die Rezeptseite zweispaltig aufgebaut sein.

Grundidee:

```text
┌──────────────────────────────────────────────────────────┐
│                    SEITENTITEL                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  REZEPT                                                 │
│                                                          │
│  Titel                              ┌──────────────────┐ │
│  Beschreibung                       │                  │ │
│                                     │                  │ │
│  Zutaten                            │     REZEPT-      │ │
│                                     │      BILD        │ │
│  • Zutat                            │                  │ │
│  • Zutat                            │                  │ │
│  • Zutat                            └──────────────────┘ │
│                                                          │
│  Zubereitung                                            │
│                                                          │
│  1. ...                                                  │
│  2. ...                                                  │
│  3. ...                                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

Das **Rezeptbild befindet sich auf der rechten Seite**, wenn genügend horizontaler Platz vorhanden ist.

Die Textinhalte stehen links.

Das Bild darf nicht dazu führen, dass Zutaten oder Zubereitung unnötig schmal werden.

---

# 7. Responsive Verhalten

Die Website muss vollständig responsive sein.

Es gelten mindestens drei Layoutbereiche:

## Desktop

Bei ausreichend großer Bildschirmbreite:

```text
Text                         Bild
────────────────────       ─────────────
Titel                       │           │
Beschreibung               │   Bild    │
Zutaten                     │           │
```

Das Bild steht rechts.

## Tablet

Das Layout darf bei mittleren Breiten auf ein kompakteres zweispaltiges Layout wechseln.

Das Bild kann kleiner werden.

## Smartphone

Bei schmalen Bildschirmen:

```text
Titel

Beschreibung

Bild

Zutaten

Zubereitung
```

Das Bild wird oberhalb oder zwischen den Rezeptinformationen platziert.

Es darf niemals zu horizontalem Scrollen kommen.

Vermeide starre Pixelbreiten.

Bevorzuge:

* CSS Grid
* CSS Flexbox
* `max-width`
* relative Einheiten
* `clamp()`
* responsive Bilder

---

# 8. Mittelalterliches Design

Die Website soll eine **mittelalterliche, handschriftliche Rezeptbuch-Ästhetik** vermitteln.

Wichtig:

Das Design soll nicht wie ein Fantasy-Computerspiel oder eine moderne "Medieval UI" wirken.

Stattdessen:

* mittelalterliches Kochbuch
* Pergament
* Buchmalerei
* historische Handschrift
* Holz
* Leder
* Tinte
* dezente Ornamente
* Kräuter und Pflanzen
* handgezeichnete Elemente

Die Gestaltung soll hochwertig und ruhig wirken.

---

# 9. Farbwelt

Bevorzugte Grundfarben:

```text
Pergament:
#F1E4C3

Helles Pergament:
#F7EED8

Dunkle Tinte:
#2B2118

Dunkelbraun:
#4A3424

Rötliches Braun:
#743D2B

Gedämpftes Grün:
#536044

Gold/Ocker:
#A47C35
```

Farben dürfen angepasst werden, wenn das Gesamtdesign dadurch harmonischer wird.

Keine grellen modernen Farben verwenden.

---

# 10. Typografie

Die Typografie soll den mittelalterlichen Charakter unterstützen.

Für Überschriften dürfen dekorative bzw. historische Schriftarten verwendet werden.

Der Fließtext muss jedoch gut lesbar bleiben.

Grundregel:

```text
Überschrift → historisch/dekorativ

Fließtext → gut lesbare Serifenschrift
```

Keine übermäßig verschnörkelte Schrift für längere Texte verwenden.

Webfonts möglichst sparsam einsetzen.

Wenn externe Fonts verwendet werden, sollte geprüft werden, ob sie lokal eingebunden werden können.

---

# 11. Pergament-Hintergrund

Die Hauptseite soll einen subtilen Pergamentcharakter besitzen.

Möglich sind:

* dezente Textur
* Papierkörnung
* sehr leichte Flecken
* unregelmäßige Farbverläufe
* feine Alterung

Die Textur darf die Lesbarkeit nicht beeinträchtigen.

Keine extrem starken Hintergrundbilder verwenden.

Wenn kein passendes Bild vorhanden ist, soll das Pergament zunächst mit CSS umgesetzt werden.

---

# 12. Ornamentik

Dekorative Elemente können verwendet werden:

* Linien
* florale Ornamente
* Kräuter
* Blätter
* kleine mittelalterliche Symbole
* Kapitelornamente
* dekorative Initialen

Ornamente sollen den Inhalt unterstützen und nicht dominieren.

Besonders geeignet sind Ornamente:

```text
──────── ❦ ────────
```

oder dezente florale Linien.

---

# 13. Rezeptbild

Jedes Rezept kann ein Bild besitzen.

Das Bild wird aus der JSON-Datei referenziert:

```json
{
  "image": "/images/rezepte/kimchi.jpg"
}
```

Bilder sollen:

* responsive sein
* `alt`-Texte besitzen
* nicht unnötig groß ausgeliefert werden
* einen natürlichen mittelalterlichen / kulinarischen Charakter unterstützen

Wenn möglich, Astro Image verwenden.

Keine Bilder ausschließlich über CSS als inhaltliche Bilder darstellen.

---

# 14. Semantisches HTML

Die HTML-Struktur muss semantisch sein.

Bevorzugt:

```html
<main>
  <article>
    <header>
      <h1>...</h1>
    </header>

    <section>
      <h2>Zutaten</h2>
    </section>

    <section>
      <h2>Zubereitung</h2>
    </section>
  </article>
</main>
```

Nicht alles mit `<div>` aufbauen.

Überschriften müssen logisch hierarchisch aufgebaut sein.

---

# 15. SEO

SEO ist ein wesentlicher Bestandteil des Projekts.

Jede Rezeptseite muss mindestens besitzen:

```html
<title>
<meta name="description">
<link rel="canonical">
```

Die Rezeptdaten sollen zusätzlich als **Schema.org Recipe** über JSON-LD ausgegeben werden.

Beispiel:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "...",
  "description": "...",
  "recipeIngredient": [],
  "recipeInstructions": []
}
</script>
```

Wenn die Daten vorhanden sind, sollen zusätzlich berücksichtigt werden:

* `image`
* `author`
* `recipeCategory`
* `recipeCuisine`
* `prepTime`
* `cookTime`
* `totalTime`
* `recipeYield`
* `keywords`

Keine Schema.org-Werte erfinden, wenn sie nicht aus den Daten hervorgehen.

---

# 16. Sitemap

Die Website soll automatisch eine Sitemap erzeugen.

Alle relevanten Rezeptseiten sollen darin enthalten sein.

Beispiel:

```text
/sitemap-index.xml
```

oder:

```text
/sitemap.xml
```

Je nach verwendeter Astro-Konfiguration.

---

# 17. robots.txt

Eine `robots.txt` soll vorhanden sein.

Grundsätzlich soll die Website für Suchmaschinen crawlbar sein.

Keine Rezeptseiten versehentlich über `robots.txt` blockieren.

---

# 18. Navigation

Die Hauptnavigation soll einfach und übersichtlich bleiben.

Beispiel:

```text
⌂ Startseite
🍲 Rezepte
🌿 Kategorien
ℹ Über diese Seite
```

Die Navigation soll ebenfalls responsive sein.

Auf Smartphones darf sie zu einer kompakten Navigation werden.

---

# 19. Rezeptübersicht

Die Rezeptübersicht soll eine Sammlung der verfügbaren Rezepte anzeigen.

Desktop:

```text
┌────────────┐ ┌────────────┐ ┌────────────┐
│    Bild    │ │    Bild    │ │    Bild    │
│            │ │            │ │            │
│ Rezept 1   │ │ Rezept 2   │ │ Rezept 3   │
└────────────┘ └────────────┘ └────────────┘
```

Auf kleinen Displays:

```text
┌──────────────────────┐
│        Bild          │
│ Rezept 1             │
└──────────────────────┘

┌──────────────────────┐
│        Bild          │
│ Rezept 2             │
└──────────────────────┘
```

CSS Grid verwenden.

---

# 20. Zutaten

Zutaten sollen strukturiert dargestellt werden.

Bevorzugt:

```html
<ul>
  <li>1 kg Gurken</li>
  <li>20 g Salz</li>
</ul>
```

Die Mengen sollen optisch von den Zutaten getrennt werden können.

Beispielsweise:

```text
1 kg     Gurken
20 g     Salz
```

Keine Tabellen verwenden, wenn dadurch die semantische Struktur verschlechtert wird.

---

# 21. Zubereitung

Die Zubereitung soll als nummerierte Liste dargestellt werden:

```html
<ol>
  <li>...</li>
  <li>...</li>
  <li>...</li>
</ol>
```

Jeder Schritt soll klar erkennbar sein.

---

# 22. Accessibility

Barrierefreiheit berücksichtigen.

Insbesondere:

* sinnvolle `alt`-Texte
* ausreichender Kontrast
* sichtbare Fokuszustände
* semantische HTML-Elemente
* Tastaturbedienbarkeit
* keine Informationen ausschließlich über Farbe vermitteln

Dekorative Bilder sollen gegebenenfalls:

```html
alt=""
```

verwenden.

---

# 23. Performance

Die Website soll möglichst wenig JavaScript ausliefern.

Prioritäten:

1. statisches HTML
2. optimierte Bilder
3. CSS
4. nur notwendiges JavaScript

Keine unnötigen Libraries installieren.

Keine Client-Side-Rendering-Lösung einführen, wenn Astro Static Site Generation die Aufgabe bereits erfüllt.

---

# 24. Komponentenstruktur

Eine mögliche Struktur:

```text
src/
├── components/
│   ├── Header.astro
│   ├── Navigation.astro
│   ├── Footer.astro
│   ├── RecipeCard.astro
│   ├── RecipeIngredients.astro
│   ├── RecipeInstructions.astro
│   ├── RecipeImage.astro
│   └── MedievalDivider.astro
│
├── data/
│   └── recipes.json
│
├── layouts/
│   └── BaseLayout.astro
│
├── pages/
│   ├── index.astro
│   ├── rezepte/
│   │   ├── index.astro
│   │   └── [slug].astro
│   └── kategorien/
│       ├── index.astro
│       └── [category].astro
│
└── styles/
    └── global.css
```

Komponenten sollen wiederverwendbar sein.

Keine unnötige Abstraktion erzeugen.

---

# 25. TypeScript

Die Rezeptdaten sollen typisiert werden.

Beispielsweise:

```typescript
export interface RecipeIngredient {
  amount?: string;
  unit?: string;
  name: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  category?: string;
  image?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
}
```

Die JSON-Daten sollen beim Import möglichst gegen diese Struktur geprüft werden.

Fehlerhafte Rezeptdaten sollen während des Builds möglichst früh auffallen.

---

# 26. Build-Verhalten

Der Build muss alle Rezepte automatisch erkennen.

Wenn ein neues Rezept in `recipes.json` hinzugefügt wird:

```text
recipes.json
      ↓
npm run build
      ↓
neue HTML-Seite
```

Es darf keine manuelle Erstellung einer neuen Astro-Datei für jedes Rezept notwendig sein.

---

# 27. Keine Daten-Duplikation

Nicht zulässig:

```text
recipes.json
+
fermentierte-gurken.astro
+
kimchi.astro
+
sauerkraut.astro
```

wenn diese Dateien nur Rezeptdaten enthalten.

Stattdessen:

```text
recipes.json
     ↓
[slug].astro
```

Das Template beschreibt das Layout.

Die JSON-Datei beschreibt den Inhalt.

---

# 28. Designziel

Die Website soll sich anfühlen wie ein digitales mittelalterliches Kochbuch.

Atmosphäre:

> Ein altes, sorgfältig gepflegtes Rezeptbuch liegt auf einem hölzernen Tisch. Die Seiten bestehen aus warmem Pergament, die Rezepte sind mit dunkler Tinte geschrieben und mit kleinen floralen Ornamenten und mittelalterlichen Illustrationen verziert.

Dabei gilt:

**Mittelalterlich, aber benutzbar.**

Die Website darf nicht durch Ornamentik, Texturen oder historische Schriftarten unlesbar werden.

---

# 29. Entwicklungsprinzip

Bei jeder Änderung zuerst prüfen:

1. Ist die Änderung für die Funktion notwendig?
2. Kann sie mit Astro/HTML/CSS gelöst werden?
3. Wird dafür wirklich JavaScript benötigt?
4. Bleibt die Seite vollständig statisch?
5. Ist die Änderung responsive?
6. Ist die Änderung SEO-kompatibel?
7. Bleibt die JSON-Datei die zentrale Datenquelle?

Die einfachste funktionierende Lösung bevorzugen.

---

# 30. Definition of Done

Eine Änderung gilt als fertig, wenn:

* `npm run build` erfolgreich läuft
* alle Rezepte generiert werden
* jede Rezeptseite eine eigene URL besitzt
* das Rezept im HTML enthalten ist
* die Darstellung auf Desktop funktioniert
* die Darstellung auf Smartphone funktioniert
* Bilder responsive sind
* keine horizontalen Scrollbalken entstehen
* SEO-Metadaten vorhanden sind
* Recipe JSON-LD vorhanden ist
* Sitemap korrekt erzeugt wird
* keine unnötigen JavaScript-Abhängigkeiten eingeführt wurden

## Leitprinzip

> **JSON beschreibt das Rezept.
> Astro beschreibt die Website.
> HTML liefert den Inhalt.
> CSS erzeugt die mittelalterliche Gestaltung.
> JavaScript wird nur eingesetzt, wenn es wirklich benötigt wird.**
