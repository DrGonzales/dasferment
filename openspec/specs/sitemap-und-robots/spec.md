# Sitemap und robots.txt Specification

## Purpose

Die Sitemap folgt den gebauten Routen und ist in drei Dateien aufgeteilt. `robots.txt` entsteht als Route, nicht als statische Datei.

## Requirements

### Requirement: Aufgeteilte Sitemap

Die Website SHALL eine Sitemap mit einem Index und drei Dateien für Rezepte, Kategorien und übrige Seiten erzeugen.

#### Scenario: Neue Kategorie

- **WHEN** eine neue Kategorieseite gebaut wird
- **THEN** erscheint sie in der Kategorie-Sitemap, ohne dass eine Liste im Code gepflegt wird

### Requirement: Änderungsdatum aus den Inhalten

Das `lastmod` SHALL aus dem festen Änderungsdatum der Inhaltsquelle stammen und darf nicht das Build-Datum verwenden.

#### Scenario: Zwei Builds nacheinander

- **WHEN** dieselben Inhalte zweimal gebaut werden
- **THEN** bleibt `lastmod` gleich

### Requirement: robots.txt als Route

Die Website SHALL `robots.txt` aus einer Route erzeugen und darf keine gleichnamige Datei im öffentlichen Ordner liegen haben.

#### Scenario: Datei und Route vorhanden

- **WHEN** zusätzlich eine statische `robots.txt` existiert
- **THEN** darf sie die Route nicht überschatten

### Requirement: Ausschlüsse

Die Sitemap SHALL nur öffentlich erreichbare, indexierbare Seiten enthalten und darf Weiterleitungsblätter, Endpunkte und die Fehlerseite nicht listen.

#### Scenario: Alte Rezept-Adresse

- **WHEN** eine alte Rezept-Adresse gebaut wird
- **THEN** steht sie nicht in der Sitemap
