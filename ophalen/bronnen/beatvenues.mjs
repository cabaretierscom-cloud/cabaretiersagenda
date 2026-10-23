// Stadsschouwburg Antwerpen en Capitole Gent (Beat Venues, Next.js). Speeldata als JSON-LD;
// het genre staat in de ingebakken paginagegevens als ["category", ..., "Comedy,Nederlandstalig"].
// Naam: 'Alex Agnew "No more heroes"' (artiest, titel tussen aanhalingstekens).
import { jsonldBron, artiestEnTitel } from "../platforms/jsonld.mjs";
import { sitemapUrls, stripTags } from "../lib/html.mjs";

const SITES = {
  "www.stadsschouwburg-antwerpen.be": "stadsschouwburg-antwerpen",
  "www.capitole-gent.be": "capitole-gent",
};

export default jsonldBron({
  id: "beatvenues",
  naam: "Stadsschouwburg Antwerpen en Capitole Gent",
  urls: async () => (await Promise.all(Object.keys(SITES).map((host) =>
    sitemapUrls(`https://${host}/sitemap.xml`, { filter: (u) => /\/evenement\/[^/]+$/.test(u) })))).flat(),
  genre: (html) => html.match(/\[0,\\?"category\\?"\],\[1,\[\d+\]\],\[0,\\?"([^"\\]+)\\?"\]/)?.[1],
  artiestEnTitel: (html, ev) => {
    const naam = stripTags(ev.name);
    const m = naam.match(/^(.+?)\s+["“„'‘](.+?)["”'’]\s*$/);
    return m ? { artiest: m[1], titel: m[2] } : artiestEnTitel(naam);
  },
  theater: (ev, html, url) => SITES[new URL(url).hostname] || null,
  theaters: [
    { id: "stadsschouwburg-antwerpen", naam: "Stadsschouwburg Antwerpen", plaats: "Antwerpen", land: "BE", soort: "theater", website: "https://www.stadsschouwburg-antwerpen.be" },
    { id: "capitole-gent", naam: "Capitole Gent", plaats: "Gent", land: "BE", soort: "theater", website: "https://www.capitole-gent.be" },
  ],
});
