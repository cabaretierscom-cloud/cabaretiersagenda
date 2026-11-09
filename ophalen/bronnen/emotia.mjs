// Emotia, Erpe-Mere (eigen site). /activiteiten heeft filters per genre en doelgroep (?taxonomie=7 is Comedy,
// ?taxonomie=10 Kinderen) en bladert met &page=N. Per avond: link, datum zonder jaar ("15.12") en uur,
// artiest (titel) en voorstelling (ondertitel). Het jaar: de eerstvolgende keer dat die datum valt.
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";
import { herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const BASIS = "https://www.emotia.be";
const FILTERS = [["7", "comedy"], ["10", "kindervoorstellingen"]];
// Geen voorstelling: films, workshops en dergelijke (bij Kinderen staan ook die).
const GEEN = /\bfilm\b|cin[eé]motia|workshop|knutsel|voorlees|kamp\b|cursus|school/i;

export default {
  id: "emotia",
  naam: "Emotia",
  theaters: [
    { id: "emotia-erpe-mere", naam: "Emotia", plaats: "Erpe-Mere", land: "BE", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const [jaar, maand] = vandaag.split("-").map(Number);
    const out = [];
    for (const [tax, genre] of FILTERS) {
      let n = 0;
      for (let p = 0; p <= 10; p++) {
        const html = await getText(`${BASIS}/activiteiten?taxonomie=${tax}${p ? `&page=${p}` : ""}`);
        const items = html.split(/<li><a href=/).slice(1).filter((b) => b.includes("partial-item-container"));
        if (!items.length) break;
        n += items.length;
        for (const b of items) {
          const href = b.match(/^"?([^" >]+)/)?.[1];
          const d = b.match(/date-part>(\d{2})\.(\d{2})<\/span>\s*<span class=hours-part>(\d{2}:\d{2})?/);
          const kop = decodeEntities(stripTags(b.match(/<h2 class=title><span>([\s\S]*?)<\/span>/)?.[1] || "")).trim();
          const onder = decodeEntities(stripTags(b.match(/sub-title>([\s\S]*?)<\/span>/)?.[1] || "")).trim();
          if (!href || !d || !kop || GEEN.test(`${kop} ${onder}`)) continue;
          const m = Number(d[2]);
          const datum = `${m < maand ? jaar + 1 : jaar}-${d[2]}-${d[1]}`;
          if (datum < vandaag) continue;
          const { artiest, titel } = onder ? artiestOfTitel(netteNaam(kop), onder) : { artiest: null, titel: kop };
          out.push({
            theater: "emotia-erpe-mere",
            artiesten: artiest ? [artiest] : [],
            titel: netteHoofdletters(titel),
            genre: /oudejaars|eindejaars/i.test(`${kop} ${onder}`) ? "oudejaarsconference" : genre,
            datum,
            tijd: d[3] || null,
            status: /uitverkocht|volzet/i.test(b) ? "uitverkocht" : /geannuleerd|afgelast/i.test(b) ? "geannuleerd" : "gepland",
            soort: herkenSoort(kop, onder),
            bron: new URL(href, BASIS).href,
          });
        }
        if (!html.includes(`page=${p + 1}`)) break;
      }
      log(`taxonomie ${tax}: ${n} items`);
    }
    return out;
  },
};
