// Adres per zaal (verzoek van de eigenaar, november 2026: adres, kaartje en routebeschrijving op de theaterpagina).
// Twee bronnen:
//  1. de eigen website van de zaal: het adres in de JSON-LD (PostalAddress) van de homepage, of een adresregel met
//     postcode en de plaats van de zaal in de tekst (alleen als de plaats klopt);
//  2. OpenStreetMap via de Overpass API: een gebouw of punt met de naam van de zaal binnen 6 km van de plaats, met
//     straat en huisnummer (ODbL, naamsvermelding op de pagina). Nominatim en Photon verbieden zoekverzoeken van
//     robots in robots.txt; die gebruiken we niet.
// Geven beide bronnen een adres en verschillen de postcodes, dan geen adres (liever niets dan een verkeerd adres).
// Schrijft data/theater-adressen.json; adressen die er al in staan blijven staan (met de hand verbeteren kan daar).
//
// Gebruik: node scripts/theateradressen.mjs [--zonder-osm]  (alleen de websites; voor als Overpass niet bereikbaar is)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { getText, stelPauzeIn, USER_AGENT } from "../ophalen/lib/http.mjs";
import { decodeEntities } from "../ophalen/lib/html.mjs";
import { loadData } from "../src/data.mjs";
import { createTemplates } from "../src/templates.mjs";

const vandaag = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
const db = loadData(new URL("../data", import.meta.url).pathname, { today: vandaag });
const t = createTemplates(db, {});
const bestand = new URL("../data/theater-adressen.json", import.meta.url);
const adressen = existsSync(bestand) ? JSON.parse(readFileSync(bestand, "utf8")) : {};
const GEEN_ZAALSITE = /ticketmatic|weeztix|eventbrite|ticketmaster|ntk\.nl|facebook|instagram|fareharbor|google\.|uitinvlaanderen|truetickets/i;
const zalen = [...db.theaters.values()].filter((z) => db.gigsForTheater(z.id).length && !adressen[z.id]);
console.log(`${zalen.length} zalen zonder adres`);

const kaal = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const postcodeNL = /\b(\d{4})\s?([A-Z]{2})\b/;
const zelfdePlaats = (a, b) => { const x = kaal(a), y = kaal(b); return x && y && (x === y || x.includes(y) || y.includes(x)); };

// 1. Website van de zaal
function adresUitSite(html, z) {
  for (const [, blok] of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    let d; try { d = JSON.parse(blok); } catch { continue; }
    const stapel = [d];
    while (stapel.length) {
      const x = stapel.pop();
      if (!x || typeof x !== "object") continue;
      if (Array.isArray(x)) { stapel.push(...x); continue; }
      const a = x.address;
      if (a && typeof a === "object" && a.streetAddress && (a.postalCode || a.addressLocality) && zelfdePlaats(a.addressLocality || z.plaats, z.plaats)) {
        return { straat: decodeEntities(String(a.streetAddress)).trim(), postcode: String(a.postalCode || "").trim(), plaats: decodeEntities(String(a.addressLocality || z.plaats)).trim() };
      }
      stapel.push(...Object.values(x));
    }
  }
  // Adresregel in de tekst: "Straatnaam 12, 1234 AB Plaats" (NL) of "Straatnaam 12, 1234 Plaats" (BE).
  const tekst = decodeEntities(html.replace(/<(script|style)[\s\S]*?<\/\1>/g, " ").replace(/<[^>]+>/g, "\n")).replace(/[ \t ]+/g, " ");
  const re = z.land === "NL"
    ? /([A-Z][\p{L}'’.\- ]{2,40}?\s\d{1,4}[a-zA-Z]?(?:[-–]\d+)?)\s*[,\n|•·]\s*(\d{4}\s?[A-Z]{2})\s+([A-Z][\p{L}'’\- ]{1,40})/gu
    : /([A-Z][\p{L}'’.\- ]{2,40}?\s\d{1,4}[a-zA-Z]?(?:[-–]\d+)?)\s*[,\n|•·]\s*((?:B-)?\d{4})\s+([A-Z][\p{L}'’\- ]{1,40})/gu;
  for (const m of tekst.matchAll(re)) {
    const plaats = m[3].split("\n")[0].trim();
    if (zelfdePlaats(plaats, z.plaats)) return { straat: m[1].trim(), postcode: m[2].replace(/^B-/, "").trim(), plaats };
  }
  return null;
}

