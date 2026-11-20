// Speellijst van Micky Overman (mickyoverman.com, Wix; tournee Don't Threaten Me With A Good Time). Op de homepage
// staat de wereldtournee als tekst: een kop met het jaar ("EUROPE 2027"), en per avond dag ("19"), maand ("FEB"),
// "Plaats, Land", zaal en status (TICKETS, SELLING FAST, LAST FEW, SOLD OUT). Alleen de avonden in Nederland en
// België. Geen tijden. Werkt als een speellijst (soort "speellijst").
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";

const SITE = "https://www.mickyoverman.com/";
const MAANDEN = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, SEPT: 9, OCT: 10, NOV: 11, DEC: 12 };
const LANDEN = { netherlands: "NL", belgium: "BE" };
const PLAATSEN = { Ghent: "Gent", Antwerp: "Antwerpen", Brussels: "Brussel" };
const STATUS = /^(tickets|selling fast|last few|sold out)$/i;

export default {
  id: "mickyoverman",
  naam: "Speellijst van Micky Overman",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const html = await getText(SITE);
    const t = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "").split(/<[^>]+>/)
      .map((x) => decodeEntities(stripTags(x)).replace(/[\s ]+/g, " ").trim()).filter(Boolean);
    const out = [];
    let jaar = null;
    for (let i = 0; i < t.length - 3; i++) {
      const kop = t[i].match(/\b(20\d\d)$/);
      if (kop && /[A-Z]{3,}/.test(t[i])) { jaar = kop[1]; continue; }
      if (!/^\d{1,2}$/.test(t[i]) || !MAANDEN[t[i + 1]] || !jaar) continue;
      // "Amsterdam, Netherlands" kan over twee stukjes verdeeld zijn ("Amsterdam," en "Netherlands").
      let j = i + 2, plaatsLand = t[j];
      if (/,$/.test(plaatsLand)) plaatsLand += " " + t[++j];
      const [, plaats, landNaam] = plaatsLand.match(/^(.+?),\s*(.+)$/) || [];
      const land = LANDEN[String(landNaam).toLowerCase()];
      if (!land) continue;
      const zaal = t[j + 1], status = t[j + 2] || "";
      if (!zaal || STATUS.test(zaal)) continue;
      const datum = `${jaar}-${String(MAANDEN[t[i + 1]]).padStart(2, "0")}-${t[i].padStart(2, "0")}`;
      if (datum < vandaag) continue;
      out.push({
        theater: { zoeken: true, naam: zaal.replace(/\s+-\s+(Grote Zaal|Middenzaal|Parkzaal|Kleine Zaal|Hertz)$/i, ""), plaats: PLAATSEN[plaats] || plaats, land },
        artiesten: ["Micky Overman"],
        titel: "Don't Threaten Me With A Good Time",
        genre: "stand-up",
        datum,
        tijd: null,
        status: /sold out/i.test(status) ? "uitverkocht" : "gepland",
        soort: null,
        bron: SITE,
      });
    }
    log(`${out.length} voorstellingen in Nederland en België vanaf vandaag`);
    return out;
  },
};
