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
// --aanvullen: beschrijving, datum en maten toevoegen aan foto's die er al zijn
const aanvullen = process.argv.includes("--aanvullen");
const alleen = process.argv.find((x) => x.startsWith("--alleen="))?.slice(9).split(",");

// Het artikel moet over cabaret of comedy gaan; anders is het misschien een naamgenoot.
const VAK = /cabaretier|cabaretière|cabaret|comedian|komiek|humorist|stand-up|standup|kleinkunst|conférencier|conferencier|imitator|komediant/i;
const VRIJ = /^(CC0|Public domain|PD|CC BY(-SA)? \d(\.\d)?|CC BY(-SA)?)/i;
// Wikimedia levert alleen vaste breedtes (o.a. 330, 500, 960).
const BREEDTE = 500;

// Breedte en hoogte uit de kop van een JPEG-bestand (voor width/height en de gestructureerde gegevens).
export function jpegMaten(buf) {
  for (let i = 2; i < buf.length - 9; ) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { hoogte: buf.readUInt16BE(i + 5), breedte: buf.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return {};
}

// Beschrijving en datum van de foto op de Commons-bestandspagina; liefst in het Nederlands.
function fotoInfo(fp) {
  const td = fp.match(/<td class="description">([\s\S]*?)<\/td>/)?.[1] || "";
  const inTaal = (taal) => td.match(new RegExp(`<div class="description ${taal}"[\\s\\S]*?<\\/span>([\\s\\S]*?)<\\/div>`))?.[1];
  const nl = inTaal("nl"), en = inTaal("en");
  const tekst = (html) => decodeEntities(stripTags(html || "")).replace(/\s+/g, " ").trim().slice(0, 200);
  const beschrijving = nl ? { tekst: tekst(nl), taal: "nl" } : en ? { tekst: tekst(en), taal: "en" } : td && !/<div class="description/.test(td) ? { tekst: tekst(td), taal: "?" } : null;
  const datum = fp.match(/<time class="dtstart" datetime="(\d{4}-\d{2}-\d{2})/)?.[1] || null;
  return { beschrijving: beschrijving?.tekst ? beschrijving : null, datum };
}

function commonsThumb(bestand) {
  const naam = bestand.replace(/ /g, "_");
  const md5 = createHash("md5").update(naam).digest("hex");
  const enc = encodeURIComponent(naam);
  const ext = /\.(tiff?|svg)$/i.test(naam) ? ".jpg" : "";
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5.slice(0, 2)}/${enc}/${BREEDTE}px-${enc}${ext}`;
}

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
    const info = fotoInfo(fp);
    return { foto: { bestand: `/fotos/${a.id}.jpg`, alt: altTekst(a, info), maker, licentie, licentieUrl, bron: filePagina, wikidata: q, ...jpegMaten(buf), ...info } };
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
