// Amai Comedy Club, Gent (Wix). De pagina /event-list bevat de eerstvolgende twintig evenementen als
// gegevens (appsWarmupData: titel, omschrijving, start, adres, slug); dat is zo'n drie à vier weken
// vooruit. Meer laadt de site via een interne Wix-koppeling, die gebruiken we niet. Cursussen laten we weg.
import { getText } from "../lib/http.mjs";
import { lokaleDatumTijd, herkenGenre, herkenSoort } from "../lib/normaliseer.mjs";

const BASIS = "https://www.amaicomedyclub.com";
const CLUB = "amai-comedy-club-gent";
const OVERSLAAN = /course|cursus|workshop|niveau \d|les(sen)?\b|klas\b/i;

export default {
  id: "amai",
  naam: "Amai Comedy Club",
  theaters: [
    { id: CLUB, naam: "Amai Comedy Club", plaats: "Gent", land: "BE", soort: "comedyclub", website: BASIS },
  ],

  async ophalen({ log, vandaag }) {
    const html = await getText(`${BASIS}/event-list`);
    const start = html.indexOf('"events":{"events":[');
    if (start < 0) throw new Error("geen evenementen gevonden in de pagina");
    const lijst = html.slice(start + '"events":{"events":'.length);
    const events = JSON.parse(lijst.slice(0, eindVanLijst(lijst)));
    log(`${events.length} evenementen op de pagina`);
    const out = [];
    for (const e of events) {
      const titel = String(e.title || "").replace(/\s+/g, " ").trim();
      if (!titel || OVERSLAAN.test(titel)) continue;
      const w = lokaleDatumTijd(e.scheduling?.config?.startDate);
      if (!w || w.datum < vandaag) continue;
      // Avonden elders (niet in de Burgstraat) slaan we over: die zaal kennen we niet.
      if (!/burgstraat 59/i.test(e.location?.address || "")) continue;
      out.push({
        theater: CLUB,
        artiesten: [],
        titel: titel.replace(/\s*\((NL|ENG|EN|FR|ES)\)\s*$/i, "").trim(),
        genre: /impro/i.test(titel) ? "improvisatie" : herkenGenre(titel, e.description) || "stand-up",
        ...w,
        status: "gepland",
        soort: herkenSoort(titel),
        bron: `${BASIS}/event-details/${e.slug}`,
      });
    }
    return out;
  },
};

// Einde van de JSON-lijst die op positie 0 begint ("[...]"), rekening houdend met strings.
function eindVanLijst(s) {
  let diepte = 0, inString = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inString) { if (c === "\\") i++; else if (c === '"') inString = false; continue; }
    if (c === '"') inString = true;
    else if (c === "[" || c === "{") diepte++;
    else if (c === "]" || c === "}") { diepte--; if (diepte === 0) return i + 1; }
  }
  throw new Error("onvolledige evenementenlijst");
}
