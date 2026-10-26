// Speellijsten op websites van artiesten: elke site heeft een eigen opmaak, maar het is altijd een
// rij per avond met datum, (tijd), plaats, zaal, soms de titel, een status en een kaartlink.
// speellijstRijen() knipt de pagina in tekststukjes, zoekt de datums en neemt alles tot de
// volgende datum als één rij. leesRij() maakt daar plaats, zaal, tijd en status van.
import { decodeEntities } from "./html.mjs";

const MAANDEN = { jan: 1, feb: 2, mrt: 3, maa: 3, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, dec: 12 };
const DAG = "(?:(?:ma|di|wo|do|vr|za|zo|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag|mon|tue|wed|thu|fri|sat|sun)[a-z]*\\.?,?\\s+)?";
const TIJD = "(?:\\s*(?:[-–|•,@]|om|aanvang)?\\s*(\\d{1,2})[:.](\\d{2})(?:\\s*uur)?)?";
const DATUMS = [
  // 29/10/2026, 29-10-2026, 29.10.26 (met eventueel een tijd erachter)
  new RegExp(`^${DAG}(\\d{1,2})[/.-](\\d{1,2})[/.-](\\d{4}|\\d{2})${TIJD}$`, "i"),
  // 29 oktober 2026, do 29 okt., 29 okt '26
  new RegExp(`^${DAG}(\\d{1,2})\\s*([a-z]{3,9})\\.?,?(?:\\s+'?(\\d{4}|\\d{2}))?${TIJD}$`, "i"),
  // 2026-10-29
  new RegExp(`^()(\\d{4})-(\\d{2})-(\\d{2})${TIJD}$`, "i"),
];

// Tekst die niets over de avond zegt, of alleen de status.
const KNOP = /^(tickets?|kaarten|koop( je)? (tickets?|kaarten)|bestel(len)?|reserveer|reserveren|info|meer info|lees meer|bekijk|details?|boek nu|koop|buy tickets?|naar de site|>|»|→|uitverkocht|wachtlijst|geannuleerd|afgelast|verplaatst|laatste kaarten|bijna uitverkocht|extra voorstelling|try[ -]?out|premi[eè]re|reprise|derni[eè]re|nieuw|tickets via .*|via theater)$/i;
const ZAALWOORD = /theater|schouwburg|zaal|podium|cultu|huis\b|kerk|concert|cc\b|^cc |kulturhus|comedy|club|park|paviljoen|tent|kade|hal\b|doelen|kunst|stadsgehoorzaal|auditorium|centrum|de [A-Z]|het [A-Z]/i;

function tokens(htmlRuw) {
  // Een afgeknipt blok kan eindigen in een halve tag.
  const html = htmlRuw.replace(/<[^>]*$/, "");
  const schoon = html.replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|head)\b[\s\S]*?<\/\1>/gi, " ");
  const uit = [];
  // Een hele tag (ook <a ... href="..." target="_blank">) is een scheiding; alleen de href bewaren we.
  const re = /<a\b[^>]*?href=["']([^"']*)["'][^>]*>|<[^>]+>|([^<]+)/gi;
  let m;
  while ((m = re.exec(schoon))) {
    if (m[1] != null) { uit.push({ link: decodeEntities(m[1]) }); continue; }
    if (m[2] == null) continue;
    const t = decodeEntities(m[2]).replace(/\s+/g, " ").trim();
    if (t) uit.push({ t });
  }
  return uit;
}

const twee = (n) => String(n).padStart(2, "0");

function leesDatum(s, vandaag) {
  for (const [n, re] of DATUMS.entries()) {
    const m = s.match(re);
    if (!m) continue;
    // Groepen: dag, maand, jaar, uur, minuut (bij 2026-10-29: leeg, jaar, maand, dag, uur, minuut).
    const [d, mnd, j, u, mi] = n === 2 ? [m[4], m[3], m[2], m[5], m[6]] : [m[1], m[2], m[3], m[4], m[5]];
    const maand = /^\d+$/.test(mnd) ? Number(mnd) : MAANDEN[mnd.toLowerCase().slice(0, 3)];
    if (!maand || maand > 12 || Number(d) < 1 || Number(d) > 31) continue;
    let jaar = j ? Number(j.length === 2 ? `20${j}` : j) : Number(vandaag.slice(0, 4));
    let datum = `${jaar}-${twee(maand)}-${twee(d)}`;
    // Zonder jaartal: ligt de datum meer dan een maand achter ons, dan is het volgend jaar.
    if (!j && (new Date(vandaag) - new Date(datum)) / 864e5 > 31) datum = `${jaar + 1}-${twee(maand)}-${twee(d)}`;
    return { datum, tijd: u ? `${twee(u)}:${mi}` : null };
  }
  return null;
}

