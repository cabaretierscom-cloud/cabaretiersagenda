// Zoekt het promotiebeeld van voorstellingen die nog geen eigen beeld hebben (verzoek en algemene toestemming van de
// eigenaar, november 2026: "je mag de show-promotieafbeeldingen altijd gebruiken"). Per voorstelling met komende
// speeldata de voorstellingspagina van een zaal (de `bron` van een speeldatum) en daarop het deelbeeld
// (og:image, twitter:image of het beeld in de JSON-LD). Zelfde regels als het ophalen: robots.txt en een pauze per site.
// Beelden die bij meer dan één voorstelling staan (logo's, standaardbeelden van de zaal) vallen weg.
// Schrijft de vondsten en de gedownloade beelden naar een werkmap; scripts/voorstellingsbeelden-verwerk.py zet ze
// daarna om naar jpg in public/fotos/promo/ en voegt ze toe aan data/promo.json (met `alleenVoorstelling`).
//
// Gebruik: node scripts/voorstellingsbeelden.mjs <werkmap> [maximaal aantal voorstellingen]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getText, getBestand } from "../ophalen/lib/http.mjs";
import { decodeEntities } from "../ophalen/lib/html.mjs";

const werkmap = process.argv[2];
const maximaal = Number(process.argv[3]) || Infinity;
if (!werkmap) { console.error("Gebruik: node scripts/voorstellingsbeelden.mjs <werkmap> [maximaal]"); process.exit(1); }
mkdirSync(join(werkmap, "beelden"), { recursive: true });

const data = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const voorstellingen = data("voorstellingen.json"), speeldata = data("speeldata.json"), artiesten = data("artiesten.json"), promo = data("promo.json");
const A = new Map(artiesten.map((a) => [a.id, a]));
const vandaag = new Date().toISOString().slice(0, 10);
const gewoon = (t) => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const alGedaan = new Set(promo.filter((p) => p.voorstelling && p.foto).map((p) => `${p.artiest}|${gewoon(p.voorstelling)}`));

// Kaartverkoop en sites zonder voorstellingspagina: daar staat geen beeld van de voorstelling.
const GEEN_PAGINA = /ticketmatic|weeztix|eventbrite|ticketmaster|ntk\.nl|mtticket|podiumnederland|fareharbor|tix\.|ticket/i;
// Sites waarvan de eigenaar eerst zelf om toestemming vraagt (november 2026): daar geen beelden van halen.
const GEEN_TOESTEMMING = /(^|\.)comedytrain\.nl$/i;
const komend = new Map();
for (const s of speeldata) if (s.datum >= vandaag) (komend.get(s.voorstelling) || komend.set(s.voorstelling, []).get(s.voorstelling)).push(s);

const kandidaten = [];
for (const v of voorstellingen) {
  const gigs = komend.get(v.id);
  if (!gigs || !v.artiesten?.length || !v.titel) continue;
  const artiest = A.get(v.artiesten[0])?.naam;
  if (!artiest || alGedaan.has(`${artiest}|${gewoon(v.titel)}`)) continue;
  // Pagina's met de titel of de artiest in het adres eerst; geen kale homepages of speellijstpagina's.
  const woorden = gewoon(`${v.titel} ${artiest}`).split(" ").filter((w) => w.length > 3);
  const paginas = [...new Set(gigs.map((g) => g.bron))].filter((u) => {
    try { const x = new URL(u); return x.pathname.length > 1 && !GEEN_PAGINA.test(x.hostname) && !GEEN_TOESTEMMING.test(x.hostname) && !/speellijst|tickets?\/?$|agenda\/?$|tour/i.test(x.pathname); } catch { return false; }
  }).map((u) => [u, woorden.filter((w) => gewoon(u).includes(w)).length]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([u]) => u);
  if (paginas.length) kandidaten.push({ vid: v.id, artiest, titel: v.titel, paginas: paginas.slice(0, 2) });
}
console.log(`${kandidaten.length} voorstellingen zonder eigen beeld met een voorstellingspagina`);

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
const lijst = kandidaten.slice(0, maximaal);
let klaar = 0;
async function werk(k) {
  for (const pagina of k.paginas) {
    try {
      const beeld = beeldVan(await getText(pagina), pagina);
      if (beeld && !/logo|favicon|placeholder|default|og-image|share-image|fallback/i.test(beeld)) { vondsten.push({ ...k, pagina, beeld }); return; }
    } catch (e) { /* volgende pagina */ }
  }
}
// Veel tegelijk; http.mjs houdt per site één verzoek tegelijk met pauze aan.
const rij = [...lijst];
await Promise.all(Array.from({ length: 24 }, async () => {
  for (let k; (k = rij.shift()); ) { await werk(k); if (++klaar % 50 === 0) console.log(`${klaar}/${lijst.length}`); }
}));

// Hetzelfde beeld bij meer dan één voorstelling: een logo of standaardbeeld, weg.
const sleutel = (u) => u.split("?")[0];
const telling = new Map();
for (const v of vondsten) telling.set(sleutel(v.beeld), (telling.get(sleutel(v.beeld)) || 0) + 1);
const uniek = vondsten.filter((v) => telling.get(sleutel(v.beeld)) === 1);
console.log(`${vondsten.length} beelden gevonden, ${uniek.length} uniek`);

klaar = 0;
const rij2 = [...uniek];
await Promise.all(Array.from({ length: 24 }, async () => {
  for (let v; (v = rij2.shift()); ) {
    const bestand = join(werkmap, "beelden", `${v.vid}.bin`);
    if (!existsSync(bestand)) {
      try { writeFileSync(bestand, await getBestand(v.beeld)); v.bestand = bestand; } catch (e) { v.fout = e.message; }
    } else v.bestand = bestand;
    if (++klaar % 100 === 0) console.log(`gedownload ${klaar}/${uniek.length}`);
  }
}));
writeFileSync(join(werkmap, "vondsten.json"), JSON.stringify(uniek.filter((v) => v.bestand), null, 1));
console.log(`${uniek.filter((v) => v.bestand).length} beelden in ${werkmap}`);
