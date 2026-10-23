// Schouwburg Amstelveen. Voorstellingspagina's per seizoen uit de sitemap, genre in de labellijst.
import { jsonldBron } from "../platforms/jsonld.mjs";
import { stripTags } from "../lib/html.mjs";

const vorigJaar = new Date().getFullYear() - 1;

export default jsonldBron({
  id: "amstelveen",
  naam: "Schouwburg Amstelveen",
  sitemap: "https://schouwburgamstelveen.nl/sitemapindex.xml",
  voorstelling: new RegExp(`/agenda/seizoen-(${vorigJaar}|${vorigJaar + 1}|${vorigJaar + 2})-\\d{4}/[^/]+/$`),
  genre: (html) => html.match(/<ul class="taglist[^"]*">([\s\S]*?)<\/ul>/)?.[1],
  // <div class="articleHeader"><h1>Artiest</h1><h2>Titel</h2>; de JSON-LD heeft alleen de artiest.
  artiestEnTitel: (html) => {
    const kop = html.match(/<div class="articleHeader">([\s\S]*?)<\/div>/)?.[1] || "";
    const artiest = stripTags(kop.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]);
    const titel = stripTags(kop.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1]);
    return titel ? { artiest, titel } : { artiest: null, titel: artiest };
  },
  theaters: [
    { id: "schouwburg-amstelveen", naam: "Schouwburg Amstelveen", plaats: "Amstelveen", land: "NL", soort: "theater", website: "https://schouwburgamstelveen.nl" },
  ],
});
