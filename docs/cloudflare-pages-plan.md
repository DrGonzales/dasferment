# Hosting mit Cloudflare Pages — Plan

**Status:** Plan, nicht umgesetzt
**Erstellt:** 2026-11-01
**Gegenstand:** Umzug der statischen Website von GitHub Pages auf Cloudflare Pages
**Nicht Gegenstand:** PDF- und EPUB-Build, Buchdownloads, Wechsel auf Server-Rendering

Dieser Plan ist keine Projektregel. Er beschreibt die Migration und die dafür nötigen
Entscheidungen. Die Website bleibt eine rein statische Astro-Ausgabe ohne Adapter und
ohne Cloudflare Functions.

---

## 1. Ziel

Die Website soll künftig über Cloudflare Pages ausgeliefert werden:

- Build aus dem GitHub-Repository bei jedem Push auf `main`
- Vorschau-Deployments für Branches und Pull Requests
- weltweite Auslieferung über das Cloudflare-Netz
- eigene Domain mit automatischem TLS, sobald die Domain feststeht
- unveränderte PDF-/EPUB-Downloads über die bestehenden GitHub-Releases
- keine Änderung an Rezeptdaten, Buchausgabe oder EPUB-Ausgabe

Cloudflare empfiehlt für neue Projekte inzwischen Workers mit statischen Assets. Für
diese Migration bleibt es bei **Cloudflare Pages**, weil der Betreiber Pages ausdrücklich
wünscht und die Website keine serverseitige Laufzeit braucht. Ein Astro-Adapter wird
nicht installiert: `output` bleibt statisch, `npm run build` erzeugt weiterhin `dist/`.

---

## 2. Offene Entscheidungen vor dem ersten Produktions-Deployment

Diese Punkte müssen vor dem Umschalten feststehen:

| Entscheidung | Empfehlung | Warum vorher klären |
| --- | --- | --- |
| Produktions-Domain | eigene Domain, z. B. `https://dasferment.de`; ohne Domain zunächst `https://dasferment.pages.dev` | Canonical, Sitemap, `robots.txt` und Umami hängen daran |
| Pfad | `/` als Basispfad | Cloudflare Pages liefert ein Projekt am Domain-Root aus, nicht unter `/dasferment/` |
| Alter GitHub-Pages-Auftritt | mindestens drei Monate parallel weiterlaufen lassen, danach abschalten | alte Links und Suchtreffer brauchen eine Übergangszeit |
| Vorschau-Deployments | öffentlich lassen oder per Cloudflare Access schützen | verhindert indexierte Testseiten |
| Domain-DNS | bei Cloudflare verwalten | eigene Domain und Redirects werden dadurch deutlich einfacher |

Der wichtigste Unterschied zu GitHub Pages ist der Basispfad. Die bisherigen URLs lauten
`https://drgonzales.github.io/dasferment/…`, auf Cloudflare werden daraus
`https://<domain>/…`. Deshalb muss der Build mit `PUBLIC_BASE_PATH=/` laufen.

---

## 3. Zielbild

```text
GitHub main
    │
    ├── Cloudflare Pages
    │     ├── npm run build
    │     ├── dist/  →  https://<domain>/
    │     ├── Vorschau je Branch/PR
    │     └── eigene Domain + TLS
    │
    └── GitHub Actions „Buch als PDF und EPUB“
          └── Release „buch“ mit PDF und EPUB
                └── Download-Links auf /buch/ bleiben unverändert
```

Die Website bleibt vollständig statisch:

- kein `@astrojs/cloudflare`
- keine Pages Functions
- kein SSR
- kein clientseitiges JavaScript außer dem bestehenden Umami-Skript

---

## 4. Cloudflare-Pages-Projekt anlegen

### 4.1 Git-Integration, empfohlen

1. Cloudflare-Dashboard öffnen: **Workers & Pages → Create → Pages → Connect to Git**.
2. Repository `DrGonzales/dasferment` verbinden.
3. Projektname `dasferment` wählen. Daraus entsteht zunächst
   `https://dasferment.pages.dev`.
4. Produktionsbranch `main` setzen.
5. Build-Konfiguration:

