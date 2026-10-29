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
import { artiestOfTitel, isBekend } from "./lib/artiesten.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = join(root, "data");
const read = (f) => JSON.parse(readFileSync(join(dataDir, f), "utf8"));
const write = (f, v) => writeFileSync(join(dataDir, f), JSON.stringify(v, null, 2) + "\n");

const artiesten = read("artiesten.json");
const theaters = read("theaters.json");
const voorstellingen = read("voorstellingen.json");
let speeldata = read("speeldata.json");
// Wat er al was, om op de controlepagina te tonen wat er nieuw is.
const eerder = { artiesten: new Set(artiesten.map((a) => a.id)), theaters: new Set(theaters.map((t) => t.id)), voorstellingen: new Set(voorstellingen.map((v) => v.id)) };
const controleren = [];
// Bekende andere schrijfwijzen: "Ayoub" -> ["Ayoub Kharkhach"], "Najib & Roué" -> twee artiesten.
const aliassen = existsSync(join(dataDir, "aliassen.json")) ? read("aliassen.json") : {};
const aliasOpSleutel = new Map(Object.entries(aliassen).map(([k, v]) => [slug(k), v]));

// Speellijsten van artiesten komen als laatste: wat een theater zelf meldt, gaat voor.
const COMEDYCLUB = /\bcomedy[ -]?(club|caf[eé]|huis|train)\b/i;
const isSpeellijst = (f) => JSON.parse(readFileSync(join(dataDir, "bronnen", f), "utf8")).soort === "speellijst";
const bronFiles = existsSync(join(dataDir, "bronnen"))
  ? readdirSync(join(dataDir, "bronnen")).filter((f) => f.endsWith(".json")).sort().sort((a, b) => isSpeellijst(a) - isSpeellijst(b))
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
  // "Comedy Club Haug", "Comedy Café Noordkade", "Comedyhuis": een comedyclub, tenzij de bron iets anders zegt.
  const soort = t.soort && t.soort !== "theater" ? t.soort : COMEDYCLUB.test(t.naam) ? "comedyclub" : t.soort || "theater";
  const nieuw = { id: t.id, naam: t.naam, plaats: t.plaats, land: t.land, soort, website: t.website ?? null };
  theaters.push(nieuw);
  theaterOpId.set(nieuw.id, nieuw);
  return nieuw;
}

