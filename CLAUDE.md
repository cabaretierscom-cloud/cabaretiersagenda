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

## Controleren

`npm run check` en `npm run build` moeten zonder fouten draaien voor een commit.

## Vormgeving

Affichestijl: kleurvlakken in risografie-inkten (tokens `--riso-*` in `public/style.css`), Big Shoulders Display voor koppen, Instrument Sans voor tekst. Kleur alleen in affiches, artiestkaarten en detailkoppen; de speellijst blijft zwart op wit. Elke artiest heeft een vaste `kleur` uit `KLEUREN` in `src/data.mjs`.
