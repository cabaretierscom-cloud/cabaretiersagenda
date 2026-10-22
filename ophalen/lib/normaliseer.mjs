// Zet ruwe brongegevens om naar ons formaat: datum en tijd in Nederlandse tijd,
// artiest en titel gescheiden, genre herkend.

// "2026-11-03T20:15:00+01:00" of "2026-10-23 19:00" -> { datum, tijd } in Europe/Amsterdam.
export function lokaleDatumTijd(start) {
  if (!start) return null;
  const s = String(start).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return null;
  const hasZone = /([+-]\d{2}:?\d{2}|Z)$/.test(s);
  if (!hasZone || !m[2]) return { datum: m[1], tijd: m[2] ? `${m[2]}:${m[3]}` : null };
  const d = new Date(s.replace(" ", "T"));
  if (isNaN(d)) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d).map((p) => [p.type, p.value]));
  const tijd = `${parts.hour === "24" ? "00" : parts.hour}:${parts.minute}`;
  // Middernacht zonder echte tijd ("T00:00") betekent bij veel sites: tijd onbekend.
  return { datum: `${parts.year}-${parts.month}-${parts.day}`, tijd: tijd === "00:00" ? null : tijd };
}

// "Kasper van der Laan — Ruim" -> { artiest, titel }. Zonder scheidingsteken: alleen titel.
export function splitsNaam(naam, scheiders = [" — ", " – ", " - ", ": "]) {
  const s = String(naam || "").replace(/\s+/g, " ").trim();
  for (const sep of scheiders) {
    const i = s.indexOf(sep);
    if (i > 0) return { artiest: s.slice(0, i).trim(), titel: s.slice(i + sep.length).trim() };
  }
  return { artiest: null, titel: s };
}

// Hoofdletters netjes maken als een bron alles in KAPITALEN geeft.
export function netteHoofdletters(s) {
  if (!s || s !== s.toUpperCase() || !/[A-Z]/.test(s)) return s;
  const lower = s.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
export function netteNaam(s) {
  if (!s || s !== s.toUpperCase() || !/[A-Z]/.test(s)) return s;
  const klein = new Set(["van", "de", "der", "den", "het", "ten", "ter", "te", "en", "la", "le", "da", "di", "von"]);
  return s.toLowerCase().split(/(\s+|-)/).map((w, i) =>
    i > 0 && klein.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

// Herkent ons genre uit trefwoorden (genre-labels van de bron, titel, omschrijving).
// Geeft null als het geen cabaret of comedy is.
const REGELS = [
  ["oudejaarsconference", /oudejaars|eindejaars/],
  ["open-mic", /open[ -]?mic/],
  ["improvisatie", /\bimpro(visatie|v)?\b/],
  ["stand-up", /stand[ -]?up/],
  ["kleinkunst", /kleinkunst/],
  // "Cabaret & comedy" is cabaret; alleen "comedy" zonder cabaret is stand-up.
  ["cabaret", /cabaret|humor/],
  ["stand-up", /comedy/],
];
export function herkenGenre(...teksten) {
  const t = teksten.flat().filter(Boolean).join(" | ").toLowerCase();
  for (const [genre, re] of REGELS) if (re.test(t)) return genre;
  return null;
}

const SOORTEN = [["try-out", /try[ -]?out/], ["première", /premi[eè]re/], ["dernière", /derni[eè]re/], ["reprise", /\breprise\b/], ["extra voorstelling", /extra voorstelling/]];
export function herkenSoort(...teksten) {
  const t = teksten.filter(Boolean).join(" ").toLowerCase();
  for (const [soort, re] of SOORTEN) if (re.test(t)) return soort;
  return null;
}

export const slug = (s) =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " en ").replace(/[^a-z0-9]+/g, "-").slice(0, 80).replace(/^-+|-+$/g, "");

const STATUS = {
  EventCancelled: "geannuleerd", EventPostponed: "verplaatst", EventRescheduled: "verplaatst",
  EventScheduled: "gepland", EventMovedOnline: "gepland",
};
export const schemaStatus = (s) => STATUS[String(s || "").split("/").pop()] || "gepland";
