// Comedyhuis Utrecht. De hele agenda staat op /agenda-en-tickets/ (FacetWP-lijst): titel, comedians,
// omschrijving, taal, locatie (adres of zaalnaam), dag en maand zonder jaartal, tijd en status. Het jaar
// volgt uit de weekdag. Comedyhuis speelt ook op andere plekken in Utrecht en Houten; die zalen zoeken
// we op zoals bij een speellijst. Cursussen en masterclasses laten we weg, net als de avonden van het
// Utrecht International Comedy Festival (die komen via het festival en de theaters).
import { getText } from "../lib/http.mjs";
import { stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort } from "../lib/normaliseer.mjs";
import { isBekend } from "../lib/artiesten.mjs";

const BASIS = "https://comedyhuis.nl";
const MAANDEN = { jan: 1, feb: 2, mrt: 3, apr: 4, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12 };
const WEEKDAGEN = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const CLUB = "comedyhuis-utrecht";
// Locatie op de site -> zaal.
const ZALEN = {
  "catharijnepoort 6": CLUB,
  "oudegracht 36": { zoeken: true, naam: "De Kargadoor", plaats: "Utrecht", land: "NL", website: "https://www.kargadoor.nl" },
  "oudegracht aan de werf 145": { zoeken: true, naam: "Kartoffel", plaats: "Utrecht", land: "NL", website: null },
  "venster": { zoeken: true, naam: "Venster", plaats: "Utrecht", land: "NL", website: null },
  "wolvenstraat 10": { zoeken: true, naam: "Moira", plaats: "Utrecht", land: "NL", website: null },
  "tivolivredenburg": { zoeken: true, naam: "TivoliVredenburg", plaats: "Utrecht", land: "NL", website: "https://www.tivolivredenburg.nl" },
  "theater aan de slinger": { zoeken: true, naam: "Theater aan de Slinger", plaats: "Houten", land: "NL", website: null },
};
const OVERSLAAN = /masterclass|cursus|workshop/i;

// "vr", 30, "okt" -> het eerstvolgende jaar (vanaf dit jaar) waarin 30 oktober een vrijdag is.
function metJaar(weekdag, dag, maand, vandaag) {
  const jaar = Number(vandaag.slice(0, 4));
  for (const j of [jaar, jaar + 1, jaar - 1]) {
    const d = `${j}-${String(maand).padStart(2, "0")}-${String(dag).padStart(2, "0")}`;
    if (WEEKDAGEN[new Date(`${d}T12:00:00Z`).getUTCDay()] === weekdag) return d;
  }
  return null;
}
const veld = (blok, klasse) => stripTags(blok.match(new RegExp(`class="fwpl-item ${klasse}">([\\s\\S]*?)</div>`))?.[1] || "").replace(/\s+/g, " ").trim();

export default {
  id: "comedyhuis",
  naam: "Comedyhuis Utrecht",
  theaters: [
    { id: CLUB, naam: "Comedyhuis", plaats: "Utrecht", land: "NL", soort: "comedyclub", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const html = await getText(`${BASIS}/agenda-en-tickets/`);
    const blokken = html.split('<div class="fwpl-result').slice(1);
    log(`${blokken.length} avonden op de agenda`);
    const out = [];
    const onbekend = new Set();
    for (const blok of blokken) {
      const kop = blok.match(/class="fwpl-item el-itawg"><a href="([^"]+)">([\s\S]*?)<\/a>/);
      if (!kop) continue;
      const [, bron, ruweTitel] = kop;
      const titel = stripTags(ruweTitel).replace(/\s+/g, " ").trim();
      const locatie = veld(blok, "el-65wlr");
      if (!titel || OVERSLAAN.test(titel) || /comedy festival/i.test(locatie)) continue;
      const theater = ZALEN[locatie.toLowerCase()];
      if (!theater) { onbekend.add(locatie); continue; }
      const [weekdag, dag, maandNaam] = veld(blok, "el-fum8ad").toLowerCase().split(/\s+/);
      const maand = MAANDEN[(maandNaam || "").slice(0, 3)];
      const datum = maand ? metJaar(weekdag?.slice(0, 2), Number(dag), maand, vandaag) : null;
      if (!datum || datum < vandaag) continue;
      const tijd = veld(blok, "el-c3plop").match(/^(\d{1,2})[:.](\d{2})/);
      const status = /uitverkocht/i.test(veld(blok, "show-status")) ? "uitverkocht" : "gepland";
      const comedians = [...(blok.match(/class="fwpl-item el-uzmrsf">([\s\S]*?)<\/div>/)?.[1] || "").matchAll(/<a [^>]*>([^<]+)<\/a>/g)].map((m) => stripTags(m[1]).trim());
      // Een voorstelling van één comedian of duo: de titel begint met de naam ("Glodi Lugungu: In de
      // Hemel ken ik jullie niet", "PERNILLE HAALAND") of de naam staat achter een streepje ("Bak To The
      // Future – Rogier Bak"). Avonden met een wisselende line-up ("Vroege vrijdagavondshow") hebben
      // geen vaste artiest.
      const isNaam = (s) => comedians.some((c) => c.toLowerCase() === s.toLowerCase()) || isBekend(s);
      let artiesten = [], wat = titel;
      const naam = comedians.length === 1 && titel.toLowerCase().startsWith(comedians[0].toLowerCase()) ? comedians[0] : null;
      const delen = titel.split(/\s+[-–—|]\s+|:\s+/);
      if (naam) {
        artiesten = [naam];
        wat = titel.slice(naam.length).replace(/^\s*[:\-–—|]\s*/, "").trim();
      } else if (delen.length === 2) {
        const [a, b] = delen;
        const namen = (s) => s.split(/\s+&\s+/);
        if (namen(a).every(isNaam)) [artiesten, wat] = [namen(a), b];
        else if (namen(b).every(isNaam)) [artiesten, wat] = [namen(b), a];
      }
      // "Meeuw Roovers X Hidde van Gestel": een duo.
      const x = artiesten.length === 1 && wat.match(/^x\s+(.+)$/i);
      if (x) { artiesten = [artiesten[0], x[1]]; wat = ""; }
      // "Solo", "Solo (matinee)" en "Dubbelshow" zijn geen titel: dan heet de voorstelling naar de artiest.
      if (artiesten.length && (!wat || /^(solo|dubbelshow)\b/i.test(wat))) wat = artiesten.join(" & ");
      const omschrijving = veld(blok, "el-ih3lsq");
      out.push({
        theater,
        artiesten,
        titel: wat,
        genre: herkenGenre(titel, omschrijving) || "stand-up",
        datum,
        tijd: tijd ? `${tijd[1].padStart(2, "0")}:${tijd[2]}` : null,
        status,
        soort: herkenSoort(titel),
        bron,
      });
    }
    if (onbekend.size) log(`onbekende locaties (overgeslagen): ${[...onbekend].join(", ")}`);
    return out;
  },
};
