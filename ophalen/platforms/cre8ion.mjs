// Websiteplatform van The Cre8ion.Lab, gebruikt door o.a. Stadsschouwburg Utrecht,
// Schouwburg & Concertzaal Tilburg (kaartverkoop via Ticketmatic). MartiniPlaza draait er ook op,
// maar laadt de datums via /mvc/, wat robots.txt verbiedt.
// Werkwijze: alle voorstellingspagina's uit de sitemap openen. Het eerste dataLayer-blok
// op de pagina beschrijft de voorstelling zelf: "Titel - Artiest", genre, zaal en
// "dd-mm-jjjj / uu:mm". Labels (reprise, try-out) en de kaartknop (status) staan in de pagina.
import { getText } from "../lib/http.mjs";
import { sitemapUrls, stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";

const MAANDEN = { jan: 1, feb: 2, mrt: 3, maa: 3, apr: 4, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12 };

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
 * @param {object} [o.zalen]       deel van de zaalnaam op de pagina -> theater-id (bijv. "Kleine Zaal")
 * @param {number} [o.pauze]       extra pauze in ms tussen verzoeken
 */
export function cre8ion(o) {
  return {
    id: o.id,
    naam: o.naam,
    theaters: o.theaters,

    async ophalen({ log }) {
      const urls = await sitemapUrls(o.sitemap, { filter: (u) => o.voorstelling.test(u) });
      log(`${urls.length} voorstellingen in de sitemap`);
      const out = [];
      const meerdere = [];
      for (const url of urls) {
        let html;
        try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
        // Het eerste dataLayer-blok hoort bij de voorstelling zelf (de rest bij "Ook interessant"):
        // item_name "Titel - Artiest", item_category genre, item_category2 zaal, item_category3 "dd-mm-jjjj / uu:mm".
        const item = html.match(/item_name:\s*"([^"]*)"[\s\S]*?item_category:\s*"([^"]*)"(?:,\s*item_category2:\s*"([^"]*)")?(?:,\s*item_category3:\s*"([^"]*)")?/);
        if (!item) continue;
        const [, itemNaam, categorie, zaalTekst = "", wanneerTekst = ""] = item.map((x) => (x == null ? x : stripTags(x)));
        const info = html.match(/<div class="event-info-wrapper[\s\S]*?<div class="(?:mobile-dates|right)/)?.[0] || "";
        const items = [...info.matchAll(/<p class="item[^"]*">([\s\S]*?)<\/p>/g)].map((m) => stripTags(m[1]));
        const genre = herkenGenre(categorie, items);
        if (!genre) continue;

        const i = itemNaam.lastIndexOf(" - ");
        const titel = netteHoofdletters((i > 0 ? itemNaam.slice(0, i) : itemNaam).replace(/\.$/, "").trim());
        const artiest = i > 0 ? netteNaam(itemNaam.slice(i + 3).trim()) : null;
        const zaal = (zaalTekst + " " + (items[0] || "")).toLowerCase();
        const theater = Object.entries(o.zalen || {}).find(([n]) => zaal.includes(n.toLowerCase()))?.[1] || o.theaters[0].id;
        const knop = stripTags(html.match(/<div class="btn-wrapper[\s\S]*?<\/a>/)?.[0] || html.match(/class="btn btn-primary btn-ticket[\s\S]*?<\/a>/)?.[0] || "");

        const basis = {
          theater,
          artiesten: artiest ? [artiest] : [],
          titel,
          genre: herkenGenre(titel) === "oudejaarsconference" ? "oudejaarsconference" : genre,
          soort: herkenSoort(items.join(" "), itemNaam),
          bron: url,
        };
        const w = wanneerTekst.match(/^(\d{2})-(\d{2})-(\d{4})\s*\/\s*(\d{1,2})[:.](\d{2})/);
        if (w) {
          out.push({ ...basis, datum: `${w[3]}-${w[2]}-${w[1]}`, tijd: `${w[4].padStart(2, "0")}:${w[5]}`, status: status(knop) });
          continue;
        }
        // "Meerdere datums": per avond een ticket-block met "do <strong>03 dec</strong> 2026", tijd en knop.
        // (Tilburg laadt die lijst via /mvc/, dat robots.txt verbiedt; daar blijven ze weg.)
        const blokken = html.split(/<div class="ticket-block/).slice(1);
        let gevonden = 0;
        for (const blok of blokken) {
          const d = blok.match(/<p class="date-text">[^<]*<strong>\s*(\d{1,2})\s+([a-z]{3})[a-z]*\s*<\/strong>\s*(\d{4})/i);
          const t = blok.match(/time-text">\s*(\d{1,2})[:.](\d{2})/);
          if (!d || !MAANDEN[d[2].toLowerCase()]) continue;
          const eind = blok.indexOf("ticket-block");
          out.push({
            ...basis,
            datum: `${d[3]}-${String(MAANDEN[d[2].toLowerCase()]).padStart(2, "0")}-${d[1].padStart(2, "0")}`,
            tijd: t ? `${t[1].padStart(2, "0")}:${t[2]}` : null,
            status: status(stripTags(eind > 0 ? blok.slice(0, eind) : blok)),
          });
          gevonden++;
        }
        if (!gevonden) meerdere.push(url);
      }
      if (meerdere.length) log(`${meerdere.length} voorstellingen met meerdere datums nog niet verwerkt, bijv. ${meerdere[0]}`);
      return out;
    },
  };
}
