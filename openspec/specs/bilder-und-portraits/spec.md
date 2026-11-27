# Bilder und Portraits Specification

## Purpose

Bilder werden optimiert ausgeliefert. Portraits bleiben unverändert sichtbar, und fehlende Bilder erzeugen keine kaputten Stellen.

## Requirements

### Requirement: Optimierte Auslieferung

Die Website SHALL alle Bilder über den Bildservice mit responsiven Breiten ausliefern und darf Quelldateien nicht direkt referenzieren.

#### Scenario: Rezeptbild laden

- **WHEN** eine Rezeptseite auf einem Smartphone geöffnet wird
- **THEN** wird eine passend kleine, optimierte Bilddatei geladen

### Requirement: Gemessene Größenangaben

Die Größenangaben für responsive Bilder SHALL der tatsächlich gemessenen Layout-Breite entsprechen und zu den Bruchpunkten des Stylesheets passen.

#### Scenario: Rezeptkarte auf dem Smartphone

- **WHEN** eine Rezeptkarte in der Zwei-Spalten-Ansicht angezeigt wird
- **THEN** wird keine unnötig große Bildstufe heruntergeladen

### Requirement: Portraits unbeschnitten

Portraits SHALL vollständig gezeigt werden, ohne `object-fit: cover`, Beschnitt, Rahmen oder Schatten; rein dekorative Bilder sind als solche gekennzeichnet.

#### Scenario: Portrait mit festem Seitenverhältnis

- **WHEN** ein Portrait in einem schmalen Bereich erscheint
- **THEN** wird es verkleinert, aber nicht abgeschnitten

### Requirement: Fehlendes Bild

Die Website SHALL bei einem fehlenden Bild oder Portrait die Kachel oder den Text ohne Bild darstellen.

#### Scenario: Kategorie ohne Bild

- **WHEN** für eine Kategorie kein Bild vorhanden ist
- **THEN** erscheint die Kategorie mit Text, aber ohne kaputtes Bild oder leeren Platzhalter
