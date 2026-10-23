// Schouwburg Ogterop, Meppel. Zelfde websitebouwer als Hof88; hier is de kop de artiest
// en de ondertitel de titel.
import { jsonldBron } from "../platforms/jsonld.mjs";
import { stripTags } from "../lib/html.mjs";

export default jsonldBron({
  id: "ogterop",
  naam: "Schouwburg Ogterop",
  sitemap: "https://www.schouwburgogterop.nl/sitemap.xml",
  voorstelling: /\/programma\/[^/]+$/,
  genre: (html) => html.match(/'category':\s*'([^']*)'/)?.[1],
  artiestEnTitel: (html) => {
    const kop = stripTags(html.match(/<span class="performance-header__title">([\s\S]*?)<\/span>/)?.[1]);
    const onder = stripTags(html.match(/<span class="performance-header__subtitle">([\s\S]*?)<\/span>/)?.[1]);
    return onder ? { artiest: kop, titel: onder } : { artiest: null, titel: kop };
  },
  theaters: [
    { id: "schouwburg-ogterop", naam: "Schouwburg Ogterop", plaats: "Meppel", land: "NL", soort: "theater", website: "https://www.schouwburgogterop.nl" },
  ],
});
