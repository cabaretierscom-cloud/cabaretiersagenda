// CC Gildhof, Tielt (Drupal, tickets via Tixly). robots.txt verbiedt de filters (f%5B...) en vraagt
// 10 seconden tussen verzoeken; daarom bladeren we door het hele programma (?page=N) en nemen alleen de
// kaarten met het label "humor" of "Familievoorstelling". Per kaart: titel ("Artiest - Titel"), link,
// soort activiteit en datum met uur ("Woensdag 11/11/2026 - 20:00 - 22:00").
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";
import { herkenSoort, netteHoofdletters } from "../lib/normaliseer.mjs";
import { splitsKop } from "../lib/titel-splitsen.mjs";

const BASIS = "https://www.gildhof.be";
const SOORTEN = { humor: "comedy", familievoorstelling: "kindervoorstellingen" };

export default {
  id: "gildhof",
  naam: "CC Gildhof",
  theaters: [
    { id: "cc-gildhof-tielt", naam: "CC Gildhof", plaats: "Tielt", land: "BE", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const out = [];
    let n = 0;
    for (let p = 0; p <= 30; p++) {
      const html = await getText(`${BASIS}/programma?sort_by=date_sort&sort_order=ASC${p ? `&page=${p}` : ""}`);
      const kaarten = html.split('<a class="card-link"').slice(1);
      if (!kaarten.length) break;
      n += kaarten.length;
      for (const k of kaarten) {
        const label = (k.match(/activity-type">([^<]*)/)?.[1] || "").trim().toLowerCase();
        const genre = SOORTEN[label];
        if (!genre) continue;
        const href = k.match(/href="([^"]+)"/)?.[1];
        const kop = decodeEntities(stripTags(k.match(/<h3 class="card-title">([\s\S]*?)<\/h3>/)?.[1] || "")).trim();
        // Eén kaart kan meer datums hebben: elke "dd/mm/jjjj - uu:mm" is een avond.
        for (const d of k.split("</article>")[0].matchAll(/(\d{2})\/(\d{2})\/(\d{4})(?:\s*-\s*(\d{2}:\d{2}))?/g)) {
          const datum = `${d[3]}-${d[2]}-${d[1]}`;
          if (!href || !kop || datum < vandaag) continue;
          const { artiest, titel } = splitsKop(kop);
          out.push({
            theater: "cc-gildhof-tielt",
            artiesten: artiest ? [artiest] : [],
            titel: netteHoofdletters(titel),
            genre: /oudejaars|eindejaars/i.test(kop) ? "oudejaarsconference" : genre,
            datum,
            tijd: d[4] || null,
            status: /uitverkocht|volzet/i.test(k) ? "uitverkocht" : "gepland",
            soort: herkenSoort(kop),
            bron: new URL(href, BASIS).href,
          });
        }
      }
      if (!html.includes(`page=${p + 1}`)) break;
    }
    log(`${n} kaarten in het programma, ${out.length} avonden humor of familie`);
    return out;
  },
};
