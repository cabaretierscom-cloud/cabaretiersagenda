// Zwolse Theaters (Theater de Spiegel en Odeon), Zwolle.
// De voorstellingspagina's (uit de sitemap, /programma/<seizoen>/<voorstelling>) bevatten hun
// gegevens als JSON in :model-kenmerken: labels (cabaret, lachen), zaal, artiest en titel,
// en een kaartmenu met per speeldatum datum, tijd en knoptekst (Bestel, Wachtlijst, ...).
import { getText } from "../lib/http.mjs";
import { sitemapUrls, decodeEntities } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";

const BASIS = "https://www.zwolsetheaters.nl";
const MAANDEN = { jan: 1, feb: 2, mrt: 3, apr: 4, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12 };

function modellen(html) {
  return [...html.matchAll(/:model="(\{[^"]*)"/g)]
    .map((m) => { try { return JSON.parse(decodeEntities(m[1])); } catch { return null; } })
    .filter(Boolean);
}

// "za 20 feb '27" + "20.00 uur"
function wanneer(datum, tijd) {
  const d = String(datum || "").match(/(\d{1,2})\s+([a-z]{3})[a-z]*\s+'?(\d{2,4})/i);
  const t = String(tijd || "").match(/(\d{1,2})[:.](\d{2})/);
  if (!d || !MAANDEN[d[2].toLowerCase()]) return null;
  const jaar = d[3].length === 2 ? `20${d[3]}` : d[3];
  return { datum: `${jaar}-${String(MAANDEN[d[2].toLowerCase()]).padStart(2, "0")}-${d[1].padStart(2, "0")}`, tijd: t ? `${t[1].padStart(2, "0")}:${t[2]}` : null };
}

function status(knop) {
  const t = String(knop || "").toLowerCase();
  if (/geannuleerd|afgelast/.test(t)) return "geannuleerd";
  if (/verplaatst/.test(t)) return "verplaatst";
  if (/uitverkocht|wachtlijst/.test(t)) return "uitverkocht";
  return "gepland";
}

export default {
  id: "zwolle",
  naam: "Zwolse Theaters",
  theaters: [
    { id: "theater-de-spiegel", naam: "Theater de Spiegel", plaats: "Zwolle", land: "NL", soort: "theater", website: BASIS },
    { id: "odeon-zwolle", naam: "Odeon", plaats: "Zwolle", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const seizoenStart = `${Number(vandaag.slice(0, 4)) - 1}`;
    const urls = await sitemapUrls(`${BASIS}/sitemap.xml`, {
      filter: (u) => { const m = u.match(/\/programma\/(\d{4})-\d{4}\/[^/]+\/?$/); return m && m[1] >= seizoenStart; },
    });
    log(`${urls.length} voorstellingen in de sitemap (huidig en volgend seizoen)`);
    const out = [];
    for (const url of urls) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const m = modellen(html);
      const kop = m.find((x) => "tags" in x && "information" in x);
      if (!kop) continue;
      const genre = herkenGenre((kop.tags || []).map((t) => t.name));
      if (!genre) continue;
      const titelBlok = m.find((x) => "title" in x && "subtitle" in x && x.title && !("date" in x));
      let naam = (titelBlok?.title || m.find((x) => x.stickyTitle)?.stickyTitle || "").trim();
      let sub = (titelBlok?.subtitle || "").trim();
      // "i.s.m. Hedon" is een samenwerking, geen titel; "Jimmy Carr: Laughs Funny" bevat dan artiest en titel.
      if (/^i\.?s\.?m\.?\s/i.test(sub)) {
        sub = "";
        const i = naam.indexOf(": ");
        if (i > 0) { sub = naam.slice(i + 2); naam = naam.slice(0, i); }
      }
      if (!naam) continue;
      const theater = /odeon/i.test(kop.information?.location || "") ? "odeon-zwolle" : "theater-de-spiegel";
      const menu = m.find((x) => Array.isArray(x.items) && "buttonTitle" in x);
      const data = menu?.items?.length ? menu.items.map((i) => ({ ...i.information, knop: i.link?.name })) : [kop.information];
      for (const d of data) {
        const w = wanneer(d.date, d.time);
        if (!w) continue;
        out.push({
          theater,
          artiesten: sub ? [netteNaam(naam)] : [],
          titel: netteHoofdletters((sub || naam).replace(/\.$/, "")),
          genre: herkenGenre(sub) === "oudejaarsconference" ? "oudejaarsconference" : genre,
          ...w,
          status: status(d.knop),
          soort: herkenSoort(sub, (kop.tags || []).map((t) => t.name).join(" ")),
          bron: url,
        });
      }
    }
    return out;
  },
};
