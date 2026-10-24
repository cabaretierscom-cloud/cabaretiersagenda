// Theater Het Speelhuis, Helmond. Cre8ion-site, maar zonder dataLayer: elke voorstellingspagina heeft
// de speeldata als TheaterEvent in JSON-LD. Genre als label in de kop, artiest in h2.title,
// titel in p.subtitle.
import { jsonldBron } from "../platforms/jsonld.mjs";
import { stripTags } from "../lib/html.mjs";

const kop = (html) => html.match(/<div class="header-inner">([\s\S]*?)<div class="col-6-12 sm-col-1-1 share-col">/)?.[1] || "";

export default jsonldBron({
  id: "speelhuis",
  naam: "Theater Het Speelhuis",
  sitemap: "https://theaterspeelhuis.nl/sitemap.xml",
  voorstelling: /\/programma\/[^/]+-\d+$/,
  genre: (html) => [...kop(html).matchAll(/<span class="tag[^"]*">([^<]+)<\/span>/g)].map((m) => m[1]),
  artiestEnTitel: (html) => {
    const k = kop(html);
    const artiest = stripTags(k.match(/<h2 class="title">([\s\S]*?)<\/h2>/)?.[1]) || null;
    const titel = stripTags(k.match(/<p class="subtitle">([\s\S]*?)<\/p>/)?.[1]);
    return titel ? { artiest, titel } : { artiest: null, titel: artiest };
  },
  theaters: [
    { id: "theater-het-speelhuis", naam: "Theater Het Speelhuis", plaats: "Helmond", land: "NL", soort: "theater", website: "https://theaterspeelhuis.nl" },
  ],
});
