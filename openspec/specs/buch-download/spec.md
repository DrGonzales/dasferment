# Buch-Download Specification

## Purpose

Auf der Buchseite können PDF und EPUB heruntergeladen werden. Die Dateien entstehen in einer GitHub-Action und liegen nicht im Repository.

## Requirements

### Requirement: Downloads aus dem Release

Die Buchseite SHALL beide Ausgaben aus dem veröffentlichten Release verlinken und darf keine Dateien aus dem Repository oder dem Site-Build anbieten.

#### Scenario: Download-Link öffnen

- **WHEN** ein Nutzer auf einen Download-Link klickt
- **THEN** erhält er die Datei aus dem Release

### Requirement: Adresse und Tag stimmen überein

Die Download-Adressen und der Release-Tag in der Workflow SHALL auf denselben Release zeigen.

#### Scenario: Release-Tag geändert

- **WHEN** der Tag in der Workflow geändert wird
- **THEN** müssen die Download-Adressen angepasst werden, damit die Links nicht ins Leere zeigen

### Requirement: Feste Linktexte und Symbole

Die Buchseite SHALL die festen Texte „PDF herunterladen“ und „EPUB herunterladen“ verwenden und rein illustrative Symbole als dekorativ markieren.

#### Scenario: Download-Karte darstellen

- **WHEN** eine Download-Karte angezeigt wird
- **THEN** nennt sie das Format und zeigt ein Format-Symbol ohne Deckbild
