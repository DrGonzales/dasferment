# Responsive Darstellung Specification

## Purpose

Die Website funktioniert auf Desktop, Tablet und Smartphone ohne horizontales Scrollen. Das Rezeptbild wechselt seine Position mit der verfügbaren Breite.

## Requirements

### Requirement: Kein horizontales Scrollen

Die Website SHALL auf allen gängigen Bildschirmbreiten ohne horizontales Scrollen auskommen.

#### Scenario: Schmales Display

- **WHEN** die Seite auf einem Smartphone geöffnet wird
- **THEN** passt sich der Inhalt an, ohne dass horizontal gescrollt werden muss

### Requirement: Rezeptbild auf Desktop und Mobil

Die Rezeptseite SHALL das Bild auf breiten Bildschirmen rechts neben dem Text zeigen und es auf schmalen Bildschirmen oberhalb oder zwischen den Rezeptinformationen platzieren, ohne Zutaten oder Zubereitung unnötig schmal zu machen.

#### Scenario: Wechsel der Bildschirmbreite

- **WHEN** die Bildschirmbreite von Desktop auf Smartphone sinkt
- **THEN** wandert das Rezeptbild über den Text und der Text bleibt vollständig lesbar

### Requirement: Relative Maße

Die Gestaltung SHALL für Layout und Typografie relative Einheiten und `clamp()` verwenden statt fester Pixelbreiten.

#### Scenario: Größere Schrift im Browser

- **WHEN** Nutzer die Schriftgröße erhöhen
- **THEN** wachsen Text und Layout mit, ohne abzuschneiden oder zu überlaufen
