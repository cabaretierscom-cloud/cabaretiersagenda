// Leest de gegevens uit data/, controleert verwijzingen en bouwt de opzoektabellen
// die de templates gebruiken.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const LANDEN = { NL: "Nederland", BE: "België" };

export const STATUSSEN = {
  gepland: null,
  uitverkocht: "Uitverkocht",
  onzeker: "Datum onzeker",
  verplaatst: "Verplaatst",
  geannuleerd: "Geannuleerd",
};

export const SOORTEN = ["try-out", "première", "reprise", "dernière", "extra voorstelling"];

export const GENRES = {
  cabaret: "Cabaret",
  "stand-up": "Stand-up",
  oudejaarsconference: "Oudejaarsconference",
  theaterkomedie: "Theaterkomedie",
  "open-mic": "Open mic",
  improvisatie: "Improvisatie",
  festival: "Festival",
  "muzikaal-cabaret": "Muzikaal cabaret",
  kleinkunst: "Kleinkunst",
};

// Optioneel per artiest: solo ("persoon") of duo/groep ("groep"); zonder vorm raadt de site het aan de naam.
export const VORMEN = ["persoon", "groep"];

export const THEATERSOORTEN = ["theater", "cultuurcentrum", "comedyclub", "café", "festivalterrein", "overig"];

// Inktkleuren; de waarde is de naam van de CSS-variabele en de tekstkleur erop.
export const KLEUREN = {
  roze: ["--riso-pink", "#000"],
  geel: ["--riso-yellow", "#000"],
  blauw: ["--riso-blue", "#FFF"],
  groen: ["--riso-green", "#FFF"],
  oranje: ["--riso-orange", "#000"],
  paars: ["--riso-purple", "#FFF"],
  rood: ["--riso-red", "#000"],
  zwart: ["--riso-black", "#FFF"],
  aqua: ["--riso-aqua", "#000"],
  limoen: ["--riso-lime", "#000"],
  lila: ["--riso-lilac", "#000"],
};

const read = (dir, name) => JSON.parse(readFileSync(join(dir, name), "utf8"));

