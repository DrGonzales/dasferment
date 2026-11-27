# SEO und Metadaten Specification

## Purpose

Jede Seite liefert vollständige, eindeutige Metadaten aus einer zentralen Komponente. Strukturierte Daten enthalten nur belegte Angaben.

## Requirements

### Requirement: Zentrale Metadaten

Die Website SHALL Titel, Beschreibung, Canonical und strukturierte Daten über eine gemeinsame Komponente erzeugen und darf diese Tags nicht an einzelnen Seiten duplizieren.

#### Scenario: Neue öffentliche Seite

- **WHEN** eine neue öffentliche Seite gebaut wird
- **THEN** erhält sie Metadaten, ohne dass eine Seite eigene Tags dupliziert

### Requirement: Rezept-JSON-LD

Jede Rezeptseite SHALL strukturierte Daten mit Name, Beschreibung, Bild, Sprache, Adresse, Zutaten und Zubereitung liefern.

#### Scenario: Rezept durchsucht werden

- **WHEN** eine Rezeptseite von einer Suchmaschine gelesen wird
- **THEN** findet sie ein vollständiges `Recipe`-Objekt mit den Werten aus der Datenquelle

### Requirement: Keine erfundenen Werte

Die Website SHALL strukturierte Daten um unbekannte Properties ergänzen, sobald die Quelle sie hergibt, und sie sonst weglassen.

#### Scenario: Keine Portionsangabe vorhanden

- **WHEN** die Datenquelle keine Portionsangabe enthält
- **THEN** erscheint kein `recipeYield` in den strukturierten Daten

### Requirement: Social Cards

Die Website SHALL Open-Graph- und Twitter-Tags mit einem JPEG-Bild im Format 1200 × 630 oder kleiner erzeugen und ohne passendes Motiv auf eine Text-Card zurückfallen.

#### Scenario: Wissensseite ohne Motiv

- **WHEN** eine Wissensseite kein passendes Bild hat
- **THEN** wird eine Text-Card ohne Bild ausgegeben

### Requirement: Fehlerseite

Die Fehlerseite SHALL `noindex` setzen und darf nicht in der Sitemap erscheinen.

#### Scenario: Fehlerseite analysieren

- **WHEN** eine Suchmaschine die Fehlerseite liest
- **THEN** enthält sie eine Anweisung gegen Indexierung
