// Haalt speellijsten op en bewaart ze per bron in data/bronnen/<bron>.json.
//   npm run ophalen               alle bronnen
//   npm run ophalen -- carre      alleen Carré
// Daarna voegt `npm run samenvoegen` alles samen in data/.
import { readdirSync, writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { recensiesVan } from "./lib/http.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const bronnenDir = join(root, "ophalen", "bronnen");
const outDir = join(root, "data", "bronnen");
mkdirSync(outDir, { recursive: true });

const gekozen = process.argv.slice(2);
const files = readdirSync(bronnenDir).filter((f) => f.endsWith(".mjs") && !f.startsWith("_"))
  .filter((f) => !gekozen.length || gekozen.includes(f.replace(/\.mjs$/, "")));

const vandaag = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
let mislukt = 0;
// Hoe het ophalen per bron ging, voor de controlepagina (/controle/): gelukt of niet, aantal, duur.
const logBestand = join(root, "data", "ophaal-log.json");
const ophaalLog = existsSync(logBestand) ? JSON.parse(readFileSync(logBestand, "utf8")) : {};

// Bronnen draaien gelijktijdig; per site blijft het één verzoek tegelijk (zie lib/http.mjs).
await Promise.all(files.map(async (f) => {
  const bron = (await import(pathToFileURL(join(bronnenDir, f)))).default;
  const log = (msg) => console.log(`[${bron.id}] ${msg}`);
  log("bezig...");
  const start = Date.now();
  try {
    const records = (await bron.ophalen({ log, vandaag })).filter((r) => r.datum >= vandaag);
    writeFileSync(join(outDir, `${bron.id}.json`), JSON.stringify({
      bron: bron.id,
      naam: bron.naam,
      ...(bron.soort ? { soort: bron.soort } : {}),
      opgehaald: vandaag,
      theaters: bron.theaters || [],
      speeldata: records,
      // Recensies (krant, sterren, citaat) per voorstellingspagina, zie lib/recensies.mjs.
      recensies: Object.fromEntries([...new Set(records.map((r) => r.bron))].map((u) => [u, recensiesVan(u)]).filter(([, r]) => r.length)),
    }, null, 2) + "\n");
    log(`${records.length} speeldata in ${Math.round((Date.now() - start) / 1000)} s`);
    ophaalLog[bron.id] = { naam: bron.naam, datum: vandaag, gelukt: true, aantal: records.length, seconden: Math.round((Date.now() - start) / 1000) };
  } catch (e) {
    mislukt++;
    ophaalLog[bron.id] = { ...(ophaalLog[bron.id] || {}), naam: bron.naam, datum: vandaag, gelukt: false, fout: String(e.message).slice(0, 300), seconden: Math.round((Date.now() - start) / 1000) };
    // De vorige uitkomst blijft staan, zodat één kapotte site de agenda niet leegmaakt.
    console.error(`[${bron.id}] MISLUKT: ${e.message}`);
  }
}));
writeFileSync(logBestand, JSON.stringify(Object.fromEntries(Object.entries(ophaalLog).sort()), null, 2) + "\n");
if (mislukt) process.exitCode = 1;
