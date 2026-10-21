// Luxor Theater, Rotterdam (Nieuwe Luxor en Oude Luxor).
// De site is gebouwd met Next.js. Elke voorstellingspagina bevat het volledige
// voorstellingsobject: genres, ondertitel, zaal en per speeldatum begintijd en verkoopstatus.
// De lijst met voorstellingen komt uit de sitemap.
import { getText, stelPauzeIn } from "../lib/http.mjs";
import { sitemapUrls, nextFlightText, jsonObjectsWith, decodeEntities } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters } from "../lib/normaliseer.mjs";

const STATUS = { "sold-out": "uitverkocht", cancelled: "geannuleerd", canceled: "geannuleerd", postponed: "verplaatst" };

export default {
  id: "luxor",
  naam: "Luxor Theater",
  theaters: [
    { id: "nieuwe-luxor", naam: "Nieuwe Luxor Theater", plaats: "Rotterdam", land: "NL", soort: "theater", website: "https://luxortheater.nl" },
    { id: "oude-luxor", naam: "Oude Luxor Theater", plaats: "Rotterdam", land: "NL", soort: "theater", website: "https://luxortheater.nl" },
  ],

  async ophalen({ log }) {
    // Luxor geeft "503 te druk" bij snel achter elkaar ophalen.
    stelPauzeIn("luxortheater.nl", 3000);
    const urls = await sitemapUrls("https://luxortheater.nl/production-sitemap.xml", {
      filter: (u) => /^https:\/\/luxortheater\.nl\/agenda\/[^/]+\/?$/.test(u),
    });
    log(`${urls.length} voorstellingen in de sitemap`);
    const out = [];
    for (const url of urls) {
      let html;
      try { html = await getText(url.replace(/\/$/, "")); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const p = jsonObjectsWith(nextFlightText(html), '"__typename":"Production"').find((x) => x.shows?.nodes);
      if (!p) continue;
      const genre = herkenGenre((p.genres?.nodes || []).map((g) => g.name), (p.labels?.nodes || []).map((l) => l.name));
      if (!genre) continue;
      const theater = /oude/i.test(p.location || "") ? "oude-luxor" : "nieuwe-luxor";
      const artiest = decodeEntities(p.title || "").trim();
      const titel = netteHoofdletters(decodeEntities(p.subTitle || "").trim()) || artiest;
      for (const show of p.shows.nodes) {
        const start = show.eventDetails?.programStart || "";
        const m = start.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
        if (!m) continue;
        const info = JSON.stringify(show.info?.nodes || []);
        out.push({
          theater,
          artiesten: p.subTitle ? [artiest] : [],
          titel,
          genre: herkenGenre(titel) === "oudejaarsconference" ? "oudejaarsconference" : genre,
          datum: `${m[1]}-${m[2]}-${m[3]}`,
          tijd: `${m[4]}:${m[5]}`,
          status: STATUS[show.eventDetails?.eventStatus?.status] || "gepland",
          soort: herkenSoort(info, show.eventDetails?.eventStatus?.tag || ""),
          bron: url,
        });
      }
    }
    return out;
  },
};
