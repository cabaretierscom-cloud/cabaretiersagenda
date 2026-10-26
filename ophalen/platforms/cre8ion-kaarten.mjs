// Nieuwere versie van het Cre8ion-platform (Verkadefabriek, Mimik, Theater Kikker, Podium Hoge Woerd).
// Anders dan bij cre8ion.mjs staat er geen dataLayer-blok in de pagina. Wel:
//  - het genre vooraan in de omschrijving: <meta name="description" content="Cabaret - Een comedyconcert ...">
//  - "Artiest - Titel (reprise) | Zaalnaam" in de <title>
//  - per speeldatum een kaartrij: Datum "wo 18-11", Tijd "20:15 tot 21:45", Zaal "Kleine Zaal" en een
//    knop ("Bestel", "Uitverkocht"). Het jaartal ontbreekt; dat volgt uit de weekdag.
import { getText } from "../lib/http.mjs";
import { sitemapUrls, stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";
import { artiestEnTitel } from "./jsonld.mjs";

const WEEKDAGEN = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const waarde = (rij, klasse) => stripTags(rij.match(new RegExp(`<div class="${klasse} item">[\\s\\S]*?<span class="ticket-value">([\\s\\S]*?)</span>`))?.[1]);

// "wo 18-11" -> het eerstvolgende jaar (vanaf vorig jaar) waarin 18 november een woensdag is.
function metJaar(tekst, vandaag) {
  const m = tekst.match(/^([a-z]{2})\w*\.?\s+(\d{1,2})-(\d{1,2})/i);
  if (!m) return null;
  const jaar = Number(vandaag.slice(0, 4));
  for (const j of [jaar, jaar + 1, jaar - 1]) {
    const d = `${j}-${m[3].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    if (WEEKDAGEN[new Date(`${d}T12:00:00Z`).getUTCDay()] === m[1].toLowerCase()) return d;
  }
  return null;
}

function status(knop) {
  const t = knop.toLowerCase();
  if (/geannuleerd|afgelast|vervalt/.test(t)) return "geannuleerd";
  if (/verplaatst/.test(t)) return "verplaatst";
  if (/uitverkocht|wachtlijst/.test(t)) return "uitverkocht";
  return "gepland";
}

/**
 * @param {object} o
 * @param {string} o.id, o.naam
 * @param {string} o.sitemap       adres van de sitemap
 * @param {RegExp} o.voorstelling  welke adressen uit de sitemap voorstellingen zijn
 * @param {object[]} o.theaters    zalen van deze bron; de eerste is de standaard
 * @param {object} [o.zalen]       deel van de zaalnaam op de pagina -> theater-id
 */
export function cre8ionKaarten(o) {
  return {
    id: o.id,
    naam: o.naam,
    theaters: o.theaters,

    async ophalen({ log, vandaag }) {
      const urls = await sitemapUrls(o.sitemap, { filter: (u) => o.voorstelling.test(u) });
      log(`${urls.length} pagina's in de sitemap`);
      const out = [];
      for (const url of [...new Set(urls)]) {
        let html;
        try { html = await getText(url); } catch (e) { if (!/HTTP 404/.test(e.message)) log(`overgeslagen: ${url} (${e.message})`); continue; }
        const beschrijving = stripTags(html.match(/<meta name="description" content="([^"]*)"/)?.[1]);
        const genre = herkenGenre(beschrijving.split(/\s+-\s+/)[0]);
        if (!genre) continue;
        const kop = stripTags(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]).replace(/\s*\|[^|]*$/, "");
        const soort = herkenSoort(kop, url);
        const zonderSoort = kop.replace(/\s*\((try[ -]?out|premi[eè]re|derni[eè]re|reprise)\)\s*/gi, " ").replace(/\s+[-–]\s*(try[ -]?out|premi[eè]re|reprise)\s*$/i, "").trim();
        const gevonden = artiestEnTitel(zonderSoort);
        const { artiest, titel } = artiestOfTitel(gevonden.artiest, gevonden.titel);
        if (!titel) continue;
        for (const rij of html.split(/<div class="ticket-row/).slice(1).map((r) => r.split(/<\/button>/)[0])) {
          const datum = metJaar(waarde(rij, "date"), vandaag);
          if (!datum || datum < vandaag) continue;
          const tijd = waarde(rij, "time").match(/(\d{1,2})[:.](\d{2})/);
          const zaal = waarde(rij, "location").toLowerCase();
          const theater = Object.entries(o.zalen || {}).find(([k]) => zaal.includes(k))?.[1] || o.theaters[0].id;
          out.push({
            theater,
            artiesten: artiest ? [netteNaam(artiest)] : [],
            titel: netteHoofdletters(titel),
            genre: herkenGenre(titel) === "oudejaarsconference" ? "oudejaarsconference" : genre,
            datum,
            tijd: tijd ? `${tijd[1].padStart(2, "0")}:${tijd[2]}` : null,
            status: status(stripTags(rij.match(/<button[^>]*>([\s\S]*)$/)?.[1] || "")),
            soort,
            bron: url,
          });
        }
      }
      return out;
    },
  };
}
