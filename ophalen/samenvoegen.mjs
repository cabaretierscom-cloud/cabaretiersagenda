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
import { recensie } from "./lib/recensies.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = join(root, "data");
const read = (f) => JSON.parse(readFileSync(join(dataDir, f), "utf8"));
const write = (f, v) => writeFileSync(join(dataDir, f), JSON.stringify(v, null, 2) + "\n");

const artiesten = read("artiesten.json");
const theaters = read("theaters.json");
const voorstellingen = read("voorstellingen.json");
let speeldata = read("speeldata.json");
const controleren = [];
// Bekende andere schrijfwijzen: "Ayoub" -> ["Ayoub Kharkhach"], "Najib & Roué" -> twee artiesten.
const aliassen = existsSync(join(dataDir, "aliassen.json")) ? read("aliassen.json") : {};
const aliasOpSleutel = new Map(Object.entries(aliassen).map(([k, v]) => [slug(k), v]));

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
  // Eén letter verschil in een lange naam is een tikfout ("Lisa Osterman" / "Lisa Ostermann").
  const compact = key.replace(/-/g, "");
  if (compact.length >= 10) {
    for (const [k, a] of artiestOpNaam) {
      const kc = k.replace(/-/g, "");
      if (Math.abs(kc.length - compact.length) <= 1 && afstand(kc, compact) <= 1) {
        artiestOpNaam.set(key, a);
        return a.id;
      }
    }
  }
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
  // Sommige zalen geven alleen de artiestnaam als titel ("Dolf Jansen"). Heeft de artiest precies
  // één voorstelling met een echte titel, dan hoort deze avond daarbij.
  const namen = artiestIdsVanRecord.map((a) => artiesten.find((x) => x.id === a).naam).join(" ");
  if (artiestIdsVanRecord.length && slug(r.titel) === slug(namen)) {
    const echte = voorstellingen.filter((v) => zelfdeSet(v.artiesten, artiestIdsVanRecord) && slug(v.titel) !== slug(namen));
    if (echte.length === 1) return echte[0].id;
  }
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

// Artiestnamen uit bronnen opschonen:
// "Lisa Ostermann (reprise)" -> "Lisa Ostermann", "Jimmy Carr - Laughs funny" -> "Jimmy Carr",
// "Alex Ploeg, Pepijn Schoneveld en Christine de Boer" -> drie artiesten, en aliassen toepassen.
function opgeschoondeArtiesten(namen) {
  const uit = [];
  for (const ruw of namen) {
    let n = netteNaam(String(ruw).trim())
      .replace(/\s*[(\[]\s*(reprise|try[ -]?out|premi[eè]re|derni[eè]re|herneming)\s*[)\]]\s*$/i, "")
      .replace(/\s*:\s+.*$|\s+[-–|]\s+.*$/, "")
      .replace(/,?\s+e\.?\s?a\.?$/i, "")
      .trim();
    if (!n) continue;
    const delen = n.includes(",") ? n.split(/\s*,\s*|\s+(?:en|&)\s+(?=[^,]*$)/).map((x) => x.replace(/\s*\(mc\)\s*$/i, "").replace(/\s+e\.?\s?a\.?$/i, "").replace(/\.$/, "").trim()).filter(Boolean) : [n];
    for (const d of delen) uit.push(...(aliasOpSleutel.get(slug(d)) || [d]));
  }
  return [...new Set(uit)];
}

// ---------- Samenvoegen per bron ----------

