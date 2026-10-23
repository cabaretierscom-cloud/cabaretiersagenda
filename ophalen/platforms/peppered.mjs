// Peppered (peppered.nl) is een websiteplatform dat veel Nederlandse theaters gebruiken.
// Werkwijze:
//  1. De agendalijst bladeren (?pNN_page=2, 3, ...) voor alle voorstellingspagina's met hun genres.
//  2. Alleen pagina's met cabaret- of comedygenres openen; daar staan alle speeldata als
//     schema.org-evenementen in, met de zaal per speeldatum.
//  3. De verkoopstatus per avond (uitverkocht, wachtlijst) uit de lijst met speeldata halen.
import { get, getText } from "../lib/http.mjs";
import { jsonLd, isEvent, stripTags } from "../lib/html.mjs";
import { lokaleDatumTijd, herkenGenre, herkenSoort, schemaStatus, netteNaam, netteHoofdletters, slug } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const MAANDEN = { jan: 1, feb: 2, mrt: 3, maa: 3, apr: 4, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12 };
const STATUS = { uitverkocht: "uitverkocht", wachtlijst: "uitverkocht", geannuleerd: "geannuleerd", afgelast: "geannuleerd", verplaatst: "verplaatst" };

// Kaarten in de agendalijst: link, artiest/titel en genres.
function kaarten(html, basis) {
  return html.split(/<li\s[^>]*eventCard/).slice(1).map((c) => {
    const href = c.match(/<a class="desc" href="([^"]+)"/)?.[1] || c.match(/<a[^>]+href="([^"]+)"/)?.[1];
    return {
      url: href ? new URL(href, basis).href : null,
      kop: stripTags(c.match(/<h3 class="title">([\s\S]*?)<\/h3>/)?.[1]),
      ondertitel: stripTags(c.match(/<div class="subtitle">([\s\S]*?)<\/div>/)?.[1]),
      genres: [...c.matchAll(/class="genres__link"[^>]*>([^<]*)</g)].map((m) => stripTags(m[1])),
    };
  }).filter((k) => k.url);
}

