// Schouwburg Venray. De JSON-LD op een voorstellingspagina hoort bij andere voorstellingen,
// dus de speeldata komen uit de kop van de pagina: "<span class="day">Do</span> 29 okt. 2026 |
// 20:15 - 22:05", met labels als "Wachtlijst". Artiest in <h1>, titel in <h2>, genre als label.
import { getText } from "../lib/http.mjs";
import { sitemapUrls, stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const BASIS = "https://www.schouwburgvenray.nl";
const MAANDEN = { jan: 1, feb: 2, mrt: 3, maa: 3, apr: 4, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12 };

export default {
  id: "venray",
  naam: "Schouwburg Venray",
  theaters: [
    { id: "schouwburg-venray", naam: "Schouwburg Venray", plaats: "Venray", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log }) {
    const urls = await sitemapUrls(`${BASIS}/sitemap.xml`, { filter: (u) => /\/programma\/\d+\/[^/]+$/.test(u) });
    log(`${urls.length} voorstellingen in de sitemap`);
    const out = [];
    for (const url of urls) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const kop = html.slice(html.indexOf('<h1 class="mediumTitle"'), html.indexOf('class="eventTextBlock"'));
      if (kop.length < 50) continue;
      const genre = herkenGenre([...kop.matchAll(/<div class="tagItem genre"><span>([^<]*)<\/span>/g)].map((m) => m[1]));
      if (!genre) continue;
      // "Remy Evers | try-out": de soort hoort niet bij de naam.
      const kopTekst = stripTags(kop.match(/<h1 class="mediumTitle">([\s\S]*?)<\/h1>/)?.[1]);
      const artiest = netteNaam(kopTekst.replace(/\s*[|(-]\s*(try[ -]?out|premi[eè]re|reprise)\)?\s*$/i, "").trim());
      const onder = stripTags(kop.match(/<h2 class="smallQuoteTitle">([\s\S]*?)<\/h2>/)?.[1]);
      // "try-out | Graag gedaan | try-out": losse delen met alleen de soort weglaten.
      const titelDelen = (onder || "").split(/\s+\|\s+/).filter((d) => d && !/^(try[ -]?out|premi[eè]re|derni[eè]re|reprise)$/i.test(d.trim()));
      const titel = netteHoofdletters((titelDelen.join(" | ") || artiest).replace(/\s*[-–(]\s*(try[ -]?out|premi[eè]re|reprise)\)?\s*$/i, "").trim());
      const g = artiestOfTitel(artiest, titel);
      const gekeerd = { artiesten: g.artiest ? [g.artiest] : [], titel: g.titel };
      for (const blok of kop.split(/<div class="dateDropdown[ "]/).slice(1)) {
        const d = blok.match(/<span class="day">[^<]*<\/span>\s*(\d{1,2})\s+([a-z]{3})[a-z]*\.?\s+(\d{4})/i);
        const t = blok.match(/<span class="dateTime">\s*(\d{1,2}):(\d{2})/);
        if (!d || !MAANDEN[d[2].toLowerCase()]) continue;
        const labels = [...blok.matchAll(/<span class="tagItem[^"]*">([^<]*)<\/span>/g)].map((m) => m[1].toLowerCase()).join(" ");
        out.push({
          theater: "schouwburg-venray",
          ...gekeerd,
          genre: herkenGenre(g.titel) === "oudejaarsconference" ? "oudejaarsconference" : genre,
          datum: `${d[3]}-${String(MAANDEN[d[2].toLowerCase()]).padStart(2, "0")}-${d[1].padStart(2, "0")}`,
          tijd: t ? `${t[1].padStart(2, "0")}:${t[2]}` : null,
          status: /geannuleerd|afgelast/.test(labels) ? "geannuleerd" : /uitverkocht|wachtlijst/.test(labels) ? "uitverkocht" : "gepland",
          soort: herkenSoort(onder, kopTekst, labels),
          bron: url,
        });
      }
    }
    return out;
  },
};
