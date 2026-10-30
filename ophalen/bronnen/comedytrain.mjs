// Comedytrain (vroeger Toomler), Amsterdam, sinds 2026 op het Westergasterrein. Elke avond heeft een
// eigen pagina (/shows/<naam>-<jjjj-mm-dd>/) in weeztix_performance-sitemap.xml; oude datums filteren
// we eruit vóór het ophalen. Op de pagina: titel (h1), soort avond (tag), datum, tijd en zaal.
import { getText } from "../lib/http.mjs";
import { sitemapUrls, stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort } from "../lib/normaliseer.mjs";

const MAANDEN = { januari: 1, februari: 2, maart: 3, april: 4, mei: 5, juni: 6, juli: 7, augustus: 8, september: 9, oktober: 10, november: 11, december: 12 };
const CLUB = "comedytrain-nieuwe-toomler-amsterdam";
const tekst = (s) => stripTags(s || "").replace(/[“”"]/g, "").replace(/\s+/g, " ").trim();
const namen = (s) => s.split(/\s+(?:&|en)\s+/).map((n) => n.trim()).filter(Boolean);

// "Dubbel Theo Maassen & Tim Fransen", "Solo show Stefan Pop: Genoeg over mij",
// "Comedytrain presents: Sophie Duker"; de vaste avonden ("Comedytrain Line-Up") hebben geen artiest.
function artiestEnTitel(kop) {
  let m;
  if ((m = kop.match(/^dubbel\s*:?\s+(.+)$/i))) return { artiesten: namen(m[1]), titel: "Dubbel" };
  if ((m = kop.match(/^solo(?:\s*show)?\s*:?\s+([^:]+?)(?:\s*:\s*(.+))?$/i))) return { artiesten: [m[1].trim()], titel: m[2]?.trim() || m[1].trim() };
  if ((m = kop.match(/^comedytrain presents\s*:?\s+(.+)$/i))) return { artiesten: namen(m[1]), titel: m[1] };
  return { artiesten: [], titel: kop };
}

export default {
  id: "comedytrain",
  naam: "Comedytrain",
  theaters: [
    { id: CLUB, naam: "Comedytrain", plaats: "Amsterdam", land: "NL", soort: "comedyclub", website: "https://www.comedytrain.nl" },
  ],

  async ophalen({ log, vandaag }) {
    const urls = await sitemapUrls("https://www.comedytrain.nl/weeztix_performance-sitemap.xml", {
      filter: (u) => { const d = u.match(/(\d{4}-\d{2}-\d{2})\/?$/)?.[1]; return /\/shows\//.test(u) && (!d || d >= vandaag); },
    });
    log(`${urls.length} komende avonden`);
    const out = [];
    for (const url of urls) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const kop = tekst(html.match(/<h1 class="show-title">([\s\S]*?)<\/h1>/)?.[1]);
      const regel = html.match(/<div class="show-info-line">([\s\S]*?)<\/div>/)?.[1] || "";
      const d = tekst(regel).match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
      const t = tekst(regel).match(/(\d{1,2})[:.](\d{2})\s*uur/);
      if (!kop || !d || !MAANDEN[d[2].toLowerCase()]) continue;
      const datum = `${d[3]}-${String(MAANDEN[d[2].toLowerCase()]).padStart(2, "0")}-${d[1].padStart(2, "0")}`;
      if (datum < vandaag) continue;
      const tags = [...html.matchAll(/<span class="tag">([^<]*)<\/span>/g)].map((m) => tekst(m[1]));
      const { artiesten, titel } = artiestEnTitel(kop);
      out.push({
        theater: CLUB,
        artiesten,
        titel,
        genre: /open podium/i.test(kop) ? "open-mic" : herkenGenre(kop, ...tags) || "stand-up",
        datum,
        tijd: t ? `${t[1].padStart(2, "0")}:${t[2]}` : null,
        status: /uitverkocht|sold[ -]?out/i.test(tekst(html.match(/<article class="show-story">([\s\S]*?)<\/article>/)?.[1])) ? "uitverkocht" : "gepland",
        soort: herkenSoort(kop, ...tags),
        bron: url,
      });
    }
    return out;
  },
};
