// Theaterbureau Fr!S, impresariaat (theaterbureaufris.nl). Elke artiestpagina heeft per voorstelling een
// kop "SPEELLIJST ‘TITEL’" met een tabel: datum met jaar, tijd, zaal, plaats en een kaartknop. Fr!S doet
// ook muziek, kindervoorstellingen en een meezingkoor; hieronder alleen de cabaret- en comedyacts.
// Werkt als een speellijst (soort "speellijst"): samenvoegen.mjs koppelt de zaal aan een bekend theater
// en slaat avonden over die een theaterbron al heeft. Andries Tunru en Boban Braspenning staan al in
// speellijsten.mjs met hun eigen site.
import { readFileSync } from "node:fs";
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";
import { herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { zaalSite } from "./speellijsten.mjs";

const BASIS = "https://theaterbureaufris.nl/artiesten";
// Pagina -> naam in de agenda en eventueel het genre per titel (anders cabaret).
const ARTIESTEN = [
  { pagina: "stefan-hendrikx", naam: "Stefan Hendrikx" },
  { pagina: "kiki-schippers", naam: "Kiki Schippers" },
  { pagina: "pieter-jouke", naam: "Pieter Jouke" },
  { pagina: "fimme-bakker", naam: "Fimme Bakker" },
  { pagina: "beth-en-flo", naam: "Beth & Flo" },
  { pagina: "beperkt-houdbaar", naam: "Andries Tunru & Stefan Hendrikx", genre: "improvisatie" },
  { pagina: "ascf", naam: "Amsterdams Studenten Cabaret Festival" },
];
const MAANDEN = { jan: 1, feb: 2, mrt: 3, apr: 4, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12 };

const slugVan = (n) => n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// Land van een plaats volgens de zalen die we al kennen; onbekend is Nederland.
const bekendeZalen = JSON.parse(readFileSync(new URL("../../data/theaters.json", import.meta.url), "utf8"));
const landVan = new Map();
for (const t of bekendeZalen) landVan.set(slugVan(t.plaats), landVan.has(slugVan(t.plaats)) && landVan.get(slugVan(t.plaats)) !== t.land ? null : t.land);

const cel = (html) => decodeEntities(stripTags(html || "")).replace(/\s+/g, " ").trim();

// De titel staat in de kop in hoofdletters; elders op de pagina meestal gewoon ("Praktische bezwaren").
function netteTitel(kop, html) {
  const tekst = decodeEntities(stripTags(html));
  const re = new RegExp(kop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"), "gi");
  for (const m of tekst.matchAll(re)) if (m[0] !== m[0].toUpperCase()) return m[0].replace(/\s+/g, " ");
  return netteHoofdletters(kop);
}

export default {
  id: "fris",
  naam: "Agenda van Theaterbureau Fr!S",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const out = [];
    for (const a of ARTIESTEN) {
      const url = `${BASIS}/${a.pagina}/`;
      let html;
      try { html = await getText(url); } catch (e) { log(`${a.naam}: overgeslagen (${e.message})`); continue; }
      let n = 0;
      // Per voorstelling: de kop en daarna de tabel tot de volgende kop.
      const delen = html.split(/<h1>\s*SPEELLIJST\s+/i).slice(1);
      for (const deel of delen) {
        const kop = cel(deel.split("</h1>")[0]).replace(/^[‘'"]|[’'"]$/g, "").trim();
        const titel = netteTitel(kop, html);
        for (const rij of deel.split(/<tr class="speellijst_desktop">/).slice(1).map((r) => r.split("</tr>")[0])) {
          const tds = [...rij.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
          if (tds.length < 4) continue;
          const d = cel(tds[0]).match(/(\d{1,2})\s+([a-z]{3})[a-z]*\.?\s+(\d{4})/i);
          const maand = d && MAANDEN[d[2].toLowerCase()];
          if (!maand) continue;
          const datum = `${d[3]}-${String(maand).padStart(2, "0")}-${d[1].padStart(2, "0")}`;
          if (datum < vandaag) continue;
          const tijd = cel(tds[1]).match(/(\d{1,2})[:.](\d{2})/);
          // Zaal met eventueel een toevoeging in <b> (try-out, première) en <i>.
          const zaal = cel(tds[2].split(/<b>|<br/)[0]);
          const extra = cel(tds[2].replace(/^[\s\S]*?(<b>|<br)/, "$1"));
          const plaats = cel(tds[3]);
          if (!zaal || !plaats) continue;
          const knop = cel(tds[4] || "");
          const link = (tds[4] || "").match(/href="([^"]+)"/)?.[1] || null;
          const status = /geannuleerd|afgelast|vervalt/i.test(knop + extra) ? "geannuleerd"
            : /verplaatst/i.test(knop + extra) ? "verplaatst"
              : /uitverkocht|wachtlijst/i.test(knop + extra) ? "uitverkocht" : "gepland";
          const plaatsNet = /^['’]?s[- ]hertogenbosch$/i.test(plaats) ? "'s-Hertogenbosch" : netteNaam(plaats);
          out.push({
            theater: { zoeken: true, naam: zaal, plaats: plaatsNet, land: landVan.get(slugVan(plaatsNet)) || "NL", website: zaalSite(link ? [link] : [], url, a.naam) },
            artiesten: [a.naam],
            titel,
            genre: a.genre || (/oudejaars/i.test(titel) ? "oudejaarsconference" : "cabaret"),
            datum,
            tijd: tijd ? `${tijd[1].padStart(2, "0")}:${tijd[2]}` : null,
            status,
            soort: herkenSoort(`${extra} ${knop}`),
            // De kaartlink is de pagina van de zaal over deze avond; anders de pagina bij Fr!S.
            bron: link && /^https?:\/\//.test(link) ? link : url,
          });
          n++;
        }
      }
      log(`${a.naam}: ${n} speeldata`);
    }
    return out;
  },
};
