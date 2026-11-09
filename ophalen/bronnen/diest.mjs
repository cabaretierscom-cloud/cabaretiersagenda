// CC Den Amer, Diest (eigen site, Ticketmatic).
// /nl/programma (een paar pagina's) heeft per avond een kaart (event-card) met genre ("Humor", "Familie 3+"), ticketstatus,
// datum en uur (<time datetime="2026-11-19 20:00:00">), titel en een regel eronder (slogan).
// Bij humor is de titel meestal de artiest en de slogan de voorstelling.
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const BASIS = "https://www.ccdiest.be";

function status(t) {
  t = String(t || "").toLowerCase();
  if (/geannuleerd|afgelast/.test(t)) return "geannuleerd";
  if (/verplaatst/.test(t)) return "verplaatst";
  if (/uitverkocht|volzet|wachtlijst/.test(t)) return "uitverkocht";
  return "gepland";
}

export default {
  id: "diest",
  naam: "CC Den Amer",
  theaters: [
    { id: "den-amer-diest", naam: "Den Amer", plaats: "Diest", land: "BE", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    // Het programma staat over een paar pagina's (?type[0]=event&page=2, 3, ...); stoppen als er geen kaarten meer zijn.
    const kaarten = [];
    for (let p = 1; p <= 20; p++) {
      const html = await getText(`${BASIS}/nl/programma?type%5B0%5D=event&page=${p}`).catch((e) => (/404/.test(e.message) ? "" : Promise.reject(e)));
      const k = html.split('<article class="event-card">').slice(1);
      if (!k.length) break;
      kaarten.push(...k);
      if (!html.includes(`page=${p + 1}`)) break;
    }
    const out = [];
    for (const k of kaarten) {
      const genreLabel = decodeEntities(stripTags(k.match(/event-card__genre">([\s\S]*?)<\/span>/)?.[1] || "")).trim();
      // "Familie 3+": het leeftijdslabel herkent herkenGenre, "Familie" ook.
      const genre = herkenGenre([genreLabel.replace(/\s+\d+\+$/, ""), genreLabel]);
      const d = k.match(/<time datetime="(\d{4}-\d\d-\d\d) (\d\d:\d\d)/);
      const link = k.match(/href="(\/nl\/event\/[^"]+)"/)?.[1];
      if (!genre || !d || !link || d[1] < vandaag) continue;
      const kop = decodeEntities(stripTags(k.match(/event-card__title">([\s\S]*?)<\/h3>/)?.[1] || "")).trim();
      const slogan = decodeEntities(stripTags(k.match(/event-card__slogan">([\s\S]*?)<\/p>/)?.[1] || "")).trim();
      const { artiest, titel } = slogan ? artiestOfTitel(netteNaam(kop), slogan) : { artiest: null, titel: kop };
      out.push({
        theater: "den-amer-diest",
        artiesten: artiest ? [artiest] : [],
        titel: netteHoofdletters(titel),
        genre: /oudejaars|eindejaars/i.test(`${kop} ${slogan}`) ? "oudejaarsconference" : genre,
        datum: d[1],
        tijd: d[2],
        status: status(k.match(/class="event-card__status(?:\s[^"]*)?"[^>]*>([^<]*)/)?.[1]),
        soort: herkenSoort(kop, slogan),
        bron: BASIS + link,
      });
    }
    log(`${kaarten.length} kaarten, ${out.length} humor of familie`);
    return out;
  },
};
