// Maakt data/postcodes.json: per land (NL, BE) de postcodes van vier cijfers met coördinaten en plaatsnaam, voor
// zoeken op postcode op /in-de-buurt/. Eenmalig draaien; de uitkomst staat in de repository.
//
// Bron (eerst downloaden en uitpakken, staat niet in de repository): GeoNames postcodes (CC BY 4.0),
//   https://download.geonames.org/export/zip/NL.zip en BE.zip (NL: alleen de vier cijfers, BE: per postcode soms
//   meer deelgemeenten; dan het gemiddelde punt en de eerste naam).
//
// Gebruik: node scripts/postcodes.mjs <NL.txt> <BE.txt>
import { readFileSync, writeFileSync } from "node:fs";

const [nlPad, bePad] = process.argv.slice(2);
if (!bePad) { console.error("Gebruik: node scripts/postcodes.mjs <NL.txt> <BE.txt>"); process.exit(1); }

function lees(pad) {
  const per = new Map();
  for (const regel of readFileSync(pad, "utf8").split("\n")) {
    const v = regel.split("\t");
    if (v.length < 11 || !/^\d{4}$/.test(v[1])) continue;
    const lat = +v[9], lon = +v[10];
    if (!lat || !lon) continue;
    if (!per.has(v[1])) per.set(v[1], { naam: v[2], punten: [] });
    per.get(v[1]).punten.push([lat, lon]);
  }
  const uit = {};
  for (const [pc, { naam, punten }] of [...per].sort()) {
    const lat = punten.reduce((s, p) => s + p[0], 0) / punten.length, lon = punten.reduce((s, p) => s + p[1], 0) / punten.length;
    uit[pc] = [+lat.toFixed(3), +lon.toFixed(3), naam];
  }
  return uit;
}

const data = { bron: "GeoNames (CC BY 4.0), https://www.geonames.org/", NL: lees(nlPad), BE: lees(bePad) };
writeFileSync(new URL("../data/postcodes.json", import.meta.url), JSON.stringify(data) + "\n");
console.log(`NL ${Object.keys(data.NL).length}, BE ${Object.keys(data.BE).length} postcodes`);
