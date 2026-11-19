// Arenberg, Antwerpen (Ticketmatic, eigen site).
// De programmalijst (/nl/programma?page=N) heeft per avond een kaart met datum, artiest (titel), voorstelling
// (ondertitel), genrelabel ("Comedy", "Muziek", ...) en status ("Koop tickets", "Wachtlijst").
// Alleen voor de kaarten met een humor- of kinderlabel openen we de voorstellingspagina, voor het beginuur
// (schema.org-evenement). De eventStatus daar staat altijd op "cancelled", die gebruiken we dus niet.
import { getText } from "../lib/http.mjs";
import { stripTags, decodeEntities } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const BASIS = "https://www.arenberg.be";

function status(tekst) {
  const t = String(tekst || "").toLowerCase();
  if (/geannuleerd|afgelast/.test(t)) return "geannuleerd";
  if (/verplaatst/.test(t)) return "verplaatst";
  if (/uitverkocht|wachtlijst/.test(t)) return "uitverkocht";
  return "gepland";
}

function kaarten(html) {
  return html.split(/<article\s+class="event-list-item"/).slice(1).map((k) => ({
    url: k.match(/href="([^"]+)"/)?.[1],
    datum: k.match(/<time\s+datetime="(\d{4}-\d\d-\d\d)"/)?.[1],
    kop: decodeEntities(stripTags(k.match(/event-list-item__title[^>]*>([\s\S]*?)<\/h3>/)?.[1] || "")).trim(),
    onder: decodeEntities(stripTags(k.match(/event-list-item__subtitle">([\s\S]*?)<\/span>/)?.[1] || "")).trim(),
    labels: [...k.matchAll(/event-list-item__label">([^<]*)</g)].map((m) => m[1].trim()),
    status: k.match(/event-list-item__status">([^<]*)/)?.[1],
  })).filter((k) => k.url && k.datum);
}

export default {
  id: "arenberg",
  naam: "Arenberg",
  theaters: [
    { id: "arenberg", naam: "Arenberg", plaats: "Antwerpen", land: "BE", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const alle = [];
    // De eerste pagina is /nl/programma (zonder page), daarna ?page=1, 2, ...
    for (let p = 0; p <= 30; p++) {
      // Na de laatste pagina geeft de site een 404: dan zijn we klaar.
      const k = kaarten(await getText(`${BASIS}/nl/programma${p ? `?page=${p}` : ""}`).catch((e) => (/404/.test(e.message) ? "" : Promise.reject(e))));
      if (!k.length) break;
      alle.push(...k);
    }
    // ?page=1 is soms dezelfde als de eerste pagina: elke avond maar één keer.
    const uniek = [...new Map(alle.map((k) => [`${k.url}|${k.datum}`, k])).values()];
    const kandidaten = uniek.filter((k) => k.datum >= vandaag).map((k) => ({ ...k, genre: herkenGenre(k.labels) })).filter((k) => k.genre);
    log(`${uniek.length} avonden in het programma, ${kandidaten.length} humor of jeugd`);
    const tijden = new Map();
    const out = [];
    for (const k of kandidaten) {
      const url = new URL(k.url, BASIS).href;
      if (!tijden.has(url)) {
        const html = await getText(url).catch(() => "");
        tijden.set(url, [...html.matchAll(/"startDate"\s*:\s*"(\d{4}-\d\d-\d\d)\D*(\d\d:\d\d)/g)].map((m) => [m[1], m[2]]));
      }
      const tijd = tijden.get(url).find(([d]) => d === k.datum)?.[1] || null;
      // Kop is meestal de artiest (in hoofdletters), de ondertitel de voorstelling; zonder ondertitel alleen een titel.
      // Soms andersom ("ROF DAAIMUND" / "Isabelle Kafando"): bekende artiesten beslissen (artiestOfTitel).
      const { artiest, titel } = k.onder ? artiestOfTitel(netteNaam(k.kop), netteHoofdletters(k.onder)) : { artiest: null, titel: netteHoofdletters(netteNaam(k.kop)) };
      out.push({
        theater: "arenberg",
        artiesten: artiest ? [artiest] : [],
        titel,
        genre: /oudejaars/i.test(`${k.kop} ${k.onder}`) ? "oudejaarsconference" : k.genre,
        datum: k.datum,
        tijd,
        status: status(k.status),
        soort: herkenSoort(k.kop, k.onder),
        bron: url,
      });
    }
    return out;
  },
};
