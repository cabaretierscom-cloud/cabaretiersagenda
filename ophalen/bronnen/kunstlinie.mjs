// Kunstlinie, Almere. Vraagt in robots.txt 10 seconden tussen verzoeken (wordt gevolgd).
// Voorstellingspagina's uit programma-sitemap.xml. Elke pagina heeft categorieën
// (Cabaret, Theater), de artiest (h2), de titel (h5) en in het kaartblok voor mobiel
// per komende avond "do 28 jan '27 - 20:30" met een knop (Tickets, Uitverkocht, ...).
import { getText } from "../lib/http.mjs";
import { sitemapUrls, stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";

const BASIS = "https://kunstlinie.nl";
const MAANDEN = { jan: 1, feb: 2, mrt: 3, apr: 4, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12 };

function status(knop) {
  const t = knop.toLowerCase();
  if (/geannuleerd|afgelast/.test(t)) return "geannuleerd";
  if (/verplaatst/.test(t)) return "verplaatst";
  if (/uitverkocht|wachtlijst/.test(t)) return "uitverkocht";
  return "gepland";
}

export default {
  id: "kunstlinie",
  naam: "Kunstlinie",
  theaters: [
    { id: "kunstlinie", naam: "Kunstlinie Almere", plaats: "Almere", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log }) {
    const urls = await sitemapUrls(`${BASIS}/programma-sitemap.xml`, { filter: (u) => /\/programma\/[^/]+\/$/.test(u) });
    log(`${urls.length} voorstellingen in de sitemap`);
    const out = [];
    for (const url of urls) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const kop = html.match(/<div class="categories nbm">([\s\S]*?)<\/h5>/)?.[1] || html.match(/<div class="categories nbm">([\s\S]*?)<\/h2>/)?.[1] || "";
      const genre = herkenGenre([...kop.matchAll(/<div class="cat[^"]*">([^<]*)<\/div>/g)].map((m) => stripTags(m[1])));
      if (!genre) continue;
      const naam = stripTags(kop.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1]);
      const sub = stripTags(kop.match(/<h5[^>]*>([\s\S]*?)<\/h5>/)?.[1]);
      const tickets = html.match(/mobileTicketContainer[\s\S]*?<section/)?.[0] || "";
      for (const blok of tickets.split("<!-- UPCOMING EVENT -->").slice(1)) {
        const d = blok.match(/(\d{1,2})\s+([a-z]{3})[a-z]*\s+'(\d{2})\s*-\s*(\d{1,2})[:.](\d{2})/i);
        if (!d || !MAANDEN[d[2].toLowerCase()]) continue;
        const knop = stripTags(blok.match(/<a class="button[\s\S]*?<\/a>/)?.[0] || "");
        out.push({
          theater: "kunstlinie",
          // Zonder ondertitel is de kop de artiest (bijv. "Jandino"); de titel is dan ook de naam.
          artiesten: naam ? [netteNaam(naam)] : [],
          titel: netteHoofdletters(sub || naam),
          genre: herkenGenre(sub) === "oudejaarsconference" ? "oudejaarsconference" : genre,
          datum: `20${d[3]}-${String(MAANDEN[d[2].toLowerCase()]).padStart(2, "0")}-${d[1].padStart(2, "0")}`,
          tijd: `${d[4].padStart(2, "0")}:${d[5]}`,
          status: status(knop),
          soort: herkenSoort(sub),
          bron: url,
        });
      }
    }
    return out;
  },
};
