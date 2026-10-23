// Parkvilla, Alphen aan den Rijn. Artiest en genre staan in het infoblok, de speeldata als JSON-LD.
import { jsonldBron, artiestEnTitel } from "../platforms/jsonld.mjs";
import { stripTags } from "../lib/html.mjs";

export default jsonldBron({
  id: "parkvilla",
  naam: "Parkvilla",
  sitemap: "https://parkvilla.nl/sitemap.xml",
  voorstelling: /\/theater\/[^/]+-\d+$/,
  genre: (html) => html.match(/>Genre<\/div><div>([^<]+)/)?.[1],
  artiestEnTitel: (html, ev) => {
    const artiest = stripTags(html.match(/>Artiest\(en\)<\/div><div>([^<]+)/)?.[1]) || null;
    const { titel } = artiestEnTitel(stripTags(ev.name), { scheiders: [" | "] });
    return { artiest, titel: titel === ev.name && artiest ? titel.replace(artiest, "").replace(/^\s*[|-]\s*/, "") || titel : titel };
  },
  theaters: [
    { id: "parkvilla", naam: "Parkvilla", plaats: "Alphen aan den Rijn", land: "NL", soort: "theater", website: "https://parkvilla.nl" },
  ],
});
