// Zoekt rechtenvrije foto's van artiesten: Wikipedia-artikel -> Wikidata-afbeelding (P18) ->
// licentie op Wikimedia Commons. Alleen vrije licenties (CC0, publiek domein, CC BY, CC BY-SA)
// en alleen als het artikel duidelijk over een cabaretier of comedian gaat.
// De foto komt in public/fotos/<id>.jpg, de naamsvermelding in data/artiesten.json (veld `foto`).
// Controleer nieuwe foto's altijd met het oog; zet `"foto": false` bij een artiest om er nooit een te zoeken.
// Gebruik: npm run fotos            (alleen artiesten zonder foto)
//          npm run fotos -- --opnieuw (alles opnieuw controleren)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { get, getText, getBestand } from "./lib/http.mjs";
import { decodeEntities, stripTags } from "./lib/html.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pad = join(root, "data", "artiesten.json");
const artiesten = JSON.parse(readFileSync(pad, "utf8"));
const opnieuw = process.argv.includes("--opnieuw");
// --alleen=id1,id2 om een paar artiesten te proberen
const alleen = process.argv.find((x) => x.startsWith("--alleen="))?.slice(9).split(",");

// Het artikel moet over cabaret of comedy gaan; anders is het misschien een naamgenoot.
const VAK = /cabaretier|cabaretière|cabaret|comedian|komiek|humorist|stand-up|standup|kleinkunst|conférencier|conferencier|imitator|komediant/i;
const VRIJ = /^(CC0|Public domain|PD|CC BY(-SA)? \d(\.\d)?|CC BY(-SA)?)/i;
// Wikimedia levert alleen vaste breedtes (o.a. 330, 500, 960).
const BREEDTE = 500;

function commonsThumb(bestand) {
  const naam = bestand.replace(/ /g, "_");
  const md5 = createHash("md5").update(naam).digest("hex");
  const enc = encodeURIComponent(naam);
  const ext = /\.(tiff?|svg)$/i.test(naam) ? ".jpg" : "";
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5.slice(0, 2)}/${enc}/${BREEDTE}px-${enc}${ext}`;
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
    // 2. Wikidata: hoofdafbeelding (P18)
    const data = JSON.parse(await getText(`https://www.wikidata.org/wiki/Special:EntityData/${q}.json`));
    const bestand = data.entities[q]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (!bestand) return { reden: "geen foto op Wikidata" };
    // 3. Commons: licentie en maker
    const filePagina = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(bestand.replace(/ /g, "_"))}`;
    const fp = await getText(filePagina);
    // Een bestand kan meerdere licenties hebben (bijv. GFDL én CC BY-SA); kies de eerste vrije.
    const shorts = [...fp.matchAll(/class="licensetpl(?:_|&#95;)short"[^>]*>([\s\S]*?)<\/span>/g)].map((m) => decodeEntities(stripTags(m[1])).trim());
    const links = [...fp.matchAll(/class="licensetpl(?:_|&#95;)link"[^>]*>([\s\S]*?)<\/span>/g)].map((m) => decodeEntities(m[1]).trim());
    const i = shorts.findIndex((l) => VRIJ.test(l));
    const licentie = i >= 0 ? shorts[i] : shorts[0];
    const licentieUrl = i >= 0 ? links[i] || null : null;
    if (!licentie || !VRIJ.test(licentie)) return { reden: `licentie niet vrij genoeg (${licentie || "onbekend"})` };
    // Naamsvermelding zoals de maker die vraagt, anders de auteur uit de bestandsinformatie.
    const attr = fp.match(/class="licensetpl(?:_|&#95;)attr"[^>]*>([\s\S]*?)<\/span>/)?.[1];
    const makerHtml = attr || fp.match(/id="fileinfotpl(?:_|&#95;)aut"[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/)?.[1] || "";
    const maker = decodeEntities(stripTags(makerHtml)).replace(/\s+/g, " ").split(/ (?:You are free|Je bent vrij|This file|Dit bestand)/)[0].trim().slice(0, 120) || "Wikimedia Commons";
    // 4. Foto downloaden (verkleind)
    const buf = await getBestand(commonsThumb(bestand));
    writeFileSync(join(root, "public", "fotos", `${a.id}.jpg`), buf);
    return { foto: { bestand: `/fotos/${a.id}.jpg`, maker, licentie, licentieUrl, bron: filePagina, wikidata: q } };
  }
  return { reden: "geen passend Wikipedia-artikel" };
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
