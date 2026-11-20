// Friendly Fire (concertpromotor, friendlyfire.nl). Per artiest een pagina /artiesten/detail/<artiest>/ met
// onder "Shows" per avond een <article class="m-eventList__item">: maand en jaar ("jan 2027"), dag, plaats in
// <strong> met de zaal erachter ("Theater de Purmaryn - Grote Zaal"), de naam van de avond ("Laat Maar -
// Theatertour (Try-out)") en een kaartknop. Geen tijden. Friendly Fire doet vooral muziek: alleen de artiesten in
// ARTIESTEN. Werkt als een speellijst (soort "speellijst").
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";
import { herkenSoort } from "../lib/normaliseer.mjs";

const BASIS = "https://friendlyfire.nl/artiesten/detail/";
const ARTIESTEN = [
  // Eigenaar van Cabaretiers.com, november 2026. Genre: muzikaal (voorstelling-correcties.json).
  { pad: "bettina-holwerda/", naam: "Bettina Holwerda", titel: "Laat Maar" },
];
const MAANDEN = { jan: 1, feb: 2, maa: 3, mrt: 3, apr: 4, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12 };
const tekst = (s) => decodeEntities(stripTags(s || "")).replace(/\s+/g, " ").trim();

export default {
  id: "friendlyfire",
  naam: "Friendly Fire",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const out = [];
    for (const a of ARTIESTEN) {
      const url = BASIS + a.pad;
      const html = await getText(url);
      let n = 0;
      for (const [, blok] of html.matchAll(/<article class="m-eventList__item">([\s\S]*?)<\/article>/g)) {
        const [, mnd, jaar] = tekst(blok.match(/m-eventList__month">([\s\S]*?)<\/div>/)?.[1]).toLowerCase().match(/^([a-z]{3})\w* (\d{4})$/) || [];
        const dag = tekst(blok.match(/m-eventList__day">([\s\S]*?)<\/div>/)?.[1]);
        if (!MAANDEN[mnd] || !/^\d{1,2}$/.test(dag)) continue;
        const datum = `${jaar}-${String(MAANDEN[mnd]).padStart(2, "0")}-${dag.padStart(2, "0")}`;
        if (datum < vandaag) continue;
        const kop = blok.match(/m-eventList__venue">([\s\S]*?)<\/h2>/)?.[1] || "";
        const plaats = tekst(kop.match(/<strong>([\s\S]*?)<\/strong>/)?.[1]);
        // "Theater de Purmaryn - Grote Zaal": de zaal binnen het theater hoort niet bij de naam.
        const zaal = tekst(kop.replace(/<strong>[\s\S]*?<\/strong>/, "")).replace(/\s+-\s+(grote|kleine|midden|theater)zaal$|\s+-\s+(grote|kleine) zaal$/i, "").trim();
        const avond = tekst(blok.match(/m-eventList__event">([\s\S]*?)<\/h3>/)?.[1]);
        const link = decodeEntities(blok.match(/href="([^"]+)"/)?.[1] || "");
        if (!plaats || !zaal) continue;
        out.push({
          theater: { zoeken: true, naam: zaal, plaats: plaats.replace(/^Den Bosch$/, "'s-Hertogenbosch"), land: "NL" },
          artiesten: [a.naam],
          titel: a.titel,
          genre: "cabaret",
          datum,
          tijd: null,
          status: /uitverkocht|sold out/i.test(blok) ? "uitverkocht" : /geannuleerd|afgelast|cancel/i.test(blok) ? "geannuleerd" : "gepland",
          soort: herkenSoort(avond),
          bron: /^https?:\/\//.test(link) ? link : url,
        });
        n++;
      }
      log(`${a.naam}: ${n} voorstellingen vanaf vandaag`);
    }
    return out;
  },
};
