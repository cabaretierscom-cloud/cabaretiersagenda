// Via Rudolphi Producties (impresariaat en producent, viarudolphi.nl). Elke productie heeft een pagina
// /productie/<productie>/ met onder "Speellijst" een tabel (table.speellijst-table): per rij datum ("07/01/27"),
// tijd met eventueel <strong>Try-out</strong> of Première, zaal, plaats en een kaartknop ("kaarten",
// "laatste kaarten", "uitverkocht"). Het bureau doet vooral toneel, muziek en sprekers: alleen de producties in
// PRODUCTIES. robots.txt staat alles toe. Werkt als een speellijst (soort "speellijst").
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";
import { herkenSoort } from "../lib/normaliseer.mjs";

const BASIS = "https://viarudolphi.nl/productie/";
const PRODUCTIES = [
  // Eigenaar van Cabaretiers.com, november 2026. Genre: toneel (voorstelling-correcties.json).
  { pad: "de-surpriseshow/", artiest: "Nazanin Taheri", titel: "De Surpriseshow", genre: "toneel" },
];
const PLAATSEN = { "Den Bosch": "'s-Hertogenbosch", "Capelle a/d IJssel": "Capelle aan den IJssel" };
const tekst = (s) => decodeEntities(stripTags(s || "")).replace(/\s+/g, " ").trim();

export default {
  id: "viarudolphi",
  naam: "Via Rudolphi Producties",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const out = [];
    for (const p of PRODUCTIES) {
      const url = BASIS + p.pad;
      const html = await getText(url);
      let n = 0;
      for (const [, rij] of html.matchAll(/<tr class="table-row">([\s\S]*?)<\/tr>/g)) {
        const cel = (c) => rij.match(new RegExp(`speellijst-${c}">([\\s\\S]*?)<\\/td>`))?.[1] || "";
        const [, dag, maand, jaar] = tekst(cel("date")).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/) || [];
        if (!dag) continue;
        const datum = `20${jaar}-${maand.padStart(2, "0")}-${dag.padStart(2, "0")}`;
        if (datum < vandaag) continue;
        const tijd = tekst(cel("time")).match(/^(\d{1,2})[:.](\d{2})/);
        const zaal = tekst(cel("location")), plaats = tekst(cel("city"));
        if (!zaal || !plaats) continue;
        const knop = tekst(cel("tickets"));
        const link = decodeEntities(cel("tickets").match(/href="([^"]+)"/)?.[1] || "");
        out.push({
          // "SPOT" in Groningen is bij De Surpriseshow de Machinefabriek (spotgroningen.nl, november 2026).
          theater: { zoeken: true, naam: zaal === "SPOT" && plaats === "Groningen" ? "Machinefabriek" : zaal, plaats: PLAATSEN[plaats] || plaats, land: "NL" },
          artiesten: [p.artiest],
          titel: p.titel,
          genre: p.genre,
          datum,
          tijd: tijd ? `${tijd[1].padStart(2, "0")}:${tijd[2]}` : null,
          status: /uitverkocht/i.test(knop) ? "uitverkocht" : /geannuleerd|afgelast/i.test(rij) ? "geannuleerd" : "gepland",
          soort: herkenSoort(tekst(cel("time").match(/<strong>([\s\S]*?)<\/strong>/)?.[1])),
          bron: /^https?:\/\//.test(link) ? link : url,
        });
        n++;
      }
      log(`${p.titel}: ${n} voorstellingen vanaf vandaag`);
    }
    return out;
  },
};