| Einstellung | Wert |
| --- | --- |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` oder leer |

6. Node-Version pinnen. Cloudflare Pages liest `NODE_VERSION` aus den
   Umgebungsvariablen. Der Projektstand verlangt Node `>=22.12.0`.

### 4.2 Umgebungsvariablen

Für **Production** und **Preview** setzen:

```text
NODE_VERSION=22.12.0
PUBLIC_SITE_URL=https://<produktions-domain>
PUBLIC_BASE_PATH=/
PUPPETEER_SKIP_DOWNLOAD=true
```

Begründung:

- `PUBLIC_SITE_URL` steuert Canonical, Open Graph, Sitemap, `robots.txt` und
  `data-domains` des Umami-Skripts.
- `PUBLIC_BASE_PATH=/` ist Pflicht, weil Cloudflare Pages am Root ausliefert.
- `PUPPETEER_SKIP_DOWNLOAD=true` verhindert den Chrome-Download bei `npm ci`.
  Puppeteer wird nur für PDF und EPUB gebraucht, nicht für `npm run build`.
- Die Pages-Build-Umgebung muss DevDependencies installieren, weil `@astrojs/sitemap`,
  `sharp` und die übrigen Build-Werkzeuge dort liegen. Kein `--omit=dev` setzen.

Wenn die Produktions-Domain noch nicht feststeht, zuerst
`PUBLIC_SITE_URL=https://dasferment.pages.dev` verwenden. Ein späterer Domainwechsel
erzwingt einen neuen Build und ändert alle Canonicals und Sitemap-URLs.

### 4.3 Alternative: Upload aus GitHub Actions

Falls keine Cloudflare-Git-Integration gewünscht ist, kann ein GitHub-Actions-Job den
fertigen Build hochladen:

```sh
npm ci
PUBLIC_SITE_URL=https://<domain> PUBLIC_BASE_PATH=/ npm run build
npx wrangler pages deploy dist --project-name dasferment
```

Dafür braucht das Repository `CLOUDFLARE_API_TOKEN` und `CLOUDFLARE_ACCOUNT_ID` als
GitHub-Secrets. Diese Variante ist nur Fallback; die Git-Integration ist weniger
Wartung und liefert Branch-Vorschauen ohne eigenen Workflow.

---

## 5. Nötige Anpassungen im Repository

### 5.1 Keine Astro-Adapter-Änderung

`astro.config.mjs` bleibt im Kern unverändert. Die vorhandenen Umgebungsvariablen
reichen:

```sh
PUBLIC_SITE_URL=https://<domain> PUBLIC_BASE_PATH=/ npm run build
```

Die Standardwerte für GitHub Pages bleiben als lokaler Fallback bestehen. In Cloudflare
müssen die Variablen zwingend gesetzt sein, sonst entstehen Canonicals und interne Links
mit `drgonzales.github.io/dasferment`.

**Härtung, optional:** Im Build abbrechen, wenn `CF_PAGES=1` gesetzt ist und
`PUBLIC_SITE_URL` oder `PUBLIC_BASE_PATH` fehlen. Das verhindert ein stilles Deployment
mit den GitHub-Pages-Fallbacks.

### 5.2 `public/_headers`

Neu anlegen. Cloudflare Pages kopiert die Datei nach `dist/` und wertet sie als
Header-Regeln aus. Vorschlag:

```text
https://:project.pages.dev/*
	X-Robots-Tag: noindex

https://:version.:project.pages.dev/*
	X-Robots-Tag: noindex

/_astro/*
	Cache-Control: public, max-age=31536000, immutable

/*
	X-Content-Type-Options: nosniff
	Referrer-Policy: strict-origin-when-cross-origin
	Permissions-Policy: geolocation=(), microphone=(), camera=()
	X-Frame-Options: SAMEORIGIN
```

Wichtig:

- Die beiden `noindex`-Regeln gelten für Vorschau-Hosts. Wenn die Produktionsseite selbst
  auf `dasferment.pages.dev` läuft, darf die erste Regel nicht für die Produktionsdomain
  greifen; dann entweder eine eigene Domain verwenden oder die Regel entfernen.
- `/_astro/*` ist bereits gehasht und darf dauerhaft gecacht werden.
- Eine Content-Security-Policy erst später ergänzen. Sie muss das Umami-Skript und die
  Inline-JSON-LD-Daten berücksichtigen; ohne diese Prüfung würde sie die Seite brechen.
- HSTS erst nach erfolgreicher eigener Domain und HTTPS-Umstellung auf Zone-Ebene setzen.

### 5.3 `public/_redirects`

