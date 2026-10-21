# Cabaretiers.com

Cabaret- en comedyagenda voor Nederland en België. Statische site, gebouwd door een eigen Node-script zonder dependencies. De eigenaar is geen ontwikkelaar: leg wijzigingen in gewone taal uit en schrijf in het Nederlands (copy, commitberichten, documentatie).

## Structuur

- `data/*.json` is de database. Zie README.md voor de velden. `src/data.mjs` valideert alles; breid daar de toegestane waarden uit (genres, statussen, theatersoorten, kleuren) in plaats van ze elders te hardcoden.
- `src/templates.mjs` maakt alle pagina's als strings. HTML-escaping altijd via `esc()`.
- `public/` wordt ongewijzigd naar `dist/` gekopieerd (CSS, JS, fonts).
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
- Bekend, nog niet gedaan: Luxor (Next.js, data in de pagina), DeLaMar, Walhalla, De Meervaart (Phoenix LiveView), PLT, Ticketmatic-zalen (Zaantheater, Zwolse Theaters, Harmonie, MartiniPlaza, Purmaryn, Tilburg, Utrecht). Chassé, Hanzehof, Stadsschouwburg Haarlem en Rijswijkse Schouwburg weigeren bots (403); Toomler heeft een kapot certificaat.

## Controleren

`npm run check` en `npm run build` moeten zonder fouten draaien voor een commit.

## Vormgeving

Affichestijl: kleurvlakken in risografie-inkten (tokens `--riso-*` in `public/style.css`), Big Shoulders Display voor koppen, Instrument Sans voor tekst. Kleur alleen in affiches, artiestkaarten en detailkoppen; de speellijst blijft zwart op wit. Elke artiest heeft een vaste `kleur` uit `KLEUREN` in `src/data.mjs`.
