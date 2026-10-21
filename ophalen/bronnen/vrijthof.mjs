// Theater aan het Vrijthof (en AINSI), Maastricht.
// De overzichtspagina /voorstellingen linkt naar elke voorstelling, met het genre in het
// adres (/voorstellingen/cabaret/<voorstelling>). De voorstellingspagina heeft de eerste
// speeldatum als schema.org-evenement en links naar de overige data (.../dd-mm-jjjj-uu-mm).
import { getText } from "../lib/http.mjs";
import { jsonLd, isEvent, stripTags, decodeEntities } from "../lib/html.mjs";
import { lokaleDatumTijd, herkenSoort, netteNaam, netteHoofdletters } from "../lib/normaliseer.mjs";

const BASIS = "https://www.theateraanhetvrijthof.nl";
const GENRES = { cabaret: "cabaret" };

export default {
  id: "vrijthof",
  naam: "Theater aan het Vrijthof",
  theaters: [
    { id: "theater-aan-het-vrijthof", naam: "Theater aan het Vrijthof", plaats: "Maastricht", land: "NL", soort: "theater", website: BASIS },
    { id: "ainsi-maastricht", naam: "AINSI", plaats: "Maastricht", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const overzicht = await getText(`${BASIS}/voorstellingen`);
    const shows = new Map();
    const re = /href="(?:https:\/\/www\.theateraanhetvrijthof\.nl)?\/voorstellingen\/([a-z-]+)\/([a-z0-9-]+)"[^>]*>([^<]*)</g;
    for (const [, genre, naam, tekst] of overzicht.matchAll(re)) {
      if (GENRES[genre] && !/^\d\d-\d\d-\d{4}/.test(naam)) shows.set(`${genre}/${naam}`, { genre: GENRES[genre], tekst: decodeEntities(tekst) });
    }
    // Alleen voorstellingen waarvan het overzicht geen uitsluitend oude data toont, zijn de moeite van het openen waard.
    log(`${shows.size} cabaretvoorstellingen in het overzicht (inclusief archief)`);

    const out = [];
    for (const [pad, show] of shows) {
      let html;
      try { html = await getText(`${BASIS}/voorstellingen/${pad}`); } catch (e) { log(`overgeslagen: ${pad} (${e.message})`); continue; }
      const ev = jsonLd(html).find(isEvent);
      if (!ev) continue;
      // "Niks Persoonlijks - Alex Ploeg": eerst de titel, dan de artiest.
      const naam = stripTags(ev.name || show.tekst);
      const i = naam.lastIndexOf(" - ");
      const titel = netteHoofdletters(i > 0 ? naam.slice(0, i).trim() : naam);
      const artiest = i > 0 ? netteNaam(naam.slice(i + 3).trim()) : null;
      const locatie = stripTags(ev.location?.name || "");
      const theater = /ainsi/i.test(locatie) ? "ainsi-maastricht" : "theater-aan-het-vrijthof";
      const bron = `${BASIS}/voorstellingen/${pad}`;
      const eventInfo = stripTags(html.match(/<div class="event-info">([\s\S]*?)<script/)?.[1] || "");

      const data = new Map();
      const hoofd = lokaleDatumTijd(ev.startDate);
      if (hoofd) data.set(`${hoofd.datum} ${hoofd.tijd}`, { ...hoofd, soort: herkenSoort(eventInfo) });
      const linkRe = new RegExp(`/voorstellingen/${pad}/(\\d\\d)-(\\d\\d)-(\\d{4})-(\\d\\d)-(\\d\\d)`, "g");
      for (const [, d, m, j, u, min] of html.matchAll(linkRe)) {
        const w = { datum: `${j}-${m}-${d}`, tijd: `${u}:${min}` };
        if (!data.has(`${w.datum} ${w.tijd}`)) data.set(`${w.datum} ${w.tijd}`, { ...w, soort: null });
      }
      for (const w of data.values()) {
        if (w.datum < vandaag) continue;
        out.push({ theater, artiesten: artiest ? [artiest] : [], titel, genre: show.genre, datum: w.datum, tijd: w.tijd, status: "gepland", soort: w.soort, bron });
      }
    }
    return out;
  },
};
