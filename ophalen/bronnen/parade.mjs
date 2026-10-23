// Theater aan de Parade, 's-Hertogenbosch.
// Voorstellingspagina's uit de sitemap (/nl/programma/<voorstelling>). Elke pagina heeft de artiest
// in de kop (<h1>), de titel als ondertitel, genrelabels (<li class="tag">) en elke speeldatum
// als schema.org-evenement met de zaal.
import { getText } from "../lib/http.mjs";
import { sitemapUrls, jsonLd, isEvent, stripTags } from "../lib/html.mjs";
import { isBekend } from "../lib/artiesten.mjs";
import { lokaleDatumTijd, herkenGenre, herkenSoort, netteHoofdletters, netteNaam, schemaStatus } from "../lib/normaliseer.mjs";

const BASIS = "https://www.theateraandeparade.nl";
// "Davey Geernaert", "Rosalie Custers": voornaam met hoofdletter plus achternaam.
const lijktNaam = (s) => /^\p{Lu}[\p{L}'-]+(?: [\p{L}'.-]+){1,3}$/u.test(s);

export default {
  id: "parade",
  naam: "Theater aan de Parade",
  theaters: [
    { id: "theater-aan-de-parade", naam: "Theater aan de Parade", plaats: "'s-Hertogenbosch", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log }) {
    const urls = await sitemapUrls(`${BASIS}/sitemap.xml`, { filter: (u) => /\/nl\/programma\/[^/]+$/.test(u) });
    log(`${urls.length} voorstellingen in de sitemap`);
    const out = [];
    for (const url of urls) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const genre = herkenGenre([...html.matchAll(/<li class="tag"[^>]*>([^<]*)<\/li>/g)].map((m) => stripTags(m[1])));
      if (!genre) continue;
      let kop = stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]);
      let onder = stripTags(html.match(/<p class="subtitle[^"]*"[^>]*>([\s\S]*?)<\/p>/)?.[1]);
      // Meestal is de kop de artiest en de ondertitel de titel van de voorstelling; soms andersom.
      // Zonder ondertitel is de kop de titel.
      if (onder && isBekend(onder) && !isBekend(kop)) [kop, onder] = [onder, kop];
      let artiesten = onder ? [netteNaam(kop)] : [];
      let titelTekst = onder || kop;
      const delen = onder.split(/\s*(?:&|,|\ben\b)\s*/).filter(Boolean);
      if (!isBekend(kop) && delen.length > 1 && (delen.some(isBekend) || delen.every(lijktNaam))) {
        // Reeks of programma in de kop, artiesten in de ondertitel ("Happen & Lachen" / "Aren Scholte & ...").
        artiesten = delen.map(netteNaam);
        titelTekst = kop;
      } else if (/\bcabaret\b/i.test(onder)) {
        // Ondertitel is een omschrijving ("Cabaret met daghap"): alleen de kop als titel, geen artiest.
        artiesten = [];
        titelTekst = kop;
      }
      const titel = netteHoofdletters(titelTekst.replace(/\s*[-–(]\s*(try[ -]?out|premi[eè]re|reprise)\)?\s*$/i, "").replace(/\.$/, "").trim());
      for (const ev of jsonLd(html).filter(isEvent)) {
        const w = lokaleDatumTijd(ev.startDate);
        if (!w) continue;
        out.push({
          theater: "theater-aan-de-parade",
          artiesten,
          titel,
          genre: herkenGenre(titel) === "oudejaarsconference" ? "oudejaarsconference" : genre,
          ...w,
          status: schemaStatus(ev.eventStatus),
          soort: herkenSoort(onder, url),
          bron: url,
        });
      }
    }
    return out;
  },
};
