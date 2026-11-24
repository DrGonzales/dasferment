# Pinterest als Traffic-Multiplikator – Konzept

Stand: 24.11.2026. Technische Angaben stammen aus der offiziellen Pinterest-API v5
(OpenAPI-Beschreibung 5.32.0) und der Pinterest-Hilfe; Quellen am Ende.

## Kurzantwort

Ja, Beiträge lassen sich automatisch erstellen. Die offizielle API v5 hat mit
`POST /v5/pins` einen eigenen Endpunkt dafür. Wichtig ist die Voraussetzung: Eine
App braucht eine Freigabe durch Pinterest, und Pins aus dem **Trial access** sind
nur für ihren Ersteller sichtbar. Für echten Traffic ist **Standard access**
nötig. Ohne diese Freigabe bleibt nur die manuelle Erstellung beziehungsweise
der eingebaute Planer im Business-Konto, der auf zehn Pins und 30 Tage begrenzt
ist.

Für dieses Projekt ist Automation sinnvoll, aber sie gehört nicht in die
Website: `src/data/` bleibt die Datenquelle, der Build bleibt statisch und ohne
clientseitiges JavaScript. Die Buchmalereien sind mit 1024 × 1536 px exakt im
Pinterest-Format 2:3; sie müssen nur für Pin-Zwecke als JPEG bereitgestellt
werden.

## Was die API hergibt

| Thema | Befund |
| --- | --- |
| Endpunkt | `POST https://api.pinterest.com/v5/pins`, `operationId: pins/create` |
| Pflichtfelder | `board_id` und `media_source` |
| Textfelder | `title` maximal 100 Zeichen, `description` maximal 800, `alt_text` maximal 500, `link` maximal 2048 |
| Bildquellen | `image_base64` mit `image/jpeg` oder `image/png`, alternativ `image_url` mit öffentlich erreichbarer URL; auch Karussells mit 2–5 Bildern möglich |
| AI-Kennzeichnung | `ai_disclosures.values` mit `AI_MODIFIED` oder `SYNTHETIC_PERFORMER` |
| Rechte | `boards:read`, `boards:write`, `pins:read`, `pins:write` |
| Auth | OAuth Authorization Code oder Client Credentials (letzteres mit 2FA; für das eigene Konto und Cron-Jobs gedacht) |
| Tokens | Access Token 30 Tage, Continuous Refresh Token 60 Tage und unbegrenzt erneuerbar; Token niemals ins Repository |
| Raten Trial | 1000 Requests pro Tag insgesamt, Kategorie `org_write` 300 pro Tag |
| Raten Standard | 100 Requests pro Sekunde insgesamt, `org_write` 100 pro Minute |
| Sandbox | `POST /pins` unterstützt die Sandbox; dort lässt sich der Ablauf ohne echte Pins testen |
| Korrektur | `GET`/`PATCH`/`DELETE /pins/{pin_id}` und `GET /boards/{board_id}/pins` |
| Messung | `GET /pins/{pin_id}/analytics`, `GET /pins/analytics`, `GET /user_account/analytics/top_pins` |

Die API ist ausdrücklich für **neu erstellte eigene Inhalte** gedacht. Das
Speichern fremder Inhalte ("curated content") soll über den Save-Button
passieren; dafür wird diese Automation nicht benutzt.

## Grenzen und Stolpersteine

* **App-Freigabe:** Business-Konto, verifizierte E-Mail, Developer-Terms und ein
  App-Antrag nötig. Trial wird geprüft; der Sprung auf Standard verlangt eine
  Videoaufzeichnung des OAuth-Flows – auch wenn nur ein einziger Nutzer die API
  verwendet.
* **Sichtbarkeit:** In Trial erstellte Boards und Pins sind Sandbox-Objekte und
  nur für den Ersteller sichtbar. Sie bringen also keine Reichweite.
* **Geschäftskonto:** Apps, die ab dem 14.09.2026 registriert wurden, können bei
  nicht-gewerblichen Nutzern `403 PINNER_DATA_ACCESS_DENIED` erhalten. Ein
  Business-Konto vermeidet das Risiko.
* **Geheimnisse:** Pinterest nimmt an GitHubs Secret-Scanning teil. Ein
  versehentlich committeter Token wird innerhalb von 24 Stunden gesperrt. IDs,
  Secrets und Refresh-Token gehören in GitHub Secrets, nicht in `src/` oder
  `docs/`.
