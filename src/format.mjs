// Datums altijd als middag lokale tijd parsen, zodat tijdzones de dag niet verschuiven.
export const toDate = (iso) => new Date(iso + "T12:00:00");

const f = (opts) => new Intl.DateTimeFormat("nl-NL", opts);
const weekday = f({ weekday: "long" });
const weekdayShort = f({ weekday: "short" });
const monthShort = f({ month: "short" });
const monthYear = f({ month: "long", year: "numeric" });
const dayMonth = f({ day: "numeric", month: "long" });
const full = f({ day: "numeric", month: "long", year: "numeric" });
const long = f({ weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const fmt = {
  weekday: (iso) => weekday.format(toDate(iso)),
  weekdayShort: (iso) => weekdayShort.format(toDate(iso)).replace(".", ""),
  monthShort: (iso) => monthShort.format(toDate(iso)).replace(".", ""),
  monthYear: (iso) => monthYear.format(toDate(iso)),
  dayMonth: (iso) => dayMonth.format(toDate(iso)),
  full: (iso) => full.format(toDate(iso)),
  long: (iso) => long.format(toDate(iso)),
  day: (iso) => String(toDate(iso).getDate()),
  year: (iso) => toDate(iso).getFullYear(),
};

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// ISO-tijdstip met de offset van Amsterdam/Brussel op die dag, voor schema.org.
export function isoWithOffset(date, time) {
  if (!time) return date;
  const probe = new Date(`${date}T${time}:00Z`);
  const name = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Amsterdam", timeZoneName: "longOffset" })
    .formatToParts(probe).find((p) => p.type === "timeZoneName").value; // "GMT+01:00"
  return `${date}T${time}:00${name.replace("GMT", "") || "+00:00"}`;
}
