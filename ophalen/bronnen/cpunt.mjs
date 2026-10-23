// Cpunt, Hoofddorp. Speeldata als JSON-LD, artiest en titel in de kop, genre als label.
import { jsonldBron } from "../platforms/jsonld.mjs";
import { stripTags } from "../lib/html.mjs";

export default jsonldBron({
  id: "cpunt",
  naam: "Cpunt",
  sitemap: "https://www.cpunt.nl/sitemap.xml",
  voorstelling: /\/agenda\/[^/?]+$/,
  // Het label "Cabaret/Stand-up/Comedy" is één genre bij Cpunt; wij noemen dat cabaret.
  // Alleen het eerste labelblok: verderop staan labels van andere voorstellingen.
  genre: (html) => [...(html.match(/<div class="tags-wrapper">([\s\S]*?)<\/div>/)?.[1] || "").matchAll(/<span class="tag">([^<]*)<\/span>/g)]
    .map((m) => m[1].trim().replace(/^Cabaret\/Stand-up\/Comedy$/i, "Cabaret")),
  artiestEnTitel: (html) => {
    const artiest = stripTags(html.match(/<h1 class="title">([\s\S]*?)<\/h1>/)?.[1]);
    const titel = stripTags(html.match(/<h2 class="subtitle">([\s\S]*?)<\/h2>/)?.[1]);
    return titel ? { artiest, titel } : { artiest: null, titel: artiest };
  },
  theaters: [
    { id: "cpunt", naam: "Cpunt", plaats: "Hoofddorp", land: "NL", soort: "theater", website: "https://www.cpunt.nl" },
  ],
});
