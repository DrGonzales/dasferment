# EPUB-Ausgabe Specification

## Purpose

Das EPUB ist eine dritte Ausgabe aus denselben Daten, mit einem eigenen Blatt je Eintrag und einem eigenen Archivformat.

## Requirements

### Requirement: Ein Blatt je Eintrag

Das EPUB SHALL für jeden Eintrag der gemeinsamen Teileiste eine eigene Datei erzeugen und daraus Inhaltsverzeichnis und Lesereihenfolge bilden.

#### Scenario: Lesegerät blättert

- **WHEN** ein Lesegerät zu einem Rezept springt
- **THEN** öffnet es ein eigenes Blatt mit diesem Rezept

### Requirement: XHTML aus Astro-Ausgabe

Der Packer SHALL die von Astro erzeugten Blätter in gültiges XHTML überführen, weil leere Elemente und fehlende `alt`-Attribute sonst ungültig sind.

#### Scenario: Leeres Element im Blatt

- **WHEN** ein Blatt ein leeres Element enthält
- **THEN** schreibt der Packer es als geschlossenes XHTML-Element

### Requirement: Eigenes Stylesheet ohne Variablen

Das EPUB-Stylesheet SHALL keine CSS-Variablen verwenden, weil epubcheck sie als Fehler meldet.

#### Scenario: epubcheck läuft

- **WHEN** das Archiv geprüft wird
- **THEN** meldet epubcheck keinen Fehler wegen CSS-Variablen

### Requirement: Archivaufbau

Das Archiv SHALL die `mimetype`-Datei als ersten, unkomprimierten Eintrag enthalten und nur tatsächlich referenzierte Bilder aufnehmen.

#### Scenario: Bild ohne Verweis

- **WHEN** ein Bild im Quellordner liegt, aber von keinem Blatt referenziert wird
- **THEN** erscheint es nicht im Archiv

### Requirement: Beide Titel im EPUB

Das EPUB SHALL den sachlichen Rezepttitel zusätzlich zum Kodex-Titel zeigen, damit Volltextsuche nach dem Rezeptnamen funktioniert.

#### Scenario: Rezept suchen

- **WHEN** ein Leser im EPUB nach dem Rezeptnamen sucht
- **THEN** findet er den sachlichen Titel im Text

### Requirement: EPUB-Prüfung

Nach Änderungen SHALL ein Prüfskript Archiv, Manifest, Kennungen, Verweise und Schriften kontrollieren und epubcheck aufrufen.

#### Scenario: Toter Verweis im Archiv

- **WHEN** ein Blatt auf eine nicht vorhandene Datei zeigt
- **THEN** bricht die Prüfung mit einer verständlichen Meldung ab
