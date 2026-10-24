// Stadsgehoorzaal Vlaardingen. Voorstellingspagina's uit de sitemap (/programma/<naam>); genre als
// label boven de kop, artiest in <h1> (soms met "- UITVERKOCHT"), titel in <h2>. Elke speeldatum
// staat als rij ("di 09 maart 2027 - 20:15") met een knop ernaast.
import { getText } from "../lib/http.mjs";
import { sitemapUrls, stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const BASIS = "https://stadsgehoorzaal.nl";
const MAANDEN = { januari: 1, februari: 2, maart: 3, april: 4, mei: 5, juni: 6, juli: 7, augustus: 8, september: 9, oktober: 10, november: 11, december: 12 };

export default {
  id: "vlaardingen",
  naam: "Stadsgehoorzaal Vlaardingen",
  theaters: [
    { id: "stadsgehoorzaal-vlaardingen", naam: "Stadsgehoorzaal Vlaardingen", plaats: "Vlaardingen", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const urls = await sitemapUrls(`${BASIS}/sitemap.xml`, { filter: (u) => /\/programma\/[^/?]+$/.test(u) });
    log(`${urls.length} voorstellingen in de sitemap`);
    const out = [];
    for (const url of urls) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const kop = html.match(/<div class="flex flex-col">\s*<h1>[\s\S]*?<\/h1>(?:\s*<h2>[\s\S]*?<\/h2>)?/)?.[0];
      if (!kop) continue;
      const labels = [...html.slice(Math.max(0, html.indexOf(kop) - 3000), html.indexOf(kop)).matchAll(/rounded-tag[^"]*">([^<]+)</g)].map((m) => m[1].trim());
      const genre = herkenGenre(labels);
      if (!genre) continue;
      const boven = stripTags(kop.match(/<h1>([\s\S]*?)<\/h1>/)?.[1]).replace(/\s*-\s*(uitverkocht|extra voorstelling|nieuwe datum)\s*$/i, "");
      const onder = stripTags(kop.match(/<h2>([\s\S]*?)<\/h2>/)?.[1]);
      const zonder = (s) => s.replace(/\s*[-–(]\s*(try[ -]?out|premi[eè]re|reprise)\)?\s*$/i, "").trim();
      // "Ice presenteert Khalid Alterch": de artiest staat na "presenteert".
      let { artiest, titel } = artiestOfTitel(onder ? netteNaam(zonder(boven).replace(/^.+?\s+presenteert\s+/i, "")) : null, netteHoofdletters(zonder(onder || boven).replace(/\.$/, "")));
      if (!titel) continue;
      // "Duoprogramma Podium Putman" met de twee namen als ondertitel.
      let artiesten = artiest ? [artiest] : [];
      if (/^duoprogramma/i.test(boven) && / en /.test(onder)) { artiesten = onder.split(/\s+en\s+/).map(netteNaam); titel = netteHoofdletters(boven); }
      for (const rij of html.split(/<div data-ticket-row/).slice(1)) {
        const d = stripTags(rij.slice(0, 600)).match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})\s*-\s*(\d{1,2}):(\d{2})/i);
        if (!d || !MAANDEN[d[2].toLowerCase()]) continue;
        const datum = `${d[3]}-${String(MAANDEN[d[2].toLowerCase()]).padStart(2, "0")}-${d[1].padStart(2, "0")}`;
        if (datum < vandaag) continue;
        const knop = stripTags(rij.match(/<button[^>]*>([\s\S]*?)<\/button>/)?.[1]).toLowerCase();
        out.push({
          theater: "stadsgehoorzaal-vlaardingen",
          artiesten,
          titel,
          genre: /oudejaars/i.test(titel) ? "oudejaarsconference" : genre,
          datum,
          tijd: `${d[4].padStart(2, "0")}:${d[5]}`,
          status: /geannuleerd|afgelast/.test(knop) ? "geannuleerd" : /uitverkocht|wachtlijst/.test(knop) ? "uitverkocht" : "gepland",
          soort: herkenSoort(boven, onder),
          bron: url,
        });
      }
    }
    return out;
  },
};
