# Wissensseiten Specification

## Purpose

Wissenseinträge sind gebündelt und zugleich einzeln adressierbar. Kodex-Texte haben Vorrang, fehlende Felder hinterlassen keine Lücken.

## Requirements

### Requirement: Sammel- und Detailseiten

Die Website SHALL alle Wissenseinträge eines Kapitels gebündelt anzeigen und zusätzlich für jeden Eintrag eine eigene Seite mit vollständigem Text anbieten.

#### Scenario: Eintrag öffnen

- **WHEN** ein Wissenseintrag von der Sammelseite ausgewählt wird
- **THEN** öffnet sich seine Detailseite mit vollständigem Text und passenden Rezepten

### Requirement: Kodex-Feld zuerst

Die Website SHALL Kodex-Felder verwenden und das normale Feld als Fallback einsetzen; fehlt ein Feld, entsteht keine Lücke.

#### Scenario: Fehlender Kodex-Text

- **WHEN** ein Eintrag keinen Kodex-Text hat
- **THEN** wird der normale Text gezeigt, ohne leeren Absatz

### Requirement: Deterministische Portraits

Die Website SHALL die Wissens-Portraits deterministisch zuordnen, ohne dass ein Motiv direkt zweimal hintereinander erscheint.

#### Scenario: Zwei Builds

- **WHEN** dieselben Daten zweimal gebaut werden
- **THEN** ist die Reihenfolge der Portraits identisch

### Requirement: Gültige Anker

Jede Sprungmarke im Inhaltsverzeichnis SHALL auf einen vorhandenen Anker zeigen; doppelte Kennungen sind Fehler.

#### Scenario: Neue Wissensgruppe

- **WHEN** eine Wissensgruppe hinzugefügt wird
- **THEN** verweist ihr Eintrag im Inhaltsverzeichnis auf eine tatsächlich vorhandene Stelle
