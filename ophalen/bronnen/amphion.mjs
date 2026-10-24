// Amphion, Doetinchem. De sitemap heeft per speeldatum een pagina (/theater/<naam>/dd-mm-jjjj-uu-mm/),
// dus oude datums slaan we over zonder ze op te halen. Op de pagina: artiest (<h1 class="title">),
// titel (subtitle) en een fiche met genre, zaal en de bestelknop met data-status.
import { getText } from "../lib/http.mjs";
import { sitemapUrls, stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const BASIS = "https://www.amphion.nl";

export default {
  id: "amphion",
  naam: "Amphion",
  theaters: [
    { id: "amphion", naam: "Amphion", plaats: "Doetinchem", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const urls = (await sitemapUrls(`${BASIS}/sitemap.xml`)).map((u) => [u, u.match(/\/theater\/[^/]+\/(\d{2})-(\d{2})-(\d{4})-(\d{2})-(\d{2})\/$/)])
      .filter(([, m]) => m && `${m[3]}-${m[2]}-${m[1]}` >= vandaag);
    log(`${urls.length} komende speeldata in de sitemap`);
    const out = [];
    for (const [url, m] of urls) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const fiche = html.match(/<div class="fiche"[\s\S]*?<\/a>/)?.[0] || "";
      const genre = herkenGenre(stripTags(fiche.match(/<span class="genre">([\s\S]*?)<\/span>/)?.[1]));
      if (!genre) continue;
      const boven = stripTags(html.match(/<h1 class="title">([\s\S]*?)<\/h1>/)?.[1]);
      // Nationaal Theaterweekend: een verrassingsvoorstelling zonder bekende artiest of titel.
      if (/theaterweekend|blind date/i.test(html.match(/<h1 class="title">[\s\S]*?<\/span>/)?.[0] || "")) continue;
      const onder = stripTags(html.match(/<h1 class="title">[\s\S]*?<\/h1>\s*<span class="subtitle">([\s\S]*?)<\/span>/)?.[1]);
      const zonder = (s) => s.replace(/\s*[-–(]\s*(try[ -]?out|premi[eè]re|reprise)\)?\s*$/i, "").trim();
      const { artiest, titel } = artiestOfTitel(onder ? netteNaam(zonder(boven)) : null, netteHoofdletters(zonder(onder || boven).replace(/\.$/, "")));
      if (!titel) continue;
      const st = fiche.match(/data-status="([^"]*)"/)?.[1] || "";
      out.push({
        theater: "amphion",
        artiesten: artiest ? [artiest] : [],
        titel,
        genre: /oudejaars/i.test(titel) ? "oudejaarsconference" : genre,
        datum: `${m[3]}-${m[2]}-${m[1]}`,
        tijd: `${m[4]}:${m[5]}`,
        status: /geannuleerd|afgelast/.test(st) ? "geannuleerd" : /uitverkocht|wachtlijst/.test(st) ? "uitverkocht" : "gepland",
        soort: herkenSoort(boven, onder, url),
        bron: url,
      });
    }
    return out;
  },
};
