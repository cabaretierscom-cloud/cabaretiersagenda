// Bos Theaterproducties (impresariaat, bostheaterproducties.nl). Elke productie heeft een eigen pagina met een
// speellijst (#playlist-table): per maand een kop ("december 2026") en een tabel met per avond datum zonder
// jaar ("Di. 1 dec"), tijd, titel, zaal, plaats in hoofdletters, soort (Try-out, Première) en een kaartknop
// (class button--sold is uitverkocht). Het jaar komt uit de maandkop.
// Alleen de producties in PRODUCTIES; andere voorstellingen van het bureau (toneel, muziek) blijven weg.
// Werkt als een speellijst (soort "speellijst").
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";
import { herkenSoort, netteNaam } from "../lib/normaliseer.mjs";

const BASIS = "https://www.bostheaterproducties.nl/producties/";
const PRODUCTIES = [
  // Eigenaar van Cabaretiers.com, november 2026: een oudejaarsconference.
  { pad: "de-grote-oudejaars-kwis-2026/", artiest: "Joep van Deudekom & Rob Urgert", titel: "De Grote Oudejaars Kwis 2026", genre: "oudejaarsconference" },
];
const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const tekst = (s) => decodeEntities(stripTags(s || "")).replace(/\s+/g, " ").trim();

export default {
  id: "bos",
  naam: "Bos Theaterproducties",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const out = [];
    for (const p of PRODUCTIES) {
      const url = BASIS + p.pad;
      const html = await getText(url);
      let n = 0;
      // Per maandblok de kop en de tabelrijen (de mobiele weergave erboven is dezelfde lijst nog een keer).
      for (const blok of html.split(/<div class="playlists">/).slice(1)) {
        const [, maand, jaar] = tekst(blok.match(/<h4[^>]*>([\s\S]*?)<\/h4>/)?.[1]).toLowerCase().match(/^(\p{L}+) (\d{4})$/u) || [];
        const m = MAANDEN.indexOf(maand);
        if (m < 0) continue;
        for (const rij of blok.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
          const cel = (c) => tekst(rij[1].match(new RegExp(`class="row-${c}"[^>]*>([\\s\\S]*?)<\\/td>`))?.[1]);
          const dag = cel("date").match(/\b(\d{1,2})\b/)?.[1];
          if (!dag) continue;
          const datum = `${jaar}-${String(m + 1).padStart(2, "0")}-${dag.padStart(2, "0")}`;
          if (datum < vandaag) continue;
          const tijd = cel("time").match(/^(\d{1,2})[:.](\d{2})$/);
          const link = rij[1].match(/href="?([^"\s>]+)/)?.[1] || "";
          const knop = rij[1].match(/class="button ([^"]*)"/)?.[1] || "";
          out.push({
            theater: { zoeken: true, naam: netteNaam(cel("theater")), plaats: netteNaam(cel("city")).replace(/^Den Bosch$/, "'s-Hertogenbosch"), land: "NL" },
            artiesten: [p.artiest],
            titel: p.titel,
            genre: p.genre,
            datum,
            tijd: tijd ? `${tijd[1].padStart(2, "0")}:${tijd[2]}` : null,
            status: /button--sold/.test(knop) ? "uitverkocht" : /geannuleerd|afgelast/i.test(rij[1]) ? "geannuleerd" : "gepland",
            soort: herkenSoort(cel("type")),
            bron: /^https?:\/\//.test(link) ? decodeEntities(link) : url,
          });
          n++;
        }
      }
      log(`${p.titel}: ${n} voorstellingen vanaf vandaag`);
    }
    return out;
  },
};
