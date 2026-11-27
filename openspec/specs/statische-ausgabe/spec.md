# Statische Ausgabe Specification

## Purpose

Jede Seite wird beim Build vollständig als HTML erzeugt. Der Browser muss keine Daten nachladen, um Inhalt darzustellen.

## Requirements

### Requirement: Vollständiges HTML im Build

Die Website SHALL den Rezeptinhalt bereits im ausgelieferten HTML enthalten.

#### Scenario: Rezeptseite aufrufen

- **WHEN** eine Rezeptseite im Browser geöffnet wird
- **THEN** sind Titel, Zutaten und Zubereitung ohne weiteres Laden sichtbar

### Requirement: Kein clientseitiges Rendering

Die Website SHALL nicht davon abhängen, dass JavaScript im Browser zuerst eine Datei lädt und daraus eine Seite erzeugt.

#### Scenario: JavaScript nicht verfügbar

- **WHEN** Skripte im Browser blockiert sind
- **THEN** bleiben alle Rezeptseiten vollständig lesbar und navigierbar

### Requirement: Basis-Pfad

Alle internen Links und Assets SHALL den Basis-Pfad der veröffentlichten Site berücksichtigen.

#### Scenario: Veröffentlichung auf GitHub Pages

- **WHEN** die Website unter dem Basis-Pfad veröffentlicht wird
- **THEN** führen alle internen Verweise und Bildquellen zu den richtigen Zielen
