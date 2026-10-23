// Theater aan de Schie, Schiedam. Speeldata als JSON-LD ("Artiest - Titel"), genre onder de kop.
import { jsonldBron } from "../platforms/jsonld.mjs";

export default jsonldBron({
  id: "schie",
  naam: "Theater aan de Schie",
  sitemap: "https://theateraandeschie.nl/sitemap.xml",
  voorstelling: /\/voorstelling\/[^/]+$/,
  genre: (html) => html.match(/<div class="text-s1">([^<]+)<\/div>/)?.[1],
  theaters: [
    { id: "theater-aan-de-schie", naam: "Theater aan de Schie", plaats: "Schiedam", land: "NL", soort: "theater", website: "https://theateraandeschie.nl" },
  ],
});
