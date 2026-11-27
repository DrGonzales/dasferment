# Rezeptseiten Specification

## Purpose

Jedes Rezept hat eine eigene, stabile Adresse. Sachliche Daten und mittelalterliche Kodex-Texte bleiben getrennt, aber auf derselben Seite sichtbar.

## Requirements

### Requirement: Eine URL je Rezept

Die Website SHALL jedem Rezept eine eigene, stabile URL aus einem Slug geben und darf dafür keine Abfrageparameter verwenden.

#### Scenario: Rezept verlinken

- **WHEN** ein Rezept von einer Übersicht verlinkt wird
- **THEN** zeigt der Link auf eine dauerhaft gültige Rezeptseite ohne Query-Parameter

### Requirement: Zwei redaktionelle Ebenen

Die Rezeptseite SHALL den sachlichen Titel als Überschrift zeigen und den Kodex-Titel darunter als gestaltete Zeile, ohne beide Texte zu vermischen.

#### Scenario: Rezept mit Kodex-Titel

- **WHEN** ein Rezept einen abweichenden Kodex-Titel hat
- **THEN** steht der sachliche Titel in der Überschrift und der Kodex-Titel darunter

### Requirement: Verwandte Rezepte

Die Rezeptseite SHALL am Ende verwandte Rezepte aus gemeinsamen Schlagworten anzeigen; die Auswahl ist deterministisch und zeigt kein Rezept doppelt.

#### Scenario: Gleichstand bei Schlagworten

- **WHEN** mehrere Rezepte gleich viele gemeinsame Schlagworte haben
- **THEN** ist die Reihenfolge alphabetisch und bei zwei Builds identisch

### Requirement: Optionaler Ratgeber

Die Rezeptseite SHALL einen Ratgeber nur anzeigen, wenn er in den Daten vorhanden ist, und darf sonst keinen leeren Platz erzeugen.

#### Scenario: Rezept ohne Ratgeber

- **WHEN** ein Rezept keinen Ratgeber enthält
- **THEN** erscheint kein Ratgeber-Bereich auf der Seite
