// Speellijst van Jan Beuving (janbeuving.nl/kaarten/): per maand een kop ("November") en daaronder regels
// "Donderdag 19 november, Heerde, <a>De Heerd</a> LAATSTE KAARTEN!". Geen jaartal en geen tijd: het jaar volgt
// uit de weekdag (het eerste jaar vanaf vandaag waarin die weekdag klopt). De voorstelling is Dekpunt.
// Werkt als een speellijst (soort "speellijst").
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";

const URL_ = "https://janbeuving.nl/kaarten/";
const DAGEN = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

function datumUit(weekdag, dag, maand, vandaag) {
  const j0 = +vandaag.slice(0, 4);
  for (const j of [j0 - 1, j0, j0 + 1, j0 + 2]) {
    const d = new Date(Date.UTC(j, maand, dag));
    if (d.getUTCMonth() !== maand || DAGEN[d.getUTCDay()] !== weekdag) continue;
    const iso = d.toISOString().slice(0, 10);
    if (iso >= vandaag) return iso;
  }
  return null;
}

export default {
  id: "janbeuving",
  naam: "Speellijst van Jan Beuving",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const html = await getText(URL_);
    // Per alinea of regel: tekst en de eerste link (de kaartverkoop van de zaal).
    const blokken = html.split(/<\/p>|<br\s*\/?>|<\/li>/i);
    const re = new RegExp(`^(${DAGEN.join("|")})\\s+(\\d{1,2})\\s+(${MAANDEN.join("|")}),\\s*([^,]+?),\\s*(.+)$`, "i");
    const out = [];
    for (const b of blokken) {
      const tekst = decodeEntities(stripTags(b)).replace(/\s+/g, " ").trim();
      const m = tekst.match(re);
      if (!m) continue;
      const datum = datumUit(m[1].toLowerCase(), +m[2], MAANDEN.indexOf(m[3].toLowerCase()), vandaag);
      if (!datum) continue;
      const status = /uitverkocht/i.test(m[5]) ? "uitverkocht" : /geannuleerd|afgelast/i.test(m[5]) ? "geannuleerd" : "gepland";
      const zaal = m[5].replace(/\s*(laatste kaarten|uitverkocht|geannuleerd|afgelast|extra voorstelling)!?\s*/gi, " ").trim();
      const link = decodeEntities(b.match(/href="([^"]+)"/)?.[1] || "");
      out.push({
        theater: { zoeken: true, naam: zaal, plaats: m[4].trim().replace(/^Den Bosch$/, "'s-Hertogenbosch"), land: "NL" },
        artiesten: ["Jan Beuving"],
        titel: "Dekpunt",
        genre: "cabaret",
        datum,
        tijd: null,
        status,
        soort: /extra voorstelling/i.test(m[5]) ? "extra voorstelling" : null,
        bron: /^https?:\/\//.test(link) ? link : URL_,
      });
    }
    log(`${out.length} voorstellingen vanaf vandaag`);
    return out;
  },
};
