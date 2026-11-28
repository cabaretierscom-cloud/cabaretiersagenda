// Zet de goedgekeurde omschrijvingen uit scripts/theaterbios.mjs in data/theater-bios.json (korte bio op de
// theaterpagina, verzoek van de eigenaar november 2026). Per zaal: de tekst van de eigen website van de zaal, zonder
// oproepen ("Bekijk het programma", "Bestel je kaarten"), hooguit drie zinnen en alleen hele zinnen.
// Gebruik: node scripts/theaterbios-verwerk.mjs <werkmap> <afgekeurde volgnummers, komma-gescheiden>
// (de volgnummers zijn de plaatsen in <werkmap>/bios.json, te tonen met een korte lijst; afgekeurd wordt wat niet over
// de zaal zelf gaat: een gemeente, kaartverkoper, voorstelling, nieuwsbericht, menu of andere zaal).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const [werkmap, af = ""] = process.argv.slice(2);
if (!werkmap) { console.error("Gebruik: node scripts/theaterbios-verwerk.mjs <werkmap> <afgekeurde volgnummers>"); process.exit(1); }
const afgekeurd = new Set(af.split(",").filter(Boolean).map(Number));
const vondsten = JSON.parse(readFileSync(join(werkmap, "bios.json"), "utf8"));
const bestand = new URL("../data/theater-bios.json", import.meta.url);
const bios = existsSync(bestand) ? JSON.parse(readFileSync(bestand, "utf8")) : {};
const vandaag = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });

// Oproepen en praktische zinnen horen niet in een bio.
const OPROEP = /^(bekijk|bestel|koop|boek|reserveer|ontdek (ons|onze|het|alle|nu)|mis het niet|plan (je|nu)|kom (langs|kijken)|neem eens|meld je|maak het mee|gun jezelf|kalender|tickets|waar zit jij|doe mee|organiseer|bezoek (ons|onze))/i;
let nieuw = 0;
vondsten.forEach((v, i) => {
  if (afgekeurd.has(i)) return;
  let tekst = v.tekst.replace(/\[[a-z_]+\]/g, " ").replace(/\s+/g, " ").trim();
  // Hele zinnen; een afgekapt einde ("…", "...", geen punt) valt weg.
  let zinnen = tekst.match(/[^.!?]+[.!?]+(?=\s|$)/g)?.map((z) => z.trim()) || [];
  if (zinnen.length > 1) zinnen = zinnen.filter((z) => !OPROEP.test(z));
  zinnen = zinnen.filter((z) => !/\.\.\.$|…$/.test(z)).slice(0, 3);
  tekst = zinnen.join(" ");
  if (tekst.length < 40) return;
  bios[v.id] = { tekst, bron: v.pagina, opgehaald: vandaag };
  nieuw++;
});
writeFileSync(bestand, JSON.stringify(Object.fromEntries(Object.entries(bios).sort(([a], [b]) => a.localeCompare(b))), null, 2) + "\n");
console.log(`${nieuw} bio's in data/theater-bios.json (${Object.keys(bios).length} in totaal)`);
