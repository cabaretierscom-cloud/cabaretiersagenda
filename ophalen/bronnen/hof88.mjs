// Hof88, Almelo. Genre in de dataLayer ('category'), artiest als ondertitel in de kop.
import { jsonldBron } from "../platforms/jsonld.mjs";
import { stripTags } from "../lib/html.mjs";

export default jsonldBron({
  id: "hof88",
  naam: "Hof88",
  sitemap: "https://www.hof88.nl/sitemap.xml",
  voorstelling: /\/voorstellingen\/[^/]+$/,
  genre: (html) => html.match(/'category':\s*'([^']*)'/)?.[1],
  // <h1 class="program-block__title"><span class="program-block__subtitle">Artiest</span> Titel</h1>
  artiestEnTitel: (html) => {
    const h1 = html.match(/<h1 class="program-block__title">([\s\S]*?)<\/h1>/)?.[1] || "";
    const artiest = stripTags(h1.match(/<span class="program-block__subtitle">([\s\S]*?)<\/span>/)?.[1]) || null;
    const titel = stripTags(h1.replace(/<span class="program-block__subtitle">[\s\S]*?<\/span>/, ""));
    return { artiest, titel: titel || artiest };
  },
  theaters: [
    { id: "hof88", naam: "Hof88", plaats: "Almelo", land: "NL", soort: "theater", website: "https://www.hof88.nl" },
  ],
});