// Datums in een rij tekststukjes: [{ datum, tijd, van, tot }] (posities in de lijst met teksten).
function zoekDatums(teksten, vandaag) {
  const gevonden = [];
  for (let i = 0; i < teksten.length; i++) {
    for (let k = Math.min(5, teksten.length - i); k >= 1; k--) {
      const d = leesDatum(teksten.slice(i, i + k).join(" "), vandaag);
      if (d) { gevonden.push({ ...d, van: i, tot: i + k }); i += k - 1; break; }
    }
  }
  return gevonden;
}

const schoonHtml = (html) => html.replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/<(script|style|noscript|svg|template|head|nav|footer)\b[\s\S]*?<\/\1>/gi, " ");

// Het herhalende blok van een rij: een klasse (of <tr>/<li>) die ongeveer zo vaak voorkomt als er
// datums zijn, en waarbij zo veel mogelijk blokken precies één datum bevatten. Zo staat de plaats
// ook in de goede rij als die vóór de datum staat.
function rijBlokken(html, vandaag, aantal) {
  const tel = new Map();
  for (const m of html.matchAll(/<([a-z0-9]+)\b[^>]*?\bclass=["']([^"']+)["']/gi)) {
    const k = `${m[1].toLowerCase()}|${m[2].trim()}`;
    tel.set(k, (tel.get(k) || 0) + 1);
  }
  for (const t of ["tr", "li", "article"]) tel.set(`${t}|`, (html.match(new RegExp(`<${t}[\\s>]`, "gi")) || []).length);
  let beste = null;
  for (const [k, n] of tel) {
    if (n < aantal * 0.8 || n > aantal * 1.6) continue;
    const [tag, klasse] = k.split("|");
    const begin = klasse ? new RegExp(`<${tag}\\b[^>]*?\\bclass=["']${klasse.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`, "gi") : new RegExp(`<${tag}[\\s>]`, "gi");
    const delen = html.split(begin).slice(1);
    if (!delen.length) continue;
    const lengte = delen.slice(0, -1).reduce((a, d) => a + d.length, 0) / Math.max(1, delen.length - 1) || 3000;
    const blokken = delen.map((d, i) => (i === delen.length - 1 ? d.slice(0, lengte * 1.5) : d));
    const goed = blokken.filter((b) => zoekDatums(tokens(b).filter((x) => x.t).map((x) => x.t), vandaag).length === 1).length;
    // Bij gelijke stand het kleinste blok (de binnenste klasse).
    if (!beste || goed > beste.goed || (goed === beste.goed && lengte < beste.lengte)) beste = { goed, blokken, lengte };
  }
  return beste && beste.goed >= aantal * 0.7 ? beste.blokken : null;
}

/**
 * Rijen van een speellijst: { datum, tijd, cellen: [tekst], links: [url] }.
 * Een datum mag over een paar losse stukjes verdeeld zijn ("do" "29" "okt" "2026").
 */
export function speellijstRijen(htmlRuw, { vandaag }) {
  const html = schoonHtml(htmlRuw);
  const alleDatums = zoekDatums(tokens(html).filter((x) => x.t).map((x) => x.t), vandaag);
  const blokken = alleDatums.length >= 3 ? rijBlokken(html, vandaag, alleDatums.length) : null;
  if (blokken) {
    return blokken.flatMap((b) => {
      const tk = tokens(b), teksten = tk.filter((x) => x.t).map((x) => x.t);
      const d = zoekDatums(teksten, vandaag);
      if (d.length !== 1) return [];
      return [{ datum: d[0].datum, tijd: d[0].tijd, cellen: [...teksten.slice(0, d[0].van), ...teksten.slice(d[0].tot)], links: tk.filter((x) => x.link).map((x) => x.link) }];
    });
  }
  const tk = tokens(html);
  const teksten = tk.map((x, i) => [x, i]).filter(([x]) => x.t);
  const gevonden = zoekDatums(teksten.map(([x]) => x.t), vandaag);
  return gevonden.map((g, n) => {
    const eind = n + 1 < gevonden.length ? gevonden[n + 1].van : Math.min(teksten.length, g.tot + 12);
    const stukken = teksten.slice(g.tot, eind);
    const vanIdx = teksten[g.van][1], totIdx = eind < teksten.length ? teksten[eind][1] : tk.length;
    const links = tk.slice(vanIdx, totIdx).filter((x) => x.link).map((x) => x.link);
    return { datum: g.datum, tijd: g.tijd, cellen: stukken.map(([x]) => x.t), links };
  });
}

