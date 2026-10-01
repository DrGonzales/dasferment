---
description: Rezept oder Wissenseite in den JSON-Daten ändern
---

Ändere $ARGUMENTS in den Daten des Projekts. Nutze den Skill `rezepte-daten`.

Wähle die Datei selbst und begründe die Wahl knapp:

* Rezept, Zutaten, Zubereitung, Tags, Codex-Text oder Ratgeber: `src/data/das_ferment.json`
* Wissenseintrag, Gruppe, Abschnitt oder Tabelle: `src/data/das_ferment_infos.json`

Regeln, die immer gelten:

* `titel`, `tags`, `zutaten`, `zubereitung` und `picture` bleiben sachlich und werden
  nicht umformuliert. Nichts in ein Template duplizieren.
* Codex-Texte tragen das Präfix `codex_`, klingen mittelalterlich, bleiben kurz und
  verständlich. `codex_titel` ist bewusst nicht `titel`.
* Keine erfundenen historischen Quellen, Zutaten, Arbeitsschritte oder Zeiten.
* `ratgeber` darf humorvoll sein und das Rezept aufgreifen, aber keine
  fachlichen oder sicherheitsrelevanten Aussagen erfinden.
* Keine neuen Seiten im Template. Unterschiede kommen aus den Daten.

Danach `npm run build`. Ändert sich ein Rezept oder ein Wissenseintrag, gilt zusätzlich
der Skill `buch-umbruch`: `npm run make:pdf` und `npm run check:book`.

Berichte am Ende: welche Datei geändert wurde, welche Felder, und ob Website und Buch
ohne Befund bauen.
