// Voegt de opgehaalde speellijsten (data/bronnen/*.json) samen met data/*.json.
//
// - Per bron worden de vorige vondsten van die bron vervangen door de nieuwe, zodat
//   afgelaste of verplaatste voorstellingen verdwijnen. Speeldata uit het verleden blijven.
// - Artiesten, theaters en voorstellingen die nog niet bestaan, worden aangemaakt.
// - Handmatig ingevoerde speeldata (zonder `herkomst`) blijven staan, behalve als een
//   bron dezelfde avond in dezelfde zaal met dezelfde artiest levert.
// - Wat twijfelachtig is, komt in data/te-controleren.json.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { slug, netteHoofdletters, netteNaam } from "./lib/normaliseer.mjs";
import { KLEUREN, GENRES } from "../src/data.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = join(root, "data");
const read = (f) => JSON.parse(readFileSync(join(dataDir, f), "utf8"));
const write = (f, v) => writeFileSync(join(dataDir, f), JSON.stringify(v, null, 2) + "\n");

const artiesten = read("artiesten.json");
const theaters = read("theaters.json");
const voorstellingen = read("voorstellingen.json");
let speeldata = read("speeldata.json");
const controleren = [];

const bronFiles = existsSync(join(dataDir, "bronnen"))
  ? readdirSync(join(dataDir, "bronnen")).filter((f) => f.endsWith(".json")).sort()
  : [];

// ---------- Opzoeken en aanmaken ----------

const naamSleutel = (n) => slug(n);
const artiestOpNaam = new Map(artiesten.map((a) => [naamSleutel(a.naam), a]));
for (const a of artiesten) for (const alias of a.ookBekendAls || []) artiestOpNaam.set(naamSleutel(alias), a);
const theaterOpId = new Map(theaters.map((t) => [t.id, t]));
const ids = (list) => new Set(list.map((x) => x.id));
const artiestIds = ids(artiesten), voorstellingIds = ids(voorstellingen);

