# Buchausgabe Specification

## Purpose

Das Buch ist eine zweite, getrennt gebaute Ausgabe aus denselben Daten. Es ändert die Regeln der Website nicht.

## Requirements

### Requirement: Getrennte Ausgabe, gemeinsame Daten

Buch und Website SHALL dieselben Inhaltsdaten lesen, aber getrennte Builds, Layout-Hüllen und Stylesheets haben.

#### Scenario: Rezept ändern

- **WHEN** ein Rezept in den Daten geändert wird
- **THEN** erscheint die Änderung nach dem jeweiligen Build in Website und Buch

### Requirement: Keine Drucklogik auf der Website

Die Website SHALL keine Druckregeln, `@page` oder Print-Stylesheet enthalten; die Seitenzahl der Website bleibt von der Buchausgabe unberührt.

#### Scenario: Buch neu bauen

- **WHEN** das Buch neu gebaut wird
- **THEN** bleibt der Website-Build unverändert

### Requirement: Ein Rezept je Blatt

Das Buch SHALL jedes Rezept auf einer eigenen Seite beginnen, mit dem Bild auf der rechten und dem Text auf der linken Seite.

#### Scenario: Langer Rezepttext

- **WHEN** ein Rezepttext länger als eine Seite ist
- **THEN** läuft er auf der nächsten Seite weiter, ohne das folgende Bild auf die linke Seite zu rücken

### Requirement: Buch-Typografie

Das Buch SHALL Maße in `pt` verwenden, auf Blocksatz verzichten und keine Media Queries oder Container Queries nutzen.

#### Scenario: Text im Buch

- **WHEN** ein Fließtext im Buch umbrochen wird
- **THEN** ist er nicht im Blocksatz und die letzte Zeile bleibt unverdehnt

### Requirement: Buchprüfung

Nach Änderungen an Daten oder Buch SHALL ein Prüfskript Umbruch, Bildseite, Textseite, Kennungen und Sprungmarken kontrollieren.

#### Scenario: Umbruch geändert

- **WHEN** sich Seitenzahlen geändert haben
- **THEN** meldet die Prüfung Abweichungen oder bestätigt den gültigen Umbruch
