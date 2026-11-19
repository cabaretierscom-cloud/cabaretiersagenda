// CC Casino, Koksijde (Drupal). Het programma heeft categoriefilters (/programma?f[0]=categorie:1 is Humor,
// :18 Familie); per voorstelling een teaser met datum en uur ("wo 11.11.2026 - 20:00"), titel en link,
// en een vlag als UITVERKOCHT of VOLZET. Per categorie bladeren met &page=N.
import { getText } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";
import { herkenSoort, netteHoofdletters } from "../lib/normaliseer.mjs";
import { splitsKop } from "../lib/titel-splitsen.mjs";

const BASIS = "https://www.casinokoksijde.be";
const CATEGORIEEN = [["1", "comedy"], ["18", "kindervoorstellingen"]];

export default {
  id: "koksijde",
  naam: "CC Casino Koksijde",
  theaters: [
    { id: "cc-casino-koksijde", naam: "CC Casino", plaats: "Koksijde", land: "BE", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const out = [];
    for (const [cat, genre] of CATEGORIEEN) {
      let n = 0;
      for (let p = 0; p <= 10; p++) {
        const html = await getText(`${BASIS}/programma?f%5B0%5D=categorie%3A${cat}${p ? `&page=${p}` : ""}`);
        const teasers = html.split('node--type-event node--view-mode-teaser').slice(1);
        if (!teasers.length) break;
        n += teasers.length;
        for (const t of teasers) {
          const d = t.match(/advanced-date field__item"><div>[a-z]{2}\s+(\d{2})\.(\d{2})\.(\d{4})(?:\s*-\s*(\d{2}:\d{2}))?/i);
          const a = t.match(/<h2><a href="([^"]+)">([\s\S]*?)<\/a><\/h2>/);
          if (!d || !a) continue;
          const datum = `${d[3]}-${d[2]}-${d[1]}`;
          if (datum < vandaag) continue;
          const kop = decodeEntities(stripTags(a[2])).trim();
          const vlag = t.match(/field-flag field__item">([^<]*)/)?.[1] || "";
          const { artiest, titel } = splitsKop(kop);
          out.push({
            theater: "cc-casino-koksijde",
            artiesten: artiest ? [artiest] : [],
            titel: netteHoofdletters(titel),
            genre: /oudejaars|eindejaars/i.test(kop) ? "oudejaarsconference" : genre,
            datum,
            tijd: d[4] || null,
            status: /uitverkocht|volzet/i.test(vlag) ? "uitverkocht" : /geannuleerd|afgelast/i.test(vlag) ? "geannuleerd" : "gepland",
            soort: herkenSoort(kop),
            bron: new URL(a[1], BASIS).href,
          });
        }
        if (!html.includes(`page=${p + 1}`)) break;
      }
      log(`categorie ${cat}: ${n} teasers`);
    }
    return out;
  },
};
