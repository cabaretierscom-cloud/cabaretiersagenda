// Castellum, Alphen aan den Rijn (theater en filmhuis). Speeldata als JSON-LD; het genre staat
// als label in de kop (hero__tags).
import { jsonldBron } from "../platforms/jsonld.mjs";

export default jsonldBron({
  id: "castellum",
  naam: "Castellum",
  sitemap: "https://castellum.nl/sitemap.xml",
  voorstelling: /\/theater\/[^/]+$/,
  genre: (html) => [...(html.match(/<div class="hero__tags">([\s\S]*?)<\/div>/)?.[1] || "").matchAll(/<span>([^<]+)<\/span>/g)].map((m) => m[1]),
  theaters: [
    { id: "castellum", naam: "Castellum", plaats: "Alphen aan den Rijn", land: "NL", soort: "theater", website: "https://castellum.nl" },
  ],
});
