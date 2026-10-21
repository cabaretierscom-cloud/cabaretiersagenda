// DeLaMar, Amsterdam.
// De voorstellingspagina's (uit de sitemap) hebben genre-labels, de artiest in de kop,
// de programmatitel eronder en per speeldatum een blok met datum, tijd, labels
// (Matinee, Try-out) en verkoopstatus.
import { getText } from "../lib/http.mjs";
import { sitemapUrls, stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters } from "../lib/normaliseer.mjs";

const BASIS = "https://delamar.nl";

function status(blok) {
  const t = stripTags(blok).toLowerCase();
  if (/geannuleerd|afgelast/.test(t)) return "geannuleerd";
  if (/verplaatst/.test(t)) return "verplaatst";
  if (/uitverkocht/.test(t)) return "uitverkocht";
  return "gepland";
}

export default {
  id: "delamar",
  naam: "DeLaMar",
  theaters: [
    { id: "delamar", naam: "DeLaMar Theater", plaats: "Amsterdam", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log }) {
    const urls = await sitemapUrls(`${BASIS}/sitemap.xml`, {
      filter: (u) => /^https:\/\/delamar\.nl\/voorstellingen\/[a-z0-9-]+\/$/.test(u),
    });
    log(`${urls.length} voorstellingen in de sitemap`);
    const out = [];
    for (const url of urls) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const kop = html.match(/<div class="production__title">([\s\S]*?)<div class="production__description/)?.[1];
      if (!kop) continue;
      const genres = [...kop.matchAll(/<div class="genre[^"]*">([^<]*)<\/div>/g)].map((m) => stripTags(m[1]));
      const genre = herkenGenre(genres);
      if (!genre) continue;
      const naam = stripTags(kop.match(/<h1>([\s\S]*?)<\/h1>/)?.[1]);
      const ondertitel = stripTags(kop.match(/<\/h1>\s*<p>([\s\S]*?)<\/p>/)?.[1]);
      // "Paul de Leeuw, Annick Boer e.a." onder de kop is een rolverdeling: dan is de kop de titel.
      const rolverdeling = /\be\.a\.?$|,/.test(ondertitel);

      const blokken = html.split(/<div class="production__date js-production-date[^"]*"/).slice(1);
      for (const blok of blokken) {
        const datum = blok.match(/^\s*data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
        if (!datum) continue;
        const tijd = blok.match(/<\/strong>\s*(\d{1,2})[:.](\d{2})/);
        const tot = blok.indexOf("production__date"); // niet doorlezen in het volgende blok
        const eigen = tot > 0 ? blok.slice(0, tot) : blok;
        const labels = [...eigen.matchAll(/<div class="genre[^"]*">([^<]*)<\/div>/g)].map((m) => stripTags(m[1]));
        out.push({
          theater: "delamar",
          artiesten: ondertitel && !rolverdeling ? [naam] : [],
          titel: netteHoofdletters(ondertitel && !rolverdeling ? ondertitel : naam),
          genre: herkenGenre(ondertitel) === "oudejaarsconference" ? "oudejaarsconference" : genre,
          datum,
          tijd: tijd ? `${tijd[1].padStart(2, "0")}:${tijd[2]}` : null,
          status: status(eigen.slice(0, 1500)),
          soort: herkenSoort(labels.join(" ")),
          bron: url,
        });
      }
    }
    return out;
  },
};