// Zwart is te zwaar als willekeurige kleur; die wordt alleen met de hand gekozen.
const kleurNamen = Object.keys(KLEUREN).filter((k) => k !== "zwart");
const kleurVoor = (id) => kleurNamen[[...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % kleurNamen.length];

function uniekId(basis, bezet) {
  let id = basis || "onbekend", i = 2;
  while (bezet.has(id)) id = `${basis}-${i++}`;
  bezet.add(id);
  return id;
}

function zorgVoorTheater(t) {
  if (theaterOpId.has(t.id)) return theaterOpId.get(t.id);
  const nieuw = { id: t.id, naam: t.naam, plaats: t.plaats, land: t.land, soort: t.soort || "theater", website: t.website ?? null };
  theaters.push(nieuw);
  theaterOpId.set(nieuw.id, nieuw);
  return nieuw;
}

function zorgVoorArtiest(naam) {
  const key = naamSleutel(naam);
  if (artiestOpNaam.has(key)) return artiestOpNaam.get(key).id;
  const id = uniekId(key, artiestIds);
  // Het land van een artiest weten we niet uit een speellijst; dat vul je zelf aan.
  const nieuw = { id, naam, land: null, kleur: kleurVoor(id) };
  artiesten.push(nieuw);
  artiestOpNaam.set(key, nieuw);
  return id;
}

const zelfdeSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

// Titels van dezelfde voorstelling verschillen per zaal vaak een paar letters
// ("Small Talk" / "Smalltalk", "En verbied de vogels..." / "En verbied vogels...").
function afstand(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function zelfdeTitel(x, y) {
  const a = slug(x).replace(/-/g, ""), b = slug(y).replace(/-/g, "");
  if (a === b) return true;
  if (Math.min(a.length, b.length) >= 4 && (a.includes(b) || b.includes(a))) return true;
  return Math.min(a.length, b.length) >= 8 && afstand(a, b) <= Math.max(2, Math.floor(Math.min(a.length, b.length) / 8));
}

function zorgVoorVoorstelling(r, artiestIdsVanRecord, theaterId) {
  const match = voorstellingen.find((v) => {
    if (!zelfdeSet(v.artiesten, artiestIdsVanRecord)) return false;
    if (!artiestIdsVanRecord.length && v.theater !== theaterId) return false;
    return zelfdeTitel(v.titel, r.titel);
  });
  if (match) return match.id;
  const basis = [slug([...artiestIdsVanRecord.map((a) => artiesten.find((x) => x.id === a).naam), r.titel].join(" ")) || "voorstelling",
    artiestIdsVanRecord.length ? "" : theaterId].filter(Boolean).join("-");
  const id = uniekId(basis, voorstellingIds);
  const nieuw = { id, titel: r.titel, artiesten: artiestIdsVanRecord, genre: GENRES[r.genre] ? r.genre : "cabaret" };
  // Clubavonden zonder vaste artiest horen bij één zaal.
  if (!artiestIdsVanRecord.length) nieuw.theater = theaterId;
  voorstellingen.push(nieuw);
  return id;
}

// ---------- Samenvoegen per bron ----------

const stats = [];
for (const f of bronFiles) {
  const bestand = JSON.parse(readFileSync(join(dataDir, "bronnen", f), "utf8"));
  for (const t of bestand.theaters || []) zorgVoorTheater(t);

  // Vorige vondsten van deze bron vanaf de ophaaldatum vervangen; oudere blijven als archief.
  const voor = speeldata.length;
  speeldata = speeldata.filter((s) => s.herkomst !== bestand.bron || s.datum < bestand.opgehaald);
  const vervangen = voor - speeldata.length;

  const sleutels = new Set(speeldata.map((s) => [s.voorstelling, s.theater, s.datum, s.tijd || ""].join("|")));
  let nieuw = 0, handmatigVervangen = 0;
  for (const bronRecord of bestand.speeldata) {
    // Vangnet voor alle bronnen: geen titels of namen in KAPITALEN, geen losse punt aan het eind.
    const r = {
      ...bronRecord,
      titel: netteHoofdletters(String(bronRecord.titel || "").replace(/\.$/, "").trim()),
      artiesten: (bronRecord.artiesten || []).map((n) => netteNaam(String(n).trim())).filter(Boolean),
    };
    const theater = typeof r.theater === "string" ? theaterOpId.get(r.theater) : zorgVoorTheater(r.theater);
    if (!theater) {
      controleren.push({ bron: bestand.bron, reden: `onbekend theater "${r.theater}"`, record: r });
      continue;
    }
    const aIds = (r.artiesten || []).map((n) => zorgVoorArtiest(n));
    const vId = zorgVoorVoorstelling(r, aIds, theater.id);

    // Handmatige invoer voor dezelfde avond, zaal en artiest maakt plaats.
    const v = voorstellingen.find((x) => x.id === vId);
    speeldata = speeldata.filter((s) => {
      if (s.herkomst || s.theater !== theater.id || s.datum !== r.datum) return true;
      const sv = voorstellingen.find((x) => x.id === s.voorstelling);
      const zelfde = sv && (sv.id === vId || (aIds.length && sv.artiesten.some((a) => aIds.includes(a))));
      if (zelfde) handmatigVervangen++;
      return !zelfde;
    });

    const key = [vId, theater.id, r.datum, r.tijd || ""].join("|");
    if (sleutels.has(key)) continue;
    sleutels.add(key);
    const s = {
      voorstelling: vId, theater: theater.id, datum: r.datum, tijd: r.tijd ?? null,
      status: r.status || "gepland", soort: r.soort ?? null, bron: r.bron,
      opgehaald: bestand.opgehaald, herkomst: bestand.bron,
    };
    if (r.opmerking) s.opmerking = r.opmerking;
    speeldata.push(s);
    nieuw++;
    if (!v.artiesten.length && !r.titel) controleren.push({ bron: bestand.bron, reden: "voorstelling zonder artiest en titel", record: r });
  }
  stats.push(`${bestand.naam}: ${nieuw} speeldata (${vervangen} vorige vervangen${handmatigVervangen ? `, ${handmatigVervangen} handmatige vervangen` : ""})`);
}

// ---------- Opruimen en wegschrijven ----------

speeldata.sort((a, b) => a.datum.localeCompare(b.datum) || (a.tijd || "").localeCompare(b.tijd || "") || a.theater.localeCompare(b.theater) || a.voorstelling.localeCompare(b.voorstelling));
const opNaam = (a, b) => a.naam.localeCompare(b.naam, "nl");
artiesten.sort(opNaam);
theaters.sort((a, b) => a.land.localeCompare(b.land) || a.plaats.localeCompare(b.plaats, "nl") || opNaam(a, b));
voorstellingen.sort((a, b) => a.id.localeCompare(b.id));

write("artiesten.json", artiesten);
write("theaters.json", theaters);
write("voorstellingen.json", voorstellingen);
write("speeldata.json", speeldata);
write("te-controleren.json", controleren);

for (const s of stats) console.log(s);
console.log(`Totaal: ${speeldata.length} speeldata, ${artiesten.length} artiesten, ${theaters.length} theaters, ${voorstellingen.length} voorstellingen.`);
if (controleren.length) console.log(`${controleren.length} gevallen in data/te-controleren.json`);
