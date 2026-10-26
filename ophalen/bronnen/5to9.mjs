// 5to9, impresariaat van Vlaamse comedians. De pagina /live/ geeft alle speeldata van hun artiesten:
// datum, artiest, "Voorstelling (tag), Plaats" en een kaartlink, maar geen zaal. De zaal staat op de
// pagina van de artiest (/<artiest>/, tabel "Shows": datum, zaal, plaats, kaartlink); die koppelen we
// via datum en kaartlink. Werkt als een speellijst (soort "speellijst"): samenvoegen.mjs koppelt de zaal
// aan een bekend theater en slaat avonden over die een theaterbron al heeft.
import { readFileSync } from "node:fs";
import { getText } from "../lib/http.mjs";
import { stripTags } from "../lib/html.mjs";
import { herkenSoort } from "../lib/normaliseer.mjs";
import { zaalSite } from "./speellijsten.mjs";

const BASIS = "https://www.5to9.be";
const MAANDEN = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, okt: 10, nov: 11, dec: 12 };
// Geen cabaret of comedy: een chansonnier, een coverband, een toneelstuk en een muziekvoorstelling.
const NIET = new Set(["Klaas", "Radio Guga", "Moeder Theresa", "Astrid Stockman"]);
// Humo's Comedy Cup Finalistentour: de finalisten en de MC volgens de promotekst van 5to9.
const GROEP = { HCC: { artiesten: ["Bregje Iding", "Jeroen Dyck", "Peter Kluppels", "MC Jarno Boone"], titel: "Humo's Comedy Cup Finalistentour" } };
const NAMEN = { "Bert Gabriels": "Bert Gabriëls" };
const GENRE = { "Pieter Verelst": "cabaret", Gili: "cabaret" };
const slugVan = (n) => n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const host = (u) => { try { return new URL(u.startsWith("//") ? `https:${u}` : u).hostname.replace(/^www\./, ""); } catch { return null; } };

// Bekende zalen op hun website, voor rijen zonder zaalnaam (de finalistentour).
const bekendeZalen = JSON.parse(readFileSync(new URL("../../data/theaters.json", import.meta.url), "utf8"));
const zalenOpSite = new Map(bekendeZalen.filter((t) => t.website).map((t) => [host(t.website), t.id]));
// Nederlandse plaatsen die niet als "(NL)" gemarkeerd zijn (Boekelo): land volgens de zalen die we al kennen.
const landVan = new Map();
for (const t of bekendeZalen) landVan.set(slugVan(t.plaats), landVan.has(slugVan(t.plaats)) && landVan.get(slugVan(t.plaats)) !== t.land ? null : t.land);
const NL_PLAATSEN = new Set(["boekelo"]);

