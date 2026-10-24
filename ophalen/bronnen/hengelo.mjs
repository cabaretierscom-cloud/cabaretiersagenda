// Schouwburg Hengelo. Speeldata als JSON-LD; genre als label boven de kop, artiest in <h1>
// en titel in <h2>. Voorstellingspagina's staan direct onder de hoofdmap (/<titel-artiest>).
import { jsonldBron } from "../platforms/jsonld.mjs";
import { stripTags } from "../lib/html.mjs";

export default jsonldBron({
  id: "hengelo",
  naam: "Schouwburg Hengelo",
  sitemap: "https://www.schouwburghengelo.nl/sitemap.xml",
  voorstelling: /^https:\/\/www\.schouwburghengelo\.nl\/[^/]+$/,
  genre: (html) => [...(html.match(/<div class="show-details__genres">([\s\S]*?)<\/div>/)?.[1] || "").matchAll(/class="tag">([^<]+)</g)].map((m) => m[1]),
  artiestEnTitel: (html) => {
    const blok = html.match(/<div class="show-details__info[\s\S]*?<\/h2>/)?.[0] || "";
    const artiest = stripTags(blok.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]) || null;
    const titel = stripTags(blok.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1]);
    return { artiest, titel: titel || artiest };
  },
  theaters: [
    { id: "schouwburg-hengelo", naam: "Schouwburg Hengelo", plaats: "Hengelo", land: "NL", soort: "theater", website: "https://www.schouwburghengelo.nl" },
  ],
});
