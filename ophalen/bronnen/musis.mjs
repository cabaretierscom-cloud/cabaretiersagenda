// Musis & Stadstheater Arnhem: twee zalen, één site. Elke speeldatum heeft een eigen pagina
// (/nl/agenda/<voorstelling>/<nummer>) met in het infoblok: "do 12 januari 2027 - 20:15",
// artiest (<h1>), titel (<h2>), genre en zaal ("Stadstheater Arnhem, Grote Zaal").
import { getText } from "../lib/http.mjs";
import { sitemapUrls, stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const BASIS = "https://www.musisenstadstheater.nl";
const MAANDEN = { januari: 1, februari: 2, maart: 3, april: 4, mei: 5, juni: 6, juli: 7, augustus: 8, september: 9, oktober: 10, november: 11, december: 12 };
// De sitemap bevat ook alle oude speeldata; de nummers lopen op, dus de hoogste zijn de komende.
const AANTAL = 900;

export default {
  id: "musis",
  naam: "Musis & Stadstheater Arnhem",
  theaters: [
    { id: "stadstheater-arnhem", naam: "Stadstheater Arnhem", plaats: "Arnhem", land: "NL", soort: "theater", website: BASIS },
    { id: "musis-arnhem", naam: "Musis Arnhem", plaats: "Arnhem", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const alle = await sitemapUrls(`${BASIS}/sitemap.xml`, { filter: (u) => /\/nl\/agenda\/[^/]+\/\d+$/.test(u) });
    const nummer = (u) => Number(u.match(/\/(\d+)$/)[1]);
    const urls = alle.sort((a, b) => nummer(b) - nummer(a)).slice(0, AANTAL);
    log(`${alle.length} speeldata in de sitemap, de ${urls.length} nieuwste bekeken`);
    const out = [];
    let oudste = "9999";
    for (const url of urls) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const blok = html.match(/<div class="info-box event[^"]*" data-event-id="(\d+)">([\s\S]*?)<div class="d-flex/);
      if (!blok || blok[1] !== String(nummer(url))) continue;
      const d = stripTags(blok[2].match(/<div class="h5[^"]*">([\s\S]*?)<\/div>/)?.[1]).match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})(?:\s*-\s*(\d{1,2})[:.](\d{2}))?/i);
      if (!d || !MAANDEN[d[2].toLowerCase()]) continue;
      const datum = `${d[3]}-${String(MAANDEN[d[2].toLowerCase()]).padStart(2, "0")}-${d[1].padStart(2, "0")}`;
      if (datum < oudste) oudste = datum;
      const genre = herkenGenre([...blok[2].matchAll(/<div class="h6">([^<]*)<\/div>/g)].map((m) => m[1]));
      if (!genre || datum < vandaag) continue;
      const artiest = netteNaam(stripTags(blok[2].match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]));
      const onder = netteHoofdletters(stripTags(blok[2].match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1]));
      const zaal = stripTags(blok[2].match(/<div class="fw-bold">([^<]*)<\/div>/)?.[1]).toLowerCase();
      // Knop in het infoblok: "uitverkocht", "geannuleerd" of de kaartlink.
      const knop = stripTags(html.slice(blok.index).match(/<a class="btn[^"]*"[^>]*>([\s\S]*?)<\/a>/)?.[1]).toLowerCase();
      const gekeerd = artiestOfTitel(artiest, (onder || artiest).replace(/\s*[-–(]\s*(try[ -]?out|premi[eè]re|reprise)\)?\s*$/i, "").trim());
      const titel = gekeerd.titel;
      out.push({
        theater: zaal.includes("musis") ? "musis-arnhem" : "stadstheater-arnhem",
        artiesten: gekeerd.artiest ? [gekeerd.artiest] : [],
        titel,
        genre: herkenGenre(titel) === "oudejaarsconference" ? "oudejaarsconference" : genre,
        datum,
        tijd: d[4] ? `${d[4].padStart(2, "0")}:${d[5]}` : null,
        status: /geannuleerd|afgelast/.test(knop) ? "geannuleerd" : /uitverkocht|wachtlijst/.test(knop) ? "uitverkocht" : "gepland",
        soort: herkenSoort(onder),
        bron: url,
      });
    }
    // Ter controle: lag de oudste bekeken speeldatum in het verleden, dan zijn alle komende meegenomen.
    log(`oudste bekeken speeldatum: ${oudste}${oudste >= vandaag ? " (LET OP: mogelijk niet alles meegenomen, verhoog AANTAL)" : ""}`);
    return out;
  },
};
