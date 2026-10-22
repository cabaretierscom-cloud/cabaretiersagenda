// Zaantheater, Zaandam.
// Voorstellingspagina's uit de sitemap (/nl/theater/agenda/seizoen-.../<voorstelling>/).
// Per speeldatum is er een rij met zaal, genre en een verlanglijstknop die datum/tijd,
// artiest (productiontitle) en titel (productionsubtitle) als kenmerken heeft.
// De bestelknop toont de status (Bestel, Uitverkocht, ...).
import { getText } from "../lib/http.mjs";
import { sitemapUrls, stripTags, decodeEntities } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";

const BASIS = "https://zaantheater.nl";

function status(tekst) {
  const t = tekst.toLowerCase();
  if (/geannuleerd|afgelast/.test(t)) return "geannuleerd";
  if (/verplaatst/.test(t)) return "verplaatst";
  if (/uitverkocht|wachtlijst/.test(t)) return "uitverkocht";
  return "gepland";
}

export default {
  id: "zaantheater",
  naam: "Zaantheater",
  theaters: [
    { id: "zaantheater", naam: "Zaantheater", plaats: "Zaandam", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    // Alleen het huidige en volgende seizoen; pagina's van oudere seizoenen geven fouten.
    const seizoenStart = `${Number(vandaag.slice(0, 4)) - 1}`;
    const urls = await sitemapUrls(`${BASIS}/sitemap.xml`, {
      filter: (u) => { const m = u.match(/\/nl\/theater\/agenda\/seizoen-(\d{4})-\d{4}\/[^/]+\/?$/); return m && m[1] >= seizoenStart; },
    });
    log(`${urls.length} voorstellingen in de sitemap`);
    const out = [];
    for (const url of urls) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      for (const rij of html.split(/<div class="eventOrder-table">/).slice(1)) {
        const attr = (n) => decodeEntities(rij.match(new RegExp(`data-${n}="([^"]*)"`))?.[1] || "").trim();
        const genre = herkenGenre(stripTags(rij.match(/<div class="eventOrder-genre">([\s\S]*?)<\/div>/)?.[1]));
        const w = attr("datetime").match(/^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})/);
        if (!genre || !w) continue;
        const artiest = attr("productiontitle"), titel = attr("productionsubtitle");
        const statusTekst = stripTags(rij.match(/<span class="order-status[^"]*">([\s\S]*?)<\/span>/)?.[1]);
        out.push({
          theater: "zaantheater",
          artiesten: titel && artiest ? [netteNaam(artiest)] : [],
          titel: netteHoofdletters(titel || artiest),
          genre: herkenGenre(titel) === "oudejaarsconference" ? "oudejaarsconference" : genre,
          datum: w[1],
          tijd: `${w[2]}:${w[3]}`,
          status: status(statusTekst),
          soort: herkenSoort(titel, stripTags(rij)),
          bron: url,
        });
      }
    }
    return out;
  },
};