Neu anlegen, damit alte Pfade mit `/dasferment/` auf die neue Root-Struktur zeigen:

```text
/dasferment/* /:splat 301
```

Beispiele:

- `/dasferment/` → `/`
- `/dasferment/kapitel/lactation/` → `/kapitel/lactation/`
- `/dasferment/rezepte/gurke/` → `/rezepte/gurke/`

Die bisherigen Kompatibilitätsseiten `/rezepte/<slug>/` bleiben unverändert und leiten
weiterhin per `meta refresh` auf das jeweilige Kapitelblatt. Cloudflare Pages liefert
`404.html` bei unbekannten Pfaden automatisch mit Status 404 aus.

Eine Weiterleitung vom alten Host `drgonzales.github.io/dasferment/…` auf die neue Domain
ist mit `_redirects` **nicht** möglich, weil `_redirects` keine Domain-zu-Domain-Regeln
unterstützt und GitHub Pages keine serverseitigen Redirects erlaubt. Deshalb bleibt der
alte Auftritt zunächst parallel erreichbar.

### 5.4 Dokumentation

Nach der Entscheidung anzupassen:

- `README.md`: Deployment-Abschnitt von GitHub Pages auf Cloudflare Pages umstellen
- `AGENTS.md`: Hosting- und URL-Regeln ergänzen
- `docs/umami-plan.md`: Aussagen zu „GitHub Pages als reiner Dateiserver“ prüfen und um
  Cloudflare Pages ergänzen
- dieser Plan: Status auf „Umgesetzt“, Datum und tatsächliche Domain eintragen

---

## 6. Domain, DNS und TLS

### 6.1 Eigene Domain

1. Domain in Cloudflare als Zone hinzufügen und Nameserver beim Registrar umstellen.
2. Im Pages-Projekt **Custom domains** öffnen.
3. Apex-Domain und `www` hinzufügen.
4. Eine Variante als Canonical festlegen, die andere per Redirect-Regel weiterleiten.
   Beispiel: `www.<domain>/*` → `https://<domain>/:splat` mit 301.
5. **Always Use HTTPS** aktivieren.
6. Warten, bis das automatische Zertifikat aktiv ist.
7. Erst danach HSTS erwägen.

Cloudflare Pages liefert für eigene Domains automatisch TLS. Bei externem DNS braucht
der Apex einen Anbieter mit CNAME-Flattening oder ANAME; einfacher ist die DNS-Zone bei
Cloudflare.

### 6.2 Vorschau-Domains

Pages-Vorschauen liegen unter wechselnden Hostnamen. Zwei Schutzmaßnahmen sind sinnvoll:

- `X-Robots-Tag: noindex` über `_headers` für `*.pages.dev`
- Cloudflare Access für Vorschau-Deployments, wenn sie nicht öffentlich sein sollen

Die Canonicals der Vorschauen zeigen weiterhin auf die Produktionsdomain. Das ist
gewünscht, ersetzt aber keinen Zugriffsschutz.

---

## 7. SEO-Migration

### 7.1 Vor dem Umschalten

1. Produktions-Build mit der späteren Domain prüfen:

   ```sh
   PUBLIC_SITE_URL=https://<domain> PUBLIC_BASE_PATH=/ npm run build
   ```

2. Sicherstellen, dass im Build keine alten Host- oder Pfadwerte stecken:

   ```sh
   rg 'drgonzales.github.io|/dasferment/' dist --glob '*.html' --glob '*.xml' --glob '*.txt'
   ```

   Erlaubt sind nur bewusst erzeugte Redirect-Ziele, keine Canonicals oder internen Links.

3. Canonical der Startseite prüfen:

   ```sh
   rg '<link rel="canonical"' dist/index.html
   ```

4. `robots.txt` prüfen:

   ```sh
   cat dist/robots.txt
   ```

   Erwartet: `Sitemap: https://<domain>/sitemap-index.xml`.

5. Sitemap-Dateien prüfen. Der Index muss auf die drei Dateien zeigen, alle URLs müssen
   die neue Domain und den Root-Pfad tragen.

6. Alte Rezeptweiterleitung prüfen:
   `/rezepte/<slug>/` muss weiterhin auf `/kapitel/<kapitel>/rezepte/<slug>/` zeigen.

7. 404-Verhalten prüfen: unbekannte URL liefert die gestaltete Fehlerseite mit Status 404.

