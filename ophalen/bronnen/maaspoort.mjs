// Maaspoort, Venlo. Kop: artiest met de titel als ondertitel; genre in <section class="genres">.
import { jsonldBron } from "../platforms/jsonld.mjs";
import { stripTags } from "../lib/html.mjs";

export default jsonldBron({
  id: "maaspoort",
  naam: "Maaspoort",
  sitemap: "https://www.maaspoort.nl/sitemap.xml",
  voorstelling: /\/programma\/[^/#]+\/$/,
  genre: (html) => html.match(/<section class="genres">([\s\S]*?)<\/section>/)?.[1],
  artiestEnTitel: (html) => {
    const h1 = html.match(/<aside>\s*<h1>([\s\S]*?)<\/h1>/)?.[1] || "";
    const onder = stripTags(h1.match(/<span class="subtitle">([\s\S]*?)<\/span>/)?.[1]);
    const kop = stripTags(h1.replace(/<span class="subtitle">[\s\S]*?<\/span>/, ""));
    return onder ? { artiest: kop, titel: onder } : { artiest: null, titel: kop };
  },
  theaters: [
    { id: "maaspoort", naam: "Maaspoort", plaats: "Venlo", land: "NL", soort: "theater", website: "https://www.maaspoort.nl" },
  ],
});
