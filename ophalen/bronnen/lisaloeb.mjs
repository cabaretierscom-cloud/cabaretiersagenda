// Speellijst van Lisa Loeb (lisaloeb.nl, voorstelling Fopfeminisme). De site is een JavaScript-app; de speellijst
// staat ingebakken in het script (/assets/index-<hash>.js, de naam wisselt bij elke nieuwe versie van de site) als
// lijst { date: "Wo 6 januari 2027", time: "20:30", venue, city, href, status }. robots.txt verbiedt alleen /api/;
// die gebruiken we niet. Werkt als een speellijst (soort "speellijst").
import { getText } from "../lib/http.mjs";

const SITE = "https://lisaloeb.nl/";
const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

export default {
  id: "lisaloeb",
  naam: "Speellijst van Lisa Loeb",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const html = await getText(SITE);
    const script = html.match(/<script[^>]+src="(\/assets\/index-[^"]+\.js)"/)?.[1];
    if (!script) throw new Error("script met de speellijst niet gevonden");
    const js = await getText(new URL(script, SITE).href);
    const out = [];
    for (const m of js.matchAll(/\{date:"([^"]*)",time:"([^"]*)",venue:"([^"]*)",city:"([^"]*)",href:"([^"]*)",status:"([^"]*)"\}/g)) {
      const [, datumTekst, tijd, zaal, plaats, link, status] = m;
      const [, dag, maand, jaar] = datumTekst.toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/) || [];
      const mi = MAANDEN.indexOf(maand);
      if (mi < 0) continue;
      const datum = `${jaar}-${String(mi + 1).padStart(2, "0")}-${dag.padStart(2, "0")}`;
      if (datum < vandaag) continue;
      out.push({
        theater: { zoeken: true, naam: zaal, plaats, land: "NL" },
        artiesten: ["Lisa Loeb"],
        titel: "Fopfeminisme",
        genre: "cabaret",
        datum,
        tijd: /^\d{1,2}:\d{2}$/.test(tijd) ? tijd.padStart(5, "0") : null,
        status: /uitverkocht/i.test(status) ? "uitverkocht" : /geannuleerd|afgelast/i.test(status) ? "geannuleerd" : "gepland",
        soort: null,
        bron: /^https?:\/\//.test(link) ? link : SITE,
      });
    }
    log(`${out.length} voorstellingen vanaf vandaag`);
    return out;
  },
};
