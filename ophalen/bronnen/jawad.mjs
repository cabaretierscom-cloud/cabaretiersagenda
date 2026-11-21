// Speellijst van Jawad Es Soufi (jawadessoufi.com, voorstelling Tnawies). De site is één pagina; de speellijst
// staat in het script als lijst { d: '2027-01-07', code: 'AMS', city: 'Amsterdam', status, time, url, ... }
// ("vluchten" met een luchthavencode). Een zaalnaam staat er meestal niet in: die volgt uit de kaartlink (het
// theater met die website in die plaats, zoals bij evaeikhout.mjs). Een verplaatste avond heeft
// `postponed: '23 jan'`: dan geldt die nieuwe datum (het eerste jaar na de oude datum), zonder tijd.
// Werkt als een speellijst (soort "speellijst").
import { readFileSync } from "node:fs";
import { getText } from "../lib/http.mjs";

const SITE = "https://jawadessoufi.com/";
const TITEL = "Tnawies";
const MAANDEN = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const zalen = JSON.parse(readFileSync(new URL("../../data/theaters.json", import.meta.url), "utf8"));
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const kaal = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

function zaalVoor(link, plaats) {
  const h = host(link);
  const hier = zalen.filter((t) => t.website && host(t.website) === h && kaal(t.plaats) === kaal(plaats));
  if (!hier.length) return null;
  const naam = kaal(h.split(".")[0]);
  // Een gewone zaal gaat voor een comedyclub met dezelfde website (Café Caat bij de Leidse Schouwburg).
  hier.sort((x, y) => (x.soort === "comedyclub") - (y.soort === "comedyclub"));
  return (hier.find((t) => kaal(t.naam).includes(naam)) || hier[0]).naam;
}

// "23 jan" na de oude datum: het eerste jaar waarin die dag na de oude datum valt.
function nieuweDatum(tekst, oud) {
  const [, dag, mnd] = String(tekst).toLowerCase().match(/(\d{1,2})\s+([a-z]{3})/) || [];
  const m = MAANDEN.indexOf(mnd);
  if (!dag || m < 0) return null;
  for (let j = +oud.slice(0, 4); j <= +oud.slice(0, 4) + 1; j++) {
    const iso = `${j}-${String(m + 1).padStart(2, "0")}-${dag.padStart(2, "0")}`;
    if (iso > oud) return iso;
  }
  return null;
}

export default {
  id: "jawad",
  naam: "Speellijst van Jawad Es Soufi",
  soort: "speellijst",
  theaters: [],

  async ophalen({ log, vandaag }) {
    const html = await getText(SITE);
    const out = [];
    for (const [rij] of html.matchAll(/\{\s*d:\s*'\d{4}-\d{2}-\d{2}'[^{}]*\}/g)) {
      const veld = (k) => rij.match(new RegExp(`\\b${k}:\\s*'([^']*)'`))?.[1] ?? null;
      let datum = veld("d"), tijd = veld("time");
      const verplaatst = veld("postponed");
      if (verplaatst) { datum = nieuweDatum(verplaatst, datum); tijd = null; }
      const plaats = veld("city"), link = veld("url") || "";
      if (!datum || datum < vandaag || !plaats) continue;
      out.push({
        theater: { zoeken: true, naam: veld("venue") || zaalVoor(link, plaats) || plaats, plaats, land: "NL" },
        artiesten: ["Jawad Es Soufi"],
        titel: TITEL,
        genre: "cabaret",
        datum,
        tijd: /^\d{2}:\d{2}$/.test(tijd || "") ? tijd : null,
        status: veld("status") === "sold_out" ? "uitverkocht" : /cancel/.test(veld("status") || "") ? "geannuleerd" : "gepland",
        soort: null,
        bron: /^https?:\/\//.test(link) ? link : SITE,
      });
    }
    log(`${out.length} voorstellingen vanaf vandaag`);
    return out;
  },
};
