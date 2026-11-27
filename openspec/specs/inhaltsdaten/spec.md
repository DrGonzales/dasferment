# Inhaltsdaten Specification

## Purpose

Alle Rezepte und Wissenseinträge kommen aus einer zentralen JSON-Datenquelle. Website, Buch und EPUB lesen dieselben Daten; Templates beschreiben nur das Layout.

## Requirements

### Requirement: Zentrale Datenquelle

Die Website SHALL Rezept- und Wissensdaten ausschließlich aus der Datenquelle beziehen und darf sie nicht in Templates duplizieren oder umformulieren.

#### Scenario: Neues Rezept

- **WHEN** ein Rezept in der Datenquelle ergänzt wird
- **THEN** erscheint es in allen Ausgaben, ohne dass dafür ein eigenes Template angelegt wird

### Requirement: Reihenfolge der Rezepte

Die Website SHALL ein optionales `order`-Feld für die Reihenfolge in Website, Buch und EPUB auswerten; Rezepte mit `order` stehen aufsteigend zuerst, alle übrigen behalten die Reihenfolge der Datenquelle.

#### Scenario: Rezept mit order

- **WHEN** ein Rezept einen `order`-Wert erhält
- **THEN** steht es in allen drei Ausgaben vor den Rezepten ohne `order`

### Requirement: Keine erfundenen Angaben

Die Ausgaben SHALL Angaben, die die Datenquelle nicht hergibt, weglassen statt sie zu raten.

#### Scenario: Fehlende Portionsangabe

- **WHEN** ein Rezept keine Angabe zur Portionszahl enthält
- **THEN** erscheint keine erfundene Portionsangabe in der Ausgabe oder in den Metadaten
