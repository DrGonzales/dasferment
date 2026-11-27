# Einstiegsseiten Specification

## Purpose

Vier Suchintentionen haben je eine kanonische Seite. Deren Texte kommen aus einer eigenen Datenquelle, nicht aus den Rezept-Templates.

## Requirements

### Requirement: Eine Datenquelle für Einstiegsseiten

Die Website SHALL Überschriften, Beschreibungen, Reihenfolge und Saison-Werte der Einstiegsseiten aus einer einzigen Datenquelle beziehen.

#### Scenario: Text einer Einstiegsseite ändern

- **WHEN** der Text einer Einstiegsseite in der Datenquelle geändert wird
- **THEN** erscheint der neue Text auf der Seite, ohne dass ein Template bearbeitet wird

### Requirement: Platzhalter zur Build-Zeit

Die Website SHALL Platzhalter in Titel und Beschreibung zur Build-Zeit durch die tatsächliche Rezeptzahl ersetzen und einen Fehler melden, wenn ein Verweis ins Leere geht.

#### Scenario: Unbekanntes Rezept in der Reihenfolge

- **WHEN** die Reihenfolge ein nicht vorhandenes Rezept nennt
- **THEN** bricht der Build mit einer verständlichen Meldung ab

### Requirement: Sichtbare Verlinkung

Jede Einstiegsseite SHALL über die Kategorieübersicht und die passenden Kapitel-Rezeptlisten erreichbar sein; die Saison-Seite zusätzlich über die betroffenen Rezeptseiten.

#### Scenario: Saison-Seite finden

- **WHEN** ein passendes Rezept geöffnet wird
- **THEN** führt ein sichtbarer Verweis zur Saison-Einstiegsseite

### Requirement: Hauptnavigation bleibt schlank

Die Saison-Einstiegsseite SHALL nicht in der Hauptnavigation stehen.

#### Scenario: Navigation öffnen

- **WHEN** die Hauptnavigation auf einer beliebigen Seite geöffnet wird
- **THEN** enthält sie keinen Saison-Punkt