// Stukjes die niets zeggen over waar de avond is: knoppen, statussen, weekdagen, maandkoppen,
// labels ("Datum:", "Locatie") en losse leestekens.
const RUIS = [
  KNOP,
  /^(\(?laatste\)? ?kaart(en|jes)|kaartjes|laatste kans|binnenkort|sold out|read more.*|meer info.*|bestel.*|klik hier.*|boek via theater|koop|uit|verkocht|tickets?.*|kaarten.*|voorstellingsinformatie|nieuwe show|met voorprogramma)$/i,
  /^\*?\(?(try[ -]?out|tryout|premi[eè]re|reprise|derni[eè]re)\)?$/i,
  /^(ma|di|wo|do|vr|za|zo|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\.?$/i,
  /^(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)( 20\d\d)?$/i,
  /^(datum|tijd|locatie|plaats|zaal|theater|evenement|voorstelling|uur|kalender|googlecal|hele dag|\(gmt[^)]*\)|solo|matin[eé]e|\(matin[eé]e\)|tijd nog onbekend)[:]?$/i,
  /^[\s()|•·,–—>»→*-]*$/,
  /^\(.*\)$/,
  /^[a-z0-9.-]+\.(nl|be|com)$/i,
  /^€|^\d+([.,]\d+)?$/,
];
// "Van Vleuten en Van Muiswinkel" is "Van Vleuten & Van Muiswinkel".
const gelijk = (a, b) => [a, b].map((x) => x.toLowerCase().replace(/\s+(&|en|and)\s+/g, " ").replace(/[^a-z0-9àáâäèéêëìíîïòóôöùúûü]+/g, "")).reduce((x, y) => x === y);
const isRuis = (c) => RUIS.some((re) => re.test(c.trim()));
const LAND = (c) => /^(B|BE|België|🇧🇪)$|\((BE?|België|Belgie)\)|🇧🇪|^B - /i.test(c) ? "BE" : /^(NL|Nederland)$|\(NL\)/i.test(c) ? "NL" : null;

/**
 * Plaats, zaal, titel, tijd, status en soort uit een rij.
 * o.volgorde: welke betekenisvolle stukjes (na het weglaten van ruis) plaats, zaal en titel zijn,
 *             bijv. ["plaats", "zaal"]; "-" slaat een stukje over. o.vanAchter: tel vanaf het einde.
 * o.splits:   extra scheidingstekens binnen één stukje (standaard " - ", " — ", " / ", " | ", ", ").
 * o.ruis:     extra stukjes die weg moeten (RegExp).
 */
export function leesRij(rij, o = {}) {
  let tijd = rij.tijd, land = o.land || null;
  const tekst = rij.cellen.join(" | ");
  const status = /geannuleerd|afgelast|vervalt|gaat niet door|cancelled/i.test(tekst) ? "geannuleerd"
    : /verplaatst/i.test(tekst) ? "verplaatst"
      : /uitverkocht|wachtlijst|sold out|\buit\b.*\bverkocht\b/i.test(tekst) ? "uitverkocht" : "gepland";
  const soort = /try[ -]?out|tryout/i.test(tekst) ? "try-out" : /premi[eè]re/i.test(tekst) ? "première" : /derni[eè]re/i.test(tekst) ? "dernière" : /reprise/i.test(tekst) ? "reprise" : null;
  const splits = o.splits || /\s+[-–—/|]\s+|,\s+|\s+in\s+(?=[A-Z])/;
  const delen = [];
  for (const c of rij.cellen) {
    for (let d of c.split(splits)) {
      // Tijd tussen haakjes achter de zaal: "Schouwburg NTG (20u00)".
      const th = d.match(/\s*\((\d{1,2})[u:.](\d{2})\)\s*/i);
      if (th) { tijd ||= `${th[1].padStart(2, "0")}:${th[2]}`; d = d.replace(th[0], " "); }
      d = d.replace(/\s*\((try[ -]?out|tryout|premi[eè]re|reprise|uitverkocht)\)\s*/gi, " ").replace(/\s*\*+\s*$|\s*⇒\s*$|^in\s+|\s*\($|^\)\s*|\s+[-–—]$/g, "").replace(/\s+/g, " ").trim();
      const t = d.match(/^(?:aanvang\s*)?(\d{1,2})[:.](\d{2})\s*(uur)?$/i);
      if (t) { tijd ||= `${t[1].padStart(2, "0")}:${t[2]}`; continue; }
      const l = LAND(d);
      if (l) { land = l; d = d.replace(/\s*\((NL|BE?|België|Belgie)\)|🇧🇪|^B - /gi, "").trim(); if (/^(B|BE|NL|België|Nederland)?$/i.test(d)) continue; }
      if (!d || isRuis(d) || (o.ruis && o.ruis.test(d)) || (o.naam && gelijk(d, o.naam)) || /^over\s/i.test(d)) continue;
      delen.push(d);
    }
  }
  const velden = { plaats: null, zaal: null, titel: null };
  const reeks = o.vanAchter ? [...delen].reverse() : delen;
  (o.volgorde || ["plaats", "zaal"]).forEach((veld, i) => { if (veld !== "-" && reeks[i] && !velden[veld]) velden[veld] = reeks[i]; });
  // Staat de zaal op de plek van de plaats ("Comedy Club Haug" / "Rotterdam"), dan omdraaien.
  if (velden.plaats && velden.zaal && ZAALWOORD.test(velden.plaats) && !ZAALWOORD.test(velden.zaal)) [velden.plaats, velden.zaal] = [velden.zaal, velden.plaats];
  return { datum: rij.datum, tijd, ...velden, land, status, soort, link: rij.links.find((l) => /^https?:/.test(l)) || null, delen };
}
