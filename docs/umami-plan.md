# Webanalyse mit Umami — Plan

**Status:** Umgesetzt am 2026-10-14
**Erstellt:** 2026-10-14
**Entscheidungen:** Hosting Umami Cloud, Kennung `cb4db255-4651-4c36-b97e-6273974b8c10` im Bauteil statt in einer Umgebungsvariable, Umfang Seitenaufrufe plus Downloads, Web Vitals aus
**Gegenstand:** Reichweitenmessung der Website und Erfassung der PDF- und EPUB-Downloads

Dieser Plan ist keine Projektregel. Er beschreibt, wie die Website um eine
Reichweitenmessung ergänzt werden kann, ohne die Buch- und EPUB-Ausgabe zu berühren.
Die Website bleibt ohne die Erweiterung vollständig funktionsfähig.

---

## 1. Ziel

Umami soll zwei Dinge sichtbar machen:

1. **Seitenaufrufe** — welche Rezepte, Kategorien und Wissenseinträge gelesen werden.
2. **Download-Absicht für das Buch** — wie oft die Links auf `das-ferment.pdf` und
   `das-ferment.epub` auf `/buch/` angeklickt werden, getrennt nach Format.

Erfasstdaten bleiben minimal: keine Cookies, kein Cross-Site-Tracking, keine Nutzerprofile.
Genaue Bundesdatenschutz-Bewertung liegt beim Betreiber, der Plan liefert nur die
technische Grundlage und die nötigen Textstellen.

## 2. Grundsatzentscheidung: bewusste Ausnahme vom JavaScript-Verbot

`AGENTS.md` legt unter „Rendering und JavaScript“ fest:

> Kein clientseitiges JavaScript, solange ein konkreter interaktiver Anwendungsfall nicht
> vorliegt.

Umami bezieht seine Daten **zwingend** über ein clientseitiges Fremdskript. Ein
serverseitiges Tracking gibt es hier nicht: GitHub Pages ist ein reiner Dateiserver ohne
Anwendungslogik, und die Seite erzeugt statisches HTML ohne eigenen Serverprozess. Die
Ausnahme ist also nicht umgehbar, sondern eine bewusste Entscheidung.

Konsequenzen:

* Die Regel in `AGENTS.md` bekommt eine ausdrückliche, eng begrenzte Ausnahme: ein
  einziges Tracking-Skript auf der Website, kein weiteres JavaScript.
* Die Ausnahme gilt **nur** für die Website. Buch (`src/book/`) und EPUB (`src/epub/`)
  bekommen kein Skript und keine Netzverbindung nach außen.
* Das Skript wird deklarativ und ohne eigene Logik eingebunden. Es gibt kein
  handgeschriebenes Inline-JavaScript, kein `onclick`, keine eigene Tracker-Verdrahtung.

### Verworfene Alternativen

| Alternative | Warum verworfen |
| --- | --- |
| **GoatCounter, Plausible, Matomo, Google Analytics** | Umami ist vom Betreiber gewünscht und selbst hostbar; die übrigen bringen entweder mehr Datenhunger, mehr Eingriff oder eine andere Abhängigkeit. |
| **Umami Node (serverseitig)** | Es gibt keinen Serverprozess. GitHub Pages liefert nur Dateien aus, ein Node-Client hätte keinen Auslöser im Betrieb. |
| **Umami „Links“ über `/q/:slug`** | Setzt Ziel-URLs im Umami-Dashboard voraus und verlinkt dann indirekt über Umami. Für zwei feste Links mehr Maschinerie als Nutzen, und es verdeckt das echte Ziel. |
| **Zählung der Download-Zugriffe auf GitHub** | Die Release-Seite zählt fertige Downloads, aber nur global als Datei, nicht aus welcher Seite, nicht seitenweise und nicht im selben Dashboard wie die Aufrufe. Bleibt als Kontrollwert nützlich (siehe Abschnitt 6). |
| **Ganz auf Messung verzichten** | Verworfen, weil der Betreiber die Download-Nachfrage kennen will. |

## 3. Hosting: Umami Cloud

Gewählt wurde **Umami Cloud** (`https://cloud.umami.is`). Begründung: kein eigener Server,
kein Datenbankbetrieb, keine Wartung. Passt zur statischen Auslieferung über GitHub Pages.

* Script-URL: `https://cloud.umami.is/script.js`
* Kennung: eine `data-website-id` (UUID), die beim Anlegen der Website in Umami entsteht.
* Region: beim Anlegen der Website eine EU-Region wählen, damit die Verarbeitung in der EU
  bleibt. Die Datenschutzerklärung von Umami nennen (siehe Abschnitt 7).
