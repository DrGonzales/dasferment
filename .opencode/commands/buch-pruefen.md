---
description: Buchumbruch neu bauen und den fertigen Umbruch prüfen
---

Baue das Rezeptbuch neu und prüfe Umbruch und PDF. Nutze den Skill `buch-umbruch`.

Führe aus:

```
npm run make:pdf
npm run check:book
```

Lies @docs/buchdruck-plan.md, Abschnitt „Stand nach der Umsetzung“.

Berichte danach:

1. Jeden Befund aus `check:book` wörtlich, mit der betroffenen Seite.
2. Die gemessenen Zahlen: Seiten im Umbruch, Bildseiten, Rezeptseiten, Leerseiten,
   Rezeptteil von bis, PDF-Seitenzahl.
3. Ob die Zahlen im Buchdruck-Plan noch stimmen. Wenn sich Seitenzahlen,
   Leerseiten, Kolumnentitelzahl, Bildhöhe oder Umfang geändert haben, aktualisiere
   den Abschnitt im Plan und passe die Description in @AGENTS.md an.
4. `npm run build` zur Kontrolle, die Website muss bei 78 Seiten bleiben.

Beende die Arbeit nicht, solange `check:book` einen Befund ausgibt. Gehe jeden
Befund einzeln an, statt die Prüfung zu lockern.
