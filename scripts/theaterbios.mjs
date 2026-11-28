// Korte bio per zaal (verzoek van de eigenaar, november 2026: "een korte bio van twee of drie zinnen over het theater",
// uit de eigen website van de zaal): de omschrijving die de zaal zelf op haar homepage geeft (meta description,
// og:description of de description in de JSON-LD). Zelfde regels als het ophalen: robots.txt en een pauze per site.
// Een omschrijving die bij zalen met verschillende websites staat (standaardtekst van een platform) valt weg.
// Schrijft de vondsten naar <werkmap>/bios.json; bekijk ze met het oog en zet de goede in data/theater-bios.json met
// scripts/theaterbios-verwerk.mjs.
//
// Gebruik: node scripts/theaterbios.mjs <werkmap>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getText } from "../ophalen/lib/http.mjs";
import { decodeEntities } from "../ophalen/lib/html.mjs";

const werkmap = process.argv[2];
if (!werkmap) { console.error("Gebruik: node scripts/theaterbios.mjs <werkmap>"); process.exit(1); }
mkdirSync(werkmap, { recursive: true });
const theaters = JSON.parse(readFileSync(new URL("../data/theaters.json", import.meta.url), "utf8"));
// Kaartverkoop en sociale media zijn geen site van de zaal.
const GEEN_ZAALSITE = /ticketmatic|weeztix|eventbrite|ticketmaster|ntk\.nl|facebook|instagram|fareharbor|google\.|uitinvlaanderen|truetickets/i;
const kandidaten = theaters.filter((t) => t.website && !GEEN_ZAALSITE.test(t.website));
console.log(`${kandidaten.length} zalen met een website`);

function omschrijvingVan(html) {
  const meta = (naam) => html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${naam}["'][^>]+content=["']([^"']+)`, "i"))?.[1]
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${naam}["']`, "i"))?.[1];
  const kandidaat = [meta("description"), meta("og:description"), meta("twitter:description")];
  for (const [, blok] of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try { for (const x of [].concat(JSON.parse(blok)?.["@graph"] || JSON.parse(blok))) if (typeof x?.description === "string") kandidaat.push(x.description); } catch {}
  }
  const schoon = kandidaat.filter(Boolean).map((x) => decodeEntities(decodeEntities(x)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  // De langste, want meta descriptions zijn soms alleen een slogan.
  return schoon.sort((a, b) => b.length - a.length)[0] || null;
}

const vondsten = [];
const rij = [...kandidaten];
let klaar = 0;
await Promise.all(Array.from({ length: 24 }, async () => {
  for (let t; (t = rij.shift()); ) {
    try {
      const pagina = new URL("/", t.website).href;
      const tekst = omschrijvingVan(await getText(pagina));
      if (tekst && tekst.length >= 40) vondsten.push({ id: t.id, naam: t.naam, plaats: t.plaats, pagina, tekst });
    } catch { /* niet bereikbaar of verboden */ }
    if (++klaar % 50 === 0) console.log(`${klaar}/${kandidaten.length}`);
  }
}));
// Dezelfde tekst bij zalen met verschillende websites: een standaardtekst van een platform, weg.
const hosts = new Map();
for (const v of vondsten) (hosts.get(v.tekst) || hosts.set(v.tekst, new Set()).get(v.tekst)).add(new URL(v.pagina).hostname.replace(/^www\./, ""));
const uniek = vondsten.filter((v) => hosts.get(v.tekst).size === 1).sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(join(werkmap, "bios.json"), JSON.stringify(uniek, null, 1));
console.log(`${vondsten.length} omschrijvingen gevonden, ${uniek.length} na het weghalen van standaardteksten`);