* Zugang: mindestens zwei Personen oder ein Wiederherstellungsweg, damit das Konto nicht
  an einer Person hängt. Zweifaktor-Authentifizierung aktivieren.

Ein Wechsel auf eine selbst gehostete Instanz bleibt möglich, weil Script-URL und Kennung
an genau einer Stelle stehen, in `src/components/Analytics.astro` (Abschnitt 5). Dann
ändert sich nur diese Zeile.

## 4. Wo das Script eingebunden wird

Das Skript gehört in den `<head>` **jeder** Seite. Die Website hat dafür bereits genau eine
Stelle: `SeoHead.astro` steckt in `<head>` jeder Seite (Start, Rezepte, Kategorien, Wissen,
Buch, Über, Kontakt, Impressum, 404). Eine neue Komponente `Analytics.astro` rendert das
Script-Tag, `SeoHead` hängt sie ein. Damit genügt eine Einbindung für alle Seiten.

Das Skript wird über `is:inline` als exaktes Markup ausgeliefert:

```html
<script
	is:inline
	defer
	src="https://cloud.umami.is/script.js"
	data-website-id="…"
	data-domains="drgonzales.github.io"
	data-do-not-track="true"
></script>
```

* `is:inline` verhindert, dass Astro das externe Skript anfasst, hoistet oder bündelt.
  Es bleibt genau die Zeile, die im Betrieb erwartet wird.
* `defer` lädt erst nach dem HTML und ist damit nicht render-blocking; LCP und die
  Reihenfolge der Rezeptbilder bleiben unberührt.
* `data-domains` lässt **nur** `drgonzales.github.io` zählen. Ein Production-Build auf
  `localhost` oder in einer Vorschau wird nicht erfasst, auch wenn die Kennung gesetzt ist.
* `data-do-not-track="true"` hält sich an `DNT: 1`.
* `data-auto-track` und `data-auto-pageview` bleiben beim Standard `true`, weil
  Seitenaufrufe gewünscht sind.
* `data-performance` bleibt **aus**. Web Vitals sind für dieses Projekt kein Ziel und
  kosten nur zusätzliche Messpunkte.

Buch und EPUB bleiben außen vor: `src/book/pages/index.astro` hat einen eigenen `<head>`
ohne `SeoHead`, `src/epub/` liefert XHTML-Blätter ohne Skript. Beide werden zusätzlich
geprüft (Abschnitt 9, Schritt 7).

### Verworfene Alternativen

| Alternative | Warum verworfen |
| --- | --- |
| **Script in jede Seite einzeln schreiben** | Neun Stellen statt einer, und eine neue Seite würde es vergessen. `SeoHead` ist die vorhandene Ein-Stelle-Lösung. |
| **Neues gemeinsames Layout/`Layout.astro`** | Es gibt bislang keins; es nur für das Skript einzuführen wäre unnötige Abstraktion und ein größerer Eingriff als eine Komponente in `SeoHead`. |
| **`data-domains` weglassen** | Dann zählen lokale Builds und Vorschauen mit. Die Domain-Schranke ist der billigste Schutz. |

## 5. Wo die Kennung steht

Ursprünglich war eine Umgebungsvariable `PUBLIC_UMAMI_WEBSITE_ID` vorgesehen. Bei der
Umsetzung wurde das verworfen: Die Kennung ist **öffentlich**, sie steht ohnehin im
Quelltext jeder ausgelieferten Seite, und es gibt nur eine Instanz. Eine Variable wäre
Abstraktion ohne zweiten Anwendungsfall.

Die Kennung `cb4db255-4651-4c36-b97e-6273974b8c10` steht deshalb direkt in
`src/components/Analytics.astro`, die Script-URL `https://cloud.umami.is/script.js`
ebenfalls. Die Domain-Schranke entsteht aus `Astro.site.hostname` und wächst damit
automatisch mit, falls später eine eigene Domain dazukommt.

Konsequenzen:

* Keine Änderung in `.github/workflows/deploy.yml` und keine `.env`-Datei.
* Ein anderer Betreiber, der das Repository forkt, ändert genau eine Konstante im Bauteil.
  Das steht als Hinweis im Bauteil selbst.
* Sollte später doch eine zweite Instanz nötig werden, ist eine Umgebungsvariable mit
  Rückfall auf den festen Wert eine kleine, nachvollziehbare Änderung.

