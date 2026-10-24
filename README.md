# Cabaretiers.com

De theateragenda van Nederland en België: alle aankomende cabaret- en comedyvoorstellingen, theaters en artiesten op één plek. Van theatercabaret tot stand-up in comedyclubs en cafés, festivals en open mics.

## Hoe het werkt

De agenda heeft geen aparte database. Alle gegevens staan als bestanden in de map `data/`. Bij elke wijziging bouwt de hosting de website opnieuw.

| Bestand | Wat erin staat |
|---|---|
| `data/artiesten.json` | Cabaretiers en comedians |
| `data/theaters.json` | Theaters, comedyclubs, cafés en festivalterreinen |
| `data/voorstellingen.json` | Voorstellingen (programma's) en wie erin speelt |
| `data/speeldata.json` | Elke avond dat een voorstelling ergens speelt, met de bron |
| `data/festivals.json` | Cabaretfestivals: naam, plaats, website, en welke artiesten (`artiesten`) of titels (`titels`) erbij horen |

Elk item heeft een vaste `id` van kleine letters en streepjes, zoals `claudia-de-breij`. Andere bestanden verwijzen daarnaar. Die id wordt ook het webadres: `/artiesten/claudia-de-breij/`.

Een artiest kan optioneel `"vorm": "groep"` of `"vorm": "persoon"` hebben. Dat bepaalt of zoekmachines de artiest als groep of als persoon zien. Zonder `vorm` raadt de site het aan de naam (bijvoorbeeld "&" of "en" betekent een duo).

Een solo-artiest kan `"geslacht": "man"` of `"geslacht": "vrouw"` hebben, altijd met `"geslachtBron"` (een link naar de bron). Dat bepaalt wie er op /alle-cabaretiers/mannen/ en /alle-cabaretiers/vrouwen/ staat. `npm run geslacht` zoekt het op in Wikidata voor artiesten met een Wikipedia-artikel over hun werk als cabaretier of comedian. Nooit raden op naam; vul het alleen met de hand in als er een bron voor is.

## Foto's van artiesten

`npm run fotos` zoekt rechtenvrije foto's: via het Wikipedia-artikel van de artiest (alleen als dat over cabaret of comedy gaat) naar de hoofdafbeelding op Wikidata, en dan de licentie op Wikimedia Commons. Alleen CC0, publiek domein, CC BY en CC BY-SA worden gebruikt. De foto komt in `public/fotos/`, en het veld `foto` in `data/artiesten.json` bewaart maker, licentie en bron; die staan als naamsvermelding onder de foto. Bekijk nieuwe foto's altijd zelf: zet `"foto": false` bij een artiest als de foto niet klopt, dan zoekt het script er nooit meer een. Elke foto heeft een `alt`-tekst (wat er op de foto te zien is, in het Nederlands). Het script vult die met de beschrijving van Commons of met "Foto van <naam>"; verbeter die met de hand. `npm run fotos -- --aanvullen` haalt beschrijving, datum en afmetingen opnieuw op voor bestaande foto's.

## Recensies

Een voorstelling kan `recensies` hebben: per krant of tijdschrift het `medium`, de `sterren` (1 tot en met 5, of `null` als de krant geen sterren geeft), een `citaat` en de `bron`, de theaterpagina waar de recensie staat. Ze komen op de voorstellingspagina onder "Recensies van …".

Het ophaalscript zoekt ze vanzelf op elke voorstellingspagina die het bezoekt (`ophalen/lib/recensies.mjs`). Noemen theaters verschillende sterren voor dezelfde krant, dan wint wat de meeste theaterpagina's zeggen. Een citaat "over" een vorige voorstelling wordt overgeslagen. Klopt een recensie niet, haal hem dan weg uit `data/voorstellingen.json`. Komt hij bij het volgende ophalen terug, meld het dan, zodat de herkenner aangepast kan worden.

## Festivals

Een festival heeft zelf geen speeldata. De site zoekt ze erbij: alle voorstellingen van de artiesten in `artiesten` (bijvoorbeeld de "artiest" Cameretten) en alle voorstellingen waarvan de titel een van de `titels` bevat. Elk festival krijgt een pagina op `/festivals/<id>/`. Een festival zonder aankomende speeldata staat onderaan het overzicht onder "Nog geen speeldata bekend".

## Gestructureerde gegevens

Elke pagina bevat schema.org-gegevens (JSON-LD) voor zoekmachines: de organisatie en website, een kruimelpad, en per paginasoort de inhoud: voorstellingen als `TheaterEvent`/`ComedyEvent` met zaal, artiest en kaartlink, artiesten als `Person`/`PerformingGroup`, zalen als `PerformingArtsTheater`/`ComedyClub`, voorstellingen als `EventSeries` en overzichten als `ItemList`. Dit wordt gemaakt in `paginaLd()` in `src/templates.mjs`.

### Een speeldatum

```json
{
  "voorstelling": "jochem-myjer-net-alsof",
  "theater": "carre",
  "datum": "2026-11-02",
  "tijd": "20:15",
  "status": "gepland",
  "soort": null,
  "bron": "https://carre.nl/voorstelling/jochem-myjer-net-alsof",
  "opgehaald": "2026-10-21"
}
```

- `tijd`: `null` als die nog niet bekend is.
- `status`: `gepland`, `uitverkocht`, `onzeker` (bronnen spreken elkaar tegen), `verplaatst` of `geannuleerd`.
- `soort`: `null`, `try-out`, `première`, `reprise`, `dernière` of `extra voorstelling`.
- `opmerking` (optioneel): uitleg, bijvoorbeeld waarom een datum onzeker is.

Speeldata in het verleden blijven in het bestand staan als archief, maar komen niet op de site.

## Speellijsten ophalen

De map `ophalen/` haalt de speellijsten rechtstreeks bij theaters en comedyclubs op.

```sh
npm run ophalen               # alle bronnen ophalen (duurt even: sites vragen pauzes)
npm run ophalen -- carre spot-groningen   # alleen deze bronnen
npm run samenvoegen           # vondsten samenvoegen in data/
```

- `ophalen/bronnen/` heeft één klein bestand per bron (meestal één theater).
- `ophalen/platforms/` bevat scripts voor websiteplatforms die veel theaters delen, zoals Peppered en The Events Calendar. Een nieuwe zaal op zo'n platform toevoegen kost een paar regels.
- De uitkomst per bron staat in `data/bronnen/<bron>.json`. Mislukt een bron, dan blijft de vorige uitkomst staan.
- Bij het samenvoegen vervangt elke bron zijn eigen vorige vondsten, zodat afgelaste voorstellingen verdwijnen. Nieuwe artiesten, zalen en voorstellingen worden automatisch aangemaakt. Twijfelgevallen komen in `data/te-controleren.json`.
- Het ophalen is beleefd: een herkenbare naam (CabaretiersBot), robots.txt wordt gevolgd, inclusief de gevraagde pauze tussen verzoeken.

Op GitHub draait dit elke nacht automatisch (`.github/workflows/bijwerken.yml`). Je kunt het ook met de hand starten via het tabblad **Actions → Agenda bijwerken → Run workflow**.

### Wat je zelf kunt aanvullen

- **Land van een artiest:** nieuwe artiesten krijgen `"land": null`. Vul `"NL"` of `"BE"` in als je het weet.
- **Andere schrijfwijze:** staat dezelfde artiest er twee keer in, zet de schrijfwijze die weg moet dan in `data/aliassen.json`, met de goede naam erachter:

  ```json
  "Ayoub": ["Ayoub Kharkhach"],
  "Najib & Roué": ["Najib Amhali", "Roué Verveer"]
  ```

  Bij de volgende keer samenvoegen worden de artiesten en hun voorstellingen samengevoegd. Een duo mag naar twee artiesten verwijzen. Tikfouten van één letter in een lange naam ("Lisa Osterman") en toevoegingen als "(reprise)" worden al vanzelf herkend.
- **Opruimen:** artiesten en voorstellingen zonder enige speeldatum worden bij het samenvoegen verwijderd. Een artiest waarbij je zelf een land of `ookBekendAls` hebt ingevuld, blijft altijd staan.

## Zelf draaien

Je hebt [Node.js](https://nodejs.org) 20 of nieuwer nodig. Er zijn geen andere pakketten nodig.

```sh
npm run check     # gegevens controleren op fouten
npm run build     # website bouwen naar de map dist/
npm run preview   # gebouwde site bekijken op http://localhost:4321
```

`npm run build` stopt met een duidelijke foutmelding als een verwijzing niet klopt, bijvoorbeeld een speeldatum bij een theater dat niet in `theaters.json` staat.

## Online zetten

Netlify en Vercel lezen de instellingen uit `netlify.toml` en `vercel.json`: bouwopdracht `npm run build`, map `dist`. Koppel de repository in een van beide, en daarna je domein cabaretiers.com.

De site wordt op de dag van bouwen gefilterd op aankomende voorstellingen. Laat hem daarom elke nacht opnieuw bouwen; dat gebeurt vanzelf zodra de ophaalscripts dagelijks nieuwe data opslaan.

## Lettertypes

Big Shoulders Display en Instrument Sans worden door de site zelf aangeboden (`public/fonts/`), niet via Google. Beide vallen onder de SIL Open Font License; de licenties staan ernaast.
