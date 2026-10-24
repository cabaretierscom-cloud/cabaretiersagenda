// PLT (Parkstad Limburg Theaters): Theater Heerlen, Theater Sittard, Theater Kerkrade en voorstellingen
// op andere plekken. De sitemap heeft een pagina per speeldatum (/programma/<naam>/dd-mm-jjjj-uu-mm),
// dus oude datums slaan we over zonder ze op te halen. Op de pagina: artiest (<h1>), titel (subtitle),
// genrelabels, zaal ("Theater Heerlen - Grote Zaal") en een TheaterEvent in JSON-LD met de plaats.
// De kaartstatus laadt de site met JavaScript; die nemen we niet over.
import { getText } from "../lib/http.mjs";
import { sitemapUrls, stripTags, jsonLd, isEvent } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam, slug } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const BASIS = "https://www.plt.nl";
const ZALEN = { "theater heerlen": "theater-heerlen", "theater sittard": "theater-sittard", "theater kerkrade": "theater-kerkrade" };

export default {
  id: "plt",
  naam: "PLT (Parkstad Limburg Theaters)",
  theaters: [
    { id: "theater-heerlen", naam: "Theater Heerlen", plaats: "Heerlen", land: "NL", soort: "theater", website: BASIS },
    { id: "theater-sittard", naam: "Theater Sittard", plaats: "Sittard", land: "NL", soort: "theater", website: BASIS },
    { id: "theater-kerkrade", naam: "Theater Kerkrade", plaats: "Kerkrade", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const urls = (await sitemapUrls(`${BASIS}/sitemap.xml`)).map((u) => [u, u.match(/\/programma\/[^/]+\/(\d{2})-(\d{2})-(\d{4})-(\d{2})-(\d{2})$/)])
      .filter(([, m]) => m && `${m[3]}-${m[2]}-${m[1]}` >= vandaag);
    log(`${urls.length} komende speeldata in de sitemap`);
    const out = [];
    for (const [url, m] of urls) {
      let html;
      try { html = await getText(url); } catch (e) { log(`overgeslagen: ${url} (${e.message})`); continue; }
      const kop = html.match(/<div class="show-detail-block__header">([\s\S]*?)<div class="show-detail-block__prices">/)?.[1] || "";
      // "Cabaret & Stand-up" is de hoofdgroep van al het cabaret, niet alleen stand-up.
      const labels = [...kop.matchAll(/class="tag">([^<]+)</g)].map((x) => stripTags(x[1]).replace(/^cabaret\s*&\s*stand-up$/i, "Cabaret"));
      const genre = herkenGenre(labels);
      // Kleinkunst zonder cabaretlabel is bij PLT vaak een concert of musical.
      if (!genre || labels.some((l) => /^musical$/i.test(l)) || (genre === "kleinkunst" && !labels.some((l) => /^cabaret$/i.test(l)))) continue;
      // "Kommil Foo (BE)": het land hoort niet bij de naam.
      const boven = stripTags(kop.match(/show-detail-block__title">([\s\S]*?)<\/h1>/)?.[1]).replace(/\s*\((BE|NL)\)\s*$/, "");
      if (/vastelaovendconcert/i.test(boven)) continue;
      const onder = stripTags(kop.match(/show-detail-block__subtitle">([\s\S]*?)<\/strong>/)?.[1]);
      const zonder = (s) => s.replace(/\s*[-–(]\s*(try[ -]?out|premi[eè]re|reprise)\)?\s*$/i, "").trim();
      const { artiest, titel } = artiestOfTitel(onder ? netteNaam(zonder(boven)) : null, netteHoofdletters(zonder(onder || boven).replace(/\.$/, "")));
      if (!titel) continue;
      const zaal = stripTags(html.match(/show-detail-block__location">([\s\S]*?)<\/span>/)?.[1]);
      const ev = jsonLd(html).filter(isEvent)[0];
      const sleutel = Object.keys(ZALEN).find((k) => zaal.toLowerCase().startsWith(k));
      const plaats = ev?.location?.address?.addressLocality?.trim();
      // "Laaglandzaal" zonder theaternaam: een zaal van het PLT-theater in die plaats
      // ("Buiten onze theaters - ..." is een andere zaal).
      let theater = sleutel ? ZALEN[sleutel] : !/^buiten/i.test(zaal) && ZALEN[`theater ${String(plaats).toLowerCase()}`] || null;
      if (!theater) {
        // "Buiten onze theaters - Rodahal Kerkrade": een andere zaal, met de plaats uit de JSON-LD.
        const naam = zaal.split(/\s+-\s+/).pop();
        if (!naam || !plaats) continue;
        theater = { id: slug(`${naam} ${naam.toLowerCase().includes(plaats.toLowerCase()) ? "" : plaats}`), naam, plaats, land: "NL", soort: "theater", website: null };
      }
      out.push({
        theater,
        artiesten: artiest ? [artiest] : [],
        titel,
        genre: /oudejaars/i.test(titel) ? "oudejaarsconference" : genre,
        datum: `${m[3]}-${m[2]}-${m[1]}`,
        tijd: `${m[4]}:${m[5]}`,
        status: "gepland",
        soort: herkenSoort(boven, onder, url),
        bron: url,
      });
    }
    return out;
  },
};
