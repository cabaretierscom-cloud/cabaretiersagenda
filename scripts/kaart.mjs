// Maakt de kaart van Nederland en België voor het dashboard (src/kaart.mjs) en de coördinaten van plaatsen
// (data/plaatsen-geo.json). Eenmalig draaien; de uitkomst staat in de repository.
//
// Bronnen (eerst downloaden, ze staan niet in de repository):
//   - Natural Earth, provincies (publiek domein):
//     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
//   - Natural Earth, meren (IJsselmeer, Friese meren): .../geojson/ne_10m_lakes.geojson en ne_10m_lakes_europe.geojson
//   - GeoNames (CC BY 4.0), plaatsen in NL en BE: https://download.geonames.org/export/dump/NL.zip en BE.zip (uitpakken)
//
// Gebruik: node scripts/kaart.mjs <provincies.geojson> <NL.txt> <BE.txt> [meren.geojson ...]
import { readFileSync, writeFileSync } from "node:fs";

const [provPad, nlPad, bePad, ...merenPaden] = process.argv.slice(2);
if (!bePad) { console.error("Gebruik: node scripts/kaart.mjs <provincies.geojson> <NL.txt> <BE.txt>"); process.exit(1); }

// Projectie: rechthoekig met de lengtegraden ingekort op 51,5° NB, genoeg voor zo'n klein gebied.
const W = 1000, LON0 = 2.45, LON1 = 7.3, LAT0 = 49.45, LAT1 = 53.62;
const K = Math.cos((51.5 * Math.PI) / 180);
const S = W / ((LON1 - LON0) * K);
const H = Math.round((LAT1 - LAT0) * S);
const xy = ([lon, lat]) => [(lon - LON0) * K * S, (LAT1 - lat) * S];

// Douglas-Peucker: punten weglaten die minder dan `tol` van de lijn afwijken.
function vereenvoudig(pts, tol) {
  if (pts.length < 4) return pts;
  const houd = new Uint8Array(pts.length); houd[0] = houd[pts.length - 1] = 1;
  const stapel = [[0, pts.length - 1]];
  while (stapel.length) {
    const [a, b] = stapel.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    let max = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / len;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol) { houd[idx] = 1; stapel.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => houd[i]);
}
const oppervlak = (pts) => Math.abs(pts.reduce((s, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x * y2 - x2 * y; }, 0) / 2);

// Polygonen als SVG-pad. Een ring begint en eindigt op hetzelfde punt; in twee helften vereenvoudigen.
function pad(polys) {
  const delen = [];
  for (const poly of polys) for (const ring of poly) {
    const r = ring.map(xy).slice(0, -1), mid = r.length >> 1;
    const pts = [...vereenvoudig(r.slice(0, mid + 1), 0.6).slice(0, -1), ...vereenvoudig([...r.slice(mid), r[0]], 0.6).slice(0, -1)];
    if (pts.length < 4 || oppervlak(pts) < 4) continue;
    delen.push("M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z");
  }
  return delen.join("");
}

const geo = JSON.parse(readFileSync(provPad, "utf8"));
const provincies = [];
for (const f of geo.features) {
  const p = f.properties;
  if (p.adm0_a3 !== "NLD" && p.adm0_a3 !== "BEL") continue;
  if (p.type_en === "Special Municipality") continue; // Caribisch Nederland valt buiten de kaart
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  provincies.push({ land: p.adm0_a3 === "NLD" ? "NL" : "BE", naam: p.name_nl || p.name, d: pad(polys) });
}
// Meren die in het kaartvlak liggen.
const meren = [];
for (const f of merenPaden.flatMap((m) => JSON.parse(readFileSync(m, "utf8")).features)) {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  if (!polys.flat(2).some(([lon, lat]) => lon > LON0 && lon < LON1 && lat > LAT0 && lat < LAT1)) continue;
  const d = pad(polys);
  if (d) meren.push({ naam: f.properties.name, d });
}
provincies.sort((a, b) => a.land.localeCompare(b.land) || a.naam.localeCompare(b.naam, "nl"));

writeFileSync(new URL("../src/kaart.mjs", import.meta.url), `// Gemaakt door scripts/kaart.mjs uit Natural Earth (publiek domein). Niet met de hand aanpassen.
export const KAART = ${JSON.stringify({ breedte: W, hoogte: H, lon0: LON0, lat1: LAT1, k: K, schaal: S })};
export const PROVINCIES = ${JSON.stringify(provincies, null, 0).replace(/\},\{/g, "},\n{")};
export const MEREN = ${JSON.stringify(meren, null, 0).replace(/\},\{/g, "},\n{")};
`);

// Plaatsen: GeoNames, alleen bewoonde plaatsen (P). Per land, provincie (code van GeoNames) en naam de grootste.
// Google Analytics noemt plaatsen in het Engels (The Hague, Antwerp); daarom ook de alternatieve namen,
// maar een officiële naam gaat altijd voor een alternatieve.
const plaatsen = {};
for (const pad of [nlPad, bePad]) {
  for (const regel of readFileSync(pad, "utf8").split("\n")) {
    const c = regel.split("\t");
    if (c[6] !== "P") continue;
    const [naam, ascii, alt, lat, lon, land, a1, inw] = [c[1], c[2], c[3], +c[4], +c[5], c[8], c[10], +c[14] || 0];
    if (!(lon > LON0 && lon < LON1 && lat > LAT0 && lat < LAT1)) continue;
    // Alternatieve (Engelse) namen alleen bij grotere plaatsen en alleen in gewone letters.
    const namen = [[naam, 2], [ascii, 2], ...(inw >= 10000 ? alt.split(",").filter((n) => /^[A-Za-z' .-]+$/.test(n)).map((n) => [n, 1]) : [])];
    for (const [n, gewicht] of namen) {
      const sleutel = `${land}|${a1}|${n.toLowerCase()}`;
      const oud = plaatsen[sleutel];
      const score = gewicht * 1e9 + inw;
      if (!oud || score > oud[2]) plaatsen[sleutel] = [+lat.toFixed(3), +lon.toFixed(3), score];
    }
  }
}
const uit = Object.fromEntries(Object.entries(plaatsen).sort().map(([k, [lat, lon]]) => [k, [lat, lon]]));
writeFileSync(new URL("../data/plaatsen-geo.json", import.meta.url), JSON.stringify({
  bron: "GeoNames (geonames.org), CC BY 4.0; gemaakt door scripts/kaart.mjs",
  plaatsen: uit,
}).replace(/\],"/g, '],\n"') + "\n");
console.log(`${provincies.length} provincies, ${meren.length} meren, ${Object.keys(uit).length} plaatsnamen.`);
