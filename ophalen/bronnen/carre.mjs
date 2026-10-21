// Koninklijk Theater Carré, Amsterdam.
// De site laadt elke voorstelling uit /api/render/voorstelling/<slug>; daarin staan
// genre, alle speeldata en de verkoopstatus. De lijst met voorstellingen komt uit de sitemap.
import { getJson } from "../lib/http.mjs";
import { sitemapUrls } from "../lib/html.mjs";
import { lokaleDatumTijd, netteHoofdletters, netteNaam, herkenGenre, herkenSoort, splitsNaam } from "../lib/normaliseer.mjs";

const GENRES = {
  cabaret: "cabaret",
  comedy_international: "stand-up",
  comedy_internationaal: "stand-up",
};

export default {
  id: "carre",
  naam: "Koninklijk Theater Carré",
  theaters: [
    { id: "carre", naam: "Koninklijk Theater Carré", plaats: "Amsterdam", land: "NL", soort: "theater", website: "https://carre.nl" },
  ],

  async ophalen({ log }) {
    const urls = await sitemapUrls("https://carre.nl/sitemap.xml", {
      filter: (u) => /^https:\/\/carre\.nl\/voorstelling\/[^/]+$/.test(u),
    });
    log(`${urls.length} voorstellingspagina's in de sitemap`);
    const out = [];
    for (const url of urls) {
      const path = new URL(url).pathname.slice(1);
      let d;
      try {
        d = await getJson(`https://carre.nl/api/render/${path}`);
      } catch (e) {
        log(`overgeslagen: ${url} (${e.message})`);
        continue;
      }
      const page = d.node?.data || {};
      const genresBron = d.node?.filters?.genres || [];
      // Carré labelt soms concerten óók als comedy (bijv. Epica); dan alleen met expliciet cabaret.
      const ookConcert = genresBron.some((g) => g.startsWith("concert"));
      const genre = (ookConcert ? GENRES[genresBron.find((g) => g === "cabaret")] : genresBron.map((g) => GENRES[g]).find(Boolean)) ||
        (genresBron.some((g) => /menshow|amusement/.test(g)) ? herkenGenre(page.heading, page.seoDescription) : null);
      if (!genre) continue;

      for (const prod of Object.values(d.productions || {})) {
        for (const ev of prod.events || []) {
          if (ev.data?.eventtype && ev.data.eventtype !== "Voorstelling") continue;
          const wanneer = lokaleDatumTijd(ev.start_date);
          if (!wanneer) continue;
          const kop = splitsNaam(page.heading || "");
          const artiest = netteNaam(ev.data?.name || prod.data?.name || kop.artiest);
          const titel = netteHoofdletters(ev.data?.subtitle || kop.titel) || artiest;
          out.push({
            theater: "carre",
            artiesten: artiest ? [artiest] : [],
            titel,
            genre: herkenGenre(titel) === "oudejaarsconference" ? "oudejaarsconference" : genre,
            ...wanneer,
            status: ev.sales_status === "sold_out" ? "uitverkocht" : ev.sales_status === "cancelled" ? "geannuleerd" : "gepland",
            soort: herkenSoort(titel, ev.data?.calendarlabel),
            bron: url,
          });
        }
      }
    }
    return out;
  },
};
