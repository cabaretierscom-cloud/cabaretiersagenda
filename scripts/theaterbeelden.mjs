// Zoekt een beeld voor zalen zonder foto (verzoek en toestemming van de eigenaar, november 2026: "verzamel ook de
// afbeeldingen van de theaters"): het deelbeeld (og:image, twitter:image of het beeld in de JSON-LD) van de homepage
// van de zaal (`website` in data/theaters.json). Zelfde regels als het ophalen: robots.txt en een pauze per site.
// Een beeld dat bij zalen met verschillende websites staat (standaardbeeld van een platform) valt weg; zalen met
// dezelfde website (zalen in één gebouw) mogen hetzelfde beeld hebben.
// Schrijft de vondsten en de gedownloade beelden naar een werkmap; scripts/theaterbeelden-verwerk.py zet ze daarna
// om naar jpg in public/fotos/theaters/ en zet ze in data/theaters.json.
//
// Gebruik: node scripts/theaterbeelden.mjs <werkmap>
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getText, getBestand } from "../ophalen/lib/http.mjs";
import { decodeEntities } from "../ophalen/lib/html.mjs";

const werkmap = process.argv[2];
if (!werkmap) { console.error("Gebruik: node scripts/theaterbeelden.mjs <werkmap>"); process.exit(1); }
mkdirSync(join(werkmap, "beelden"), { recursive: true });
const theaters = JSON.parse(readFileSync(new URL("../data/theaters.json", import.meta.url), "utf8"));
// Kaartverkoop en sociale media zijn geen site van de zaal.
const GEEN_ZAALSITE = /ticketmatic|weeztix|eventbrite|ticketmaster|ntk\.nl|facebook|instagram|fareharbor|google\./i;
const kandidaten = theaters.filter((t) => t.foto == null && t.website && !GEEN_ZAALSITE.test(t.website));
console.log(`${kandidaten.length} zalen zonder foto met een website`);

function beeldVan(html, pagina) {
  const meta = (naam) => html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${naam}["'][^>]+content=["']([^"']+)`, "i"))?.[1]
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${naam}["']`, "i"))?.[1];
  let u = meta("og:image") || meta("og:image:url") || meta("twitter:image");
  if (!u) {
    for (const [, blok] of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
      try { const d = JSON.parse(blok); for (const x of [].concat(d?.["@graph"] || d)) { const im = [].concat(x?.image || [])[0]; if (im) { u = typeof im === "string" ? im : im.url; break; } } } catch {}
      if (u) break;
    }
  }
  if (!u) return null;
  try { return new URL(decodeEntities(u), pagina).href; } catch { return null; }
}

const vondsten = [];
const rij = [...kandidaten];
let klaar = 0;
await Promise.all(Array.from({ length: 24 }, async () => {
  for (let t; (t = rij.shift()); ) {
    try {
      const pagina = new URL("/", t.website).href;
      const beeld = beeldVan(await getText(pagina), pagina);
      if (beeld && !/favicon|placeholder|\.svg(\?|$)/i.test(beeld)) vondsten.push({ id: t.id, naam: t.naam, plaats: t.plaats, pagina, beeld });
    } catch { /* niet bereikbaar of verboden */ }
    if (++klaar % 50 === 0) console.log(`${klaar}/${kandidaten.length}`);
  }
}));

// Hetzelfde beeld bij zalen met verschillende websites: een standaardbeeld van een platform, weg.
const sleutel = (u) => u.split("?")[0];
const hosts = new Map();
for (const v of vondsten) (hosts.get(sleutel(v.beeld)) || hosts.set(sleutel(v.beeld), new Set()).get(sleutel(v.beeld))).add(new URL(v.pagina).hostname.replace(/^www\./, ""));
const uniek = vondsten.filter((v) => hosts.get(sleutel(v.beeld)).size === 1);
console.log(`${vondsten.length} beelden gevonden, ${uniek.length} na het weghalen van standaardbeelden`);

const rij2 = [...uniek];
await Promise.all(Array.from({ length: 24 }, async () => {
  for (let v; (v = rij2.shift()); ) {
    const bestand = join(werkmap, "beelden", `${v.id}.bin`);
    if (!existsSync(bestand)) {
      try { writeFileSync(bestand, await getBestand(v.beeld)); v.bestand = bestand; } catch (e) { v.fout = e.message; }
    } else v.bestand = bestand;
  }
}));
writeFileSync(join(werkmap, "vondsten.json"), JSON.stringify(uniek.filter((v) => v.bestand), null, 1));
console.log(`${uniek.filter((v) => v.bestand).length} beelden in ${werkmap}`);
