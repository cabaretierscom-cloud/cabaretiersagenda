// SPOT Groningen (De Oosterpoort, Stadsschouwburg en andere zalen).
// De programmapagina bevat het hele seizoen; elke kaart heeft genre, zaal, datum met tijd,
// artiest, titel en verkoopstatus. Eén pagina ophalen is genoeg.
import { getText } from "../lib/http.mjs";
import { stripTags } from "../lib/html.mjs";
import { lokaleDatumTijd, herkenGenre, herkenSoort } from "../lib/normaliseer.mjs";

const BASIS = "https://www.spotgroningen.nl";
const ZALEN = {
  oosterpoort: "de-oosterpoort",
  stadsschouwburg: "stadsschouwburg-groningen",
  machinefabriek: "machinefabriek-groningen",
  usva: "usva-groningen",
  "lutherse-kerk": "lutherse-kerk-groningen",
  "a-theater": "a-theater-groningen",
};
const STATUS = { Uitverkocht: "uitverkocht", Geannuleerd: "geannuleerd" };
const zonderSoort = (t) => t.replace(/\s*\((try[ -]?out|premi[eè]re|reprise|derni[eè]re)\)\s*$/i, "").trim();

export default {
  id: "spot-groningen",
  naam: "SPOT Groningen",
  theaters: [
    { id: "de-oosterpoort", naam: "De Oosterpoort", plaats: "Groningen", land: "NL", soort: "theater", website: BASIS },
    { id: "stadsschouwburg-groningen", naam: "Stadsschouwburg Groningen", plaats: "Groningen", land: "NL", soort: "theater", website: BASIS },
    { id: "machinefabriek-groningen", naam: "Machinefabriek", plaats: "Groningen", land: "NL", soort: "theater", website: BASIS },
    { id: "usva-groningen", naam: "Usva", plaats: "Groningen", land: "NL", soort: "theater", website: null },
    { id: "lutherse-kerk-groningen", naam: "Lutherse Kerk", plaats: "Groningen", land: "NL", soort: "overig", website: null },
    { id: "a-theater-groningen", naam: "A-Theater", plaats: "Groningen", land: "NL", soort: "theater", website: null },
  ],

  async ophalen({ log }) {
    const html = await getText(`${BASIS}/programma/`);
    const kaarten = html.split(/<article/).slice(1);
    log(`${kaarten.length} voorstellingen in het programma`);
    const out = [];
    for (const k of kaarten) {
      const attr = (n) => k.match(new RegExp(`data-${n}="([^"]*)"`))?.[1] || "";
      const genres = attr("genres").split(","), sub = attr("subgenres").split(",");
      if (!genres.includes("cabaret") && !herkenGenre(sub)) continue;
      const genre = herkenGenre(sub) || "cabaret";
      const zaal = ZALEN[attr("location")];
      if (!zaal) continue; // "elders": geen vaste zaal bekend
      const kop = k.match(/<h3>([\s\S]*?)<span>([\s\S]*?)<\/span>\s*<\/h3>/);
      const artiest = kop ? stripTags(kop[1]) : null;
      const titelRuw = kop ? stripTags(kop[2]) : stripTags(k.match(/<h3>([\s\S]*?)<\/h3>/)?.[1]);
      const wanneer = lokaleDatumTijd(k.match(/<time datetime="([^"]+)"/)?.[1]);
      const url = k.match(/href="([^"]+)"/)?.[1];
      if (!wanneer || !url || !titelRuw) continue;
      const statusTekst = stripTags(k.match(/program__status">([^<]*)</)?.[1]);
      out.push({
        theater: zaal,
        artiesten: artiest ? [artiest] : [],
        titel: zonderSoort(titelRuw),
        genre,
        ...wanneer,
        status: STATUS[statusTekst] || "gepland",
        soort: herkenSoort(titelRuw, statusTekst === "Extra show" ? "extra voorstelling" : ""),
        bron: url,
      });
    }
    return out;
  },
};