const stats = [];
// Recensies per voorstelling uit alle bronnen: voorstelling-id -> Map(bron|medium -> recensie).
const recensieKandidaten = new Map();
// Citaten die een theater expliciet bij een andere voorstelling zet ("NRC over Team Solo"):
// die weren we ook op pagina's die het niet zeggen.
const citatenElders = new Set();
const citaatSleutel = (c) => slug(c).slice(0, 40);
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
      titel: netteHoofdletters(String(bronRecord.titel || "")
        .replace(/\s*[(\[]\s*(reprise|try[ -]?out|premi[eè]re|derni[eè]re|herneming)\s*[)\]]\s*$/i, "")
        .replace(/\s+[-–|]\s*(reprise|try[ -]?out|premi[eè]re|derni[eè]re|herneming)\s*$/i, "")
        .replace(/\.$/, "").trim()) || bronRecord.titel,
      soort: bronRecord.soort ?? (/\b(herneming|reprise)\b/i.test(bronRecord.titel || "") ? "reprise" : null),
      artiesten: opgeschoondeArtiesten(bronRecord.artiesten || []),
    };
    // Een rolverdeling als titel ("Paul de Leeuw, Annick Boer e.a.") betekent: de "artiest" is de titel.
    if (r.artiesten.length === 1 && /(,.*,|\be\.a\.?$|\bea$)/i.test(r.titel)) {
      r.titel = r.artiesten[0];
      r.artiesten = [];
    }
    const theater = typeof r.theater === "string" ? theaterOpId.get(r.theater) : zorgVoorTheater(r.theater);
    if (!theater) {
      controleren.push({ bron: bestand.bron, reden: `onbekend theater "${r.theater}"`, record: r });
      continue;
    }
    const aIds = (r.artiesten || []).map((n) => zorgVoorArtiest(n));
    const vId = zorgVoorVoorstelling(r, aIds, theater.id);
    for (const ruw of bestand.recensies?.[r.bron] || []) {
      const rc = recensie(ruw.over ? `${ruw.medium} over ${ruw.over}` : ruw.medium, ruw.citaat, ruw.sterren);
      if (!rc) continue;
      if (rc.over && !zelfdeTitel(rc.over, r.titel)) { citatenElders.add(citaatSleutel(rc.citaat)); continue; }
      delete rc.over;
      if (!recensieKandidaten.has(vId)) recensieKandidaten.set(vId, new Map());
      recensieKandidaten.get(vId).set(`${r.bron}|${rc.medium}`, { ...rc, bron: r.bron });
    }

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

// ---------- Opruimen ----------

// 1. Bestaande artiesten samenvoegen: aliassen ("Ayoub" -> "Ayoub Kharkhach") en tikfouten
//    (één letter verschil in een lange naam). Verwijzingen in voorstellingen gaan mee.
const vervang = new Map(); // oud artiest-id -> [nieuwe ids]
for (const a of [...artiesten]) {
  const doel = aliasOpSleutel.get(slug(a.naam));
  if (doel && !(doel.length === 1 && slug(doel[0]) === slug(a.naam))) vervang.set(a.id, doel.map((n) => zorgVoorArtiest(n)));
}
const opLengte = [...artiesten].sort((x, y) => y.naam.length - x.naam.length || x.id.localeCompare(y.id));
for (let i = 0; i < opLengte.length; i++) {
  const a = opLengte[i], ac = slug(a.naam).replace(/-/g, "");
  if (ac.length < 10 || vervang.has(a.id)) continue;
  for (let j = i + 1; j < opLengte.length; j++) {
    const b = opLengte[j], bc = slug(b.naam).replace(/-/g, "");
    if (vervang.has(b.id) || Math.abs(ac.length - bc.length) > 1 || afstand(ac, bc) > 1) continue;
    vervang.set(b.id, [a.id]); // de langere schrijfwijze blijft ("Ostermann" boven "Osterman")
  }
}
for (const v of voorstellingen) {
  v.artiesten = [...new Set(v.artiesten.flatMap((id) => vervang.get(id) || [id]))];
}

// 2. Voorstellingen die nu dezelfde artiesten en (bijna) dezelfde titel hebben, worden één.
const naarVoorstelling = new Map();
for (let i = 0; i < voorstellingen.length; i++) {
  const v = voorstellingen[i];
  if (naarVoorstelling.has(v.id)) continue;
  for (let j = i + 1; j < voorstellingen.length; j++) {
    const w = voorstellingen[j];
    if (naarVoorstelling.has(w.id) || !zelfdeSet(v.artiesten, w.artiesten)) continue;
    if (!v.artiesten.length && v.theater !== w.theater) continue;
    if (zelfdeTitel(v.titel, w.titel)) naarVoorstelling.set(w.id, v.id);
  }
}
if (naarVoorstelling.size) {
  const gezien = new Set();
  speeldata = speeldata
    .map((s) => (naarVoorstelling.has(s.voorstelling) ? { ...s, voorstelling: naarVoorstelling.get(s.voorstelling) } : s))
    .filter((s) => {
      const k = [s.voorstelling, s.theater, s.datum, s.tijd || ""].join("|");
      if (gezien.has(k)) return false;
      gezien.add(k);
      return true;
    });
}

