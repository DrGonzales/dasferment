---
name: rezepte-daten
description: Rezepte und Wissenseiten in src/data/*/*.json ändern, Codex-Texte, Ratgeber, Pflichtfelder und Einstiegsseiten in src/data/Einstiegsseiten.json
license: MIT
compatibility: opencode
metadata:
  bereich: daten
  ausgabe: website
---

# Rezepte und Wissen ändern

Beide JSON-Dateien sind die einzige Quelle der Inhalte. Rezeptdaten dürfen nicht in
Astro-Templates dupliziert oder umformuliert werden, und jedes Rezept nutzt
dasselbe Template. Was nicht aus der Datei kommt, wird nicht erfunden: keine
 historischen Quellen, keine Zutaten, keine Arbeitsschritte, keine Zeiten.

## Pflichtfelder je Rezept

`titel`, `tags`, `zutaten`, `zubereitung`, `picture`, `ratgeber`, `codex_einleitung`.

Fehlt `picture`, darf kein Platzhalterbild entstehen. Fehlt `ratgeber`, wird kein
künstlicher Ratgeber erzeugt.

## Die zwei Ebenen

* **Sachlich:** `titel`, `tags`, `zutaten`, `zubereitung`, `picture`. Wird unverändert
  für SEO, Übersichten, Breadcrumbs und Navigation verwendet.
* **Kodex:** alles mit dem Präfix `codex_`. Mittelalterlicher Klang, aber verständlich,
  kurze Einleitungen, über alle Rezepte hinweg gleich stilistisch.

`codex_titel` ist bewusst nicht `titel`:

```text
Rezepttitel: Klassische Salzgurken (Milchsäuregärung)
Kodex-Titel: Von den gesalzenen Gürkchen und ihrer milden Gärung
```

## Einstiegsseiten und Saison

Vier Suchintentionen haben je eine kanonische Seite: Ginger Bug, Kimchi und
Sauerkraut auf bestehenden Kategorieseiten, Fermentieren im Herbst/Winter auf
`/saison/herbst-winter/`. Die 55 Rezeptblätter bleiben inhaltlich unberührt.

`src/data/Einstiegsseiten.json` enthält H1, `<title>`, Description, Lead, Kicker,
Wissens-IDs, Kartenreihenfolge und Saison-Werte. Diese Texte gehören nicht in
Templates; `src/lib/landingPages.ts` ist der einzige Zugriff. `title` und
`description` dürfen `{anzahl}` enthalten, das zur Build-Zeit ersetzt wird.

`saison: string[]` ist ein optionales Rezeptfeld. Erlaubte Werte kommen aus
`Einstiegsseiten.json`, nicht aus einem Tag-Vergleich im Code. Ein unbekanntes
Rezept in `reihenfolge`, eine unbekannte Saison oder eine tote Wissens-ID ist
ein Build-Fehler.

## Ratgeber

```json
"ratgeber": { "sprecher": "Connie", "text": "…" }
```

Humorvoll, greift praktische Hinweise aus dem Rezept auf, erfindet aber keine
sicherheitsrelevanten oder fachlichen Aussagen. Das Portrait kommt über
`actorImageFor()` aus `src/lib/actorImages.ts`, der Dateiname ist `sprecher`
in Kleinschreibung. Fehlt ein Portrait, wird der Ratschlag ohne Portrait gerendert,
nicht mit kaputtem `<img>`.

## Wissenseite

Alle Einträge stehen auf einer Seite, `/wissen/`. Pro Gruppe ein `<section>`, pro
Eintrag ein `<article>` mit `id={info.id}`, Gruppen-IDs mit dem Präfix `gruppe-`.

Kodex-Feld zuerst, normales Feld als Fallback, über `codexText()` und `codexListe()`
in `src/lib/infos.ts`:

| Kodex-Feld | Fallback |
| --- | --- |
| `codex_titel` | `titel` |
| `codex_intro` | `intro` |
| `codex_text` | `text` |
| `codex_liste` | `liste` |
| `codex_hinweis` | `tabelle.hinweis` |

Die Portraits auf der Wissensseite kommen deterministisch aus `assignPortraits()`
in `src/lib/smallActors.ts`. Bei 18 Einträgen und 9 Bildern ist jedes Bild genau
zweimal vergeben, ohne direkte Wiederholung an zwei aufeinanderfolgenden Einträgen.
Nach einer Änderung an der Zahl der Einträge gehört das neu verteilt.

## Nach dem Ändern

* `npm run build` muss durchlaufen, die Seitenzahl stimmen.
* Jede Sprungmarke muss existieren, doppelte `id` sind Fehler.
* Nichts an `src/lib/recipes.ts` anpassen, was schon aus den Daten kommt.
* Bilder laufen über `astro:assets` und haben Alt-Text oder sind als dekorativ markiert.
* Fällt ein Rezept oder eine Wissenseite an, gilt zusätzlich der Skill `buch-umbruch`:
  `npm run check` baut Website, Buch, PDF und EPUB neu und prüft alle Ausgaben.
* Ändern sich nur ein Tag oder ein `saison`-Feld, bleiben Buch und EPUB inhaltlich
  gleich; `npm run make:pdf && npm run check:book` und
  `npm run make:epub && npm run check:epub` bestätigen das.