## 6. Download-Events

Umami erfasst Klicks auf Elemente mit `data-umami-event` automatisch. Das ist der
deklarative Weg und braucht keine eigene Logik. Die beiden Links in `src/pages/buch/index.astro`
bekommen je ein Attribut:

```html
<a
	class="download"
	href={download.href}
	target="_blank"
	rel="noopener noreferrer"
	data-umami-event={download.event}
>
```

Die Download-Liste wird dafür um ein Feld `event` je Eintrag ergänzt:

```ts
const downloads = [
	{ href: `${releaseUrl}/das-ferment.pdf`, label: 'PDF herunterladen', icon: pdfIcon, event: 'pdf-download' },
	{ href: `${releaseUrl}/das-ferment.epub`, label: 'EPUB herunterladen', icon: epubIcon, event: 'epub-download' },
];
```

Regeln und Hinweise:

* **Zwei getrennte Event-Namen** `pdf-download` und `epub-download`, kleingeschrieben mit
  Bindestrich. So lässt sich im Dashboard je Format filtern und zählen.
* **`target="_blank"` bleibt.** Umami folgt einem Anker nach dem Senden oder, bei `_blank`,
  gar nicht, weil die Seite bestehen bleibt und der Request nicht abgebrochen wird. Der
  Link muss also nicht wegen des Trackings geändert werden.
* **Optionale Zusatzdaten** über `data-umami-event-…`, falls später mehr als ein Ort
  auf dasselbe Format verweist, etwa `data-umami-event-seite="buch"`. Jetzt nicht nötig,
  dieser Plan kennt genau eine Herkunft.
* **Ein Klick ist kein fertiger Download.** Erfasst wird die Absicht: jemand verlässt die
  Seite in Richtung Datei. Ob der Download durchläuft, hängt an Netz und GitHub. Die Zahl
  der fertigen Downloads des Release bleibt der Gegenwert zum Abgleich; sie steht auf der
  Release-Seite und in den GitHub-Insights, aber ohne Bezug zur Quellseite.
* **Kein Tracking des Buchs selbst.** Weder PDF noch EPUB enthalten Netzzugriffe oder
  Skripte. Die Messung endet an der Website.

## 7. Datenschutz und Impressum

Umami ist auf Datensparsamkeit gebaut: keine Cookies, kein geräteübergreifendes Profil,
keine Weitergabe an Werbenetze. Es entstehen keine personenbezogenen Nutzerprofile im
Sinne einer Einwilligungspflicht. Diese Einordnung ist die Grundlage, kein Ersatz für eine
rechtliche Prüfung durch den Betreiber.

Alle Daten bleiben in der gewählten EU-Region von Umami Cloud. Umami verarbeitet
Verbindungsdaten (unter anderem IP-Adresse) zur Auswertung, speichert sie aber nicht als
Personenbezug. Details nennt die Datenschutzerklärung von Umami.

Daraus folgt für die Seite:

* **Impressum ergänzen.** `src/pages/impressum/index.astro` bekommt einen eigenen
  Abschnitt „Reichweitenmessung“ mit eigenem Kicker, analog zu „Bildrechte“: Es wird
  Umami Cloud genutzt, es werden keine Cookies gesetzt, es werden Seitenaufrufe und
  Download-Klicks gezählt, und es wird auf die Datenschutzerklärung von Umami verlinkt.
* **Kein Cookie-Banner nötig**, solange keine Cookies und keine Profile entstehen. Sollte
  später etwas anderes dazukommen, muss die Entscheidung neu fallen.
* **Do-Not-Track wird geachtet**, siehe `data-do-not-track` in Abschnitt 4.

## 8. Betroffene Dateien

| Datei | Änderung |
| --- | --- |
| `src/components/Analytics.astro` | **neu** — rendert das Script-Tag mit Kennung, Domain-Schranke und `data-do-not-track` |
| `src/components/SeoHead.astro` | hängt `<Analytics />` in den `<head>` |
| `src/pages/buch/index.astro` | `event` je Download und `data-umami-event` am Link |
| `src/pages/impressum/index.astro` | Abschnitt „Reichweitenmessung“ |
| `AGENTS.md` | Ausnahme vom JavaScript-Verbot, Abschnitt „Webanalyse“, Hinweis in „Buch-Download“ und „Vor dem Abschluss prüfen“ |
| `docs/umami-plan.md` | dieser Plan |

