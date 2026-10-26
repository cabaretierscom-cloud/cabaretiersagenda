// Foto's van Wikimedia Commons: licentie, maker, beschrijving en een verkleinde versie.
// Gebruikt door ophalen/fotos.mjs (artiesten) en ophalen/theaterfotos.mjs (zalen).
import { createHash } from "node:crypto";
import { getText, getBestand } from "./http.mjs";
import { decodeEntities, stripTags } from "./html.mjs";

// Alleen vrije licenties: CC0, publiek domein, CC BY en CC BY-SA.
export const VRIJ = /^(CC0|Public domain|PD|CC BY(-SA)? \d(\.\d)?|CC BY(-SA)?)/i;
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
export function fotoInfo(fp) {
  const td = fp.match(/<td class="description">([\s\S]*?)<\/td>/)?.[1] || "";
  const inTaal = (taal) => td.match(new RegExp(`<div class="description ${taal}"[\\s\\S]*?<\\/span>([\\s\\S]*?)<\\/div>`))?.[1];
  const nl = inTaal("nl"), en = inTaal("en");
  const tekst = (html) => decodeEntities(stripTags(html || "")).replace(/\s+/g, " ").trim().slice(0, 200);
  const beschrijving = nl ? { tekst: tekst(nl), taal: "nl" } : en ? { tekst: tekst(en), taal: "en" } : td && !/<div class="description/.test(td) ? { tekst: tekst(td), taal: "?" } : null;
  const datum = fp.match(/<time class="dtstart" datetime="(\d{4}-\d{2}-\d{2})/)?.[1] || null;
  return { beschrijving: beschrijving?.tekst ? beschrijving : null, datum };
}

export function commonsThumb(bestand, breedte = BREEDTE) {
  const naam = bestand.replace(/ /g, "_");
  const md5 = createHash("md5").update(naam).digest("hex");
  const enc = encodeURIComponent(naam);
  const ext = /\.(tiff?|svg)$/i.test(naam) ? ".jpg" : "";
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5.slice(0, 2)}/${enc}/${breedte}px-${enc}${ext}`;
}

// Hoofdafbeelding (P18) van een Wikidata-item, met licentie en naamsvermelding van Commons.
// Geeft { buf, foto: { maker, licentie, licentieUrl, bron, ...maten, ...info } } of { reden }.
export async function commonsFoto(q, { breedte } = {}) {
  const data = JSON.parse(await getText(`https://www.wikidata.org/wiki/Special:EntityData/${q}.json`));
  const bestand = data.entities[q]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if (!bestand) return { reden: "geen foto op Wikidata" };
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
  const buf = await getBestand(commonsThumb(bestand, breedte));
  return { buf, foto: { maker, licentie, licentieUrl, bron: filePagina, wikidata: q, ...jpegMaten(buf), ...fotoInfo(fp) } };
}
