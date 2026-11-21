// Al het blauw van de hemel (Neos Theater, met Buddy Vedder en Shelley Bos), alhetblauwvandehemel.nl. Een Wix-site
// met per seizoen een pagina (/speellijst-2627, /speellijst-2728). Als tekst staat per avond: "vr 20 nov 2026",
// eventueel "try-out" of "première", de zaal, de plaats en een status (UITVERKOCHT, LAATSTE KAARTEN, KAARTEN).
// De knoppen staan in Wix niet altijd netjes bij hun rij (soms twee, soms geen); de status nemen we alleen over als
// er precies één bij de avond staat. Geen tijden. Genre: toneel met ook muzikaal (voorstelling-correcties.json).
// Werkt als een speellijst (soort "speellijst").
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";

const BASIS = "https://www.alhetblauwvandehemel.nl/";
const PAGINAS = ["speellijst-2627", "speellijst-2728"];
const MAANDEN = { jan: 1, feb: 2, mrt: 3, maa: 3, apr: 4, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, okt: 10, nov: 11, dec: 12 };
const DATUM = /^(ma|di|wo|do|vr|za|zo)\s+(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})$/i;
const STATUS = /^(uitverkocht|laatste kaarten|kaarten)$/i;
const SOORT = /^(try-?out|premi[eè]re)$/i;
// "NIEUW" boven een extra avond is een label, geen zaal.
const LABEL = /^(nieuw|extra( voorstelling)?)!?$/i;

function stukken(html) {
  return html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "").split(/<[^>]+>/)
    .map((x) => decodeEntities(stripTags(x)).replace(/[\s ​]+/g, " ").trim()).filter(Boolean);
}

export default {
  id: "alhetblauw",
  naam: "Al het blauw van de hemel",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const out = [];
    for (const p of PAGINAS) {
      const url = BASIS + p;
      const t = stukken(await getText(url));
      const starts = t.map((x, i) => (DATUM.test(x) ? i : -1)).filter((i) => i >= 0);
      starts.forEach((s, k) => {
        const [, , dag, mnd, jaar] = t[s].match(DATUM);
        const m = MAANDEN[mnd.toLowerCase()];
        if (!m) return;
        const datum = `${jaar}-${String(m).padStart(2, "0")}-${dag.padStart(2, "0")}`;
        if (datum < vandaag) return;
        // Tot de volgende datum of de volgende maandkop ("december 2026").
        const rest = t.slice(s + 1, starts[k + 1] ?? s + 8).filter((x) => !/^[a-z]+ \d{4}$/i.test(x) || DATUM.test(x));
        const soort = rest.find((x) => SOORT.test(x));
        const tekst = rest.filter((x) => !SOORT.test(x) && !STATUS.test(x) && !LABEL.test(x));
        const statussen = rest.filter((x) => STATUS.test(x));
        const [zaal, plaats] = tekst;
        if (!zaal || !plaats) return;
        const st = statussen.length === 1 ? statussen[0].toLowerCase() : "";
        out.push({
          theater: { zoeken: true, naam: zaal, plaats: plaats.replace(/^Den Bosch$/, "'s-Hertogenbosch"), land: "NL" },
          artiesten: ["Buddy Vedder", "Shelley Bos"],
          titel: "Al het blauw van de hemel",
          genre: "toneel",
          datum,
          tijd: null,
          status: st === "uitverkocht" ? "uitverkocht" : "gepland",
          soort: soort ? (/premi/i.test(soort) ? "première" : "try-out") : rest.some((x) => LABEL.test(x)) ? "extra voorstelling" : null,
          bron: url,
        });
      });
    }
    log(`${out.length} voorstellingen vanaf vandaag`);
    return out;
  },
};
