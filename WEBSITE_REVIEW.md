# Review: Das Ferment (Webseite)

**Datum:** 24.11.2026
**Geprüft:** Live-Seite `https://drgonzales.github.io/dasferment/` (Startseite, Kapitel, Kategorien, Rezepte, Wissen, Buch, Kontakt, Impressum, Über diese Seite), `robots.txt`, Sitemaps, HTML/CSS sowie das öffentliche GitHub-Repo `DrGonzales/dasferment` (README).

> Kurzfazit: Die Seite ist handwerklich sehr gut gebaut – aber sie ist kaum auffindbar und hat ein paar fachliche/rechtliche Baustellen.

---

## 1. Bedienbarkeit – „eigentlich gut, aber…“

### Was stark ist

- Klare Struktur: Kapitel → Rezepte/Wissen → Detailseite, überall Breadcrumbs und konsistente Navigation.
- Semantisches HTML, `aria-current`, `aria-label`, Alt-Texte bei allen Bildern, 25× `:focus-visible`, `prefers-reduced-motion`, 16 Media Queries.
- Rein statisch, keine Client-JS-Abhängigkeit, Systemfonts (kein externer Font-Load), WebP mit `srcset`, `width/height`, `fetchpriority="high"` beim Hero-Bild. Gutes Core-Web-Vitals-Fundament.
- Haupttext-Kontrast ca. 12,5:1 – sehr gut lesbar.

### Was stört

