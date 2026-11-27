# Mittelalterliches Design Specification

## Purpose

Die Website wirkt wie ein sorgfältig gestaltetes mittelalterliches Kochbuch auf Pergament. Dekoration unterstützt den Inhalt, sie dominiert ihn nicht.

## Requirements

### Requirement: Pergament-Ästhetik

Die Website SHALL eine ruhige, hochwertige Pergament-Optik mit warmen Naturfarben, dunkler Tinte und dezenten floralen Ornamenten verwenden.

#### Scenario: Rezeptseite betrachten

- **WHEN** eine Rezeptseite geöffnet wird
- **THEN** wirkt sie wie eine Buchseite und nicht wie eine moderne Spieloberfläche

### Requirement: Zentrale Farbwerte

Farben und Abstände SHALL an einer zentralen Stelle definiert und im Layout wiederverwendet werden.

#### Scenario: Farbe anpassen

- **WHEN** eine Grundfarbe geändert wird
- **THEN** übernehmen alle Seiten den neuen Wert, ohne dass einzelne Templates angepasst werden

### Requirement: Lesbarkeit vor Dekoration

Die Website SHALL einen ausreichenden Kontrast und eine gut lesbare Fließtext-Schrift sicherstellen; Ornamente dürfen den Lesefluss nicht stören.

#### Scenario: Langer Rezepttext

- **WHEN** ein langer Rezepttext dargestellt wird
- **THEN** bleibt er trotz Hintergrundtextur und Ornamenten gut lesbar
