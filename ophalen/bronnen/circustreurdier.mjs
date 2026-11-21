// Circus Treurdier (theatercollectief, circustreurdier.nl). Per project een pagina /project/<project>/ met onder
// "Speellijst" per maand een kop (<h3>Maart 2027</h3>) en per avond een div.datum: dag, tijd, plaats (span.stad) en
// zaal (span.theater, met "(try out)", "(première)" of "(matinee)" erachter), en een kaartknop (soms leeg).
// Alleen de projecten in PROJECTEN. robots.txt verbiedt alleen /wp-admin/. Werkt als een speellijst.
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";
import { herkenSoort } from "../lib/normaliseer.mjs";

const BASIS = "https://www.circustreurdier.nl/project/";
const PROJECTEN = [
  // Eigenaar van Cabaretiers.com, november 2026: toneel met ook satire en muzikaal (voorstelling-correcties.json).
  { pad: "die-bloemkool-een-moeilijke-musical/", titel: "Die Bloemkool (een moeilijke musical)", genre: "toneel" },
];
const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const PLAATSEN = { "Den Bosch": "'s-Hertogenbosch" };
const tekst = (s) => decodeEntities(stripTags(s || "")).replace(/\s+/g, " ").trim();

export default {
  id: "circustreurdier",
  naam: "Circus Treurdier",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const out = [];
    for (const p of PROJECTEN) {
      const url = BASIS + p.pad;
      const html = await getText(url);
      const agenda = html.slice(html.indexOf('class="container agenda"'));
      let n = 0;
      // Per maandkop het stuk tot de volgende kop.
      for (const [, kop, blok] of agenda.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3|$)/g)) {
        const [, maand, jaar] = tekst(kop).toLowerCase().match(/^([a-z]+) (\d{4})$/) || [];
        const m = MAANDEN.indexOf(maand);
        if (m < 0) continue;
        for (const [rij] of blok.matchAll(/<div class="datum[^"]*">[\s\S]*?<a class="button tickets"[^>]*>/g)) {
          const dag = tekst(rij.match(/class="dag[^"]*">\s*(\d{1,2})/)?.[1]);
          if (!dag) continue;
          const datum = `${jaar}-${String(m + 1).padStart(2, "0")}-${dag.padStart(2, "0")}`;
          if (datum < vandaag) continue;
          const tijd = tekst(rij.match(/class="tijd project">([\s\S]*?)<\/span>/)?.[1]).match(/^(\d{1,2})[:.](\d{2})$/);
          const plaats = tekst(rij.match(/class="stad[^"]*">([\s\S]*?)<\/span>/)?.[1]);
          const zaalRuw = tekst(rij.match(/class="theater[^"]*">([\s\S]*?)<\/span>/)?.[1]);
          if (!plaats || !zaalRuw) continue;
          const link = decodeEntities(rij.match(/class="button tickets" href="([^"]*)"/)?.[1] || "");
          out.push({
            theater: { zoeken: true, naam: zaalRuw.replace(/\s*\([^)]*\)\s*$/, ""), plaats: PLAATSEN[plaats] || plaats, land: "NL" },
            artiesten: ["Circus Treurdier"],
            titel: p.titel,
            genre: p.genre,
            datum,
            tijd: tijd ? `${tijd[1].padStart(2, "0")}:${tijd[2]}` : null,
            status: /uitverkocht/i.test(rij) ? "uitverkocht" : "gepland",
            soort: herkenSoort(zaalRuw),
            bron: /^https?:\/\//.test(link) ? link : url,
          });
          n++;
        }
      }
      log(`${p.titel}: ${n} voorstellingen vanaf vandaag`);
    }
    return out;
  },
};
