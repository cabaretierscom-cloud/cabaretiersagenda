// Theater De Purmaryn, Purmerend.
// Voorstellingspagina's uit de sitemap (/agenda/seizoen-.../<voorstelling>/). Elke pagina heeft
// genrelabels (<span class="tag">Cabaret</span>), de artiest in de kop en elke speeldatum als
// schema.org-TheaterEvent (naam = titel van de voorstelling, met offers per avond).
import { getText } from "../lib/http.mjs";
import { sitemapUrls, jsonLd, isEvent, stripTags } from "../lib/html.mjs";
import { lokaleDatumTijd, herkenGenre, herkenSoort, netteHoofdletters, netteNaam, schemaStatus } from "../lib/normaliseer.mjs";

const BASIS = "https://depurmaryn.nl";

export default {
  id: "purmaryn",
  naam: "Theater De Purmaryn",
  theaters: [
    { id: "de-purmaryn", naam: "Theater De Purmaryn", plaats: "Purmerend", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const seizoenStart = `${Number(vandaag.slice(0, 4)) - 1}`;
    const urls = await sitemapUrls(`${BASIS}/sitemap.xml`, {
      filter: (u) => { const m = u.match(/\/agenda\/seizoen-(\d{4})-\d{4}\/[^/]+\/?$/); return m && m[1] >= seizoenStart; },
    });
    log(`${urls.length} voorstellingen in de sitemap`);
    const out = [];
    for (const url of urls) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const kop = html.match(/<div class="headervisual-caption">([\s\S]*?)<\/h1>/)?.[1] || "";
      const genre = herkenGenre([...kop.matchAll(/<span class="tag[^"]*">([^<]*)<\/span>/g)].map((m) => stripTags(m[1])));
      if (!genre) continue;
      const artiest = netteNaam(stripTags(kop.match(/<h1[^>]*>([\s\S]*)$/)?.[1]));
      for (const ev of jsonLd(html).filter(isEvent)) {
        const w = lokaleDatumTijd(ev.startDate);
        if (!w) continue;
        const naam = stripTags(ev.name || "");
        const titel = netteHoofdletters(naam || artiest);
        const offers = [].concat(ev.offers || []);
        let status = schemaStatus(ev.eventStatus);
        if (status === "gepland" && offers.length && offers.every((o) => /SoldOut/i.test(o.availability || ""))) status = "uitverkocht";
        out.push({
          theater: "de-purmaryn",
          artiesten: artiest && artiest !== titel ? [artiest] : artiest ? [artiest] : [],
          titel,
          genre: herkenGenre(naam) === "oudejaarsconference" ? "oudejaarsconference" : genre,
          ...w,
          status,
          soort: herkenSoort(naam),
          bron: url,
        });
      }
    }
    return out;
  },
};
