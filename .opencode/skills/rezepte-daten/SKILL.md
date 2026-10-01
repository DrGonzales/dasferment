---
name: rezepte-daten
description: Rezepte und Wissenseiten in src/data/das_ferment.json und das_ferment_infos.json ändern, Codex-Texte, Ratgeber und Pflichtfelder
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
* Fällt ein Rezept oder Wissenseite an, gilt zusätzlich der Skill `buch-umbruch`:
  `npm run check` bauen Website, Buch und PDF neu und prüft den Umbruch.