// 2b. Recensies bij de voorstelling. Per krant tellen de theaterpagina's: de sterren die de meeste
//     pagina's noemen, winnen (een pagina met een citaat over een vorige voorstelling telt zo minder mee).
//     Kranten die deze keer niet gevonden zijn, blijven staan.
const recensiesPer = new Map();
for (const [vId, kandidaten] of recensieKandidaten) {
  const doel = naarVoorstelling.get(vId) || vId;
  if (!recensiesPer.has(doel)) recensiesPer.set(doel, []);
  recensiesPer.get(doel).push(...kandidaten.values());
}
const eersteDatum = new Map();
for (const s of speeldata) if (!eersteDatum.has(s.voorstelling) || s.datum < eersteDatum.get(s.voorstelling)) eersteDatum.set(s.voorstelling, s.datum);
// Nog te spelen try-outs of première: de voorstelling is nog niet besproken, dus recensies op de
// theaterpagina gaan over een vorig programma (bijv. "Wildbloei" bij "Revue Revanche").
const vandaag = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
const nogNietBesproken = new Set(speeldata.filter((s) => s.datum >= vandaag && (s.soort === "try-out" || s.soort === "première")).map((s) => s.voorstelling));
for (const v of voorstellingen) {
  if (nogNietBesproken.has(v.id)) { delete v.recensies; continue; }
  // Een voorstelling met een jaartal ("Oudejaarsconference 2026") die nog niet gespeeld is, kan nog
  // geen recensies hebben: wat op de theaterpagina staat, gaat over een vorig jaar.
  // Bestaande recensies zonder dat jaar in het citaat vallen ook af.
  const jaar = v.titel.match(/\b(20\d\d)\b/)?.[1];
  if (jaar && (eersteDatum.get(v.id) || "") > vandaag) { delete v.recensies; continue; }
  const kandidaten = recensiesPer.get(v.id)
    ?.filter((k) => !citatenElders.has(citaatSleutel(k.citaat)))
    // Bij een titel met jaartal alleen citaten die dat jaar noemen; de rest gaat over een andere editie.
    ?.filter((k) => !jaar || ((k.citaat.match(/\b20\d\d\b/g) || []).includes(jaar) && !(k.citaat.match(/\b20\d\d\b/g) || []).some((j) => j !== jaar)));
  if (v.recensies) v.recensies = v.recensies.filter((r) => (!jaar || r.citaat.includes(jaar)) && !citatenElders.has(citaatSleutel(r.citaat)));
  if (!kandidaten?.length) { if (v.recensies && !v.recensies.length) delete v.recensies; continue; }
  const perMedium = new Map();
  for (const k of kandidaten) perMedium.set(k.medium, [...(perMedium.get(k.medium) || []), k]);
  const nieuw = [...perMedium].map(([medium, lijst]) => {
    const perSterren = new Map();
    for (const k of lijst) perSterren.set(k.sterren, [...(perSterren.get(k.sterren) || []), k]);
    const [sterren, groep] = [...perSterren].sort((a, b) => b[1].length - a[1].length || (a[0] == null) - (b[0] == null))[0];
    const citaten = new Map();
    for (const k of groep) { const c = slug(k.citaat).slice(0, 60); citaten.set(c, [...(citaten.get(c) || []), k]); }
    const k = [...citaten.values()].sort((a, b) => b.length - a.length)[0][0];
    return { medium, sterren, citaat: k.citaat, bron: k.bron };
  });
  const media = new Set(nieuw.map((r) => r.medium));
  v.recensies = [...nieuw, ...(v.recensies || []).filter((r) => !media.has(r.medium))]
    .sort((a, b) => (b.sterren ?? 0) - (a.sterren ?? 0) || a.medium.localeCompare(b.medium, "nl"));
}

// 3. Alles zonder speeldata weg. Artiesten met een handmatig ingevuld land of ookBekendAls blijven.
const gebruikteVoorstellingen = new Set(speeldata.map((s) => s.voorstelling));
const blijvendeVoorstellingen = voorstellingen.filter((v) => gebruikteVoorstellingen.has(v.id));
const gebruikteArtiesten = new Set(blijvendeVoorstellingen.flatMap((v) => v.artiesten));
const blijvendeArtiesten = artiesten.filter((a) => gebruikteArtiesten.has(a.id) || a.land || a.ookBekendAls?.length);
const verwijderd = { voorstellingen: voorstellingen.length - blijvendeVoorstellingen.length, artiesten: artiesten.length - blijvendeArtiesten.length };
voorstellingen.splice(0, voorstellingen.length, ...blijvendeVoorstellingen);
artiesten.splice(0, artiesten.length, ...blijvendeArtiesten);

// ---------- Wegschrijven ----------

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
if (vervang.size || naarVoorstelling.size || verwijderd.artiesten || verwijderd.voorstellingen) {
  console.log(`Opgeruimd: ${vervang.size} artiesten samengevoegd, ${naarVoorstelling.size} voorstellingen samengevoegd, ${verwijderd.artiesten} artiesten en ${verwijderd.voorstellingen} voorstellingen zonder speeldata verwijderd.`);
}
console.log(`Totaal: ${speeldata.length} speeldata, ${artiesten.length} artiesten, ${theaters.length} theaters, ${voorstellingen.length} voorstellingen.`);
if (controleren.length) console.log(`${controleren.length} gevallen in data/te-controleren.json`);
