// Theater Walhalla, Rotterdam (Kantine Walhalla, Kleine Walhalla, Werkplaats).
// Het programma (/programma/page/N/) toont per avond een kaart met dag, maand en tijd
// (zonder jaartal), programmatitel, artiest, zaal en genrelabels. Kaarten verkoopt Stager.
import { getText } from "../lib/http.mjs";
import { stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";

const BASIS = "https://www.theaterwalhalla.nl";
const MAANDEN = { jan: 1, feb: 2, mrt: 3, apr: 4, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12 };
const ZALEN = { "kleine walhalla": "kleine-walhalla", werkplaats: "werkplaats-walhalla" };

// Het programma loopt chronologisch; een datum die al ruim voorbij is, valt in het volgende jaar.
function metJaar(dag, maand, vandaag) {
  const jaar = Number(vandaag.slice(0, 4));
  const d = `${jaar}-${String(maand).padStart(2, "0")}-${String(dag).padStart(2, "0")}`;
  const grens = new Date(new Date(vandaag).getTime() - 7 * 864e5).toISOString().slice(0, 10);
  return d < grens ? `${jaar + 1}${d.slice(4)}` : d;
}

export default {
  id: "walhalla",
  naam: "Theater Walhalla",
  theaters: [
    { id: "theater-walhalla", naam: "Theater Walhalla", plaats: "Rotterdam", land: "NL", soort: "theater", website: BASIS },
    { id: "kleine-walhalla", naam: "Kleine Walhalla", plaats: "Rotterdam", land: "NL", soort: "theater", website: BASIS },
    { id: "werkplaats-walhalla", naam: "Werkplaats Walhalla", plaats: "Rotterdam", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const out = [];
    let kaartenTotaal = 0;
    for (let p = 1; p <= 80; p++) {
      const html = await getText(p === 1 ? `${BASIS}/programma/` : `${BASIS}/programma/page/${p}/`).catch(() => "");
      const kaarten = html.split(/<div class="relative lg:pl-4 w-full h-full">/).slice(1);
      if (!kaarten.length) break;
      kaartenTotaal += kaarten.length;
      for (const k of kaarten) {
        const genres = [...k.matchAll(/\?_genre=[a-z0-9-]+"[\s\S]*?<span[^>]*>([^<]*)<\/span>/g)].map((m) => stripTags(m[1]));
        const genre = herkenGenre(genres);
        if (!genre) continue;
        const d = k.match(/<span class="text-5\.5xl leading-4">\s*\w+\s*<\/span>\s*<span class="text-8xl[^"]*">\s*(\d+)\s*<\/span>\s*<span class="pb-4[^"]*">\s*(\w+)\s*<\/span>\s*<span class="text-xl[^"]*">\s*(\d{1,2})[:.](\d{2})/);
        const url = k.match(/href="(https:\/\/www\.theaterwalhalla\.nl\/voorstelling\/[^"]+)"/)?.[1];
        if (!d || !url || !MAANDEN[d[2].toLowerCase()]) continue;
        const boven = stripTags(k.match(/<div class="z-10 mb-0[^"]*">([\s\S]*?)<\/div>/)?.[1]);
        const hoofdHtml = k.match(/<div class="z-10 font-[a-z]+ text-red text-5xl[^"]*">([\s\S]*?)<\/div>\s*<\/a>/)?.[1] || "";
        const sub = stripTags(hoofdHtml.match(/<div class="block font-light[^"]*">([\s\S]*?)<\/div>/)?.[1]).replace(/^\(\s*|\s*\)$/g, "");
        const naam = stripTags(hoofdHtml.replace(/<div class="block font-light[\s\S]*$/, ""));
        const titelRuw = boven || sub;
        // "(première)" of "try-out" hoort niet in de titel; is er verder geen titel, dan is de naam de titel.
        const schoon = titelRuw.replace(/\s*[-–(]?\s*(try[ -]?outs?|premi[eè]re)\s*\)?\s*$/i, "").replace(/^(try[ -]?outs?|premi[eè]re)$/i, "").trim();
        const zaalLabel = stripTags(k.match(/\?_venue=[a-z0-9-]+"[\s\S]*?<span[^>]*>([^<]*)<\/span>/)?.[1]).toLowerCase();
        out.push({
          theater: Object.entries(ZALEN).find(([n]) => zaalLabel.includes(n))?.[1] || "theater-walhalla",
          artiesten: schoon && naam ? [netteNaam(naam)] : [],
          titel: netteHoofdletters(schoon || naam),
          genre,
          datum: metJaar(Number(d[1]), MAANDEN[d[2].toLowerCase()], vandaag),
          tijd: `${d[3].padStart(2, "0")}:${d[4]}`,
          status: /uitverkocht/i.test(stripTags(k)) ? "uitverkocht" : "gepland",
          soort: herkenSoort(titelRuw) || herkenSoort(url),
          bron: url,
        });
      }
    }
    log(`${kaartenTotaal} avonden in het programma`);
    return out;
  },
};
