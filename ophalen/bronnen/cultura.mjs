// Cultura, Ede. Elke speeldatum heeft een eigen pagina (/agenda/<naam>-<id>/) met artiest (<h1>),
// "Titel | Try out" als ondertitel, een lijst met Locatie en Start, de kaartknop en genrelabels.
import { getText } from "../lib/http.mjs";
import { sitemapUrls, stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const BASIS = "https://cultura-ede.nl";
const MAANDEN = { januari: 1, februari: 2, maart: 3, april: 4, mei: 5, juni: 6, juli: 7, augustus: 8, september: 9, oktober: 10, november: 11, december: 12 };

export default {
  id: "cultura",
  naam: "Cultura Ede",
  theaters: [
    { id: "cultura-ede", naam: "Cultura", plaats: "Ede", land: "NL", soort: "cultuurcentrum", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const urls = await sitemapUrls(`${BASIS}/sitemap.xml`, { filter: (u) => /\/agenda\/[^/]+-\d+\/?$/.test(u) || /sitemap/.test(u) });
    const paginas = urls.filter((u) => /\/agenda\//.test(u));
    log(`${paginas.length} agendapagina's in de sitemap`);
    const out = [];
    for (const url of paginas) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const genre = herkenGenre([...(html.match(/<div class="course-detail__tags">([\s\S]*?)<\/div>/)?.[1] || "").matchAll(/tag__text">([^<]+)</g)].map((m) => m[1]));
      if (!genre) continue;
      const veld = (naam) => stripTags(html.match(new RegExp(`course-detail__category">${naam}</span>\\s*<span class="course-detail__txt">([^<]*)<`))?.[1]);
      const d = veld("Start").match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})\s+(\d{1,2}):(\d{2})/i);
      if (!d || !MAANDEN[d[2].toLowerCase()]) continue;
      const datum = `${d[3]}-${String(MAANDEN[d[2].toLowerCase()]).padStart(2, "0")}-${d[1].padStart(2, "0")}`;
      if (datum < vandaag) continue;
      let h1 = stripTags(html.match(/<h1 class="[^"]*course-detail__h1">([\s\S]*?)<\/h1>/)?.[1]);
      // "Hokjesdenker [geannuleerd]"
      const geannuleerd = /\[\s*(geannuleerd|afgelast)\s*\]/i.test(h1);
      h1 = h1.replace(/\s*\[[^\]]*\]\s*/g, " ").trim()
        // "Thijs van de Meeberg: Baby Reindeer": de artiest staat voor de dubbele punt.
        .replace(/:\s.*$/, "");
      const onder = stripTags(html.match(/course-detail__h1">[\s\S]*?<\/h1>\s*<p class="[^"]*subtitle[^"]*">([\s\S]*?)<\/p>/)?.[1]);
      // "Gelukskoekje | Try out": het deel na de streep is de soort.
      if (/blind date/i.test(`${h1} ${onder}`)) continue;
      const [titelRuw = "", ...rest] = onder.split(/\s*\|\s*/);
      // "Eindspel - Try out"
      const titelDeel = titelRuw.replace(/\s*[-–(]\s*(try[ -]?out|premi[eè]re|reprise)\)?\s*$/i, "").trim();
      const { artiest, titel } = artiestOfTitel(titelDeel ? netteNaam(h1) : null, netteHoofdletters((titelDeel || h1).replace(/\.$/, "")));
      if (!titel) continue;
      const knop = stripTags(html.match(/js-button-register[^>]*>([\s\S]*?)<\/a>/)?.[1]).toLowerCase();
      out.push({
        theater: "cultura-ede",
        artiesten: artiest ? [artiest] : [],
        titel,
        genre: /oudejaars/i.test(titel) ? "oudejaarsconference" : genre,
        datum,
        tijd: `${d[4].padStart(2, "0")}:${d[5]}`,
        status: geannuleerd || /geannuleerd|afgelast/.test(knop) ? "geannuleerd" : /uitverkocht|wachtlijst/.test(knop) ? "uitverkocht" : "gepland",
        soort: herkenSoort(rest.join(" "), onder),
        bron: url,
      });
    }
    return out;
  },
};
