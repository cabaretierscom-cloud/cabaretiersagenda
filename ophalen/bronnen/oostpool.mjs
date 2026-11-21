// Oostpool (theatergezelschap, Arnhem), oostpool.nl. Per voorstelling een pagina /voorstellingen/<voorstelling>/
// met onder "Speeldata & tickets" per avond een <article class="playlist-item">: datum zonder jaar
// ("wo. 3 februari"), aanvang, productie, locatie, plaats, bijzonderheden (try-out, première, uitverkocht) en
// een bestelknop (bestellen.oostpool.nl). Het jaar volgt uit de weekdag. Oostpool maakt toneel: alleen de
// voorstellingen in VOORSTELLINGEN. Werkt als een speellijst (soort "speellijst").
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";
import { herkenSoort } from "../lib/normaliseer.mjs";

const BASIS = "https://www.oostpool.nl/voorstellingen/";
const VOORSTELLINGEN = [
  // Eigenaar van Cabaretiers.com, november 2026. Genre: toneel (voorstelling-correcties.json).
  { pad: "browser-history-x/", artiest: "Hulst & Tarenskeen", titel: "Millennial II Browser History X", genre: "toneel" },
];
const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const WEEKDAGEN = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const PLAATSEN = { "Den Bosch": "'s-Hertogenbosch" };
const tekst = (s) => decodeEntities(stripTags(s || "")).replace(/[\s ]+/g, " ").trim();

// "wo. 3 februari": het eerste jaar vanaf dit jaar waarin die dag op die weekdag valt.
function leesDatum(s, vandaag) {
  const [, wd, dag, maand] = s.toLowerCase().match(/^([a-z]{2})\.?\s+(\d{1,2})\s+([a-z]+)$/) || [];
  const m = MAANDEN.indexOf(maand);
  if (m < 0) return null;
  const jaar = +vandaag.slice(0, 4);
  for (const j of [jaar, jaar + 1, jaar - 1]) {
    if (WEEKDAGEN[new Date(Date.UTC(j, m, +dag)).getUTCDay()] === wd) return `${j}-${String(m + 1).padStart(2, "0")}-${dag.padStart(2, "0")}`;
  }
  return null;
}

export default {
  id: "oostpool",
  naam: "Oostpool",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const out = [];
    for (const v of VOORSTELLINGEN) {
      const url = BASIS + v.pad;
      const html = await getText(url);
      let n = 0;
      for (const [, rij] of html.matchAll(/<article class="playlist__item[^"]*">([\s\S]*?)<\/article>/g)) {
        const cel = (c) => tekst(rij.match(new RegExp(`playlist-item__col--${c}[^"]*"[^>]*>([\\s\\S]*?)<\\/(time|p|h3)>`))?.[1]);
        const datum = leesDatum(cel("date"), vandaag);
        if (!datum || datum < vandaag) continue;
        const tijd = cel("time").match(/^(\d{1,2})[:.](\d{2})$/);
        const zaal = cel("location"), plaats = cel("city"), bijz = cel("special");
        if (!zaal || !plaats) continue;
        const link = decodeEntities(rij.match(/class="playlist-item__order"/) ? rij.match(/href="([^"]+)"/)?.[1] || "" : "");
        out.push({
          theater: { zoeken: true, naam: zaal.replace(/^HNT - /, ""), plaats: PLAATSEN[plaats] || plaats, land: "NL" },
          artiesten: [v.artiest],
          titel: v.titel,
          genre: v.genre,
          datum,
          tijd: tijd ? `${tijd[1].padStart(2, "0")}:${tijd[2]}` : null,
          status: /uitverkocht/i.test(bijz) ? "uitverkocht" : /geannuleerd|afgelast/i.test(bijz) ? "geannuleerd" : "gepland",
          soort: herkenSoort(bijz),
          bron: /^https?:\/\//.test(link) ? link : url,
        });
        n++;
      }
      log(`${v.titel}: ${n} voorstellingen vanaf vandaag`);
    }
    return out;
  },
};
