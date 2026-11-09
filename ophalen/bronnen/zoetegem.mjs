// CC Zoetegem, Zottegem (eigen site met Ticketmatic).
// Het hele programma staat op /programma.aspx: per voorstelling een kaart met titel ("Artiest: Titel" of
// "Artiest - Titel"), link, categorieën (Humor, Muzikale humor, Familie, ...) en datum met uur
// ("23.04.2027 at 20:00"). Alleen humor en familie nemen we over.
import { getText } from "../lib/http.mjs";
import { stripTags, decodeEntities } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const BASIS = "https://cczoetegem.be";

// "Comedycafé: Bregje Iding, ..." is een clubavond zonder vaste artiest; anders deel vóór ":" of " - " als artiest.
function artiestEnTitel(kop) {
  const m = kop.match(/^(.+?)\s*(?::|\s[-–]\s)\s*(.+)$/);
  if (!m || /comedy\s?caf|try-?out|avond/i.test(m[1])) return { artiest: null, titel: kop };
  return artiestOfTitel(netteNaam(m[1].trim()), m[2].trim());
}

export default {
  id: "zoetegem",
  naam: "CC Zoetegem",
  theaters: [
    { id: "cc-zoetegem-zottegem", naam: "CC Zoetegem", plaats: "Zottegem", land: "BE", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const html = await getText(`${BASIS}/programma.aspx`);
    const kaarten = html.split("listItem All ProgrammaItem").slice(1);
    const out = [];
    for (const k of kaarten) {
      const ruw = decodeEntities(k.match(/<a class="card-item" title="([^"]*)"/)?.[1] || "").trim();
      // De zaal zet de status achter de titel ("Moh?! - UITVERKOCHT!", "Juk - geannuleerd!", "- laatste kaarten!").
      const st = ruw.match(/\s+[-–]\s+(uitverkocht|geannuleerd|afgelast|verplaatst|laatste kaarten)!?\s*$/i)?.[1]?.toLowerCase();
      const kop = ruw.replace(/\s+[-–]\s+(uitverkocht|geannuleerd|afgelast|verplaatst|laatste kaarten)!?\s*$/i, "").replace(/\s*\((Nederland|NL|BE|België)\)/gi, "").trim();
      const href = k.match(/<a class="card-item" title="[^"]*"\s+href="([^"]+)"/)?.[1];
      const cats = [...(k.match(/class="hidcategory"[^>]*>([\s\S]*?)<\/p>/)?.[1] || "").matchAll(/<a[^>]*>([^<]+)<\/a>/g)].map((m) => m[1].trim());
      const d = k.match(/hidDisplayDate">(\d{2})\.(\d{2})\.(\d{4})(?: at (\d{2}:\d{2}))?/);
      // Geen schoolvoorstellingen en geen filmvertoningen (Ciné Local).
      if (!kop || !href || !d || cats.includes("Scholen") || cats.includes("Film") || /^cin[ée]/i.test(kop)) continue;
      const datum = `${d[3]}-${d[2]}-${d[1]}`;
      const genre = herkenGenre(cats);
      if (!genre || datum < vandaag) continue;
      const { artiest, titel } = artiestEnTitel(kop);
      out.push({
        theater: "cc-zoetegem-zottegem",
        artiesten: artiest ? [artiest] : [],
        titel: netteHoofdletters(titel.replace(/\s*\(try-?out\)/i, "")),
        genre: /oudejaars|eindejaars/i.test(kop) ? "oudejaarsconference" : genre,
        datum,
        tijd: d[4] || null,
        status: st === "uitverkocht" ? "uitverkocht" : st === "geannuleerd" || st === "afgelast" ? "geannuleerd" : st === "verplaatst" ? "verplaatst" : "gepland",
        soort: herkenSoort(ruw),
        bron: new URL(href, BASIS + "/").href,
      });
    }
    log(`${kaarten.length} kaarten in het programma, ${out.length} humor of familie`);
    return out;
  },
};
