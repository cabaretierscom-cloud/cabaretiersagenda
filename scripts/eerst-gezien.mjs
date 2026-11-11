// Eenmalig: vult data/eerst-gezien.json uit de git-geschiedenis van data/voorstellingen.json.
// Per voorstelling met artiesten (sleutel: artiesten + titel, zie voorstellingSleutel in src/data.mjs) de datum
// van de eerste commit waarin ze voorkomt. Daarna houdt samenvoegen.mjs het bestand elke nacht bij.
// Gebruik: node scripts/eerst-gezien.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { voorstellingSleutel } from "../src/data.mjs";

const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 1 << 28 });
const commits = git("log", "--reverse", "--format=%H %ad", "--date=short", "--", "data/voorstellingen.json").trim().split("\n").map((r) => r.split(" "));
const eerst = {};
for (const [hash, datum] of commits) {
  let lijst;
  try { lijst = JSON.parse(git("show", `${hash}:data/voorstellingen.json`)); } catch { continue; }
  for (const v of lijst) if (v.artiesten?.length) eerst[voorstellingSleutel(v)] ??= datum;
}
const uit = {
  uitleg: "Wanneer een voorstelling (artiesten + titel) voor het eerst in de agenda kwam. Voor 'Nieuw in de agenda' op de homepage en /nieuws/. Bijgehouden door ophalen/samenvoegen.mjs; begonnen uit de git-geschiedenis (scripts/eerst-gezien.mjs). Alles van de begindatum ('sinds') hoort bij de eerste vulling en telt niet als nieuw.",
  sinds: commits[0][1],
  voorstellingen: Object.fromEntries(Object.entries(eerst).sort()),
};
writeFileSync(new URL("../data/eerst-gezien.json", import.meta.url), JSON.stringify(uit, null, 1) + "\n");
console.log(`${Object.keys(eerst).length} voorstellingen, sinds ${uit.sinds}.`);