Nicht betroffen: `astro.config.mjs` (keine Integration nötig, das Skript ist kein Plugin),
`.github/workflows/deploy.yml` (keine Umgebungsvariable), die Sitemap, `robots.txt`,
`global.css`, `src/book/`, `src/epub/`.

## 9. Prüfschritte vor dem Abschluss

1. `npm run build` läuft fehlerfrei, die Seitenzahl bleibt 79.
2. `grep -rl "cloud.umami.is" dist/` nennt jede gebaute Seite, und jede nennt die
   Kennung `cb4db255-…` genau einmal.
3. `dist/buch/index.html` enthält `data-umami-event="pdf-download"` und
   `data-umami-event="epub-download"`.
4. Das Script-Tag steht genau einmal je Seite, mit `is:inline`, `defer`, `data-domains`
   und `data-do-not-track="true"`, ohne `data-performance`.
5. `npm run check` bleibt grün. Buch- und EPUB-Bau enthalten kein Skript und keinen
   Verweis auf Umami; mit `grep -rl "umami" dist-book/ dist-epub/` nachsehen.
6. Nach dem Deploy: `/buch/` öffnen, beide Links anklicken, im Umami-Dashboard die Events
   `pdf-download` und `epub-download` prüfen, ebenso die Seitenaufrufe der Rezeptseiten.
7. Der neue Impressum-Abschnitt steht sichtbar und verlinkt die Datenschutzerklärung.
8. `AGENTS.md` nennt die Ausnahme an einer Stelle, damit die Regel nicht still gebrochen ist.

## 10. Nicht im Umfang

* Kein Tracking in PDF, EPUB oder in der Buchausgabe.
* Kein SPA-Tracking, keine Nutzerkonten, keine Identifizierung einzelner Personen.
* Keine weiteren Events außer den beiden Downloads. Verwandte Rezepte, Kategorie-Klicks und
  Suchverhalten werden nicht einzeln erfasst; sie ergeben sich aus den Seitenaufrufen.
* Kein eigenes Dashboard auf der Seite, keine öffentliche Statistik.
* Keine Auswertung von Verweildauer oder Scrolltiefe.

## 11. Offene Punkte

* Region der Website in Umami Cloud prüfen und auf EU stellen, falls noch nicht geschehen.
* Entscheiden, ob `data-exclude-search` und `data-exclude-hash` zusätzlich gesetzt werden.
  Nötig sind sie nicht, die Seite erzeugt keine Query-Strings.
* Zugang und Wiederherstellung des Umami-Kontos regeln, Zweifaktor aktivieren.
* Nach dem ersten Deploy die Events im Dashboard gegenprüfen (Abschnitt 9, Schritt 6).
* Rechtliche Letztbewertung und, falls gewünscht, ein kurzer Hinweis auf der Startseite.

## 12. Bekannte Einschränkung: Werbeblocker und Tracking-Schutz

`cloud.umami.is` steht auf gängigen Filterlisten:

```text
EasyPrivacy                 ||umami.is^$third-party
EasyPrivacy                 ||umami.*/script.js|$script
AdGuard tracking_servers    ||umami.is^$third-party
```

`||umami.is^` trifft jedes Subdomain, also auch `cloud.umami.is`, und `$third-party`
trifft genau den Fall Website → Umami. Betroffen sind Script **und** Sende-Endpunkt,
also nicht nur das Laden des Skripts, sondern auch die Übertragung der Messung.

Folgen:

* In Browsern und Erweiterungen mit EasyPrivacy oder AdGuard (uBlock Origin, AdGuard,
  Brave Shields und ähnliche) meldet die Konsole „Laden fehlgeschlagen für das
  `<script>` …“. Das ist **keine Fehlkonfiguration** der Seite: Das Tag ist korrekt, die
  URL `https://cloud.umami.is/script.js` antwortet mit HTTP 200, und GitHub Pages setzt
  keine Content-Security-Policy. Der Block entsteht im Browser oder im Netz.
* Diese Aufrufe fehlen in der Statistik. Die Zahlen sind eine Stichprobe, keine
  Vollerhebung. Das ist bei clientseitiger Webanalyse üblich und schadet der Seite nicht:
  Ohne Skript bleibt sie vollständig nutzbar.
* Wer die Blockade umgehen will, muss die Messung selbst hosten beziehungsweise über eine
  eigene, nicht gelistete Domain ausliefern. Dann ändern sich in
  `src/components/Analytics.astro` nur Script-URL und Kennung; alles andere bleibt. Das
  setzt einen Server voraus, den GitHub Pages nicht bietet.