export function loadData(dir, { today }) {
  const artiesten = read(dir, "artiesten.json");
  const theaters = read(dir, "theaters.json");
  const voorstellingen = read(dir, "voorstellingen.json");
  const speeldata = read(dir, "speeldata.json");
  // Festivals bundelen voorstellingen: via hun "artiest" (Cameretten) of een stuk van de titel.
  const festivals = existsSync(join(dir, "festivals.json")) ? read(dir, "festivals.json") : [];

  const errors = [];
  const byId = (list, kind) => {
    const map = new Map();
    for (const item of list) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(item.id || "")) errors.push(`${kind}: ongeldige id "${item.id}"`);
      if (map.has(item.id)) errors.push(`${kind}: dubbele id "${item.id}"`);
      map.set(item.id, item);
    }
    return map;
  };
  const A = byId(artiesten, "artiesten.json");
  const T = byId(theaters, "theaters.json");
  const V = byId(voorstellingen, "voorstellingen.json");
  const F = byId(festivals, "festivals.json");
  for (const f of festivals) {
    if (!f.naam || !f.plaats) errors.push(`festival ${f.id}: naam en plaats zijn verplicht`);
    if (!LANDEN[f.land]) errors.push(`festival ${f.id}: onbekend land "${f.land}"`);
    for (const a of f.artiesten || []) if (!A.has(a)) errors.push(`festival ${f.id}: onbekende artiest "${a}"`);
  }

  for (const a of artiesten) {
    if (a.land != null && !LANDEN[a.land]) errors.push(`artiest ${a.id}: onbekend land "${a.land}"`);
    if (!KLEUREN[a.kleur]) errors.push(`artiest ${a.id}: onbekende kleur "${a.kleur}"`);
    if (a.vorm != null && !VORMEN.includes(a.vorm)) errors.push(`artiest ${a.id}: onbekende vorm "${a.vorm}"`);
    // Een foto mag alleen met naamsvermelding, licentie en bron.
    if (a.foto && typeof a.foto === "object" && !(a.foto.bestand && a.foto.alt && a.foto.maker && a.foto.licentie && a.foto.bron)) errors.push(`artiest ${a.id}: foto zonder alt-tekst, maker, licentie of bron`);
    if (a.foto?.bestand && !existsSync(join(dir, "..", "public", a.foto.bestand))) errors.push(`artiest ${a.id}: fotobestand ${a.foto.bestand} ontbreekt`);
  }
  for (const t of theaters) {
    if (!LANDEN[t.land]) errors.push(`theater ${t.id}: onbekend land "${t.land}"`);
    if (!THEATERSOORTEN.includes(t.soort)) errors.push(`theater ${t.id}: onbekende soort "${t.soort}"`);
  }
  for (const v of voorstellingen) {
    if (!GENRES[v.genre]) errors.push(`voorstelling ${v.id}: onbekend genre "${v.genre}"`);
    if (!Array.isArray(v.artiesten)) errors.push(`voorstelling ${v.id}: artiesten moet een lijst zijn`);
    // Een clubavond of open mic zonder vaste artiest hoort bij één zaal.
    if (!v.artiesten?.length && !T.has(v.theater)) errors.push(`voorstelling ${v.id}: geen artiesten en geen geldig theater`);
    for (const a of v.artiesten || []) if (!A.has(a)) errors.push(`voorstelling ${v.id}: onbekende artiest "${a}"`);
  }

  const seen = new Set();
  const gigs = [];
  speeldata.forEach((s, i) => {
    const where = `speeldata.json #${i + 1}`;
    if (!V.has(s.voorstelling)) errors.push(`${where}: onbekende voorstelling "${s.voorstelling}"`);
    if (!T.has(s.theater)) errors.push(`${where}: onbekend theater "${s.theater}"`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.datum || "")) errors.push(`${where}: datum moet JJJJ-MM-DD zijn`);
    if (s.tijd != null && !/^\d{2}:\d{2}$/.test(s.tijd)) errors.push(`${where}: tijd moet UU:MM zijn`);
    if (!(s.status in STATUSSEN)) errors.push(`${where}: onbekende status "${s.status}"`);
    if (s.soort != null && !SOORTEN.includes(s.soort)) errors.push(`${where}: onbekende soort "${s.soort}"`);
    if (!/^https?:\/\//.test(s.bron || "")) errors.push(`${where}: bron moet een webadres zijn`);
    // Dezelfde voorstelling, zaal, datum en tijd is één speeldatum.
    const key = [s.voorstelling, s.theater, s.datum, s.tijd || ""].join("|");
    if (seen.has(key)) errors.push(`${where}: dubbele speeldatum (${key})`);
    seen.add(key);
    gigs.push({ ...s, id: `${s.datum}-${s.theater}-${s.voorstelling}${s.tijd ? "-" + s.tijd.replace(":", "") : ""}` });
  });

  if (errors.length) {
    const err = new Error(`Fouten in de gegevens:\n  - ${errors.join("\n  - ")}`);
    err.dataErrors = errors;
    throw err;
  }

  const upcoming = gigs
    .filter((g) => g.datum >= today)
    .sort((a, b) =>
      a.datum.localeCompare(b.datum) ||
      (a.tijd || "").localeCompare(b.tijd || "") ||
      T.get(a.theater).plaats.localeCompare(T.get(b.theater).plaats, "nl"));

  const lastFetched = gigs.reduce((m, g) => (g.opgehaald > m ? g.opgehaald : m), "");

  return {
    artiesten: A, theaters: T, voorstellingen: V, upcoming, lastFetched, today,
    gigsForArtist: (id) => upcoming.filter((g) => V.get(g.voorstelling).artiesten.includes(id)),
    gigsForTheater: (id) => upcoming.filter((g) => g.theater === id),
    festivals: F,
    gigsForFestival: (id) => {
      const f = F.get(id);
      const titels = (f.titels || []).map((t) => t.toLowerCase());
      return upcoming.filter((g) => {
        const v = V.get(g.voorstelling);
        return v.artiesten.some((a) => (f.artiesten || []).includes(a)) || titels.some((t) => v.titel.toLowerCase().includes(t));
      });
    },
  };
}