// Status per speeldag uit de lijst met speeldata op de voorstellingspagina ("di 3 nov" + knopklasse).
function statusPerDag(html) {
  const out = new Map();
  for (const blok of html.split(/<li class="subshow/).slice(1)) {
    const d = stripTags(blok.match(/<div class="date">([\s\S]*?)<\/div>\s*<\/div>/)?.[1] || "").match(/(\d{1,2})\s+([a-z]{3})/i);
    const st = blok.match(/status-([a-z-]+)/)?.[1];
    if (d && st && MAANDEN[d[2].toLowerCase()]) out.set(`${Number(d[1])}-${MAANDEN[d[2].toLowerCase()]}`, STATUS[st] || "gepland");
  }
  return out;
}

// "Leven met humor - première" -> "Leven met humor"
const zonderSoort = (t) => netteHoofdletters(t.replace(/\s*[-–—|(]\s*(try[ -]?out|premi[eè]re|derni[eè]re|reprise)\)?\s*$/i, "").replace(/\.$/, "").trim());

/**
 * @param {object} o
 * @param {string} o.id           bron-id, bijv. "kleine-komedie"
 * @param {string} o.naam         naam voor de logboeken
 * @param {string} o.basis        https://www.voorbeeld.nl
 * @param {string} o.agenda       pad van de agendalijst, bijv. "/agenda"
 * @param {object[]} o.theaters   zalen van deze bron (ons formaat)
 * @param {object} [o.locaties]   deel van een locatienaam uit de bron -> theater-id. Bij een bron met
 *                                meerdere zalen (o.meerdereZalen) wordt een onbekende locatie een nieuw
 *                                theater met de plaats uit de evenementgegevens. Waarde false: overslaan
 *                                (die zaal heeft een eigen bron).
 * @param {boolean} [o.meerdereZalen]
 * @param {boolean} [o.titelEerst]  de kaart toont eerst de titel en dan de artiest (bijv. Bellevue)
 * @param {number} [o.maxPaginas] veiligheidsgrens voor het bladeren
 * @param {RegExp} [o.voorvoegsel] reeksnaam voor de artiest die weg moet ("kweek: " bij De Lawei)
 */
export function peppered(o) {
  const standaard = o.theaters[0];
  const locatie = (place) => {
    const naam = stripTags(place?.name || "");
    if (!naam) return standaard.id;
    const key = Object.keys(o.locaties || {}).find((k) => naam.toLowerCase().includes(k.toLowerCase()));
    if (key) return o.locaties[key] || null;
    if (!o.meerdereZalen) return standaard.id;
    const plaats = (typeof place.address === "object" && place.address?.addressLocality) || standaard.plaats;
    return { id: slug(`${naam} ${naam.toLowerCase().includes(plaats.toLowerCase()) ? "" : plaats}`), naam, plaats, land: "NL", soort: "theater", website: null };
  };

  return {
    id: o.id,
    naam: o.naam,
    theaters: o.theaters,

    async ophalen({ log }) {
      // 1. Agendalijst bladeren.
      const eerste = await get(o.basis + o.agenda);
      const param = eerste.text.match(/[?&](p\d+_page)=\d+/)?.[1];
      const alle = new Map();
      for (const k of kaarten(eerste.text, o.basis)) alle.set(k.url, k);
      for (let p = 2; param && p <= (o.maxPaginas ?? 60); p++) {
        const html = await getText(`${o.basis}${o.agenda}?${param}=${p}`);
        const nieuw = kaarten(html, o.basis).filter((k) => !alle.has(k.url));
        if (!nieuw.length) break;
        for (const k of nieuw) alle.set(k.url, k);
      }
      // Zalen die we overslaan (locaties met false) ook herkennen aan de kaarttekst ("in Klein Bellevue").
      const overslaan = Object.entries(o.locaties || {}).filter(([, v]) => v === false).map(([k]) => k.toLowerCase());
      const kandidaten = [...alle.values()]
        .filter((k) => !overslaan.some((n) => `${k.kop} ${k.ondertitel}`.toLowerCase().includes(n)))
        .map((k) => o.voorvoegsel ? { ...k, kop: k.kop.replace(o.voorvoegsel, ""), ondertitel: k.ondertitel.replace(o.voorvoegsel, "") } : k)
        .map((k) => ({ ...k, genre: herkenGenre(k.genres, k.kop, k.ondertitel) }))
        .filter((k) => k.genre);
      log(`${alle.size} voorstellingen in de agenda, ${kandidaten.length} cabaret/comedy`);

      // 2. Voorstellingspagina's openen.
      const out = [];
      for (const k of kandidaten) {
        let html;
        try { html = await getText(k.url); } catch (e) { log(`overgeslagen: ${k.url} (${e.message})`); continue; }
        const statussen = statusPerDag(html);
        const titelRuw = k.ondertitel || "";
        const soortUitTitel = herkenSoort(titelRuw);
        const [artiestTekst, titelTekst] = o.titelEerst ? [k.ondertitel, k.kop] : [k.kop, k.ondertitel];
        // "Valentina Tóth (try-out)": de soort hoort niet bij de naam.
        const artiestRuw = k.ondertitel ? netteNaam(artiestTekst.replace(/\s*\((try[ -]?out|premi[eè]re|derni[eè]re|reprise)\)\s*$/i, "").trim()) : null;
        const { artiest, titel } = artiestOfTitel(artiestRuw, zonderSoort(k.ondertitel ? titelTekst : k.kop));
        for (const ev of jsonLd(html).filter(isEvent)) {
          const wanneer = lokaleDatumTijd(ev.startDate);
          if (!wanneer) continue;
          const theater = locatie(ev.location);
          if (!theater) continue;
          const [, m, d] = wanneer.datum.split("-").map(Number);
          let status = schemaStatus(ev.eventStatus);
          if (status === "gepland") {
            const offers = [].concat(ev.offers || []);
            if (offers.some((x) => /SoldOut/i.test(x.availability || ""))) status = "uitverkocht";
            else status = statussen.get(`${d}-${m}`) || "gepland";
          }
          out.push({
            theater,
            artiesten: artiest ? [artiest] : [],
            titel,
            genre: k.genre,
            ...wanneer,
            status,
            soort: soortUitTitel || herkenSoort(ev.name),
            bron: k.url,
          });
        }
      }
      return out;
    },
  };
}
