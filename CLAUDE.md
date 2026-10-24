# Cabaretiers.com

Cabaret- en comedyagenda voor Nederland en België. Statische site, gebouwd door een eigen Node-script zonder dependencies. De eigenaar is geen ontwikkelaar: leg wijzigingen in gewone taal uit en schrijf in het Nederlands (copy, commitberichten, documentatie).

## Structuur

- `data/*.json` is de database. Zie README.md voor de velden. `src/data.mjs` valideert alles; breid daar de toegestane waarden uit (genres, statussen, theatersoorten, kleuren) in plaats van ze elders te hardcoden.
- `src/templates.mjs` maakt alle pagina's als strings. HTML-escaping altijd via `esc()`.
- `public/` wordt ongewijzigd naar `dist/` gekopieerd (CSS, JS, fonts).
- Webadressen: `/agenda/oktober-2026/` (`maandId`), `/plaatsen/<plaats>/`, `/theaters/<theater-id>/`, `/festivals/<festival-id>/` (`data/festivals.json`), `/alle-cabaretiers/` met `/mannen/` en `/vrouwen/` (SEO-pagina's met FAQ, niet in het menu; gelinkt vanuit footer, /artiesten/ en artiestpagina's; geslacht uit Wikidata via `npm run geslacht`), `/artiesten/<artiest-id>/` en per voorstelling met eigen titel `/artiesten/<artiest-id>/<titel-slug>/` (`voorstellingPad` in `src/templates.mjs`).
- `build.mjs` toont alleen speeldata vanaf vandaag (Europe/Amsterdam). `BUILD_DATE=JJJJ-MM-DD` overschrijft dat.
- `public/agenda.js` filtert de server-gerenderde lijst; de pagina moet zonder JS volledig bruikbaar blijven.

## Gegevens

- Elke speeldatum heeft een `bron`-URL. Voeg nooit data toe zonder bron, en verzin geen speeldata.
- Een speeldatum is uniek op voorstelling + theater + datum + tijd.
- Bij tegenstrijdige bronnen: `status: "onzeker"` met een `opmerking`.

## Ophalen

- `ophalen/run.mjs` draait bronnen uit `ophalen/bronnen/` gelijktijdig; per host één verzoek tegelijk met pauze (`ophalen/lib/http.mjs`). Respecteer robots.txt en Crawl-delay; omzeil nooit een blokkade (403, captcha). Cookies volgen bij een doorverwijzing is gewoon browsergedrag en mag.
- In deze cloudomgeving heeft Node de proxy nodig: `NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt NODE_USE_ENV_PROXY=1 npm run ophalen`. Op GitHub Actions is dat niet nodig.
- Een bron levert records `{ theater, artiesten: [namen], titel, genre, datum, tijd, status, soort, bron }`. `theater` is een id uit de `theaters` van de bron, of een object voor een nieuwe zaal.
- Neem alleen cabaret en comedy op (`herkenGenre` in `ophalen/lib/normaliseer.mjs`). Bij twijfel liever weglaten.
- `ophalen/samenvoegen.mjs` vervangt per bron de vorige vondsten vanaf de ophaaldatum en maakt artiesten, zalen en voorstellingen aan. Artiesten worden op `slug(naam)` en `ookBekendAls` herkend.
- Krijgt een site het druk (503/429), dan wacht `get()` en probeert opnieuw. Zet voor zo'n site in de bron een langere pauze met `stelPauzeIn(host, ms)` (zie `luxor.mjs`).
- Next.js-sites: `nextFlightText()` en `jsonObjectsWith()` in `ophalen/lib/html.mjs` halen de ingebakken gegevens uit de pagina (zie `luxor.mjs`).
- Platforms: Peppered, The Events Calendar en Cre8ion (Utrecht, Tilburg) staan in `ophalen/platforms/`. Voor sites met JSON-LD-evenementen per voorstellingspagina is er `jsonld.mjs`: per site alleen sitemap, genrelabel en eventueel artiest/titel opgeven (zie `schie.mjs`, `hof88.mjs`). `lib/artiesten.mjs` herkent bekende artiesten om artiest en titel uit elkaar te halen. `postForm()` in `lib/http.mjs` verstuurt een formulier zoals de site zelf doet (De Harmonie).
- Bekend, nog niet gedaan: De Meervaart (Phoenix LiveView), PLT, Boom Chicago. MartiniPlaza en de Tilburgse voorstellingen met meerdere datums laden hun datums via /mvc/, wat robots.txt verbiedt; die blijven weg. Chassé, Hanzehof, Stadsschouwburg Haarlem, Rijswijkse Schouwburg, Agora Lelystad en Deventer Schouwburg weigeren bots (403); Toomler heeft een kapot certificaat. Peppered-sites met Bunny Shield (cookie `bunny_shield_id_…` bij het eerste bezoek: De Maagd, Isala, Diligentia & Pepijn, De Kom) blokkeren na een paar verzoeken; die blijven weg. Flint en Theater De Vest laden hun datums met JavaScript uit een eigen API; nog niet gedaan. Zoetermeer verbiedt alles in robots.txt.

## Publiceren

- `.github/workflows/bijwerken.yml` zet de site elke nacht en bij elke push op `main` via SFTP op Cloud86 (Plesk), in de map `cabaretiers.com/` (niet `httpdocs/`: die hoort bij een ander domein op hetzelfde pakket). Eerst controleert hij met een testbestand of die map echt www.cabaretiers.com is. Geheimen: `CLOUD86_HOST`, `CLOUD86_USER`, `CLOUD86_PASSWORD`. `public/.htaccess` regelt 404, www en browsercache; `build.mjs` voegt daar doorverwijzingen (301) aan toe van oude WordPress-adressen (`data/oude-adressen.json`) en van `/<artiest-id>/` naar `/artiesten/<artiest-id>/`.

## Controleren

`npm run check` en `npm run build` moeten zonder fouten draaien voor een commit.

## Vormgeving

Logo: zie `ontwerp/logo/README.md` (oranje beeldmerk, punt op de i, roze .com).

Affichestijl: kleurvlakken in risografie-inkten (tokens `--riso-*` in `public/style.css`), Big Shoulders Display voor koppen, Instrument Sans voor tekst. Kleur alleen in affiches, artiestkaarten en detailkoppen; de speellijst blijft zwart op wit. Elke artiest heeft een vaste `kleur` uit `KLEUREN` in `src/data.mjs`.
