// Zoekt rechtenvrije foto's van zalen: Wikipedia-artikel -> Wikidata-afbeelding (P18) -> licentie op
// Wikimedia Commons. Alleen vrije licenties en alleen als het artikel duidelijk over een zaal in
// dezelfde plaats gaat. De foto komt in public/fotos/theaters/<id>.jpg, de naamsvermelding in
// data/theaters.json (veld `foto`). Controleer nieuwe foto's met het oog; zet `"foto": false` bij een
// zaal om er nooit een te zoeken.
// Gebruik: npm run theaterfotos              (alleen zalen met voorstellingen en zonder foto)
//          npm run theaterfotos -- --alleen=id1,id2
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getText } from "./lib/http.mjs";
import { stripTags } from "./lib/html.mjs";
import { commonsFoto } from "./lib/commons.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pad = join(root, "data", "theaters.json");
const theaters = JSON.parse(readFileSync(pad, "utf8"));
const speeldata = JSON.parse(readFileSync(join(root, "data", "speeldata.json"), "utf8"));
const alleen = process.argv.find((x) => x.startsWith("--alleen="))?.slice(9).split(",");
mkdirSync(join(root, "public", "fotos", "theaters"), { recursive: true });

// Alleen zalen die een pagina hebben (aankomende voorstellingen).
const vandaag = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
const metVoorstellingen = new Set(speeldata.filter((s) => s.datum >= vandaag).map((s) => s.theater));

// Het artikel moet over een zaal gaan, en over die in deze plaats.
const ZAAL = /theater|schouwburg|concertzaal|concertgebouw|muziekcentrum|poppodium|podium|cultuurcentrum|cultureel centrum|cultuurhuis|comedyclub|zaal|arena|evenementenhal|kerk/i;
const kaal = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "");
// Een plaatsnaam in het artikel: ook de gangbare korte vorm ("Den Bosch" voor 's-Hertogenbosch).
const PLAATSNAMEN = { "'s-Hertogenbosch": ["den bosch", "s-hertogenbosch"], "Den Haag": ["den haag", "s-gravenhage"] };

function kandidaten(t) {
  const n = t.naam.replace(/\s+/g, " ").trim();
  const metPlaats = n.toLowerCase().includes(t.plaats.toLowerCase()) ? [] : [`${n} (${t.plaats})`, `${n} ${t.plaats}`];
  return [...new Set([n, ...metPlaats, `${n} (theater)`, `${n} (schouwburg)`])];
}

async function zoekFoto(t) {
  const plaatsen = (PLAATSNAMEN[t.plaats] || [t.plaats]).map(kaal);
  for (const taal of t.land === "BE" ? ["nl", "fr", "en"] : ["nl", "en"]) {
    for (const titel of kandidaten(t)) {
      let html;
      try { html = await getText(`https://${taal}.wikipedia.org/wiki/${encodeURIComponent(titel.replace(/ /g, "_"))}`); }
      catch { continue; }
      if (/id="disambigbox"|class="[^"]*dmbox/.test(html)) continue;
      const inleiding = (html.match(/<p[ >][\s\S]*?<\/p>/g) || []).map(stripTags).filter((x) => x.length > 40).slice(0, 2).join(" ");
      if (!ZAAL.test(inleiding) || !plaatsen.some((p) => kaal(inleiding).includes(p))) continue;
      const q = html.match(/"wgWikibaseItemId":"(Q\d+)"/)?.[1];
      if (!q) continue;
      const r = await commonsFoto(q, { breedte: 960 });
      if (!r.foto) return r;
      const bestand = `/fotos/theaters/${t.id}.jpg`;
      writeFileSync(join(root, "public", bestand), r.buf);
      const besch = r.foto.beschrijving?.taal === "nl" ? r.foto.beschrijving.tekst.replace(/\s*\.$/, "") : "";
      const alt = besch && besch.length <= 125 && kaal(besch).includes(kaal(t.naam).split(" ").at(-1)) ? besch : `${t.naam} in ${t.plaats}`;
      return { foto: { bestand, alt, ...r.foto } };
    }
  }
  return { reden: "geen passend Wikipedia-artikel" };
}

let gevonden = 0;
const redenen = {};
for (const t of theaters) {
  if (alleen ? !alleen.includes(t.id) : !metVoorstellingen.has(t.id)) continue;
  if (t.foto === false) continue;
  if (t.foto && !alleen && existsSync(join(root, "public", t.foto.bestand))) continue;
  try {
    const r = await zoekFoto(t);
    if (r.foto) { t.foto = r.foto; gevonden++; console.log(`✓ ${t.naam}, ${t.plaats} (${r.foto.licentie}, ${r.foto.maker})`); }
    else { delete t.foto; redenen[r.reden] = (redenen[r.reden] || 0) + 1; }
  } catch (e) {
    const k = `fout: ${e.message.slice(0, 60)}`;
    redenen[k] = (redenen[k] || 0) + 1;
  }
}
writeFileSync(pad, JSON.stringify(theaters, null, 2) + "\n");
console.log(`\n${gevonden} foto's gevonden.`, redenen);