export default {
  id: "5to9",
  naam: "Agenda van 5to9",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const live = await getText(`${BASIS}/live/`);
    const rijen = [];
    for (const tr of live.split(/<tr>/).slice(1)) {
      const d = tr.match(/class="dedate">\s*(\d{1,2})\s+([A-Za-z]{3})[\s\S]*?class="year">\s*(\d{4})/);
      const artiest = stripTags(tr.match(/class="artist">([\s\S]*?)<\/div>/)?.[1]);
      const show = stripTags(tr.match(/class="show">([\s\S]*?)<\/td>/)?.[1]);
      const link = tr.match(/<a href="([^"]+)"[^>]*><nobr>([^<]*)<\/nobr>/);
      if (!d || !artiest || !show || !MAANDEN[d[2].toLowerCase()]) continue;
      const datum = `${d[3]}-${String(MAANDEN[d[2].toLowerCase()]).padStart(2, "0")}-${d[1].padStart(2, "0")}`;
      if (datum < vandaag || NIET.has(artiest)) continue;
      rijen.push({ datum, artiest, show, link: link?.[1].trim() || null, knop: link?.[2] || "", pagina: tr.match(/window\.open\('\/\/www\.5to9\.be\/([^']*)'/)?.[1] });
    }
    log(`${rijen.length} komende speeldata op /live/`);

    // Zalen per artiest: datum|kaartlink en datum|plaats -> zaal.
    const zalen = new Map();
    for (const artiest of new Set(rijen.map((r) => r.artiest))) {
      if (GROEP[artiest]) continue;
      let html;
      try { html = await getText(`${BASIS}/${slugVan(artiest)}/`); } catch (e) { log(`${artiest}: geen artiestpagina (${e.message})`); continue; }
      for (const [, dag, maand, jaar, zaal, plaats, link] of html.matchAll(/<td class="date">(\d{2})\/(\d{2})<span class=mobhide>\/(\d{2})<\/span><\/td>\s*<td class=location>([^<]*)<\/td>\s*<td class=city>([^<]*)<\/td>\s*<td>(?:<a href="([^"]*)")?/g)) {
        const datum = `20${jaar}-${maand}-${dag}`;
        const z = stripTags(zaal).replace(/&#\d+;/g, "").replace(/\s+-\s+(premi[eè]re|try-?out)$/i, "").trim();
        if (link) zalen.set(`${artiest}|${datum}|${link}`, z);
        zalen.set(`${artiest}|${datum}|${slugVan(stripTags(plaats).replace(/\s*\(.*\)$/, ""))}`, z);
      }
    }

    const out = [];
    let zonderZaal = 0;
    for (const r of rijen) {
      const m = r.show.match(/^(.*),\s*([^,]+)$/);
      if (!m) continue;
      const plaats = m[2].replace(/\s*\((NL|B|BE)\)\s*$/i, "").replace(/^'s Hertogenbosch$/i, "'s-Hertogenbosch").trim();
      const land = /\(NL\)/i.test(m[2]) || landVan.get(slugVan(plaats)) === "NL" || NL_PLAATSEN.has(slugVan(plaats)) ? "NL" : "BE";
      // "Altijd Aan (NL 26-27)", "Bedankt om te komen - NL (Try-out)", "Tijd voor mij (theater)"
      // Een warm-upshow is een try-out.
      const soort = herkenSoort(m[1]) || (/warm-?up/i.test(m[1]) ? "try-out" : null);
      let titel = m[1].replace(/\s*\((?:NL\s*)?\d{2}-\d{2}\)|\s*\((?:try[ -]?out|premi[eè]re|reprise|theater|NL|warm-?up(?: show)?)\)/gi, "").replace(/\s+-\s+NL$/i, "").trim();
      const groep = GROEP[r.artiest];
      const naam = NAMEN[r.artiest] || r.artiest;
      const zaal = zalen.get(`${r.artiest}|${r.datum}|${r.link}`) || zalen.get(`${r.artiest}|${r.datum}|${slugVan(plaats)}`);
      let theater;
      if (zaal) theater = { zoeken: true, naam: zaal, plaats, land, website: zaalSite(r.link ? [r.link] : [], `${BASIS}/`, naam) };
      else if (r.link && zalenOpSite.has(host(r.link))) theater = zalenOpSite.get(host(r.link));
      else { zonderZaal++; continue; }
      if (groep) titel = groep.titel;
      const standup = /^stand-?up$/i.test(titel);
      out.push({
        theater,
        artiesten: groep ? groep.artiesten : [naam],
        titel: standup ? "Stand-up" : titel,
        genre: standup ? "stand-up" : GENRE[naam] || "stand-up",
        datum: r.datum,
        tijd: null,
        status: /uitverkocht|wachtlijst/i.test(r.knop) ? "uitverkocht" : /geannuleerd|afgelast/i.test(r.knop) ? "geannuleerd" : "gepland",
        soort,
        // De kaartlink is de pagina van de zaal over deze avond; anders de pagina van de artiest bij 5to9.
        bron: /^(https?:)?\/\//.test(r.link || "") ? (r.link.startsWith("//") ? `https:${r.link}` : r.link) : `${BASIS}/${r.pagina || ""}`,
      });
    }
    // Een titel die eigenlijk van een andere artiest is (Bas Birker met "Altijd Aan") is een vergissing in de lijst.
    const vanWie = new Map();
    for (const r of out) { const k = r.titel.toLowerCase(); if (r.titel !== "Stand-up") (vanWie.get(k) || vanWie.set(k, new Map()).get(k)).set(r.artiesten[0], (vanWie.get(k).get(r.artiesten[0]) || 0) + 1); }
    const klopt = (r) => { const m = vanWie.get(r.titel.toLowerCase()); if (!m || m.size < 2) return true; const [baas] = [...m].sort((a, b) => b[1] - a[1])[0]; return baas === r.artiesten[0]; };
    const goed = out.filter(klopt);
    log(`${goed.length} speeldata, ${zonderZaal} overgeslagen omdat de zaal onbekend is, ${out.length - goed.length} met de titel van een andere artiest`);
    return goed;
  },
};
