// WordPress-theatersites van webbureau Eagerly (Het Park Hoorn, Goudse Schouwburg). De agenda laadt alles
// uit één JSON-bestand (/event_feed_json): per voorstelling artiest en titel ("Artiest – Titel" of
// title + storyline), genre (tags.genre of tags.interests) en per speeldatum tijd, zaal en kaartstatus.
// Eén verzoek per site is genoeg.
import { getJson } from "../lib/http.mjs";
import { decodeEntities } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";
import { artiestOfTitel } from "../lib/artiesten.mjs";

const SOORT_ACHTER = /\s*\((try[ -]?out|premi[eè]re|reprise|derni[eè]re)\)\s*$/i;
const schoon = (s) => decodeEntities(String(s || "")).replace(/\s+/g, " ").trim();
const AVOND = /comedy|lacht\b|caf[eé]\b/i;

// "202705072000" of "2027-05-07T20:00:00+02:00" -> { datum, tijd }
function wanneer(t) {
  const iso = String(t.program_start_iso || "").match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (iso) return { datum: iso[1], tijd: iso[2] };
  const k = String(t.program_start || "").match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  return k ? { datum: `${k[1]}-${k[2]}-${k[3]}`, tijd: `${k[4]}:${k[5]}` } : null;
}

/**
 * @param {object} o
 * @param {string} o.id, o.naam, o.basis
 * @param {object[]} o.theaters  zalen van deze bron; de eerste is de standaard
 * @param {(zaal: string) => string} [o.theater]  theater-id bij een zaalnaam uit de feed
 */
export function eventfeed(o) {
  return {
    id: o.id,
    naam: o.naam,
    theaters: o.theaters,

    async ophalen({ log }) {
      const { events } = await getJson(`${o.basis}/event_feed_json`);
      log(`${Object.keys(events).length} voorstellingen in de feed`);
      const out = [];
      for (const e of Object.values(events)) {
        const genre = herkenGenre(Object.values({ ...(e.tags?.genre || {}), ...(e.tags?.interests || {}) }));
        if (!genre) continue;
        let boven = schoon(e.title), onder = schoon(e.storyline || "");
        // "Martijn Koning – Overprikkeld": artiest en titel in de kop. Een subtitle is dan een slogan
        // ("Winnaar Neerlands Hoop"); zonder streep in de kop is de subtitle de titel.
        if (!onder && / [–-] /.test(boven) && !AVOND.test(boven)) [boven, onder] = boven.split(/ [–-] /, 2);
        else if (!onder) onder = schoon(e.subtitle || "");
        // "Noord-Hollandse Comedy Show – Humor van de streek" met dezelfde ondertitel nog eens.
        if (onder && boven.endsWith(` – ${onder}`)) boven = boven.slice(0, -onder.length - 3);
        // Een comedyavond met een slogan als ondertitel: de naam van de avond is de titel, zonder artiest.
        if (AVOND.test(boven) && onder.split(" ").length >= 5) onder = "";
        // "Blind Date – Cabaret" (Nationaal Theaterweekend): geen bekende artiest of titel.
        if (/blind date/i.test(`${boven} ${onder}`)) continue;
        const zonder = (s) => s.replace(SOORT_ACHTER, "").trim();
        const { artiest, titel } = artiestOfTitel(onder && !AVOND.test(boven) ? netteNaam(zonder(boven)) : null,
          netteHoofdletters(zonder(onder || boven).replace(/\.$/, "")));
        if (!titel) continue;
        for (const t of e.times || []) {
          const w = wanneer(t);
          if (!w) continue;
          const zaal = Object.values(t.location || {}).join(" ");
          out.push({
            theater: (o.theater && o.theater(zaal)) || o.theaters[0].id,
            artiesten: artiest ? [artiest] : [],
            titel,
            genre: /oudejaars/i.test(titel) ? "oudejaarsconference" : genre,
            ...w,
            status: /geannuleerd|afgelast/i.test(t.status_label) ? "geannuleerd" : /wachtlijst|uitverkocht/i.test(t.status_label) ? "uitverkocht" : "gepland",
            soort: herkenSoort(`${boven} ${onder}`),
            bron: e.permalink,
          });
        }
      }
      return out;
    },
  };
}
