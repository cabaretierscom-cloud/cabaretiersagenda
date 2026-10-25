// "The Events Calendar" (WordPress-plug-in, ook wel Tribe Events). Veel kleinere zalen,
// comedyclubs en cafés gebruiken het. Het heeft een openbare databron:
// /wp-json/tribe/events/v1/events?start_date=...&per_page=50&page=N
import { getJson } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";
import { lokaleDatumTijd, herkenGenre, herkenSoort, splitsNaam, slug } from "../lib/normaliseer.mjs";

const UITVERKOCHT = /\[?\s*(sold[ -]?out|uitverkocht)\s*\]?/i;
const GEANNULEERD = /\[?\s*(geannuleerd|afgelast|cancell?ed)\s*\]?/i;

/**
 * @param {object} o
 * @param {string} o.id, o.naam, o.basis
 * @param {object[]} o.theaters        zalen van deze bron; de eerste is de standaard
 * @param {object} [o.locaties]        deel van de zaalnaam uit de bron -> theater-id
 * @param {string} [o.standaardGenre]  genre als niets herkend wordt (bijv. "stand-up" voor een comedyclub);
 *                                     zonder standaardGenre worden alleen herkende cabaret/comedy-avonden meegenomen
 */
export function eventsCalendar(o) {
  const standaard = o.theaters[0];
  const zaal = (venue) => {
    const naam = decodeEntities(venue?.venue || "");
    if (!naam) return standaard.id;
    const key = Object.keys(o.locaties || {}).find((k) => naam.toLowerCase().includes(k.toLowerCase()));
    if (key) return o.locaties[key];
    const plaats = venue.city || standaard.plaats;
    return { id: slug(naam.toLowerCase().includes(plaats.toLowerCase()) ? naam : `${naam} ${plaats}`), naam, plaats, land: "NL", soort: "comedyclub", website: venue.website || null };
  };

  return {
    id: o.id,
    naam: o.naam,
    theaters: o.theaters,

    async ophalen({ log, vandaag }) {
      const events = [];
      for (let page = 1; page <= 40; page++) {
        const d = await getJson(`${o.basis}/wp-json/tribe/events/v1/events?start_date=${vandaag}&per_page=50&page=${page}`);
        events.push(...(d.events || []));
        if (page >= (d.total_pages || 1)) break;
      }
      log(`${events.length} evenementen in de databron`);

      const out = [];
      for (const e of events) {
        let titel = stripTags(decodeEntities(e.title));
        const categorieen = (e.categories || []).map((c) => decodeEntities(c.name));
        const genre = herkenGenre(categorieen, titel, (e.tags || []).map((t) => t.name)) || o.standaardGenre;
        if (!genre) continue;
        const wanneer = e.all_day ? { datum: e.start_date.slice(0, 10), tijd: null } : lokaleDatumTijd(e.start_date);
        if (!wanneer) continue;

        let status = "gepland";
        if (UITVERKOCHT.test(titel)) { status = "uitverkocht"; titel = titel.replace(UITVERKOCHT, "").trim(); }
        if (GEANNULEERD.test(titel)) { status = "geannuleerd"; titel = titel.replace(GEANNULEERD, "").trim(); }
        titel = titel.replace(/\s*[|@]\s*$/, "").trim();

        // "Masters of Comedy bij Southend Comedy Club Amsterdam": de zaal hoort niet in de titel.
        titel = titel.replace(/\s+bij\s+(southend|comedy caf[eé]).*$/i, "").trim();
        // "Nadine Froughi – Daydreamer": artiest en titel. Zonder streepje is het een clubavond.
        let { artiest, titel: showTitel } = splitsNaam(titel, [" – ", " — ", " - "]);
        // Zonder streepje, met de titel tussen aanhalingstekens: "Özgür Turhan “Yepyenisi” Stand Up".
        // Alleen een korte naam met hoofdletters voor de titel telt als artiest ("Damian Skóra w programie" niet).
        const los = !artiest && titel.match(/^([A-ZÀ-Ý][^\s“"]*(?:\s+(?:van|de|der|den|[A-ZÀ-Ý][^\s“"]*)){0,3})\s+[“"]([^”"]+)[”"]/);
        if (los) [artiest, showTitel] = [los[1], los[2]];
        // "“Mama probeert ook maar wat” Southend Comedy Club Matinee show": alleen het deel tussen
        // de aanhalingstekens is de titel; daarachter staan zaal en soort avond.
        const tussen = (artiest ? showTitel : titel).match(/^\s*[“"]([^”"]+)[”"]/);
        out.push({
          theater: zaal(e.venue),
          artiesten: artiest ? [artiest] : [],
          // Een los aanhalingsteken zonder tegenhanger ("Yepyenisi” Stand Up") weg.
          titel: tussen ? tussen[1].trim() : (artiest ? showTitel : titel).replace(/^["“”]|["“”]$/g, "").replace(/^([^“"]*)”/, "$1").trim(),
          genre,
          ...wanneer,
          status,
          soort: herkenSoort(titel),
          bron: e.url,
        });
      }
      return out;
    },
  };
}
