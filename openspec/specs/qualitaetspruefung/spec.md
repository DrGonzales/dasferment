# Qualitätsprüfung Specification

## Purpose

Vor dem Abschluss einer Änderung läuft eine feste Kette aus Build und Prüfungen. Zusätzliche Prüfungen greifen, wenn Daten oder Ausgaben betroffen sind.

## Requirements

### Requirement: Prüfkette

Die Website SHALL mit einem einzigen Befehl Website, Buch, PDF, EPUB und beide Prüfungen nacheinander bauen und kontrollieren.

#### Scenario: Abschluss einer Änderung

- **WHEN** der Prüfbefehl ausgeführt wird
- **THEN** meldet er jeden Fehler in der Kette und bricht ab

### Requirement: Systemabhängigkeiten

Die Prüfungen SHALL fehlende Systemvoraussetzungen erkennen und dürfen still bestehen, wenn ein Prüfteil nicht lauffähig ist.

#### Scenario: Java fehlt

- **WHEN** die EPUB-Prüfung ohne Java läuft
- **THEN** meldet sie den Fehler, statt nur die eigene Struktur zu prüfen

### Requirement: Datenänderungen

Bei Änderungen an Inhaltsdaten SHALL zusätzlich Buch und PDF gebaut und geprüft werden.

#### Scenario: Neues Rezept

- **WHEN** ein neues Rezept hinzukommt
- **THEN** werden Reihenfolge, Anker, Inhaltsverzeichnis und Register im Buch geprüft

### Requirement: EPUB-Änderungen

Bei Änderungen an der EPUB-Ausgabe SHALL zusätzlich das Archiv gebaut und geprüft werden.

#### Scenario: Geänderte Teileiste

- **WHEN** sich die Reihenfolge der EPUB-Blätter ändert
- **THEN** stimmen Inhaltsverzeichnis und Archiv darin überein

### Requirement: Seitenqualität

Der Build SHALL doppelte Kennungen, tote Sprungmarken, horizontales Scrollen und fehlende Metadaten erkennen oder eine entsprechende Prüfung ermöglichen.

#### Scenario: Doppelte Kennung

- **WHEN** zwei Elemente dieselbe Kennung tragen
- **THEN** meldet die Prüfung den Konflikt
