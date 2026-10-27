// Bunker Theaterzaken, impresariaat (Lisa Ostermann, Micha Wertheim, Lebbis, Wim Helsen, ...). Elke
// artiestpagina (/artiesten/<artiest>/) heeft een speellijst met kaartjes: weekdag, dag en maand
// (zonder jaartal), titel, plaats, zaal, tijd, status en een kaartlink naar de zaal. Het jaar volgt
// uit de weekdag. Werkt als een speellijst (soort "speellijst"): samenvoegen.mjs koppelt de zaal aan
// een bekend theater en slaat avonden over die een theaterbron al heeft.
import { readFileSync } from "node:fs";
import { getText } from "../lib/http.mjs";
import { stripTags } from "../lib/html.mjs";
import { herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { zaalSite } from "./speellijsten.mjs";

const BASIS = "https://www.bunkertheaterzaken.nl";
const MAANDEN = { jan: 1, feb: 2, mrt: 3, apr: 4, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12 };
const WEEKDAGEN = ["zo", "ma", "di", "wo", "do", "vr", "za"];
// Naam van de artiestpagina -> naam in de agenda.
const NAMEN = { "Van Vleuten en Van Muiswinkel": "Van Vleuten & Van Muiswinkel", "Finalistentour Leids Cabaret Festival": "Leids Cabaret Festival" };
// Geen voorstelling voor publiek; en voorstellingen buiten Nederland en België.
const OVERSLAAN = /^audities\b/i;
const BUITENLAND = /^(london|londen)$/i;

const slugVan = (n) => n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// Land van een plaats volgens de zalen die we al kennen; onbekend is Nederland.
const bekendeZalen = JSON.parse(readFileSync(new URL("../../data/theaters.json", import.meta.url), "utf8"));
const landVan = new Map();
for (const t of bekendeZalen) landVan.set(slugVan(t.plaats), landVan.has(slugVan(t.plaats)) && landVan.get(slugVan(t.plaats)) !== t.land ? null : t.land);

// "wo", 28, "okt" -> het eerstvolgende jaar (vanaf vorig jaar) waarin 28 oktober een woensdag is.
function metJaar(weekdag, dag, maand, vandaag) {
  const jaar = Number(vandaag.slice(0, 4));
  for (const j of [jaar, jaar + 1, jaar - 1]) {
    const d = `${j}-${String(maand).padStart(2, "0")}-${String(dag).padStart(2, "0")}`;
    if (WEEKDAGEN[new Date(`${d}T12:00:00Z`).getUTCDay()] === weekdag) return d;
  }
  return null;
}

const tekst = (html, klasse) => stripTags(html.match(new RegExp(`class="${klasse}"[^>]*>([\\s\\S]*?)</`))?.[1] || "").trim();

export default {
  id: "bunker",
  naam: "Agenda van Bunker Theaterzaken",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const home = await getText(`${BASIS}/`);
    const paginas = [...new Set([...home.matchAll(/href="(https:\/\/www\.bunkertheaterzaken\.nl\/artiesten\/[a-z0-9-]+\/)"/g)].map((m) => m[1]))];
    log(`${paginas.length} artiestpagina's`);
    const out = [];
    for (const url of paginas) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const titel = stripTags(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "").replace(/\s*[-–|]\s*Bunker Theaterzaken.*$/i, "").trim();
      if (!titel) continue;
      const naam = NAMEN[titel] || titel;
      let n = 0;
      for (const kaart of html.split(/<article class="show-card/).slice(1).map((k) => k.split(/<\/article>/)[0])) {
        const klasse = kaart.match(/^([^"]*)"/)?.[1] || "";
        const weekdag = tekst(kaart, "show-card-date-day").toLowerCase().slice(0, 2);
        const dag = Number(tekst(kaart, "show-card-date-date"));
        const maand = MAANDEN[tekst(kaart, "show-card-date-month").toLowerCase().slice(0, 3)];
        const datum = maand && dag ? metJaar(weekdag, dag, maand, vandaag) : null;
        if (!datum || datum < vandaag) continue;
        const kop = stripTags(kaart.match(/class="show-card-title"[^>]*>([\s\S]*?)<\/h3>/)?.[1] || "").replace(/\s+/g, " ").trim();
        const meta = [...(kaart.match(/class="show-card-meta"[\s\S]*?<\/ul>/)?.[0] || "").matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => stripTags(m[1]).trim());
        const tijd = meta.map((m) => m.match(/^(\d{1,2})[:.](\d{2})/)).find(Boolean);
        const [plaats, zaal] = meta.filter((m) => !/^\d{1,2}[:.]\d{2}/.test(m));
        if (!plaats || !zaal) continue;
        const link = kaart.match(/class="show-card-tickets-button[^"]*"/) ? kaart.match(/<a href="([^"]+)"[^>]*class="show-card-tickets-button/)?.[1] : null;
        const knoppen = stripTags(kaart.match(/class="show-card-tickets-column"[\s\S]*$/)?.[0] || "");
        const status = /geannuleerd|afgelast|vervalt/i.test(klasse + knoppen) ? "geannuleerd"
          : /verplaatst/i.test(klasse + knoppen) ? "verplaatst"
          : /sold-out|uitverkocht|wachtlijst/i.test(klasse + knoppen) ? "uitverkocht" : "gepland";
        const kaal = plaats.replace(/\s*\((NL|B|BE)\)\s*$/i, "").trim();
        if (BUITENLAND.test(kaal) || OVERSLAAN.test(kop)) continue;
        // "'s-Hertogenbosch" staat er ook als "S-Hertogenbosch" of met een krul-apostrof.
        const plaatsNet = /^['’]?s[- ]hertogenbosch$/i.test(kaal) ? "'s-Hertogenbosch" : /^['’]s[- ]/i.test(kaal) ? `'s-${kaal.slice(3, 4).toUpperCase()}${kaal.slice(4)}` : netteNaam(kaal);
        const land = /\((B|BE)\)/i.test(plaats) ? "BE" : landVan.get(slugVan(plaatsNet)) || "NL";
        // "Ruim (voorpremière) - start verkoop 10 juni", "Kintsugi.", "LEMMING"
        let wat = kop.replace(/\s+-\s+start verkoop.*$/i, "").replace(/\s*\((voor)?(try[ -]?out|premi[eè]re|derni[eè]re|reprise)\)\s*$/i, "").replace(/\.$/, "").trim();
        if (wat === wat.toUpperCase()) wat = netteHoofdletters(wat);
        // Echt Gebeurd (verhalenavonden van Micha Wertheim) staat in de agenda als eigen gezelschap.
        const echt = wat.match(/^Echt Gebeurd\s*[-–:]?\s*(.*)$/i);
        out.push({
          theater: { zoeken: true, naam: zaal, plaats: plaatsNet, land, website: zaalSite(link ? [link] : [], `${BASIS}/`, naam) },
          artiesten: [echt ? "Echt Gebeurd" : naam],
          titel: (echt ? echt[1] : wat) || naam,
          genre: "cabaret",
          datum,
          tijd: tijd ? `${tijd[1].padStart(2, "0")}:${tijd[2]}` : null,
          status,
          soort: herkenSoort(kop) || (/voorpremi/i.test(kop) ? "try-out" : null),
          // De kaartlink is de pagina van de zaal over deze avond; anders de pagina van de artiest.
          bron: link && /^https?:\/\//.test(link) ? link : url,
        });
        n++;
      }
      log(`${naam}: ${n} speeldata`);
    }
    return out;
  },
};
