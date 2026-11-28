// Vaste kleur per plaats (verzoek van de eigenaar, november 2026): de kop van /theaters-in-<plaats>/ en de stip op
// de kaart van /plaatsen/ hebben dezelfde kleur. Dit script vult data/plaats-kleuren.json aan; een plaats die er al
// in staat, houdt haar kleur. Volgorde: meeste voorstellingen eerst. De tien grootste plaatsen krijgen elk een andere
// kleur; daarna krijgt elke nieuwe plaats een kleur die verschilt van de twee plaatsen erboven in die volgorde, zodat
// de top 12 op /plaatsen/ nooit twee dezelfde kleuren onder elkaar heeft. Plaatsen die nog niet in het bestand staan,
// krijgen in de site een kleur uit hun naam (zoals de zalen). Gebruik: node scripts/plaats-kleuren.mjs
// (opnieuw draaien kan altijd: bestaande kleuren blijven staan).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { loadData, KLEUREN } from "../src/data.mjs";

const root = new URL("..", import.meta.url).pathname;
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
const db = loadData(join(root, "data"), { today });
const bestand = join(root, "data", "plaats-kleuren.json");
const oud = existsSync(bestand) ? JSON.parse(readFileSync(bestand, "utf8")) : {};

const kleuren = Object.keys(KLEUREN).filter((k) => k !== "zwart");
const vanNaam = (p) => kleuren[createHash("sha1").update(p).digest()[0] % kleuren.length];
const tel = new Map();
for (const g of db.upcoming) { const p = db.theaters.get(g.theater).plaats; tel.set(p, (tel.get(p) || 0) + 1); }
const volgorde = [...tel].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "nl")).map(([p]) => p);

const kleur = { ...oud };
volgorde.forEach((p, i) => {
  if (kleur[p]) return;
  const verboden = i < kleuren.length
    ? new Set(volgorde.slice(0, i).map((q) => kleur[q]))
    : new Set(volgorde.slice(Math.max(0, i - 2), i).map((q) => kleur[q]));
  const start = kleuren.indexOf(vanNaam(p));
  kleur[p] = [...kleuren.slice(start), ...kleuren.slice(0, start)].find((k) => !verboden.has(k)) || vanNaam(p);
});
const gesorteerd = Object.fromEntries(Object.entries(kleur).sort(([a], [b]) => a.localeCompare(b, "nl")));
writeFileSync(bestand, JSON.stringify(gesorteerd, null, 2) + "\n");
console.log(`${Object.keys(gesorteerd).length} plaatsen met een vaste kleur (${Object.keys(gesorteerd).length - Object.keys(oud).length} nieuw)`);
console.log(volgorde.slice(0, 14).map((p) => `${p}: ${kleur[p]}`).join("\n"));
