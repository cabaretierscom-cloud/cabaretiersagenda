// Voor theatersites zonder vast platform die per voorstelling een pagina hebben met de speeldata
// als schema.org-evenementen (JSON-LD). Per site geef je op waar de voorstellingspagina's staan,
// waar het genre op de pagina staat en eventueel hoe artiest en titel uit elkaar te halen zijn.
import { getText, stelPauzeIn } from "../lib/http.mjs";
import { sitemapUrls, jsonLd, isEvent, stripTags } from "../lib/html.mjs";
import { lokaleDatumTijd, herkenGenre, herkenSoort, netteHoofdletters, netteNaam, schemaStatus } from "../lib/normaliseer.mjs";
import { isBekend, artiestOfTitel } from "../lib/artiesten.mjs";

// "| Reprise", "(try-out)" en dergelijke achter een titel weghalen; de soort halen we apart op.
const SOORT_ACHTER = /\s*[-–|(,]\s*(try[ -]?out|premi[eè]re|derni[eè]re|reprise)\)?\s*$/i;
const ALLEEN_SOORT = /^(try[ -]?out|premi[eè]re|derni[eè]re|reprise)$/i;
// "Try - out" -> "try-out"
const tryOut = (s) => String(s || "").replace(/\btry\s*-\s*out\b/gi, "try-out");
const schoon = (s) => {
  const t = tryOut(s).replace(SOORT_ACHTER, "").replace(SOORT_ACHTER, "").replace(/\.$/, "").replace(/\s+/g, " ").trim();
  return ALLEEN_SOORT.test(t) ? "" : netteHoofdletters(t);
};

// "Artiest - Titel" of "Titel, Artiest": het deel dat een bekende artiest is, is de artiest.
// Anders bepaalt `volgorde` van de bron welk deel de artiest is.
export function artiestEnTitel(naam, { scheiders = [" - ", " – ", " | "], volgorde = "artiest-titel" } = {}) {
  const s = String(naam || "").replace(/\s+/g, " ").trim();
  for (const sep of scheiders) {
    const i = s.indexOf(sep);
    if (i <= 0) continue;
    const a = s.slice(0, i).trim(), b = s.slice(i + sep.length).trim();
    if (isBekend(b) && !isBekend(a)) return { artiest: b, titel: a };
    if (isBekend(a)) return { artiest: a, titel: b };
    return volgorde === "titel-artiest" ? { artiest: b, titel: a } : { artiest: a, titel: b };
  }
  return { artiest: isBekend(s) ? s : null, titel: s };
}

// Evenementen van andere voorstellingen ("Ook interessant") op dezelfde pagina: hun url of
// kaartlink wijst naar een andere pagina van dezelfde site.
function hoortElders(ev, pagina) {
  const kaart = [].concat(ev.offers || [])[0]?.url;
  const link = ev.url || (kaart && !/bestel|ticket|order|kaart|checkout/i.test(kaart) ? kaart : null);
  if (!link) return false;
  try {
    const a = new URL(link, pagina), b = new URL(pagina);
    // "/nl/evenement/x" en "/evenement/x" zijn dezelfde pagina.
    const pad = (u) => u.pathname.replace(/^\/(nl|en|fr|de)(?=\/)/, "").replace(/\/+$/, "");
    // Een link naar de voorpagina zegt niets (Ogterop).
    if (!pad(a)) return false;
    // Een onderliggende pagina per speeldatum (".../22-10-2026-20-15") hoort er wel bij.
    return a.hostname.replace(/^www\./, "") === b.hostname.replace(/^www\./, "") && pad(a) !== pad(b) && !pad(a).startsWith(pad(b) + "/");
  } catch { return false; }
}

/**
 * @param {object} o
 * @param {string} o.id, o.naam
 * @param {object[]} o.theaters        zalen van deze bron; de eerste is de standaard
 * @param {string} [o.sitemap]         sitemap met de voorstellingspagina's
 * @param {RegExp} [o.voorstelling]    welke adressen uit de sitemap voorstellingen zijn
 * @param {() => Promise<string[]>} [o.urls]  in plaats van sitemap: eigen lijst met adressen
 * @param {(html: string) => string|string[]} o.genre  genrelabel(s) van de voorstelling zelf
 * @param {(html: string, ev: object) => {artiest?: string, titel: string}} [o.artiestEnTitel]
 * @param {object} [o.splitsen]        opties voor artiestEnTitel(ev.name) als o.artiestEnTitel ontbreekt
 * @param {(ev: object, html: string, url: string) => string|null} [o.theater]  theater-id per evenement
 * @param {[string, number]} [o.pauze] [host, ms] voor sites die rustiger benaderd willen worden
 */
export function jsonldBron(o) {
  return {
    id: o.id,
    naam: o.naam,
    theaters: o.theaters,

    async ophalen({ log }) {
      if (o.pauze) stelPauzeIn(...o.pauze);
      const urls = o.urls ? await o.urls() : await sitemapUrls(o.sitemap, { filter: (u) => o.voorstelling.test(u) });
      log(`${urls.length} voorstellingen gevonden`);
      const out = [];
      for (const url of [...new Set(urls)]) {
        let html;
        try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
        const genre = herkenGenre([].concat(o.genre(html) || []).map(stripTags));
        if (!genre) continue;
        for (const ev of jsonLd(html).filter(isEvent)) {
          if (hoortElders(ev, url)) continue;
          const w = lokaleDatumTijd(ev.startDate);
          if (!w) continue;
          const naam = stripTags(ev.name || "");
          const gevonden = o.artiestEnTitel ? o.artiestEnTitel(html, ev) : artiestEnTitel(naam, o.splitsen);
          const { artiest, titel } = artiestOfTitel(gevonden.artiest, gevonden.titel);
          const titelSchoon = schoon(titel) || schoon(artiest);
          if (!titelSchoon) continue;
          const theater = o.theater ? o.theater(ev, html, url) : o.theaters[0].id;
          if (!theater) continue;
          let status = schemaStatus(ev.eventStatus);
          const offers = [].concat(ev.offers || []);
          if (status === "gepland" && offers.length && offers.every((x) => /SoldOut/i.test(x.availability || ""))) status = "uitverkocht";
          out.push({
            theater,
            artiesten: artiest ? [netteNaam(schoon(artiest))] : [],
            titel: titelSchoon,
            genre: herkenGenre(titelSchoon) === "oudejaarsconference" ? "oudejaarsconference" : genre,
            ...w,
            status,
            soort: herkenSoort(tryOut(naam), tryOut(titel), url),
            bron: url,
          });
        }
      }
      return out;
    },
  };
}
