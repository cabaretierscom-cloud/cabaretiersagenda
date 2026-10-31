// Eenmalige import van de speellijsten van Kobra Theaterproducties (kobratheater.nl), uit opgeslagen
// voorstellingspagina's. Kobra blokkeert geautomatiseerde bezoekers (403 en een anti-robotcontrole), dus er
// is geen nachtelijke bron: de site wordt niet automatisch benaderd. Gebruik:
//   node scripts/kobra-import.mjs <map met opgeslagen pagina's (slug.html)>
// Schrijft data/bronnen/kobra.json (soort "speellijst"); daarna `npm run samenvoegen`. De speellijst
// blijft staan tot de volgende import, dus wijzigingen bij Kobra komen pas mee bij een nieuwe import.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stripTags, decodeEntities } from "../ophalen/lib/html.mjs";
import { herkenSoort, netteNaam } from "../ophalen/lib/normaliseer.mjs";

const BASIS = "https://www.kobratheater.nl";
const MAANDEN = { januari: 1, februari: 2, maart: 3, april: 4, mei: 5, juni: 6, juli: 7, augustus: 8, september: 9, oktober: 10, november: 11, december: 12 };
// Alleen cabaret, comedy en komedie; per productie het genre en eventueel de spelers.
const PRODUCTIES = {
  "lift": { genre: "theaterkomedie", artiesten: ["Jelka van Houten", "Sanne Wallis de Vries"], titel: "Lift" },
  "louise-korthals-korthals-in-stukken-26-27": { genre: "cabaret", titel: "In stukken" },
  "marjolijn-van-kooten-aan-mij-zal-het-niet-liggen": { genre: "cabaret" },
  "patrick-nederkoorn-nieuw-programma": { genre: "cabaret" },
  "pieter-verelst-altijd-aan-26-27": { genre: "stand-up" },
  "ramon-chatrer-volk-2": { genre: "cabaret", titel: "Volk" },
  "ronald-snijders-leven-met-humor": { genre: "cabaret" },
  "vlamousse-het-goede-voorbeeld-26-27": { genre: "cabaret" },
};
const tekst = (s) => decodeEntities(stripTags(s || "")).replace(/\s+/g, " ").trim();
const vandaag = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date());

const map = process.argv[2];
if (!map) { console.error("Gebruik: node scripts/kobra-import.mjs <map met opgeslagen pagina's>"); process.exit(1); }
const speeldata = [];
for (const bestand of readdirSync(map).filter((f) => f.endsWith(".html"))) {
  const slug = bestand.replace(/\.html$/, "");
  const p = PRODUCTIES[slug];
  if (!p) continue;
  const html = readFileSync(join(map, bestand), "utf8");
  const kop = tekst(html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1]).replace(/\s+\d{2}\/\d{2}$/, "");
  const [artiest, titel] = kop.includes(" - ") ? kop.split(/\s+-\s+/, 2) : [null, kop];
  const artiesten = p.artiesten || (artiest ? [artiest] : []);
  const url = `${BASIS}/${slug}/`;
  const tabel = html.match(/<table class="speellijst">([\s\S]*?)<\/table>/)?.[1] || "";
  let jaar = null, maand = null, n = 0;
  for (const rij of tabel.split(/<tr/).slice(1)) {
    const m = tekst(rij.slice(rij.indexOf(">") + 1)).match(/^([a-z]+)\s+(\d{4})$/i);
    if (/rowmaand/.test(rij) && m) { maand = MAANDEN[m[1].toLowerCase()]; jaar = m[2]; continue; }
    const cellen = [...rij.matchAll(/<td>([\s\S]*?)<\/td>/g)].map((c) => c[1]);
    const dag = cellen.length >= 4 && tekst(cellen[0]).match(/(\d{1,2})/)?.[1];
    if (!dag || !maand) continue;
    const datum = `${jaar}-${String(maand).padStart(2, "0")}-${dag.padStart(2, "0")}`;
    const plaats = tekst(cellen[1]), zaal = tekst(cellen[2]);
    if (datum < vandaag || !plaats || !zaal) continue;
    const zaalLink = cellen[2].match(/href="([^"]+)"/)?.[1] || null;
    const kaart = cellen[3].match(/href="([^"]+)"/)?.[1];
    const st = tekst(cellen[3]);
    speeldata.push({
      theater: { zoeken: true, naam: zaal, plaats: netteNaam(plaats), land: "NL", website: zaalLink },
      artiesten,
      titel: (p.titel || titel).trim(),
      genre: p.genre,
      datum,
      tijd: null,
      status: /uitverkocht/i.test(st) ? "uitverkocht" : /geannuleerd|afgelast/i.test(st) ? "geannuleerd" : "gepland",
      soort: herkenSoort(kop),
      bron: kaart && /^https?:\/\//.test(kaart) ? kaart : url,
    });
    n++;
  }
  console.log(`${kop}: ${n} speeldata`);
}
writeFileSync(new URL("../data/bronnen/kobra.json", import.meta.url), JSON.stringify({
  bron: "kobra", naam: "Speellijsten van Kobra Theaterproducties (import)", soort: "speellijst", opgehaald: vandaag, theaters: [], speeldata, recensies: {},
}, null, 2) + "\n");
console.log(`Totaal: ${speeldata.length} speeldata in data/bronnen/kobra.json`);
