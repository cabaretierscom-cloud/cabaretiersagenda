# Cabaretiers.com

De cabaretagenda van Nederland en België: alle aankomende cabaret- en comedyvoorstellingen, theaters en artiesten op één plek. Van theatercabaret tot stand-up in comedyclubs en cafés, festivals en open mics.

## Hoe het werkt

De agenda heeft geen aparte database. Alle gegevens staan als bestanden in de map `data/`. Bij elke wijziging bouwt de hosting de website opnieuw.

| Bestand | Wat erin staat |
|---|---|
| `data/artiesten.json` | Cabaretiers en comedians |
| `data/theaters.json` | Theaters, comedyclubs, cafés en festivalterreinen |
| `data/voorstellingen.json` | Voorstellingen (programma's) en wie erin speelt |
| `data/speeldata.json` | Elke avond dat een voorstelling ergens speelt, met de bron |

Elk item heeft een vaste `id` van kleine letters en streepjes, zoals `claudia-de-breij`. Andere bestanden verwijzen daarnaar. Die id wordt ook het webadres: `/artiesten/claudia-de-breij/`.

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