| Punkt | Detail |
|---|---|
| Navigation „Kapitel“ | Zeigt auf die Startseite; `/dasferment/kapitel/` liefert **404**. Entweder echte Kapitelübersicht bauen oder Menüpunkt in „Kodex/Start“ umbenennen. |
| H1 auf Rezeptseiten | Die Überschrift ist der Kodex-Titel („Von den gesalzenen Gürkchen…“); der eigentliche Rezeptname steht nur in einem `<p>`. Für Orientierung und SEO falsch herum. |
| Keine Suche / kein Filter | 55 Rezepte, aber nur 3 Kapitel + 24 Kategorien. „Gemüse“ enthält 39 Rezepte – kaum filternd. Eine einfache clientseitige Suche fehlt. |
| Wissensteil | 42 Einträge nur als Anker auf einer langen Seite, keine eigenen URLs, keine Links zu den passenden Rezepten. |
| Kontrast | `--ink-faint` (#8b745c) auf Pergament = ca. **3,5:1** bei 0,64–0,84rem Text → WCAG-AA-Verstoß. Dunkeln auf ≥ 4,5:1. |
| Kein Skip-Link | Tastaturnutzer springen nicht direkt zum Inhalt. |
| Selbstlink | Footer „Zur Startseite“ verweist auf der Startseite auf sich selbst. |
| Formular | Kein Datenschutzhinweis direkt am Formular; Access-Key von Web3Forms steht im HTML (normal, aber Domain in Web3Forms einschränken). |

---

## 2. Authentizität – gestalterisch hoch, fachlich mit Rissen

**Gestalterisch: 9/10.** Pergament, Buchmalerei, verschnörkelte Initialen, Chronikensprache und die wiederkehrenden Figuren Connie & Katze sind außergewöhnlich kohärent. Dass alle 55 Rezepte illustriert sind, ist ein echtes Alleinstellungsmerkmal. Wenn die Bilder allerdings KI-generiert sind, sollte das transparent im Impressum/„Über diese Seite“ stehen – die Seite erweckt sonst den Eindruck handgemalter Originale.

**Fachlich: überwiegend solide, aber ein klarer Widerspruch:**

- Im Wissensteil steht richtig: **nicht druckdicht verschließen**, Gärgase müssen entweichen, 5 % Lake für ganze Gemüsestücke.
- Das Rezept „Klassische Salzgurken“ sagt aber: **„Das Glas verschließen“** und verwendet nur **30–35 g Salz/Liter (3–3,5 %)**. Das ist ein Sicherheits-/Qualitätsthema und sollte korrigiert werden.
- „Steriles Fermentationsglas“ → besser „sauber, heiß ausgespült“; Sterilität ist weder nötig noch realistisch.
- Eichen-/Weinblätter: Hinweis „unbehandelt/Lebensmittelqualität“ ergänzen.
- Positiv: Salztabellen, Temperaturzonen, Schimmelregel („bei Zweifel verwerfen, nicht probieren“) und die ehrliche Einordnung von Kefir („kein Zaubertrank“) sind wissenschaftlich gut und seriös.
- Zahlen wild durcheinander: Startseite **24 Kategorien**, „Über diese Seite“ **56 Kategorien**, README **26 Kategorien / 39 Rezepte / 22 Bilder** (live: 55/55). Dazu „versammelt in3 Kapiteln“ und die Impressum-Adresse „Friedrichstr. 4567678 Mehlignen“ ohne PLZ – die README nennt das selbst einen Platzhalter. Das untergräbt Vertrauen und ist rechtlich angreifbar (§ 5 DDG).

---

## 3. SEO – technisch stark, inhaltlich verschenkt

**Gut:** `lang="de"`, Canonicals, eindeutige Titles/Descriptions, OG/Twitter, Sitemap-Index + robots.txt, und vor allem sauberes JSON-LD: `WebSite`, `Organization`, `BreadcrumbList`, `ItemList` und pro Rezept `Recipe` mit Zutaten, Schritten, Bild und `totalTime`. Das ist über dem Durchschnitt.

**Lücken:**

- Der sachliche Rezeptname gehört in die **H1**, nicht nur in einen Absatz.
- Die 42 Wissenseinträge sind **nicht eigenständig indexierbar** – das ist der größte Content-Verlust. Je eigene URL + `FAQPage`/`HowTo`-Schema.
- Keine Querverlinkung Wissen ↔ Rezepte; kein „Mehr dazu“-Modul.
- Sitemap ohne `<lastmod>`; Image-Namespace deklariert, aber keine `<image:image>`-Einträge. Bilddateien heißen `1.webp` … `55.webp` – für die Bildsuche wertlos.
- `author`/`publisher` sind nur die Organization „Das Ferment“ – für E-E-A-T wäre eine echte Person (Hans Anthes) mit Foto und `sameAs` besser.
- Keine sichtbare GSC/Bing-Verifizierung im HTML (kann natürlich per DNS laufen). In einer Stichprobe fand ich keine indizierten Seiten – bitte in der Search Console prüfen.
- GitHub-Repo: 0 Sterne, keine Beschreibung, keine Topics, kein Website-Link, README veraltet → verschenkter Entdeckungskanal.

---

## 4. Maßnahmen für mehr Traffic – priorisiert

### P0 – sofort (wenige Stunden)

1. Impressum mit echter Anschrift inkl. PLZ korrigieren; Datenschutzerklärung ergänzen (Umami **und** Web3Forms, Zweck, Speicherdauer, Widerruf) plus Hinweis am Formular.
2. Salzgurken-Rezept: „locker verschließen / Gäraufsatz“, Salzmenge mit der eigenen 5%-Tabelle abgleichen, „steril“ ersetzen.
3. Alle Zahlen und Tippfehler vereinheitlichen (24/56/39, „in3“), README aktualisieren.
4. Nav „Kapitel“ auflösen und H1s auf Rezeptnamen umstellen.

### P1 – 1–2 Wochen

5. Aus den 42 Wissenseinträgen eigene Seiten machen: z. B. „Kahmhefe erkennen“, „Salzlake 2 % vs. 5 %“, „Gärgas Druck im Glas“. Genau solche Fragen werden gesucht.
6. Sitemap um `lastmod` und Bild-Einträge ergänzen, in Google Search Console + Bing Webmaster einreichen, Core Web Vitals messen.
7. Internes Linknetz: pro Rezept 2–3 passende Wissenslinks und umgekehrt.
8. Author-Person + echtes Kurzprofil, Kontrast von `--ink-faint` erhöhen, Skip-Link ergänzen.

### P2 – Reichweite aufbauen

9. Keyword-Clusters und saisonale Landingpages: „Ginger Bug Rezept“, „Kimchi Grundrezept“, „Sauerkraut richtig fermentieren“, „Fermentieren im Herbst/Winter“ – poetischen Ton behalten, aber Suchbegriffe in H1/Meta/Titel.
10. PDF/EPUB (schon vorhanden und via Umami getrackt!) als Newsletter-Lead-Magnet nutzen.
11. **Pinterest ist hier der größte Hebel**: die 2:3-Buchmalereien sind das perfekte Format. Dazu Reddit (r/fermentation, r/kimchi), Facebook-Gruppen, Instagram/Reels mit Blubber-Time-Lapses – immer mit echtem Mehrwert, nicht nur Linkdrops.
12. Kooperationen mit Fermentation.love, Slow Food oder Foodbloggern; GitHub-Repo mit Description/Topics/Website versehen.
13. Eigene Domain statt `drgonzales.github.io/dasferment` – das erhöht Klickrate und Vertrauen spürbar.
14. Umami-Events für Rezeptaufrufe, Kategorie-Klicks und Formular-Abschlüsse setzen; wöchentlich GSC-Queries auswerten und die besten Rezepte weiter ausbauen.

---

## Fazit

Die Seite ist ein sehr schönes, technisch sauberes Projekt mit echter Eigenständigkeit. Der Traffic fehlt weniger wegen des Designs, sondern weil Inhalte (Wissen), H1-Struktur, Vertrauenssignale (Impressum/Datenschutz) und Distribution fehlen. Mit den P0-/P1-Punkten ist in wenigen Tagen ein großer Sprung drin.
