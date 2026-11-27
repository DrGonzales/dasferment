# Webanalyse Specification

## Purpose

Reichweite wird mit einem externen Analysedienst gemessen, ohne dass die Website von ihm abhängt oder eigenen clientseitigen Code dafür schreibt.

## Requirements

### Requirement: Ein Script für alle Seiten

Die Website SHALL genau ein Analyseskript auf jeder Seite der Website einbinden und darf es nicht in Buch- oder EPUB-Ausgaben laden.

#### Scenario: Buchausgabe öffnen

- **WHEN** die Buch- oder EPUB-Ausgabe geöffnet wird
- **THEN** enthält sie kein Analyseskipt

### Requirement: Nur echte Domain

Die Website SHALL das Analyseskipt auf die veröffentlichte Domain beschränken und lokale Builds sowie Vorschauen stumm schalten.

#### Scenario: Lokale Vorschau

- **WHEN** die Website lokal in der Vorschau geöffnet wird
- **THEN** werden keine Aufrufe an den Analysedienst gemeldet

### Requirement: Datenschutzsignale

Die Website SHALL das Do-Not-Track-Signal beachten und darf keine Web-Vital-Daten zusätzlich senden.

#### Scenario: Signal gesetzt

- **WHEN** ein Browser Do-Not-Track signalisiert
- **THEN** werden keine Analysedaten gesendet

### Requirement: Download-Ereignisse

Download-Links SHALL ihre Ereignisse deklarativ über Datenattribute melden, ohne eigenes Inline-JavaScript.

#### Scenario: Download klicken

- **WHEN** ein Nutzer auf einen Download-Link klickt
- **THEN** wird das zugehörige Ereignis gemeldet