// Plaatsnamen uit speellijsten gelijktrekken: "DEN BOSCH" -> "'s-Hertogenbosch", "Alphen ad Rijn" -> ...
const PLAATS_ALIAS = {
  "den bosch": "'s-Hertogenbosch", "s-hertogenbosch": "'s-Hertogenbosch", "'s hertogenbosch": "'s-Hertogenbosch",
  "alphen ad rijn": "Alphen aan den Rijn", "alphen a/d rijn": "Alphen aan den Rijn", "alphen": "Alphen aan den Rijn",
  "capelle ad ijssel": "Capelle aan den IJssel", "capelle a/d ijssel": "Capelle aan den IJssel", "krimpen ad ijssel": "Krimpen aan den IJssel", "krimpen a/d ijssel": "Krimpen aan den IJssel", "spijkernisse": "Spijkenisse",
  "the hague": "Den Haag", "s-gravenhage": "Den Haag", "'s-gravenhage": "Den Haag", "amersfoot": "Amersfoort",
  "doetichem": "Doetinchem", "gorichem": "Gorinchem", "berkel en roderijs": "Berkel en Rodenrijs", "h-i-ambacht": "Hendrik-Ido-Ambacht",
  "capelle aan de ijssel": "Capelle aan den IJssel", "krimpen a/d ijssel": "Krimpen aan den IJssel", "laren nh": "Laren",
  "noordwijk aan zee": "Noordwijk", "hengelo (o)": "Hengelo", "hengelo (ov)": "Hengelo", "den hoorn texel": "Texel", "oost-knollendam": "Oostknollendam", "h. i. ambacht": "Hendrik-Ido-Ambacht", "s'-heerenberg": "'s-Heerenberg", "alphen nb": "Alphen (NB)",
};
// Opschoning van zalen (data/zaal-aliassen.json): zaalnamen uit speellijsten bij een bekend theater,
// dubbele zalen samenvoegen en namen of plaatsen met de hand verbeteren.
const zaalAliassen = existsSync(join(dataDir, "zaal-aliassen.json")) ? read("zaal-aliassen.json") : {};
const ZAAL_ALIAS = zaalAliassen.zalen || {};
const ZAAL_SAMEN = zaalAliassen.samenvoegen || {};
for (const [id, nieuw] of Object.entries(zaalAliassen.verbeteren || {})) if (theaterOpId.has(id)) Object.assign(theaterOpId.get(id), nieuw);
// Het theater dat overblijft als een zaal is samengevoegd.
const doelTheater = (t) => (t && ZAAL_SAMEN[t.id] && theaterOpId.has(ZAAL_SAMEN[t.id]) ? theaterOpId.get(ZAAL_SAMEN[t.id]) : t);
const KLEIN = new Set(["aan", "den", "de", "het", "op", "bij", "in", "ter", "ten", "a/d", "ad"]);
function netPlaats(p) {
  let t = String(p || "").replace(/\s*\((NL|BE?|[A-Z][a-z]+)\)\s*$/, "").replace(/\s+/g, " ").trim();
  if (PLAATS_ALIAS[t.toLowerCase()]) return PLAATS_ALIAS[t.toLowerCase()];
  // "VENLO" of "venlo" -> "Venlo"; "IJsselstein" blijft goed.
  if (t === t.toUpperCase() || t === t.toLowerCase()) {
    t = t.toLowerCase().split(" ").map((w, i) => (i && KLEIN.has(w) ? w : w.replace(/^ij/, "IJ").replace(/^(\p{L})/u, (c) => c.toUpperCase()).replace(/-(\p{L})/gu, (m, c) => `-${c.toUpperCase()}`))).join(" ");
  }
  return t;
}
const ZAAL_STOP = new Set(["theater", "theaters", "schouwburg", "stadsschouwburg", "stadstheater", "de", "het", "t", "zaal", "grote", "kleine",
  "cultuurcentrum", "cultuurhuis", "centrum", "cc", "podium", "en", "concertzaal", "concertgebouw", "filmhuis", "van", "the"]);
const kern = (naam, plaats) => slug(naam).split("-").filter((w) => w.length > 1 && !ZAAL_STOP.has(w) && !slug(plaats).split("-").includes(w));

