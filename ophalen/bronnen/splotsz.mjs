// SplotsZ, Roelofarendsveen (pop- en cultuurpodium, WordPress met Elementor).
// De cabaretvoorstellingen staan in de categorie /evenement-categorie/cabaret/; elke voorstelling heeft een eigen
// pagina met "20 november 2026 - 20:00" (inloop), de categorie (eventueel "Cabaret - uitverkocht"), de prijs, de kop
// "Artiest – Titel (try-out)" en "Start voorstelling – 21:00 uur". Dat laatste is het beginuur.
// Bij een dubbelcabaret (twee zalen, in de pauze wissel je) staat "Bij SplotsZ: Artiest – “Titel”": alleen die.
import { getText } from "../lib/http.mjs";
import { stripTags, decodeEntities } from "../lib/html.mjs";
import { herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const BASIS = "https://splotsz.nl";
const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

// De pagina als losse tekststukjes (koppen, regels), zonder scripts en stijlen.
function stukken(html) {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, "")
    .split(/<[^>]+>/)
    .map((x) => decodeEntities(stripTags(x)).replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export default {
  id: "splotsz",
  naam: "SplotsZ",
  theaters: [
    { id: "splotsz-roelofarendsveen", naam: "SplotsZ", plaats: "Roelofarendsveen", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    // Alle voorstellingspagina's uit de categorie (meer pagina's als die er zijn; na de laatste een 404).
    const links = new Set();
    for (let p = 1; p <= 5; p++) {
      let html;
      try { html = await getText(`${BASIS}/evenement-categorie/cabaret/${p > 1 ? `page/${p}/` : ""}`); } catch { break; }
      const voor = links.size;
      for (const m of html.matchAll(/href="(https:\/\/splotsz\.nl\/evenement\/[^"#?]+\/)"/g)) links.add(m[1]);
      if (links.size === voor) break;
    }
    const out = [];
    for (const url of links) {
      const t = stukken(await getText(url));
      const i = t.findIndex((x) => /^\d{1,2} \p{L}+ \d{4} - \d{2}:\d{2}$/u.test(x));
      if (i < 0) continue;
      const [, dag, maand, jaar, inloop] = t[i].match(/^(\d{1,2}) (\p{L}+) (\d{4}) - (\d{2}:\d{2})$/u);
      const m = MAANDEN.indexOf(maand.toLowerCase());
      if (m < 0) continue;
      const datum = `${jaar}-${String(m + 1).padStart(2, "0")}-${dag.padStart(2, "0")}`;
      if (datum < vandaag) continue;
      const rest = t.slice(i + 1, i + 40);
      const categorie = rest.find((x) => /^cabaret\b/i.test(x)) || "";
      const prijs = rest.findIndex((x) => /^€/.test(x));
      const kop = rest[prijs + 1] || "";
      const start = rest.join(" ").match(/Start voorstelling\s*[–-]\s*(\d{1,2}[:.]\d{2})/i)?.[1]?.replace(".", ":") || inloop;
      // Dubbelcabaret: alleen de artiest die bij SplotsZ speelt.
      const hier = t.map((x) => x.match(/^Bij SplotsZ:\s*(.+?)\s+[–-]\s+[“"‘']?(.+?)[”"’']?$/)).find(Boolean);
      const ruw = hier ? `${hier[1]} – ${hier[2]}` : kop;
      const delen = ruw.replace(/\s*\((?:try-?out|première)\)\s*/gi, " ").trim().split(/\s+[–-]\s+/);
      let artiest = netteNaam(delen[0].replace(/\s+show$/i, ""));
      let titel = delen.slice(1).join(" – ");
      let genre = "cabaret";
      // "Knock Out Comedy Crew – Stand-up comedy": geen titel maar het genre.
      if (/^stand-?up( comedy)?$/i.test(titel)) { genre = "stand-up"; titel = ""; }
      if (/improvisatie/i.test(rest.slice(0, 12).join(" "))) genre = "improvisatie";
      ({ artiest, titel } = titel ? artiestOfTitel(artiest, titel) : { artiest, titel });
      out.push({
        theater: "splotsz-roelofarendsveen",
        artiesten: artiest ? [artiest] : [],
        titel: titel ? netteHoofdletters(titel) : "",
        genre,
        datum,
        tijd: start.padStart(5, "0"),
        status: /uitverkocht/i.test(categorie) ? "uitverkocht" : /geannuleerd|afgelast/i.test(categorie) ? "geannuleerd" : "gepland",
        soort: herkenSoort(ruw),
        bron: url,
      });
    }
    log(`${links.size} pagina's in de categorie Cabaret, ${out.length} komende voorstellingen`);
    return out;
  },
};
