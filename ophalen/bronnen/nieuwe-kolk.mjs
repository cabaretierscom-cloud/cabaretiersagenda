// De Nieuwe Kolk, Assen. Speeldata als JSON-LD ("Artiest - Titel"), genre als eerste label.
import { jsonldBron } from "../platforms/jsonld.mjs";

export default jsonldBron({
  id: "nieuwe-kolk",
  naam: "De Nieuwe Kolk",
  sitemap: "https://denieuwekolk.nl/sitemap.xml",
  voorstelling: /\/theater\/agenda\/[^/]+$/,
  genre: (html) => html.match(/rounded-full"[^>]*>\s*([^<]+?)\s*<\/div>/)?.[1],
  theaters: [
    { id: "de-nieuwe-kolk", naam: "De Nieuwe Kolk", plaats: "Assen", land: "NL", soort: "theater", website: "https://denieuwekolk.nl" },
  ],
});
