# Navigation und rechtliches Specification

## Purpose

Verweise funktionieren auf der veröffentlichten Site, und rechtlich notwendige Seiten sind von überall erreichbar.

## Requirements

### Requirement: Interne Verweise

Alle internen Links SHALL über den Basis-Pfad der Site gebildet werden und dürfen keine hartkodierten absoluten Pfade verwenden.

#### Scenario: Anderer Basis-Pfad

- **WHEN** die Site unter einem anderen Basis-Pfad veröffentlicht wird
- **THEN** bleiben alle internen Verweise gültig

### Requirement: Navigation

Neue öffentliche Seiten SHALL in der Hauptnavigation verlinkt werden; rechtliche Seiten gehören in die Fußzeile.

#### Scenario: Neue Informationsseite

- **WHEN** eine neue öffentliche Seite gebaut wird
- **THEN** ist sie von der Navigation aus erreichbar

### Requirement: Rechtliche Hinweise

Die Website SHALL Impressum, Datenschutz und Kontakt als eigene Seiten anbieten und von Kontaktformular, Impressum und Fußzeile auf die Datenschutzerklärung verlinken.

#### Scenario: Datenschutz suchen

- **WHEN** ein Nutzer vom Kontaktformular aus die Datenschutzerklärung öffnet
- **THEN** gelangt er auf die zentrale Datenschutzseite

### Requirement: Kontaktformular ohne Geheimnis

Das Kontaktformular SHALL seinen Nachrichtendienst direkt ansprechen, einen Honeypot für Bots enthalten und darf keine Geheimnisse im ausgelieferten HTML brauchen.

#### Scenario: Formular absenden

- **WHEN** ein Mensch das Formular ausfüllt
- **THEN** wird die Nachricht zugestellt, während der leere Honeypot Bots erkennbar macht

### Requirement: Seitenstruktur

Jede echte Seite SHALL genau eine Überschrift erster Ebene, einen Skip-Link und einen Hauptbereich besitzen; Weiterleitungsblätter sind ausgenommen.

#### Scenario: Barrierefreier Einstieg

- **WHEN** eine Seite mit der Tastatur geöffnet wird
- **THEN** führt der Skip-Link direkt zum Hauptinhalt
