// Zoekt het geslacht van solo-artiesten op in Wikidata (eigenschap P21), voor de pagina's
// /alle-cabaretiers/mannen/ en /alle-cabaretiers/vrouwen/. Werkwijze zoals bij de foto's:
// Wikipedia-artikel (eerst Nederlands, dan Engels) -> alleen als het over een cabaretier of comedian
// gaat -> Wikidata-item -> P21. Duo's en groepen worden overgeslagen. Geen gegevens = niets invullen;
// nooit raden op naam. Met de hand aanvullen mag, altijd met `geslachtBron`.
// Gebruik: npm run geslacht              (alleen artiesten zonder geslacht)
//          npm run geslacht -- --alleen=id1,id2
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getText } from "./lib/http.mjs";
import { stripTags } from "./lib/html.mjs";
import { isGroep } from "../src/data.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pad = join(root, "data", "artiesten.json");
const artiesten = JSON.parse(readFileSync(pad, "utf8"));
const alleen = process.argv.find((x) => x.startsWith("--alleen="))?.slice(9).split(",");

// Zelfde controle als bij de foto's: het artikel moet over cabaret of comedy gaan.
const VAK = /cabaretier|cabaretière|cabaret|comedian|komiek|humorist|stand-up|standup|kleinkunst|conférencier|conferencier|imitator|komediant/i;
// Wikidata: man, vrouw, transgender man, transgender vrouw.
const GESLACHT = { Q6581097: "man", Q6581072: "vrouw", Q2449503: "man", Q1052281: "vrouw" };

async function wikidataItem(a) {
  if (a.foto?.wikidata) return a.foto.wikidata;
  for (const taal of ["nl", "en"]) {
    let html;
    try { html = await getText(`https://${taal}.wikipedia.org/wiki/${encodeURIComponent(a.naam.replace(/ /g, "_"))}`); }
    catch { continue; }
    if (/id="disambigbox"|class="[^"]*dmbox/.test(html)) continue;
    const inleiding = (html.match(/<p[ >][\s\S]*?<\/p>/g) || []).map(stripTags).filter((t) => t.length > 40).slice(0, 2).join(" ");
    if (!VAK.test(inleiding)) continue;
    const q = html.match(/"wgWikibaseItemId":"(Q\d+)"/)?.[1];
    if (q) return q;
  }
  return null;
}

let gevonden = 0, onbekend = 0;
for (const a of artiesten) {
  if (alleen ? !alleen.includes(a.id) : a.geslacht || isGroep(a)) continue;
  try {
    const q = await wikidataItem(a);
    if (!q) { onbekend++; continue; }
    const ent = JSON.parse(await getText(`https://www.wikidata.org/wiki/Special:EntityData/${q}.json`)).entities[q];
    const isMens = (ent.claims.P31 || []).some((c) => c.mainsnak.datavalue?.value?.id === "Q5");
    const g = (ent.claims.P21 || []).map((c) => GESLACHT[c.mainsnak.datavalue?.value?.id]).filter(Boolean);
    if (!isMens || new Set(g).size !== 1) { onbekend++; continue; }
    a.geslacht = g[0];
    a.geslachtBron = `https://www.wikidata.org/wiki/${q}`;
    gevonden++;
    console.log(`${a.naam}: ${a.geslacht} (${q})`);
  } catch (e) {
    console.log(`${a.naam}: overgeslagen (${e.message})`);
  }
}
writeFileSync(pad, JSON.stringify(artiesten, null, 2) + "\n");
console.log(`Klaar: ${gevonden} gevonden, ${onbekend} zonder (bruikbaar) Wikipedia-artikel of Wikidata-gegeven.`);
