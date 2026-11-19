// CC De Steiger, Menen (eigen site, uitDB).
// Per categorie een pagina (/nl/events/humor, /nl/events/familie) met per avond een blok: titel (h3),
// artiest (h1, vaak in hoofdletters), datum "19.02.2027", uur "20:15-21:30 u" en de link "Info & tickets".
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";
import { herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const BASIS = "https://www.ccdesteiger.be";
// Humor zegt niet of het cabaret of stand-up is: "comedy" (het neutrale genre, zie herkenGenre).
const CATEGORIEEN = [["humor", "comedy"], ["familie", "kindervoorstellingen"]];
// Geen voorstelling: abonnementen en passen, films.
const GEEN = /vriendenpas|abonnement|\bpas\b|\bfilm\b|movie/i;

export default {
  id: "desteiger",
  naam: "CC De Steiger",
  theaters: [
    { id: "cc-de-steiger-menen", naam: "CC De Steiger", plaats: "Menen", land: "BE", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const out = [];
    for (const [pad, genre] of CATEGORIEEN) {
      const html = await getText(`${BASIS}/nl/events/${pad}`);
      const blokken = html.split('<div class="bg-secondary my-1">').slice(1);
      for (const b of blokken) {
        const titel = decodeEntities(stripTags(b.match(/<h3 class="mb-1">([\s\S]*?)<\/h3>/)?.[1] || "")).trim();
        const kop = decodeEntities(stripTags(b.match(/<h1 class="mb-1">([\s\S]*?)<\/h1>/)?.[1] || "")).trim();
        const d = b.match(/font-size-lg">(\d{2})\.(\d{2})\.(\d{4})</);
        const tijd = b.match(/ml-2">(\d{2}:\d{2})/)?.[1] || null;
        const link = b.match(/href="\s*([^"]*\/nl\/event\/[^"]*?)\s*"/)?.[1];
        if (!kop || !d || !link || GEEN.test(`${kop} ${titel}`)) continue;
        const datum = `${d[3]}-${d[2]}-${d[1]}`;
        if (datum < vandaag) continue;
        const naam = netteNaam(kop);
        const { artiest, titel: t } = titel ? artiestOfTitel(naam, titel) : { artiest: null, titel: naam };
        out.push({
          theater: "cc-de-steiger-menen",
          artiesten: artiest ? [artiest] : [],
          titel: netteHoofdletters(t),
          genre: /oudejaars|eindejaars/i.test(`${kop} ${titel}`) ? "oudejaarsconference" : genre,
          datum,
          tijd,
          status: /uitverkocht|volzet/i.test(b) ? "uitverkocht" : /geannuleerd|afgelast/i.test(b) ? "geannuleerd" : "gepland",
          soort: herkenSoort(titel, kop),
          bron: link,
        });
      }
      log(`${pad}: ${blokken.length} blokken`);
    }
    return out;
  },
};