* **Domain:** Eine Website lässt sich nur als eigene Domain, Subdomain oder
  eigener Subpfad mit Bearbeitungszugriff auf den Quelltext beanspruchen.
  `drgonzales.github.io/dasferment` erfüllt das nicht; nach einer eigenen Domain
  ist die Verifizierung per HTML-Tag oder DNS-TXT möglich.
* **Bildformat:** Für `image_base64` sind nur JPEG und PNG erlaubt. Die
  Quellbilder liegen als PNG vor und können mit dem bereits vorhandenen `sharp`
  zu JPEG konvertiert werden. Die Social Cards (1024 × 630) sind falsch beschnitten
  und werden nicht wiederverwendet.
* **Kein Client-JavaScript:** Es kommt kein Pinterest-Script, kein Pinterest-Tag
  und kein Save-Button in die Website. Damit bleiben Datenschutzseite und
  Impressum unverändert.

## Strategie: Pinterest als Einstieg, nicht als Linkdump

Jeder Pin führt auf eine bereits vorhandene, kanonische Seite. Es entstehen
keine neuen Landingpages und kein Duplicate Content; die vier
Keyword-Cluster-Seiten aus Punkt 9 der Review sind die natürlichen Sammelziele.

| Board | Inhalt | Linkziel | Umfang |
| --- | --- | --- | --- |
| Das Ferment – Rezepte | alle Rezepte, je ein Pin | Rezeptblatt | 55 |
| Ginger Bug Rezept | Starter und Getränke | `/kategorien/ginger-bug/` und passende Blätter | 11 |
| Kimchi und Sauerkraut | Grundrezept und Varianten | `/kategorien/kimchi/`, `/kategorien/sauerkraut/` | 11 |
| Fermentieren im Herbst/Winter | saisonale Blätter | `/saison/herbst-winter/` | 6 |
| Wissen und Technik | ausgewählte Wissenseinträge | Wissensdetailseiten | 8–10 |

Ein Rezept bekommt seinen Hauptpin auf genau einem Board. Ein zweiter Pin mit
dem gleichen Bild und Link auf einem anderen Board wäre für Pinterest
doppeltes Material; wenn überhaupt, wird ein anderes Motiv oder ein anderer
Blickwinkel verwendet.

**Pin-Texte kommen aus den Daten, nicht aus neuen Behauptungen:**

* `title`: sachlicher `titel` aus der Rezept-JSON, höchstens 100 Zeichen. Dort
  steht der Suchbegriff, nicht nur der Kodex-Titel.
* `description`: `codex_einleitung`, gekürzt und um einen vorhandenen Hinweis
  aus `wissen` ergänzt, höchstens 800 Zeichen. Keine erfundenen Zeiten,
  Salzmengen oder gesundheitlichen Aussagen.
* `alt_text`: vorhandener Helfer `recipeImageAlt()` aus `src/lib/recipes.ts`,
  höchstens 500 Zeichen.
* `link`: absolute kanonische URL plus `utm_source=pinterest`,
  `utm_medium=organic` und `utm_campaign=<board-slug>`. Die kanonische URL der
  Seite bleibt ohne UTM; die Query ändert nichts am statischen Routing.
* `ai_disclosures`: Da die Buchmalereien lokal KI-basiert entstehen, wird
  `AI_MODIFIED` gesetzt. Die API bietet nur diese und
  `SYNTHETIC_PERFORMER`; falls die Kennzeichnung für rein synthetische
  Bilder anders zu handhaben ist, vor dem Rollout bei Pinterest nachfragen.

**Takt:** nicht alle 55 Pins auf einmal. Start mit zehn Pins, danach drei bis
fünf pro Tag bis alle Hauptpins liegen. Anschließend zwei bis drei Pins pro
Woche mit überarbeitetem Text oder Karussell aus vorhandenen Motiven. Pins, die
in den Pinterest-Analytics oder in Umami nicht ziehen, werden nicht einfach
neu gepostet, sondern mit anderem Titel beziehungsweise anderem Linkziel
getestet.

**Messung:** Pinterest Analytics liefert Impressionen, Saves und Klicks pro
Pin; Umami zeigt Referrer `pinterest.com` und die UTM-Parameter; die
Search Console zeigt, ob die Cluster-Seiten durch Pinterest-Besuche und
Saves an Sichtbarkeit gewinnen. Wöchentlich vergleichen, nicht täglich.

