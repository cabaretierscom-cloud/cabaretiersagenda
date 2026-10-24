// Theater de Stoep, Spijkenisse. Speeldata als JSON-LD ("Artiest - Titel"); zaal en genre staan
// als labels vlak boven de datums ("<!-- Dates section -->").
import { jsonldBron } from "../platforms/jsonld.mjs";

export default jsonldBron({
  id: "stoep",
  naam: "Theater de Stoep",
  sitemap: "https://theaterdestoep.nl/sitemap.xml",
  voorstelling: /\/voorstelling\/[^/]+$/,
  genre: (html) => [...(html.split("<!-- Dates section -->")[0].slice(-1500).matchAll(/<span>([^<]+)<\/span>\s*<\/span>/g))].map((m) => m[1]),
  theaters: [
    { id: "theater-de-stoep", naam: "Theater de Stoep", plaats: "Spijkenisse", land: "NL", soort: "theater", website: "https://theaterdestoep.nl" },
  ],
});
