// Buro Stek (impresariaat, buro-stek.nl, Wix). /agenda?artist=<naam> toont alle avonden van die artiest als tekst:
// titel, artiest, "25/11/2026 (wo)", zaal, plaats, "Kaarten". Geen tijden en geen land: het land volgt uit de
// plaatsnaam (data/plaatsen-geo.json van GeoNames, bij twijfel een bekende zaal in data/theaters.json, anders CC/GC/OC
// vooraan = België). robots.txt staat alles toe behalve ?lightbox=. Alleen de artiesten in ARTIESTEN.
// Werkt als een speellijst (soort "speellijst").
import { readFileSync } from "node:fs";
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";

const BASIS = "https://www.buro-stek.nl/agenda?artist=";
const ARTIESTEN = [
  // Eigenaar van Cabaretiers.com, november 2026.
  { naam: "Evi Hanssen", zoek: "evi hanssen" },
];
const kaal = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const geo = JSON.parse(readFileSync(new URL("../../data/plaatsen-geo.json", import.meta.url), "utf8")).plaatsen;
const zalen = JSON.parse(readFileSync(new URL("../../data/theaters.json", import.meta.url), "utf8"));
const landenPerPlaats = new Map();
for (const k of Object.keys(geo)) {
  const [land, , naam] = k.split("|");
  if (!landenPerPlaats.has(naam)) landenPerPlaats.set(naam, new Set());
  landenPerPlaats.get(naam).add(land);
}

function landVan(plaats, zaal) {
  const l = [...(landenPerPlaats.get(kaal(plaats)) || [])].filter((x) => x === "NL" || x === "BE");
  if (l.length === 1) return l[0];
  const bekend = zalen.find((t) => kaal(t.plaats) === kaal(plaats));
  if (bekend?.land) return bekend.land;
  return /^(CC|GC|OC)\b/.test(zaal) ? "BE" : "NL";
}

export default {
  id: "stek",
  naam: "Buro Stek",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const out = [];
    for (const a of ARTIESTEN) {
      const url = BASIS + encodeURIComponent(a.zoek);
      const html = await getText(url);
      const t = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "").split(/<[^>]+>/)
        .map((x) => decodeEntities(stripTags(x)).replace(/[\s​ ]+/g, " ").trim()).filter(Boolean);
      let n = 0;
      for (let i = 1; i < t.length - 3; i++) {
        const d = t[i + 1].match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s*\(\w+\))?$/);
        if (!d || t[i] !== a.naam) continue;
        const datum = `${d[3]}-${d[2].padStart(2, "0")}-${d[1].padStart(2, "0")}`;
        if (datum < vandaag) continue;
        const titel = t[i - 1], zaal = t[i + 2], plaats = t[i + 3];
        if (!zaal || !plaats || /^kaarten$/i.test(plaats)) continue;
        const status = t[i + 4] || "";
        out.push({
          theater: { zoeken: true, naam: zaal, plaats, land: landVan(plaats, zaal) },
          artiesten: [a.naam],
          titel,
          genre: "cabaret",
          datum,
          tijd: null,
          status: /uitverkocht/i.test(status) ? "uitverkocht" : /geannuleerd|afgelast/i.test(status) ? "geannuleerd" : "gepland",
          soort: null,
          bron: url,
        });
        n++;
      }
      log(`${a.naam}: ${n} voorstellingen vanaf vandaag`);
    }
    return out;
  },
};
