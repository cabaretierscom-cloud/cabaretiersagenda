// Zoekt rechtenvrije foto's van artiesten: Wikipedia-artikel -> Wikidata-afbeelding (P18) ->
// licentie op Wikimedia Commons. Alleen vrije licenties (CC0, publiek domein, CC BY, CC BY-SA)
// en alleen als het artikel duidelijk over een cabaretier of comedian gaat.
// De foto komt in public/fotos/<id>.jpg, de naamsvermelding in data/artiesten.json (veld `foto`).
// Controleer nieuwe foto's altijd met het oog; zet `"foto": false` bij een artiest om er nooit een te zoeken.
// Gebruik: npm run fotos            (alleen artiesten zonder foto)
//          npm run fotos -- --opnieuw (alles opnieuw controleren)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getText } from "./lib/http.mjs";
import { stripTags } from "./lib/html.mjs";
import { jpegMaten, fotoInfo, commonsFoto } from "./lib/commons.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pad = join(root, "data", "artiesten.json");
const artiesten = JSON.parse(readFileSync(pad, "utf8"));
const opnieuw = process.argv.includes("--opnieuw");
// --alleen=id1,id2 om een paar artiesten te proberen
// --aanvullen: beschrijving, datum en maten toevoegen aan foto's die er al zijn
const aanvullen = process.argv.includes("--aanvullen");
const alleen = process.argv.find((x) => x.startsWith("--alleen="))?.slice(9).split(",");

// Het artikel moet over cabaret of comedy gaan; anders is het misschien een naamgenoot.
const VAK = /cabaretier|cabaretière|cabaret|comedian|komiek|humorist|stand-up|standup|kleinkunst|conférencier|conferencier|imitator|komediant/i;

// Alt-tekst: de Nederlandse beschrijving van Commons als die kort is en de artiest noemt,
// anders "Foto van <naam>". Controleer en verbeter alt-teksten van nieuwe foto's met de hand.
function altTekst(a, { beschrijving }) {
  const t = beschrijving?.taal === "nl" ? beschrijving.tekst.replace(/\s*\.$/, "") : "";
  return t && t.length <= 125 && t.toLowerCase().includes(a.naam.toLowerCase()) ? t : `Foto van ${a.naam}`;
}

async function zoekFoto(a) {
  // 1. Wikipedia-artikel (eerst Nederlands, dan Engels)
  for (const taal of ["nl", "en"]) {
    let html;
    try { html = await getText(`https://${taal}.wikipedia.org/wiki/${encodeURIComponent(a.naam.replace(/ /g, "_"))}`); }
    catch { continue; }
    if (/id="disambigbox"|class="[^"]*dmbox/.test(html)) continue;
    // De inleiding: de eerste twee alinea's met tekst.
    const eersteAlinea = (html.match(/<p[ >][\s\S]*?<\/p>/g) || []).map(stripTags).filter((t) => t.length > 40).slice(0, 2).join(" ");
    if (!VAK.test(eersteAlinea)) continue;
    const q = html.match(/"wgWikibaseItemId":"(Q\d+)"/)?.[1];
    if (!q) continue;
    // 2. Wikidata-afbeelding (P18) met licentie van Commons, 3. verkleind downloaden
    const r = await commonsFoto(q);
    if (!r.foto) return r;
    writeFileSync(join(root, "public", "fotos", `${a.id}.jpg`), r.buf);
    return { foto: { bestand: `/fotos/${a.id}.jpg`, alt: altTekst(a, r.foto), ...r.foto } };
  }
  return { reden: "geen passend Wikipedia-artikel" };
}

if (aanvullen) {
  for (const a of artiesten) {
    if (!a.foto?.bestand) continue;
    const buf = readFileSync(join(root, "public", a.foto.bestand));
    Object.assign(a.foto, jpegMaten(buf), fotoInfo(await getText(a.foto.bron)));
    console.log(`${a.naam}: ${a.foto.beschrijving?.tekst || "(geen beschrijving)"}`);
  }
  writeFileSync(pad, JSON.stringify(artiesten, null, 2) + "\n");
  process.exit(0);
}

let gevonden = 0;
const redenen = {};
for (const a of artiesten) {
  if (alleen && !alleen.includes(a.id)) continue;
  // foto: false betekent: bewust geen foto (bijv. een logo of een verkeerde persoon).
  if (a.foto === false) continue;
  if (a.foto && !opnieuw && existsSync(join(root, "public", a.foto.bestand))) continue;
  try {
    const r = await zoekFoto(a);
    if (r.foto) { a.foto = r.foto; gevonden++; console.log(`✓ ${a.naam} (${r.foto.licentie}, ${r.foto.maker})`); }
    else { delete a.foto; redenen[r.reden] = (redenen[r.reden] || 0) + 1; }
  } catch (e) {
    redenen[`fout: ${e.message.slice(0, 60)}`] = (redenen[`fout: ${e.message.slice(0, 60)}`] || 0) + 1;
  }
}
writeFileSync(pad, JSON.stringify(artiesten, null, 2) + "\n");
console.log(`\n${gevonden} foto's gevonden.`, redenen);