## Technische Umsetzung (nach Freigabe)

1. **Manifest im Build:** eine kleine Route `src/pages/pinterest-pins.json.ts`
   schreibt `dist/pinterest-pins.json` mit `titel`, `codex_titel`,
   `codex_einleitung`, `recipeImageAlt()`, kanonischem Pfad, Board-Slug und
   Bilddatei. Sie nutzt `allRecipes`, `landingPages` und `recipePath()` aus
   `src/lib/`. Endpunkte stehen nicht in der Sitemap; die Website selbst lädt
   die Datei nicht.
2. **Packer/Sender:** `scripts/pinterest-pins.mjs` liest das Manifest, holt die
   Board-IDs über `GET /v5/boards`, wandelt das Bild mit `sharp` in JPEG um und
   sendet `POST /v5/pins` mit `image_base64`. Vor dem Senden prüft das Skript
   Längen, absolute URLs, Board-Zuordnung und ob ein Link auf dem Board bereits
   vorhanden ist (`GET /boards/{board_id}/pins`). Damit braucht kein
   zusätzlicher State-File gepflegt zu werden.
3. **Auth und CI:** GitHub Actions mit `workflow_dispatch` plus Zeitplan.
   Secrets: `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET`,
   `PINTEREST_REFRESH_TOKEN`, Board-IDs als Konfiguration im Skript oder
   ebenfalls als Secret. Token vor Ablauf erneuern; `refresh_token` spätestens
   alle 60 Tage verwenden. Ein `--dry-run` schickt die Anfragen an
   `https://api-sandbox.pinterest.com/v5/`.
4. **Limit pro Lauf:** ein Workflow-Lauf veröffentlicht höchstens die
   konfigurierte Tagesmenge (anfangs 3). Fehler führen zu einem roten Job,
   nicht zu einem stillen Teilabbruch.
5. **Keine Datenänderung nötig:** Titel, Beschreibung, Bild, Link und Board
   entstehen aus vorhandenen Feldern. Sollte später eine explizite Boardlib
   nötig sein, gehört sie in eine eigene JSON-Datei neben
   `Einstiegsseiten.json`, nicht in Template-Literale.

## Rollout

| Phase | Inhalt | Fertig, wenn … |
| --- | --- | --- |
| 0 | Business-Konto, App registriert, Trial genehmigt, 2FA aktiv | App-ID und Secret liegen in GitHub Secrets, Sandbox-Aufruf funktioniert |
| 1 | Standard access beantragt, Demo-Video mit OAuth-Flow | Echte Pins sind außerhalb des Erstellerkontos sichtbar |
| 2 | Manifest, Sender, Dry-Run, Dedupe | Sandbox-Pin mit Rezeptbild, Textfeldern und UTM-Link geprüft |
| 3 | Erste zehn Pins, Danach-Takt wie oben | Keine doppelten Pins, alle Ziele erreichbar, keine 4xx-Fehler |
| 4 | Restliche Pins, Wissen-Board, Messwoche | Pinterest-Analytics und Umami zeigen Klicks; Bericht mit „weitermachen/anpassen" |

Danach: eigene Domain, Website bei Pinterest beanspruchen, Pin-Analytics mit
Umami und GSC abgleichen. Ein Pinterest-Tag auf der Website ist nicht Teil
dieses Konzepts und würde eine eigene datenschutzrechtliche Prüfung erfordern.

## Offene Entscheidungen

* Business-Konto und eigene Domain sind vorhanden beziehungsweise geplant?
* Wird die App auf Standard access gehoben, oder bleibt es beim manuellen Planer?
* Soll `AI_MODIFIED` gesetzt werden?
* Werden die Boards so wie oben vorgeschlagen angelegt?
* Wird der Versand selbst gebaut oder ein Drittanbieter-Tool eingesetzt?
  Letzteres ersetzt weder App-Freigabe noch Datenpflege und ist hier nicht
  veranschlagt.

## Quellen (aufgerufen am 24.11.2026)

* <https://developers.pinterest.com/docs/getting-started/>
* <https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/>
* <https://developers.pinterest.com/docs/key-concepts/access-tiers/>
* <https://developers.pinterest.com/docs/reference/rate-limits/>
* <https://github.com/pinterest/api-description/blob/main/v5/openapi.json>
* <https://help.pinterest.com/business/article/schedule-pins>
* <https://help.pinterest.com/business/article/claim-your-website>
