// Leidse Schouwburg en Stadsgehoorzaal Leiden: één WordPress-site. De evenementenfeed
// (/wp-json/eventfeed/v1/xml) geeft alle speeldata met zaal, tijd en kaartstatus, maar geen genre.
// Daarom halen we van elke komende voorstelling de pagina op: in de kop staan genre(s),
// artiest (<h1>) en titel (<h2>).
import { getText } from "../lib/http.mjs";
import { stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const BASIS = "https://leidseschouwburg-stadsgehoorzaal.nl";
const REEKS = /^caat comedy\b/i;
const veld = (item, naam) => stripTags(item.match(new RegExp(`<${naam}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${naam}>`))?.[1]);

export default {
  id: "leiden",
  naam: "Leidse Schouwburg en Stadsgehoorzaal",
  theaters: [
    { id: "leidse-schouwburg", naam: "Leidse Schouwburg", plaats: "Leiden", land: "NL", soort: "theater", website: BASIS },
    { id: "stadsgehoorzaal-leiden", naam: "Stadsgehoorzaal Leiden", plaats: "Leiden", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const feed = await getText(`${BASIS}/wp-json/eventfeed/v1/xml`);
    // Speeldata vanaf vandaag, per voorstellingspagina.
    const perPagina = new Map();
    for (const [, item] of feed.matchAll(/<contentitem>([\s\S]*?)<\/contentitem>/g)) {
      const start = veld(item, "start").match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
      const url = veld(item, "url");
      if (!start || start[1] < vandaag || !url.startsWith(`${BASIS}/voorstelling/`)) continue;
      const locatie = veld(item, "location").toLowerCase();
      // Alleen de twee eigen zalen; voorstellingen elders in Leiden (musea, hofjes) slaan we over.
      const theater = locatie.startsWith("stadsgehoorzaal") ? "stadsgehoorzaal-leiden" : locatie.startsWith("leidse schouwburg") ? "leidse-schouwburg" : null;
      if (!theater) continue;
      if (!perPagina.has(url)) perPagina.set(url, []);
      perPagina.get(url).push({ theater, datum: start[1], tijd: start[2], kaart: veld(item, "status").toLowerCase() });
    }
    log(`${perPagina.size} komende voorstellingen in de feed`);

    const out = [];
    for (const [url, data] of perPagina) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const kop = html.match(/<div class="event-hero__title-wrapper">([\s\S]*?)<div class="event-hero__info-wrapper">/)?.[1] || "";
      const genre = herkenGenre([...kop.matchAll(/<p class="event-hero__genre[^"]*">([\s\S]*?)<\/p>/g)].map((m) => stripTags(m[1])));
      if (!genre) continue;
      const h1 = stripTags(kop.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]);
      const onder = stripTags(kop.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1]);
      if (/^audities\b/i.test(h1)) continue;
      // "Caat Comedy: Jeroen Leenders", "Beleef 't Overdag: Annick Boer": de artiest staat na de dubbele punt.
      // "Leids Cabaret Festival 2027" is het festival zelf (zonder jaartal).
      let boven = netteNaam(h1.replace(/^[^:]+:\s*(?=\S)/, "").replace(/(festival)\s+\d{4}$/i, "$1"));
      // Comedyavonden van Café Caat ("Lachstof #2", "The Stand-up Club #3") hebben geen vaste artiest.
      if (REEKS.test(boven)) boven = null;
      let { artiest, titel } = artiestOfTitel(onder ? boven : null, netteHoofdletters((onder || boven || "").replace(/\s*[-–(]\s*(try[ -]?out|premi[eè]re|reprise)\)?\s*$/i, "").replace(/\.$/, "").trim()));
      // Alleen een naam en geen titel: een artiest als de beschrijving met die naam begint
      // ("Micky Overman brengt scherpe Britse comedy..."), anders een titel ("De Vrouwejaars: ...").
      const beschrijving = html.match(/<meta name="description" content="([^"]*)"/)?.[1] || "";
      if (!onder && !artiest && boven && beschrijving.startsWith(`${boven} `)) artiest = boven;
      if (!titel) continue;
      for (const d of data) {
        out.push({
          theater: d.theater,
          artiesten: artiest ? [artiest] : [],
          titel,
          genre: /oudejaars/i.test(titel) ? "oudejaarsconference" : genre,
          datum: d.datum,
          tijd: d.tijd,
          status: /geannuleerd|afgelast/.test(d.kaart) ? "geannuleerd" : /uitverkocht|wachtlijst/.test(d.kaart) ? "uitverkocht" : "gepland",
          soort: herkenSoort(onder, boven, url),
          bron: url,
        });
      }
    }
    return out;
  },
};