// Een zaal uit een speellijst: een bekend theater in dezelfde plaats met (bijna) dezelfde naam,
// anders een nieuwe zaal.
const compact = (s) => slug(s).replace(/-/g, "");
// Een gevonden zaal zonder website krijgt die uit de speellijst.
function zoekTheater(t) {
  const gevonden = zoekTheaterZelf(t);
  if (gevonden && !gevonden.website && t.website) gevonden.website = t.website;
  return gevonden;
}
function zoekTheaterZelf(t) {
  const plaats = netPlaats(t.plaats);
  const alias = ZAAL_ALIAS[`${slug(plaats)}|${slug(t.naam)}`];
  if (alias && theaterOpId.has(alias)) return theaterOpId.get(alias);
  const kandidaten = theaters.filter((x) => slug(x.plaats) === slug(plaats));
  const k = kern(t.naam, plaats);
  let beste = null, score = 0;
  for (const x of kandidaten) {
    const kx = kern(x.naam, x.plaats);
    const s = kx.filter((w) => k.includes(w)).length / Math.max(1, Math.min(kx.length, k.length));
    if (s > score) [beste, score] = [x, s];
  }
  if (beste && score >= 0.5) return beste;
  // "Hof 88" / "Hof88", "Schaffelaartheater" / "Schaffelaar Theater", "Schaffelaertheater" (tikfout).
  const kc = k.join("");
  const opNaam = kandidaten.find((x) => { const xc = kern(x.naam, x.plaats).join(""); return kc.length >= 4 && xc.length >= 4 && (xc.includes(kc) || kc.includes(xc) || (Math.min(xc.length, kc.length) >= 8 && afstand(xc, kc) <= 1)); });
  if (opNaam) return opNaam;
  // "Stadsschouwburg" en er is één schouwburg in die plaats.
  if (/schouwburg/i.test(t.naam)) { const sb = kandidaten.filter((x) => /schouwburg/i.test(x.naam)); if (sb.length === 1) return sb[0]; }
  // "Schouwburg" of "Stadsschouwburg" zonder meer, en er is maar één zaal in die plaats.
  if (!k.length && kandidaten.length === 1) return kandidaten[0];
  let naam = t.naam.replace(/\s+/g, " ").trim();
  // "CC", "Stadsschouwburg" of "Cultuurhuis" zegt op de site weinig: dan de plaats erachter.
  if (!k.length && !slug(naam).includes(slug(plaats))) naam = `${naam.replace(/^(cc|gc)$/i, (x) => x.toUpperCase())} ${plaats}`;
  const id = slug(`${naam} ${slug(naam).includes(slug(plaats)) ? "" : plaats}`);
  // Wat de artiest over het land zegt, gaat voor (Deurne ligt in Nederland én in België).
  const land = t.land || kandidaten[0]?.land || "NL";
  return theaterOpId.get(id) || zorgVoorTheater({ id, naam, plaats, land, soort: "theater", website: t.website || null });
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
    // Speellijst zonder titel: ook voorstellingen waarin de artiest met anderen staat (Najib Amhali in
    // "Alles is comedy" met Roué Verveer). Bij meer: die met een speeldatum het dichtst bij deze avond.
    if (r.zonderTitel && !echte.length) echte.push(...voorstellingen.filter((v) => artiestIdsVanRecord.every((a) => v.artiesten.includes(a)) && slug(v.titel) !== slug(namen)));
    if (echte.length === 1) return echte[0].id;
    if (echte.length > 1 && r.zonderTitel) {
      const afstandTot = (v) => Math.min(...speeldata.filter((s) => s.voorstelling === v.id).map((s) => Math.abs(new Date(s.datum) - new Date(r.datum))), Infinity);
      const dichtst = echte.map((v) => [v, afstandTot(v)]).sort((a, b) => a[1] - b[1])[0];
      if (dichtst[1] < Infinity) return dichtst[0].id;
    }
  }
  // Toneel: hetzelfde stuk is één voorstelling, ook als elke zaal andere spelers noemt
  // (Ratatatata! met Theo Maassen bij de ene zaal, met Plien en Bianca bij de andere).
  // Een zaal die het als cabaret labelt, hoort bij hetzelfde stuk als er spelers overlappen.
  {
    const overlap = (v) => !v.artiesten.length || !artiestIdsVanRecord.length || v.artiesten.some((a) => artiestIdsVanRecord.includes(a));
    const stuk = voorstellingen.find((v) => (v.genre === "theaterkomedie" || r.genre === "theaterkomedie") && zelfdeTitel(v.titel, r.titel) && overlap(v));
    if (stuk) {
      stuk.artiesten = [...new Set([...stuk.artiesten, ...artiestIdsVanRecord])];
      if (stuk.artiesten.length) delete stuk.theater;
      return stuk.id;
    }
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

// Bekende artiesten die in een stuk tekst genoemd worden ("Met Theo Maassen, Plien & Bianca e.a.").
// Wat na "regie" of "tekst" staat, telt niet: dat zijn makers, geen spelers.
const kaalTekst = (s) => ` ${String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " en ").replace(/[^a-z0-9]+/g, " ").trim()} `;
function bekendeNamenIn(tekst) {
  const t = kaalTekst(String(tekst || "").split(/\b(regie|geregisseerd|tekst|bewerking|vertaling)\b/i)[0]);
  return artiesten.filter((a) => [a.naam, ...(a.ookBekendAls || [])].some((n) => n.length >= 6 && /\s/.test(n) && t.includes(kaalTekst(n)))).map((a) => a.naam);
}

// Toneel en komedie: vaak staat de titel van het stuk op de plek van de artiest en de rolverdeling of
// een omschrijving als titel ("Ratatatata!" / "Met Theo Maassen, Plien & Bianca e.a."). Dan wordt het
// stuk de titel en spelen de bekende artiesten uit de rolverdeling mee. Een gezelschap als titel
// ("Silence of the Dogs" / "Het Zuidelijk Toneel") is omgedraaid.
// Een hele rolverdeling als artiesten ("Bianca Krijgsman, Theo Maassen, Rop Verheijen e.a.") wordt
// teruggebracht tot de bekende artiesten erin; acteurs die we verder niet kennen krijgen geen pagina.
function stukOpOrde(r, ruweArtiest) {
  // Een "artiest" die via aliassen.json wegvalt ("Lift": []), is hier waarschijnlijk de titel van het stuk.
  if (!r.artiesten.length && ruweArtiest && bekendeNamenIn(r.titel).length) r.artiesten = [ruweArtiest];
  const plaatsen = (titel, artiesten) => { r.titel = netteHoofdletters(titel.replace(/[\u200b-\u200d\ufeff]/g, "").trim()); r.artiesten = artiesten; };
  if (r.artiesten.length > 1) {
    const bekend = [...new Set(r.artiesten.flatMap((n) => isBekend(n) ? [n] : bekendeNamenIn(n)))];
    r.artiesten = bekend.length ? bekend : bekendeNamenIn(r.artiesten.join(", "));
    r.titel = netteHoofdletters(r.titel);
    return;
  }
  if (r.artiesten.length !== 1) return void (r.titel = netteHoofdletters(r.titel));
  const [a] = r.artiesten;
  // Bekende namen in de "titel" gaan voor: dan is de "artiest" het stuk ("Lift" / "Komedie met Jelka van Houten ...").
  const inTitel = bekendeNamenIn(r.titel).filter((n) => slug(n) !== slug(a));
  if (inTitel.length && !bekendeNamenIn(a).length) return plaatsen(a, inTitel);
  // Een omschrijving of rolverdeling als titel ("De nieuwe romantische comedy", "Met regie van ...").
  if (/^(met|regie|komedie|een|de nieuwe)\b|\bregie\b|,.*,|\be\.\s?a\.?$/i.test(r.titel)) return plaatsen(a, []);
  if (isBekend(a)) return void (r.titel = netteHoofdletters(r.titel));
  const inArtiest = bekendeNamenIn(a);
  if (inArtiest.length) return plaatsen(r.titel, inArtiest);
  if (/toneel|theater|gezelschap|producties/i.test(r.titel)) return plaatsen(a, [r.titel]);
  r.titel = netteHoofdletters(r.titel);
}

// Oude voorstellingen met een omschrijving als titel ("komedie met Jelka van Houten ..."): weg als ze
// alleen komende speeldata hebben; de bronnen leveren die zo meteen opnieuw, nu met de goede titel.
{
  const vandaagNu = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  const oud = new Set(speeldata.filter((sd) => sd.datum < vandaagNu).map((sd) => sd.voorstelling));
  const weg = new Set(voorstellingen.filter((v) => /^(komedie|blijspel|klucht) met\b/i.test(v.titel) && !oud.has(v.id)).map((v) => v.id));
  voorstellingen.splice(0, voorstellingen.length, ...voorstellingen.filter((v) => !weg.has(v.id)));
  speeldata = speeldata.filter((sd) => !weg.has(sd.voorstelling));
}

// ---------- Samenvoegen per bron ----------

// Hoe de zalen een voorstelling labelen; theaterkomedie alleen als de meeste zalen dat zeggen
// (Ratatatata! wel, "Alles is comedy" van Najib & Roué niet, ook al noemt één zaal het toneel).
const genreStemmen = new Map();

const stats = [], bronStats = [];
// Recensies per voorstelling uit alle bronnen: voorstelling-id -> Map(bron|medium -> recensie).
const recensieKandidaten = new Map();
// Citaten die een theater expliciet bij een andere voorstelling zet ("NRC over Team Solo"):
// die weren we ook op pagina's die het niet zeggen.
const citatenElders = new Set();
const citaatSleutel = (c) => slug(c).slice(0, 40);
for (const f of bronFiles) {
  const bestand = JSON.parse(readFileSync(join(dataDir, "bronnen", f), "utf8"));
  for (const t of bestand.theaters || []) {
    // De bron weet waar haar eigen zaal staat: een verbeterde plaats of land neemt ze mee.
    const bekend = theaterOpId.get(t.id);
    if (bekend && t.plaats && (bekend.plaats !== t.plaats || bekend.land !== t.land)) Object.assign(bekend, { plaats: t.plaats, land: t.land || bekend.land });
    zorgVoorTheater(t);
  }

  // Vorige vondsten van deze bron vanaf de ophaaldatum vervangen; oudere blijven als archief.
  const voor = speeldata.length;
  speeldata = speeldata.filter((s) => s.herkomst !== bestand.bron || s.datum < bestand.opgehaald);
  const vervangen = voor - speeldata.length;

  const sleutels = new Set(speeldata.map((s) => [s.voorstelling, s.theater, s.datum, s.tijd || ""].join("|")));
  // Bij een speellijst: welke artiest al op welke datum in welke plaats staat (uit de theaterbronnen).
  const alBekend = new Set();
  if (bestand.soort === "speellijst") {
    const vOpId = new Map(voorstellingen.map((v) => [v.id, v]));
    for (const s of speeldata) for (const a of vOpId.get(s.voorstelling)?.artiesten || []) alBekend.add(`${a}|${slug(theaterOpId.get(s.theater)?.plaats)}|${s.datum}`);
  }
  let dubbel = 0;
  let nieuw = 0, handmatigVervangen = 0;
  for (const bronRecord of bestand.speeldata) {
    // Vangnet voor alle bronnen: geen titels of namen in KAPITALEN, geen losse punt aan het eind.
    const r = {
      ...bronRecord,
      titel: netteHoofdletters(String(bronRecord.titel || "")
        .replace(/\s*[(\[]\s*(reprise|try[ -]?out|premi[eè]re|derni[eè]re|herneming)\s*[)\]]\s*$/i, "")
        .replace(/\s+[-–|]\s*(reprise|try[ -]?out|premi[eè]re|derni[eè]re|herneming)\s*$/i, "")
        .replace(/[\u200b-\u200d\ufeff]/g, "").replace(/\.$/, "").replace(/^speelt\s+/i, "").trim()) || bronRecord.titel,
      soort: bronRecord.soort ?? (/\b(herneming|reprise)\b/i.test(bronRecord.titel || "") ? "reprise" : null),
      artiesten: opgeschoondeArtiesten(bronRecord.artiesten || []),
    };
    // Nog eens kijken of artiest en titel omgedraaid zijn, nu met alle artiesten uit alle bronnen
    // ("CabaRock De Liefde!" / "Jim de Groot & Sebas Wolfensberger").
    if (bronRecord.artiesten?.length === 1) {
      const { artiest, titel } = artiestOfTitel(bronRecord.artiesten[0], r.titel);
      if (artiest !== bronRecord.artiesten[0]) { r.titel = titel; r.artiesten = opgeschoondeArtiesten([artiest]); }
    }
    // Toneel en komedie hebben hun eigen opruimregels (stukOpOrde); de regels hieronder zijn voor cabaret.
    if (r.genre === "theaterkomedie" || /^(komedie|blijspel|klucht)\b/i.test(r.titel)) stukOpOrde(r, bronRecord.artiesten?.length === 1 ? bronRecord.artiesten[0] : null);
    // "Eigenlijk" / "Viggo Waas, Eddie B. Wahr & Kees van der Vooren": een namenlijst als titel en een
    // onbekende "artiest" (of één los woord) zijn omgedraaid.
    else if (r.artiesten.length === 1 && (!isBekend(r.artiesten[0]) || !/\s/.test(r.artiesten[0])) && /^[^,]+(, [^,]+)+ (&|en) [^,]+$/.test(r.titel)) {
      [r.titel, r.artiesten] = [r.artiesten[0], opgeschoondeArtiesten([r.titel])];
    }
    // Een rolverdeling als titel ("Paul de Leeuw, Annick Boer e.a.") betekent: de "artiest" is de titel.
    if (r.genre !== "theaterkomedie" && !/^(komedie|blijspel|klucht)\b/i.test(r.titel) && r.artiesten.length === 1 && /(,.*,|\be\.a\.?$|\bea$)/i.test(r.titel)) {
      r.titel = r.artiesten[0];
      r.artiesten = [];
    }
    if (r.theater?.zoeken) {
      // Speellijst: dezelfde artiest op dezelfde dag in dezelfde plaats staat er al via het theater.
      const ids = (r.artiesten || []).map((n) => zorgVoorArtiest(n));
      if (ids.some((a) => alBekend.has(`${a}|${slug(netPlaats(r.theater.plaats))}|${r.datum}`))) { dubbel++; continue; }
      if (!r.titel) { r.titel = r.artiesten.join(" & "); r.zonderTitel = true; }
    }
    const theater = doelTheater(typeof r.theater === "string" ? theaterOpId.get(r.theater) : r.theater?.zoeken ? zoekTheater(r.theater) : zorgVoorTheater(r.theater));
    if (!theater) {
      controleren.push({ bron: bestand.bron, reden: `onbekend theater "${r.theater}"`, record: r });
      continue;
    }
    const aIds = (r.artiesten || []).map((n) => zorgVoorArtiest(n));
    const vId = zorgVoorVoorstelling(r, aIds, theater.id);
    if (!genreStemmen.has(vId)) genreStemmen.set(vId, {});
    genreStemmen.get(vId)[r.genre] = (genreStemmen.get(vId)[r.genre] || 0) + 1;
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
  bronStats.push({ bron: bestand.bron, naam: bestand.naam, opgehaald: bestand.opgehaald, speeldata: nieuw, vorige: vervangen, dubbel });
  stats.push(`${bestand.naam}: ${nieuw} speeldata (${vervangen} vorige vervangen${handmatigVervangen ? `, ${handmatigVervangen} handmatige vervangen` : ""}${dubbel ? `, ${dubbel} al bekend via het theater` : ""})`);
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

// 2c. Samengevoegde zalen: oude speeldata naar de zaal die blijft, de dubbele zaal weg.
if (Object.keys(ZAAL_SAMEN).length) {
  const gezien = new Set();
  speeldata = speeldata.map((s) => ({ ...s, theater: doelTheater(theaterOpId.get(s.theater))?.id || s.theater })).filter((s) => {
    const k = [s.voorstelling, s.theater, s.datum, s.tijd || ""].join("|");
    if (gezien.has(k)) return false;
    gezien.add(k);
    return true;
  });
  for (const v of voorstellingen) if (v.theater) v.theater = doelTheater(theaterOpId.get(v.theater))?.id || v.theater;
  const weg = new Set(Object.keys(ZAAL_SAMEN).filter((id) => theaterOpId.has(ZAAL_SAMEN[id])));
  theaters.splice(0, theaters.length, ...theaters.filter((t) => !weg.has(t.id)));
}

// 2c-2. Toneel: hetzelfde stuk dat toch op twee plekken terechtkwam (andere zaallabels of spelers),
// samenvoegen tot één voorstelling. Alleen als een van de twee theaterkomedie is en de spelers niet botsen.
{
  const opTitel = new Map();
  for (const v of voorstellingen) {
    const k = slug(v.titel);
    if (!opTitel.has(k)) opTitel.set(k, []);
    opTitel.get(k).push(v);
  }
  const komisch = (v) => v.genre === "theaterkomedie" || genreStemmen.get(v.id)?.theaterkomedie;
  for (const groep of opTitel.values()) {
    if (groep.length < 2 || !groep.some(komisch)) continue;
    groep.sort((a, b) => b.artiesten.length - a.artiesten.length);
    const [hoofd, ...rest] = groep;
    for (const v of rest) {
      if (v.artiesten.length && hoofd.artiesten.length && !v.artiesten.some((a) => hoofd.artiesten.includes(a))) continue;
      hoofd.artiesten = [...new Set([...hoofd.artiesten, ...v.artiesten])];
      for (const sd of speeldata) if (sd.voorstelling === v.id) sd.voorstelling = hoofd.id;
      const st = genreStemmen.get(hoofd.id) || {};
      for (const [g, n] of Object.entries(genreStemmen.get(v.id) || {})) st[g] = (st[g] || 0) + n;
      genreStemmen.set(hoofd.id, st);
    }
    if (hoofd.artiesten.length) delete hoofd.theater;
  }
  const gezien = new Set();
  speeldata = speeldata.filter((sd) => {
    const k = [sd.voorstelling, sd.theater, sd.datum, sd.tijd || ""].join("|");
    if (gezien.has(k)) return false;
    gezien.add(k);
    return true;
  });
}

// 2d. Genre van stukken volgens de meeste zalen; een stuk zonder artiest hoort bij de zaal van zijn eerste speeldatum.
for (const v of voorstellingen) {
  const st = genreStemmen.get(v.id);
  if (st && (st.theaterkomedie || v.genre === "theaterkomedie")) {
    const [beste] = Object.entries(st).sort((a, b) => b[1] - a[1] || (a[0] === "theaterkomedie" ? -1 : 1));
    if (beste[0] === "theaterkomedie" || v.genre === "theaterkomedie") v.genre = beste[0];
  }
  if (!v.artiesten.length && !theaterOpId.has(v.theater)) v.theater = speeldata.find((s) => s.voorstelling === v.id)?.theater;
}

// 3. Alles zonder speeldata weg. Artiesten met een handmatig ingevuld land of ookBekendAls blijven,
// net als artiesten die bij een festival horen (data/festivals.json).
const festivalArtiesten = new Set((existsSync(join(dataDir, "festivals.json")) ? read("festivals.json") : []).flatMap((f) => f.artiesten || []));
const gebruikteVoorstellingen = new Set(speeldata.map((s) => s.voorstelling));
const blijvendeVoorstellingen = voorstellingen.filter((v) => gebruikteVoorstellingen.has(v.id));
const gebruikteArtiesten = new Set(blijvendeVoorstellingen.flatMap((v) => v.artiesten));
const blijvendeArtiesten = artiesten.filter((a) => gebruikteArtiesten.has(a.id) || festivalArtiesten.has(a.id) || a.land || a.ookBekendAls?.length);
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

// ---------- Rapport voor de controlepagina (/controle/) ----------
// Per dag: wat er nieuw is. Meer keren samenvoegen op één dag telt op.
{
  const vandaagNL = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  const vorig = existsSync(join(dataDir, "rapport.json")) ? read("rapport.json") : {};
  const zelfdeDag = vorig.datum === vandaagNL;
  const plus = (oud, nieuw) => [...new Map([...(zelfdeDag ? oud || [] : []), ...nieuw].map((x) => [x.id, x])).values()];
  const nieuwe = {
    artiesten: plus(vorig.nieuw?.artiesten, artiesten.filter((a) => !eerder.artiesten.has(a.id)).map((a) => ({ id: a.id, naam: a.naam }))),
    zalen: plus(vorig.nieuw?.zalen, theaters.filter((t) => !eerder.theaters.has(t.id)).map((t) => ({ id: t.id, naam: t.naam, plaats: t.plaats, land: t.land, website: t.website || null }))),
    voorstellingen: plus(vorig.nieuw?.voorstellingen, voorstellingen.filter((v) => !eerder.voorstellingen.has(v.id)).map((v) => ({ id: v.id, titel: v.titel, artiesten: v.artiesten }))),
  };
  // Blijven bestaan: zijn ze na het opruimen nog in de database?
  const nog = { artiesten: new Set(artiesten.map((a) => a.id)), zalen: new Set(theaters.map((t) => t.id)), voorstellingen: new Set(voorstellingen.map((v) => v.id)) };
  for (const k of Object.keys(nieuwe)) nieuwe[k] = nieuwe[k].filter((x) => nog[k].has(x.id));
  const totaal = { speeldata: speeldata.length, komend: speeldata.filter((s) => s.datum >= vandaagNL).length, artiesten: artiesten.length, zalen: theaters.length, plaatsen: new Set(theaters.map((t) => t.plaats)).size, voorstellingen: voorstellingen.length };
  const geschiedenis = [...(vorig.geschiedenis || []).filter((g) => g.datum !== vandaagNL), { datum: vandaagNL, ...totaal }].slice(-60);
  write("rapport.json", { datum: vandaagNL, totaal, bronnen: bronStats, nieuw: nieuwe, controleren: controleren.length, geschiedenis });
}

for (const s of stats) console.log(s);
if (vervang.size || naarVoorstelling.size || verwijderd.artiesten || verwijderd.voorstellingen) {
  console.log(`Opgeruimd: ${vervang.size} artiesten samengevoegd, ${naarVoorstelling.size} voorstellingen samengevoegd, ${verwijderd.artiesten} artiesten en ${verwijderd.voorstellingen} voorstellingen zonder speeldata verwijderd.`);
}
console.log(`Totaal: ${speeldata.length} speeldata, ${artiesten.length} artiesten, ${theaters.length} theaters, ${voorstellingen.length} voorstellingen.`);
if (controleren.length) console.log(`${controleren.length} gevallen in data/te-controleren.json`);
