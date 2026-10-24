// Kunstmin, Dordrecht. De WordPress-koppeling (/wp-json/wp/v2/show) geeft per voorstelling artiest
// (acf.title), titel (acf.subtitle) en alle speeldata met kaartstatus (acf.events). We vragen alleen
// de genres Cabaret (37) en Cabaret & Komedie (59) op.
import { getJson } from "../lib/http.mjs";
import { decodeEntities } from "../lib/html.mjs";
import { herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const BASIS = "https://www.kunstmin.nl";
const STATUS = { sold_out: "uitverkocht", wait_list: "uitverkocht", cancelled: "geannuleerd", canceled: "geannuleerd" };

export default {
  id: "kunstmin",
  naam: "Kunstmin",
  theaters: [
    { id: "kunstmin", naam: "Kunstmin", plaats: "Dordrecht", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const shows = [];
    for (let p = 1; p <= 10; p++) {
      const pagina = await getJson(`${BASIS}/wp-json/wp/v2/show?show-genre=37,59&per_page=100&page=${p}&_fields=link,acf`).catch(() => []);
      shows.push(...pagina);
      if (pagina.length < 100) break;
    }
    log(`${shows.length} cabaretvoorstellingen`);
    const out = [];
    for (const s of shows) {
      const a = s.acf || {};
      const komend = (a.events || []).filter((e) => /^\d{8}$/.test(e.start_date) && `${e.start_date.slice(0, 4)}-${e.start_date.slice(4, 6)}-${e.start_date.slice(6)}` >= vandaag);
      if (!komend.length) continue;
      let boven = decodeEntities(a.title || "").trim(), onder = decodeEntities(a.subtitle || "").trim();
      // "Rof Daaimund" / "Isabelle Kafando presenteert een identiteitscrisis": titel boven, artiest onder.
      const pres = onder.match(/^(.+?)\s+presenteert\b/i);
      if (pres) [boven, onder] = [pres[1], boven];
      const zonder = (t) => t.replace(/\s*[-–(]\s*(try[ -]?out|premi[eè]re|reprise)\)?\s*$/i, "").trim();
      const { artiest, titel } = artiestOfTitel(onder ? netteNaam(zonder(boven)) : null, netteHoofdletters(zonder(onder || boven).replace(/\.$/, "")));
      if (!titel) continue;
      for (const e of komend) {
        out.push({
          theater: "kunstmin",
          artiesten: artiest ? [artiest] : [],
          titel,
          genre: /oudejaars/i.test(titel) ? "oudejaarsconference" : "cabaret",
          datum: `${e.start_date.slice(0, 4)}-${e.start_date.slice(4, 6)}-${e.start_date.slice(6)}`,
          tijd: /^\d{2}:\d{2}/.test(e.start_time || "") ? e.start_time.slice(0, 5) : null,
          status: STATUS[e.status] || "gepland",
          soort: herkenSoort(boven, onder, s.link),
          bron: s.link,
        });
      }
    }
    return out;
  },
};
