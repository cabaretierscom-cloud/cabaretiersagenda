// Speellijst van Anuar (anuar.show). De site laadt de shows met JavaScript uit een eigen openbaar bestand,
// /api/shows.php (JSON: date, city, venue, tickets, status, show_type); dat lezen we, net als de pagina zelf.
// Geen robots.txt op de site (404). Geen tijden in het bestand.
// show_type "Theater Show" is de tournee Ongeduldig Geduldig (cabaret), "Crowd Work" de stand-upavonden
// Staat ie Aan? in Utrecht (Comedyhuis, Knock Out Comedy Club).
// Werkt als een speellijst: samenvoegen.mjs koppelt de zaal aan een bekend theater in dezelfde plaats
// en slaat avonden over die een theaterbron al heeft.
import { readFileSync } from "node:fs";
import { getJson } from "../lib/http.mjs";
import { netteNaam } from "../lib/normaliseer.mjs";

const SITE = "https://anuar.show/";
const SOORTEN = {
  "theater show": { titel: "Ongeduldig Geduldig", genre: "cabaret" },
  "crowd work": { titel: "Staat ie Aan?", genre: "stand-up" },
};

const slugVan = (n) => n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// Land van een plaats volgens de zalen die we al kennen; onbekend is Nederland.
const bekendeZalen = JSON.parse(readFileSync(new URL("../../data/theaters.json", import.meta.url), "utf8"));
const landVan = new Map(bekendeZalen.map((t) => [slugVan(t.plaats), t.land]));

export default {
  id: "anuar",
  naam: "Speellijst van Anuar",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const shows = await getJson(`${SITE}api/shows.php`);
    const out = [];
    for (const s of shows) {
      if (!s.date || s.date < vandaag) continue;
      const soort = SOORTEN[String(s.show_type || "").toLowerCase()];
      if (!soort) { log(`onbekend soort show "${s.show_type}" op ${s.date}, overgeslagen`); continue; }
      // "KNOCK OUT COMEDY CLUB 15U MATINEE": het uur hoort niet bij de zaalnaam.
      const uur = String(s.venue).match(/\b(\d{1,2})U\b/i)?.[1];
      const zaal = netteNaam(String(s.venue).replace(/\s+\d{1,2}U\b.*$/i, "").replace(/\s+MATINEE$/i, "").trim());
      const plaats = netteNaam(String(s.city).trim()).replace(/^Den Bosch$/, "'s-Hertogenbosch");
      out.push({
        theater: { zoeken: true, naam: zaal, plaats, land: landVan.get(slugVan(plaats)) || "NL" },
        artiesten: ["Anuar"],
        titel: soort.titel,
        genre: soort.genre,
        datum: s.date,
        tijd: uur ? `${uur.padStart(2, "0")}:00` : null,
        status: s.status === "soldout" ? "uitverkocht" : s.status === "cancelled" ? "geannuleerd" : "gepland",
        soort: null,
        bron: /^https?:\/\//.test(s.tickets || "") ? s.tickets : SITE,
      });
    }
    log(`${shows.length} shows in het bestand, ${out.length} vanaf vandaag`);
    return out;
  },
};