### 7.2 Nach dem Umschalten

1. In der Google Search Console eine Property für die neue Domain anlegen.
2. `https://<domain>/sitemap-index.xml` einreichen.
3. Bing Webmaster Tools ebenfalls aktualisieren.
4. Die alte GitHub-Pages-Property weiter beobachten.
5. Externe Links und Suchtreffer auf die alte Domain mindestens drei Monate beobachten.
6. Den alten GitHub-Pages-Auftritt in dieser Zeit **unverändert** weiterlaufen lassen.
   Ein Neubau mit neuer Domain und altem Basispfad wäre falsch: Die Canonicals würden
   auf `https://<domain>/dasferment/…` zeigen, obwohl die Seiten auf dem alten Host
   liegen und die neue Domain unter `/…` ausliefert.
7. Erst nach der Übergangszeit `deploy.yml` deaktivieren und GitHub Pages abschalten.

Eine echte 301-Weiterleitung vom alten `github.io`-Host ist ohne Kontrolle über den
GitHub-Pages-Server nicht möglich. Wer alte Links sauber umleiten will, braucht auf dem
alten Host eine eigene Ausgabe mit `meta refresh` und Canonical auf die neuen URLs; das
ist mehr Arbeit als ein normaler Rebuild und wird nur empfohlen, wenn die alte Domain
stark verlinkt ist. Sonst genügt die Übergangszeit mit neuer Sitemap und parallelem
Betrieb.

---

## 8. Webanalyse und Downloads

### 8.1 Umami

`src/components/Analytics.astro` setzt `data-domains` aus `Astro.site.hostname`. Mit
korrektem `PUBLIC_SITE_URL` zählt Umami danach nur noch die neue Domain.

Zu prüfen:

- genau ein Umami-Skript-Tag pro Seite
- `data-domains` enthält die Produktionsdomain
- ein Testaufruf erscheint in Umami
- die Ereignisse `pdf-download` und `epub-download` werden auf `/buch/` gezählt
- Vorschau-Domains erzeugen keine Produktionsstatistik

Falls im Umami-Dashboard eine Domain hinterlegt ist, dort die neue Domain ergänzen.

### 8.2 PDF und EPUB

Die Download-Links zeigen weiterhin auf:

```text
https://github.com/DrGonzales/dasferment/releases/download/buch/das-ferment.pdf
https://github.com/DrGonzales/dasferment/releases/download/buch/das-ferment.epub
```

Am Buch-Workflow ändert sich nichts. `buch-pdf.yml` baut weiterhin PDF und EPUB und
aktualisiert das Release `buch`. Cloudflare Pages baut nur `dist/`; `dist-book/` und
`dist-epub/` bleiben außen vor.

---

## 9. Prüfungen vor und nach dem Deployment

### 9.1 Lokal

```sh
PUBLIC_SITE_URL=https://<domain> PUBLIC_BASE_PATH=/ npm run build
npm run check
```

`npm run check` prüft zusätzlich PDF und EPUB. Für den reinen Website-Build genügt
`npm run build`, für die Migration sollte der vollständige Lauf einmal grün sein.

Optional Header und Redirects lokal testen:

```sh
npx wrangler pages dev dist
```

Dabei prüfen:

- `/dasferment/kapitel/lactation/` leitet mit 301 auf `/kapitel/lactation/` um
- `_astro`-Dateien tragen `Cache-Control: public, max-age=31536000, immutable`
- Sicherheitsheader sind gesetzt
- unbekannte Pfade liefern die 404-Seite

### 9.2 Auf der Pages-Vorschau

1. Startseite, Kapitel, Rezept, Kategorie, Wissen, Buch, Kontakt und Impressum öffnen.
2. Interne Links prüfen; kein Link darf auf `drgonzales.github.io` oder `/dasferment/`
   zeigen.
3. PDF- und EPUB-Download testen.
4. Mobile Ansicht bei 320, 375, 800 und 1440 px prüfen; kein horizontales Scrollen.
5. `robots.txt`, `sitemap-index.xml`, Canonical und Social-Card prüfen.
6. 404-Seite prüfen.
7. Lighthouse oder PageSpeed kurz laufen lassen.
8. Umami-Testaufruf und Download-Events prüfen.

### 9.3 Nach dem Domain-Umschalten

