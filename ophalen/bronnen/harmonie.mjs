// De Harmonie, Leeuwarden.
// De agendapagina laadt haar voorstellingen met een formulierverzoek naar /api/agenda
// (met het CSRF-token uit de pagina en de sessiecookie), gefilterd op genre.
// Dat doen we hier precies zo, voor de genres Cabaret en Comedy.
// Per avond: titel, ondertitel, genre, label (bijv. Uitverkocht) en datum; geen tijd.
import { getText, postForm } from "../lib/http.mjs";
import { decodeEntities, stripTags } from "../lib/html.mjs";
import { herkenGenre, herkenSoort, netteHoofdletters, netteNaam } from "../lib/normaliseer.mjs";

const BASIS = "https://harmonie.nl";
const GENRES = { 43: "cabaret", 67: "stand-up" };

function status(label) {
  const t = String(label || "").toLowerCase();
  if (/geannuleerd|afgelast/.test(t)) return "geannuleerd";
  if (/verplaatst/.test(t)) return "verplaatst";
  if (/uitverkocht|wachtlijst/.test(t)) return "uitverkocht";
  return "gepland";
}

export default {
  id: "harmonie",
  naam: "De Harmonie",
  theaters: [
    { id: "de-harmonie", naam: "De Harmonie", plaats: "Leeuwarden", land: "NL", soort: "theater", website: BASIS },
  ],

  async ophalen({ log }) {
    const pagina = await getText(`${BASIS}/agenda`);
    const token = pagina.match(/name="csrf-token" content="([^"]+)"/)?.[1];
    if (!token) throw new Error("geen CSRF-token op de agendapagina");
    const out = [];
    for (const [id, standaardGenre] of Object.entries(GENRES)) {
      const json = JSON.parse(await postForm(`${BASIS}/api/agenda`, { set: 19, genre: id }, {
        headers: { "x-csrf-token": token, "x-requested-with": "XMLHttpRequest", accept: "application/json" },
      }).then((r) => r.text));
      const items = json.items || [];
      log(`${items.length} avonden in genre ${standaardGenre}`);
      for (const it of items) {
        const d = String(it.datum_controle || "").match(/^(\d{4})(\d{2})(\d{2})$/);
        if (!d) continue;
        const titel = stripTags(decodeEntities(it.titel || "")).trim();
        const sub = stripTags(decodeEntities(it.subtitel || "")).trim();
        // "Cabaret Café / Met nieuwe namen" is een clubavond; bij een artiest is de ondertitel de voorstelling.
        const clubavond = /^met |nieuwe namen|diverse/i.test(sub) || !sub;
        out.push({
          theater: "de-harmonie",
          artiesten: clubavond ? [] : [netteNaam(titel)],
          titel: netteHoofdletters(clubavond ? titel : sub),
          genre: herkenGenre(sub, titel) === "oudejaarsconference" ? "oudejaarsconference" : herkenGenre(it.genre) || standaardGenre,
          datum: `${d[1]}-${d[2]}-${d[3]}`,
          tijd: null,
          status: status(it.label),
          soort: herkenSoort(it.label, sub),
          bron: `${BASIS}/agenda/${it.slug}/${it.id}`,
        });
      }
    }
    return out;
  },
};