// 2. OpenStreetMap (Overpass)
// Een andere Overpass-server (spiegel van de OSM-wiki) kan met OVERPASS=https://…/api/interpreter.
const OVERPASS = process.env.OVERPASS || "https://overpass-api.de/api/interpreter";
stelPauzeIn(new URL(OVERPASS).host, 1500);
const MET_OSM = !process.argv.includes("--zonder-osm");
async function adresUitOsm(z) {
  if (!MET_OSM) return null;
  const c = t.geoPlaats(z.plaats, z.land);
  if (!c) return null;
  const [lat, lon] = c;
  const namen = [...new Set([z.naam, z.naam.replace(new RegExp(`\\s*${z.plaats}$`, "i"), ""), z.naam.replace(/^(theater|schouwburg|cultuurcentrum|cc|gc)\s+/i, "")])].filter((n) => n.length >= 4);
  const re = namen.map((n) => n.replace(/[.*+?^${}()|[\]\\"]/g, "\\$&")).join("|");
  const q = `[out:json][timeout:25];nwr(around:6000,${lat},${lon})["name"~"^(${re})$",i]["addr:street"];out tags center 5;`;
  const json = JSON.parse(await getText(`${OVERPASS}?data=${encodeURIComponent(q)}`, { headers: { "user-agent": USER_AGENT } }));
  const el = json.elements?.find((e) => e.tags["addr:housenumber"]);
  if (!el) return null;
  const g = el.tags;
  return { straat: `${g["addr:street"]} ${g["addr:housenumber"]}`, postcode: g["addr:postcode"] || "", plaats: g["addr:city"] || z.plaats, lat: el.lat ?? el.center?.lat, lon: el.lon ?? el.center?.lon, osm: `https://www.openstreetmap.org/${el.type}/${el.id}` };
}

function bewaar() { writeFileSync(bestand, JSON.stringify(Object.fromEntries(Object.entries(adressen).sort(([a], [b]) => a.localeCompare(b))), null, 2) + "\n"); }
const pc = (x) => String(x || "").replace(/\s/g, "").toUpperCase().slice(0, 4);
let klaar = 0, gevonden = 0, tegenstrijdig = 0;
const rij = [...zalen];
await Promise.all(Array.from({ length: 8 }, async () => {
  for (let z; (z = rij.shift()); ) {
    let site = null, osm = null;
    if (z.website && !GEEN_ZAALSITE.test(z.website)) { try { site = adresUitSite(await getText(new URL("/", z.website).href), z); } catch { /* niet bereikbaar */ } }
    try { osm = await adresUitOsm(z); } catch { /* Overpass druk of niets */ }
    if (site && osm && pc(site.postcode) && pc(osm.postcode) && pc(site.postcode) !== pc(osm.postcode)) { tegenstrijdig++; console.log(`tegenstrijdig: ${z.id} (${site.straat}, ${site.postcode} / ${osm.straat}, ${osm.postcode})`); }
    else if (site || osm) {
      const a = site || osm;
      adressen[z.id] = { straat: a.straat, postcode: a.postcode || osm?.postcode || "", plaats: a.plaats, bron: site ? new URL("/", z.website).href : osm.osm, ...(osm?.lat ? { lat: +osm.lat.toFixed(5), lon: +osm.lon.toFixed(5) } : {}), opgehaald: vandaag };
      gevonden++;
    }
    // Tussendoor bewaren, zodat een onderbreking niet alles kost.
    if (++klaar % 50 === 0) { console.log(`${klaar}/${zalen.length}, ${gevonden} adressen`); bewaar(); }
  }
}));
bewaar();
console.log(`${gevonden} nieuwe adressen (${Object.keys(adressen).length} in totaal), ${tegenstrijdig} tegenstrijdig en weggelaten`);
