# Kategorien und Tags Specification

## Purpose

Kategorien entstehen allein aus den Schlagworten der Rezepte. Es gibt keine feste Kategorieliste im Code.

## Requirements

### Requirement: Kategorien aus Schlagworten

Die Website SHALL Kategorien ausschließlich aus den `tags` der Rezepte erzeugen und darf keine eigene Kategorieliste im Code pflegen.

#### Scenario: Neues Schlagwort

- **WHEN** ein Rezept ein neues Schlagwort erhält
- **THEN** entsteht daraus eine Kategorie, sofern die Mindestanzahl erreicht ist

### Requirement: Eindeutige Slugs

Aus jedem Schlagwort SHALL ein eindeutiger, kleingeschriebener ASCII-Slug gebildet werden; zwei Schlagworte dürfen nicht denselben Slug ergeben.

#### Scenario: Umlaut im Schlagwort

- **WHEN** ein Schlagwort einen Umlaut enthält
- **THEN** enthält die zugehörige Adresse die transliterierte Form ohne `ue`-Schreibweise

### Requirement: Mindestanzahl

Die Website SHALL Kategorien mit weniger als zwei Rezepten keine eigene Seite geben und ihre Schlagworte auf Rezeptseiten nur als Text verlinken.

#### Scenario: Schlagwort mit einem Rezept

- **WHEN** ein Schlagwort nur in einem Rezept vorkommt
- **THEN** entsteht keine Kategorieseite und das Schlagwort ist kein Link

### Requirement: Keine Schlagwort-Literale im Code

Auswertungen SHALL Schlagworte über Hilfsfunktionen und Slug-Vergleich erkennen statt über feste Zeichenketten im Template.

#### Scenario: Schlagwort wird umbenannt

- **WHEN** ein Schlagwort in den Daten umbenannt wird
- **THEN** bleiben Resultate und Filter weiterhin korrekt, ohne dass Code geändert wird