1. HTTPS und Zertifikat prüfen.
2. `www`-Weiterleitung prüfen.
3. Alle alten `/dasferment/…`-Pfade auf der neuen Domain prüfen.
4. Alte GitHub-Pages-URLs öffnen; sie müssen weiterhin funktionieren.
5. Search Console und Sitemap prüfen.
6. Ersten Produktions-Testaufruf in Umami abwarten.

---

## 10. Umschaltreihenfolge

1. Cloudflare-Pages-Projekt verbinden und erste Vorschau bauen.
2. `_headers` und `_redirects` ergänzen, erneut deployen.
3. Produktionsdomain festlegen und Umgebungsvariablen setzen.
4. Vorschau vollständig prüfen.
5. Eigene Domain in Cloudflare Pages hinzufügen und DNS/TLS fertigstellen.
6. Produktionsdeployment auf der neuen Domain prüfen.
7. Search Console und Bing aktualisieren.
8. GitHub-Pages-Auftritt für die Übergangszeit unverändert weiterlaufen lassen.
9. Nach drei Monaten GitHub Pages und `.github/workflows/deploy.yml` abschalten.
10. Diesen Plan auf „Umgesetzt“ setzen und die tatsächliche Domain eintragen.

---

## 11. Rollback

Der Rollback ist einfach, solange GitHub Pages noch aktiv ist:

1. DNS der eigenen Domain auf den alten Auftritt zurückstellen oder die neue Domain im
   Pages-Projekt entfernen.
2. GitHub-Pages-Deployment wieder aktivieren.
3. `PUBLIC_SITE_URL` wieder auf die alte Domain setzen.
4. Cloudflare-Pages-Deployment pausieren oder das Projekt löschen.

Deshalb sollte `.github/workflows/deploy.yml` erst nach der Übergangszeit entfernt werden.
Der Buch-Workflow bleibt in jedem Fall bestehen.

---

## 12. Grenzen und Risiken

| Risiko | Wirkung | Gegenmaßnahme |
| --- | --- | --- |
| `PUBLIC_SITE_URL` oder `PUBLIC_BASE_PATH` fehlt | Canonicals und Links zeigen auf GitHub Pages, Seite ist unter Cloudflare falsch verlinkt | Variablen in Production und Preview setzen; optional Build-Guard |
| Basispfad bleibt `/dasferment` | Alle internen Links führen ins Leere | `PUBLIC_BASE_PATH=/` zwingend setzen und Build prüfen |
| Alter GitHub-Host bleibt indexiert | doppelte Inhalte in Suchmaschinen | neue Sitemap einreichen, Übergangszeit, danach abschalten; bei starker Verlinkung Redirect-Ausgabe auf dem alten Host |
| Vorschau-Deployments werden indexiert | unfertige Seiten in Suchergebnissen | `X-Robots-Tag: noindex` und/oder Cloudflare Access |
| Chrome-Download beim Install | unnötig langsamer oder fehlschlagender Build | `PUPPETEER_SKIP_DOWNLOAD=true` |
| DevDependencies fehlen | Astro-Build scheitert an Sitemap oder Bildoptimierung | Pages-Standardinstallation ohne `--omit=dev` lassen |
| 400 MB Build-Ausgabe | erster Upload dauert, spätere Deployments laden vollständig hoch | akzeptieren; Limits für Dateien und Dateigröße einhalten |
| CSP zu früh eingeführt | Umami oder JSON-LD wird blockiert | CSP separat planen und testen |

Aktueller Build-Stand als Orientierung: `dist/` umfasst rund 400 MB und 1.129 Dateien;
die größte Datei liegt bei etwa 4 MB. Damit bleiben die Cloudflare-Pages-Grenzen von
20.000 Dateien und 25 MiB pro Datei deutlich unproblematisch. Die Free-Kontingente für
Builds sollten vor der Aktivierung im Dashboard geprüft werden.

---

## 13. Ergebnis

Nach Abschluss:

- `main` deployt automatisch nach Cloudflare Pages
- die Website läuft unter einer eigenen Domain im Root-Pfad
- alte `/dasferment/…`-Pfade werden per 301 auf den Root-Pfad umgeleitet
- Canonicals, Sitemap und `robots.txt` tragen die neue Domain
- Umami zählt nur noch die Produktionsdomain
- PDF und EPUB kommen weiterhin aus dem GitHub-Release
- GitHub Pages bleibt als Rückfallweg erhalten, bis die Migration abgeschlossen ist
